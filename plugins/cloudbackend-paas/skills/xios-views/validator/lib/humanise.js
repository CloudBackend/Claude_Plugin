/**
 * Rewrites x-xsd schema validation error messages into plain language,
 * enriched with allowed element/attribute names and "did you mean" hints
 * resolved from the compiled schema IR (`compile(...).ir`).
 *
 * Element and attribute names are kept in single quotes so that
 * docCandidates() in validate.js can still extract them for docs
 * attachment; literal values use double quotes to stay out of its way.
 */

const XSD_NS = "http://www.w3.org/2001/XMLSchema";

const NS_PREFIXES = {
  "http://www.w3.org/1999/xlink": "xlink"
};

// Caps on inline name lists so a large container doesn't flood the message.
const LIST_CAP = 10;
const ATTR_LIST_CAP = 6;

const MAX_TYPE_DEPTH = 10;

// Plain-language descriptions of the XSD builtin types.
const BUILTIN_PHRASES = {
  boolean: "true or false",
  int: "a whole number",
  integer: "a whole number",
  long: "a whole number",
  short: "a whole number",
  byte: "a whole number",
  unsignedInt: "a whole number (0 or more)",
  unsignedLong: "a whole number (0 or more)",
  unsignedShort: "a whole number (0 or more)",
  unsignedByte: "a whole number (0 or more)",
  nonNegativeInteger: "a whole number (0 or more)",
  positiveInteger: "a whole number (1 or more)",
  nonPositiveInteger: "a whole number (0 or less)",
  negativeInteger: "a negative whole number",
  decimal: "a number",
  float: "a number",
  double: "a number",
  anyURI: "a URL or path",
  string: "text",
  normalizedString: "text",
  token: "text",
  NCName: "a name without spaces or colons",
  Name: "a name without spaces",
  NMTOKEN: "a single token without spaces",
  ID: "a document-wide unique id",
  IDREF: "the id of another element",
  dateTime: "a date and time such as \"2026-01-31T12:00:00\"",
  date: "a date such as \"2026-01-31\"",
  time: "a time such as \"12:00:00\""
};

/* ------------------------------------------------------------------ *
 *  Formatting helpers
 * ------------------------------------------------------------------ */

// Element/attribute names in single quotes (docCandidates picks these up).
function name(text) {
  return "'" + text + "'";
}

// Literal values in double quotes (invisible to docCandidates).
function value(text) {
  return "\"" + text + "\"";
}

function capitalize(text) {
  return text[0].toUpperCase() + text.slice(1);
}

function plural(n, word) {
  return Number(n) === 1 ? word : word + "s";
}

function nameList(names, cap = LIST_CAP) {
  const shown = names.slice(0, cap);
  const more = names.length - shown.length;
  return shown.join(", ") + (more > 0 ? ", ... (" + more + " more)" : "");
}

/* ------------------------------------------------------------------ *
 *  Error xpath parsing
 * ------------------------------------------------------------------ */

// "/application[1]/view[1]/label[2]/@align" -> { elements: [...], attr: "align" }
function parseXpath(xpath) {
  const elements = [];
  let attr = null;
  for( const seg of String(xpath || "").split("/") ) {
    if( !seg || seg === "text()" ) {
      continue;
    }
    if( seg.startsWith("@") ) {
      attr = seg.slice(1);
      continue;
    }
    elements.push(seg.replace(/\[\d+\]$/, "").replace(/^[^:]+:/, ""));
  }
  return { elements, attr };
}

/* ------------------------------------------------------------------ *
 *  Schema IR lookups
 * ------------------------------------------------------------------ */

function typeByQName(ir, qname) {
  if( !qname || qname.ns === XSD_NS ) {
    return null;
  }
  if( qname.ns && ir.nsTypes ) {
    const type = ir.nsTypes.get("{" + qname.ns + "}" + qname.local);
    if( type ) {
      return type;
    }
  }
  return ir.types.get(qname.local) || null;
}

function globalElement(ir, elementName, ns) {
  if( ns && ir.nsElements ) {
    const decl = ir.nsElements.get("{" + ns + "}" + elementName);
    if( decl ) {
      return decl;
    }
  }
  return ir.elements.get(elementName) || null;
}

