# XIOS/3 Operations Reference

## action

Perform actions on UI components (enable, disable, hide, show, select, release, unbind, clear, etc.).

### Attributes
#### Required
- **value** (expression): View where the components are located

### Child Elements
#### component
- **name** (string): The component name
- **action** (enumeration): The action to perform (see Actions reference)

### Notes
- Asynchronous operation

### Examples
```xml
<operation name="action" value="#view1">
  <component name="abGrid" action="unbind"/>
  <component name="inputName" action="clear"/>
</operation>
```

---

## bind

Bind data to components, enabling intelligent data-model binding.

### Attributes
#### Required
- **value** (data, expression|URL-to-XML): The XML data to bind from

### Child Elements
#### component
- **name** (string): Required. The component to bind data to
- **view** (string): Required. The view where the component is located
- **select** (xpath): Optional. Relative or absolute path for selection
- **model** (enumeration, values: default/none/data/clone/base, default: default): Optional. Type of data handling. `none` concatenates base path + select. `data` binds to root of event object XML. `clone` copies Object, base and selection of event object. `base` copies base XPath
- **transformer** (string, URL): Optional. XSL Transformer to change XML data
- **type** (enumeration, values: default/focus, default: default): Optional. `focus` binds data once then releases connection
- **eval** (boolean, default: false): Optional. Evaluate entire XML element for expressions if true

#### paging
- **page** (integer, 1..n): Optional. which page to load
- **size** (integer, 1..n): Optional. Node-sets displayed per page
- **ascending** (boolean, default: true): Optional. Ascending order
- **order** (string, XPath): Optional. Element or attribute to order by

### Examples
```xml
<operation name="bind" value="home://Documents/mydata.xml#/profiles/user[1]">
  <component view="view1" name="component1" select="@name"/>
  <component view="view1" name="component2" select="@city"/>
</operation>
```
```xml
<operation name="bind" value="home://Documents/">
  <component view="view1" name="list2">
    <paging page="int" size="int" ascending="false|true"/>
  </component>
</operation>
```

---

## call

Call other steps, optionally with parameters, triggers, yield, and timers.

### Attributes
#### Required
- **value** (string, identifier): The step to execute. Supports `stepId:operationNumber` syntax

### Child Elements
#### trigger (optional)
- **model** (string, values: value/empty): Set to `value` to use value as plain text
- **value** (string): The trigger to send

#### yield (optional)
Allow UI update before call. Text node: `true` or `false` (default: `true` if element present).

#### param (optional)
- **name** (string): Parameter name (available as local scope alias in called step)
- **value** (string): Parameter value

#### timer (optional)
Only one of `interval` or `wait` can be used.
- **alias** (string): Optional. Alias to store timer ID (only for `wait`)
- **interval** (integer, values: 1..n/stop): Milliseconds between repeated calls, or `stop`
- **wait** (integer, values: 1..n/stop): Timeout milliseconds for single call. Use `stop` with same alias to cancel

### Notes
- If called within a process opened by another process and the step is not found, it searches ancestor processes (overloading behavior)

### Examples
```xml
<operation name="call" value="22"/>
```
```xml
<operation name="call" value="22">
  <param name="subject" value="Hello"/>
</operation>
```
```xml
<operation name="call" value="hideButton">
  <timer wait="2000" alias="timerId"/>
</operation>
```

---

## callMethod

Execute methods on components with optional parameters.

### Attributes
#### Required
- **value** (expression): The view or component to call the method on

#### Optional
- **wait** (boolean, default: false): Wait for async methods to finish before advancing
- **then** (string): Step to execute once all methods complete (alternative to `wait`)

### Child Elements
#### method (Required)
- **name** (string): The method name

#### param (child of method, depends on method)
- **type** (enumeration, values: string/boolean/integer/float/null/xml/winEvt, default: string): How contents are interpreted

The text() node of `param` contains the value. Types: `integer`/`float` parsed as numbers, `boolean` interprets "true" as true, `xml` passes children as fragment node, `null` sends null, `winEvt` sends window event node.

### Examples
```xml
<operation name="callMethod" value="#view1#component3">
  <method name="setValue">
    <param type="string">hello</param>
  </method>
</operation>
```

---

## callService

Communicate with external web services and REST APIs.

### Attributes
#### Required
- **value** (string, URL): SOAP method, URL identifier, and optional re-connect timer. Format: `channel://method/id/@seconds`

### Child Elements
#### body (Optional)
Request payload. Content-type auto-detected from content (XML -> text/xml, otherwise text/plain).
- **type** (string, values: xml/json/MIME-type): Sets MIME-type of content
- **eval** (string, values: pct/true, default: true): `pct` uses `(%` `%)` markers instead of `{}` for expression evaluation (useful for JSON)

