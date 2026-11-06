# cloudbackend-paas

Everything needed to build a XIOS/3 application and get it onto CloudBackend PaaS. One
install, one MCP server and six skills:

- `cbemcp` — `upload_project` writes a project into the database, validating it against
  the schema, `delete_files` removes files, and `deploy` publishes it. `whoami`,
  `list_projects`, `read_project`, `validate_project` and `list_deployments` look at
  projects and deployments without changing anything
- the `xios-apps` skill — project layout, the manifest, the rules that make a deploy
  fail, and when to ask before deploying or deleting
- the XIOS skills from [skills.xios3.com](https://skills.xios3.com/), which teach the
  current XIOS/3 API: `xios-views` (views and the Core components, plus the XIOS
  validator), `xios-process` (processes, operations, expressions), `xios-theme` (themes
  and app CSS), `xios-extend` (your own components and operations) and `xios-db`
  (datatypes, folders and searching; still a draft upstream)

The XIOS skills are what keep the XML from being guesswork. They ship as files inside the
plugin, so they need no server and no login. The validator needs Node.js.

If you installed the standalone `xios` plugin from skills.xios3.com into
`~/.claude/skills/xios/`, remove it, or the same skills load twice.

## Installing

```
/plugin marketplace add CloudBackend/Claude_Plugin
/plugin install cloudbackend-paas@cloudbackend
/mcp
```

Installing from `/plugin` asks for your tenant. From the shell, `claude plugin install`
does not ask, so pass it with `--config`:

```bash
claude plugin install cloudbackend-paas@cloudbackend --config tenant=<tenant>
```

Restart Claude Code after installing: connectors are read at startup. `/mcp` then runs the
OAuth login for `cbemcp`.

If you already have `cbemcp` configured by hand, remove it after installing, or the same
tools show up twice. A hand-configured `xios` server is no longer needed either:

```bash
claude mcp remove cbemcp -s user
claude mcp remove xios -s user
```

## How the login works

The connector pins the `mcp` OAuth client that CloudBackend PaaS creates in every tenant
realm, rather than registering one on the fly:

```json
"oauth": {
  "clientId": "mcp"
}
```

Dynamic Client Registration cannot ask for the `full` scope the server requires, so a
client that registers itself gets a token every tool call rejects. The `mcp` client is
public, uses PKCE and accepts any `localhost` or `127.0.0.1` callback port, so no port has
to be kept free while you log in.

## Which tenant

The tenant is a plugin option, asked for when the plugin is enabled. It has no default:
until it is set, the connector is not started, rather than logging in to a tenant you did
not choose. Set or change it with:

```
/plugin configure cloudbackend-paas@cloudbackend
```

and restart Claude Code, then run `/mcp` to log in again. The connector URL is built from
it:

```
https://mcp.cloudbackend.com/mcp/<tenant>
```

The tenant in the URL selects the Keycloak realm you log in to. The `mcp` client is created
in a tenant's realm when the tenant is set up; if the login fails with "Client not found",
the tenant predates it and the client has to be added. A tenant that does not exist is not
caught until the login, which then fails with "Realm does not exist", so check the
spelling if you see that.

## For a whole team, without anyone typing commands

Declare the marketplace and the plugin in managed or user settings instead:

```json
{
  "extraKnownMarketplaces": {
    "cloudbackend": {
      "source": {
        "source": "github",
        "repo": "CloudBackend/Claude_Plugin"
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
in to `cbemcp` themselves.