function elementType(ir, decl, depth = 0) {
  if( !decl || depth > MAX_TYPE_DEPTH ) {
    return null;
  }
  if( decl.ref ) {
    return elementType(ir, globalElement(ir, decl.ref, decl.refNs), depth + 1);
  }
  if( decl.inlineType ) {
    return decl.inlineType;
  }
  return typeByQName(ir, decl.type);
}

// Visits every element particle reachable in a content model node.
function walkContent(ir, node, visit, seenGroups) {
  if( !node ) {
    return;
  }
  if( node.kind === "element" ) {
    visit(node);
    return;
  }
  if( node.kind === "groupRef" ) {
    if( seenGroups.has(node.ref) ) {
      return;
    }
    seenGroups.add(node.ref);
    const group = ir.groups.get(node.ref);
    walkContent(ir, group && group.content, visit, seenGroups);
    return;
  }
  for( const particle of node.particles || [] ) {
    walkContent(ir, particle, visit, seenGroups);
  }
}

// The content models a type contributes directly (own content + derivation content).
function contentRoots(typeDef) {
  const roots = [];
  if( typeDef.content ) {
    roots.push(typeDef.content);
  }
  if( typeDef.derivation && typeDef.derivation.content ) {
    roots.push(typeDef.derivation.content);
  }
  return roots;
}

function declName(decl) {
  return decl.name || decl.ref || null;
}

// Every child element declaration a type accepts, including extension bases.
function childDecls(ir, typeDef, seenTypes = new Set()) {
  const decls = [];
  if( !typeDef || seenTypes.has(typeDef) ) {
    return decls;
  }
  seenTypes.add(typeDef);

  for( const root of contentRoots(typeDef) ) {
    walkContent(ir, root, (decl) => {
      decls.push(decl);
    }, new Set());
  }

  const derivation = typeDef.derivation;
  if( derivation && derivation.type === "extension" ) {
    decls.push(...childDecls(ir, typeByQName(ir, derivation.base), seenTypes));
  }
  return decls;
}

function childNames(ir, typeDef) {
  return [...new Set(childDecls(ir, typeDef).map(declName).filter(Boolean))];
}

function findChildDecl(ir, typeDef, childName) {
  return childDecls(ir, typeDef).find((decl) => {
    return declName(decl) === childName;
  }) || null;
}

// Walks the xpath's element names through the IR to the type of the last one.
function resolveType(ir, segments) {
  if( !segments.length ) {
    return null;
  }
  let type = elementType(ir, globalElement(ir, segments[0]));
  for( let i = 1; i < segments.length && type; i++ ) {
    type = elementType(ir, findChildDecl(ir, type, segments[i]));
  }
  return type;
}

// Required (minOccurs > 0) child names of a type; a required choice becomes "one of a/b".
function requiredChildNames(ir, typeDef) {
  const required = [];

  function visit(node, seenGroups) {
    if( !node || node.minOccurs === 0 ) {
      return;
    }
    if( node.kind === "element" ) {
      if( declName(node) ) {
        required.push(declName(node));
      }
    } else if( node.kind === "groupRef" ) {
      if( seenGroups.has(node.ref) ) {
        return;
      }
      seenGroups.add(node.ref);
      const group = ir.groups.get(node.ref);
      if( group ) {
        visit(group.content, seenGroups);
      }
    } else if( node.kind === "choice" ) {
      const options = [];
      walkContent(ir, node, (decl) => {
        if( declName(decl) ) {
          options.push(declName(decl));
        }
      }, new Set());
      if( options.length ) {
        required.push("one of " + [...new Set(options)].slice(0, 5).join("/"));
      }
    } else {
      for( const particle of node.particles || [] ) {
        visit(particle, seenGroups);
      }
    }
  }

  for( const root of contentRoots(typeDef) ) {
    visit(root, new Set());
  }
  return [...new Set(required)];
}

function attrDisplayName(decl) {
  if( decl.name ) {
    return decl.name;
  }
  const prefix = NS_PREFIXES[decl.refNs];
  return prefix ? prefix + ":" + decl.ref : decl.ref;
}

function collectAttrs(ir, attrs, names, seenGroups) {
  for( const decl of attrs || [] ) {
    if( decl.kind === "attribute" && decl.use !== "prohibited" ) {
      names.push(attrDisplayName(decl));
    } else if( decl.kind === "attributeGroupRef" && !seenGroups.has(decl.ref) ) {
      seenGroups.add(decl.ref);
      const group = ir.attributeGroups.get(decl.ref);
      if( group ) {
        collectAttrs(ir, group.attributes, names, seenGroups);
      }
    } else if( decl.kind === "attributeGroup" ) {
      collectAttrs(ir, decl.attributes, names, seenGroups);
    }
  }
}