#### document (Optional)
Text node overrides where the response document is written (defaults to operation value).

#### expect (Optional)
Retry until XPath condition on response is true.
- **attempts** (number, default: 30): Max retry attempts
- **timeout** (number, seconds, default: 10): Seconds between attempts

#### headers (Optional)
Child elements become HTTP headers (element name = header name, content = value). Headers must be CORS-allowed.

#### method (Optional)
Text node: HTTP method. Defaults to POST if body present, otherwise GET.

#### param (Optional)
- **name** (string): Query parameter name. GET: added to URL. POST: added to body as form-urlencoded

#### silent (Optional)
Text node `true` to ignore HTTP error responses.

#### wait (Optional)
Text node `true`/`false` (default: true). If false, process continues without waiting for response.

#### only-url (Optional)
Contains `param` elements that are always sent as URL query parameters, even in POST requests.

### Notes
- Halts process by default (use `<wait>false</wait>` to continue without waiting)
- Server errors route to error step triggers (`!`)
- Requires a channel for SOAP/complex services; supports plain HTTP GET without channel

### Examples
```xml
<operation name="callService" value="https://xcerion.com/example/">
  <wait>true</wait>
  <method>GET</method>
  <param name="firstname">{$name}</param>
  <param name="lastname">{$lastName}</param>
</operation>
```

---

## change

Manipulate XML data in-memory (append, replace, replaceText, prepend, insert, insertAfter, insertInto, move, delete).

### Attributes
#### Required
- **value** (expression): The XML data (URL or component) to change

### Child Elements
#### store
- **select** (xpath): Optional. Relative XPath for where to store
- **type** (enumeration, values: append/insert/insertAfter/insertInto/move/prepend/replace/replaceText): Required. Store type
- **value** (xpath): Required for move. Element to move
- **transformer** (string, URL): Optional. XSL Transformer

Text node of `store` contains the XML/text to store.

**Store types:**
| Type | Description |
|------|-------------|
| append | Appends data to end of selection |
| insert | Inserts before current selection |
| insertAfter | Inserts after current selection |
| insertInto | Inserts into text node at position offset |
| move | Moves node-set from one part to another |
| prepend | Inserts as first child of selection |
| replace | Replaces selected node-set |
| replaceText | Replaces attribute or text() node value; creates attribute if missing |

#### delete
- **select** (xpath): Optional. XPath to what to delete. Omit to delete the operation value's selection

#### move (via store type="move")
- **value** (xpath): Required. Source element to move
- **select** (xpath): Destination

### Notes
- Manipulates in-memory XML only. Use `save` or `database` to persist
- Do not leave `delete select=""` empty -- remove the attribute entirely instead
- If `replaceText` select matches multiple nodes, all are replaced. Expressions in store content execute with selected node as context

### Examples
```xml
<operation name="change" value="home://Documents/">
  <store select="/db:result" type="append">
    <db:object name="{#view1#subject}"/>
  </store>
</operation>
```
```xml
<operation name="change" value="#view1#component1">
  <store select="task/@complete" type="replaceText">true</store>
</operation>
```
```xml
<operation name="change" value="home://Documents/">
  <delete select="/db:result/db:object[@name='{$fileTitle}']"/>
</operation>
```

---

## channel

Create a communicator for REST API or Web Service communication.

### Attributes
#### Required
- **value** (string): Communicator end point URL

### Child Elements (Required)
#### name
Text node: Protocol prefix identifier (cannot be `xios`, `host`, or `icon`)

#### protocol
Text node (enumeration): `HTTPS`, `XMLDB`, or `PROXY`

### Child Elements (Optional)
#### adapter
- **path** (string): XPath to starting point in response
- **in** (string, URL): XSLT for incoming responses (XSLT adapter only)
- **out** (string, URL): XSLT for outgoing posts (XSLT adapter only)
- **type** (enumeration, values: CompactJSON/XSLT): Adapter type

#### title
Text node: Display name for the channel

### Notes
- Once created, the channel name is used as a protocol: `name://path`
- Use PROXY protocol for third-party APIs to avoid exposing auth tokens
- Emits `Authorized` and `Login` events

### Examples
```xml
<operation name="channel" value="https://api.cloudbackend.com/v1/">
  <name>cbe</name>
  <title>CloudBackend</title>
  <protocol>XMLDB</protocol>
  <authentication type="basic"/>
</operation>
```
```xml
<operation name="channel" value="https://api.cloudbackend.com/v1/">
  <name>movie</name>
  <proxy>myTMDBproxy</proxy>
  <title>The Movie Database</title>
  <protocol>PROXY</protocol>
  <adapter path="/" type="CompactJSON"/>
</operation>
```

