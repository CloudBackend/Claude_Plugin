# CloudBackend PaaS for Claude

A Claude Code plugin marketplace with one plugin, `cloudbackend-paas`, for building XIOS/3
applications on CloudBackend PaaS. The plugin connects Claude to one
MCP server and adds skills for writing and shipping the application:

- `cbemcp` — reading and uploading projects, validated against the schema, at `https://mcp.cloudbackend.com/mcp/<tenant>`
- `xios-apps` — project layout, the manifest, uploading, when to ask before sharing or
  deleting, and handing the deploy over to you in CloudBackend PaaS
- `xios-views`, `xios-process`, `xios-theme`, `xios-extend`, `xios-db` — the XIOS skills
  from [skills.xios3.com](https://skills.xios3.com/), with the XIOS validator (needs
  Node.js, which is optional)

## Installing

```
/plugin marketplace add CloudBackend/Claude_Plugin
/plugin install cloudbackend-paas@cloudbackend
```

You are asked for your tenant when the plugin is installed or enabled from `/plugin` in a
session. `claude plugin install` run from the shell does not ask, so pass it there with
`--config tenant=<tenant>`. Restart Claude Code, then run `/mcp` to log in to `cbemcp`.

See [plugins/cloudbackend-paas/README.md](plugins/cloudbackend-paas/README.md) for how the
login works, changing the tenant, and rolling the plugin out to a whole team.
