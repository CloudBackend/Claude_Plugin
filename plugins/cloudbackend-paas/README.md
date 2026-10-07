# cloudbackend-paas

Everything needed to build a XIOS/3 application and get it onto CloudBackend PaaS. One
install, two MCP servers:

- `cbemcp` — `upload_project` writes a project into the database, validating it against
  the schema, `delete_files` removes files, and `deploy` publishes it. `whoami`,
  `list_projects`, `read_project`, `validate_project` and `list_deployments` look at
  projects and deployments without changing anything
- `xios` — the XIOS/3 documentation lookups: `xios_concepts`, `xios_list`,
  `xios_component`, `xios_operation`, `xios_function`, `xios_method`, `xios_event`,
  `xios_action` and `xios_icons`
- the `xios-apps` skill — project layout, the manifest, the rules that make a deploy
  fail, and when to ask before deploying or deleting

The documentation tools are what keep the XML from being guesswork, so they ship together
with the deploy tools rather than as a second install.

## Installing

```
/plugin marketplace add CloudBackendAB/mcp-connector
/plugin install cloudbackend-paas@cloudbackend
/mcp
```

Restart Claude Code after installing: connectors are read at startup. `/mcp` then runs the
OAuth login, once per server.

If you already have `cbemcp` or `xios` configured by hand, remove them after installing, or
the same tools show up twice:

```bash
claude mcp remove cbemcp -s user
claude mcp remove xios -s user
```

## How the login works

Both connectors pin a pre-registered OAuth client rather than registering one on the fly:

```json
"oauth": {
  "clientId": "xios-mcp-client",
  "callbackPort": 8080
}
```

Both parts are required. Dynamic Client Registration cannot ask for the scopes these
servers require — `full` for `cbemcp`, `xios:read` for `xios` — so a client that registers
itself gets a token every tool call rejects. The callback port is fixed because the
redirect URI is registered on the client, so leave port 8080 free while you log in.

The two servers are separate resources with separate scopes, so each is logged in to
separately even though they share the client and the Keycloak realm. You need an account
in that realm for either one, the read-only documentation tools included.

## Which tenant

The tenant is a plugin option, asked for when the plugin is enabled. It has no default:
until it is set, the `cbemcp` connector is not started, rather than logging in to a tenant
you did not choose. Set or change it with:

```
/plugin configure cloudbackend-paas@cloudbackend
```

and restart Claude Code, then run `/mcp` to log in again. The `cbemcp` connector URL is
built from it:

```
https://mcp.cloudbackend.com/mcp/<tenant>
```

The tenant in the URL selects the Keycloak realm you log in to, so `xios-mcp-client` has
to be registered in that tenant's realm first, otherwise the login fails with "Client not
found". The `xios` documentation server is not tenant specific and is unaffected.

## For a whole team, without anyone typing commands

Declare the marketplace and the plugin in managed or user settings instead:

```json
{
  "extraKnownMarketplaces": {
    "cloudbackend": {
      "source": {
        "source": "github",
        "repo": "CloudBackendAB/mcp-connector"
      }
    }
  },
  "enabledPlugins": {
    "cloudbackend-paas@cloudbackend": true
  },
  "pluginConfigs": {
    "cloudbackend-paas@cloudbackend": {
      "options": {
        "tenant": "<tenant>"
      }
    }
  }
}
```

`pluginConfigs` sets the tenant so nobody is prompted for it, and is the only way to set
it for everyone, since there is no default. It is read from user,
`--settings` and managed settings, not from project settings.

Everyone who gets that settings file has the plugin on their next session. They still log
in to each server themselves.