---

## close

Close documents, views, applications, processes, or clear cache.

### Attributes
#### Required
- **value** (string): What to close (name or URL). Omit for `document_cache` mode

### Child Elements
#### mode (Optional)
Text node (enumeration): `application`, `channel`, `document`, `document_cache`, `process`, `system`, or `view`

### Notes
- `system` clears communication and document managers for logout preparation but does not log out
- `document_cache` does not require a value attribute

### Examples
```xml
<operation name="close" value="addUser">
  <mode>view</mode>
</operation>
```
```xml
<operation name="close">
  <mode>document_cache</mode>
</operation>
```

---

## confirm

Display a confirmation dialog (message, confirm, or input).

### Child Elements
#### type
- **value** (enumeration, values: message/confirm/input, default: message)

#### message
Text node: The dialog message text

#### title
Text node: Dialog title

#### icon
Text node: Dialog icon

#### height
Text node: Dialog height

#### initial
Text node: Initial value for input field (input type only)

#### modal
Text node (boolean, default: false): Whether dialog is modal

#### ok
- **step** (string): Step to execute on OK
- **text** (string, default: "OK"): Button text

#### cancel
- **step** (string): Step to execute on Cancel
- **text** (string, default: "Cancel"): Button text

### Notes
- For `input` type, the event object for the OK step contains the input field value
- `message` type shows only an OK button

### Examples
```xml
<operation name="confirm">
  <type value="input"/>
  <message>{$document#class/description}</message>
  <initial>{#Report#year}</initial>
  <title>Updating report year</title>
  <icon>icon://calendar</icon>
  <ok step="dialogOK" text="Change"/>
  <cancel step="dialogNO" text="Abort"/>
</operation>
```
```xml
<operation name="confirm">
  <message>Something happened!</message>
</operation>
```

---

## create

Create an XML node-set as a temporary document (Object).

### Attributes
#### Required
- **value** (expression): The Object to create (e.g. `#objectname`)

### Child Elements
Text node contains the XML node-set for the new Object.

### Examples
```xml
<operation name="create" value="#Clipboard">
  <clipboard/>
</operation>
```

---

## debug

Debug applications during development.

### Attributes
#### Required
- **value** (expression|string): What to debug

### Child Elements
Text node (optional, enumeration): Controls display mode:
- (omitted): Output in debug window
- `alert`: XML data in XIOS/3 dialog (halts process)
- `alert:plain`: XML data in JavaScript alert (halts process)
- `full`: Detailed component info in debug window

### Notes
- Debug mode must be enabled via Control Panel > Development
- `alert` and `alert:plain` halt process execution

### Examples
```xml
<operation name="debug" value="Text output in debug window"/>
```
```xml
<operation name="debug" value="#view#component#/section[1]">alert:plain</operation>
```

---

## database

Perform database instructions on Objects and Containers.

### Attributes
#### Required
- **value** (expression): The data target for the operation

### Notes
- Each database operation can only have ONE single child instruction element
- Automatic renaming supported by default to prevent name collisions

### Child Elements (Instructions)

#### acl
Set access control lists.
- **read** (boolean): Required
- **write** (boolean): Required
- **delete** (boolean): Required
- **changeACL** (boolean): Required

Child elements: `user`, `group`

```xml
<operation name="database" value="$document">
  <acl read="true" write="false" delete="false" changeACL="false">
    <user group="{$groupid}">{$userid}</user>
  </acl>
</operation>
```

#### attach
Attach streams to Objects.
- **to** (string, URL): Required. Destination Object
- **slot** (numerical, 2..n): Optional. Slot number (slot 1 is the Object itself)

```xml
<operation name="database" value="https://xios3.com/image.jpg">
  <attach to="home://myFile.xml" slot="2"/>
</operation>
```

#### copy
Copy Objects and Containers.
- **to** (string, URL): Required. Destination Container
- **silent** (boolean): Optional. Prompt user for confirmation

```xml
<operation name="database" value="home://Documents/MyDocument.xml">
  <copy to="home://Applications/" silent="false"/>
</operation>
```

#### create
Create Objects or Containers.
- **type** (enumeration, values: Object/Container): Required
- **name** (string): Optional. Name of new Object/Container
- **alias** (string): Optional. Alias for referencing the new Container
- **rename** (enumeration, values: false/true/ask, default: false): Optional. Auto-rename on conflict
- **path** (boolean): Optional. Create intermediate containers if true

Optional children: `author`, `summary`, `acl` (with user/group), `index` (with key), `content`

`content` attributes:
- **type** (string): Datatype (default: text/xml)
- **eval** (enumeration, values: true/false/pct, default: false): Evaluate expressions in href template
- **href** (string, URL): Load content from external XML document

