/**
 * XIOS expression linter.
 *
 * Validates the {...} interpolation expressions used throughout XIOS view and
 * process documents (see ai/mcp/modes/xios/xios-prompt.md, "Data binding &
 * expressions"). Pure string transformation with no XIOS dependencies, so it
 * can be unit tested in isolation (cf. tests/ai/mdXML.test.js).
 *
 * Design — kept deliberately small, validated against ~72k production
 * expressions (the xios-expr corpus). The key realisation: inside {...} the body
 * is just XPath 1.0 + sigils ($alias, #view#comp, !) + extension functions, so
 * we do NOT parse the XPath, and literal text OUTSIDE {...} is never an
 * expression and is left untouched. That leaves exactly two things worth
 * checking:
 *
 *   1. STRUCTURAL (severity "error") — delimiters balanced: {} over the whole
 *      value, and () [] and quotes within each {...} body. Catches the genuine
 *      syntax errors, e.g. "{xios:getLabel(@category}", "{upcase(downcase({$x})}".
 *
 *   2. GUIDE (severity "warning") — constructs that run in the legacy engine
 *      but the authoring guide forbids: the "={...}" / "=expr" JS escape, JS
 *      ternary / regex literals, the JS operators "&&" / "||" / "==", and
 *      arithmetic without spaced XPath operators ("}+{"). Spaced XPath
 *      operators (or and = != < <= > >= + - * div mod) are allowed, except
 *      for arithmetic in a <rule> template, which is read as XPath. Reported as
 *      warnings because they are valid legacy syntax — the generator simply
 *      must not emit them.
 *
 *   3. FUNCTION (severity "error") — a called function ("name(") that is not on
 *      the XIOS function whitelist (FUNCTIONS below). Catches typo'd / made-up
 *      names ("fileExist" for "file-exists"). Node-type tests (node(), ...) are
 *      always allowed; a few XPath 1.0 functions (XPATH_FNS) only inside
 *      "[...]" predicates. Skipped when opts.skipFunctions is set — callers use
 *      this for <style> content, where calls are CSS functions, not XIOS ones.
 *      With opts.xpathFunctions the XPath 1.0 core functions are accepted
 *      anywhere — callers use this inside a legacy <rule> template.
 *
 *   4. OPERAND (severity "error") — in a body with spaced operators every
 *      operand must be a XIOS value: $alias, #view#comp, href#xpath, !, an
 *      expression function call, a URL, a literal, true()/false(), (...) or a
 *      nested {...}. An XPath function, a context path (@a, ., /x) or a bare
 *      word is an error at runtime too (SYS_ExprParser.isKnownAtom()). With
 *      opts.xpathFunctions a path is read against the row, so only the
 *      function calls are checked. Skipped with opts.skipFunctions.
 *
 * What it deliberately does NOT catch (needs runtime/type knowledge, not
 * syntax): unquoted arguments, a "$var" frozen inside a string literal, or an
 * alias that holds the wrong kind of value. Those are a separate layer.
 *
 * Exposes a single entry point:
 *   exprLint.lint(value, opts) -> [{ severity, rule, message }]   (empty == clean)
 */
