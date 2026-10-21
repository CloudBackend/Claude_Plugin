# XIOS/3 Process Reference

## Process Structure
```xml
<process name="AppName - Process">
  <trigger .../>
  <step id="start">...</step>
  <step id="init">...</step>
</process>
```
Attrs: `name`, `author`, `description`, `step` (default entry step), `version`
`step id="start"` runs before any view opens (use for channel setup).
`Loaded` event trigger typically calls an `init` step.

---

## Triggers
Listen for events and route to steps.
```xml
<trigger view="viewName" component="compName" event="Select" step="stepId"/>
<trigger view="viewName" event="Loaded" step="init"/>
<trigger view="viewName" event="Ctrl+A" step="handleShortcut"/>
<trigger view="viewName" component="grid1" event="ContextMenu" step="showMenu"/>
<trigger view="viewName" component="comp1" event="Enter" step="handleEnter"/>
<trigger view="viewName" component="comp1" event="Drop" step="handleDrop"/>
```
Required: `event`, `step`. Optional: `view`, `component`, `communicator`, `process`.

**IMPORTANT:** Triggers do NOT support child elements (aliases, operations). To pass parameters to a shared step, create a small wrapper step:
```xml
<trigger view="myView" component="btn1" event="Select" step="handleBtn1"/>
<step id="handleBtn1">
  <alias name="myParam" value="1"/>
  <operation name="call" value="sharedHandler"/>
</step>
```

### Common Events
- `Select` — button click, item selection, icon click
- `Loaded` — view finished loading
- `Enter` — enter key pressed (on input)
- `ContextMenu` — right-click
- `Drop` — drag-and-drop received
- Keyboard: `Ctrl+A`, `Ctrl+S`, etc.

---

## Steps
Logic containers with operations.
```xml
<step id="stepId" name="Description" success="nextStep" error="errorStep" goto="autoNext">
  <alias .../>
  <operation .../>
</step>
```
Required: `id`. Optional: `name`, `success`, `error`, `goto`.

---

## Aliases (Variables)
```xml
<!-- Reference a document -->
<alias name="myData" value="home://data.xml"/>

<!-- Create in-memory document -->
<alias name="tmpDoc" model="newsilent"><root><item name="test"/></root></alias>

<!-- Computed value -->
<alias name="count" value="count($catDoc#/db:result/db:object)" model="value"/>

<!-- Math -->
<alias name="total" value="={$a} + {$b}" model="value"/>

<!-- Conditional (only set if undefined/empty) -->
<alias name="fallback" value="default" when="undefined"/>
```

### Model Types
- `data` (default) — opens/references an XML document
- `value` — stores a computed string/number value
- `global` — persists across steps
- `local` — step-scoped
- `new` — creates new document (shows open dialog)
- `newsilent` — creates new in-memory document silently
- `open` — opens document (shows open dialog)
- `browse` — browse for document
- `string` — string literal
- `define` — defines without loading
- `base` — base document reference
- `expand` — expands value
- `folder` — folder reference
- `dataDoc` — data document reference
- `container` — container reference

### System Aliases
- `$date` — current date
- `$time` — current time
- `$tm` — milliseconds timestamp
- `$widget` — current widget reference
- `$instance` — current instance
- `$package` — the application manifest itself
- `$home` — home path

---

## Operations

### action — Change component states
```xml
<operation name="action" value="#viewName">
  <component name="comp1" action="show"/>
  <component name="comp2" action="hide"/>
  <component name="comp3" action="enable"/>
  <component name="comp4" action="disable"/>
  <component name="comp5" action="clear"/>
  <component name="comp6" action="set">New text value</component>
  <component name="comp7" action="error"/>
  <component name="comp8" action="valid"/>
  <component name="comp9" action="focus"/>
  <component name="comp10" action="busy"/>
  <component name="comp11" action="warning"/>
  <component name="menuName" action="open"/>
</operation>
```
Actions: `activate`, `add`, `busy`, `clear`, `disable`, `enable`, `error`, `focus`, `hide`, `show`, `set`, `valid`, `warning`, `open`

**IMPORTANT:** Not all components support all actions. Check each component's **Actions** list (via `xios_component`). For example, labels only support `hide`/`show` — to update label text, use `callMethod` with `setValue` instead.

