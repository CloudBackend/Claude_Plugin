/**
 * Host-agnostic core of xios_validate.
 *
 * Contains no `sys.*`, `xml.*`, `fetch` or global-DOM references: every I/O
 * boundary goes through the `host` handed to createValidator() — host-xios.js
 * inside the runtime, host-node.js under `npm run validate`. Likewise the docs
 * index, which is XIOS-only, arrives as an injected `docsLoader` so the Node
 * build never pulls in _lib.js.
 *
 * DOM traversal here goes through toArray() rather than for...of: DOM
 * collections are array-likes without Symbol.iterator under @xmldom/xmldom.
 */

import { compile } from "./x-xsd.js";
import { augmentSchema, hasCustom, cacheKey } from "./open-content.js";
import { exprLint } from "./exprLint.js";
import { humanise } from "./humanise.js";

// Imported/included schemas, fetched up front so resolveImport can resolve
// synchronously. xml.xsd is intentionally absent: its namespace is left
// unvalidated.
const importFiles = [ "view.xsd", "process.xsd", "lang.xsd", "xlink.xsd" ];

// schemaLocations written as a URL rather than a local filename.
const importAliases = {
  "http://www.w3.org/1999/xlink.xsd": "xlink.xsd"
};

const SCHEMA_FILES = {
  "application": "application.xsd",
  "view": "view.xsd",
  "process": "process.xsd"
};

// DOM node type constants, declared separately for readability.
const ELEMENT_NODE = 1;
const TEXT_NODE = 3;

/**
 * Copies a DOM collection into a real array so it can be iterated.
 *
 * @param {Object} collection
 *  NodeList, HTMLCollection or NamedNodeMap.
 * @returns {Array}
 */
function toArray(collection) {
  const out = [];
  if( !collection ) {
    return out;
  }
  for( let i = 0; i < collection.length; i++ ) {
    out.push(collection[i]);
  }
  return out;
}

function baseName(p) {
  return String(p).split(/[\\/]/).pop();
}

// "/application[1]/view[1]/label[2]/@align" -> ["application", "view", "label"]
function xpathSegments(xpath) {
  return (xpath || "").split("/").filter(Boolean)
    .filter((s) => {
      return !s.startsWith("@");
    })
    .map((s) => {
      return s.replace(/\[\d+\]$/, "").toLowerCase();
    });
}

function pickIndex(xpath, indices) {
  const segs = xpathSegments(xpath);
  if( segs.includes("process") ) {
    return indices.operationIndex || {};
  }

  if( segs.includes("view") ) {
    return indices.componentIndex || {};
  }

  // Silent failure since we'll just return the base error message instead
  return {};
}

export function docCandidates(error, indices) {
  const segs = xpathSegments(error.xpath);
  const index = pickIndex(error.xpath, indices);
  const names = [];

  for( const m of (error.message || "").matchAll(/'([A-Za-z][\w-]*)'/g) ) {
    names.push(m[1].toLowerCase());
  }

  const tail = segs[segs.length - 1];
  const parent = segs[segs.length - 2];
  // If for example "view label" exists then immediately grab that
  if( parent && tail && index[parent + " " + tail] ) {
    names.push(parent + " " + tail);
  } else if( tail ) {
    names.push(tail);
    // Also add the parent documentation for cases like "grid item" or "list item"
    if( parent && (!index[tail] || tail === "item") ) {
      names.push(parent);
    }
  }

  return [...new Set(names)].filter( (n) => {
    return index[n];
  });
}

/**
 * Attaches the relevant documentation sections to a failed validation result.
 *
 * The valid/no-errors check comes before the loader is awaited: a valid
 * document must not pay for loading the docs corpus, which matters because
 * PO_validateApp validates every file of an application concurrently.
 *
 * @param {Object} res
 *  Validation result to annotate in place.
 * @param {Function} loader
 *  Returns the documentation indices.
 * @returns {Promise<void>}
 */
export async function attachComponentDocs(res, loader) {
  if( res.valid || !res.errors || !loader ) {
    return;
  }

  let indices;
  try {
    indices = await loader();
  } catch(e) {
    // eslint-disable-next-line require-atomic-updates -- `res` is the caller's own result object for this one validation; nothing else holds a reference while the loader is in flight.
    res.docsError = e.message;
    return;
  }

  const docs = {};
  for( const error of res.errors ) {
    const names = docCandidates(error, indices);
    if( !names.length ) {
      continue;
    }
    error.docs = names;
    const index = pickIndex(error.xpath, indices);
    for( const n of names ) {
      docs[n] = index[n];
    }
  }
  if( Object.keys(docs).length ) {
    res.docs = docs;
  }
}

function result(valid, errors) {
  return { valid, errors };
}

function fail(message, xpath = "/") {
  return result(false, [{ message, xpath, source: "schema" }]);
}