var exprLint = function() {
  "use strict";

  // ── structural: delimiter balance ──────────────────────────────────────

  // {...} balance over the whole value. Returns an error message, or null.
  function braceBalance(value) {
    let depth = 0;
    for(const c of value) {
      if(c === "{") {
        depth++;
      } else if(c === "}" && --depth < 0) {
        return "unbalanced '}' (no matching '{')";
      }
    }
    return depth > 0 ? "unbalanced '{' (no matching '}')" : null;
  }

  const CLOSER = { "(": ")", "[": "]" };

  // Paren/bracket/quote balance for a single {...} body. Braces are handled
  // separately (they nest as interpolation), so they're ignored here. String
  // literals are skipped so their contents can't unbalance anything. Returns
  // an error message, or null.
  function delimError(body) {
    const stack = [];
    let quote = "";
    for(const c of body) {
      if(quote) {
        if(c === quote) {
          quote = "";
        }
        continue;
      }
      if(c === "'" || c === '"') {
        quote = c;
      } else if(CLOSER[c]) {
        stack.push(CLOSER[c]);
      } else if(c === ")" || c === "]") {
        if(stack.pop() !== c) {
          return `unbalanced '${c}'`;
        }
      }
    }
    if(quote) {
      return "unterminated string literal";
    }
    if(stack.length) {
      return `unbalanced '${stack[stack.length - 1] === ")" ? "(" : "["}'`;
    }
    return null;
  }

  // The top-level {...} bodies of a value — the only spans that are expressions.
  // Literal text between/around them is ignored.
  function braceBodies(value) {
    const bodies = [];
    let depth = 0, start = -1;
    for(let i = 0; i < value.length; i++) {
      if(value[i] === "{") {
        if(depth === 0) {
          start = i + 1;
        }
        depth++;
      } else if(value[i] === "}" && depth > 0 && --depth === 0) {
        bodies.push(value.slice(start, i));
      }
    }
    return bodies;
  }

  // ── guide bans: legacy-valid, but forbidden by the authoring guide ──────

  // Returns { rule, message } for the first banned construct found, or null.
  // Spaced XPath operators ("$a + 1", "$a div 2", "$n = 1 and $b") are
  // expressions. A <rule> template (xpath) is read as XPath afterwards, so
  // arithmetic stays forbidden there.
  function guideBan(body, xpath) {
    if(/^\s*=/.test(body)) {
      return { rule: "js-escape", message: "JS '=' / '={...}' escape is not allowed" };
    }
    if(/[?]/.test(body)) {
      return { rule: "ternary-or-regex", message: "JS ternary '?:' or regex literal is not allowed, use a decision operation" };
    }
    if(/&&|\|\|/.test(body)) {
      return { rule: "logical-op", message: "JS '&&' / '||' is not allowed, use 'and' / 'or'" };
    }
    if(/==/.test(body)) {
      return { rule: "js-equals", message: "JS '==' is not allowed, use '='" };
    }
    if(xpath && /\s[-+*]\s|\bdiv\b|\bmod\b/.test(body)) {
      return { rule: "arithmetic", message: "arithmetic is not allowed in a rule template" };
    }
    if(/\}[-+*]|[-+*]\{/.test(body)) {
      return { rule: "arithmetic", message: "write arithmetic with spaced XPath operators: {$a + 1}, {$a div 2}" };
    }
    return null;
  }

  // A "=" escape or a regex literal is JS, not XPath — don't balance-parse it.
  function isJs(rule) {
    return rule === "js-escape" || rule === "ternary-or-regex";
  }

  // ── function vocabulary: only whitelisted functions may be called ───────

  // XIOS expression functions callable inside a {...} body: the keys of
  // expMethods in system/script/SYS_Expression.js, which a unit test compares.
  const FUNCTIONS = new Set([
    "absolute-path", "escape-string", "escape-xml", "xml", "join", "inner-xml",
    "local-name", "name", "parent", "position", "trim", "uuid", "pad", "concat", "count",
    "count-selection", "emitter", "selection", "text-selection", "text", "string",
    "string-length", "read", "changes", "combine-path", "datatype", "decode-uri",
    "encode-uri", "encode-for-uri", "filename", "document", "datadoc", "channelname", "container",
    "folderpath", "foldername", "substring", "substring-after", "substring-before", "random", "translate", "replace",
    "match", "equal", "not", "upcase", "expression", "downcase", "capitalize", "format-date",
    "folderid", "file-exists", "folder-exists", "acl-rights", "parsedate", "localizedate",
    "formatdate", "comparedate", "dayspan", "changedate", "adddate", "inspect", "is-color",
    "is-alias", "is-open", "is-running", "is-text-type", "normalize", "get-label",
    "getlabel", "xios:getLabel", "apply-locale", "format-bytes", "filetype-icon", "browser", "os",
    "index-of", "contains", "clipboard-text", "selected-text", "url-param", "url-hash",
    "is-main-app", "replace-illegal", "validatedate", "format-digits", "xpath-escape",
    "xpath", "escape-text", "login-data", "file-ending-for-mime", "minus", "screen", "formatnumber"
  ]);

  // XPath node-type tests — grammar, always allowed.
  const NODE_TESTS = new Set(["node", "comment", "processing-instruction"]);

  // The boolean literals true() and false(), always allowed.
  const BOOLEANS = new Set(["true", "false"]);

  // XPath 1.0 functions XIOS allows, but only inside "[...]" predicates.
  const XPATH_FNS = new Set(["last", "starts-with", "number"]);

  // The XPath 1.0 core functions. In a legacy <rule> template XIOS passes a
  // call to a function it doesn't have through as text, and the component
  // evaluates the result as XPath against the row, so these are valid there
  // (opts.xpathFunctions). XIOS's own functions still run first: its not()
  // evaluates its argument itself.
  const XPATH1_FNS = new Set([
    "last", "position", "count", "id", "local-name", "namespace-uri", "name",
    "string", "concat", "starts-with", "contains", "substring-before",
    "substring-after", "substring", "string-length", "normalize-space",
    "translate", "boolean", "not", "true", "false", "lang", "number", "sum",
    "floor", "ceiling", "round"
  ]);

  // Non-whitelisted functions ("name(") called in a body; string literals and
  // component method calls (".name(") are skipped. XPATH_FNS count only while inside "[...]" predicates. Returns the
  // offending names.
  function unknownFunctions(body, xpathFunctions) {
    const bad = [];
    let quote = "", word = "", pred = 0;
    for(const c of body) {
      if(quote) {
        if(c === quote) {
          quote = "";
        }
        continue;
      }
      if(c === "'" || c === '"') {
        quote = c;
        word = "";
        continue;
      }
      // ":" keeps a prefixed name such as xios:getLabel whole; an axis
      // separator "::" starts a new name, as in child::node().
      if(/[\w:-]/.test(c)) {
        word = c === ":" && word.endsWith(":") ? "" : word + c;
        continue;
      }
      if(c === "(" && /^[A-Za-z]/.test(word) && !FUNCTIONS.has(word) &&
         !NODE_TESTS.has(word) && !BOOLEANS.has(word) && !(pred > 0 && XPATH_FNS.has(word)) &&
         !(xpathFunctions && XPATH1_FNS.has(word))) {
        bad.push(word);
      }
      // A name after "." is a component method ({#view#comp.getValue()}),
      // not an expression function: the "." prefix keeps it off the list check.
      word = c === "." ? "." : "";
      if(c === "[") {
        pred++;
      } else if(c === "]" && pred > 0) {
        pred--;
      }
    }
    return bad;
  }

  // ── operands: a body with operators takes XIOS values only ──────────────

  // The operators SYS_ExprParser reads when they stand between whitespace.
  const OPERATORS = new Set(["or", "and", "=", "!=", "eq", "ne", "<", "<=", ">", ">=",
    "lt", "le", "gt", "ge", "+", "-", "*", "div", "mod"]);

  // Splits a body at its top-level whitespace, outside quotes and brackets.
  function chunks(body) {
    const out = [];
    let depth = 0, quote = "", cur = "";
    for(const c of body) {
      if(quote) {
        quote = c === quote ? "" : quote;
      } else if(c === "'" || c === '"') {
        quote = c;
      } else if("([{".includes(c)) {
        depth++;
      } else if(")]}".includes(c)) {
        depth--;
      } else if(depth === 0 && /\s/.test(c)) {
        if(cur) {
          out.push(cur);
        }
        cur = "";
        continue;
      }
      cur += c;
    }
    if(cur) {
      out.push(cur);
    }
    return out;
  }

  // The operands of a body SYS_ExprParser reads as infix that XIOS can't
  // resolve, like SYS_ExprParser.isKnownAtom(). contextual: in a <rule>
  // template a path is read against the row. nested: the inside of ( ) in
  // such a body, which is read as infix too.
  function unknownOperands(body, contextual, nested) {
    const parts = chunks(body);
    if(!nested && (!parts.length || parts[0][0] === "=" ||
       !(parts.length > 1 && parts.some((p) => OPERATORS.has(p)) || /^(\(|-[$(])/.test(parts[0])))) {
      return [];
    }
    const bad = [];
    for(let part of parts) {
      if(OPERATORS.has(part)) {
        continue;
      }
      part = part.replace(/^-+/, "");
      if(part[0] === "(" && part.endsWith(")")) {
        bad.push(...unknownOperands(part.slice(1, -1), contextual, true));
        continue;
      }
      if(!part || /^('[^']*'|"[^"]*"|\d+(\.\d*)?|\.\d+|true\(\)|false\(\))$/.test(part) || /^[$!#{=]/.test(part)) {
        continue;
      }
      const name = /^[^#({$]*/.exec(part)[0];
      const next = part[name.length];
      if(next === "#" || (next === "(" && FUNCTIONS.has(name)) ||
         (next !== "(" && (/^[A-Za-z][\w+.-]*:\/\//.test(name) || contextual))) {
        continue;
      }
      bad.push(part);
    }
    return bad;
  }

  // ── public entry point ──────────────────────────────────────────────────

  /**
   * Lint one expression-bearing value: an attribute value or element text.
   *
   * @param {String} value
   *   The raw value to check. Plain literal text is always fine — only {...}
   *   spans, and a leading "=", are treated as expressions.
   * @param {Object} [opts]
   *   opts.skipFunctions — suppress the unknown-function rule (for <style>
   *   content, where calls are CSS functions).
   *   opts.xpathFunctions — also accept the XPath 1.0 core functions (for a
   *   legacy <rule> template, where XPath evaluates what XIOS passes on).
   * @return {Array<{severity:String, rule:String, message:String}>}
   *   The issues found. severity is "error" (structural: the expression is
   *   malformed) or "warning" (guide: valid in the legacy engine, but the
   *   authoring guide forbids it). An empty array means the value is clean.
   */
  function lint(value, opts) {
    const issues = [];
    const v = (value == null ? "" : String(value)).trim();

    // A leading "=" is the legacy JS escape; the whole value is JS, not an
    // XPath expression, so flag it and skip structural parsing.
    if(/^\s*=/.test(v)) {
      issues.push({ severity: "warning", rule: "js-escape", message: "JS '=' / '={...}' escape is not allowed" });
      return issues;
    }

    const imbalance = braceBalance(v);
    if(imbalance) {
      issues.push({ severity: "error", rule: "unbalanced", message: imbalance });
    }

    for(const body of braceBodies(v)) {
      const ban = guideBan(body, opts && opts.xpathFunctions);
      if(ban) {
        issues.push({ severity: "warning", rule: ban.rule, message: ban.message });
        if(isJs(ban.rule)) {
          continue;
        }
      }
      const badFns = [];
      if(!(opts && opts.skipFunctions)) {
        badFns.push(...unknownFunctions(body, opts && opts.xpathFunctions));
        for(const fn of badFns) {
          issues.push({ severity: "error", rule: "unknown-function", message: `unknown function '${fn}()' — not on the whitelist` });
        }
        for(const operand of unknownOperands(body, opts && opts.xpathFunctions)) {
          if(!badFns.includes(/^[^(]*/.exec(operand)[0])) {
            issues.push({ severity: "error", rule: "unknown-operand", message: `unknown operand "${operand}" in {${body}}: XPath functions and context paths go outside the braces` });
          }
        }
      }
      const delim = delimError(body);
      if(delim) {
        issues.push({ severity: "error", rule: "unbalanced", message: `${delim} in {${body}}` });
      }
    }

    return issues;
  }

  return {
    lint: lint,
    functions: FUNCTIONS
  };
}();

export{ exprLint };