```xml
<operation name="database" value="home://Documents/">
  <create type="object" name="MyNewDocument.xml">
    <content type="text/xml"><something>My New Object</something></content>
  </create>
</operation>
```

#### delete
Delete Objects and Containers.
- **permanent** (boolean): Optional. Permanently delete vs send to trashcan
- **silent** (boolean): Optional. Prompt user for confirmation

```xml
<operation name="database" value="home://Documents/MyDocument.xml">
  <delete permanent="true" silent="false"/>
</operation>
```

#### detach
Detach attachments from Objects.
- **slot** (numerical, 2..n): Required. Slot number to detach

```xml
<operation name="database" value="home://Documents/myFile.xml">
  <detach slot="3"/>
</operation>
```

#### link
Create a temporary access link for Objects.
- **alias** (string): Reference name for the resulting URL

Children: `expiration` (with `days`, `hours`, `minutes`, `downloads`), `security` (with `username`, `password`)

```xml
<operation name="database" value="home://Documents/MyFile.xml">
  <link alias="url">
    <expiration><days>1</days><downloads>99999</downloads></expiration>
  </link>
</operation>
```

#### listen
Listen to changes in a Container or document.
- **event** (enumeration, values: Change/Append/Prepend/Insert/Replace/ReplaceText/RemoveNode/RemoveChildren/Remove/NewFolder): Required
- **step** (string): Required. Step to execute on event
- **subfolders** (boolean, default: false): Optional. Monitor sub-Containers

```xml
<operation name="database" value="home://Documents/">
  <listen event="Append" step="newFile"/>
  <listen event="Remove" step="deleteFile"/>
</operation>
```

#### mount
Mount a new database on an existing channel.
- **name** (string): Required. Protocol name of mounted database
- **friendly** (string): Required. Display name
- **hidden** (string, default: false): Mount as hidden

Children (one of): `group`, `database`, `memory`, `local`, `published`

```xml
<operation name="database">
  <mount name="my-mount" friendly="eliteMount">
    <published name="{$publishName}" userId="1337" password="abc23"/>
  </mount>
</operation>
```

#### move
Move Objects and Containers.
- **to** (string, URL): Required. Destination Container
- **silent** (boolean): Optional. Prompt user for confirmation

Only a single move element per operation.

```xml
<operation name="database" value="home://Documents/MyDocument.xml">
  <move to="home://Applications/" silent="true"/>
</operation>
```

#### publish
Create a publication of Objects/Containers for external or internal access.
- **alias** (string): Alias to store resulting URL
- **name** (string): Publication name (external)
- **suggest** (string): Suggested name (internal)

External children: `password`, `visibility` (private/friends/public), `access` (read/create/receive/update), `description`

Notes: `create` = read+write, `receive` = write-only (e.g. newsletter signups). Cannot combine `create`/`receive`/`update` with `public` visibility.

```xml
<operation name="database" value="$shareFilesSelection">
  <publish name="{$newUniqueName}" alias="url">
    <visibility>public</visibility>
    <access>read</access>
    <description>My description</description>
  </publish>
</operation>
```

#### rename
Rename Objects and Containers.
- **to** (string): Required. New name

```xml
<operation name="database" value="home://document1.xml">
  <rename to="document_hello.xml"/>
</operation>
```

#### restore
Restore previous versions of permanently deleted Objects/Containers.
- **id** (string): Required. Object/Container ID (from `/.history` or `/.versions`)
- **name** (string): Optional. New name for restored item

Cannot restore trashcan items (use `trashcan` instruction instead).

```xml
<operation name="database" value="$containerPath">
  <restore id="$objectId" name="new restored name.xml"/>
</operation>
```

#### share
Share Objects/Containers with friends.
- **use-selection** (boolean, default: true)

Children: `users` (contains friend elements from `#Friends`), `comment` (max 256 chars)

Shared items appear under `home://Friends/[sharer name]/`.

```xml
<operation name="database" value="#view1#gridFilesToShare">
  <share use-selection="true">
    <users>{#view1#gridSelectedFriends}</users>
    <comment>{#view1#commentInputfield}</comment>
  </share>
</operation>
```

#### shares
List shares from a group, optionally filtered by user.
- **id** (string): groupid or groupid:userid
- **alias** (string): Alias for referencing

```xml
<operation name="database">
  <shares id="{$groupid}:{$userid}" alias="bob"/>
</operation>
```

#### shortcut
Add a shortcut.
- **to** (string): Container where the shortcut goes

Children: `icon`, `target`, `data`, `startfolder`