// Collects attr off each <element> child of every <container> in the doc, so
// the validator can accept those author-declared names as legal open content.
function declaredNames(doc, container, element, attr) {
  const names = [];
  for( const list of toArray(doc.getElementsByTagName(container)) ) {
    for( const child of toArray(list.childNodes) ) {
      if( child.nodeType !== ELEMENT_NODE || child.localName !== element ) {
        continue;
      }
      const value = child.getAttribute(attr);
      if( value ) {
        names.push(value);
      }
    }
  }
  return names;
}

// Custom component tags declared in <components><component tag="..."/>.
function declaredComponents(doc) {
  return declaredNames(doc, "components", "component", "tag");
}

// Custom operation names declared in <operations><operation name="..."/>.
function declaredOperations(doc) {
  return declaredNames(doc, "operations", "operation", "name");
}

// Components whose <rule> children are their own templates, not XML_RuleHandler rules.
const NEW_RULE_ENGINES = new Set(["list", "tree"]);

function lintExpressions(root) {
  if( !root || typeof exprLint === "undefined" ) {
    return [];
  }

  const issues = [];

  // inStyle: inside a <style> subtree function calls are CSS, not XIOS —
  // the unknown-function rule is suppressed there.
  // inRule: inside a legacy <rule> template XIOS passes calls to functions
  // it doesn't have on to XPath, so the XPath 1.0 core functions are valid.
  // <list> and <tree> rules are templates of their own engine instead.
  function walk(node, xpath, inStyle, inRule) {
    const opts = inStyle ? { skipFunctions: true } : inRule ? { xpathFunctions: true } : undefined;
    for( const attr of toArray(node.attributes) ) {
      for( const issue of exprLint.lint(attr.value, opts) ) {
        issues.push({ severity: issue.severity, rule: issue.rule, message: issue.message, xpath: xpath + "/@" + attr.name });
      }
    }
    const childCounts = {};
    for( const child of toArray(node.childNodes) ) {
      if( child.nodeType === TEXT_NODE ) {
        if( child.nodeValue && child.nodeValue.trim() ) {
          for( const issue of exprLint.lint(child.nodeValue, opts) ) {
            issues.push({ severity: issue.severity, rule: issue.rule, message: issue.message, xpath: xpath + "/text()" });
          }
        }
      } else if( child.nodeType === ELEMENT_NODE ) {
        const name = child.localName;
        childCounts[name] = (childCounts[name] || 0) + 1;
        walk(child, xpath + "/" + name + "[" + childCounts[name] + "]", inStyle || name === "style",
          inRule || (name === "rule" && !NEW_RULE_ENGINES.has(node.localName)));
      }
    }
  }

  walk(root, "/" + root.localName, root.localName === "style");

  return issues;
}

// Add expression warnings to the result.
function withExpr(res, exprIssues) {
  const errs = exprIssues.filter((issue) => {
    return issue.severity === "error";
  }).map((issue) => {
    return { message: issue.message, xpath: issue.xpath, source: "expression" };
  });

  const warns = exprIssues.filter((issue) => {
    return issue.severity === "warning";
  }).map((issue) => {
    return { message: issue.message, xpath: issue.xpath, rule: issue.rule, source: "expression" };
  });

  if( errs.length ) {
    res.errors = (res.errors || []).concat(errs);
    res.valid = false;
  }

  if( warns.length ) {
    res.warnings = warns;
  }

  return res;
}

/**
 * Builds a validator bound to one host.
 *
 * @param {Object} host
 *  Host bindings: join, schemaDir, readFile, parseXml, loadHref.
 * @param {Function} [docsLoader]
 *  Returns the documentation indices used to annotate errors. Omitted outside
 *  the runtime, where the docs corpus is not available.
 * @returns {{execute: Function, attachXmlValidation: Function}}
 */