// Every attribute name a type accepts, including extension bases.
function attributeNames(ir, typeDef, seenTypes = new Set()) {
  const names = [];
  if( !typeDef || seenTypes.has(typeDef) ) {
    return names;
  }
  seenTypes.add(typeDef);

  const seenGroups = new Set();
  collectAttrs(ir, typeDef.attributes, names, seenGroups);

  const derivation = typeDef.derivation;
  if( derivation ) {
    collectAttrs(ir, derivation.attributes, names, seenGroups);
    if( derivation.type === "extension" || derivation.type === "simpleContent-extension" ) {
      names.push(...attributeNames(ir, typeByQName(ir, derivation.base), seenTypes));
    }
  }
  return [...new Set(names)];
}

// Plain-language description of a simple type named in a message:
// { oneOf: [...] } for enumerations, { phrase } for known builtins, else null.
function typeInfo(ir, typeName) {
  let current = ir.types.get(typeName);

  for( let depth = 0; current && depth < MAX_TYPE_DEPTH; depth++ ) {
    const enums = (current.facets || []).filter((facet) => {
      return facet.kind === "enumeration";
    }).map((facet) => {
      return facet.value;
    });
    if( enums.length ) {
      return { oneOf: enums };
    }
    if( current.variety !== "restriction" ) {
      break;
    }
    if( current.inlineBase ) {
      current = current.inlineBase;
    } else if( current.base && current.base.ns === XSD_NS ) {
      return phraseFor(current.base.local);
    } else {
      current = current.base ? typeByQName(ir, current.base) : null;
    }
  }
  return phraseFor(typeName);
}

function phraseFor(typeName) {
  const phrase = BUILTIN_PHRASES[typeName];
  return phrase ? { phrase } : null;
}

/* ------------------------------------------------------------------ *
 *  "Did you mean" suggestions
 * ------------------------------------------------------------------ */

function editDistance(a, b, max) {
  if( Math.abs(a.length - b.length) > max ) {
    return max + 1;
  }
  let prev = Array.from({ length: b.length + 1 }, (unused, i) => {
    return i;
  });
  for( let i = 1; i <= a.length; i++ ) {
    const row = [ i ];
    for( let j = 1; j <= b.length; j++ ) {
      const substitution = prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1);
      row[j] = Math.min(prev[j] + 1, row[j - 1] + 1, substitution);
    }
    prev = row;
  }
  return prev.at(-1);
}

function didYouMean(misspelled, candidates) {
  const target = String(misspelled).toLowerCase();
  if( target.length < 3 ) {
    return null;
  }

  let best = null;
  let bestDistance = 3;
  for( const candidate of candidates || [] ) {
    const distance = editDistance(target, String(candidate).toLowerCase(), 2);
    if( distance < bestDistance ) {
      best = candidate;
      bestDistance = distance;
    }
  }

  // Distance 0 means the name exists — the problem is something other than a typo.
  return bestDistance > 0 && bestDistance <= 2 ? best : null;
}

function suggestion(misspelled, candidates) {
  const match = didYouMean(misspelled, candidates);
  return match ? " Did you mean " + name(match) + "?" : "";
}

/* ------------------------------------------------------------------ *
 *  Message building blocks
 * ------------------------------------------------------------------ */

function allowedChildrenSentence(ctx) {
  const allowed = ctx.childNames();
  if( !allowed.length ) {
    return "";
  }
  return " Allowed children of " + name(ctx.owner) + ": " + nameList(allowed) + ".";
}

function allowedAttributesSentence(ctx) {
  const type = ctx.ownerType();
  const allowed = type ? attributeNames(ctx.ir, type) : [];
  return allowed.length ? " Allowed attributes: " + nameList(allowed, ATTR_LIST_CAP) + "." : "";
}

// A child element that is not accepted at this position inside ctx.owner.
function badChild(child, ctx) {
  if( !ctx.owner ) {
    return null;
  }
  const allowed = ctx.childNames();
  if( allowed.includes(child) ) {
    return name(child) + " is allowed in " + name(ctx.owner) +
      ", but not at this position or this many times." + allowedChildrenSentence(ctx);
  }
  return name(child) + " is not a valid child of " + name(ctx.owner) + "." +
    suggestion(child, allowed) + allowedChildrenSentence(ctx);
}