```xml
<operation name="database" value="!">
  <shortcut to="{$atomFeed}" name="{#shortcutwizard#name}" alias="title">
    <icon>{$shortcutIcon}</icon>
    <target>{#shortcutwizard#location}</target>
  </shortcut>
</operation>
```

#### subscribe
Subscribe to a publication.
- **userid** (integer) or **username** (string): Publisher identifier (one required)
- **id** (string) or **name** (string): Publication identifier (one required)
- **password** (string): Optional, for password-protected publications

Groups cannot subscribe.

```xml
<operation name="database">
  <subscribe name="Vacation 2024" username="test4" password="test"/>
</operation>
```

#### subscribers
List subscribers of a publication.
- **id** (string): Required. Publication ID
- **alias** (string): Required. Alias for the result

```xml
<operation name="database">
  <subscribers id="123" alias="MySubscribers"/>
</operation>
```

#### trashcan
Empty or restore from trashcan.
- **action** (enumeration, values: restore/empty): Required
- **silent** (boolean, default: true): Optional. Prompt user

For `empty`: operation value should be `xios`. For `restore`: value should be the Object URL.

Requires `home://Trashcan` Container to exist.

```xml
<operation name="database" value="xios">
  <trashcan action="empty" silent="false"/>
</operation>
```

#### truncate
Empty a Container.
- **silent** (boolean, default: true): Prompt user when false
- **progress** (boolean, default: false): Show activity spinner

```xml
<operation name="database" value="{$pathToEmpty}">
  <truncate silent="false" progress="true"/>
</operation>
```

#### unlink
Remove a published link.
- **id** (string): ID of previously published link

```xml
<operation name="database">
  <unlink id="{#names#name1}"/>
</operation>
```

#### unlisten
Remove a Container/Object listener.
- **event** (string): Required. Event identifier to remove

```xml
<operation name="database" value="home://Documents/">
  <unlisten event="FileAdded"/>
</operation>
```

#### unmount
Unmount a mounted database drive.
- **name** (string): The name used when mounting

```xml
<operation name="database">
  <unmount name="example"/>
</operation>
```

#### unpublish
Remove a publication.
- **id** (string): Required. Publish ID
- **group** (string): Optional. Group ID if publication belongs to a group

```xml
<operation name="database">
  <unpublish id="{$publishId}"/>
</operation>
```

#### unshare
Unshare previously shared Objects/Containers.
- **suggest** (string)

Child: `packages` containing `package` elements with `id` attribute.

```xml
<operation name="database">
  <unshare>
    <packages><package id="{$shareId}"/></packages>
  </unshare>
</operation>
```

#### unsubscribe
Remove a subscription.
- **id** (string): Required. Subscription/publication ID

```xml
<operation name="database">
  <unsubscribe id="4"/>
</operation>
```

#### upload
Upload Objects to a Container.
- **to** (string, URL): Required. Destination Container

Omit the `value` attribute on the operation element when using upload.

```xml
<operation name="database">
  <upload to="home://Documents/"/>
</operation>
```

---

## decision

Switch-statement for testing conditions.

### Attributes
#### Optional
- **value** (expression|string): Data to apply tests on

### Child Elements
#### when (Required, one or more)
- **test** (condition): XPath condition
- **exists** (boolean): Check if Object/Container exists (relative to operation value). Cannot combine with `test`
- **step** (string): Step to execute if condition is true

Can contain inline `operation` and `alias` elements as children (executed when condition is true). `step` attribute takes priority over inline operations.

#### otherwise (Optional)
- **step** (string): Step to execute

Can contain inline `operation` elements.

### Notes
- Evaluates `when` elements in order; first true match wins
- `otherwise` executes if no `when` matches (placement order does not matter)
- `exists` only works with `true` value

### Examples
```xml
<operation name="decision" value="#view1#mails">
  <when test="count(/documents/item) = '0'" step="18"/>
  <when test="count(/documents/item) = '1'" step="19"/>
  <when test="count(/documents/item) = '2'">
    <operation name="debug" value="TWO">alert:plain</operation>
  </when>
  <otherwise>
    <operation name="call" value="200"/>
  </otherwise>
</operation>
```
```xml
<operation name="decision" value="tenant://myTable">
  <when exists="true">
    <operation name="debug" value="Container exists">alert:plain</operation>
  </when>
</operation>
```

---

## foreach

Iterate over XML node-sets or numeric ranges.

### Attributes
#### Required
- **value** (expression|parameters): Either an XPath to a node-set to iterate, or a numeric range in format `int..int[,int]` (start..end,step)

### Child Elements
#### operation (Required)
Any process operations to execute per iteration.

