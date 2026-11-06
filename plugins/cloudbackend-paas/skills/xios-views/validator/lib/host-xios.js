/**
 * XIOS host bindings for the validator.
 *
 * Every `sys.*`, `xml.*` and global-DOM reference the validator needs lives in
 * this file. `validate-core.js` is pure logic and receives one of these host
 * objects; the Node build passes `host-node.js` instead and never loads this
 * module. Keeping the two apart matters because `validate.js` is fetched over
 * `xios://` by `sys.appMng.getJsModule`, so it must never reach a static
 * `node:*` import, and the Node entry point must never reach `sys`.
 */

/**
 * Joins two path segments.
 *
 * @param {String} base
 *  Leading segment.
 * @param {String} rel
 *  Trailing segment.
 * @returns {String}
 */
function join(base, rel) {
  return sys.util.combinePath(base, rel);
}

/**
 * Directory holding application.xsd / view.xsd / process.xsd.
 *
 * @returns {String}
 */
function schemaDir() {
  return sys.util.combinePath(sys.runtime, "config/schemas");
}

/**
 * Reads a file as text.
 *
 * @param {String} path
 *  Runtime-relative path, as produced by join()/schemaDir().
 * @returns {Promise<String>}
 */
async function readFile(path) {
  const res = await fetch(path);
  return res.text();
}

/**
 * Parses XML, throwing on malformed input.
 *
 * @param {String} text
 *  XML source.
 * @returns {Document}
 * @throws {Error} when the source is not well-formed.
 */
function parseXml(text) {
  const doc = xml.createXMLDocument(text, "application/xml");
  const parseError = doc && doc.getElementsByTagName("parsererror")[0];
  if( parseError ) {
    throw new Error(parseError.textContent);
  }
  return doc;
}

/**
 * Loads a saved document from the docMng and returns its serialised source.
 *
 * @param {String} href
 *  An xios:// URI.
 * @returns {Promise<String>}
 */
function loadHref(href) {
  return new Promise((resolve, reject) => {
    sys.docMng.getDocument(href).addCallbacks((xdoc) => {
        const doc = xdoc && xdoc.doc;
        if( !doc ) {
          reject(new Error("No content at " + href));
          return;
        }
        resolve(new XMLSerializer().serializeToString(doc));
      },
      (err) => {
        return reject(new Error("Failed to load " + href + ": " + err));
      }
    );
  });
}

export const hostXios = { join, schemaDir, readFile, parseXml, loadHref };