export function createValidator(host, docsLoader = null) {
  const schemaDir = host.schemaDir();

  const schemas = {};
  for( const rootName in SCHEMA_FILES ) {
    schemas[rootName] = { path: host.join(schemaDir, SCHEMA_FILES[rootName]) };
  }

  const importCache = new Map();

  // Per-(root, declaration-set) cache of compiled augmented schemas, so the
  // edit->re-validate loop on one app recompiles at most once per declaration set.
  const augmentedCache = new Map();

  // resolveImport that serves imported schema text from importCache, augmenting
  // view.xsd / process.xsd with the document's declared customs (no-op when none).
  function makeResolveImport(decls) {
    return (_ns, schemaLocation) => {
      const file = importAliases[schemaLocation] || schemaLocation;
      return augmentSchema(file, importCache.get(file) || null, decls);
    };
  }

  async function loadImports() {
    await Promise.all(importFiles.map(async (file) => {
      try {
        importCache.set(file, await host.readFile(host.join(schemaDir, file)));
      } catch(e) {
        console.error(`[xios_validate] failed to load imported schema ${file}:`, e.message);
      }
    }));
  }

  async function compileSchema(schema) {
    try {
      // eslint-disable-next-line require-atomic-updates -- compileSchema runs once per schema behind the ensureSchemas() memo, so no other task holds this object.
      schema.text = await host.readFile(schema.path);   // retained for on-demand augmentation
      schema.file = baseName(schema.path);
      schema.schema = compile(schema.text, { resolveImport: makeResolveImport({}) });
    } catch(e) {
      console.error(`[xios_validate] schema compile failed for ${schema.path}:`, e.message);
    }
  }

  // Loading is deferred until the first validation (module scope must stay free
  // of host calls so this file can be imported anywhere), and the promise is
  // assigned before the first await so that concurrent callers — PO_validateApp
  // fans out over every file of an application — share one load.
  let schemasPromise = null;
  function ensureSchemas() {
    if( !schemasPromise ) {
      schemasPromise = (async () => {
        await loadImports();
        await Promise.all(Object.keys(schemas).map((rootName) => {
          return compileSchema(schemas[rootName]);
        }));
      })();
    }
    return schemasPromise;
  }

  async function runValidation(doc) {
    // Expression linting is just string parsing so we don't care if the document adheres to schema
    const expr = lintExpressions(doc.documentElement);

    const rootName = doc.documentElement && doc.documentElement.localName;
    const entry = rootName && schemas[rootName];
    if( !entry ) {
      const res = result(true, []);
      res.unsupported = "Root element <" + (rootName || "") + "> is not a valid XIOS" +
        " document type (expected one of: " + Object.keys(schemas).join(", ") + ");" +
        " schema validation was skipped.";
      return withExpr(res, expr);
    }

    await ensureSchemas();

    if( !entry.schema ) {
      // Marked so callers can tell a broken install from an invalid document;
      // both stay ordinary results, since the runtime reports per-file outcomes
      // and an exception here would collapse a whole application's report.
      const res = withExpr(fail("Schema for <" + rootName + "> failed to compile."), expr);
      res.infrastructure = true;
      return res;
    }

    // Author-declared custom components / operations → augment the schema on demand
    // (cached by root + declaration set); otherwise use the base precompiled schema.
    const decls = { components: declaredComponents(doc), operations: declaredOperations(doc) };
    let activeSchema = entry.schema;
    if( hasCustom(decls) ) {
      const key = cacheKey(rootName, decls);
      activeSchema = augmentedCache.get(key);
      if( !activeSchema ) {
        try {
          activeSchema = compile(
            augmentSchema(entry.file, entry.text, decls),
            { resolveImport: makeResolveImport(decls) }
          );
          augmentedCache.set(key, activeSchema);
        } catch(e) {
          return withExpr(fail("Augmented schema compile failed: " + e.message), expr);
        }
      }
    }

    // The parsed document is handed straight to x-xsd, which accepts a Document
    // and would otherwise re-parse the source a second time.
    const { valid, errors } = activeSchema.validate(doc);
    const res = result(valid, errors.map((e) => {
      return { message: humanise(e, activeSchema.ir), xpath: e.xpath, source: "schema" };
    }));
    return withExpr(res, expr);
  }

  /**
   * Runs validation against a parsed document, raw content, or an href.
   *
   * @param {Object} args
   *  Tool arguments.
   * @param {Document} [args.doc]
   *  An already-parsed document. Preferred by in-runtime callers that hold one:
   *  it skips a serialise/parse round trip.
   * @param {String} [args.content]
   *  XML string to validate.
   * @param {String} [args.href]
   *  Href to the content, resolved by the host.
   * @param {Object} [opts]
   *  Options.
   * @param {Boolean} [opts.docs=true]
   *  Attach the matching documentation sections to each error. Pass false from
   *  callers that discard them.
   *
   * @returns {Promise<Object>} the validation result.
   */
  async function execute(args, opts = {}) {
    let doc = args.doc;

    if( !doc ) {
      let xmlContent = args.content;
      if( args.href ) {
        try {
          xmlContent = await host.loadHref(args.href);
        } catch(e) {
          return fail(e.message);
        }
      }

      if( !xmlContent ) {
        return fail("Either `href` or `content` must be provided.");
      }

      try {
        doc = host.parseXml(xmlContent);
      } catch(e) {
        return fail("XML parse error: " + (e && e.message ? e.message : String(e)));
      }
    }

    const res = await runValidation(doc);
    if( opts.docs !== false ) {
      await attachComponentDocs(res, docsLoader);
    }
    return res;
  }

  /**
   * Validates `content` and records the outcome on `result` in the shape shared
   * by the document tools (save_documents, edit_xml_document): sets the boolean
   * `valid`, and on failure attaches `errors` and, when present, `docs`.
   *
   * @param {String} content
   *  XML source to validate.
   * @param {Object} target
   *  Result object to annotate in place.
   * @returns {Promise<Object>} the same `target`, for convenience.
   */
  async function attachXmlValidation(content, target) {
    const validation = await execute({ content });
    target.valid = validation.valid;
    if( !validation.valid ) {
      target.errors = validation.errors;
      if( validation.docs ) {
        target.docs = validation.docs;
      }
    }
    return target;
  }

  return { execute, attachXmlValidation };
}
