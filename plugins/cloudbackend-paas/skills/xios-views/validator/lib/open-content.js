/**
 * Open-content augmentation for XIOS schemas (consumer-side; NOT part of x-xsd).
 *
 * Used by validate.js to inject author-declared custom component tags and
 * operation names into the schema before compiling. x-xsd stays a pure XSD
 * validator that knows nothing about this — these helpers operate on schema
 * text/DOM and produce a Document that x-xsd's compile()/resolveImport accept.
 *
 * The schemas are pre-edited with two injection points:
 *   - view.xsd:    <xs:group name="g_custom"> referenced by every component
 *                  container; its empty body is filled with the custom elements.
 *   - process.xsd: the named simpleType op__any's @name refers to (its
 *                  enumeration of built-in names); one <xs:enumeration> is
 *                  appended per declared op name.
 *
 * Injection is structural (find nodes by name), so it is robust to schema
 * reformatting. Each call parses the pristine base text into a fresh Document, so
 * there is no shared mutable state.
 */

const XSD_NS = "http://www.w3.org/2001/XMLSchema";

// Conservative XML Name guard: only inject names safe to drop into a schema.
// Anything else is ignored here and therefore still rejected as undeclared.
const VALID_NAME = /^[A-Za-z_][\w.-]*$/;

/** Parse schema text to a Document (or pass a Document through). */
function toDoc(input) {
  if(input && typeof input === "object" && input.nodeType) {
    return input;
  }

  const Parser = globalThis.DOMParser;
  if(!Parser) {
    throw new Error("open-content: DOMParser not available");
  }

  return new Parser().parseFromString(String(input), "application/xml");
}

function uniqueValid(names) {
  return [...new Set(names || [])].filter((n) => {
return typeof n === "string" && VALID_NAME.test(n);
});
}

function childElements(node) {
  const out = [];
  for(let i = 0; i < node.childNodes.length; i++) {
    if(node.childNodes[i].nodeType === 1) {
      out.push(node.childNodes[i]);
    }
  }
  return out;
}

/** First descendant XSD element with the given localName (and optional @name). */
function findEl(node, localName, nameAttr) {
  for(const ch of childElements(node)) {
    if(
      ch.namespaceURI === XSD_NS &&
      ch.localName === localName &&
      (nameAttr === undefined || ch.getAttribute("name") === nameAttr)
    ) {
      return ch;
    }
    const found = findEl(ch, localName, nameAttr);
    if(found) {
      return found;
    }
  }
  return null;
}

/** Create an xs:<local> element with the given attributes. */
function el(doc, local, attrs) {
  const node = doc.createElementNS(XSD_NS, "xs:" + local);
  if(attrs) {
    for(const k of Object.keys(attrs)) {
      node.setAttribute(k, attrs[k]);
    }
  }
  return node;
}

/** An opaque element declaration: any attributes, any children, none validated. */
function opaqueElement(doc, tag) {
  const elem = el(doc, "element", { name: tag });
  const ct = el(doc, "complexType", { mixed: "true" });
  const seq = el(doc, "sequence");
  seq.appendChild(el(doc, "any", { processContents: "skip", minOccurs: "0", maxOccurs: "unbounded" }));
  ct.appendChild(seq);
  ct.appendChild(el(doc, "anyAttribute", { processContents: "skip" }));
  elem.appendChild(ct);
  return elem;
}

function injectComponentsDoc(doc, tags) {
  const group = findEl(doc.documentElement, "group", "g_custom");
  if(!group) {
    return doc;
  } // pre-edit missing — nothing to inject into

  while(group.firstChild) {
    group.removeChild(group.firstChild);
  } // drop the empty <xs:sequence/>

  const choice = el(doc, "choice", { minOccurs: "0", maxOccurs: "unbounded" });
  for(const tag of tags) {
    choice.appendChild(opaqueElement(doc, tag));
  }

  group.appendChild(choice);
  return doc;
}

function injectOpsDoc(doc, names) {
  const opAny = findEl(doc.documentElement, "complexType", "op__any");
  if(!opAny) {
    return doc;
  }

  const nameAttr = findEl(opAny, "attribute", "name");
  if(!nameAttr) {
    return doc;
  }

  const nameType = findEl(doc.documentElement, "simpleType", nameAttr.getAttribute("type"));
  if(!nameType) {
    return doc;
  }

  const restriction = findEl(nameType, "restriction");
  if(!restriction) {
    return doc;
  }

  for(const n of names) {
    restriction.appendChild(el(doc, "enumeration", { value: n }));
  }

  return doc;
}

/**
 * Augment one schema by filename. Apply to BOTH the root schema and to whatever
 * resolveImport serves, so view.xsd / process.xsd are augmented identically
 * whether they are the root or an include.
 *
 * @param {string} file - schema filename or schemaLocation (basename is used)
 * @param {string|Document} text - the base schema text (or parsed Document)
 * @param {{components: string[], operations: string[]}} decls
 * @returns {string|Document} the original input if nothing to inject, else an
 *   augmented Document (accepted by x-xsd compile() and resolveImport).
 */
export function augmentSchema(file, text, decls = {}) {
  if(!text) {
    return text;
  }

  const base = String(file).split(/[\\/]/).pop();
  if(base === "view.xsd") {
    const tags = uniqueValid(decls.components);
    return tags.length ? injectComponentsDoc(toDoc(text), tags) : text;
  }

  if(base === "process.xsd") {
    const ops = uniqueValid(decls.operations);
    return ops.length ? injectOpsDoc(toDoc(text), ops) : text;
  }
  return text;
}

/** True if the declarations contain anything worth augmenting for. */
export function hasCustom(decls = {}) {
  return uniqueValid(decls.components).length > 0 || uniqueValid(decls.operations).length > 0;
}

/** Stable cache key for a (root, declaration-set) pair. */
export function cacheKey(rootName, decls = {}) {
  const c = uniqueValid(decls.components).sort().join(",");
  const o = uniqueValid(decls.operations).sort().join(",");
  return `${rootName}|c:${c}|o:${o}`;
}
