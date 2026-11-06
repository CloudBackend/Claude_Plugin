#!/usr/bin/env node
/**
 * Node entry point for the XIOS document validator — `npm run validate`.
 *
 * Counterpart to ai/mcp/tools/xiosTools/validate.js, which is the same
 * validator bound to the XIOS host instead. This file is the only place the
 * Node bindings are imported, which is what keeps `node:*` out of anything the
 * XIOS module loader can reach.
 *
 * Usage:  npm run validate -- <file.xml> [more.xml ...] [--json]
 *
 * Exit codes:
 *   0  every document is valid
 *   1  at least one document is invalid
 *   2  the validator could not run (bad usage, or schemas missing)
 */

import { createValidator } from "./lib/validate-core.js";
import { hostNode } from "./lib/host-node.js";

const USAGE = "usage: npm run validate -- <file.xml> [more.xml ...] [--json]";

// No docs loader: the documentation corpus is served by the runtime's docMng,
// so errors outside XIOS carry their message and xpath but no `docs` section.
const { execute } = createValidator(hostNode);

function formatIssue(issue) {
  const rule = issue.rule ? " [" + issue.rule + "]" : "";
  return "  " + (issue.xpath || "/") + rule + "\n    " + issue.message;
}

function report(file, res) {
  if( res.unsupported ) {
    console.log(file + ": skipped — " + res.unsupported);
    return;
  }

  const warnings = res.warnings || [];
  const errors = res.errors || [];

  if( res.valid && !warnings.length ) {
    console.log(file + ": valid");
    return;
  }

  if( res.valid ) {
    console.log(file + ": valid, " + warnings.length + " warning(s)");
  } else {
    console.log(file + ": INVALID, " + errors.length + " error(s)");
    for( const err of errors ) {
      console.log(formatIssue(err));
    }
  }

  for( const warn of warnings ) {
    console.log("  warning " + formatIssue(warn).trimStart());
  }
}

async function main(argv) {
  const json = argv.includes("--json");
  const files = argv.filter((arg) => {
    return !arg.startsWith("-");
  });

  if( !files.length ) {
    console.error(USAGE);
    return 2;
  }

  const results = [];
  for( const file of files ) {
    // eslint-disable-next-line no-await-in-loop
    const res = await execute({ href: file }, { docs: false });
    results.push({ file, ...res });
  }

  if( json ) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    for( const res of results ) {
      report(res.file, res);
    }
  }

  if( results.some((res) => {
    return res.infrastructure;
  }) ) {
    console.error("Validator could not run: schemas could not be loaded from " + hostNode.schemaDir() + ".");
    return 2;
  }

  return results.every((res) => {
    return res.valid;
  }) ? 0 : 1;
}

process.exitCode = await main(process.argv.slice(2));