// Subject for value errors: attribute errors always carry /@name in the
// xpath, so without an attr segment the value is the element's content.
function valueSubject(ctx) {
  if( ctx.attr ) {
    return "attribute " + name(ctx.attr);
  }
  return ctx.owner ? "the content of " + name(ctx.owner) : "the value";
}

// "<subject> must be one of: a, b, c — got "x"." for a given simple type name.
function typedValueSentence(subject, got, typeName, ctx) {
  const info = typeInfo(ctx.ir, typeName);
  if( info && info.oneOf ) {
    return capitalize(subject) + " must be one of: " + nameList(info.oneOf) +
      " — got " + value(got) + "." + suggestion(got, info.oneOf);
  }
  if( info && info.phrase ) {
    return capitalize(subject) + " must be " + info.phrase + " — got " + value(got) + ".";
  }
  return capitalize(subject) + " has an invalid value " + value(got) +
    " (expected type " + name(typeName) + ").";
}

/* ------------------------------------------------------------------ *
 *  Rewrite rules, matched against the raw x-xsd message
 * ------------------------------------------------------------------ */

const RULES = [

  // --- misplaced or unknown elements -------------------------------

  [ /^Element '(?<child>.+)' is not allowed here$/,
    ({ child }, ctx) => {
      return badChild(child, ctx);
    } ],

  [ /^Unexpected element '(?<child>.+)' after content model$/,
    ({ child }, ctx) => {
      return badChild(child, ctx);
    } ],

  [ /^Unknown element '(?<child>.+)'$/,
    ({ child }, ctx) => {
      // The xpath is the unknown element's own path; its parent is one level up.
      const parentPath = ctx.elements.slice(0, -1);
      if( !parentPath.length ) {
        const roots = [...ctx.ir.elements.keys()];
        return name(child) + " is not a recognized root element." + suggestion(child, roots) +
          " Expected one of: " + nameList(roots) + ".";
      }
      const parent = parentPath.at(-1);
      const type = resolveType(ctx.ir, parentPath);
      const allowed = type ? childNames(ctx.ir, type) : [];
      let msg = name(child) + " is not a recognized element inside " + name(parent) + "." +
        suggestion(child, allowed);
      if( allowed.length ) {
        msg += " Allowed children of " + name(parent) + ": " + nameList(allowed) + ".";
      }
      return msg;
    } ],

  // --- missing or miscounted content -------------------------------

  [ /^Missing required element '(?<child>.+)'$/,
    ({ child }, ctx) => {
      return ctx.owner &&
        name(ctx.owner) + " is missing its required child element " + name(child) + ".";
    } ],

  [ /^Expected at least (?<min>\d+) '(?<child>.+)' element\(s\), got (?<got>\d+)$/,
    ({ min, child, got }, ctx) => {
      return ctx.owner &&
        name(ctx.owner) + " must contain at least " + min + " " + name(child) +
        " child " + plural(min, "element") + " — found " + got + ".";
    } ],

  [ /^(?:Sequence|Group) requires at least \d+ (?:repetition|occurrence)\(s\), got \d+$/,
    (groups, ctx) => {
      if( !ctx.owner ) {
        return null;
      }
      const type = ctx.ownerType();
      const required = type ? requiredChildNames(ctx.ir, type) : [];
      if( required.length ) {
        return name(ctx.owner) + " is missing required content." +
          " It must contain: " + nameList(required) + ".";
      }
      // Nothing is strictly required, so a child must have been unacceptable.
      return name(ctx.owner) + " contains content it does not accept." +
        allowedChildrenSentence(ctx);
    } ],

  [ /^Choice requires at least (?<min>\d+) match\(es\), got \d+$/,
    ({ min }, ctx) => {
      if( !ctx.owner ) {
        return null;
      }
      const needs = Number(min) === 1 ? "a child element" : "at least " + min + " child elements";
      return name(ctx.owner) + " needs " + needs + "." + allowedChildrenSentence(ctx);
    } ],

  // --- attributes ---------------------------------------------------

  [ /^Undeclared attribute '(?<attr>.+)'$/,
    ({ attr }, ctx) => {
      if( !ctx.owner ) {
        return null;
      }
      const type = ctx.ownerType();
      const allowed = type ? attributeNames(ctx.ir, type) : [];
      return name(ctx.owner) + " does not allow an attribute named " + name(attr) + "." +
        suggestion(attr, allowed) + allowedAttributesSentence(ctx);
    } ],

  [ /^Missing required attribute '(?<attr>.+)'$/,
    ({ attr }, ctx) => {
      return ctx.owner &&
        name(ctx.owner) + " is missing the required attribute " + name(attr) + ".";
    } ],

  [ /^Attribute '(?<attr>.+)' is prohibited$/,
    ({ attr }, ctx) => {
      return ctx.owner &&
        "The attribute " + name(attr) + " is not allowed on " + name(ctx.owner) + ".";
    } ],

  [ /^Attribute '(?<attr>.+)' value '(?<got>.*)' is not valid for type '(?<type>.+)'$/,
    ({ attr, got, type }, ctx) => {
      return typedValueSentence("attribute " + name(attr), got, type, ctx);
    } ],

  [ /^Attribute '(?<attr>.+)' must have fixed value '(?<fixed>.*)'$/,
    ({ attr, fixed }) => {
      return "Attribute " + name(attr) + " must always be " + value(fixed) + " here.";
    } ],

  // --- invalid values -----------------------------------------------

  [ /^Element '(?<el>.+)' must have fixed value '(?<fixed>.*)', got '(?<got>.*)'$/,
    ({ el, fixed, got }) => {
      return name(el) + " must always contain " + value(fixed) + " — got " + value(got) + ".";
    } ],

  [ /^Value '(?<got>.*)' is not valid for (?:base )?type '(?<type>.+)'$/,
    ({ got, type }, ctx) => {
      return typedValueSentence(valueSubject(ctx), got, type, ctx);
    } ],

  [ /^List item '(?<got>.*)' is not valid for type '(?<type>.+)'$/,
    ({ got, type }, ctx) => {
      return typedValueSentence("each item in " + valueSubject(ctx), got, type, ctx);
    } ],

  [ /^Value '(?<got>.*)' is not in enumeration \[(?<options>.*)\]$/,
    ({ got, options }, ctx) => {
      const allowed = options.split(", ").filter(Boolean);
      return capitalize(valueSubject(ctx)) + " must be one of: " + nameList(allowed) +
        " — got " + value(got) + "." + suggestion(got, allowed);
    } ],

  [ /^Value '(?<got>.*)' does not match pattern '(?<pattern>.+)'$/,
    ({ got, pattern }, ctx) => {
      return capitalize(valueSubject(ctx)) + " has an unexpected format — got " + value(got) +
        " (must match the pattern " + value(pattern) + ").";
    } ],

  [ /^Value '(?<got>.*)' does not match any member type of union$/,
    ({ got }, ctx) => {
      return capitalize(valueSubject(ctx)) + " has an invalid value " + value(got) + ".";
    } ],

  // --- range and length limits --------------------------------------

  [ /^Value '(?<got>.*)' is less than minInclusive '(?<limit>.*)'$/,
    ({ got, limit }, ctx) => {
      return capitalize(valueSubject(ctx)) + " must be at least " + limit +
        " — got " + value(got) + ".";
    } ],

  [ /^Value '(?<got>.*)' exceeds maxInclusive '(?<limit>.*)'$/,
    ({ got, limit }, ctx) => {
      return capitalize(valueSubject(ctx)) + " must be at most " + limit +
        " — got " + value(got) + ".";
    } ],

  [ /^Value '(?<got>.*)' is not greater than minExclusive '(?<limit>.*)'$/,
    ({ got, limit }, ctx) => {
      return capitalize(valueSubject(ctx)) + " must be greater than " + limit +
        " — got " + value(got) + ".";
    } ],

  [ /^Value '(?<got>.*)' is not less than maxExclusive '(?<limit>.*)'$/,
    ({ got, limit }, ctx) => {
      return capitalize(valueSubject(ctx)) + " must be less than " + limit +
        " — got " + value(got) + ".";
    } ],

  [ /^Value length (?<got>\d+) is less than minLength (?<limit>\d+)$/,
    ({ got, limit }, ctx) => {
      return capitalize(valueSubject(ctx)) + " must be at least " + limit + " " +
        plural(limit, "character") + " long — got " + got + ".";
    } ],

  [ /^Value length (?<got>\d+) exceeds maxLength (?<limit>\d+)$/,
    ({ got, limit }, ctx) => {
      return capitalize(valueSubject(ctx)) + " must be at most " + limit + " " +
        plural(limit, "character") + " long — got " + got + ".";
    } ],

  [ /^Value length (?<got>\d+) does not match length (?<limit>\d+)$/,
    ({ got, limit }, ctx) => {
      return capitalize(valueSubject(ctx)) + " must be exactly " + limit + " " +
        plural(limit, "character") + " long — got " + got + ".";
    } ],

  [ /^Value '(?<got>.*)' has more than (?<limit>\d+) total digits$/,
    ({ got, limit }, ctx) => {
      return capitalize(valueSubject(ctx)) + " may have at most " + limit +
        " digits — got " + value(got) + ".";
    } ],

  [ /^Value '(?<got>.*)' has more than (?<limit>\d+) fraction digits$/,
    ({ got, limit }, ctx) => {
      return capitalize(valueSubject(ctx)) + " may have at most " + limit +
        " decimal places — got " + value(got) + ".";
    } ],

  // --- wrong kind of content ----------------------------------------

  [ /^Element has child elements but type (?:'.+' )?is simple$|^Element has child elements but type has simpleContent$/,
    (groups, ctx) => {
      return ctx.owner &&
        name(ctx.owner) + " may only contain text — remove its child elements.";
    } ],

  [ /^Element has text content but type is not mixed$/,
    (groups, ctx) => {
      return ctx.owner &&
        name(ctx.owner) + " must not contain text directly" +
        " — move the text into an attribute or child element.";
    } ],

  [ /^Element should have no child elements$/,
    (groups, ctx) => {
      return ctx.owner && name(ctx.owner) + " must be empty — remove its child elements.";
    } ],

  [ /^Element should have no text content$/,
    (groups, ctx) => {
      return ctx.owner && name(ctx.owner) + " must be empty — remove its text content.";
    } ],

  // --- ids and assertions -------------------------------------------

  [ /^Duplicate ID value '(?<id>.+)'$/,
    ({ id }) => {
      return "The id " + value(id) +
        " is used more than once — ids must be unique within the document.";
    } ],

  [ /^IDREF '(?<id>.+)' does not match any ID$/,
    ({ id }) => {
      return value(id) + " does not match the id of any element in this document.";
    } ],

  [ /^Assertion failed: count\((?<child>\S+)\) <= (?<max>\d+)$/,
    ({ child, max }, ctx) => {
      return ctx.owner &&
        name(ctx.owner) + " may contain at most " + max + " " + name(child) +
        " " + plural(max, "element") + ".";
    } ],

  [ /^Assertion failed: count\((?<child>\S+)\) >= (?<min>\d+)$/,
    ({ child, min }, ctx) => {
      return ctx.owner &&
        name(ctx.owner) + " must contain at least " + min + " " + name(child) +
        " " + plural(min, "element") + ".";
    } ]
];

/* ------------------------------------------------------------------ */

/**
 * Rewrites a single x-xsd validation error message into plain language.
 * Unrecognised message shapes, unresolvable xpaths and internal failures
 * all fall back to the original message; this never throws.
 *
 * @param {Object} error
 *  An x-xsd error: `{ message, xpath }`.
 * @param {Object} ir
 *  The compiled schema IR (`compile(...).ir`); enables allowed-name lists
 *  and suggestions.
 * @returns {String} the humanised (or original) message.
 */
export function humanise(error, ir) {
  const original = error && error.message;
  if( !original || !ir ) {
    return original;
  }

  try {
    const { elements, attr } = parseXpath(error.xpath);
    const ctx = {
      ir,
      elements,
      attr,
      owner: elements.at(-1) || null,
      ownerType() {
        return resolveType(ir, elements);
      },
      childNames() {
        const type = this.ownerType();
        return type ? childNames(ir, type) : [];
      }
    };

    for( const [ matches, rewrite ] of RULES ) {
      const match = matches.exec(original);
      if( match ) {
        return rewrite(match.groups || {}, ctx) || original;
      }
    }
  } catch(e) {
    // Humanisation should never break validation flow.
  }

  return original;
}
