// src/dom.js
function parseXml(xml) {
  if (typeof xml !== "string") {
    throw new Error("x-xsd: expected XML string, got " + typeof xml);
  }
  const Parser = resolveDOMParser();
  const doc = new Parser().parseFromString(xml, "application/xml");
  const err = doc.getElementsByTagName("parsererror")[0];
  if (err) throw new Error("XML parse error: " + err.textContent);
  return doc;
}
function toDocument(input) {
  if (typeof input === "string") return parseXml(input);
  if (input && typeof input === "object" && input.nodeType) return input;
  throw new Error("x-xsd: input must be a string or DOM Document, got " + typeof input);
}
function resolveDOMParser() {
  if (typeof globalThis.DOMParser !== "undefined") return globalThis.DOMParser;
  throw new Error(
    'x-xsd: DOMParser not available. In Node.js, install @xmldom/xmldom and assign: globalThis.DOMParser = require("@xmldom/xmldom").DOMParser'
  );
}

// src/compiler/schema-parser.js
var XSD_NS = "http://www.w3.org/2001/XMLSchema";
function xsdChildren(parent, localName) {
  const result = [];
  for (let i = 0; i < parent.childNodes.length; i++) {
    const ch = parent.childNodes[i];
    if (ch.nodeType === 1 && ch.namespaceURI === XSD_NS) {
      if (!localName || ch.localName === localName) result.push(ch);
    }
  }
  return result;
}
function xsdChild(parent, localName) {
  for (let i = 0; i < parent.childNodes.length; i++) {
    const ch = parent.childNodes[i];
    if (ch.nodeType === 1 && ch.namespaceURI === XSD_NS && ch.localName === localName) return ch;
  }
  return null;
}
function resolveQName(qname, contextEl) {
  if (!qname) return null;
  const idx = qname.indexOf(":");
  if (idx === -1) {
    let el2 = contextEl;
    while (el2 && el2.nodeType === 1) {
      const defNs = el2.getAttribute("xmlns");
      if (defNs !== null && defNs !== "") return { ns: defNs, local: qname };
      el2 = el2.parentNode;
    }
    return { ns: null, local: qname };
  }
  const prefix = qname.substring(0, idx);
  const local = qname.substring(idx + 1);
  let el = contextEl;
  while (el && el.nodeType === 1) {
    const nsAttr = el.getAttribute("xmlns:" + prefix);
    if (nsAttr !== null && nsAttr !== "") return { ns: nsAttr, local };
    el = el.parentNode;
  }
  return { ns: null, local };
}
function parseSchema(xsd, options) {
  const doc = toDocument(xsd);
  const root = doc.documentElement;
  if (root.localName !== "schema" || root.namespaceURI !== XSD_NS) {
    throw new Error("x-xsd: root element must be xs:schema");
  }
  const targetNamespace = root.getAttribute("targetNamespace") || null;
  const elementFormDefault = root.getAttribute("elementFormDefault") || "unqualified";
  const attributeFormDefault = root.getAttribute("attributeFormDefault") || "unqualified";
  const blockDefault = root.getAttribute("blockDefault") || null;
  const elements = /* @__PURE__ */ new Map();
  const nsElements = /* @__PURE__ */ new Map();
  const types = /* @__PURE__ */ new Map();
  const nsTypes = /* @__PURE__ */ new Map();
  const groups = /* @__PURE__ */ new Map();
  const attributeGroups = /* @__PURE__ */ new Map();
  const globalAttributes = /* @__PURE__ */ new Map();
  const resolveImport = options && options.resolveImport;
  const imported = options && options._imported || /* @__PURE__ */ new Set();
  const importedNamespaces = /* @__PURE__ */ new Set();
  for (const child of xsdChildren(root)) {
    if (child.localName === "import" || child.localName === "include") {
      const ns = child.getAttribute("namespace") || null;
      if (ns) importedNamespaces.add(ns);
      const schemaLoc = child.getAttribute("schemaLocation") || null;
      const key = (ns || "") + "|" + (schemaLoc || "");
      if (imported.has(key)) continue;
      imported.add(key);
      if (resolveImport && schemaLoc) {
        try {
          const importedXsd = resolveImport(ns, schemaLoc);
          if (importedXsd) {
            const importedIr = parseSchema(importedXsd, { ...options, _imported: imported });
            const impNs = importedIr.targetNamespace || null;
            for (const [k, v] of importedIr.elements) {
              elements.set(k, v);
              nsElements.set("{" + (impNs || "") + "}" + k, v);
            }
            for (const [k, v] of importedIr.types) {
              types.set(k, v);
              nsTypes.set("{" + (impNs || "") + "}" + k, v);
            }
            for (const [k, v] of importedIr.groups) groups.set(k, v);
            for (const [k, v] of importedIr.attributeGroups) attributeGroups.set(k, v);
            for (const [k, v] of importedIr.globalAttributes) globalAttributes.set(k, v);
            if (importedIr.nsElements) {
              for (const [k, v] of importedIr.nsElements) nsElements.set(k, v);
            }
            if (importedIr.nsTypes) {
              for (const [k, v] of importedIr.nsTypes) nsTypes.set(k, v);
            }
          }
        } catch {
        }
      }
    }
  }
  for (const child of xsdChildren(root)) {
    switch (child.localName) {
      case "element": {
        const name = child.getAttribute("name");
        elements.set(name, parseElement(child));
        if (targetNamespace) nsElements.set("{" + targetNamespace + "}" + name, elements.get(name));
        break;
      }
      case "complexType": {
        const name = child.getAttribute("name");
        types.set(name, parseComplexType(child));
        if (targetNamespace) nsTypes.set("{" + targetNamespace + "}" + name, types.get(name));
        break;
      }
      case "simpleType": {
        const name = child.getAttribute("name");
        types.set(name, parseSimpleType(child));
        if (targetNamespace) nsTypes.set("{" + targetNamespace + "}" + name, types.get(name));
        break;
      }
      case "group":
        groups.set(child.getAttribute("name"), parseGroup(child));
        break;
      case "attributeGroup":
        attributeGroups.set(child.getAttribute("name"), parseAttributeGroup(child));
        break;
      case "attribute":
        globalAttributes.set(child.getAttribute("name"), parseAttribute(child));
        break;
    }
  }
  const effectiveFormNs = elementFormDefault === "qualified" && targetNamespace ? targetNamespace : "";
  stampFormNs(types, effectiveFormNs, targetNamespace);
  stampFormNs(groups, effectiveFormNs, targetNamespace);
  for (const el of elements.values()) {
    if (el.inlineType) stampFormNsInDef(el.inlineType, effectiveFormNs, targetNamespace);
  }
  stampAttrForm(types, attributeFormDefault);
  stampAttrForm(groups, attributeFormDefault);
  for (const ag of attributeGroups.values()) {
    stampAttrFormInAttrs(ag.attributes, attributeFormDefault);
  }
  for (const el of elements.values()) {
    if (el.inlineType) stampAttrFormInDef(el.inlineType, attributeFormDefault);
  }
  return {
    targetNamespace,
    elementFormDefault,
    attributeFormDefault,
    blockDefault,
    elements,
    nsElements,
    types,
    nsTypes,
    groups,
    attributeGroups,
    globalAttributes,
    importedNamespaces
  };
}
function stampFormNs(defs, defaultFormNs, tns) {
  for (const def of defs.values()) {
    stampFormNsInDef(def, defaultFormNs, tns);
  }
}
function stampFormNsInDef(def, defaultFormNs, tns) {
  if (!def) return;
  stampFormNsInContent(def.content, defaultFormNs, tns);
  if (def.derivation) {
    stampFormNsInContent(def.derivation.content, defaultFormNs, tns);
  }
  if (def.particles) {
    for (const p of def.particles) stampFormNsInParticle(p, defaultFormNs, tns);
  }
}
function stampFormNsInContent(content, defaultFormNs, tns) {
  if (!content) return;
  if (content.particles) {
    for (const p of content.particles) stampFormNsInParticle(p, defaultFormNs, tns);
  }
}
function stampFormNsInParticle(p, defaultFormNs, tns) {
  if (!p) return;
  if (p.kind === "element" && !p.ref) {
    if (p.formNs === void 0) {
      if (p.form === "qualified") {
        p.formNs = tns || "";
      } else if (p.form === "unqualified") {
        p.formNs = "";
      } else {
        p.formNs = defaultFormNs;
      }
    }
    if (p.inlineType) stampFormNsInDef(p.inlineType, defaultFormNs, tns);
  } else if (p.kind === "sequence" || p.kind === "choice" || p.kind === "all") {
    stampFormNsInContent(p, defaultFormNs, tns);
  } else if (p.kind === "group" && p.particles) {
    for (const cp of p.particles) stampFormNsInParticle(cp, defaultFormNs, tns);
  }
}
function stampAttrForm(defs, attrFormDefault) {
  for (const def of defs.values()) {
    stampAttrFormInDef(def, attrFormDefault);
  }
}
function stampAttrFormInDef(def, attrFormDefault) {
  if (!def) return;
  stampAttrFormInAttrs(def.attributes, attrFormDefault);
  if (def.derivation) {
    stampAttrFormInAttrs(def.derivation.attributes, attrFormDefault);
  }
}
function stampAttrFormInAttrs(attrs, attrFormDefault) {
  if (!attrs) return;
  for (const ad of attrs) {
    if (ad.kind === "attribute" && !ad.ref && !ad.form) {
      ad.form = attrFormDefault;
    }
    if (ad.kind === "attributeGroup" && ad.attributes) {
      stampAttrFormInAttrs(ad.attributes, attrFormDefault);
    }
  }
}
function parseElement(el) {
  const ref = el.getAttribute("ref");
  if (ref) {
    const qn = resolveQName(ref, el);
    return {
      kind: "element",
      ref: qn ? qn.local : ref,
      refNs: qn ? qn.ns : null,
      minOccurs: parseOccurs(el, "minOccurs", 1),
      maxOccurs: parseOccurs(el, "maxOccurs", 1)
    };
  }
  const result = {
    kind: "element",
    name: el.getAttribute("name"),
    type: null,
    minOccurs: parseOccurs(el, "minOccurs", 1),
    maxOccurs: parseOccurs(el, "maxOccurs", 1),
    nillable: el.getAttribute("nillable") === "true" || el.getAttribute("nillable") === "1",
    abstract: el.getAttribute("abstract") === "true" || el.getAttribute("abstract") === "1",
    default: el.getAttribute("default") || null,
    fixed: el.hasAttribute && el.hasAttribute("fixed") ? el.getAttribute("fixed") : null,
    block: el.hasAttribute && el.hasAttribute("block") ? el.getAttribute("block") || "" : el.getAttribute("block") || null,
    form: el.getAttribute("form") || null,
    substitutionGroup: null,
    inlineType: null
  };
  const subst = el.getAttribute("substitutionGroup");
  if (subst) {
    const qn = resolveQName(subst, el);
    result.substitutionGroup = qn ? qn.local : subst;
  }
  const typeAttr = el.getAttribute("type");
  if (typeAttr) {
    result.type = resolveQName(typeAttr, el);
  }
  const ct = xsdChild(el, "complexType");
  if (ct) result.inlineType = parseComplexType(ct);
  const st = xsdChild(el, "simpleType");
  if (st) result.inlineType = parseSimpleType(st);
  const constraints = [];
  for (const child of xsdChildren(el)) {
    if (child.localName === "key" || child.localName === "unique" || child.localName === "keyref") {
      constraints.push(parseIdentityConstraint(child));
    }
  }
  if (constraints.length) result.identityConstraints = constraints;
  const alternatives = xsdChildren(el, "alternative");
  if (alternatives.length) {
    result.alternatives = alternatives.map((a) => ({
      test: a.hasAttribute("test") ? a.getAttribute("test") : null,
      type: a.getAttribute("type") ? resolveQName(a.getAttribute("type"), a) : null
    }));
  }
  return result;
}
function parseIdentityConstraint(el) {
  const selector = xsdChild(el, "selector");
  const fields = xsdChildren(el, "field");
  const namespaces = {};
  let ctx = el;
  while (ctx && ctx.nodeType === 1) {
    if (ctx.attributes) {
      for (let i = 0; i < ctx.attributes.length; i++) {
        const a = ctx.attributes[i];
        if (a.name.startsWith("xmlns:")) {
          const prefix = a.name.substring(6);
          if (!(prefix in namespaces)) namespaces[prefix] = a.value;
        }
      }
    }
    ctx = ctx.parentNode;
  }
  const result = {
    kind: el.localName,
    // 'key', 'unique', or 'keyref'
    name: el.getAttribute("name"),
    selector: selector ? selector.getAttribute("xpath") : null,
    fields: fields.map((f) => f.getAttribute("xpath")),
    namespaces
  };
  if (el.localName === "keyref") {
    const refer = el.getAttribute("refer");
    if (refer) {
      const qn = resolveQName(refer, el);
      result.refer = qn ? qn.local : refer;
    }
  }
  return result;
}
function parseOccurs(el, attr, defaultVal) {
  if (!el.hasAttribute(attr)) return defaultVal;
  const val = el.getAttribute(attr);
  if (val === "unbounded") return Infinity;
  return parseInt(val, 10);
}
function parseComplexType(el) {
  const result = {
    kind: "complexType",
    name: el.getAttribute("name") || null,
    abstract: el.getAttribute("abstract") === "true",
    mixed: el.getAttribute("mixed") === "true" || el.getAttribute("mixed") === "1",
    block: el.hasAttribute && el.hasAttribute("block") ? el.getAttribute("block") || "" : el.getAttribute("block") || null,
    content: null,
    attributes: [],
    derivation: null
  };
  const asserts = xsdChildren(el, "assert");
  if (asserts.length) result.asserts = asserts.map((a) => ({ test: a.getAttribute("test") }));
  const cc = xsdChild(el, "complexContent");
  if (cc) {
    result.mixed = cc.getAttribute("mixed") === "true" || cc.getAttribute("mixed") === "1" || result.mixed;
    const ext = xsdChild(cc, "extension");
    const restr = xsdChild(cc, "restriction");
    if (ext) {
      result.derivation = {
        type: "extension",
        base: resolveQName(ext.getAttribute("base"), ext),
        content: parseContentModel(ext),
        attributes: parseAttributes(ext)
      };
    } else if (restr) {
      result.derivation = {
        type: "restriction",
        base: resolveQName(restr.getAttribute("base"), restr),
        content: parseContentModel(restr),
        attributes: parseAttributes(restr)
      };
    }
    return result;
  }
  const sc = xsdChild(el, "simpleContent");
  if (sc) {
    const ext = xsdChild(sc, "extension");
    const restr = xsdChild(sc, "restriction");
    if (ext) {
      result.derivation = {
        type: "simpleContent-extension",
        base: resolveQName(ext.getAttribute("base"), ext),
        attributes: parseAttributes(ext)
      };
    } else if (restr) {
      result.derivation = {
        type: "simpleContent-restriction",
        base: resolveQName(restr.getAttribute("base"), restr),
        facets: parseFacets(restr),
        attributes: parseAttributes(restr)
      };
    }
    return result;
  }
  result.content = parseContentModel(el);
  result.attributes = parseAttributes(el);
  return result;
}
function parseContentModel(parent) {
  const seq = xsdChild(parent, "sequence");
  if (seq) return parseCompositor(seq, "sequence");
  const choice = xsdChild(parent, "choice");
  if (choice) return parseCompositor(choice, "choice");
  const all = xsdChild(parent, "all");
  if (all) return parseCompositor(all, "all");
  const group = xsdChild(parent, "group");
  if (group) return parseGroupRef(group);
  return null;
}
function parseCompositor(el, type) {
  const particles = [];
  for (const child of xsdChildren(el)) {
    switch (child.localName) {
      case "element":
        particles.push(parseElement(child));
        break;
      case "sequence":
        particles.push(parseCompositor(child, "sequence"));
        break;
      case "choice":
        particles.push(parseCompositor(child, "choice"));
        break;
      case "group":
        particles.push(parseGroupRef(child));
        break;
      case "any":
        particles.push(parseAny(child));
        break;
    }
  }
  return {
    kind: type,
    minOccurs: parseOccurs(el, "minOccurs", 1),
    maxOccurs: parseOccurs(el, "maxOccurs", 1),
    particles
  };
}
function parseGroupRef(el) {
  const ref = el.getAttribute("ref");
  const qn = resolveQName(ref, el);
  return {
    kind: "groupRef",
    ref: qn ? qn.local : ref,
    refNs: qn ? qn.ns : null,
    minOccurs: parseOccurs(el, "minOccurs", 1),
    maxOccurs: parseOccurs(el, "maxOccurs", 1)
  };
}
function parseAny(el) {
  return {
    kind: "any",
    namespace: el.hasAttribute("namespace") ? el.getAttribute("namespace") : "##any",
    processContents: el.getAttribute("processContents") || "strict",
    minOccurs: parseOccurs(el, "minOccurs", 1),
    maxOccurs: parseOccurs(el, "maxOccurs", 1)
  };
}
function parseAttributes(parent) {
  const attrs = [];
  for (const child of xsdChildren(parent)) {
    if (child.localName === "attribute") {
      attrs.push(parseAttribute(child));
    } else if (child.localName === "attributeGroup") {
      attrs.push(parseAttributeGroupRef(child));
    } else if (child.localName === "anyAttribute") {
      attrs.push({
        kind: "anyAttribute",
        namespace: child.hasAttribute("namespace") ? child.getAttribute("namespace") : "##any",
        processContents: child.getAttribute("processContents") || "strict"
      });
    }
  }
  return attrs;
}
function parseAttribute(el) {
  const ref = el.getAttribute("ref");
  if (ref) {
    const qn = resolveQName(ref, el);
    return {
      kind: "attribute",
      ref: qn ? qn.local : ref,
      refNs: qn ? qn.ns : null,
      use: el.getAttribute("use") || "optional",
      fixed: el.hasAttribute && el.hasAttribute("fixed") ? el.getAttribute("fixed") : null,
      default: el.getAttribute("default") || null
    };
  }
  const result = {
    kind: "attribute",
    name: el.getAttribute("name"),
    type: resolveQName(el.getAttribute("type"), el),
    use: el.getAttribute("use") || "optional",
    form: el.getAttribute("form") || null,
    default: el.getAttribute("default") || null,
    fixed: el.hasAttribute && el.hasAttribute("fixed") ? el.getAttribute("fixed") : null,
    inlineType: null
  };
  const st = xsdChild(el, "simpleType");
  if (st) result.inlineType = parseSimpleType(st);
  return result;
}
function parseAttributeGroupRef(el) {
  const ref = el.getAttribute("ref");
  if (ref) {
    const qn = resolveQName(ref, el);
    return {
      kind: "attributeGroupRef",
      ref: qn ? qn.local : ref,
      refNs: qn ? qn.ns : null
    };
  }
  return {
    kind: "attributeGroup",
    name: el.getAttribute("name") || null,
    attributes: parseAttributes(el)
  };
}
function parseSimpleType(el) {
  const result = {
    kind: "simpleType",
    name: el.getAttribute("name") || null,
    variety: null
  };
  const restr = xsdChild(el, "restriction");
  if (restr) {
    result.variety = "restriction";
    result.base = resolveQName(restr.getAttribute("base"), restr);
    result.facets = parseFacets(restr);
    const innerSt = xsdChild(restr, "simpleType");
    if (innerSt) result.inlineBase = parseSimpleType(innerSt);
    return result;
  }
  const list = xsdChild(el, "list");
  if (list) {
    result.variety = "list";
    const itemTypeAttr = list.getAttribute("itemType");
    result.itemType = itemTypeAttr ? resolveQName(itemTypeAttr, list) : null;
    const innerSt = xsdChild(list, "simpleType");
    if (innerSt) result.inlineItemType = parseSimpleType(innerSt);
    return result;
  }
  const union = xsdChild(el, "union");
  if (union) {
    result.variety = "union";
    const memberTypesAttr = union.getAttribute("memberTypes");
    result.memberTypes = memberTypesAttr ? memberTypesAttr.split(/\s+/).filter(Boolean).map((t) => resolveQName(t, union)) : [];
    result.inlineMembers = xsdChildren(union, "simpleType").map(parseSimpleType);
    return result;
  }
  return result;
}
function parseFacets(parent) {
  const facets = [];
  for (const child of xsdChildren(parent)) {
    switch (child.localName) {
      case "enumeration":
      case "pattern":
      case "minInclusive":
      case "maxInclusive":
      case "minExclusive":
      case "maxExclusive":
      case "minLength":
      case "maxLength":
      case "length":
      case "totalDigits":
      case "fractionDigits":
      case "whiteSpace":
        facets.push({ kind: child.localName, value: child.getAttribute("value") });
        break;
    }
  }
  return facets;
}
function parseGroup(el) {
  return {
    kind: "group",
    name: el.getAttribute("name") || null,
    content: parseContentModel(el)
  };
}
function parseAttributeGroup(el) {
  return {
    kind: "attributeGroup",
    name: el.getAttribute("name") || null,
    attributes: parseAttributes(el)
  };
}