### bind — Bind data to components
```xml
<operation name="bind" value="tenant://path/data.xml">
  <component view="viewName" name="compName" select="xpath"/>
</operation>
<!-- Bind from URL -->
<operation name="bind" value="https://api.example.com/data.xml">
  <component view="viewName" name="compName"/>
</operation>
<!-- Bind component selection to another component -->
<operation name="bind" value="#viewName#sourceComp">
  <component view="viewName" name="targetComp" select="fieldName" model="selection"/>
</operation>
```

### call — Call another step
```xml
<operation name="call" value="stepId"/>
<!-- With parameters -->
<operation name="call" value="stepId">
  <param name="subject" value="Hello"/>
</operation>
<!-- Yield: let UI update before calling (breaks synchronous chain) -->
<operation name="call" value="stepId">
  <yield>true</yield>
</operation>
<!-- Timer wait: one-shot delayed call in milliseconds -->
<operation name="call" value="stepId"><timer wait="2000"/></operation>
<!-- Timer wait with alias: can be cancelled later -->
<operation name="call" value="stepId"><timer wait="2000" alias="timerId"/></operation>
<!-- Cancel a pending wait -->
<operation name="call" value="stepId"><timer wait="stop" alias="timerId"/></operation>
<!-- Timer interval: repeating call every N ms ("stop" to cancel) -->
<operation name="call" value="stepId"><timer interval="5000"/></operation>
```

### callMethod — Invoke component methods
```xml
<operation name="callMethod" value="#viewName#compName">
  <method name="reset"/>
</operation>
<operation name="callMethod" value="#viewName#compName">
  <method name="setValue"><param type="string">{$value}</param></method>
</operation>
<operation name="callMethod" value="#viewName#compName">
  <method name="setLabel"><param type="string">New Label</param></method>
</operation>
```

### change — Modify XML data
```xml
<!-- Append -->
<operation name="change" value="tenant://path/doc.xml">
  <store type="append" select="/root"><newItem attr="{$val}"/></store>
</operation>
<!-- Replace text -->
<operation name="change" value="$alias">
  <store select="/@attribute" type="replaceText">{$newValue}</store>
</operation>
<!-- Replace content -->
<operation name="change" value="$doc">
  <store select="root" type="replace"><root>new content</root></store>
</operation>
<!-- Delete by XPath -->
<operation name="change" value="tenant://path/doc.xml">
  <delete select="/root/item[@done='1']"/>
</operation>
<!-- Delete selected (from component) -->
<operation name="change" value="#viewName#gridName">
  <delete/>
</operation>
```
Store types: `append`, `replace`, `replaceText`

### save — Persist changes
```xml
<operation name="save" value="tenant://path/doc.xml"/>
```

### confirm — Show dialogs
```xml
<!-- Message dialog -->
<operation name="confirm">
  <type value="message"/>
  <message>Operation completed.</message>
  <modal>true</modal>
  <title>Info</title>
  <icon>icon://info</icon>
</operation>
<!-- Input dialog -->
<operation name="confirm">
  <type value="input"/>
  <message>Enter a name:</message>
  <modal>false</modal>
  <title>New Item</title>
  <ok step="handleOk" text="OK"/>
  <cancel step="handleCancel" text="Cancel"/>
</operation>
```
Types: `message`, `input`

### decision — Conditional logic
```xml
<!-- Existence check -->
<operation name="decision" value="tenant://path">
  <when exists="true" step="foundStep"/>
  <when exists="false" step="notFoundStep"/>
  <otherwise step="fallbackStep"/>
</operation>
<!-- XPath test -->
<operation name="decision">
  <when test="'{$value}' = 'hello'">
    <operation .../>
  </when>
  <otherwise>
    <operation .../>
  </otherwise>
</operation>
<!-- Value-based test -->
<operation name="decision" value="$alias">
  <when test="local-name() != 'container'" step="handleStep"/>
</operation>
```

### open — Open a view
```xml
<operation name="open" value="{$fileName}"/>
```

### close — Close a view
```xml
<operation name="close" value="#viewName"/>
```

### navigate — Navigate
```xml
<operation name="navigate" value="https://example.com"/>
```

### setSelection — Set component selection
```xml
<operation name="setSelection" value="">
  <component view="viewName" name="compName">
    <item select="/db:result/db:container[1]"/>
  </component>
</operation>
```

