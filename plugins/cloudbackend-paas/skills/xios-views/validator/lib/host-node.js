/**
 * Node host bindings for the validator.
 *
 * Counterpart to host-xios.js: the same five methods, backed by the filesystem
 * and @xmldom/xmldom instead of sys.* / xml.*. Only the Node entry point
 * (validator/cli.js) imports this — the XIOS loader must never reach it,
 * since the `node:*` imports below would be unresolvable over xios://.
 */

import { existsSync } from "node:fs";
import { readFile as fsReadFile } from "node:fs/promises";
import { dirname, join as pathJoin, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DOMParser } from "../vendor/xmldom/lib/index.js";

// There is no sys.runtime here, so locate the schemas from this file's own
// location: host-node.js sits at <package>/lib/. Deriving it this way rather
// than from process.cwd() keeps the CLI working from any directory.
const PKG = resolve(dirname(fileURLToPath(import.meta.url)), "..");

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
  return pathJoin(base, rel);
}

/**
 * Directory holding application.xsd / view.xsd / process.xsd. The published
 * package carries them at <package>/schemas (staged in by scripts/stage.js at
 * pack time); in the xios repository checkout they live at the repository
 * root instead, one level above the package folder.
 *
 * @returns {String}
 */
function schemaDir() {
  const staged = pathJoin(PKG, "schemas");
  if( existsSync(staged) ) {
    return staged;
  }
  return pathJoin(PKG, "../config/schemas");
}

/**
 * Reads a file as text.
 *
 * @param {String} path
 *  Filesystem path, absolute or relative to the working directory.
 * @returns {Promise<String>}
 */
function readFile(path) {
  return fsReadFile(path, "utf8");
}

// xmldom raises a ParseError of its own for fatalError, but merely reports the
// recoverable "error" level and keeps parsing — so a document a browser would
// reject with <parsererror> could otherwise reach schema validation
// half-parsed. Throwing on that level is the equivalent of the parsererror
// check the XIOS host does. fatalError is left alone so its message arrives
// once rather than wrapped in this one.
function onError(level, message) {
  if( level === "error" ) {
    throw new Error(message);
  }
}

class StrictDOMParser extends DOMParser {
  constructor(options = {}) {
    super({ onError, ...options });
  }
}

// x-xsd.js and open-content.js read globalThis.DOMParser directly rather than
// taking it from the host, and the browser supplies one where XIOS runs. This
// is the Node-only module, so it is the right place to fill that in.
globalThis.DOMParser = StrictDOMParser;

/**
 * Parses XML, throwing on malformed input.
 *
 * @param {String} text
 *  XML source.
 * @returns {Document}
 * @throws {Error} when the source is not well-formed.
 */
function parseXml(text) {
  return new StrictDOMParser().parseFromString(text, "application/xml");
}

/**
 * Reads the document at `href` and returns its source. Here an href is a plain
 * filesystem path; the docMng URIs the runtime accepts have no equivalent, so
 * they are reported rather than handed to the filesystem as a missing file.
 *
 * @param {String} href
 *  Filesystem path to an XML document.
 * @returns {Promise<String>}
 */
async function loadHref(href) {
  if( /^[a-z][\w+.-]*:\/\//i.test(href) ) {
    throw new Error(
      "\"" + href + "\" is a runtime URI; outside XIOS `href` must be a filesystem path."
    );
  }
  return readFile(href);
}

export const hostNode = { join, schemaDir, readFile, parseXml, loadHref };