// src/compiler/xsd-regex.js
var NAME_START_RANGES = "A-Z_a-z:\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD";
var NAME_CHAR_EXTRA = "\\-\\.0-9\\xB7\\u0300-\\u036F\\u203F-\\u2040";
var NAME_START_CLASS = "[" + NAME_START_RANGES + "]";
var NAME_START_CLASS_NEG = "[^" + NAME_START_RANGES + "]";
var NAME_CHAR_CLASS = "[" + NAME_START_RANGES + NAME_CHAR_EXTRA + "]";
var NAME_CHAR_CLASS_NEG = "[^" + NAME_START_RANGES + NAME_CHAR_EXTRA + "]";
var UNICODE_BLOCKS = {
  "basiclatin": "\\u0000-\\u007F",
  "latin-1supplement": "\\u0080-\\u00FF",
  "latinextended-a": "\\u0100-\\u017F",
  "latinextended-b": "\\u0180-\\u024F",
  "ipaextensions": "\\u0250-\\u02AF",
  "spacingmodifierletters": "\\u02B0-\\u02FF",
  "combiningdiacriticalmarks": "\\u0300-\\u036F",
  "greek": "\\u0370-\\u03FF",
  "greekandcoptic": "\\u0370-\\u03FF",
  "cyrillic": "\\u0400-\\u04FF",
  "cyrillicsupplement": "\\u0500-\\u052F",
  "armenian": "\\u0530-\\u058F",
  "hebrew": "\\u0590-\\u05FF",
  "arabic": "\\u0600-\\u06FF",
  "syriac": "\\u0700-\\u074F",
  "thaana": "\\u0780-\\u07BF",
  "devanagari": "\\u0900-\\u097F",
  "bengali": "\\u0980-\\u09FF",
  "gurmukhi": "\\u0A00-\\u0A7F",
  "gujarati": "\\u0A80-\\u0AFF",
  "oriya": "\\u0B00-\\u0B7F",
  "tamil": "\\u0B80-\\u0BFF",
  "telugu": "\\u0C00-\\u0C7F",
  "kannada": "\\u0C80-\\u0CFF",
  "malayalam": "\\u0D00-\\u0D7F",
  "sinhala": "\\u0D80-\\u0DFF",
  "thai": "\\u0E00-\\u0E7F",
  "lao": "\\u0E80-\\u0EFF",
  "tibetan": "\\u0F00-\\u0FFF",
  "myanmar": "\\u1000-\\u109F",
  "georgian": "\\u10A0-\\u10FF",
  "hanguljamo": "\\u1100-\\u11FF",
  "ethiopic": "\\u1200-\\u137F",
  "cherokee": "\\u13A0-\\u13FF",
  "unifiedcanadianaboriginalsyllabics": "\\u1400-\\u167F",
  "ogham": "\\u1680-\\u169F",
  "runic": "\\u16A0-\\u16FF",
  "khmer": "\\u1780-\\u17FF",
  "mongolian": "\\u1800-\\u18AF",
  "latinextendedadditional": "\\u1E00-\\u1EFF",
  "greekextended": "\\u1F00-\\u1FFF",
  "generalpunctuation": "\\u2000-\\u206F",
  "superscriptsandsubscripts": "\\u2070-\\u209F",
  "currencysymbols": "\\u20A0-\\u20CF",
  "combiningdiacriticalmarksforsymbols": "\\u20D0-\\u20FF",
  "combiningmarksforsymbols": "\\u20D0-\\u20FF",
  "letterlikesymbols": "\\u2100-\\u214F",
  "numberforms": "\\u2150-\\u218F",
  "arrows": "\\u2190-\\u21FF",
  "mathematicaloperators": "\\u2200-\\u22FF",
  "miscellaneoustechnical": "\\u2300-\\u23FF",
  "controlpictures": "\\u2400-\\u243F",
  "opticalcharacterrecognition": "\\u2440-\\u245F",
  "enclosedalphanumerics": "\\u2460-\\u24FF",
  "boxdrawing": "\\u2500-\\u257F",
  "blockelements": "\\u2580-\\u259F",
  "geometricshapes": "\\u25A0-\\u25FF",
  "miscellaneoussymbols": "\\u2600-\\u26FF",
  "dingbats": "\\u2700-\\u27BF",
  "braillepatterns": "\\u2800-\\u28FF",
  "cjkradicalssupplement": "\\u2E80-\\u2EFF",
  "kangxiradicals": "\\u2F00-\\u2FDF",
  "ideographicdescriptioncharacters": "\\u2FF0-\\u2FFF",
  "cjksymbolsandpunctuation": "\\u3000-\\u303F",
  "hiragana": "\\u3040-\\u309F",
  "katakana": "\\u30A0-\\u30FF",
  "bopomofo": "\\u3100-\\u312F",
  "hangulcompatibilityjamo": "\\u3130-\\u318F",
  "kanbun": "\\u3190-\\u319F",
  "bopomofoextended": "\\u31A0-\\u31BF",
  "enclosedcjklettersandmonths": "\\u3200-\\u32FF",
  "cjkcompatibility": "\\u3300-\\u33FF",
  "cjkunifiedideographsextensiona": "\\u3400-\\u4DBF",
  "cjkunifiedideographs": "\\u4E00-\\u9FFF",
  "yisyllables": "\\uA000-\\uA48F",
  "yiradicals": "\\uA490-\\uA4CF",
  "hangulsyllables": "\\uAC00-\\uD7AF",
  "highsurrogates": "\\uD800-\\uDB7F",
  "highprivateusesurrogates": "\\uDB80-\\uDBFF",
  "lowsurrogates": "\\uDC00-\\uDFFF",
  "privateuse": "\\uE000-\\uF8FF",
  "privateusearea": "\\uE000-\\uF8FF",
  "cjkcompatibilityideographs": "\\uF900-\\uFAFF",
  "alphabeticpresentationforms": "\\uFB00-\\uFB4F",
  "arabicpresentationforms-a": "\\uFB50-\\uFDFF",
  "arabicpresentationforms-b": "\\uFE70-\\uFEFF",
  "halfwidthandfullwidthforms": "\\uFF00-\\uFFEF",
  "specials": "\\uFFF0-\\uFFFD",
  "combininghalfmarks": "\\uFE20-\\uFE2F",
  "cjkcompatibilityforms": "\\uFE30-\\uFE4F",
  "smallformvariants": "\\uFE50-\\uFE6F",
  "variationselectors": "\\uFE00-\\uFE0F",
  "olditalic": "\\u{10300}-\\u{1032F}",
  "gothic": "\\u{10330}-\\u{1034F}",
  "deseret": "\\u{10400}-\\u{1044F}",
  "byzantinemusicalsymbols": "\\u{1D000}-\\u{1D0FF}",
  "musicalsymbols": "\\u{1D100}-\\u{1D1FF}",
  "mathematicalalphanumericsymbols": "\\u{1D400}-\\u{1D7FF}",
  "cjkunifiedideographsextensionb": "\\u{20000}-\\u{2A6DF}",
  "cjkcompatibilityideographssupplement": "\\u{2F800}-\\u{2FA1F}",
  "tags": "\\u{E0000}-\\u{E007F}",
  "supplementaryprivateusearea-a": "\\u{F0000}-\\u{FFFFF}",
  "supplementaryprivateusearea-b": "\\u{100000}-\\u{10FFFF}"
};
var UNICODE_CATEGORIES = /* @__PURE__ */ new Set([
  "L",
  "Lu",
  "Ll",
  "Lt",
  "Lm",
  "Lo",
  "M",
  "Mn",
  "Mc",
  "Me",
  "N",
  "Nd",
  "Nl",
  "No",
  "P",
  "Pc",
  "Pd",
  "Ps",
  "Pe",
  "Pi",
  "Pf",
  "Po",
  "Z",
  "Zs",
  "Zl",
  "Zp",
  "S",
  "Sm",
  "Sc",
  "Sk",
  "So",
  "C",
  "Cc",
  "Cf",
  "Co",
  "Cn",
  "Cs"
]);
function findClassEnd(src, pos) {
  let i = pos + 1;
  if (i < src.length && src[i] === "^") i++;
  if (i < src.length && src[i] === "]") i++;
  let depth = 1;
  while (i < src.length && depth > 0) {
    if (src[i] === "\\") {
      i += 2;
      continue;
    }
    if (src[i] === "[") {
      depth++;
      i++;
      continue;
    }
    if (src[i] === "]") {
      depth--;
      if (depth === 0) return i;
      i++;
      continue;
    }
    i++;
  }
  return -1;
}
function translateCharClassContent(body) {
  const subIdx = findSubtractionMarker(body);
  if (subIdx === -1) {
    return null;
  }
  const basePart = body.slice(0, subIdx);
  const innerStart = subIdx + 1;
  const innerEnd = findClassEndInBody(body, innerStart);
  const subtractBody = body.slice(innerStart + 1, innerEnd);
  const subtractTranslated = translateClassBody(subtractBody);
  const baseTranslated = translateClassBody(basePart);
  return "(?:(?![" + subtractTranslated + "])[" + baseTranslated + "])";
}
function findSubtractionMarker(body) {
  let i = 0;
  let lastDashBracket = -1;
  while (i < body.length) {
    if (body[i] === "\\") {
      i += 2;
      continue;
    }
    if (body[i] === "[") {
      const end = findClassEndInBody(body, i);
      if (end !== -1) {
        i = end + 1;
        continue;
      }
    }
    if (body[i] === "-" && i + 1 < body.length && body[i + 1] === "[") {
      lastDashBracket = i;
      break;
    }
    i++;
  }
  return lastDashBracket;
}
function findClassEndInBody(body, pos) {
  let i = pos + 1;
  if (i < body.length && body[i] === "^") i++;
  if (i < body.length && body[i] === "]") i++;
  let depth = 1;
  while (i < body.length && depth > 0) {
    if (body[i] === "\\") {
      i += 2;
      continue;
    }
    if (body[i] === "[") {
      depth++;
      i++;
      continue;
    }
    if (body[i] === "]") {
      depth--;
      if (depth === 0) return i;
      i++;
      continue;
    }
    i++;
  }
  return -1;
}
function translateClassBody(body) {
  return body.replace(/\\([iIcCsSdDwW])/g, (m, ch) => {
    switch (ch) {
      case "i":
        return NAME_START_RANGES;
      case "I":
        return "\\0-@\\[-\\^`\\{-\\xBF\\xD7\\xF7\\u0300-\\u036F\\u037E\\u2000-\\u200B\\u200E-\\u206F\\u2190-\\u2BFF\\u2FF0-\\u3000\\uD800-\\uF8FF\\uFFFE\\uFFFF";
      case "c":
        return NAME_START_RANGES + NAME_CHAR_EXTRA;
      case "C":
        return "\\0-\\x2C\\x2F\\x3A-@\\[-\\^`\\{-\\xB6\\xB8-\\xBF\\xD7\\xF7\\u037E\\u2000-\\u200B\\u200E-\\u203E\\u2041-\\u206F\\u2190-\\u2BFF\\u2FF0-\\u3000\\uD800-\\uF8FF\\uFFFE\\uFFFF";
      case "s":
        return " \\t\\n\\r";
      case "S":
        return "\\0-\\x08\\x0B\\x0C\\x0E-\\x1F\\x21-\\uFFFF";
      case "d":
        return "\\p{Nd}";
      case "D":
        return "\\P{Nd}";
      // XSD \w = all except \p{P}\p{Z}\p{C} = letters, numbers, marks, symbols
      case "w":
        return "\\p{L}\\p{N}\\p{M}\\p{S}";
      case "W":
        return "\\p{P}\\p{Z}\\p{C}";
      default:
        return m;
    }
  }).replace(/\\[pP]\{([^}]+)\}/g, (m, name) => {
    const negated = m[1] === "P";
    if (negated) {
      let blockKey = name;
      if (/^Is/i.test(blockKey)) blockKey = blockKey.slice(2);
      const normalizedKey = blockKey.toLowerCase().replace(/[\s_]/g, "");
      if (UNICODE_BLOCKS[normalizedKey]) {
        const range = UNICODE_BLOCKS[normalizedKey];
        const comp = complementBlockRange(range);
        if (comp !== null) return comp;
      }
    }
    return translatePropertyEscape(name, negated);
  });
}
function parseRangeEndpoints(rangeStr) {
  const m = rangeStr.match(/^\\u(?:\{([0-9A-Fa-f]+)\}|([0-9A-Fa-f]{4}))-\\u(?:\{([0-9A-Fa-f]+)\}|([0-9A-Fa-f]{4}))$/);
  if (!m) return null;
  const start = parseInt(m[1] || m[2], 16);
  const end = parseInt(m[3] || m[4], 16);
  return [start, end];
}
function formatCodepoint(cp) {
  if (cp <= 65535) return "\\u" + cp.toString(16).padStart(4, "0").toUpperCase();
  return "\\u{" + cp.toString(16).toUpperCase() + "}";
}
function complementBlockRange(rangeStr) {
  const ep = parseRangeEndpoints(rangeStr);
  if (!ep) return null;
  const [start, end] = ep;
  const parts = [];
  if (start > 0) parts.push(formatCodepoint(0) + "-" + formatCodepoint(start - 1));
  if (end < 1114111) parts.push(formatCodepoint(end + 1) + "-" + formatCodepoint(1114111));
  return parts.join("");
}
function translatePropertyEscape(name, negated) {
  let blockKey = name;
  if (/^Is/i.test(blockKey)) {
    blockKey = blockKey.slice(2);
  }
  const normalizedKey = blockKey.toLowerCase().replace(/[\s_]/g, "");
  if (UNICODE_CATEGORIES.has(name)) {
    return negated ? "\\P{" + name + "}" : "\\p{" + name + "}";
  }
  if (UNICODE_BLOCKS[normalizedKey]) {
    const range = UNICODE_BLOCKS[normalizedKey];
    return negated ? "^" + range : range;
  }
  return negated ? "\\P{" + name + "}" : "\\p{" + name + "}";
}
function translateXsdPattern(xsdPattern) {
  const src = xsdPattern;
  let out = "";
  let i = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "[") {
      const end = findClassEnd(src, i);
      if (end === -1) {
        out += "[";
        i++;
        continue;
      }
      const fullBody = src.slice(i + 1, end);
      const subtracted = translateCharClassContent(fullBody);
      if (subtracted !== null) {
        out += subtracted;
      } else {
        const isNegated = fullBody[0] === "^";
        const bodyContent = isNegated ? fullBody.slice(1) : fullBody;
        const translated = translateClassBody(bodyContent);
        out += "[" + (isNegated ? "^" : "") + translated + "]";
      }
      i = end + 1;
      continue;
    }
    if (ch === "\\" && i + 1 < src.length) {
      const next = src[i + 1];
      if (next === "i") {
        out += NAME_START_CLASS;
        i += 2;
        continue;
      }
      if (next === "I") {
        out += NAME_START_CLASS_NEG;
        i += 2;
        continue;
      }
      if (next === "c") {
        out += NAME_CHAR_CLASS;
        i += 2;
        continue;
      }
      if (next === "C") {
        out += NAME_CHAR_CLASS_NEG;
        i += 2;
        continue;
      }
      if (next === "s") {
        out += "[ \\t\\n\\r]";
        i += 2;
        continue;
      }
      if (next === "S") {
        out += "[^ \\t\\n\\r]";
        i += 2;
        continue;
      }
      if (next === "d") {
        out += "\\p{Nd}";
        i += 2;
        continue;
      }
      if (next === "D") {
        out += "\\P{Nd}";
        i += 2;
        continue;
      }
      if ((next === "p" || next === "P") && i + 2 < src.length && src[i + 2] === "{") {
        const closeB = src.indexOf("}", i + 3);
        if (closeB !== -1) {
          const propName = src.slice(i + 3, closeB);
          const negated = next === "P";
          if (UNICODE_CATEGORIES.has(propName)) {
            out += (negated ? "\\P{" : "\\p{") + propName + "}";
          } else {
            let blockKey = propName;
            if (/^Is/i.test(blockKey)) blockKey = blockKey.slice(2);
            const normalizedKey = blockKey.toLowerCase().replace(/[\s_]/g, "");
            if (UNICODE_BLOCKS[normalizedKey]) {
              const range = UNICODE_BLOCKS[normalizedKey];
              out += "[" + (negated ? "^" : "") + range + "]";
            } else {
              out += (negated ? "\\P{" : "\\p{") + propName + "}";
            }
          }
          i = closeB + 1;
          continue;
        }
      }
      if (next === "w") {
        out += "[\\p{L}\\p{N}\\p{M}\\p{S}]";
        i += 2;
        continue;
      }
      if (next === "W") {
        out += "[\\p{P}\\p{Z}\\p{C}]";
        i += 2;
        continue;
      }
      if ("^$.?*+{}()|/[]\\".includes(next)) {
        out += "\\" + next;
      } else if (next === "n" || next === "r" || next === "t" || next === "0" || next === "f" || next === "v" || next === "b") {
        out += "\\" + next;
      } else {
        out += next;
      }
      i += 2;
      continue;
    }
    out += ch;
    i++;
  }
  return out;
}

// src/compiler/xsd-assert.js
var COMPARATORS = {
  ">=": (a, b) => a >= b,
  "<=": (a, b) => a <= b,
  "!=": (a, b) => a !== b,
  ">": (a, b) => a > b,
  "<": (a, b) => a < b,
  "=": (a, b) => a === b
};
function throwMismatch(ch, expr) {
  throw new Error(`x-xsd: mismatched '${ch}' in test expression: ${expr}`);
}
function splitComparison(expr) {
  let quote = null;
  const stack = [];
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    switch (ch) {
      case "'":
      case '"':
        quote = ch;
        continue;
      case "(":
      case "[":
        stack.push(ch);
        continue;
      case ")":
        if (stack.pop() !== "(") throwMismatch(ch, expr);
        continue;
      case "]":
        if (stack.pop() !== "[") throwMismatch(ch, expr);
        continue;
      case ">":
      case "<":
      case "!":
      case "=": {
        if (stack.length !== 0) continue;
        for (const op of [">=", "<=", "!=", ">", "<", "="]) {
          if (expr.startsWith(op, i)) {
            return {
              lhs: expr.slice(0, i).trim(),
              op,
              rhs: expr.slice(i + op.length).trim()
            };
          }
        }
        continue;
      }
    }
  }
  return null;
}
function splitOr(expr) {
  const branches = [];
  let quote = null;
  const stack = [];
  let start = 0;
  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];
    if (quote) {
      if (ch === quote) quote = null;
      continue;
    }
    switch (ch) {
      case "'":
      case '"':
        quote = ch;
        continue;
      case "(":
      case "[":
        stack.push(ch);
        continue;
      case ")":
        if (stack.pop() !== "(") throwMismatch(ch, expr);
        continue;
      case "]":
        if (stack.pop() !== "[") throwMismatch(ch, expr);
        continue;
      default:
        if (stack.length === 0 && /\s/.test(ch)) {
          const m = /^\s+or\s+/.exec(expr.slice(i));
          if (m) {
            branches.push(expr.slice(start, i));
            start = i + m[0].length;
            i = start - 1;
          }
        }
    }
  }
  branches.push(expr.slice(start));
  return branches;
}
function hasAttribute(el, name) {
  if (el.hasAttribute) return el.hasAttribute(name);
  return el.getAttribute ? el.getAttribute(name) != null : false;
}
function countChildren(node, name, predicate) {
  let n = 0;
  for (let i = 0; i < node.childNodes.length; i++) {
    const ch = node.childNodes[i];
    if (ch.nodeType !== 1 || (ch.localName || ch.nodeName) !== name) continue;
    if (predicate && !predicate(ch)) continue;
    n++;
  }
  return n;
}
function parseContentLiterals(pred) {
  const literals = [];
  for (const branch of splitOr(pred)) {
    const m = /^\.\s*=\s*('[^']*'|"[^"]*")$/.exec(branch.trim());
    if (!m) return null;
    literals.push(unquote(m[1]));
  }
  return literals;
}
function parsePredicate(pred) {
  pred = pred.trim();
  let m = /^@([\w.:-]+)$/.exec(pred);
  if (m) {
    const attr = m[1];
    return (el) => hasAttribute(el, attr);
  }
  m = /^not\(\s*@([\w.:-]+)\s*\)$/.exec(pred);
  if (m) {
    const attr = m[1];
    return (el) => !hasAttribute(el, attr);
  }
  let literals = parseContentLiterals(pred);
  if (literals) return (el) => literals.includes(stringValue(el));
  m = /^not\((.*)\)$/.exec(pred);
  if (m && (literals = parseContentLiterals(m[1]))) {
    return (el) => !literals.includes(stringValue(el));
  }
  return null;
}
function stringValue(node) {
  let text = "";
  for (let i = 0; i < node.childNodes.length; i++) {
    const ch = node.childNodes[i];
    if (ch.nodeType === 3 || ch.nodeType === 4) text += ch.nodeValue;
    else if (ch.nodeType === 1) text += stringValue(ch);
  }
  return text;
}
function normalizeSpace(s) {
  return s.replace(/\s+/g, " ").trim();
}
function unquote(s) {
  const m = /^'([^']*)'$|^"([^"]*)"$/.exec(s);
  if (!m) throw new Error(`x-xsd: unsupported string literal in test: ${s}`);
  return m[1] !== void 0 ? m[1] : m[2];
}
function evalTest(test, node) {
  const branches = splitOr(test.trim());
  if (branches.length > 1) {
    return branches.some((branch) => evalTest(branch, node));
  }
  const expr = branches[0].trim();
  let m = /^@([\w.:-]+)\s*=\s*('[^']*'|"[^"]*")$/.exec(expr);
  if (m) {
    const attr = node.getAttribute ? node.getAttribute(m[1]) : null;
    return attr === unquote(m[2]);
  }
  const cmp = splitComparison(expr);
  if (cmp) {
    const compare = COMPARATORS[cmp.op];
    m = /^count\(\s*([\w.-]+)\s*(?:\[(.+)\])?\s*\)$/.exec(cmp.lhs);
    if (m) {
      const predicate = m[2] !== void 0 ? parsePredicate(m[2]) : null;
      if (m[2] !== void 0 && !predicate) {
        throw new Error(
          `x-xsd: unsupported assert/alternative test expression: ${test}`
        );
      }
      const n = parseInt(cmp.rhs, 10);
      if (Number.isNaN(n))
        throw new Error(`x-xsd: unsupported count() comparison: ${test}`);
      return compare(countChildren(node, m[1], predicate), n);
    }
    if (/^normalize-space\(\s*\.\s*\)$/.test(cmp.lhs)) {
      return compare(normalizeSpace(stringValue(node)), unquote(cmp.rhs));
    }
  }
  throw new Error(
    `x-xsd: unsupported assert/alternative test expression: ${test}`
  );
}