### Notes
- Current iterator node available in trigger `!`
- For numeric ranges, default step increment is 1
- `{!#text()}` accesses text of current node, `{!#@attr}` accesses attributes

### Examples
```xml
<operation name="foreach" value="home://Documents/#db:container/db:object">
  <operation name="debug" value="Document {!#@name}">alert:plain</operation>
</operation>
```
```xml
<operation name="foreach" value="0..10,1">
  <operation name="debug" value="!">alert:plain</operation>
</operation>
```

---

## friends

Perform actions on friends or friend groups in `#Friends`.

### Child Elements (Instructions)
#### create
- **name** (string): Name of friend group to create

#### remove
- **group** (string): Friend group name to remove
- **user** (integer, userId): Friend to remove by userId

### Examples
```xml
<operation name="friends">
  <create name="Work Colleagues"/>
</operation>
```

---

## groups

Perform group management operations.

### Attributes
#### Required
- **value** (string): Context group. If omitted or `/`, the default user group is used

### Notes
- Can have multiple child instruction elements executed in declared order on the same group

### Child Elements (Instructions)

#### accept
Accept a group invitation.
- **to** (string, group path): Group path

#### acceptRequest
Accept a join request.
- **id** (string, user id)
- **reason** (string)

#### add
Add a role to a group.
- **name** (string)

#### addAvatar
Save a group-specific avatar.
- **height** (numerical)
- **left** (numerical)
- **to** (string, group path)
- **top** (numerical)
- **width** (numerical)

#### ban
Ban a user from a group.
- **name** (string, username)
- **reason** (string)

#### create
Create a new group.
- **type** (string, values: group/role/subgroup, default: group)
- **name** (string): Group name
- **alias** (string): User's alias in group
- **public** (string, values: public/private, default: private)
- **applicant** (string, values: open/invite/review, default: review)

#### delete
Delete a group/role/subgroup.
- **type** (string, values: group/role/subgroup, default: group)

#### deleteAvatar
Delete group avatar.
- **group** (string, group path)

#### invite
Invite users to a group. Child: `message`

#### join
Join a group.
- **to** (string, group id)

#### kick
Kick a group member.
- **type** (string, values: group/role/subgroup, default: group)

#### leave
Leave a group. No attributes (group specified via operation value).

#### list
List group information.
- **type** (enumeration, values: groupMembers/listBannedUsers/listApplicant/listInvites/listRoles, default: listRoles)
- **responseAlias** (string): Alias for the result
- **count** (integer, default: 100): Number of members (for groupMembers)
- **offset** (integer, default: 0): Starting offset (for groupMembers)

#### reject
Reject a group invitation.
- **id** (string, user ID)
- **reason** (string)

#### rename
Rename a role, group, or user alias.
- **name** (string): New name/alias
- **type** (enumeration, values: role/group/alias, default: group)

#### request
Request to join a group.
- **name** (string, username)
- **reason** (string)

#### saveMeta
Extract meta data from `profile.xml` in the group database. Works only on main group.

#### status
Set user status in group.
- **message** (string): Status message

Text node: online status (e.g. `available`).

#### unban
Lift a ban.
- **reason** (string)
- **name** (string, username)

### Examples
```xml
<operation name="groups" value="tenant">
  <create type="subgroup" name="{$groupName}" alias="{$groupAlias}" public="public" applicant="open"/>
</operation>
```

---

## login

Connect to password-protected web services.

### Attributes
#### Required
- **value** (string): The communicator/channel to use

### Child Elements
#### username (Required)
Text node: The username

#### password (Required)
Text node: The password

#### reset (Optional)
Text node: Whether to reset user settings (for XMLDB communicator)

#### client (Optional)
Text node: Client name (defaults to "XIOS/3")

### Notes
- Listen to `Authorized` and `LoginFailure` events to determine success/failure
- Requires a channel to be created first

### Examples
```xml
<operation name="login" value="cbe">
  <username>{#Login#Username}</username>
  <password>{#Login#Password}</password>
</operation>
```

---

## navigate

Navigate selections relative to XML documents.

### Attributes
#### Required
- **value** (expression): XML node-set to navigate

### Child Elements
#### call (Required)
- **axis** (enumeration, values: parent/preceding/following/first/last): Navigation axis
- **element** (string): Optional. Limit navigation to a specific element name
- **step** (string): Step to execute after navigation

### Notes
- Does not work without a valid data document. If value references a component, it must be bound to data first
- With multiple selections, the axis is applied to all selections
- New selection available in trigger `!`

### Examples
```xml
<operation name="navigate" value="!">
  <call axis="following" step="10"/>
</operation>
```

---

## open

Open process, view, and application documents.

### Attributes
#### Required
- **value** (string, URL): Document/website/application to open

