# CloudBackend PaaS for Claude

A Claude Code plugin marketplace with one plugin, `cloudbackend-paas`, for building XIOS/3
applications and deploying them to CloudBackend PaaS. The plugin connects Claude to two
MCP servers and adds a skill for the authoring workflow:

- `cbemcp` — reading, uploading and deploying projects, at `https://mcp.cloudbackend.com/mcp/<tenant>`
- `xios` — the XIOS/3 documentation lookups, at `https://mcp.xios3.com/mcp`
- `xios-apps` — project layout, the manifest, and when to ask before deploying or deleting

## Installing

```
/plugin marketplace add CloudBackendAB/mcp-connector
/plugin install cloudbackend-paas@cloudbackend
```

You are asked for your tenant when the plugin is enabled. Restart Claude Code, then run
`/mcp` to log in to each server.

See [plugins/cloudbackend-paas/README.md](plugins/cloudbackend-paas/README.md) for how the
login works, changing the tenant, and rolling the plugin out to a whole team.

## Releasing

Bump `version` in `plugins/cloudbackend-paas/.claude-plugin/plugin.json` for every
release, since that is what tells installed copies there is an update, and tag the commit
`v<version>`.