// src/compiler/validator.js
var XSD_NS2 = "http://www.w3.org/2001/XMLSchema";
var XSI_NS = "http://www.w3.org/2001/XMLSchema-instance";
var XSD_PRIMITIVE_FAMILIES = {
  "string": "string",
  "normalizedString": "string",
  "token": "string",
  "language": "string",
  "Name": "string",
  "NCName": "string",
  "NMTOKEN": "string",
  "NMTOKENS": "string",
  "ID": "string",
  "IDREF": "string",
  "IDREFS": "string",
  "ENTITY": "string",
  "ENTITIES": "string",
  "boolean": "boolean",
  "decimal": "decimal",
  "integer": "decimal",
  "nonPositiveInteger": "decimal",
  "negativeInteger": "decimal",
  "long": "decimal",
  "int": "decimal",
  "short": "decimal",
  "byte": "decimal",
  "nonNegativeInteger": "decimal",
  "unsignedLong": "decimal",
  "unsignedInt": "decimal",
  "unsignedShort": "decimal",
  "unsignedByte": "decimal",
  "positiveInteger": "decimal",
  "float": "float",
  "double": "double",
  "duration": "duration",
  "dateTime": "dateTime",
  "time": "time",
  "date": "date",
  "gYearMonth": "gYearMonth",
  "gYear": "gYear",
  "gMonthDay": "gMonthDay",
  "gDay": "gDay",
  "gMonth": "gMonth",
  "hexBinary": "hexBinary",
  "base64Binary": "base64Binary",
  "anyURI": "anyURI",
  "QName": "QName",
  "NOTATION": "NOTATION"
};
var FIELD_MULTI = Symbol("FIELD_MULTI");
var NAME_START = "[A-Z_a-z\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD]";
var NAME_CHAR_EXTRA2 = "\\-.0-9\\xB7\\u0300-\\u036F\\u203F-\\u2040";
var XML_NAME_RE = new RegExp(`^[${NAME_START.slice(1, -1)}:][${NAME_START.slice(1, -1)}${NAME_CHAR_EXTRA2}:]*$`);
var XML_NCNAME_RE = new RegExp(`^${NAME_START}[${NAME_START.slice(1, -1)}${NAME_CHAR_EXTRA2}]*$`);
var XML_NMTOKEN_RE = new RegExp(`^[${NAME_START.slice(1, -1)}${NAME_CHAR_EXTRA2}:]+$`);
var BUILTIN_BASE = {
  "integer": "decimal",
  "nonPositiveInteger": "integer",
  "negativeInteger": "nonPositiveInteger",
  "long": "integer",
  "int": "long",
  "short": "int",
  "byte": "short",
  "nonNegativeInteger": "integer",
  "positiveInteger": "nonNegativeInteger",
  "unsignedLong": "nonNegativeInteger",
  "unsignedInt": "unsignedLong",
  "unsignedShort": "unsignedInt",
  "unsignedByte": "unsignedShort",
  "normalizedString": "string",
  "token": "normalizedString",
  "language": "token",
  "Name": "token",
  "NMTOKEN": "token",
  "NCName": "Name",
  "ID": "NCName",
  "IDREF": "NCName",
  "ENTITY": "NCName"
};
var BUILTIN_TYPES = {
  string: () => true,
  normalizedString: () => true,
  token: () => true,
  boolean: (v) => v === "true" || v === "false" || v === "1" || v === "0",
  int: (v) => /^[+-]?\d+$/.test(v.trim()) && Number(v) >= -2147483648 && Number(v) <= 2147483647,
  integer: (v) => /^[+-]?\d+$/.test(v.trim()),
  long: (v) => {
    const t = v.trim();
    if (!/^[+-]?\d+$/.test(t)) return false;
    try {
      const n = BigInt(t);
      return n >= -9223372036854775808n && n <= 9223372036854775807n;
    } catch {
      return false;
    }
  },
  short: (v) => /^[+-]?\d+$/.test(v.trim()) && Number(v) >= -32768 && Number(v) <= 32767,
  byte: (v) => /^[+-]?\d+$/.test(v.trim()) && Number(v) >= -128 && Number(v) <= 127,
  decimal: (v) => /^[+-]?(\d+\.?\d*|\.\d+)$/.test(v.trim()),
  float: (v) => {
    const t = v.trim();
    return t === "INF" || t === "+INF" || t === "-INF" || t === "NaN" || /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t);
  },
  double: (v) => {
    const t = v.trim();
    return t === "INF" || t === "-INF" || t === "NaN" || /^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(t);
  },
  nonNegativeInteger: (v) => /^[+-]?\d+$/.test(v.trim()) && BigInt(v.trim().replace(/^[+-]0+$/, "0")) >= 0n,
  positiveInteger: (v) => /^[+]?\d+$/.test(v.trim()) && BigInt(v.trim()) > 0n,
  nonPositiveInteger: (v) => /^[+-]?\d+$/.test(v.trim()) && BigInt(v.trim()) <= 0n,
  negativeInteger: (v) => /^[+-]?\d+$/.test(v.trim()) && BigInt(v.trim()) < 0n,
  unsignedInt: (v) => /^\d+$/.test(v.trim()) && Number(v) <= 4294967295,
  unsignedLong: (v) => {
    const t = v.trim();
    if (!/^\d+$/.test(t)) return false;
    try {
      return BigInt(t) <= 18446744073709551615n;
    } catch {
      return false;
    }
  },
  unsignedShort: (v) => /^\d+$/.test(v.trim()) && Number(v) <= 65535,
  unsignedByte: (v) => /^\d+$/.test(v.trim()) && Number(v) <= 255,
  anyURI: () => true,
  anySimpleType: () => true,
  QName: (v) => {
    const t = v.trim();
    if (!/^([a-zA-Z_][\w.-]*:)?[a-zA-Z_][\w.-]*$/.test(t)) return false;
    const colon = t.indexOf(":");
    if (colon >= 0 && t.substring(0, colon) === "xmlns") return false;
    return true;
  },
  NOTATION: () => true,
  duration: (v) => {
    const s = v.trim();
    const m = s.match(/^-?P(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?(\d+(?:\.\d+)?S)?)?$/);
    if (!m) return false;
    if (s === "P" || s === "-P") return false;
    if (m[4] && m[4] === "T") return false;
    return true;
  },
  dateTime: (v) => {
    const m = v.trim().match(/^-?(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/);
    if (!m) return false;
    const y = parseInt(m[1], 10);
    const mo = +m[2];
    const d = +m[3];
    const h = +m[4];
    const mi = +m[5];
    const s = +m[6];
    if (mo < 1 || mo > 12 || d < 1 || h > 24 || mi > 59 || s > 59) return false;
    const maxD = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (mo === 2 && (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) maxD[2] = 29;
    return d <= maxD[mo];
  },
  date: (v) => {
    const m = v.trim().match(/^-?(\d{4,})-(\d{2})-(\d{2})(?:Z|[+-]\d{2}:\d{2})?$/);
    if (!m) return false;
    const y = parseInt(m[1], 10);
    const mo = +m[2];
    const d = +m[3];
    if (mo < 1 || mo > 12 || d < 1) return false;
    const maxD = [0, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if (mo === 2 && (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) maxD[2] = 29;
    return d <= maxD[mo];
  },
  time: (v) => {
    const m = v.trim().match(/^(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/);
    if (!m) return false;
    return +m[1] <= 24 && +m[2] <= 59 && +m[3] <= 59;
  },
  gYear: (v) => /^-?\d{4,}(?:Z|[+-]\d{2}:\d{2})?$/.test(v.trim()),
  gYearMonth: (v) => {
    const m = v.trim().match(/^-?\d{4,}-(\d{2})(?:Z|[+-]\d{2}:\d{2})?$/);
    return m ? +m[1] >= 1 && +m[1] <= 12 : false;
  },
  gMonth: (v) => {
    const m = v.trim().match(/^--(\d{2})(?:--)?(?:Z|[+-]\d{2}:\d{2})?$/);
    return m ? +m[1] >= 1 && +m[1] <= 12 : false;
  },
  gMonthDay: (v) => {
    const m = v.trim().match(/^--(\d{2})-(\d{2})(?:Z|[+-]\d{2}:\d{2})?$/);
    if (!m) return false;
    const mo = +m[1];
    const d = +m[2];
    if (mo < 1 || mo > 12 || d < 1) return false;
    const maxD = [0, 31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return d <= maxD[mo];
  },
  gDay: (v) => {
    const m = v.trim().match(/^---(\d{2})(?:Z|[+-]\d{2}:\d{2})?$/);
    return m ? +m[1] >= 1 && +m[1] <= 31 : false;
  },
  hexBinary: (v) => /^([0-9a-fA-F]{2})*$/.test(v.trim()),
  base64Binary: (v) => {
    const t = v.trim().replace(/\s+/g, "");
    if (t === "") return true;
    return /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(t);
  },
  Name: (v) => XML_NAME_RE.test(v.trim()),
  NCName: (v) => XML_NCNAME_RE.test(v.trim()),
  ID: (v) => XML_NCNAME_RE.test(v.trim()),
  IDREF: (v) => XML_NCNAME_RE.test(v.trim()),
  IDREFS: (v) => v.trim().split(/\s+/).every((s) => XML_NCNAME_RE.test(s)),
  ENTITY: () => true,
  ENTITIES: () => true,
  NMTOKEN: (v) => XML_NMTOKEN_RE.test(v.trim()),
  NMTOKENS: (v) => v.trim().split(/\s+/).every((s) => XML_NMTOKEN_RE.test(s)),
  language: (v) => /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/.test(v.trim())
};
function collapseWhitespace(v) {
  return v.replace(/[\t\n\r ]+/g, " ").trim();
}
function replaceWhitespace(v) {
  return v.replace(/[\t\n\r]/g, " ");
}
var WS_PRESERVE_TYPES = /* @__PURE__ */ new Set(["string", "anySimpleType"]);
var WS_REPLACE_TYPES = /* @__PURE__ */ new Set(["normalizedString"]);
function getWhitespaceMode(typeDef) {
  if (typeDef.facets) {
    for (const f of typeDef.facets) {
      if (f.kind === "whiteSpace") return f.value;
    }
  }
  if (typeDef.base) {
    if (typeDef.base.ns === XSD_NS2) {
      if (WS_PRESERVE_TYPES.has(typeDef.base.local)) return "preserve";
      if (WS_REPLACE_TYPES.has(typeDef.base.local)) return "replace";
      return "collapse";
    }
  }
  if (typeDef.variety === "list" || typeDef.variety === "union") return "collapse";
  return "collapse";
}
function getWhitespaceModeForType(builtinName, typeDef) {
  if (builtinName) {
    if (WS_PRESERVE_TYPES.has(builtinName)) return "preserve";
    if (WS_REPLACE_TYPES.has(builtinName)) return "replace";
    return "collapse";
  }
  if (typeDef && typeDef.kind === "simpleType") return getWhitespaceMode(typeDef);
  return "collapse";
}
function normalizeByWhitespace(v, ws) {
  if (ws === "preserve") return v;
  if (ws === "replace") return replaceWhitespace(v);
  return collapseWhitespace(v);
}
function compareDecimals(a, b) {
  const aNeg = a.startsWith("-");
  const bNeg = b.startsWith("-");
  if (aNeg && !bNeg) return -1;
  if (!aNeg && bNeg) return 1;
  const absA = a.replace(/^[+-]/, "");
  const absB = b.replace(/^[+-]/, "");
  const [intA, fracA = ""] = absA.split(".");
  const [intB, fracB = ""] = absB.split(".");
  const iA = intA.replace(/^0+/, "") || "0";
  const iB = intB.replace(/^0+/, "") || "0";
  let cmp = 0;
  if (iA.length !== iB.length) {
    cmp = iA.length > iB.length ? 1 : -1;
  } else {
    cmp = iA < iB ? -1 : iA > iB ? 1 : 0;
  }
  if (cmp === 0) {
    const maxLen = Math.max(fracA.length, fracB.length);
    const fA = fracA.padEnd(maxLen, "0");
    const fB = fracB.padEnd(maxLen, "0");
    cmp = fA < fB ? -1 : fA > fB ? 1 : 0;
  }
  return aNeg ? -cmp : cmp;
}
function compareArrays(a, b) {
  for (let i = 0; i < a.length; i++) {
    if (a[i] < b[i]) return -1;
    if (a[i] > b[i]) return 1;
  }
  return 0;
}
function parseGMonthDay(v) {
  const m = v.trim().match(/^--(\d{2})-(\d{2})/);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : null;
}
function parseGDay(v) {
  const m = v.trim().match(/^---(\d{2})/);
  return m ? [parseInt(m[1], 10)] : null;
}
function parseGMonth(v) {
  const m = v.trim().match(/^--(\d{2})/);
  return m ? [parseInt(m[1], 10)] : null;
}
function parseGYear(v) {
  const m = v.trim().match(/^(-?\d{4,})/);
  return m ? [parseInt(m[1], 10)] : null;
}
function parseGYearMonth(v) {
  const m = v.trim().match(/^(-?\d{4,})-(\d{2})/);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : null;
}
function parseDate(v) {
  const m = v.trim().match(/^(-?\d{4,})-(\d{2})-(\d{2})/);
  return m ? [parseInt(m[1], 10), parseInt(m[2], 10), parseInt(m[3], 10)] : null;
}
function parseTzOffset(v) {
  const m = v.match(/(Z|([+-])(\d{2}):(\d{2}))\s*$/);
  if (!m) return null;
  if (m[1] === "Z") return 0;
  const sign = m[2] === "+" ? 1 : -1;
  return sign * (parseInt(m[3], 10) * 60 + parseInt(m[4], 10));
}
function parseTime(v) {
  const m = v.trim().match(/^(\d{2}):(\d{2}):(\d{2})(\.\d+)?/);
  if (!m) return null;
  let h = parseInt(m[1], 10), mi = parseInt(m[2], 10), s = parseFloat(m[3] + (m[4] || ""));
  const tz = parseTzOffset(v);
  if (tz !== null && tz !== 0) {
    mi -= tz;
    while (mi < 0) {
      mi += 60;
      h--;
    }
    while (mi >= 60) {
      mi -= 60;
      h++;
    }
    h = (h % 24 + 24) % 24;
  }
  return [h, mi, s];
}
function parseDateTime(v) {
  const m = v.trim().match(/^(-?\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(\.\d+)?/);
  if (!m) return null;
  let Y = parseInt(m[1], 10), M = parseInt(m[2], 10), D = parseInt(m[3], 10);
  let h = parseInt(m[4], 10), mi = parseInt(m[5], 10), s = parseFloat(m[6] + (m[7] || ""));
  const tz = parseTzOffset(v);
  if (tz !== null && tz !== 0) {
    mi -= tz;
    while (mi < 0) {
      mi += 60;
      h--;
    }
    while (mi >= 60) {
      mi -= 60;
      h++;
    }
    while (h < 0) {
      h += 24;
      D--;
    }
    while (h >= 24) {
      h -= 24;
      D++;
    }
    if (D < 1) {
      M--;
      D = 28;
    }
    if (D > 31) {
      M++;
      D = 1;
    }
    if (M < 1) {
      Y--;
      M = 12;
    }
    if (M > 12) {
      Y++;
      M = 1;
    }
  }
  return [Y, M, D, h, mi, s];
}
var DATE_TYPES = {
  gMonthDay: parseGMonthDay,
  gDay: parseGDay,
  gMonth: parseGMonth,
  gYear: parseGYear,
  gYearMonth: parseGYearMonth,
  date: parseDate,
  time: parseTime,
  dateTime: parseDateTime
};
function compareValues(a, b, baseName) {
  const parser = DATE_TYPES[baseName];
  if (parser) {
    const pa = parser(a);
    const pb = parser(b);
    if (pa && pb) return compareArrays(pa, pb);
    return NaN;
  }
  if (baseName === "double" || baseName === "float") {
    const na = Number(a);
    const nb = Number(b);
    if (!isNaN(na) && !isNaN(nb)) return na < nb ? -1 : na > nb ? 1 : 0;
  }
  return compareDecimals(a, b);
}
function childElements(node) {
  const result = [];
  for (let i = 0; i < node.childNodes.length; i++) {
    if (node.childNodes[i].nodeType === 1) result.push(node.childNodes[i]);
  }
  return result;
}
function hasNonWhitespaceText(node) {
  for (let i = 0; i < node.childNodes.length; i++) {
    const ch = node.childNodes[i];
    if ((ch.nodeType === 3 || ch.nodeType === 4) && /\S/.test(ch.nodeValue)) return true;
  }
  return false;
}
function textContent(node) {
  let text = "";
  for (let i = 0; i < node.childNodes.length; i++) {
    const ch = node.childNodes[i];
    if (ch.nodeType === 3 || ch.nodeType === 4) text += ch.nodeValue;
  }
  return text;
}
function xpathOf(node, indexCache) {
  const parts = [];
  let n = node;
  while (n && n.nodeType === 1) {
    const local = n.localName || n.nodeName;
    const name = n.prefix ? `${n.prefix}:${local}` : local;
    parts.unshift(`${name}[${siblingIndexOf(n, indexCache)}]`);
    n = n.parentNode;
  }
  return "/" + parts.join("/");
}
function siblingIndexOf(node, indexCache) {
  const cached = indexCache && indexCache.get(node);
  if (cached !== void 0) return cached;
  const parent = node.parentNode;
  if (!parent) return 1;
  const counts = /* @__PURE__ */ new Map();
  let own = 1;
  for (let c = parent.firstChild; c; c = c.nextSibling) {
    if (c.nodeType !== 1) continue;
    const key = `${c.namespaceURI || ""}|${c.localName || c.nodeName}`;
    const i = (counts.get(key) || 0) + 1;
    counts.set(key, i);
    if (c === node) own = i;
    if (indexCache) indexCache.set(c, i);
  }
  return own;
}
function createValidator(ir) {
  const substitutionGroups = /* @__PURE__ */ new Map();
  for (const [name, decl] of ir.elements) {
    if (decl.substitutionGroup) {
      const head = decl.substitutionGroup;
      const headDecl = ir.elements.get(head);
      if (headDecl && headDecl.block) {
        const b = headDecl.block;
        if (b === "#all" || b === "substitution" || b.split(/\s+/).includes("substitution")) continue;
      }
      if (!substitutionGroups.has(head)) substitutionGroups.set(head, /* @__PURE__ */ new Set());
      substitutionGroups.get(head).add(name);
    }
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const [head, members] of substitutionGroups) {
      for (const member of members) {
        const memberDecl = ir.elements.get(member);
        if (memberDecl && memberDecl.block) {
          const b = memberDecl.block;
          if (b === "#all" || b === "substitution" || b.split(/\s+/).includes("substitution")) continue;
        }
        const subMembers = substitutionGroups.get(member);
        if (subMembers) {
          for (const sub of subMembers) {
            if (!members.has(sub)) {
              members.add(sub);
              changed = true;
            }
          }
        }
      }
    }
  }
  let _idValues = null;
  let _idrefValues = null;
  let _keyValueStore = null;
  let _xpathIndexCache = null;
  return function validate2(doc) {
    const errors = [];
    _idValues = /* @__PURE__ */ new Set();
    _idrefValues = [];
    _keyValueStore = /* @__PURE__ */ new Map();
    _xpathIndexCache = /* @__PURE__ */ new WeakMap();
    const root = doc.nodeType === 9 ? doc.documentElement : doc;
    validateElement2(root, null, ir, errors);
    for (const { value, path } of _idrefValues) {
      if (!_idValues.has(value)) {
        errors.push({ message: `IDREF '${value}' does not match any ID`, xpath: path });
      }
    }
    _idValues = null;
    _idrefValues = null;
    _keyValueStore = null;
    _xpathIndexCache = null;
    return { valid: errors.length === 0, errors };
  };
  function trackIdType(typeName, value, path, errors) {
    if (!_idValues) return;
    if (derivesFromBuiltin(typeName, "ID")) {
      if (_idValues.has(value)) {
        errors.push({ message: `Duplicate ID value '${value}'`, xpath: path });
      } else {
        _idValues.add(value);
      }
    } else if (derivesFromBuiltin(typeName, "IDREF")) {
      if (_idrefValues) _idrefValues.push({ value, path });
    } else if (typeName === "IDREFS") {
      if (_idrefValues) {
        for (const v of value.split(/\s+/)) {
          if (v) _idrefValues.push({ value: v, path });
        }
      }
    }
  }
  function derivesFromBuiltin(typeName, target) {
    let t = typeName;
    while (t) {
      if (t === target) return true;
      t = BUILTIN_BASE[t] || null;
    }
    return false;
  }
  function isBlocked(blockAttr, derivMethod) {
    if (blockAttr === "#all") return true;
    const blocked = blockAttr.split(/\s+/);
    return blocked.includes(derivMethod);
  }
  function getDerivationMethod(xsiTypeDef, elementDecl, ir2) {
    if (!xsiTypeDef || xsiTypeDef.kind !== "complexType") return null;
    let current = xsiTypeDef;
    const declaredTypeName = elementDecl.type ? elementDecl.type.local : null;
    const visited = /* @__PURE__ */ new Set();
    while (current && current.derivation) {
      const name = current.name;
      if (visited.has(name)) break;
      visited.add(name);
      const derivType = current.derivation.type;
      const baseName = current.derivation.base ? current.derivation.base.local : null;
      if (baseName === declaredTypeName) {
        if (derivType === "extension" || derivType === "simpleContent-extension") return "extension";
        if (derivType === "restriction" || derivType === "simpleContent-restriction") return "restriction";
      }
      current = current.derivation.base ? resolveType(current.derivation.base) : null;
      if (current && current.kind !== "complexType") break;
    }
    return null;
  }
  function isDerivationBlocked(xsiTypeDef, declaredTypeName, blockedStr) {
    if (!xsiTypeDef || !declaredTypeName || !blockedStr) return false;
    const blockedAll = blockedStr === "#all";
    const blocked = blockedAll ? null : blockedStr.split(/\s+/);
    let current = xsiTypeDef;
    const visited = /* @__PURE__ */ new Set();
    while (current) {
      const name = current.name;
      if (visited.has(name)) break;
      visited.add(name);
      if (name === declaredTypeName) break;
      if (current.derivation) {
        const derivType = current.derivation.type;
        let method = null;
        if (derivType === "extension" || derivType === "simpleContent-extension") method = "extension";
        else if (derivType === "restriction" || derivType === "simpleContent-restriction") method = "restriction";
        if (method && (blockedAll || blocked.includes(method))) return true;
        const baseName = current.derivation.base ? current.derivation.base.local : null;
        if (baseName === declaredTypeName) break;
        current = current.derivation.base ? resolveType(current.derivation.base) : null;
        if (current && current.kind !== "complexType") break;
      } else {
        if (current.kind === "complexType" && declaredTypeName === "anyType") {
          if (blockedAll || blocked.includes("restriction")) return true;
        }
        break;
      }
    }
    return false;
  }
  function isTypeDerivedFrom(typeDef, targetTypeName, ir2) {
    if (!typeDef || !targetTypeName) return false;
    if (targetTypeName === "anyType" || targetTypeName === "anySimpleType") return true;
    if (typeDef.name === targetTypeName) return true;
    if (typeDef.kind === "builtin") {
      let name = typeDef.name;
      while (name) {
        if (name === targetTypeName) return true;
        name = BUILTIN_BASE[name] || null;
      }
      return false;
    }
    if (typeDef.kind === "complexType" && typeDef.derivation) {
      const visited = /* @__PURE__ */ new Set();
      let current = typeDef;
      while (current && current.derivation) {
        if (visited.has(current.name)) break;
        visited.add(current.name);
        const baseName = current.derivation.base ? current.derivation.base.local : null;
        if (baseName === targetTypeName) return true;
        if (baseName === "anyType") return true;
        current = current.derivation.base ? resolveType(current.derivation.base) : null;
        if (!current || current.kind === "builtin") {
          if (current && current.kind === "builtin") {
            return isTypeDerivedFrom(current, targetTypeName, ir2);
          }
          break;
        }
      }
    }
    if (typeDef.kind === "simpleType") {
      const visited = /* @__PURE__ */ new Set();
      let current = typeDef;
      while (current) {
        if (visited.has(current.name)) break;
        visited.add(current.name);
        let baseName = null;
        if (current.base) {
          baseName = current.base.local || current.base;
        }
        if (!baseName) break;
        if (baseName === targetTypeName) return true;
        let builtinWalk = baseName;
        while (builtinWalk) {
          if (builtinWalk === targetTypeName) return true;
          builtinWalk = BUILTIN_BASE[builtinWalk] || null;
        }
        const baseType = ir2.types.get(baseName);
        if (!baseType || baseType.kind !== "simpleType") break;
        current = baseType;
      }
    }
    const targetType = ir2.types.get(targetTypeName);
    if (targetType && targetType.kind === "simpleType" && targetType.memberTypes) {
      for (const mt of targetType.memberTypes) {
        const memberName = mt.local || mt;
        if (typeDef.name === memberName) return true;
        const memberType = ir2.types.get(memberName);
        if (memberType && isTypeDerivedFrom(typeDef, memberName, ir2)) return true;
      }
    }
    return false;
  }
  function resolveType(typeQN) {
    if (!typeQN) return null;
    if (typeQN.ns === XSD_NS2) {
      if (typeQN.local === "anyType") return null;
      return { kind: "builtin", name: typeQN.local };
    }
    if (ir.nsTypes) {
      const nsKey = "{" + (typeQN.ns || "") + "}" + typeQN.local;
      const nsType = ir.nsTypes.get(nsKey);
      if (nsType) return nsType;
    }
    return ir.types.get(typeQN.local) || null;
  }
  function resolveElementRef(particle) {
    if (particle.ref) {
      return ir.elements.get(particle.ref) || null;
    }
    return particle;
  }
  function resolveGroup(particle) {
    if (particle.kind === "groupRef") {
      return ir.groups.get(particle.ref) || null;
    }
    return particle;
  }
  function resolveAttributes(attrs, seen) {
    if (!seen) seen = /* @__PURE__ */ new Set();
    const result = [];
    for (const a of attrs) {
      if (a.kind === "attributeGroupRef") {
        if (seen.has(a.ref)) continue;
        seen.add(a.ref);
        const ag = ir.attributeGroups.get(a.ref);
        if (ag) {
          const groupAttrs = resolveAttributes(ag.attributes, seen);
          result.push(...groupAttrs.filter((a2) => a2.use !== "prohibited"));
        }
      } else if (a.kind === "attribute" && a.ref) {
        const ga = ir.globalAttributes && ir.globalAttributes.get(a.ref);
        if (ga) {
          const merged = { ...ga, use: a.use || ga.use, form: "qualified" };
          if (a.fixed !== null && a.fixed !== void 0) merged.fixed = a.fixed;
          if (a.default !== null && a.default !== void 0) merged.default = a.default;
          result.push(merged);
        } else {
          result.push(a);
        }
      } else {
        result.push(a);
      }
    }
    return result;
  }
  function getEffectiveContent(typeDef, seen) {
    if (!typeDef.derivation) return typeDef.content;
    const d = typeDef.derivation;
    if (d.type === "extension" && d.base) {
      const baseType = resolveType(d.base);
      if (baseType && baseType.kind === "complexType") {
        if (!seen) seen = /* @__PURE__ */ new Set();
        const key = baseType.name || d.base.local;
        if (seen.has(key)) return d.content || typeDef.content;
        seen.add(key);
        const baseContent = getEffectiveContent(baseType, seen);
        if (baseContent && d.content) {
          return {
            kind: "sequence",
            minOccurs: 1,
            maxOccurs: 1,
            particles: [baseContent, d.content]
          };
        }
        return d.content || baseContent || null;
      }
    }
    if (d.type === "restriction") {
      return d.content || null;
    }
    return d.content || typeDef.content;
  }
  function getEffectiveAttributes(typeDef, seen) {
    if (!typeDef.derivation) return typeDef.attributes || [];
    const d = typeDef.derivation;
    const isRestriction = d.type === "restriction" || d.type === "simpleContent-restriction";
    const isExtension = d.type === "extension" || d.type === "simpleContent-extension";
    if ((isExtension || isRestriction) && d.base) {
      const baseType = resolveType(d.base);
      if (baseType && baseType.kind === "complexType") {
        if (!seen) seen = /* @__PURE__ */ new Set();
        const key = baseType.name || d.base.local;
        if (seen.has(key)) return [...d.attributes || [], ...typeDef.attributes || []];
        seen.add(key);
        const baseAttrs = getEffectiveAttributes(baseType, seen);
        if (isRestriction) {
          const derivedAttrs2 = d.attributes || [];
          const derivedNames2 = new Set(derivedAttrs2.map((a) => a.name).filter(Boolean));
          const derivedHasAnyAttr = derivedAttrs2.some((a) => a.kind === "anyAttribute");
          const kept = baseAttrs.filter((a) => {
            if (a.kind === "anyAttribute") return false;
            return !a.name || !derivedNames2.has(a.name);
          });
          if (derivedHasAnyAttr) {
            return [...kept, ...derivedAttrs2];
          }
          return [...kept, ...derivedAttrs2, { kind: "anyAttribute", namespace: "", processContents: "strict" }];
        }
        const derivedAttrs = d.attributes || [];
        const derivedNames = new Set(derivedAttrs.filter((a) => a.name).map((a) => a.name));
        const filteredBase = baseAttrs.filter((a) => !a.name || !derivedNames.has(a.name));
        const baseAnyAttr = filteredBase.find((a) => a.kind === "anyAttribute");
        const derivedAnyAttr = derivedAttrs.find((a) => a.kind === "anyAttribute");
        if (baseAnyAttr && derivedAnyAttr) {
          const merged = mergeAnyAttrConstraints(baseAnyAttr, derivedAnyAttr);
          const result = filteredBase.filter((a) => a.kind !== "anyAttribute");
          result.push(...derivedAttrs.filter((a) => a.kind !== "anyAttribute"));
          result.push(merged);
          return result;
        }
        return [...filteredBase, ...derivedAttrs];
      }
    }
    return [...d.attributes || [], ...typeDef.attributes || []];
  }
  function validateElement2(node, elementDecl, schema, errors) {
    const path = xpathOf(node, _xpathIndexCache);
    const localName = node.localName || node.nodeName;
    if (!elementDecl) {
      const nodeNs = node.namespaceURI || null;
      elementDecl = findElementDecl(localName, nodeNs, schema);
      if (!elementDecl) {
        const xsiTypeAttr = node.getAttributeNS ? node.getAttributeNS(XSI_NS, "type") : node.getAttribute("xsi:type");
        if (xsiTypeAttr) {
          elementDecl = { kind: "element", name: localName, type: null, inlineType: null };
        } else {
          errors.push({ message: `Unknown element '${localName}'`, xpath: path });
          return;
        }
      }
    }
    if (elementDecl.abstract) {
      errors.push({ message: `Element '${localName}' is abstract and cannot be used directly`, xpath: path });
      return;
    }
    const xsiNil = node.getAttributeNS ? node.getAttributeNS(XSI_NS, "nil") : node.getAttribute("xsi:nil");
    if (xsiNil !== null && xsiNil !== void 0) {
      if (!elementDecl.nillable) {
        errors.push({ message: `Element '${localName}' is not nillable but xsi:nil was specified`, xpath: path });
        return;
      }
      if (xsiNil === "true" || xsiNil === "1") {
        const children = childElements(node);
        if (children.length > 0 || hasNonWhitespaceText(node)) {
          errors.push({ message: `Nilled element '${localName}' must have no content`, xpath: path });
        }
        if (elementDecl.fixed !== null && elementDecl.fixed !== void 0) {
          errors.push({ message: `Nilled element '${localName}' must not have a fixed value constraint`, xpath: path });
        }
        const nilXsiTypeRaw = node.getAttributeNS ? node.getAttributeNS(XSI_NS, "type") : node.getAttribute("xsi:type");
        const nilXsiType = nilXsiTypeRaw ? nilXsiTypeRaw.trim() : null;
        if (nilXsiType) {
          const colon = nilXsiType.indexOf(":");
          const nilTypeLocal = colon >= 0 ? nilXsiType.substring(colon + 1) : nilXsiType;
          const nilTypeNs = colon >= 0 ? node.lookupNamespaceURI ? node.lookupNamespaceURI(nilXsiType.substring(0, colon)) : null : null;
          const isSimpleBuiltin = (nilTypeNs === XSD_NS2 || !nilTypeNs) && BUILTIN_TYPES[nilTypeLocal];
          const isSimpleUserType = ir.types.get(nilTypeLocal);
          if (isSimpleBuiltin || isSimpleUserType && isSimpleUserType.kind === "simpleType") {
            for (let i = 0; i < node.attributes.length; i++) {
              const attr = node.attributes[i];
              const an = attr.localName || attr.name;
              if (an === "xmlns" || attr.name.startsWith("xmlns:")) continue;
              if (attr.namespaceURI === XSI_NS) continue;
              errors.push({ message: `Attribute '${attr.name}' not allowed on simple type '${nilXsiType}'`, xpath: `${path}/@${attr.name}` });
            }
          }
        }
        return;
      }
    }
    let typeDef = null;
    const xsiTypeRaw = node.getAttributeNS ? node.getAttributeNS(XSI_NS, "type") : node.getAttribute("xsi:type");
    const xsiType = xsiTypeRaw ? xsiTypeRaw.trim() : null;
    if (xsiType && xsiType !== "") {
      const idx = xsiType.indexOf(":");
      let typeQN;
      if (idx >= 0) {
        const prefix = xsiType.substring(0, idx);
        const local = xsiType.substring(idx + 1);
        const ns = node.lookupNamespaceURI ? node.lookupNamespaceURI(prefix) : null;
        typeQN = { ns, local };
      } else {
        let defaultNs = node.lookupNamespaceURI ? node.lookupNamespaceURI(null) : null;
        if (!defaultNs) {
          const xmlnsAttr = node.getAttribute ? node.getAttribute("xmlns") : null;
          if (xmlnsAttr) defaultNs = xmlnsAttr;
        }
        typeQN = { ns: defaultNs, local: xsiType };
      }
      typeDef = resolveType(typeQN);
      const tns = ir.targetNamespace || null;
      if (typeDef && typeQN.ns && typeQN.ns !== XSD_NS2 && typeQN.ns !== tns) {
        const nsKey = "{" + typeQN.ns + "}" + typeQN.local;
        if (!ir.nsTypes || !ir.nsTypes.has(nsKey)) {
          typeDef = null;
        }
      }
      if (!typeDef && typeQN.ns && typeQN.ns === tns) {
        typeDef = resolveType({ ns: null, local: typeQN.local });
        if (typeDef) typeQN = { ns: null, local: typeQN.local };
      }
      if (!typeDef) {
        const isXsdNs = !typeQN.ns || typeQN.ns === XSD_NS2;
        const isBuiltin = isXsdNs && (BUILTIN_TYPES[typeQN.local] || typeQN.local === "anyType" || typeQN.local === "anySimpleType");
        if (!isBuiltin) {
          errors.push({ message: `Unknown type '${xsiType}' specified in xsi:type`, xpath: path });
          return;
        }
        if (typeQN.local === "anyType") {
          const declType = elementDecl.type;
          if (declType) {
            const declLocal = declType.local || declType;
            if (declLocal === "anySimpleType" || BUILTIN_TYPES[declLocal]) {
              errors.push({ message: `Type '${xsiType}' is not derived from the declared type of element '${localName}'`, xpath: path });
              return;
            }
          }
        }
      }
      if (typeDef && typeDef.abstract) {
        errors.push({ message: `Type '${xsiType}' is abstract and cannot be used as xsi:type`, xpath: path });
        return;
      }
      if (typeDef) {
        const declaredTypeName = elementDecl.type ? elementDecl.type.local : null;
        const xsiTypeName = typeQN.local;
        const isSameType = declaredTypeName && xsiTypeName === declaredTypeName;
        if (!isSameType && declaredTypeName) {
          const isDerived = isTypeDerivedFrom(typeDef, declaredTypeName, ir);
          if (!isDerived) {
            errors.push({ message: `Type '${xsiType}' is not derived from the declared type of element '${localName}'`, xpath: path });
            return;
          }
        }
        if (!isSameType) {
          const blocked = elementDecl.block !== null ? elementDecl.block || null : ir.blockDefault || null;
          if (blocked) {
            if (blocked === "#all") {
              errors.push({ message: `Type '${xsiType}' is blocked from substituting for element '${localName}' (block='${blocked}')`, xpath: path });
              return;
            }
            const derivMethod = getDerivationMethod(typeDef, elementDecl, ir);
            if (derivMethod && isBlocked(blocked, derivMethod)) {
              errors.push({ message: `Type '${xsiType}' is blocked from substituting for element '${localName}' (block='${blocked}')`, xpath: path });
              return;
            }
            if (isDerivationBlocked(typeDef, declaredTypeName || "anyType", blocked)) {
              errors.push({ message: `Type '${xsiType}' is blocked from substituting for element '${localName}' (block='${blocked}')`, xpath: path });
              return;
            }
            if (!derivMethod && typeDef.kind !== "complexType" && blocked.includes("restriction")) {
              errors.push({ message: `Type '${xsiType}' is blocked from substituting for element '${localName}' (block='${blocked}')`, xpath: path });
              return;
            }
          }
          if (declaredTypeName) {
            const declaredType = ir.types.get(declaredTypeName) || null;
            const isComplexType = declaredType && declaredType.kind === "complexType";
            const typeBlockAttr = isComplexType && declaredType.block !== null && declaredType.block !== void 0 ? declaredType.block : null;
            const typeBlocked0 = typeBlockAttr !== null ? typeBlockAttr || null : isComplexType ? ir.blockDefault || null : null;
            if (typeBlocked0) {
              const typeBlocked = typeBlocked0;
              if (typeBlocked === "#all") {
                errors.push({ message: `Type '${xsiType}' is blocked by type '${declaredTypeName}' (block='${typeBlocked}')`, xpath: path });
                return;
              }
              const derivMethod = getDerivationMethod(typeDef, elementDecl, ir);
              if (derivMethod && isBlocked(typeBlocked, derivMethod)) {
                errors.push({ message: `Type '${xsiType}' is blocked by type '${declaredTypeName}' (block='${typeBlocked}')`, xpath: path });
                return;
              }
              if (isDerivationBlocked(typeDef, declaredTypeName, typeBlocked)) {
                errors.push({ message: `Type '${xsiType}' is blocked by type '${declaredTypeName}' (block='${typeBlocked}')`, xpath: path });
                return;
              }
            }
          }
        }
      }
    }
    if (!typeDef) {
      if (elementDecl.alternatives) {
        const alt = elementDecl.alternatives.find((a) => a.test === null || evalTest(a.test, node));
        if (alt && alt.type) typeDef = resolveType(alt.type);
      } else if (elementDecl.inlineType) {
        typeDef = elementDecl.inlineType;
      } else if (elementDecl.type) {
        typeDef = resolveType(elementDecl.type);
      } else if (elementDecl.substitutionGroup) {
        const headDecl = ir.elements.get(elementDecl.substitutionGroup);
        if (headDecl) {
          if (headDecl.inlineType) {
            typeDef = headDecl.inlineType;
          } else if (headDecl.type) {
            typeDef = resolveType(headDecl.type);
          }
        }
      }
    }
    node._xsdPrimitiveType = resolvePrimitiveFamily(elementDecl, typeDef);
    if (typeDef && typeDef.abstract && !xsiType) {
      errors.push({ message: `Element '${localName}' uses abstract type '${elementDecl.type ? elementDecl.type.local : ""}' and must specify xsi:type`, xpath: path });
      return;
    }
    if (elementDecl.fixed !== null && elementDecl.fixed !== void 0) {
      const children = childElements(node);
      if (children.length > 0) {
        errors.push({ message: `Element '${localName}' has fixed value but contains child elements`, xpath: path });
      } else {
        const elTypeName = elementDecl.type && elementDecl.type.ns === XSD_NS2 ? elementDecl.type.local : null;
        const effectiveTypeDef = typeDef || (elementDecl.inlineType && elementDecl.inlineType.kind === "simpleType" ? elementDecl.inlineType : null);
        const rawValue = textContent(node);
        if (effectiveTypeDef && effectiveTypeDef.variety === "union" && rawValue !== "") {
          if (!unionFixedValueMatch(rawValue, elementDecl.fixed, effectiveTypeDef)) {
            errors.push({ message: `Element '${localName}' must have fixed value '${elementDecl.fixed}', got '${rawValue}'`, xpath: path });
          }
        } else {
          const ws = getWhitespaceModeForType(elTypeName, effectiveTypeDef);
          const value = normalizeByWhitespace(rawValue, ws);
          const fixedNorm = normalizeByWhitespace(elementDecl.fixed, ws);
          if (value !== "" && value !== fixedNorm) {
            if (!valueSpaceEqual(value, fixedNorm, effectiveTypeDef)) {
              errors.push({ message: `Element '${localName}' must have fixed value '${elementDecl.fixed}', got '${value}'`, xpath: path });
            }
          }
        }
      }
    }
    const effectiveDefault = elementDecl.default || elementDecl.fixed || null;
    if (elementDecl.identityConstraints) {
      collectKeyValues(node, elementDecl.identityConstraints, path, errors);
    }
    if (typeDef) {
      if (typeDef.kind === "builtin") {
        validateSimpleContent(node, typeDef.name, null, path, errors, effectiveDefault);
      } else if (typeDef.kind === "simpleType") {
        validateSimpleType2(node, typeDef, path, errors, effectiveDefault);
      } else if (typeDef.kind === "complexType") {
        validateComplexType2(node, typeDef, path, errors);
        if (typeDef.asserts) {
          for (const a of typeDef.asserts) {
            if (!evalTest(a.test, node)) {
              errors.push({ message: `Assertion failed: ${a.test}`, xpath: path });
            }
          }
        }
      }
    } else {
      const children = childElements(node);
      for (const child of children) {
        const childLocal = child.localName || child.nodeName;
        const childNs = child.namespaceURI || null;
        const childDecl = findElementDecl(childLocal, childNs, ir);
        if (childDecl) {
          validateElement2(child, childDecl, ir, errors);
        } else {
          const grandChildren = childElements(child);
          for (const gc of grandChildren) {
            const gcLocal = gc.localName || gc.nodeName;
            const gcNs = gc.namespaceURI || null;
            const gcDecl = findElementDecl(gcLocal, gcNs, ir);
            if (gcDecl) validateElement2(gc, gcDecl, ir, errors);
          }
        }
      }
    }
    if (elementDecl.identityConstraints) {
      checkKeyrefs(node, elementDecl.identityConstraints, path, errors);
    }
  }
  function valueSpaceEqual(val1, val2, typeDef) {
    if (val1 === val2) return true;
    if (!typeDef) return false;
    if (typeDef.kind === "simpleType" && typeDef.variety === "union") {
      const members = typeDef.memberTypes || [];
      const firstMember1 = findFirstValidMember(val1, members);
      const firstMember2 = findFirstValidMember(val2, members);
      if (firstMember1 !== null && firstMember1 === firstMember2) {
        const mt = members[firstMember1];
        const builtinName = mt.ns === XSD_NS2 ? mt.local : null;
        if (builtinName) {
          if (numericValueEqual(val1, val2, builtinName)) return true;
          if (booleanValueEqual(val1, val2, builtinName)) return true;
        }
      }
    }
    if (typeDef.kind === "simpleType" && typeDef.base) {
      const builtinName = typeDef.base.ns === XSD_NS2 ? typeDef.base.local : null;
      if (builtinName) {
        if (numericValueEqual(val1, val2, builtinName)) return true;
        if (booleanValueEqual(val1, val2, builtinName)) return true;
      }
    }
    return false;
  }
  function unionFixedValueMatch(rawValue, fixedValue, unionTypeDef) {
    const members = unionTypeDef.memberTypes || [];
    for (const mt of members) {
      const builtinName = mt.ns === XSD_NS2 ? mt.local : null;
      if (!builtinName) {
        const resolved = resolveType(mt);
        if (resolved) {
          const ws2 = getWhitespaceMode(resolved);
          const valNorm2 = normalizeByWhitespace(rawValue, ws2);
          const fixedNorm2 = normalizeByWhitespace(fixedValue, ws2);
          if (valNorm2 === fixedNorm2) return true;
        }
        continue;
      }
      const validator = BUILTIN_TYPES[builtinName];
      const ws = getWhitespaceModeForType(builtinName, null);
      const valNorm = normalizeByWhitespace(rawValue, ws);
      const fixedNorm = normalizeByWhitespace(fixedValue, ws);
      if (validator && validator(valNorm)) {
        if (valNorm === fixedNorm) return true;
        if (numericValueEqual(valNorm, fixedNorm, builtinName)) return true;
        if (booleanValueEqual(valNorm, fixedNorm, builtinName)) return true;
        return false;
      }
    }
    return false;
  }
  function findFirstValidMember(value, members) {
    for (let i = 0; i < members.length; i++) {
      const mt = members[i];
      const builtinName = mt.ns === XSD_NS2 ? mt.local : null;
      if (builtinName) {
        const validator = BUILTIN_TYPES[builtinName];
        if (validator && validator(value)) return i;
      }
    }
    return null;
  }
  function numericValueEqual(a, b, typeName) {
    const numTypes = /* @__PURE__ */ new Set([
      "float",
      "double",
      "decimal",
      "integer",
      "int",
      "long",
      "short",
      "byte",
      "nonNegativeInteger",
      "positiveInteger",
      "nonPositiveInteger",
      "negativeInteger",
      "unsignedInt",
      "unsignedLong",
      "unsignedShort",
      "unsignedByte"
    ]);
    if (!numTypes.has(typeName)) return false;
    const na = Number(a), nb = Number(b);
    if (isNaN(na) || isNaN(nb)) return false;
    return na === nb;
  }
  function booleanValueEqual(a, b, typeName) {
    if (typeName !== "boolean") return false;
    const boolMap = { "true": true, "1": true, "false": false, "0": false };
    if (!(a in boolMap) || !(b in boolMap)) return false;
    return boolMap[a] === boolMap[b];
  }
  function findElementDecl(localName, nodeNs, schema) {
    if (schema.nsElements) {
      const nsKey = "{" + (nodeNs || "") + "}" + localName;
      const nsDecl = schema.nsElements.get(nsKey);
      if (nsDecl) return nsDecl;
    }
    const decl = schema.elements.get(localName);
    if (!decl) return null;
    if (schema.targetNamespace) {
      if (nodeNs !== schema.targetNamespace) return null;
    } else {
      if (nodeNs) return null;
    }
    return decl;
  }
  function validateSimpleContent(node, typeName, facets, path, errors, defaultValue) {
    const children = childElements(node);
    if (children.length > 0) {
      errors.push({ message: `Element has child elements but type '${typeName}' is simple`, xpath: path });
      return;
    }
    let value = textContent(node);
    if (value === "" && defaultValue) value = defaultValue;
    value = collapseWhitespace(value);
    const validator = BUILTIN_TYPES[typeName];
    if (validator && !validator(value)) {
      errors.push({ message: `Value '${value}' is not valid for type '${typeName}'`, xpath: path });
      return;
    }
    trackIdType(typeName, value, path, errors);
    if (facets) {
      validateFacets2(value, typeName, facets, path, errors);
    }
  }
  function validateSimpleType2(node, typeDef, path, errors, defaultValue) {
    const children = childElements(node);
    if (children.length > 0) {
      errors.push({ message: `Element has child elements but type is simple`, xpath: path });
      return;
    }
    let value = textContent(node);
    if (value === "" && defaultValue) value = defaultValue;
    const wsMode = getWhitespaceMode(typeDef);
    if (wsMode === "preserve") {
    } else if (wsMode === "replace") {
      value = replaceWhitespace(value);
    } else {
      value = collapseWhitespace(value);
    }
    validateSimpleTypeValue(value, typeDef, path, errors);
  }
  function validateSimpleTypeValue(value, typeDef, path, errors) {
    if (typeDef.variety === "restriction") {
      const baseName = typeDef.base ? typeDef.base.local : "string";
      let isList = false;
      if (typeDef.base && typeDef.base.ns === XSD_NS2) {
        const validator = BUILTIN_TYPES[baseName];
        if (validator && !validator(value)) {
          errors.push({ message: `Value '${value}' is not valid for base type '${baseName}'`, xpath: path });
          return;
        }
        trackIdType(baseName, value, path, errors);
      } else if (typeDef.base) {
        const baseType = resolveType(typeDef.base);
        if (baseType && baseType.kind === "simpleType") {
          if (baseType.variety === "list") isList = true;
          const errsBefore = errors.length;
          validateSimpleTypeValue(value, baseType, path, errors);
          if (errors.length > errsBefore) return;
        }
      } else if (typeDef.inlineBase) {
        if (typeDef.inlineBase.variety === "list") isList = true;
        const errsBefore = errors.length;
        validateSimpleTypeValue(value, typeDef.inlineBase, path, errors);
        if (errors.length > errsBefore) return;
      }
      if (typeDef.facets) {
        validateFacets2(value, baseName, typeDef.facets, path, errors, isList);
      }
    } else if (typeDef.variety === "list") {
      const resolvedItemType = typeDef.itemType ? resolveType(typeDef.itemType) : null;
      const effectiveItemType = resolvedItemType || typeDef.inlineItemType || null;
      if (effectiveItemType) {
        const items = value.trim() ? value.trim().split(/\s+/) : [];
        for (const item of items) {
          if (effectiveItemType.kind === "builtin") {
            const validator = BUILTIN_TYPES[effectiveItemType.name];
            if (validator && !validator(item)) {
              errors.push({ message: `List item '${item}' is not valid for type '${effectiveItemType.name}'`, xpath: path });
            }
          } else if (effectiveItemType.kind === "simpleType") {
            validateSimpleTypeValue(item, effectiveItemType, path, errors);
          }
        }
      }
    } else if (typeDef.variety === "union") {
      let matched = false;
      for (const memberQN of typeDef.memberTypes || []) {
        const memberType = resolveType(memberQN);
        if (!memberType) continue;
        const probeErrors = [];
        if (memberType.kind === "builtin") {
          const validator = BUILTIN_TYPES[memberType.name];
          if (validator && validator(value)) {
            matched = true;
            break;
          }
        } else if (memberType.kind === "simpleType") {
          validateSimpleTypeValue(value, memberType, "/", probeErrors);
          if (probeErrors.length === 0) {
            matched = true;
            break;
          }
        }
      }
      if (!matched && typeDef.inlineMembers) {
        for (const inlineSt of typeDef.inlineMembers) {
          const probeErrors = [];
          validateSimpleTypeValue(value, inlineSt, "/", probeErrors);
          if (probeErrors.length === 0) {
            matched = true;
            break;
          }
        }
      }
      if (!matched && (typeDef.memberTypes && typeDef.memberTypes.length || typeDef.inlineMembers && typeDef.inlineMembers.length)) {
        errors.push({ message: `Value '${value}' does not match any member type of union`, xpath: path });
      }
    }
  }
  function validateFacets2(value, baseName, facets, path, errors, isList) {
    const enums = [];
    let hasEnum = false;
    const patterns = [];
    for (const f of facets) {
      if (f.kind === "pattern") patterns.push(f.value);
    }
    if (patterns.length > 0) {
      let anyMatch = false;
      for (const p of patterns) {
        let jsPattern;
        try {
          jsPattern = translateXsdPattern(p);
        } catch {
          jsPattern = p;
        }
        try {
          const regex = new RegExp("^(" + jsPattern + ")$", "u");
          if (regex.test(value)) {
            anyMatch = true;
            break;
          }
        } catch {
          anyMatch = true;
          break;
        }
      }
      if (!anyMatch) {
        errors.push({ message: `Value '${value}' does not match pattern '${patterns[0]}'`, xpath: path });
      }
    }
    const isBuiltinList = isList || baseName === "NMTOKENS" || baseName === "IDREFS" || baseName === "ENTITIES";
    let lengthValue;
    if (isBuiltinList) {
      lengthValue = value.trim() ? value.trim().split(/\s+/).length : 0;
    } else if (baseName === "hexBinary") {
      lengthValue = Math.floor(value.trim().length / 2);
    } else if (baseName === "base64Binary") {
      const clean = value.replace(/[\s=]/g, "");
      lengthValue = Math.floor(clean.length * 3 / 4);
    } else {
      lengthValue = value.length;
    }
    for (const f of facets) {
      switch (f.kind) {
        case "enumeration":
          hasEnum = true;
          enums.push(f.value);
          break;
        case "minInclusive": {
          const cmp = compareValues(value.trim(), f.value, baseName);
          if (cmp < 0) {
            errors.push({ message: `Value '${value}' is less than minInclusive '${f.value}'`, xpath: path });
          }
          break;
        }
        case "maxInclusive": {
          const cmp = compareValues(value.trim(), f.value, baseName);
          if (cmp > 0) {
            errors.push({ message: `Value '${value}' exceeds maxInclusive '${f.value}'`, xpath: path });
          }
          break;
        }
        case "minExclusive": {
          const cmp = compareValues(value.trim(), f.value, baseName);
          if (cmp <= 0 && !isNaN(cmp)) {
            errors.push({ message: `Value '${value}' is not greater than minExclusive '${f.value}'`, xpath: path });
          }
          break;
        }
        case "maxExclusive": {
          const cmp = compareValues(value.trim(), f.value, baseName);
          if (cmp >= 0 && !isNaN(cmp)) {
            errors.push({ message: `Value '${value}' is not less than maxExclusive '${f.value}'`, xpath: path });
          }
          break;
        }
        case "minLength": {
          if (baseName !== "QName" && baseName !== "NOTATION" && lengthValue < Number(f.value)) {
            errors.push({ message: `Value length ${lengthValue} is less than minLength ${f.value}`, xpath: path });
          }
          break;
        }
        case "maxLength": {
          if (baseName !== "QName" && baseName !== "NOTATION" && lengthValue > Number(f.value)) {
            errors.push({ message: `Value length ${lengthValue} exceeds maxLength ${f.value}`, xpath: path });
          }
          break;
        }
        case "length": {
          if (baseName !== "QName" && baseName !== "NOTATION" && lengthValue !== Number(f.value)) {
            errors.push({ message: `Value length ${lengthValue} does not match length ${f.value}`, xpath: path });
          }
          break;
        }
        case "pattern":
          break;
        case "totalDigits": {
          const digits = value.replace(/[^0-9]/g, "").replace(/^0+/, "") || "0";
          if (digits.length > Number(f.value)) {
            errors.push({ message: `Value '${value}' has more than ${f.value} total digits`, xpath: path });
          }
          break;
        }
        case "fractionDigits": {
          const dot = value.indexOf(".");
          const frac = dot >= 0 ? value.substring(dot + 1).replace(/0+$/, "") : "";
          if (frac.length > Number(f.value)) {
            errors.push({ message: `Value '${value}' has more than ${f.value} fraction digits`, xpath: path });
          }
          break;
        }
        case "whiteSpace":
          break;
      }
    }
    if (hasEnum && !enums.includes(value)) {
      let enumMatch = false;
      if (DATE_TYPES[baseName]) {
        const normTz = (v) => v.replace(/([+-])00:00$/, "Z").replace(/-00:00$/, "Z");
        const normVal = normTz(value);
        enumMatch = enums.some((e) => normTz(e) === normVal);
      }
      if (!enumMatch) {
        errors.push({ message: `Value '${value}' is not in enumeration [${enums.join(", ")}]`, xpath: path });
      }
    }
  }
  function validateComplexType2(node, typeDef, path, errors) {
    if (typeDef.derivation) {
      const d = typeDef.derivation;
      if (d.type === "simpleContent-extension") {
        const children2 = childElements(node);
        if (children2.length > 0) {
          errors.push({ message: `Element has child elements but type has simpleContent`, xpath: path });
          return;
        }
        const attributes2 = getEffectiveAttributes(typeDef);
        if (d.base) {
          const baseType = resolveType(d.base);
          if (baseType) {
            const value = textContent(node);
            if (baseType.kind === "builtin") {
              const validator = BUILTIN_TYPES[baseType.name];
              if (validator && !validator(value)) {
                errors.push({ message: `Value '${value}' is not valid for type '${baseType.name}'`, xpath: path });
              }
            } else if (baseType.kind === "simpleType") {
              validateSimpleTypeValue(value, baseType, path, errors);
            } else if (baseType.kind === "complexType") {
              let cur = baseType;
              while (cur && cur.kind === "complexType" && cur.derivation) {
                if (cur.derivation.base) {
                  cur = resolveType(cur.derivation.base);
                } else break;
              }
              if (cur) {
                if (cur.kind === "builtin") {
                  const validator = BUILTIN_TYPES[cur.name];
                  if (validator && !validator(value)) {
                    errors.push({ message: `Value '${value}' is not valid for type '${cur.name}'`, xpath: path });
                  }
                } else if (cur.kind === "simpleType") {
                  validateSimpleTypeValue(value, cur, path, errors);
                }
              }
            }
          }
        }
        validateAttributeDefs(node, attributes2, path, errors);
        return;
      }
      if (d.type === "simpleContent-restriction") {
        const children2 = childElements(node);
        if (children2.length > 0) {
          errors.push({ message: `Element has child elements but type has simpleContent`, xpath: path });
          return;
        }
        const attributes2 = getEffectiveAttributes(typeDef);
        if (d.base) {
          const value = textContent(node);
          const baseType = resolveType(d.base);
          if (baseType) {
            if (baseType.kind === "builtin") {
              const validator = BUILTIN_TYPES[baseType.name];
              if (validator && !validator(value)) {
                errors.push({ message: `Value '${value}' is not valid for base type '${baseType.name}'`, xpath: path });
              }
            } else if (baseType.kind === "simpleType") {
              validateSimpleTypeValue(value, baseType, path, errors);
            } else if (baseType.kind === "complexType") {
              let cur = baseType;
              while (cur && cur.kind === "complexType" && cur.derivation) {
                const dd = cur.derivation;
                if (dd.base) {
                  cur = resolveType(dd.base);
                } else break;
              }
              if (cur) {
                if (cur.kind === "builtin") {
                  const validator = BUILTIN_TYPES[cur.name];
                  if (validator && !validator(value)) {
                    errors.push({ message: `Value '${value}' is not valid for base type '${cur.name}'`, xpath: path });
                  }
                } else if (cur.kind === "simpleType") {
                  validateSimpleTypeValue(value, cur, path, errors);
                }
              }
            }
          }
          if (d.facets) {
            const baseName = d.base.ns === XSD_NS2 ? d.base.local : "string";
            validateFacets2(value, baseName, d.facets, path, errors);
          }
        }
        validateAttributeDefs(node, attributes2, path, errors);
        return;
      }
    }
    const content = getEffectiveContent(typeDef);
    const attributes = getEffectiveAttributes(typeDef);
    const isMixed = typeDef.mixed;
    validateAttributeDefs(node, attributes, path, errors);
    const children = childElements(node);
    if (!content) {
      if (!isMixed && children.length > 0) {
        errors.push({ message: `Element should have no child elements`, xpath: path });
      }
      if (!isMixed && hasNonWhitespaceText(node)) {
        errors.push({ message: `Element should have no text content`, xpath: path });
      }
      return;
    }
    if (!isMixed && hasNonWhitespaceText(node)) {
      errors.push({ message: `Element has text content but type is not mixed`, xpath: path });
    }
    const consumed = validateContentModel(children, content, 0, path, errors);
    if (consumed >= 0 && consumed < children.length) {
      const leftover = children[consumed];
      errors.push({ message: `Unexpected element '${leftover.localName || leftover.nodeName}' after content model`, xpath: path });
    }
  }
  function validateAttributeDefs(node, attrDefs, path, errors) {
    const resolved = resolveAttributes(attrDefs);
    const seen = /* @__PURE__ */ new Set();
    let hasAnyAttribute = false;
    let idAttrCount = 0;
    let anyAttrConstraint = null;
    for (const ad of resolved) {
      if (ad.kind === "anyAttribute") {
        hasAnyAttribute = true;
        if (!anyAttrConstraint) {
          anyAttrConstraint = ad;
        } else {
          anyAttrConstraint = intersectAnyAttrConstraints(anyAttrConstraint, ad);
        }
      }
    }
    for (const ad of resolved) {
      if (ad.kind === "anyAttribute") continue;
      if (!ad.name) continue;
      if (ad.use === "prohibited") {
        if (!hasAnyAttribute) {
          seen.add(ad.name);
          if (node.hasAttribute(ad.name)) {
            errors.push({ message: `Attribute '${ad.name}' is prohibited`, xpath: `${path}/@${ad.name}` });
          }
        }
        continue;
      }
      const isQualified = ad.form === "qualified" || !ad.form && ir.attributeFormDefault === "qualified";
      const attrNs = isQualified ? ir.targetNamespace : null;
      let hasAttr, attrVal;
      if (attrNs && node.getAttributeNS) {
        hasAttr = node.hasAttributeNS(attrNs, ad.name);
        attrVal = hasAttr ? node.getAttributeNS(attrNs, ad.name) : null;
        if (!hasAttr) {
          for (let i = 0; i < node.attributes.length; i++) {
            const a = node.attributes[i];
            if ((a.localName || a.name) === ad.name && (a.namespaceURI || null) !== attrNs) {
              errors.push({ message: `Attribute '${ad.name}' must be in namespace '${attrNs}'`, xpath: `${path}/@${ad.name}` });
              seen.add(ad.name);
              break;
            }
          }
        }
      } else {
        hasAttr = node.hasAttribute(ad.name);
        attrVal = hasAttr ? node.getAttribute(ad.name) : null;
      }
      if (!hasAttr) {
        if (ad.use === "required") {
          errors.push({ message: `Missing required attribute '${ad.name}'`, xpath: `${path}/@${ad.name}` });
        }
        const effectiveVal = ad.fixed || ad.default || null;
        if (effectiveVal && ad.type && ad.type.ns === XSD_NS2) {
          trackIdType(ad.type.local, collapseWhitespace(effectiveVal), path, errors);
          if (derivesFromBuiltin(ad.type.local, "ID")) idAttrCount++;
        }
        continue;
      }
      seen.add(ad.name);
      attrVal = attrVal || "";
      if (ad.type && ad.type.ns === XSD_NS2) {
        const ws = getWhitespaceModeForType(ad.type.local, null);
        const normalizedVal = normalizeByWhitespace(attrVal, ws);
        const validator = BUILTIN_TYPES[ad.type.local];
        if (validator && !validator(normalizedVal)) {
          errors.push({ message: `Attribute '${ad.name}' value '${attrVal}' is not valid for type '${ad.type.local}'`, xpath: `${path}/@${ad.name}` });
        }
        trackIdType(ad.type.local, collapseWhitespace(attrVal), path, errors);
        if (derivesFromBuiltin(ad.type.local, "ID")) idAttrCount++;
      } else if (ad.type) {
        const attrType = resolveType(ad.type);
        if (attrType && attrType.kind === "simpleType") {
          validateSimpleTypeValue(attrVal, attrType, `${path}/@${ad.name}`, errors);
          if (isSimpleTypeDerivedFromID(attrType)) idAttrCount++;
        }
      }
      {
        const attrPrim = ad.type ? XSD_PRIMITIVE_FAMILIES[ad.type.local] || resolvePrimitiveFamilyForType(ad.type) : null;
        if (attrPrim) {
          for (let ai = 0; ai < node.attributes.length; ai++) {
            const an = node.attributes[ai];
            const anLocal = an.localName || an.name;
            if (anLocal === ad.name) {
              an._xsdPrimitiveType = attrPrim;
              break;
            }
          }
        }
      }
      if (ad.inlineType && ad.inlineType.kind === "simpleType") {
        validateSimpleTypeValue(attrVal, ad.inlineType, `${path}/@${ad.name}`, errors);
      }
      if (ad.fixed !== null && ad.fixed !== void 0) {
        const attrTypeName = ad.type && ad.type.ns === XSD_NS2 ? ad.type.local : null;
        const attrTypeDef = ad.inlineType || (ad.type && ad.type.ns !== XSD_NS2 ? resolveType(ad.type) : null);
        const ws = getWhitespaceModeForType(attrTypeName, attrTypeDef);
        if (normalizeByWhitespace(attrVal, ws) !== normalizeByWhitespace(ad.fixed, ws)) {
          errors.push({ message: `Attribute '${ad.name}' must have fixed value '${ad.fixed}'`, xpath: `${path}/@${ad.name}` });
        }
      }
    }
    if (!hasAnyAttribute) {
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        const attrName = attr.localName || attr.name;
        if (seen.has(attrName)) continue;
        if (attrName === "xmlns" || attr.name.startsWith("xmlns:")) continue;
        if (attr.namespaceURI === XSI_NS) continue;
        const attrNs = attr.namespaceURI || null;
        if (attrNs && attrNs !== (ir.targetNamespace || null)) continue;
        errors.push({ message: `Undeclared attribute '${attr.name}'`, xpath: `${path}/@${attr.name}` });
      }
    }
    if (hasAnyAttribute && anyAttrConstraint) {
      const pc = anyAttrConstraint.processContents || "strict";
      const nsConstraint = anyAttrConstraint.namespace != null ? anyAttrConstraint.namespace : "##any";
      for (let i = 0; i < node.attributes.length; i++) {
        const attr = node.attributes[i];
        const attrName = attr.localName || attr.name;
        if (seen.has(attrName)) continue;
        if (attrName === "xmlns" || attr.name.startsWith("xmlns:")) continue;
        if (attr.namespaceURI === XSI_NS) continue;
        const attrNs = attr.namespaceURI || null;
        if (!matchesAnyNamespace(attrNs, nsConstraint)) {
          errors.push({ message: `Attribute '${attr.name}' namespace not allowed by anyAttribute`, xpath: `${path}/@${attr.name}` });
        }
        if (pc === "strict" || pc === "lax") {
          const ga = ir.globalAttributes && ir.globalAttributes.get(attrName);
          const hasNoNsSL = !attrNs && ir.targetNamespace && ((node.getAttributeNS ? node.getAttributeNS(XSI_NS, "noNamespaceSchemaLocation") : node.getAttribute("xsi:noNamespaceSchemaLocation")) || node.ownerDocument && node.ownerDocument.documentElement && (node.ownerDocument.documentElement.getAttributeNS ? node.ownerDocument.documentElement.getAttributeNS(XSI_NS, "noNamespaceSchemaLocation") : null));
          if (!ga && pc === "strict" && !hasNoNsSL && (ir.targetNamespace ? attrNs === ir.targetNamespace || !attrNs : !attrNs)) {
            errors.push({ message: `Attribute '${attrName}' not declared (anyAttribute processContents=strict)`, xpath: `${path}/@${attrName}` });
          } else if (ga && ga.type) {
            const attrVal = attr.value || "";
            if (ga.type.ns === XSD_NS2) {
              const validator = BUILTIN_TYPES[ga.type.local];
              if (validator && !validator(attrVal)) {
                errors.push({ message: `Attribute '${attrName}' value '${attrVal}' is not valid for type '${ga.type.local}'`, xpath: `${path}/@${attrName}` });
              }
              trackIdType(ga.type.local, collapseWhitespace(attrVal), path, errors);
              if (derivesFromBuiltin(ga.type.local, "ID")) idAttrCount++;
            } else {
              const attrType = resolveType(ga.type);
              if (attrType && attrType.kind === "simpleType") {
                validateSimpleTypeValue(attrVal, attrType, `${path}/@${attrName}`, errors);
                if (isSimpleTypeDerivedFromID(attrType)) idAttrCount++;
              }
            }
          }
        }
      }
    }
    if (idAttrCount > 1) {
      errors.push({ message: `Element has ${idAttrCount} attributes of type ID (at most 1 allowed)`, xpath: path });
    }
  }
  function isSimpleTypeDerivedFromID(typeDef) {
    let cur = typeDef;
    const visited = /* @__PURE__ */ new Set();
    while (cur) {
      if (visited.has(cur.name)) break;
      visited.add(cur.name);
      if (cur.base) {
        if (cur.base.ns === XSD_NS2) return derivesFromBuiltin(cur.base.local, "ID");
        cur = ir.types.get(cur.base.local) || null;
      } else break;
    }
    return false;
  }
  function canMatchEmpty(model) {
    if (!model) return true;
    const minOcc = model.minOccurs !== void 0 ? model.minOccurs : 1;
    if (minOcc === 0) return true;
    if (model.kind === "choice") {
      if (model.particles) {
        for (const p of model.particles) {
          const pMin = p.minOccurs !== void 0 ? p.minOccurs : 1;
          if (pMin === 0 || canMatchEmpty(p)) return true;
        }
      }
      return false;
    }
    if (model.kind === "sequence") {
      if (model.particles) {
        return model.particles.every((p) => canMatchEmpty(p));
      }
      return true;
    }
    if (model.kind === "groupRef") {
      const group = resolveGroup(model);
      return group && group.content ? canMatchEmpty(group.content) : true;
    }
    return false;
  }
  function validateContentModel(children, model, startIdx, path, errors, minimal) {
    if (!model) return startIdx;
    if (model.kind === "groupRef") {
      return validateParticle(children, model, startIdx, path, errors, minimal);
    }
    const resolved = resolveGroup(model);
    if (!resolved) return startIdx;
    const content = resolved.content || resolved;
    switch (content.kind) {
      case "sequence":
        return validateSequence(children, content, startIdx, path, errors, minimal);
      case "choice":
        return validateChoice(children, content, startIdx, path, errors, minimal);
      case "all":
        return validateAll2(children, content, startIdx, path, errors);
      case "any":
        return validateAnyParticle(children, content, startIdx, path, errors);
      default:
        return startIdx;
    }
  }
  function trySequenceRep(children, particles, startIdx, path, errors, minimal) {
    let idx = startIdx;
    for (const particle of particles) {
      if (minimal && particle.kind === "element") {
        const result = validateElementParticleMinimal(children, particle, idx, path, errors);
        if (result === -1) return -1;
        idx = result;
      } else {
        const result = validateParticle(children, particle, idx, path, errors, minimal);
        if (result === -1) return -1;
        idx = result;
      }
    }
    return idx;
  }
  function validateSequence(children, seq, startIdx, path, errors, outerMinimal) {
    const minRep = seq.minOccurs !== void 0 ? seq.minOccurs : 1;
    const maxRep = seq.maxOccurs !== void 0 ? seq.maxOccurs : 1;
    const effectiveMax = outerMinimal ? minRep : maxRep;
    if (seq.particles.length === 0) {
      return startIdx;
    }
    let idx = startIdx;
    let reps = 0;
    const savedErrors = errors.length;
    while (reps < effectiveMax && idx < children.length) {
      const savedIdx = idx;
      const errsBefore = errors.length;
      const result = trySequenceRep(children, seq.particles, idx, path, errors, outerMinimal || false);
      if (result === -1 || result === savedIdx) {
        errors.length = errsBefore;
        idx = savedIdx;
        break;
      }
      idx = result;
      reps++;
    }
    if (reps < minRep && minRep > 1) {
      errors.length = savedErrors;
      idx = startIdx;
      reps = 0;
      while (reps < maxRep && idx < children.length) {
        const savedIdx = idx;
        const errsBefore = errors.length;
        const useMinimal = reps < minRep - 1;
        const result = trySequenceRep(children, seq.particles, idx, path, errors, useMinimal);
        if (result === -1 || result === savedIdx) {
          errors.length = errsBefore;
          idx = savedIdx;
          break;
        }
        idx = result;
        reps++;
      }
    }
    if (reps === 0 && idx >= children.length) {
      let allOptional = true;
      for (const p of seq.particles) {
        if (!canMatchEmpty(p)) {
          allOptional = false;
          break;
        }
      }
      if (allOptional) reps = minRep;
    }
    if (reps < minRep) {
      errors.push({ message: `Sequence requires at least ${minRep} repetition(s), got ${reps}`, xpath: path });
      return -1;
    }
    return idx;
  }
  function tryChoiceIteration(children, choice, startIdx, path, errors, minimal) {
    for (const particle of choice.particles) {
      const savedErrors = errors.length;
      const result = minimal && particle.kind === "element" ? validateElementParticleMinimal(children, particle, startIdx, path, errors) : validateParticle(children, particle, startIdx, path, errors, minimal);
      if (result !== -1 && result > startIdx) {
        return result;
      }
      errors.length = savedErrors;
    }
    return -1;
  }
  function validateChoice(children, choice, startIdx, path, errors, outerMinimal) {
    const minRep = choice.minOccurs !== void 0 ? choice.minOccurs : 1;
    const maxRep = choice.maxOccurs !== void 0 ? choice.maxOccurs : 1;
    let idx = startIdx;
    let reps = 0;
    const savedErrorsBase = errors.length;
    while (reps < maxRep && idx < children.length) {
      const result = tryChoiceIteration(children, choice, idx, path, errors, outerMinimal || false);
      if (result === -1) break;
      idx = result;
      reps++;
    }
    if (!outerMinimal && idx < children.length && maxRep > 1 && reps >= 1) {
      const greedyIdx = idx;
      const greedyReps = reps;
      errors.length = savedErrorsBase;
      idx = startIdx;
      reps = 0;
      while (reps < maxRep && idx < children.length) {
        const result = tryChoiceIteration(children, choice, idx, path, errors, true);
        if (result === -1) break;
        idx = result;
        reps++;
      }
      if (idx <= greedyIdx) {
        errors.length = savedErrorsBase;
        idx = startIdx;
        reps = 0;
        while (reps < maxRep && idx < children.length) {
          const result = tryChoiceIteration(children, choice, idx, path, errors, false);
          if (result === -1) break;
          idx = result;
          reps++;
        }
      }
    }
    if (reps === 0) {
      let anyBranchOptional = false;
      for (const p of choice.particles) {
        if (canMatchEmpty(p)) {
          anyBranchOptional = true;
          break;
        }
      }
      if (anyBranchOptional) reps = minRep;
    }
    if (reps < minRep) {
      if (minRep > 0 && startIdx < children.length) {
        const child = children[startIdx];
        errors.push({ message: `Element '${child.localName || child.nodeName}' is not allowed here`, xpath: path });
      } else if (minRep > 0) {
        errors.push({ message: `Choice requires at least ${minRep} match(es), got ${reps}`, xpath: path });
      }
      return -1;
    }
    return idx;
  }
  function validateAll2(children, all, startIdx, path, errors) {
    const allMin = all.minOccurs !== void 0 ? all.minOccurs : 1;
    const remaining = /* @__PURE__ */ new Map();
    for (let i = 0; i < all.particles.length; i++) {
      remaining.set(i, all.particles[i]);
    }
    let idx = startIdx;
    while (idx < children.length && remaining.size > 0) {
      const child = children[idx];
      const childName = child.localName || child.nodeName;
      let matched = false;
      for (const [key, particle] of remaining) {
        const maxOcc = particle.maxOccurs !== void 0 ? particle.maxOccurs : 1;
        if (maxOcc === 0) continue;
        const elemDecl = resolveElementRef(particle);
        if (elemDecl && elemDecl.name === childName) {
          validateElement2(child, elemDecl, ir, errors);
          remaining.delete(key);
          matched = true;
          idx++;
          break;
        }
      }
      if (!matched) break;
    }
    if (allMin === 0 && idx === startIdx) {
      return idx;
    }
    for (const [, particle] of remaining) {
      const elemDecl = resolveElementRef(particle);
      const minOcc = particle.minOccurs !== void 0 ? particle.minOccurs : 1;
      if (minOcc > 0 && elemDecl) {
        errors.push({ message: `Missing required element '${elemDecl.name}'`, xpath: path });
      }
    }
    return idx;
  }
  function validateParticle(children, particle, startIdx, path, errors, minimal) {
    if (particle.kind === "element") {
      return minimal ? validateElementParticleMinimal(children, particle, startIdx, path, errors) : validateElementParticle(children, particle, startIdx, path, errors);
    }
    if (particle.kind === "sequence" || particle.kind === "choice" || particle.kind === "all") {
      return validateContentModel(children, particle, startIdx, path, errors, minimal);
    }
    if (particle.kind === "groupRef") {
      const group = resolveGroup(particle);
      if (group && group.content) {
        const minOcc = particle.minOccurs !== void 0 ? particle.minOccurs : 1;
        const maxOcc = particle.maxOccurs !== void 0 ? particle.maxOccurs : 1;
        if (minOcc === 1 && maxOcc === 1) {
          return validateContentModel(children, group.content, startIdx, path, errors, minimal);
        }
        let idx = startIdx;
        let reps = 0;
        const savedErrorsGR = errors.length;
        while (reps < maxOcc && idx < children.length) {
          const savedIdx = idx;
          const errsBefore = errors.length;
          const result = validateContentModel(children, group.content, idx, path, errors, minimal);
          if (result === -1 || result === savedIdx) {
            errors.length = errsBefore;
            break;
          }
          idx = result;
          reps++;
        }
        if (!minimal && reps < minOcc && minOcc > 1) {
          errors.length = savedErrorsGR;
          idx = startIdx;
          reps = 0;
          while (reps < maxOcc && idx < children.length) {
            const savedIdx = idx;
            const errsBefore = errors.length;
            const result = validateContentModel(children, group.content, idx, path, errors, true);
            if (result === -1 || result === savedIdx) {
              errors.length = errsBefore;
              break;
            }
            idx = result;
            reps++;
          }
        }
        if (reps === 0 && idx >= children.length && reps < minOcc) {
          if (canMatchEmpty(group.content)) reps = minOcc;
        }
        if (reps < minOcc) {
          errors.push({ message: `Group requires at least ${minOcc} occurrence(s), got ${reps}`, xpath: path });
          return -1;
        }
        return idx;
      }
      return startIdx;
    }
    if (particle.kind === "any") {
      return validateAnyParticle(children, particle, startIdx, path, errors);
    }
    return startIdx;
  }
  function matchesElementName(child, childName, elemName, isRef) {
    if (childName === elemName) return true;
    if (!isRef) return false;
    const members = substitutionGroups.get(elemName);
    return members ? members.has(childName) : false;
  }
  function validateElementParticle(children, particle, startIdx, path, errors) {
    const elemDecl = resolveElementRef(particle);
    if (!elemDecl) return startIdx;
    const minOcc = particle.minOccurs !== void 0 ? particle.minOccurs : 1;
    const maxOcc = particle.maxOccurs !== void 0 ? particle.maxOccurs : 1;
    const elemName = elemDecl.name;
    let idx = startIdx;
    let count = 0;
    while (count < maxOcc && idx < children.length) {
      const child = children[idx];
      const childName = child.localName || child.nodeName;
      const isRef = !!particle.ref;
      if (!matchesElementName(child, childName, elemName, isRef)) break;
      const childNs = child.namespaceURI || null;
      const isSubstitution = isRef && childName !== elemName;
      if (isRef && !isSubstitution) {
        if (particle.refNs && childNs !== particle.refNs) break;
      } else if (isSubstitution) {
        if (particle.refNs && childNs !== particle.refNs) {
          const memberNsKey = "{" + (childNs || "") + "}" + childName;
          if (!ir.nsElements || !ir.nsElements.get(memberNsKey)) break;
        }
      } else if (elemDecl.formNs !== void 0) {
        const expectedNs = elemDecl.formNs || null;
        if (childNs !== expectedNs) break;
      } else if (ir.targetNamespace) {
        const effectiveForm = elemDecl.form || ir.elementFormDefault || "unqualified";
        if (effectiveForm === "qualified") {
          if (childNs !== ir.targetNamespace) break;
        } else {
          if (childNs === ir.targetNamespace) break;
        }
      } else {
        if (childNs && !particle.ref) break;
      }
      if (childName !== elemName) {
        const substDecl = ir.elements.get(childName);
        if (substDecl) {
          const headBlock = elemDecl.block !== null ? elemDecl.block || null : ir.blockDefault || null;
          if (headBlock) {
            const substType = substDecl.inlineType || (substDecl.type ? resolveType(substDecl.type) : null);
            if (substType) {
              let derivMethod = getDerivationMethod(substType, elemDecl, ir);
              if (!derivMethod && substType.kind === "simpleType") derivMethod = "restriction";
              if (headBlock === "#all" || derivMethod && isBlocked(headBlock, derivMethod)) {
                errors.push({ message: `Element '${childName}' is blocked from substituting for '${elemName}' (block='${headBlock}')`, xpath: path });
                count++;
                idx++;
                continue;
              }
              const declaredTypeName = elemDecl.type ? elemDecl.type.local : null;
              if (declaredTypeName && isDerivationBlocked(substType, declaredTypeName, headBlock)) {
                errors.push({ message: `Element '${childName}' is blocked from substituting for '${elemName}' (block='${headBlock}')`, xpath: path });
                count++;
                idx++;
                continue;
              }
            }
          }
          const headTypeName = elemDecl.type ? elemDecl.type.local : null;
          if (headTypeName) {
            const headType = ir.types.get(headTypeName) || null;
            const typeBlockAttr = headType ? headType.block !== null && headType.block !== void 0 ? headType.block : null : null;
            const typeBlock = typeBlockAttr !== null ? typeBlockAttr || null : ir.blockDefault || null;
            if (typeBlock) {
              const substType = substDecl.inlineType || (substDecl.type ? resolveType(substDecl.type) : null);
              if (substType) {
                let derivMethod = getDerivationMethod(substType, elemDecl, ir);
                if (!derivMethod && substType.kind === "simpleType") derivMethod = "restriction";
                if (typeBlock === "#all" || derivMethod && isBlocked(typeBlock, derivMethod)) {
                  errors.push({ message: `Element '${childName}' is blocked by type '${headTypeName}' (block='${typeBlock}')`, xpath: path });
                  count++;
                  idx++;
                  continue;
                }
                if (headTypeName && isDerivationBlocked(substType, headTypeName, typeBlock)) {
                  errors.push({ message: `Element '${childName}' is blocked by type '${headTypeName}' (block='${typeBlock}')`, xpath: path });
                  count++;
                  idx++;
                  continue;
                }
              }
            }
          }
          validateElement2(child, substDecl, ir, errors);
        } else {
          validateElement2(child, elemDecl, ir, errors);
        }
      } else {
        validateElement2(child, elemDecl, ir, errors);
      }
      count++;
      idx++;
    }
    if (count < minOcc) {
      if (minOcc > 0) {
        errors.push({ message: `Expected at least ${minOcc} '${elemName}' element(s), got ${count}`, xpath: path });
      }
      return -1;
    }
    return idx;
  }
  function validateElementParticleMinimal(children, particle, startIdx, path, errors) {
    const elemDecl = resolveElementRef(particle);
    if (!elemDecl) return startIdx;
    const minOcc = particle.minOccurs !== void 0 ? particle.minOccurs : 1;
    const elemName = elemDecl.name;
    let idx = startIdx;
    let count = 0;
    while (count < minOcc && idx < children.length) {
      const child = children[idx];
      const childName = child.localName || child.nodeName;
      if (!matchesElementName(child, childName, elemName, !!particle.ref)) break;
      if (particle.ref && particle.refNs) {
        const childNs = child.namespaceURI || null;
        const isSubstitution = childName !== elemName;
        if (childNs !== particle.refNs) {
          if (!isSubstitution) break;
          const memberNsKey = "{" + (childNs || "") + "}" + childName;
          if (!ir.nsElements || !ir.nsElements.get(memberNsKey)) break;
        }
      }
      validateElement2(child, elemDecl, ir, errors);
      count++;
      idx++;
    }
    if (count < minOcc) {
      if (minOcc > 0) {
        errors.push({ message: `Expected at least ${minOcc} '${elemName}' element(s), got ${count}`, xpath: path });
      }
      return -1;
    }
    return idx;
  }
  function intersectAnyAttrConstraints(a, b) {
    const nsA = a.namespace != null ? a.namespace : "##any";
    const nsB = b.namespace != null ? b.namespace : "##any";
    const pc = stricterPC(a.processContents, b.processContents);
    if (nsA === "##any") return { kind: "anyAttribute", namespace: nsB, processContents: pc };
    if (nsB === "##any") return { kind: "anyAttribute", namespace: nsA, processContents: pc };
    if (nsA === "##other" && nsB === "##other") return { kind: "anyAttribute", namespace: "##other", processContents: pc };
    const expandNs = (ns) => {
      if (ns === "##other") return null;
      return new Set(ns.split(/\s+/).map((p) => {
        if (p === "##targetNamespace") return ir.targetNamespace || "";
        if (p === "##local") return "";
        return p;
      }));
    };
    if (nsA === "##other") {
      const setB2 = expandNs(nsB);
      const tns = ir.targetNamespace || "";
      const result = [...setB2].filter((u) => u !== tns && u !== "");
      return { kind: "anyAttribute", namespace: result.length ? result.join(" ") : "##none", processContents: pc };
    }
    if (nsB === "##other") {
      const setA2 = expandNs(nsA);
      const tns = ir.targetNamespace || "";
      const result = [...setA2].filter((u) => u !== tns && u !== "");
      return { kind: "anyAttribute", namespace: result.length ? result.join(" ") : "##none", processContents: pc };
    }
    const setA = expandNs(nsA);
    const setB = expandNs(nsB);
    const common = [...setA].filter((u) => setB.has(u));
    if (common.length === 0) {
      return { kind: "anyAttribute", namespace: "##none", processContents: pc };
    }
    const tokens = common.map((u) => {
      if (u === (ir.targetNamespace || "")) return "##targetNamespace";
      if (u === "") return "##local";
      return u;
    });
    return { kind: "anyAttribute", namespace: tokens.join(" "), processContents: pc };
  }
  function stricterPC(a, b) {
    const order = { strict: 2, lax: 1, skip: 0 };
    return (order[a || "strict"] || 2) >= (order[b || "strict"] || 2) ? a || "strict" : b || "strict";
  }
  function mergeAnyAttrConstraints(a, b) {
    const nsA = a.namespace != null ? a.namespace : "##any";
    const nsB = b.namespace != null ? b.namespace : "##any";
    if (nsA === "##any" || nsB === "##any") {
      return { kind: "anyAttribute", namespace: "##any", processContents: laxerPC(a.processContents, b.processContents) };
    }
    if (nsA === "##local" && nsB === "##other" || nsA === "##other" && nsB === "##local") {
      return { kind: "anyAttribute", namespace: "##any", processContents: laxerPC(a.processContents, b.processContents) };
    }
    if (nsA === "##targetNamespace" && nsB === "##other" || nsA === "##other" && nsB === "##targetNamespace") {
      return { kind: "anyAttribute", namespace: "##any", processContents: laxerPC(a.processContents, b.processContents) };
    }
    const partsA = nsA === "##other" ? ["##other"] : nsA.split(/\s+/);
    const partsB = nsB === "##other" ? ["##other"] : nsB.split(/\s+/);
    const combined = /* @__PURE__ */ new Set([...partsA, ...partsB]);
    if (combined.has("##local") && combined.has("##other")) {
      return { kind: "anyAttribute", namespace: "##any", processContents: laxerPC(a.processContents, b.processContents) };
    }
    return { kind: "anyAttribute", namespace: [...combined].join(" "), processContents: laxerPC(a.processContents, b.processContents) };
  }
  function laxerPC(a, b) {
    const order = { skip: 0, lax: 1, strict: 2 };
    return (order[a || "strict"] || 2) <= (order[b || "strict"] || 2) ? a || "strict" : b || "strict";
  }
  function matchesAnyNamespace(childNs, nsConstraint) {
    if (nsConstraint === "##none") return false;
    if (nsConstraint === "##any") return true;
    if (nsConstraint === "##other") {
      return childNs !== (ir.targetNamespace || null) && childNs !== null;
    }
    const parts = nsConstraint.split(/\s+/);
    for (const p of parts) {
      if (p === "##targetNamespace" && childNs === (ir.targetNamespace || null)) return true;
      if (p === "##local" && !childNs) return true;
      if (p === childNs) return true;
    }
    return false;
  }
  function validateAnyParticle(children, particle, startIdx, path, errors) {
    const minOcc = particle.minOccurs !== void 0 ? particle.minOccurs : 1;
    const maxOcc = particle.maxOccurs !== void 0 ? particle.maxOccurs : 1;
    const nsConstraint = particle.namespace != null ? particle.namespace : "##any";
    const processContents = particle.processContents || "strict";
    let idx = startIdx;
    let count = 0;
    while (count < maxOcc && idx < children.length) {
      const child = children[idx];
      const childNs = child.namespaceURI || null;
      if (!matchesAnyNamespace(childNs, nsConstraint)) break;
      if (processContents === "strict") {
        const childName = child.localName || child.nodeName;
        const nsKey = "{" + (childNs || "") + "}" + childName;
        const decl = ir.nsElements && ir.nsElements.get(nsKey) || ir.elements.get(childName);
        if (!decl) {
          const xsiTypeAttr = child.getAttributeNS ? child.getAttributeNS(XSI_NS, "type") : child.getAttribute("xsi:type");
          if (xsiTypeAttr) {
            validateElement2(child, { kind: "element", name: childName, type: null, inlineType: null }, ir, errors);
          } else if (!childNs || childNs === (ir.targetNamespace || null) || ir.importedNamespaces && ir.importedNamespaces.has(childNs)) {
            errors.push({ message: `Element '${childName}' not declared (processContents=strict)`, xpath: path });
          }
        } else {
          validateElement2(child, decl, ir, errors);
        }
      } else if (processContents === "lax") {
        const childName = child.localName || child.nodeName;
        const nsKey = "{" + (childNs || "") + "}" + childName;
        let decl = ir.nsElements && ir.nsElements.get(nsKey);
        if (!decl) {
          const fallback = ir.elements.get(childName);
          if (fallback && (childNs || null) === (ir.targetNamespace || null)) {
            decl = fallback;
          }
        }
        if (decl) {
          validateElement2(child, decl, ir, errors);
        }
      }
      count++;
      idx++;
    }
    if (count < minOcc) {
      return -1;
    }
    return idx;
  }
  function evalSelectorXPath(contextNode, xpath, nsMap) {
    if (xpath.indexOf("|") >= 0) {
      const arms = xpath.split("|");
      const seen = /* @__PURE__ */ new Set();
      const result = [];
      for (const arm of arms) {
        for (const n of evalSelectorXPath(contextNode, arm.trim(), nsMap)) {
          if (!seen.has(n)) {
            seen.add(n);
            result.push(n);
          }
        }
      }
      return result;
    }
    const steps = xpath.replace(/^\.\/\//, "").replace(/^\.\//, "").replace(/^\./, "").split("/");
    let nodes = [contextNode];
    for (let i = 0; i < steps.length; i++) {
      let step = steps[i];
      if (step === "") continue;
      const descendant = step === "" || step.startsWith("");
      if (descendant) step = step.substring(1);
      const direct = step === "" || step.startsWith("");
      if (direct) step = step.substring(1);
      if (!step) continue;
      step = step.replace(/^child::/, "");
      const colonIdx = step.indexOf(":");
      const localName = colonIdx >= 0 ? step.substring(colonIdx + 1) : step;
      const matchNs = colonIdx >= 0 ? nsMap && nsMap[step.substring(0, colonIdx)] || null : null;
      const next = [];
      for (const node of nodes) {
        if (descendant) {
          collectDescendants(node, localName, matchNs, next);
        } else {
          for (let c = 0; c < node.childNodes.length; c++) {
            const ch = node.childNodes[c];
            if (ch.nodeType === 1 && matchesXPathStep(ch, localName, matchNs)) {
              next.push(ch);
            }
          }
        }
      }
      nodes = next;
    }
    return nodes;
  }
  function matchesXPathStep(el, localName, matchNs) {
    if (localName !== "*" && (el.localName || el.nodeName.split(":").pop()) !== localName) return false;
    const elNs = el.namespaceURI || null;
    if (matchNs !== null) return elNs === matchNs;
    return localName === "*" || !elNs;
  }
  function collectDescendants(node, localName, matchNs, result) {
    for (let i = 0; i < node.childNodes.length; i++) {
      const ch = node.childNodes[i];
      if (ch.nodeType === 1) {
        if (matchesXPathStep(ch, localName, matchNs)) result.push(ch);
        collectDescendants(ch, localName, matchNs, result);
      }
    }
  }
  function fieldTextValue(el) {
    for (let i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === 1) return null;
    }
    return textContent(el);
  }
  function evalFieldXPath(node, xpath, nsMap) {
    const parts = xpath.split("|");
    for (const part of parts) {
      const result = evalFieldPath(node, part.trim(), nsMap);
      if (result !== null) return result;
    }
    return null;
  }
  function evalFieldPath(node, path, nsMap) {
    const steps = path.split("/");
    let current = node;
    for (let i = 0; i < steps.length; i++) {
      let step = steps[i].trim();
      if (!step) continue;
      const isLast = i === steps.length - 1;
      if (step === ".") continue;
      if (step === "..") continue;
      const isAttr = step.startsWith("@") || step.startsWith("attribute::");
      if (isAttr) {
        step = step.replace(/^attribute::/, "").replace(/^@/, "");
        return evalFieldAttr(current, step, nsMap);
      }
      step = step.replace(/^child::/, "");
      if (step === "") {
        const remaining = steps.slice(i + 1).join("/");
        if (remaining) {
          const nodes = evalSelectorXPath(current, ".//" + remaining, nsMap);
          if (nodes.length > 0) return textContent(nodes[0]);
        }
        return null;
      }
      const colonIdx = step.indexOf(":");
      const localName = colonIdx >= 0 ? step.substring(colonIdx + 1) : step;
      const matchNs = colonIdx >= 0 ? nsMap && nsMap[step.substring(0, colonIdx)] || null : null;
      let found = null;
      let matchCount = 0;
      for (let c = 0; c < current.childNodes.length; c++) {
        const ch = current.childNodes[c];
        if (ch.nodeType === 1 && matchesXPathStep(ch, localName, matchNs)) {
          if (!found) found = ch;
          matchCount++;
        }
      }
      if (!found) return null;
      if (isLast && matchCount > 1) return FIELD_MULTI;
      if (isLast) return fieldTextValue(found);
      current = found;
    }
    return fieldTextValue(current);
  }
  function evalFieldAttr(node, attrExpr, nsMap) {
    if (attrExpr === "*") {
      let firstVal = null;
      let count = 0;
      for (let i = 0; i < node.attributes.length; i++) {
        const a = node.attributes[i];
        if (a.name === "xmlns" || a.name.startsWith("xmlns:")) continue;
        if (!firstVal) firstVal = a.value;
        count++;
      }
      if (count > 1) return FIELD_MULTI;
      return firstVal;
    }
    const colonIdx = attrExpr.indexOf(":");
    if (colonIdx >= 0 && attrExpr.substring(colonIdx + 1) === "*") {
      const prefix = attrExpr.substring(0, colonIdx);
      const matchNs = nsMap && nsMap[prefix] || null;
      let firstVal = null;
      let count = 0;
      for (let i = 0; i < node.attributes.length; i++) {
        const a = node.attributes[i];
        if (a.name === "xmlns" || a.name.startsWith("xmlns:")) continue;
        if ((a.namespaceURI || null) === matchNs) {
          if (!firstVal) firstVal = a.value;
          count++;
        }
      }
      if (count > 1) return FIELD_MULTI;
      return firstVal;
    }
    const localAttr = colonIdx >= 0 ? attrExpr.substring(colonIdx + 1) : attrExpr;
    if (node.hasAttribute(attrExpr)) return node.getAttribute(attrExpr);
    if (colonIdx >= 0) {
      const prefix = attrExpr.substring(0, colonIdx);
      const matchNs = nsMap && nsMap[prefix] || null;
      if (matchNs && node.getAttributeNS) {
        const val = node.getAttributeNS(matchNs, localAttr);
        if (val !== null && val !== "") return val;
      }
      if (node.hasAttribute(localAttr)) return node.getAttribute(localAttr);
    }
    return findAttrDefaultValue(node, localAttr);
  }
  function resolvePrimitiveFamily(elementDecl, typeDef) {
    if (elementDecl.type) {
      const localType = typeof elementDecl.type === "string" ? elementDecl.type.indexOf(":") >= 0 ? elementDecl.type.substring(elementDecl.type.indexOf(":") + 1) : elementDecl.type : elementDecl.type.local;
      const family = XSD_PRIMITIVE_FAMILIES[localType];
      if (family) return family;
    }
    if (typeDef && typeDef.kind === "simpleType") {
      return resolvePrimitiveFamilyFromDef(typeDef);
    }
    return null;
  }
  function resolvePrimitiveFamilyFromDef(typeDef) {
    if (!typeDef || typeDef.kind !== "simpleType") return null;
    if (typeDef.base) {
      if (typeDef.base.ns === XSD_NS2) {
        const family = XSD_PRIMITIVE_FAMILIES[typeDef.base.local];
        if (family) return family;
      }
      const baseType = resolveType(typeDef.base);
      if (baseType) return resolvePrimitiveFamilyFromDef(baseType);
    }
    return null;
  }
  function resolvePrimitiveFamilyForType(typeQN) {
    if (!typeQN) return null;
    const localType = typeQN.local || (typeof typeQN === "string" ? typeQN : null);
    if (localType) {
      const family = XSD_PRIMITIVE_FAMILIES[localType];
      if (family) return family;
    }
    const typeDef = resolveType(typeQN);
    if (typeDef) return resolvePrimitiveFamilyFromDef(typeDef);
    return null;
  }
  function getFieldPrimitiveType(contextNode, fieldXPath) {
    if (fieldXPath.includes("|")) {
      return getFieldPrimitiveType(contextNode, fieldXPath.split("|")[0]);
    }
    const trimmed = fieldXPath.trim();
    if (trimmed.startsWith("@") || trimmed.startsWith("attribute::")) {
      const attrName = trimmed.replace(/^attribute::/, "").replace(/^@/, "");
      if (contextNode.attributes) {
        for (let i = 0; i < contextNode.attributes.length; i++) {
          const a = contextNode.attributes[i];
          if ((a.localName || a.name) === attrName && a._xsdPrimitiveType) {
            return a._xsdPrimitiveType;
          }
        }
      }
      const attrType = findAttributeTypeInElement(contextNode, attrName);
      if (attrType) return attrType;
      return null;
    }
    if (contextNode._xsdPrimitiveType) return contextNode._xsdPrimitiveType;
    const targetNode = trimmed === "." ? contextNode : null;
    if (!targetNode) return null;
    const xsiType = targetNode.getAttributeNS ? targetNode.getAttributeNS(XSI_NS, "type") : targetNode.getAttribute("xsi:type");
    if (xsiType) {
      const colonIdx = xsiType.indexOf(":");
      const localType = colonIdx >= 0 ? xsiType.substring(colonIdx + 1) : xsiType;
      const family = XSD_PRIMITIVE_FAMILIES[localType];
      if (family) return family;
    }
    const elemName = targetNode.localName || targetNode.nodeName;
    const elemNs = targetNode.namespaceURI || null;
    const nsKey = "{" + (elemNs || "") + "}" + elemName;
    const decl = ir.nsElements && ir.nsElements.get(nsKey) || ir.elements.get(elemName);
    if (decl) {
      const family = resolvePrimitiveFamily(decl, decl.inlineType || (decl.type ? resolveType(decl.type) : null));
      if (family) return family;
    }
    if (targetNode.parentNode && targetNode.parentNode.nodeType === 1) {
      const parentFamily = findElementTypeInContentModel(targetNode.parentNode, elemName, elemNs);
      if (parentFamily) return parentFamily;
    }
    return null;
  }
  function findElementTypeInContentModel(parentNode, elemName, elemNs) {
    const parentLocal = parentNode.localName || parentNode.nodeName;
    const parentNs = parentNode.namespaceURI || null;
    const parentNsKey = "{" + (parentNs || "") + "}" + parentLocal;
    const parentDecl = ir.nsElements && ir.nsElements.get(parentNsKey) || ir.elements.get(parentLocal);
    if (!parentDecl) return null;
    const parentType = parentDecl.inlineType || (parentDecl.type ? resolveType(parentDecl.type) : null);
    if (!parentType || parentType.kind !== "complexType") return null;
    return findPrimitiveInContent(parentType.content, elemName) || (parentType.derivation ? findPrimitiveInContent(parentType.derivation.content, elemName) : null);
  }
  function findPrimitiveInContent(content, elemName) {
    if (!content) return null;
    if (content.particles) {
      for (const p of content.particles) {
        const result = findPrimitiveInParticle(p, elemName);
        if (result) return result;
      }
    }
    return null;
  }
  function findPrimitiveInParticle(p, elemName) {
    if (!p) return null;
    if (p.kind === "element" && !p.ref && p.name === elemName && p.type) {
      return resolvePrimitiveFamily(p, p.inlineType || (p.type ? resolveType(p.type) : null));
    }
    if (p.kind === "element" && !p.ref && p.name === elemName && p.inlineType) {
      return resolvePrimitiveFamily(p, p.inlineType);
    }
    if (p.kind === "sequence" || p.kind === "choice" || p.kind === "all") {
      return findPrimitiveInContent(p, elemName);
    }
    if (p.kind === "group" && p.particles) {
      for (const cp of p.particles) {
        const result = findPrimitiveInParticle(cp, elemName);
        if (result) return result;
      }
    }
    return null;
  }
  function findAttributeTypeInElement(node, attrName) {
    const elemName = node.localName || node.nodeName;
    const elemNs = node.namespaceURI || null;
    const nsKey = "{" + (elemNs || "") + "}" + elemName;
    const decl = ir.nsElements && ir.nsElements.get(nsKey) || ir.elements.get(elemName);
    if (!decl) {
      if (node.parentNode && node.parentNode.nodeType === 1) {
        return findAttrTypeViaParent(node, attrName);
      }
      return null;
    }
    const typeDef = decl.inlineType || (decl.type ? resolveType(decl.type) : null);
    return findAttrPrimitiveInType(typeDef, attrName);
  }
  function findAttrTypeViaParent(node, attrName) {
    const elemName = node.localName || node.nodeName;
    const parentNode = node.parentNode;
    const parentLocal = parentNode.localName || parentNode.nodeName;
    const parentNs = parentNode.namespaceURI || null;
    const parentNsKey = "{" + (parentNs || "") + "}" + parentLocal;
    const parentDecl = ir.nsElements && ir.nsElements.get(parentNsKey) || ir.elements.get(parentLocal);
    if (!parentDecl) return null;
    const parentType = parentDecl.inlineType || (parentDecl.type ? resolveType(parentDecl.type) : null);
    if (!parentType || parentType.kind !== "complexType") return null;
    const elemParticle = findElementParticleByName(parentType.content, elemName) || (parentType.derivation ? findElementParticleByName(parentType.derivation.content, elemName) : null);
    if (!elemParticle) return null;
    const elemType = elemParticle.inlineType || (elemParticle.type ? resolveType(elemParticle.type) : null);
    return findAttrPrimitiveInType(elemType, attrName);
  }
  function findElementParticleByName(content, elemName) {
    if (!content || !content.particles) return null;
    for (const p of content.particles) {
      if (p.kind === "element" && !p.ref && p.name === elemName) return p;
      if (p.kind === "sequence" || p.kind === "choice" || p.kind === "all") {
        const found = findElementParticleByName(p, elemName);
        if (found) return found;
      }
    }
    return null;
  }
  function findAttrDefaultValue(node, attrName) {
    const elemName = node.localName || node.nodeName;
    const elemNs = node.namespaceURI || null;
    const nsKey = "{" + (elemNs || "") + "}" + elemName;
    const decl = ir.nsElements && ir.nsElements.get(nsKey) || ir.elements.get(elemName);
    if (decl) {
      const typeDef = decl.inlineType || (decl.type ? resolveType(decl.type) : null);
      const val = findAttrDefaultInType(typeDef, attrName);
      if (val !== null) return val;
    }
    if (node.parentNode && node.parentNode.nodeType === 1) {
      const parentLocal = node.parentNode.localName || node.parentNode.nodeName;
      const parentNs = node.parentNode.namespaceURI || null;
      const parentNsKey = "{" + (parentNs || "") + "}" + parentLocal;
      const parentDecl = ir.nsElements && ir.nsElements.get(parentNsKey) || ir.elements.get(parentLocal);
      if (parentDecl) {
        const parentType = parentDecl.inlineType || (parentDecl.type ? resolveType(parentDecl.type) : null);
        if (parentType && parentType.kind === "complexType") {
          const elemParticle = findElementParticleByName(parentType.content, elemName) || (parentType.derivation ? findElementParticleByName(parentType.derivation.content, elemName) : null);
          if (elemParticle) {
            const elemType = elemParticle.inlineType || (elemParticle.type ? resolveType(elemParticle.type) : null);
            const val = findAttrDefaultInType(elemType, attrName);
            if (val !== null) return val;
          }
        }
      }
    }
    return null;
  }
  function findAttrDefaultInType(typeDef, attrName) {
    if (!typeDef || typeDef.kind !== "complexType") return null;
    const attrs = typeDef.attributes || [];
    for (const ad of attrs) {
      if (ad.name === attrName) {
        if (ad.fixed !== null && ad.fixed !== void 0) return ad.fixed;
        if (ad.default !== null && ad.default !== void 0) return ad.default;
      }
    }
    if (typeDef.derivation && typeDef.derivation.attributes) {
      for (const ad of typeDef.derivation.attributes) {
        if (ad.name === attrName) {
          if (ad.fixed !== null && ad.fixed !== void 0) return ad.fixed;
          if (ad.default !== null && ad.default !== void 0) return ad.default;
        }
      }
    }
    return null;
  }
  function findAttrPrimitiveInType(typeDef, attrName) {
    if (!typeDef || typeDef.kind !== "complexType") return null;
    const attrs = typeDef.attributes || [];
    for (const ad of attrs) {
      if (ad.name === attrName && ad.type) {
        const family = XSD_PRIMITIVE_FAMILIES[ad.type.local];
        if (family) return family;
        return resolvePrimitiveFamilyForType(ad.type);
      }
    }
    if (typeDef.derivation && typeDef.derivation.attributes) {
      for (const ad of typeDef.derivation.attributes) {
        if (ad.name === attrName && ad.type) {
          const family = XSD_PRIMITIVE_FAMILIES[ad.type.local];
          if (family) return family;
          return resolvePrimitiveFamilyForType(ad.type);
        }
      }
    }
    return null;
  }
  function normalizeKeyValue(v) {
    return collapseWhitespace(v);
  }
  function areTuplesDuplicate(a, b) {
    if (a.values.length !== b.values.length) return false;
    for (let i = 0; i < a.values.length; i++) {
      let va = normalizeKeyValue(a.values[i]);
      let vb = normalizeKeyValue(b.values[i]);
      const ta = a.types[i];
      const tb = b.types[i];
      if (ta && tb && ta !== tb) return false;
      if (ta === "decimal" && tb === "decimal") {
        va = canonicalDecimal(va);
        vb = canonicalDecimal(vb);
      }
      if (ta === "QName" && tb === "QName" && a.nodes && b.nodes) {
        const qa = resolveQNameForComparison(va, a.nodes[i]);
        const qb = resolveQNameForComparison(vb, b.nodes[i]);
        if (qa && qb) {
          if (qa !== qb) return false;
          continue;
        }
      }
      if (va !== vb) return false;
    }
    return true;
  }
  function canonicalDecimal(s) {
    s = s.trim();
    let sign = "";
    if (s[0] === "+" || s[0] === "-") {
      sign = s[0];
      s = s.substring(1);
    }
    const dot = s.indexOf(".");
    let intPart = dot >= 0 ? s.substring(0, dot) : s;
    let fracPart = dot >= 0 ? s.substring(dot + 1) : "";
    intPart = intPart.replace(/^0+/, "") || "0";
    fracPart = fracPart.replace(/0+$/, "");
    let result = intPart;
    if (fracPart) result += "." + fracPart;
    if (result === "0") return "0";
    return (sign === "-" ? "-" : "") + result;
  }
  function resolveQNameForComparison(value, node) {
    if (!node) return null;
    const colonIdx = value.indexOf(":");
    if (colonIdx < 0) {
      const ns2 = node.lookupNamespaceURI ? node.lookupNamespaceURI(null) : null;
      return "{" + (ns2 || "") + "}" + value;
    }
    const prefix = value.substring(0, colonIdx);
    const local = value.substring(colonIdx + 1);
    const ns = node.lookupNamespaceURI ? node.lookupNamespaceURI(prefix) : null;
    return "{" + (ns || "") + "}" + local;
  }
  function collectKeyValues(node, constraints, path, errors) {
    if (!constraints) return;
    for (const c of constraints) {
      if (c.kind === "keyref") continue;
      if (!c.selector || !c.fields.length) continue;
      const selected = evalSelectorXPath(node, c.selector, c.namespaces);
      const tuples = [];
      for (const sel of selected) {
        const fieldVals = c.fields.map((f) => evalFieldXPath(sel, f, c.namespaces));
        const fieldTypes = c.fields.map((f) => getFieldPrimitiveType(sel, f));
        const hasMulti = fieldVals.some((v) => v === FIELD_MULTI);
        if (hasMulti) {
          errors.push({ message: `${c.kind === "key" ? "Key" : "Unique"} '${c.name}': field XPath matched multiple nodes`, xpath: path });
          continue;
        }
        const allPresent = fieldVals.every((v) => v !== null);
        if (c.kind === "key" && !allPresent) {
          errors.push({ message: `Key '${c.name}': field value missing`, xpath: path });
          continue;
        }
        if (allPresent) {
          const fieldNodes = fieldTypes.some((t) => t === "QName") ? [sel] : null;
          tuples.push({ values: fieldVals, types: fieldTypes, nodes: fieldNodes });
        }
      }
      let dupFound = false;
      for (let ti = 1; ti < tuples.length && !dupFound; ti++) {
        for (let tj = 0; tj < ti; tj++) {
          if (areTuplesDuplicate(tuples[ti], tuples[tj])) {
            errors.push({ message: `${c.kind === "key" ? "Key" : "Unique"} '${c.name}': duplicate value [${tuples[ti].values.join(", ")}]`, xpath: path });
            dupFound = true;
            break;
          }
        }
      }
      if (_keyValueStore) {
        _keyValueStore.set(c.name, tuples);
      }
    }
  }
  function checkKeyrefs(node, constraints, path, errors) {
    if (!constraints) return;
    for (const c of constraints) {
      if (c.kind !== "keyref" || !c.refer) continue;
      if (!c.selector || !c.fields.length) continue;
      const refTuples = _keyValueStore && _keyValueStore.get(c.refer);
      if (!refTuples) continue;
      const selected = evalSelectorXPath(node, c.selector, c.namespaces);
      for (const sel of selected) {
        const fieldVals = c.fields.map((f) => evalFieldXPath(sel, f, c.namespaces));
        const fieldTypes = c.fields.map((f) => getFieldPrimitiveType(sel, f));
        const hasMulti = fieldVals.some((v) => v === FIELD_MULTI);
        if (hasMulti) {
          errors.push({ message: `Keyref '${c.name}': field XPath matched multiple nodes`, xpath: path });
          continue;
        }
        if (fieldVals.every((v) => v !== null)) {
          const fieldNodes = fieldTypes.some((t) => t === "QName") ? [sel] : null;
          const refTuple = { values: fieldVals, types: fieldTypes, nodes: fieldNodes };
          const found = refTuples.some((t) => areTuplesDuplicate(refTuple, t));
          if (!found) {
            errors.push({ message: `Keyref '${c.name}': value [${fieldVals.join(", ")}] not found in key '${c.refer}'`, xpath: path });
            break;
          }
        }
      }
    }
  }
}

// src/compiler/schema-validator.js
var XSD_NS3 = "http://www.w3.org/2001/XMLSchema";
function xsdChildren2(parent) {
  const result = [];
  for (let i = 0; i < parent.childNodes.length; i++) {
    const ch = parent.childNodes[i];
    if (ch.nodeType === 1 && ch.namespaceURI === XSD_NS3) result.push(ch);
  }
  return result;
}
function resolvePrefix(qname, contextEl) {
  if (!qname) return null;
  const trimmed = qname.trim();
  const idx = trimmed.indexOf(":");
  if (idx === -1) return { ns: null, local: trimmed, prefix: null };
  const prefix = trimmed.substring(0, idx);
  const local = trimmed.substring(idx + 1);
  if (prefix === "xml") return { ns: "http://www.w3.org/XML/1998/namespace", local, prefix };
  let el = contextEl;
  while (el && el.nodeType === 1) {
    const nsAttr = el.getAttribute("xmlns:" + prefix);
    if (nsAttr !== null && nsAttr !== "") return { ns: nsAttr, local, prefix };
    el = el.parentNode;
  }
  return { ns: null, local, prefix };
}
function fail(msg) {
  throw new Error("x-xsd: invalid schema \u2014 " + msg);
}
var VALID_BLOCK_ELEM = /* @__PURE__ */ new Set(["#all", "extension", "restriction", "substitution"]);
var VALID_BLOCK_CT = /* @__PURE__ */ new Set(["#all", "extension", "restriction"]);
var VALID_FINAL_ELEM = /* @__PURE__ */ new Set(["#all", "extension", "restriction"]);
var VALID_FINAL_ST = /* @__PURE__ */ new Set(["#all", "restriction", "list", "union"]);
var VALID_FINAL_CT = /* @__PURE__ */ new Set(["#all", "extension", "restriction"]);
var VALID_PC = /* @__PURE__ */ new Set(["strict", "lax", "skip"]);
var VALID_USE = /* @__PURE__ */ new Set(["optional", "required", "prohibited"]);
function validateSchemaDoc(xsd) {
  const doc = toDocument(xsd);
  const root = doc.documentElement;
  if (!root || root.localName !== "schema" || root.namespaceURI !== XSD_NS3) {
    fail("root element must be xs:schema");
  }
  const tns = root.getAttribute("targetNamespace") || null;
  if (root.hasAttribute("elementFormDefault")) {
    const v = root.getAttribute("elementFormDefault");
    if (v !== "qualified" && v !== "unqualified") {
      fail(`invalid elementFormDefault: "${v}" (must be qualified or unqualified)`);
    }
  }
  if (root.hasAttribute("attributeFormDefault")) {
    const v = root.getAttribute("attributeFormDefault");
    if (v !== "qualified" && v !== "unqualified") {
      fail(`invalid attributeFormDefault: "${v}" (must be qualified or unqualified)`);
    }
  }
  if (root.hasAttribute("blockDefault")) {
    validateTokenList(root.getAttribute("blockDefault"), VALID_BLOCK_ELEM, "blockDefault");
  }
  if (root.hasAttribute("finalDefault")) {
    const VALID_FINAL_DEFAULT = /* @__PURE__ */ new Set(["#all", "extension", "restriction", "list", "union"]);
    validateTokenList(root.getAttribute("finalDefault"), VALID_FINAL_DEFAULT, "finalDefault");
  }
  const globalElements = /* @__PURE__ */ new Set();
  const globalTypes = /* @__PURE__ */ new Set();
  const globalAttrs = /* @__PURE__ */ new Set();
  const globalGroups = /* @__PURE__ */ new Set();
  const globalAttrGroups = /* @__PURE__ */ new Set();
  for (const ch of xsdChildren2(root)) {
    const name = ch.getAttribute("name");
    if (!name) continue;
    switch (ch.localName) {
      case "element":
        globalElements.add(name);
        break;
      case "complexType":
      case "simpleType":
        globalTypes.add(name);
        break;
      case "attribute":
        globalAttrs.add(name);
        break;
      case "group":
        globalGroups.add(name);
        break;
      case "attributeGroup":
        globalAttrGroups.add(name);
        break;
    }
  }
  checkDuplicateTopLevel(root, ["complexType", "simpleType"], "type");
  checkDuplicateTopLevel(root, ["element"], "element");
  checkDuplicateTopLevel(root, ["attribute"], "attribute");
  checkDuplicateTopLevel(root, ["group"], "group");
  checkDuplicateTopLevel(root, ["attributeGroup"], "attributeGroup");
  let hasIncludes = false;
  const importedNamespaces = /* @__PURE__ */ new Set();
  for (const ch of xsdChildren2(root)) {
    if (ch.localName === "include") hasIncludes = true;
    if (ch.localName === "import") {
      hasIncludes = true;
      const ns = ch.getAttribute("namespace");
      if (ns) importedNamespaces.add(ns);
    }
  }
  const refCtx = {
    tns,
    hasIncludes,
    importedNamespaces,
    globalElements,
    globalTypes,
    globalAttrs,
    globalGroups,
    globalAttrGroups
  };
  walkValidate(root, tns, globalElements, globalTypes, globalAttrs, globalGroups, globalAttrGroups, hasIncludes, refCtx);
  validateIdentityConstraints(root);
  validateXmlIds(root);
}
function checkDuplicateTopLevel(root, localNames, label) {
  const names = [];
  for (const ch of xsdChildren2(root)) {
    if (localNames.includes(ch.localName)) {
      const name = ch.getAttribute("name");
      if (name) names.push(name);
    }
  }
  const seen = /* @__PURE__ */ new Set();
  for (const name of names) {
    if (seen.has(name)) fail(`duplicate ${label} name: "${name}"`);
    seen.add(name);
  }
}
function walkValidate(node, tns, globalElements, globalTypes, globalAttrs, globalGroups, globalAttrGroups, hasIncludes, refCtx) {
  if (node.nodeType !== 1) return;
  if (node.namespaceURI === XSD_NS3) {
    if (node.localName === "annotation") {
      validateAnnotationContent(node);
      return;
    }
    validateNode(node, tns, globalElements, globalTypes, globalAttrs, globalGroups, globalAttrGroups, hasIncludes, refCtx);
  }
  for (let i = 0; i < node.childNodes.length; i++) {
    walkValidate(node.childNodes[i], tns, globalElements, globalTypes, globalAttrs, globalGroups, globalAttrGroups, hasIncludes, refCtx);
  }
}
function validateNode(node, tns, globalElements, globalTypes, globalAttrs, globalGroups, globalAttrGroups, hasIncludes, refCtx) {
  const ln = node.localName;
  const parent = node.parentNode;
  const parentLn = parent && parent.nodeType === 1 && parent.namespaceURI === XSD_NS3 ? parent.localName : null;
  const isGlobal = parentLn === "schema";
  const children = xsdChildren2(node);
  if (ln !== "schema") {
    validateAnnotationPlacement(children);
  }
  switch (ln) {
    case "element":
      validateElement(node, isGlobal, children, tns, globalElements, globalTypes, refCtx);
      break;
    case "attribute":
      validateAttribute(node, isGlobal, tns, globalAttrs, refCtx);
      break;
    case "complexType":
      validateComplexType(node, children);
      break;
    case "simpleType":
      validateSimpleType(node, children);
      break;
    case "restriction":
      validateRestriction(node, parentLn, children, refCtx);
      break;
    case "extension":
      validateExtension(node, parentLn, refCtx);
      break;
    case "all":
      validateAll(node, children);
      break;
    case "any":
    case "anyAttribute":
      validateWildcard(node);
      break;
    case "attributeGroup":
      validateAttributeGroupUsage(node, isGlobal, refCtx);
      break;
    case "group":
      validateGroupUsage(node, isGlobal, refCtx);
      break;
    case "pattern":
      if (node.hasAttribute("value")) {
        validateXsdRegex(node.getAttribute("value"));
      }
      break;
  }
  if (["element", "sequence", "choice", "all", "group", "any"].includes(ln)) {
    validateOccurs(node, ln, isGlobal);
  }
  if ((ln === "element" || ln === "attribute") && node.hasAttribute("form")) {
    const form = node.getAttribute("form");
    if (form !== "qualified" && form !== "unqualified") {
      fail(`invalid form value: "${form}" (must be qualified or unqualified)`);
    }
    if (isGlobal) {
      fail(`global xs:${ln} must not have "form" attribute`);
    }
  }
  if (ln === "complexType" || ln === "element") {
    validateBooleanAttr(node, "abstract");
    validateBooleanAttr(node, "mixed");
    validateBooleanAttr(node, "nillable");
  }
  if (ln === "element" && !isGlobal) {
    if (node.hasAttribute("final")) {
      fail('local xs:element must not have "final" attribute');
    }
    if (node.hasAttribute("substitutionGroup")) {
      fail('local xs:element must not have "substitutionGroup" attribute');
    }
  }
  if (ln === "attribute" && !isGlobal) {
    if (!node.hasAttribute("name") && !node.hasAttribute("ref")) {
      fail('xs:attribute must have "name" or "ref"');
    }
  }
  if (ln === "element" && !isGlobal) {
    if (!node.hasAttribute("name") && !node.hasAttribute("ref")) {
      fail('xs:element must have "name" or "ref"');
    }
  }
  if (ln === "element" && node.hasAttribute("block")) {
    validateTokenList(node.getAttribute("block"), VALID_BLOCK_ELEM, "block");
  }
  if (ln === "complexType" && node.hasAttribute("block")) {
    validateTokenList(node.getAttribute("block"), VALID_BLOCK_CT, "block");
  }
  if (ln === "element" && node.hasAttribute("final")) {
    validateTokenList(node.getAttribute("final"), VALID_FINAL_ELEM, "final");
  }
  if (ln === "simpleType" && node.hasAttribute("final")) {
    validateTokenList(node.getAttribute("final"), VALID_FINAL_ST, "final");
  }
  if (ln === "complexType" && node.hasAttribute("final")) {
    validateTokenList(node.getAttribute("final"), VALID_FINAL_CT, "final");
  }
}
function validateAnnotationContent(annotNode) {
  for (let i = 0; i < annotNode.childNodes.length; i++) {
    const ch = annotNode.childNodes[i];
    if (ch.nodeType !== 1) continue;
    if (ch.namespaceURI === XSD_NS3) {
      if (ch.localName !== "appinfo" && ch.localName !== "documentation") {
        fail(`xs:annotation may only contain xs:appinfo and xs:documentation, not xs:${ch.localName}`);
      }
    }
  }
}
function validateAnnotationPlacement(children) {
  let seenNonAnnotation = false;
  let annotationCount = 0;
  for (const ch of children) {
    if (ch.localName === "annotation") {
      annotationCount++;
      if (seenNonAnnotation) {
        fail("xs:annotation must appear before other content");
      }
      if (annotationCount > 1) {
        fail("at most one xs:annotation is allowed");
      }
    } else {
      seenNonAnnotation = true;
    }
  }
}
function validateElement(node, isGlobal, children, tns, globalElements, globalTypes, refCtx) {
  const hasRef = node.hasAttribute("ref");
  const hasName = node.hasAttribute("name");
  const hasType = node.hasAttribute("type");
  if (hasRef) {
    if (hasName) fail('xs:element must not have both "ref" and "name"');
    if (hasType) fail('xs:element must not have both "ref" and "type"');
    for (const ch of children) {
      if (ch.localName === "complexType" || ch.localName === "simpleType") {
        fail('xs:element with "ref" must not have inline type definition');
      }
    }
    validateQNameAttr(node, "ref", "element ref");
    checkRefResolution(node, "ref", refCtx, "globalElements", "element");
  }
  if (hasType) {
    for (const ch of children) {
      if (ch.localName === "complexType" || ch.localName === "simpleType") {
        fail('xs:element must not have both "type" attribute and inline type definition');
      }
    }
    validateQNameAttr(node, "type", "element type");
    checkTypeResolution(node, refCtx);
  }
  if (isGlobal && hasRef) {
    fail('global xs:element must not use "ref"');
  }
  if (isGlobal && (node.hasAttribute("minOccurs") || node.hasAttribute("maxOccurs"))) {
    fail("global xs:element must not have minOccurs/maxOccurs");
  }
  if (node.hasAttribute("default") && node.hasAttribute("fixed")) {
    fail('xs:element must not have both "default" and "fixed"');
  }
  if (!isGlobal && node.getAttribute("abstract") === "true") {
    fail("local xs:element must not be abstract");
  }
}
function validateAttribute(node, isGlobal, tns, globalAttrs, refCtx) {
  const hasRef = node.hasAttribute("ref");
  const hasName = node.hasAttribute("name");
  const hasType = node.hasAttribute("type");
  const use = node.getAttribute("use");
  if (hasRef) {
    if (hasName) fail('xs:attribute must not have both "ref" and "name"');
    if (hasType) fail('xs:attribute must not have both "ref" and "type"');
    validateQNameAttr(node, "ref", "attribute ref");
    checkRefResolution(node, "ref", refCtx, "globalAttrs", "attribute");
  }
  if (use && !VALID_USE.has(use)) {
    fail(`invalid xs:attribute use value: "${use}" (must be optional, required, or prohibited)`);
  }
  if (isGlobal && use) {
    fail('global xs:attribute must not have "use"');
  }
  if (isGlobal && hasRef) {
    fail('global xs:attribute must not use "ref"');
  }
  if (node.hasAttribute("default") && node.hasAttribute("fixed")) {
    fail('xs:attribute must not have both "default" and "fixed"');
  }
  if (use === "required" && node.hasAttribute("default")) {
    fail('xs:attribute with use="required" must not have "default"');
  }
  if (use === "prohibited") {
    if (node.hasAttribute("default")) fail('xs:attribute with use="prohibited" must not have "default"');
  }
  if (hasType) {
    validateQNameAttr(node, "type", "attribute type");
    checkTypeResolution(node, refCtx);
  }
}
function validateComplexType(node, children) {
  let contentModelCount = 0;
  let hasSimpleContent = false;
  let hasComplexContent = false;
  for (const ch of children) {
    if (ch.localName === "annotation") continue;
    if (["simpleContent", "complexContent", "sequence", "choice", "all", "group"].includes(ch.localName)) {
      contentModelCount++;
      if (ch.localName === "simpleContent") hasSimpleContent = true;
      if (ch.localName === "complexContent") hasComplexContent = true;
    }
  }
  if (contentModelCount > 1) {
    fail("xs:complexType must have at most one content model (sequence, choice, all, simpleContent, complexContent, or group)");
  }
  if (hasSimpleContent || hasComplexContent) {
    for (const ch of children) {
      if (ch.localName === "annotation") continue;
      if (ch.localName === "simpleContent" || ch.localName === "complexContent") continue;
      fail("xs:complexType with simpleContent/complexContent must not have other children like " + ch.localName);
    }
  }
  if (hasSimpleContent && node.getAttribute("mixed") === "true") {
    fail('xs:complexType with simpleContent must not have mixed="true"');
  }
  if (!hasSimpleContent && !hasComplexContent) {
    validateComplexTypeOrdering(children);
  }
  let anyAttrCount = 0;
  for (const ch of children) {
    if (ch.localName === "anyAttribute") anyAttrCount++;
  }
  if (anyAttrCount > 1) {
    fail("xs:complexType must have at most one xs:anyAttribute");
  }
}
function validateComplexTypeOrdering(children) {
  let seenAttr = false;
  for (const ch of children) {
    if (ch.localName === "annotation") continue;
    if (ch.localName === "attribute" || ch.localName === "attributeGroup") {
      seenAttr = true;
    } else if (["sequence", "choice", "all", "group"].includes(ch.localName)) {
      if (seenAttr) {
        fail("xs:complexType content model (sequence/choice/all/group) must appear before attributes");
      }
    }
  }
}
function validateDerivationContent(children, context) {
  let modelCount = 0;
  let anyAttrCount = 0;
  let seenAttr = false;
  for (const ch of children) {
    if (ch.localName === "annotation") continue;
    if (["sequence", "choice", "all", "group"].includes(ch.localName)) {
      modelCount++;
      if (seenAttr) {
        fail(`${context} content model must appear before attributes`);
      }
    }
    if (ch.localName === "attribute" || ch.localName === "attributeGroup") {
      seenAttr = true;
    }
    if (ch.localName === "anyAttribute") anyAttrCount++;
  }
  if (modelCount > 1) {
    fail(`${context} must have at most one content model (sequence, choice, all, or group)`);
  }
  if (anyAttrCount > 1) {
    fail(`${context} must have at most one xs:anyAttribute`);
  }
}
function validateSimpleType(node, children) {
  let varietyCount = 0;
  for (const ch of children) {
    if (ch.localName === "annotation") continue;
    if (["restriction", "list", "union"].includes(ch.localName)) varietyCount++;
  }
  if (varietyCount === 0) {
    fail("xs:simpleType must have one of: restriction, list, or union");
  }
  if (varietyCount > 1) {
    fail("xs:simpleType must have exactly one of: restriction, list, or union");
  }
}
function validateRestriction(node, parentLn, children, refCtx) {
  if (parentLn === "complexContent" || parentLn === "simpleContent") {
    if (!node.hasAttribute("base")) {
      fail(`xs:restriction in ${parentLn} must have "base" attribute`);
    }
    validateQNameAttr(node, "base", "restriction base");
    checkBaseTypeResolution(node, refCtx);
    if (parentLn === "complexContent") {
      validateDerivationContent(children, "xs:restriction in complexContent");
    }
  }
  if (parentLn === "simpleType") {
    if (!node.hasAttribute("base")) {
      let hasInlineST = false;
      for (const ch of children) {
        if (ch.localName === "simpleType") hasInlineST = true;
      }
      if (!hasInlineST) {
        fail('xs:restriction in simpleType must have "base" attribute or inline simpleType');
      }
    } else {
      validateQNameAttr(node, "base", "restriction base");
      checkBaseTypeResolution(node, refCtx);
    }
  }
  validateFacets(children);
  if (node.hasAttribute("base")) {
    const baseQN = resolvePrefix(node.getAttribute("base").trim(), node);
    if (baseQN && baseQN.ns === XSD_NS3) {
      validateFacetValuesForBuiltin(children, baseQN.local);
    }
  }
  if (parentLn === "simpleType" && node.hasAttribute("base")) {
    validateFacetsForListBase(node, children, refCtx);
  }
  if (parentLn === "simpleType" && node.hasAttribute("base")) {
    validateFacetsForUnionBase(node, children);
  }
}
function validateExtension(node, parentLn, refCtx) {
  if (parentLn === "complexContent" || parentLn === "simpleContent") {
    if (!node.hasAttribute("base")) {
      fail(`xs:extension in ${parentLn} must have "base" attribute`);
    }
    validateQNameAttr(node, "base", "extension base");
    checkBaseTypeResolution(node, refCtx);
    if (parentLn === "complexContent") {
      const children = xsdChildren2(node);
      validateDerivationContent(children, "xs:extension in complexContent");
    }
  }
}
function validateAll(node, children) {
  if (node.hasAttribute("maxOccurs")) {
    const v = node.getAttribute("maxOccurs");
    if (v !== "0" && v !== "1") {
      fail("xs:all maxOccurs must be 0 or 1");
    }
  }
  if (node.hasAttribute("minOccurs")) {
    const v = node.getAttribute("minOccurs");
    if (v !== "0" && v !== "1") {
      fail("xs:all minOccurs must be 0 or 1");
    }
  }
  const allElemNames = /* @__PURE__ */ new Set();
  for (const ch of children) {
    if (ch.localName === "annotation") continue;
    if (["choice", "sequence", "all", "group"].includes(ch.localName)) {
      fail("xs:all must only contain xs:element children (not " + ch.localName + ")");
    }
    if (ch.localName === "element") {
      if (ch.hasAttribute("maxOccurs")) {
        const maxV = ch.getAttribute("maxOccurs");
        if (maxV !== "0" && maxV !== "1") {
          fail("xs:element inside xs:all must have maxOccurs of 0 or 1");
        }
      }
      const name = ch.getAttribute("name");
      if (name) {
        if (allElemNames.has(name)) {
          fail(`duplicate element name "${name}" in xs:all`);
        }
        allElemNames.add(name);
      }
    }
  }
}
function validateWildcard(node) {
  if (node.hasAttribute("processContents")) {
    const pc = node.getAttribute("processContents");
    if (!VALID_PC.has(pc)) {
      fail(`invalid processContents value: "${pc}" (must be strict, lax, or skip)`);
    }
  }
  if (node.hasAttribute("namespace")) {
    const ns = node.getAttribute("namespace").trim();
    const parts = ns.split(/\s+/).filter(Boolean);
    const VALID_NS_TOKENS = /* @__PURE__ */ new Set(["##any", "##other", "##targetNamespace", "##local"]);
    for (const p of parts) {
      if (!VALID_NS_TOKENS.has(p) && p.startsWith("##")) {
        fail(`invalid wildcard namespace token: "${p}" (valid: ##any, ##other, ##targetNamespace, ##local, or a URI)`);
      }
    }
    if (parts.includes("##any") && parts.length > 1) {
      fail("##any must not be combined with other namespace values");
    }
    if (parts.includes("##other") && parts.length > 1) {
      fail("##other must not be combined with other namespace values");
    }
  }
}
function validateAttributeGroupUsage(node, isGlobal, refCtx) {
  if (!isGlobal && node.hasAttribute("ref")) {
    validateQNameAttr(node, "ref", "attributeGroup ref");
    checkRefResolution(node, "ref", refCtx, "globalAttrGroups", "attributeGroup");
  }
}
function validateGroupUsage(node, isGlobal, refCtx) {
  if (!isGlobal && node.hasAttribute("ref")) {
    validateQNameAttr(node, "ref", "group ref");
    checkRefResolution(node, "ref", refCtx, "globalGroups", "group");
  }
}
function validateOccurs(node, ln, isGlobal) {
  if (isGlobal && ln === "element") return;
  if (isGlobal && ln === "group") return;
  const NON_NEG_INT = /^\d+$/;
  if (node.hasAttribute("minOccurs")) {
    const v = node.getAttribute("minOccurs");
    if (!NON_NEG_INT.test(v)) {
      fail(`invalid minOccurs value: "${v}"`);
    }
  }
  if (node.hasAttribute("maxOccurs")) {
    const v = node.getAttribute("maxOccurs");
    if (v !== "unbounded" && !NON_NEG_INT.test(v)) {
      fail(`invalid maxOccurs value: "${v}"`);
    }
  }
  if (node.hasAttribute("minOccurs") && node.hasAttribute("maxOccurs")) {
    const minV = node.getAttribute("minOccurs");
    const maxV = node.getAttribute("maxOccurs");
    if (maxV !== "unbounded" && minV.length < 16 && maxV.length < 16) {
      const minN = parseInt(minV, 10);
      const maxN = parseInt(maxV, 10);
      if (!isNaN(minN) && !isNaN(maxN) && minN > maxN) {
        fail(`minOccurs (${minN}) must not exceed maxOccurs (${maxN})`);
      }
    }
  }
}
function validateFacets(children) {
  let hasLength = false, hasMinLength = false, hasMaxLength = false;
  let minLengthVal = null, maxLengthVal = null;
  let totalDigitsVal = null, fractionDigitsVal = null;
  for (const ch of children) {
    const val = ch.getAttribute("value");
    switch (ch.localName) {
      case "length":
        hasLength = true;
        if (val !== null) {
          const n = parseInt(val, 10);
          if (isNaN(n) || n < 0) fail(`invalid length value: "${val}"`);
        }
        break;
      case "minLength":
        hasMinLength = true;
        if (val !== null) {
          const n = parseInt(val, 10);
          if (isNaN(n) || n < 0) fail(`invalid minLength value: "${val}"`);
          minLengthVal = n;
        }
        break;
      case "maxLength":
        hasMaxLength = true;
        if (val !== null) {
          const n = parseInt(val, 10);
          if (isNaN(n) || n < 0) fail(`invalid maxLength value: "${val}"`);
          maxLengthVal = n;
        }
        break;
      case "totalDigits":
        if (val !== null) {
          const n = parseInt(val, 10);
          if (isNaN(n) || n <= 0) fail(`totalDigits must be a positive integer, got: "${val}"`);
          totalDigitsVal = n;
        }
        break;
      case "fractionDigits":
        if (val !== null) {
          const n = parseInt(val, 10);
          if (isNaN(n) || n < 0) fail(`invalid fractionDigits value: "${val}"`);
          fractionDigitsVal = n;
        }
        break;
    }
  }
  if (hasLength && (hasMinLength || hasMaxLength)) {
    fail("xs:length must not be used together with minLength or maxLength");
  }
  if (minLengthVal !== null && maxLengthVal !== null && minLengthVal > maxLengthVal) {
    fail(`minLength (${minLengthVal}) must not exceed maxLength (${maxLengthVal})`);
  }
  if (totalDigitsVal !== null && fractionDigitsVal !== null && fractionDigitsVal > totalDigitsVal) {
    fail(`fractionDigits (${fractionDigitsVal}) must not exceed totalDigits (${totalDigitsVal})`);
  }
}
function validateQNameAttr(node, attrName, context) {
  const raw = node.getAttribute(attrName);
  if (!raw) return;
  const val = raw.trim();
  if (val === "") {
    fail(`empty ${context} QName`);
  }
  if (val.startsWith(":") || val.endsWith(":")) {
    fail(`invalid ${context} QName: "${val}"`);
  }
  if (val.includes(":")) {
    const qn = resolvePrefix(val, node);
    if (!qn.ns) {
      fail(`unresolved prefix in ${context}: "${val}"`);
    }
  }
}
var XSD_BUILTIN_TYPES = /* @__PURE__ */ new Set([
  "string",
  "boolean",
  "decimal",
  "float",
  "double",
  "duration",
  "dateTime",
  "time",
  "date",
  "gYearMonth",
  "gYear",
  "gMonthDay",
  "gDay",
  "gMonth",
  "hexBinary",
  "base64Binary",
  "anyURI",
  "QName",
  "NOTATION",
  "normalizedString",
  "token",
  "language",
  "NMTOKEN",
  "NMTOKENS",
  "Name",
  "NCName",
  "ID",
  "IDREF",
  "IDREFS",
  "ENTITY",
  "ENTITIES",
  "integer",
  "nonPositiveInteger",
  "negativeInteger",
  "long",
  "int",
  "short",
  "byte",
  "nonNegativeInteger",
  "unsignedLong",
  "unsignedInt",
  "unsignedShort",
  "unsignedByte",
  "positiveInteger",
  "anyType",
  "anySimpleType"
]);
function checkRefResolution(node, attrName, refCtx, globalSetName, kind) {
  const raw = node.getAttribute(attrName);
  if (!raw) return;
  const qn = resolvePrefix(raw.trim(), node);
  if (!qn) return;
  const refNs = qn.prefix ? qn.ns : null;
  if (refNs !== refCtx.tns) return;
  if (refCtx.hasIncludes) return;
  if (!refCtx[globalSetName].has(qn.local)) {
    fail(`unresolved ${kind} reference: "${raw.trim()}"`);
  }
}
function checkTypeResolution(node, refCtx) {
  const raw = node.getAttribute("type");
  if (!raw) return;
  const val = raw.trim();
  const qn = resolvePrefix(val, node);
  if (!qn) return;
  if (qn.ns === XSD_NS3) {
    if (!XSD_BUILTIN_TYPES.has(qn.local)) {
      fail(`unknown XSD built-in type: "${val}"`);
    }
    return;
  }
  const typeNs = qn.prefix ? qn.ns : null;
  if (typeNs !== refCtx.tns) return;
  if (refCtx.hasIncludes) return;
  if (!refCtx.globalTypes.has(qn.local)) {
    fail(`unresolved type reference: "${val}"`);
  }
}
function checkBaseTypeResolution(node, refCtx) {
  const raw = node.getAttribute("base");
  if (!raw) return;
  const val = raw.trim();
  const qn = resolvePrefix(val, node);
  if (!qn) return;
  if (qn.ns === XSD_NS3) {
    if (!XSD_BUILTIN_TYPES.has(qn.local)) {
      fail(`unknown XSD built-in type: "${val}"`);
    }
    return;
  }
  const typeNs = qn.prefix ? qn.ns : null;
  if (typeNs !== refCtx.tns) return;
  if (refCtx.hasIncludes) return;
  if (!refCtx.globalTypes.has(qn.local)) {
    fail(`unresolved base type reference: "${val}"`);
  }
}
function validateBooleanAttr(node, attrName) {
  if (!node.hasAttribute(attrName)) return;
  const val = node.getAttribute(attrName);
  if (val !== "true" && val !== "false" && val !== "1" && val !== "0") {
    fail(`invalid boolean value for ${attrName}: "${val}" (must be true, false, 1, or 0)`);
  }
}
var LIST_INVALID_FACETS = /* @__PURE__ */ new Set([
  "minInclusive",
  "maxInclusive",
  "minExclusive",
  "maxExclusive",
  "totalDigits",
  "fractionDigits"
]);
function validateFacetsForListBase(node, children, refCtx) {
  const baseQN = resolvePrefix(node.getAttribute("base").trim(), node);
  if (!baseQN) return;
  const listBuiltins = /* @__PURE__ */ new Set(["NMTOKENS", "IDREFS", "ENTITIES"]);
  let isList = false;
  if (baseQN.ns === XSD_NS3 && listBuiltins.has(baseQN.local)) {
    isList = true;
  }
  if (!isList && !baseQN.prefix) {
    const root = node.ownerDocument.documentElement;
    for (const ch of xsdChildren2(root)) {
      if (ch.localName === "simpleType" && ch.getAttribute("name") === baseQN.local) {
        for (const sch of xsdChildren2(ch)) {
          if (sch.localName === "list") {
            isList = true;
            break;
          }
        }
        break;
      }
    }
  }
  if (!isList) return;
  for (const ch of children) {
    if (LIST_INVALID_FACETS.has(ch.localName)) {
      fail(`facet "${ch.localName}" is not allowed on list type`);
    }
  }
}
var UNION_VALID_FACETS = /* @__PURE__ */ new Set(["pattern", "enumeration"]);
function validateFacetsForUnionBase(node, children) {
  const baseQN = resolvePrefix(node.getAttribute("base").trim(), node);
  if (!baseQN) return;
  let isUnion = false;
  if (baseQN.ns !== XSD_NS3) {
    const localName = baseQN.prefix ? null : baseQN.local;
    if (localName) {
      const root = node.ownerDocument.documentElement;
      for (const ch of xsdChildren2(root)) {
        if (ch.localName === "simpleType" && ch.getAttribute("name") === localName) {
          for (const sch of xsdChildren2(ch)) {
            if (sch.localName === "union") {
              isUnion = true;
              break;
            }
          }
          break;
        }
      }
    }
  }
  if (!isUnion) return;
  for (const ch of children) {
    if (ch.nodeType === 1 && ch.namespaceURI === XSD_NS3 && !UNION_VALID_FACETS.has(ch.localName) && ch.localName !== "simpleType" && ch.localName !== "annotation") {
      fail(`facet "${ch.localName}" is not allowed on union type`);
    }
  }
}
var VALID_SINGLE_ESCAPES = /* @__PURE__ */ new Set([
  "n",
  "r",
  "t",
  "\\",
  "|",
  ".",
  "-",
  "^",
  "?",
  "*",
  "+",
  "{",
  "}",
  "(",
  ")",
  "[",
  "]",
  "$",
  "s",
  "S",
  "d",
  "D",
  "w",
  "W",
  "i",
  "I",
  "c",
  "C"
]);
function validateXsdRegex(pattern) {
  const src = pattern;
  let i = 0;
  let parenDepth = 0;
  while (i < src.length) {
    const ch = src[i];
    if (ch === "(" && i + 1 < src.length && src[i + 1] === "?") {
      fail(`invalid XSD regex: "(?..." group extension not allowed in pattern "${pattern.substring(0, 60)}"`);
    }
    if (ch === "(") {
      parenDepth++;
      if (i + 1 < src.length && "*+?{".includes(src[i + 1])) {
        fail(`invalid XSD regex: quantifier after "(" in pattern "${pattern.substring(0, 60)}"`);
      }
      i++;
      continue;
    }
    if (ch === ")") {
      if (parenDepth <= 0) {
        fail(`invalid XSD regex: unmatched ")" in pattern "${pattern.substring(0, 60)}"`);
      }
      parenDepth--;
      i++;
      continue;
    }
    if (ch === "[") {
      i++;
      if (i < src.length && src[i] === "^") i++;
      if (i < src.length && src[i] === "]") i++;
      let depth = 1;
      while (i < src.length && depth > 0) {
        if (src[i] === "\\") {
          if (i + 1 < src.length) {
            validateXsdEscape(src, i, pattern);
            if (i >= 2 && src[i - 1] === "-" && "dDsSwWiIcCpP".includes(src[i + 1])) {
              const dashPos = i - 1;
              let classBodyStart = -1;
              for (let j = dashPos - 1; j >= 0; j--) {
                if (src[j] === "[") {
                  classBodyStart = j + 1;
                  break;
                }
                if (src[j] === "^" && j > 0 && src[j - 1] === "[") {
                  classBodyStart = j + 1;
                  break;
                }
              }
              if (classBodyStart !== -1 && dashPos > classBodyStart && src[dashPos - 1] !== "[" && src[dashPos - 1] !== "^") {
                fail(`invalid XSD regex: character range to shorthand class in pattern "${pattern.substring(0, 60)}"`);
              }
            }
          }
          i += 2;
          if (i - 1 < src.length && (src[i - 1] === "p" || src[i - 1] === "P")) {
            if (i < src.length && src[i] === "{") {
              const close = src.indexOf("}", i);
              if (close !== -1) i = close + 1;
            }
          }
          continue;
        }
        if (src[i] === "[") {
          depth++;
          i++;
          continue;
        }
        if (src[i] === "]") {
          depth--;
          if (depth === 0) {
            i++;
            break;
          }
          i++;
          continue;
        }
        i++;
      }
      continue;
    }
    if (ch === "]") {
      fail(`invalid XSD regex: unmatched "]" in pattern "${pattern.substring(0, 60)}"`);
    }
    if (ch === "\\") {
      if (i + 1 >= src.length) {
        fail(`invalid XSD regex: trailing backslash in pattern "${pattern.substring(0, 60)}"`);
      }
      validateXsdEscape(src, i, pattern);
      i += 2;
      if (src[i - 1] === "p" || src[i - 1] === "P") {
        if (i < src.length && src[i] === "{") {
          const close = src.indexOf("}", i);
          if (close !== -1) i = close + 1;
        }
      }
      continue;
    }
    if ("*+?".includes(ch)) {
      if (i === 0) {
        fail(`invalid XSD regex: quantifier "${ch}" at start of expression in pattern "${pattern.substring(0, 60)}"`);
      }
      if (src[i - 1] === "|" && (i < 2 || src[i - 2] !== "\\")) {
        fail(`invalid XSD regex: quantifier "${ch}" at start of alternative in pattern "${pattern.substring(0, 60)}"`);
      }
      if (i + 1 < src.length && src[i + 1] === "?") {
        fail(`invalid XSD regex: lazy quantifier "${ch}?" not allowed in pattern "${pattern.substring(0, 60)}"`);
      }
      if (i + 1 < src.length && src[i + 1] === "+") {
        fail(`invalid XSD regex: possessive quantifier "${ch}+" not allowed in pattern "${pattern.substring(0, 60)}"`);
      }
      if (i + 1 < src.length && "*+?".includes(src[i + 1])) {
        fail(`invalid XSD regex: stacked quantifiers "${ch}${src[i + 1]}" in pattern "${pattern.substring(0, 60)}"`);
      }
      if (i + 1 < src.length && src[i + 1] === "{") {
        fail(`invalid XSD regex: stacked quantifiers "${ch}{..." in pattern "${pattern.substring(0, 60)}"`);
      }
      i++;
      continue;
    }
    if (ch === "{") {
      const closeBrace = src.indexOf("}", i);
      if (closeBrace === -1) {
        fail(`invalid XSD regex: unclosed "{" in pattern "${pattern.substring(0, 60)}"`);
      }
      const quantBody = src.slice(i + 1, closeBrace);
      if (!/^\d+(,\d*)?$/.test(quantBody)) {
        fail(`invalid XSD regex: invalid quantifier "{${quantBody}}" in pattern "${pattern.substring(0, 60)}"`);
      }
      const commaIdx = quantBody.indexOf(",");
      if (commaIdx !== -1) {
        const maxStr = quantBody.slice(commaIdx + 1);
        if (maxStr !== "") {
          const minVal = parseInt(quantBody.slice(0, commaIdx), 10);
          const maxVal = parseInt(maxStr, 10);
          if (minVal > maxVal) {
            fail(`invalid XSD regex: min (${minVal}) exceeds max (${maxVal}) in "{${quantBody}}" in pattern "${pattern.substring(0, 60)}"`);
          }
        }
      }
      i = closeBrace + 1;
      if (i < src.length && "*+?".includes(src[i])) {
        fail(`invalid XSD regex: quantifier after "{...}" in pattern "${pattern.substring(0, 60)}"`);
      }
      continue;
    }
    i++;
  }
  if (parenDepth > 0) {
    fail(`invalid XSD regex: unmatched "(" in pattern "${pattern.substring(0, 60)}"`);
  }
}
function validateXsdEscape(src, pos, pattern) {
  const next = src[pos + 1];
  if (next === "p" || next === "P") {
    if (pos + 2 < src.length && src[pos + 2] === "{") {
      const close = src.indexOf("}", pos + 3);
      if (close === -1) {
        fail(`invalid XSD regex: unclosed property escape in pattern "${pattern.substring(0, 60)}"`);
      }
      return;
    }
    fail(`invalid XSD regex: "\\${next}" must be followed by "{" in pattern "${pattern.substring(0, 60)}"`);
  }
  if (!VALID_SINGLE_ESCAPES.has(next)) {
    fail(`invalid XSD regex: "\\${next}" is not a valid escape in pattern "${pattern.substring(0, 60)}"`);
  }
}
function validateIdentityConstraints(root) {
  const allConstraintNames = /* @__PURE__ */ new Map();
  collectIdentityConstraints(root, allConstraintNames);
}
function collectIdentityConstraints(node, allConstraintNames) {
  if (node.nodeType !== 1) return;
  if (node.namespaceURI === XSD_NS3 && node.localName === "element") {
    const localConstraints = /* @__PURE__ */ new Map();
    const keyrefs = [];
    for (let i = 0; i < node.childNodes.length; i++) {
      const ch = node.childNodes[i];
      if (ch.nodeType !== 1 || ch.namespaceURI !== XSD_NS3) continue;
      if (ch.localName === "key" || ch.localName === "unique" || ch.localName === "keyref") {
        const name = ch.getAttribute("name");
        if (!name) {
          fail(`xs:${ch.localName} must have a "name" attribute`);
        }
        if (!/^[^\d\s.:][^\s:]*$/.test(name)) {
          fail(`xs:${ch.localName} name "${name}" is not a valid NCName`);
        }
        if (localConstraints.has(name)) {
          fail(`duplicate identity constraint name "${name}"`);
        }
        localConstraints.set(name, ch.localName);
        allConstraintNames.set(name, ch.localName);
        const idcChildren = xsdChildren2(ch);
        let hasSelector = false, fieldCount = 0;
        for (const icc of idcChildren) {
          if (icc.localName === "selector") hasSelector = true;
          if (icc.localName === "field") fieldCount++;
        }
        if (!hasSelector) fail(`xs:${ch.localName} "${name}" must have a xs:selector`);
        if (fieldCount === 0) fail(`xs:${ch.localName} "${name}" must have at least one xs:field`);
        for (const icc of idcChildren) {
          if (icc.localName === "selector" || icc.localName === "field") {
            if (!icc.hasAttribute("xpath")) {
              fail(`xs:${icc.localName} must have an "xpath" attribute`);
            }
            const xpath = icc.getAttribute("xpath");
            if (!xpath || xpath.trim() === "") {
              fail(`xs:${icc.localName} xpath must not be empty`);
            }
          }
        }
        if (ch.localName === "keyref") {
          keyrefs.push(ch);
        }
      }
    }
    for (const kr of keyrefs) {
      const refer = kr.getAttribute("refer");
      if (!refer) {
        fail('xs:keyref must have a "refer" attribute');
      }
      const trimmed = refer.trim();
      const qn = resolvePrefix(trimmed, kr);
      if (!qn) continue;
      if (qn.prefix) continue;
      if (!allConstraintNames.has(qn.local)) {
        fail(`xs:keyref "${kr.getAttribute("name")}" refers to undeclared constraint "${trimmed}"`);
      }
      const referredKind = allConstraintNames.get(qn.local);
      if (referredKind === "keyref") {
        fail(`xs:keyref "${kr.getAttribute("name")}" cannot refer to another keyref "${trimmed}"`);
      }
    }
  }
  for (let i = 0; i < node.childNodes.length; i++) {
    collectIdentityConstraints(node.childNodes[i], allConstraintNames);
  }
}
function validateXmlIds(root) {
  const ids = /* @__PURE__ */ new Set();
  walkIds(root, ids);
}
function walkIds(node, ids) {
  if (node.nodeType !== 1) return;
  if (node.hasAttribute("id")) {
    const id = node.getAttribute("id");
    if (id === "" || !/^[^\d\s.:][^\s:]*$/.test(id)) {
      fail(`invalid xs:id value: "${id}" (must be a valid NCName)`);
    }
    if (ids.has(id)) {
      fail(`duplicate xs:id value: "${id}"`);
    }
    ids.add(id);
  }
  for (let i = 0; i < node.childNodes.length; i++) {
    walkIds(node.childNodes[i], ids);
  }
}
var INTEGER_RANGES = {
  "byte": { min: -128n, max: 127n },
  "short": { min: -32768n, max: 32767n },
  "int": { min: -2147483648n, max: 2147483647n },
  "long": { min: -9223372036854775808n, max: 9223372036854775807n },
  "unsignedByte": { min: 0n, max: 255n },
  "unsignedShort": { min: 0n, max: 65535n },
  "unsignedInt": { min: 0n, max: 4294967295n },
  "unsignedLong": { min: 0n, max: 18446744073709551615n },
  "positiveInteger": { min: 1n, max: null },
  "nonNegativeInteger": { min: 0n, max: null },
  "negativeInteger": { min: null, max: -1n },
  "nonPositiveInteger": { min: null, max: 0n },
  "integer": { min: null, max: null }
};
var INTEGER_TYPES = new Set(Object.keys(INTEGER_RANGES));
var DECIMAL_TYPES = /* @__PURE__ */ new Set([...INTEGER_TYPES, "decimal"]);
var DATE_TIME_PATTERNS = {
  "date": /^-?\d{4,}-\d{2}-\d{2}(Z|[+-]\d{2}:\d{2})?$/,
  "time": /^\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
  "dateTime": /^-?\d{4,}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/,
  "gYear": /^-?\d{4,}(Z|[+-]\d{2}:\d{2})?$/,
  "gYearMonth": /^-?\d{4,}-\d{2}(Z|[+-]\d{2}:\d{2})?$/,
  "gMonth": /^--\d{2}(Z|[+-]\d{2}:\d{2})?$/,
  "gMonthDay": /^--\d{2}-\d{2}(Z|[+-]\d{2}:\d{2})?$/,
  "gDay": /^---\d{2}(Z|[+-]\d{2}:\d{2})?$/,
  "duration": /^-?P(\d+Y)?(\d+M)?(\d+D)?(T(\d+H)?(\d+M)?(\d+(\.\d+)?S)?)?$/
};
var VALUE_FACETS = /* @__PURE__ */ new Set([
  "enumeration",
  "minInclusive",
  "maxInclusive",
  "minExclusive",
  "maxExclusive"
]);
function validateFacetValuesForBuiltin(children, baseTypeName) {
  let minIncl = null, maxIncl = null, minExcl = null, maxExcl = null;
  for (const ch of children) {
    const ln = ch.localName;
    if (!VALUE_FACETS.has(ln)) continue;
    const val = ch.getAttribute("value");
    if (val === null) continue;
    const trimmed = val.trim();
    if (INTEGER_TYPES.has(baseTypeName)) {
      if (!/^[+-]?\d+$/.test(trimmed) || trimmed === "") {
        fail(`invalid ${ln} value "${val}" for type xs:${baseTypeName} (must be a valid integer)`);
      }
      try {
        const n = BigInt(trimmed);
        const range = INTEGER_RANGES[baseTypeName];
        if (range.min !== null && n < range.min) {
          fail(`${ln} value "${val}" is out of range for type xs:${baseTypeName}`);
        }
        if (range.max !== null && n > range.max) {
          fail(`${ln} value "${val}" is out of range for type xs:${baseTypeName}`);
        }
        if (ln === "minInclusive") minIncl = n;
        else if (ln === "maxInclusive") maxIncl = n;
        else if (ln === "minExclusive") minExcl = n;
        else if (ln === "maxExclusive") maxExcl = n;
      } catch {
        fail(`invalid ${ln} value "${val}" for type xs:${baseTypeName}`);
      }
      continue;
    }
    if (baseTypeName === "decimal") {
      if (trimmed === "" || !/^[+-]?(\d+\.?\d*|\d*\.?\d+)$/.test(trimmed)) {
        fail(`invalid ${ln} value "${val}" for type xs:decimal`);
      }
      continue;
    }
    if (baseTypeName === "float" || baseTypeName === "double") {
      if (trimmed === "") {
        fail(`invalid ${ln} value "${val}" for type xs:${baseTypeName}`);
      }
      if (trimmed !== "INF" && trimmed !== "-INF" && trimmed !== "NaN") {
        if (!/^[+-]?(\d+\.?\d*|\d*\.?\d+)([eE][+-]?\d+)?$/.test(trimmed)) {
          fail(`invalid ${ln} value "${val}" for type xs:${baseTypeName}`);
        }
      }
      continue;
    }
    if (baseTypeName === "boolean") {
      if (trimmed !== "true" && trimmed !== "false" && trimmed !== "1" && trimmed !== "0") {
        fail(`invalid ${ln} value "${val}" for type xs:boolean`);
      }
      continue;
    }
    const dtPattern = DATE_TIME_PATTERNS[baseTypeName];
    if (dtPattern) {
      if (trimmed === "" || !dtPattern.test(trimmed)) {
        fail(`invalid ${ln} value "${val}" for type xs:${baseTypeName}`);
      }
      if (baseTypeName === "duration" && trimmed !== "") {
        const afterP = trimmed.replace(/^-?P/, "");
        if (afterP === "" || afterP === "T") {
          fail(`invalid ${ln} value "${val}" for type xs:duration (empty duration)`);
        }
      }
      continue;
    }
    if (baseTypeName === "hexBinary") {
      if (!/^([0-9a-fA-F]{2})*$/.test(trimmed)) {
        fail(`invalid ${ln} value "${val}" for type xs:hexBinary`);
      }
      continue;
    }
  }
  if (minIncl !== null && maxIncl !== null && minIncl > maxIncl) {
    fail(`minInclusive (${minIncl}) exceeds maxInclusive (${maxIncl})`);
  }
  if (minExcl !== null && maxExcl !== null && minExcl >= maxExcl) {
    fail(`minExclusive (${minExcl}) must be less than maxExclusive (${maxExcl})`);
  }
  if (minIncl !== null && maxExcl !== null && minIncl >= maxExcl) {
    fail(`minInclusive (${minIncl}) must be less than maxExclusive (${maxExcl})`);
  }
  if (minExcl !== null && maxIncl !== null && minExcl >= maxIncl) {
    fail(`minExclusive (${minExcl}) must be less than maxInclusive (${maxIncl})`);
  }
}
function validateTokenList(value, validTokens, attrName) {
  if (!value && value !== "") return;
  const trimmed = value.trim();
  if (trimmed === "") return;
  const parts = trimmed.split(/\s+/);
  for (const p of parts) {
    if (!validTokens.has(p)) {
      fail(`invalid value "${p}" in ${attrName} (valid: ${[...validTokens].join(", ")})`);
    }
  }
  if (parts.includes("#all") && parts.length > 1) {
    fail(`#all must not be combined with other values in ${attrName}`);
  }
}

// src/compiler/index.js
function compileSchema(xsd, options) {
  validateSchemaDoc(xsd);
  const ir = parseSchema(xsd, options);
  const validator = createValidator(ir);
  return {
    /**
     * Validate an XML document against this schema.
     * @param {string|Document} xml — XML source or parsed Document
     * @returns {{ valid: boolean, errors: Array<{ message: string, xpath: string }> }}
     */
    validate(xml) {
      const doc = toDocument(xml);
      return validator(doc);
    },
    /** The parsed schema IR (for debugging) */
    ir
  };
}

// src/index.js
function validate(xsd, xml) {
  return compileSchema(xsd).validate(xml);
}
export {
  compileSchema as compile,
  validate
};
