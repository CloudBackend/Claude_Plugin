# CloudBackend

`<operation name="channel" value="ref"><name>{}</name><protocol>HTTPS</protocol><adapter type="{}"/></operation>`: `value` is the base URL, `<name>api</name>` gives `api://path` for callService, `<adapter type="CompactJSON"/>` turns JSON into XML
`<operation name="login" value="ref"><username>{}</username><password>{}</password></operation>`: signs in on that channel
`<operation name="groups" value="ref">`: children in order: create, delete, rename, list, invite, accept, join, leave, kick, ban, addRole
`<operation name="friends">`: children in order: request, accept, remove, block, unblock, rename
`<operation name="tenant">`: children in order: createUser, deleteUser, searchUsers, recover, changePassword, verifyUser, sendVerificationCode
`<operation name="pow" scope="signup" alias="id"/>`: solves the proof-of-work challenge of the channel tenant in a worker: `$id` goes in `<createUser powSolution>`, empty when the tenant requires none
`<operation name="share" value="ref">`: one child: view, zone, url

- groups, friends and most of tenant and share need a signed-in CloudBackend tenant; tenant's `createUser` (after `pow`) and `verifyUser`, and share's `url`, work before sign-in. Read the operation's code before using one.
