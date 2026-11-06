# CloudBackend

`<operation name="channel" value="ref"><name>{}</name><protocol>HTTPS</protocol><adapter type="{}"/></operation>`: `value` is the base URL, `<name>api</name>` gives `api://path` for callService, `<adapter type="CompactJSON"/>` turns JSON into XML
`<operation name="login" value="ref"><username>{}</username><password>{}</password></operation>`: signs in on that channel
`<operation name="groups" value="ref">`: children in order: create, delete, rename, list, invite, accept, join, leave, kick, ban, addRole
`<operation name="friends">`: children in order: request, accept, remove, block, unblock, rename
`<operation name="tenant">`: children in order: createUser, deleteUser, searchUsers, recover, changePassword
`<operation name="mail">`: one child: send, save, copy, move, delete
`<operation name="share" value="ref">`: one child: view, zone, url
`<operation name="stats">`: children in order: create-xml, get-date-range, aggregate

- groups, friends, tenant, mail, share and stats need a signed-in CloudBackend tenant: read the operation's code before using one.