#### Optional
- **secure** (boolean, default: false): Use HTTPS

### Child Elements
#### param (Optional)
Available as aliases in the opened process.
- **name** (string): Parameter name
- **value** (string): Parameter value

#### name (Optional)
Text node: Name identifier

#### position (Optional)
- **x** (integer): Horizontal position
- **y** (integer): Vertical position
- **rel** (expression): View/component to position relative to

#### trigger (Optional)
- **model** (enumeration, values: data/value, default: data): Use `!` to share calling context
- **value** (string, URL): Trigger data

#### step (Optional)
- **id** (string): Starting step (defaults to step 1)

#### debug (Optional)
Text node: `true`/`false` (default: false). Enable debugger for opened app.

#### browser (Optional)
- **name** (string): Component identifier
- **secure** (boolean): Use HTTPS
- **features** (string): Properties syntax: `property=value, property=value` (height, width, status, toolbar, location)

#### action (Optional)
Text node (enumeration): `open` (default), `preview`, `edit`. Specifies datatype action.

#### context (Optional)
Text node: `true` (share context/aliases), `false` (new context), `clone` (copy context). Default within app package: `true`, otherwise `false`.

#### focus (Optional)
Text node: `true` (default) or `false` (opens minimized).

#### handle-close (Optional)
Text node: `true`/`false` (default: false). When true, fires `Closing` event instead of closing on X click.

#### window (Optional)
Opens in new browser window/tab.
- **id** (string): Window ID (reuses existing window with same ID)
- **width** (integer)
- **height** (integer)
- **left** (integer)
- **top** (integer)

### Notes
- Application packages accept elements for both view and process
- Bind data to a view only after its `Loaded` event fires
- When opening a sub-process, if step not found it searches ancestor processes
- Use `<context>true</context>` + `<trigger value="!"/>` to modularize process code

### Examples
```xml
<operation name="open" value="service/processes/cli.xml">
  <context>true</context>
  <trigger value="!"/>
  <step id="executeCommand"/>
</operation>
```
```xml
<operation name="open" value="xios://apps/shell/shell.xml">
  <step id="start"/>
  <param name="subject" value="Hello"/>
  <context>true</context>
  <focus>true</focus>
  <handle-close>true</handle-close>
</operation>
```

---

## print

Print documents with optional XSL transformation.

### Attributes
#### Required
- **value** (expression): Data/document to print

#### Optional
- **debug** (boolean, default: false): If true, output opens in new tab instead of printing

### Child Elements
#### transform (Optional)
- **type** (enumeration, values: html/xml/xsl, default: html): Transform format
- **value** (string, URL): XSL transformer URL (when type is xsl)

Child of transform: `style` with `href` attribute for CSS.

### Examples
```xml
<operation name="print" value="{#view#richtext.getValue()}"/>
```
```xml
<operation name="print" value="#Help#content">
  <transform type="xsl" value="apps/myapp/transformers/specialprinter.xsl">
    <style href="xios/apps/help/layout/help.css"/>
  </transform>
</operation>
```

---

## rollBack

Rollback transactions to a previous document state.

### Attributes
#### Required
- **value** (expression): The XML document URL or `#TransactionManager` reference

### Child Elements
#### model (Optional)
Text node: `data` (removes selection, sets XPath to root)

#### documents (Optional)
Text node: `current` (rollback only the currently selected document in TransactionManager)

### Notes
- Uses the Transaction Manager (`#TransactionManager`) which tracks all session transactions
- Can rollback a specific document by providing its URL, without affecting other transactions

### Examples
```xml
<operation name="rollBack" value="#TransactionManager"/>
```
```xml
<operation name="rollBack" value="#TransactionManager#/transactions/transaction[4]">
  <documents>current</documents>
</operation>
```

---

## search

Search text content within an XML document.

### Attributes
#### Required
- **value** (string): Text string to search for

### Child Elements
#### document
- **href** (string): Required. Document to search in
- **xlink** (string, values: load-all): Optional. Expand all xlinks before searching

#### output
Text node: Component to display results in

#### elements
- **search** (string): Comma-separated paths to search
- **ignore** (string): Comma-separated element names to exclude

### Notes
- Only text nodes are indexed, not XML elements or attributes

### Examples
```xml
<operation name="search" value="{#Help#searchField}">
  <document href="{$dataDoc}" xlink="load-all"/>
  <output>#search</output>
  <elements search="section/text, document/text" ignore="code"/>
</operation>
```

---

## setSelection

Set selections on components already bound to data.

### Child Elements
#### component (Required)
- **view** (string): View name
- **name** (string): Component name

#### item (child of component, Required for static selection)
- **select** (xpath): XPath selection

