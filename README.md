# CloudBackend PaaS for Claude

A Claude Code plugin marketplace with one plugin, `cloudbackend-paas`, for building XIOS/3
applications and deploying them to CloudBackend PaaS. The plugin connects Claude to one
MCP server and adds skills for writing and shipping the application:

- `cbemcp` — reading, uploading and deploying projects, at `https://mcp.cloudbackend.com/mcp/<tenant>`
- `xios-apps` — project layout, the manifest, uploading, and when to ask before deploying
  or deleting
- `xios-views`, `xios-process`, `xios-theme`, `xios-extend`, `xios-db` — the XIOS skills
  from [skills.xios3.com](https://skills.xios3.com/), with the XIOS validator

## Installing

```
/plugin marketplace add linushjeltman/cbe-connector
/plugin install cloudbackend-paas@cloudbackend
```

You are asked for your tenant when the plugin is installed or enabled from `/plugin` in a
session. `claude plugin install` run from the shell does not ask, so pass it there with
`--config tenant=<tenant>`. Restart Claude Code, then run `/mcp` to log in to `cbemcp`.

See [plugins/cloudbackend-paas/README.md](plugins/cloudbackend-paas/README.md) for how the
login works, changing the tenant, and rolling the plugin out to a whole team.

## Releasing

Bump `version` in `plugins/cloudbackend-paas/.claude-plugin/plugin.json` for every
release, since that is what tells installed copies there is an update, and tag the commit
`v<version>`. To pull the newest XIOS skills first, run `scripts/sync-xios-skills.sh`:
it downloads the plugin zip that https://skills.xios3.com/ links to (or takes a zip path
as its argument), replaces the five `xios-*` skills, and records their version in
`plugins/cloudbackend-paas/XIOS_SKILLS_VERSION`.
