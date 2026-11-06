# Releasing

Bump `version` in `plugins/cloudbackend-paas/.claude-plugin/plugin.json` for every
release, since that is what tells installed copies there is an update, and tag the commit
`v<version>`. To pull the newest XIOS skills first, run `scripts/sync-xios-skills.sh`:
it downloads the plugin zip that https://skills.xios3.com/ links to (or takes a zip path
as its argument), replaces the five `xios-*` skills, and records their version in
`plugins/cloudbackend-paas/XIOS_SKILLS_VERSION`.

## Updating the XIOS skills

The `xios-*` skills are copied unchanged from the plugin zip published at
https://skills.xios3.com/, except that "the dashboard" is renamed CloudBackend PaaS. To
pick up a new release, run from the repository root:

```bash
scripts/sync-xios-skills.sh                      # newest zip the site links to
scripts/sync-xios-skills.sh xios-plugin-N.zip    # or a zip you already have
```

The version it synced is in `XIOS_SKILLS_VERSION`. Then release a new version.