### Attributes
#### Optional
- **value** (expression): Inherit selection from expression (alternative to item elements)

### Notes
- Component must be bound to data first (use `bind`)
- May trigger the `Select` event
- Works with: Calendar, Grid, ListView, Tree

### Examples
```xml
<operation name="setSelection" value="$selection">
  <component view="Explorer" name="folderSelector"/>
</operation>
```
```xml
<operation name="setSelection">
  <component view="Explorer" name="folderSelector">
    <item select="/db:result/db:container[@name='Documents']"/>
    <item select="/db:result/db:container[@name='Settings']"/>
  </component>
</operation>
```

---

## save

Save XML documents to the database.

### Attributes
#### Required
- **value** (string|expression): The Object to save

### Child Elements
#### saveas (Optional)
No attributes. Triggers a Save As dialog.

#### folder (Optional)
Text node: Pre-determined Container path for Save As dialog.

#### title (Optional)
Text node: Title for the Save As dialog.

### Notes
- Manipulated in-memory documents must be explicitly saved to persist to the cloud database
- Meta data is updated on save
- Database results and meta data are saved automatically (no explicit save needed)

### Examples
```xml
<operation name="save" value="home://Documents/myfile.xml"/>
```
```xml
<operation name="save" value="$dataDoc">
  <saveas/>
  <folder>home://Documents</folder>
  <title>Save Presentation</title>
</operation>
```

---

## share

Window Sharing and Gesture Based Collaboration.

### Attributes
#### Optional
- **value** (string, format: view:instance): View to share

### Child Elements
#### view
Share application windows between users.
- **action** (enumeration, values: singleton/clone/end): Required. `singleton` = single shared window, `clone` = both users see and can work simultaneously
- **direction** (enumeration, values: left/right): For singleton mode only
- **user** (string): User to share with

#### zone
Define a friend's position in a sharebar.
- **direction** (enumeration, values: right/left): Required. Sharebar side
- **user** (string): Required. User from `#Friends`

### Notes
- Zone setup is required for Window Sharing to work

### Examples
```xml
<operation name="share">
  <zone direction="right" user="goran"/>
</operation>
```

---

## split

Split a string into an XML node-set.

### Attributes
#### Required
- **value** (string): String to split

### Child Elements
#### value (Required)
Text node: `use` (interprets operation value as text, not expression)

#### document (Required)
Text node: Name of the XML result document (e.g. `#arrTime`)

#### token (Required)
Text node: Token to split by. Use CDATA for space: `<token><![CDATA[ ]]></token>`

### Notes
- Result document structure: `<split><item>value</item>...</split>`

### Examples
```xml
<operation name="split" value="{$time}">
  <value>use</value>
  <document>#arrTime</document>
  <token>:</token>
</operation>
<!-- Access: {#arrTime#/split/item[1]} -->
```

---

## tenant

Tenant-level operations (user management, statistics).

### Attributes
#### Optional
- **value** (expression): Context

### Notes
- Each tenant operation can have only one type of child element

### Child Elements (Instructions)

#### createUser
Create a user on the tenant.
- **username** (string): Required
- **password** (string): Required
- **firstname** (string): Required
- **lastname** (string): Required
- **email** (string): Required
- **source** (string): Required. Tenant name
- **responseAlias** (expression): Required. Alias for HTTP response XML
- **referralCode** (string): Optional. Required if referral codes are activated
- **eulaVersion** (string): Optional. EULA version accepted

Response values: `SUCCESS`, `Illegal character found in user name`, `Username already exists.`, `Email is not unique`

```xml
<operation name="tenant">
  <createUser
    username="{#CreateUserView#inputUsername}"
    password="{#CreateUserView#inputCreatePassword}"
    firstname="{#CreateUserView#inputFirstName}"
    lastname="{#CreateUserView#inputLastName}"
    email="{#CreateUserView#inputEmail}"
    source="CreateUserView"
    responseAlias="createAccountResponse"
  />
</operation>
```

#### deleteUser
Delete a user (two-step process).
- **type** (string, values: requestdelete/delete): Required
- **code** (string): Required for `delete` type
- **username** (string): Required for `delete` type
- **userid** (enumeration): Required for `requestdelete` type
- **forgetuser** (boolean): Optional. Permanently forget user
- **deletecontent** (boolean): Optional. Delete all user content
- **usedefault** (boolean): Optional. Use default email if tenant has no custom delete-user email

Step 1: `requestdelete` triggers verification email. Step 2: `delete` with code from email.

Without `forgetuser`/`deletecontent`, account info is purged after 3 months (user can recreate account).

```xml
<operation name="tenant">
  <deleteUser type="requestdelete" userid="userId" usedefault="true"/>
</operation>
```