### channel — Set up communication protocol
```xml
<!-- HTTPS channel -->
<operation name="channel">
  <name>https</name>
  <title>HTTPS</title>
  <protocol>HTTPS</protocol>
</operation>
<!-- Proxy channel -->
<operation name="channel">
  <name>channelName</name>
  <proxy>proxyName</proxy>
  <title>Title</title>
  <protocol>PROXY</protocol>
  <adapter path="/" type="CompactJSON"/>
</operation>
```

### callService — Call external API
```xml
<operation name="callService" value="channelName://path">
  <wait>true</wait>
  <document>alias://docName</document>
  <method>GET</method>
</operation>
<operation name="callService" value="channelName://path">
  <wait>true</wait>
  <document>alias://docName</document>
  <method>POST</method>
  <body type="json" eval="pct">{ "key": "(%$aliasValue%)" }</body>
</operation>
```

### database — Database operations
```xml
<!-- Create container -->
<operation name="database" value="tenant://">
  <create type="container" name="FolderName"/>
</operation>
<!-- Create object with content -->
<operation name="database" value="tenant://Container">
  <create type="object" name="doc.xml" rename="false">
    <content type="text/xml"><root>data</root></content>
  </create>
</operation>
<!-- Create with ACL -->
<operation name="database" value="tenant://">
  <create type="container" name="Shared">
    <acl>
      <group id="{$groupId}" read="true" write="true" delete="true" changeACL="false"/>
    </acl>
  </create>
</operation>
<!-- Delete permanently -->
<operation name="database" value="$url">
  <delete permanent="true"/>
</operation>
<!-- Move -->
<operation name="database" value="$source">
  <move to="{$targetFolder}" silent="false" progress="true"/>
</operation>
```

### debug — Debug output
```xml
<operation name="debug" value="{$msg}"></operation>
<operation name="debug" value="{$msg}">alert</operation>
```
Message goes in `value` attribute. Empty content logs to browser console; content `alert` shows a popup dialog.

### foreach — Loop
```xml
<operation name="foreach" value="$items">...</operation>
```

### tenant — User management
```xml
<operation name="tenant">
  <createUser username="{$u}" password="{$p}" firstname="{$fn}" lastname="{$ln}" email="{$e}" source="{$tenant}" token="{$token}" responseAlias="response"/>
</operation>
```

### Other Operations
`about`, `async`, `config`, `create`, `download`, `export`, `friends`, `groups`, `import`, `login`, `print`, `register`, `rollBack`, `share`, `split`, `system`, `test`, `trace`

---

## Expression Syntax

| Syntax | Meaning |
|---|---|
| `{expression}` | Evaluate expression |
| `$aliasName` | Reference alias |
| `{$aliasName}` | Serialize alias value to string |
| `$alias#/xpath` | XPath on alias data |
| `#viewName#compName` | Component value reference |
| `{#view#comp}` | Serialize component value |
| `{#view#comp#@attr}` | Attribute from selected node |
| `{#view#comp#xpath}` | XPath from component's bound data |
| `{!}` | Trigger event data (serialized) |
| `!` | Trigger event data (as alias source) |
| `={$a} + {$b}` | Math expression (prefix with `=`) |
| `is-alias(name)` | Check if alias exists |
| `count(xpath)` | Count nodes |
| `local-name()` | Get element local name |
| `match('str','regex')` | Regex match |
| `substring('str','pos:len')` | Substring |
| `translate(str,from,to)` | Character replacement |
| `substring-before(str,delim)` | String before delimiter |
| `get-label('key')` | Localization lookup |

---

## Common Patterns

### Init with existence check
```xml
<step id="init">
  <operation name="decision" value="tenant://Container">
    <when exists="true" step="bindData"/>
    <otherwise step="createData"/>
  </operation>
</step>
```

### Form validation
```xml
<alias name="val" value="{#view#input}"/>
<operation name="decision">
  <when test="'{$val}' = ''">
    <operation name="action" value="#view">
      <component name="inputLabel" action="error"/>
    </operation>
  </when>
  <otherwise>
    <operation name="action" value="#view">
      <component name="inputLabel" action="valid"/>
    </operation>
  </otherwise>
</operation>
```

### Enable/disable UI during async
```xml
<step id="disable">
  <operation name="action" value="#view">
    <component name="input1" action="disable"/>
    <component name="btn1" action="disable"/>
  </operation>
</step>
<step id="enable">
  <operation name="action" value="#view">
    <component name="input1" action="enable"/>
    <component name="btn1" action="enable"/>
  </operation>
</step>
```
