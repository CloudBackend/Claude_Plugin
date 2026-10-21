# XIOS/3 Concepts Reference

## Data Binding

### How does two-way data binding work?
Use the `bind` operation to connect a UI component to an XML document. Once bound, changes in the component automatically update the document and vice versa. Use `select` to target a specific node:
```xml
<alias name="tmpDoc" model="newsilent"><state><myBox checked="false"/></state></alias>
<operation name="bind" value="$tmpDoc">
  <component view="myView" name="myCheckbox" select="/state/myBox/@checked"/>
</operation>
```

### How do I bind one component to another?
Bind both components to the same underlying XML document (alias). When one component changes the document, the other reflects the update automatically. There is no direct component-to-component binding; the shared document acts as the intermediary.

### How do I bind to a specific part of an XML document?
Add the `select` attribute on the `<component>` element inside a `bind` operation, using an XPath expression:
```xml
<operation name="bind" value="$tmpDoc">
  <component view="myView" name="myCheckbox1" select="/state/myBox1/@checked"/>
  <component view="myView" name="myCheckbox2" select="/state/myBox2/@checked"/>
</operation>
```

### How do I bind to an external REST API?
Set up an HTTPS channel in the `start` step, then use `bind` with the full API URL. The API must return XML:
```xml
<step id="start">
  <operation name="channel"><name>https</name><title>HTTPS</title><protocol>HTTPS</protocol></operation>
</step>
<step id="bindAPI">
  <operation name="bind" value="https://example.com/api/data.xml">
    <component name="myGrid" view="myView"/>
  </operation>
</step>
```

### How do I filter a database container result?
Append an XPath predicate filter directly to the container path in the `bind` value:
```xml
<operation name="bind" value="tenant://Groups[root = 'role']">
  <component view="myView" name="rolesGrid"/>
</operation>
```

### What is the difference between $alias and {$alias}?
- `$alias` — a **reference** to the underlying XML document object. Use in `bind` and `change` operations that need the live document.
- `{$alias}` — **serializes** the alias content to a string. Use when you need text values or combining expressions.
Never use braces when binding, or you lose the selection model.

### How does the transaction manager keep UI and data in sync?
When a document is bound to a component, a client-side transaction manager ensures changes from either side propagate automatically. Database `listen` events can also trigger rebinding when underlying data changes.

### What is an Xbind?
Xbinds are the standardized data-binding model. Every Xbind has three parts: **Object** (URL to XML document), **Base** (XPath narrowing scope), and **Selection** (array of XPaths for selected nodes). They flow through events and expressions, allowing any component to communicate with any other through a common data state.

### Binding model attribute
The `model` attribute on bind controls how data is interpreted:
- **Default** — data narrowed by the component's base+selection
- **Data** — full XML document ignoring selection
- **Clone** — copies the full data state (document+base+selection) into the receiving component
- **Value** — serializes to a string

---

## Aliases (Variables)

### Four dimensions of an alias
Every alias is either a single string **Value**, or a three-part XML reference:
- **Object (Document)** — URL pointing to the XML data document
- **Base (XPath)** — narrows the alias to start at a specific level
- **Selection** — zero or more XPath expressions pointing to selected parts within the base
- **Value** — used only when the alias stores a string or number

Wrapping in `{$myAlias}` serializes to text and the other dimensions are lost.

**Fallback:** If `$name` does not match any defined alias, XIOS/3 will look for a URL query parameter with that name instead.

### Model types
| Model | Description |
|-------|-------------|
| `data` | Default. Sets the alias to the full data document and selection. |
| `value` | Serializes the reference to a string, omitting XML structure. |
| `new` | Creates a new temporary XML document. User is notified. |
| `newsilent` | Same as `new` but without notifying the user. |
| `global` | Makes a local-scope alias available globally to all steps. |
| `define` | Manually specifies Object, Base, and Selection. |
| `local` | Creates a non-transacted temporary document. |
| `open` | Shows an "Open file" dialog. |
| `container` | Like `open` but for selecting a container. |
| `browse` | Allows selecting any object or container. |

### Creating in-memory documents
```xml
<alias name="data" model="newsilent"><root/></alias>
```

### Arithmetic with aliases
Prefix with `=` and use `{$alias}` to reference values. Operators: `+`, `-`, `*`, `/`, `**` (exponent), `%` (modulus):
```xml
<alias name="total" value="={$quantity} * {$unitPrice}"/>
<alias name="avg" value="={{$sum} / {$count}}"/>
```
Expressions inside `{}` are resolved first, then the math is evaluated.

### Conditional aliases
```xml
<alias name="num" value="0" when="undefined"/>
<alias name="testDoc" value="home://test.xml" when="empty"/>
```
- `when="undefined"` — only sets the alias if never defined
- `when="empty"` — sets if undefined OR empty string

### System aliases
- `$date` — current date (e.g., `2022-12-13`)
- `$time` — current local time (e.g., `11:19`)
- `$tm` — milliseconds since epoch
- `$instance` — current application instance number
- `$package` — XML of the application document
- `$home` — XML data of the home container
- `$widget` — widget settings XML (widget context only)

### Using model="define"
Manually specify Object, Base, and Selection with child elements:
```xml
<alias name="tmpSelection" model="define">
  <document>#tmp1</document>
  <base>/components[1]</base>
  <selection>
    <item select="/components[1]/component[2]"/>
  </selection>
</alias>
```

---

## Expressions

### How expressions work
The expression language enables communication between components and data. Every expression has two parts:
1. **Reference** — points to data (a component, alias, or document URL)
2. **XPath** (optional) — filters/selects within that data

The first part can be a component reference (`#view#comp`), an alias (`$alias`), a URL (`system.xml`), or a channel URI (`channel://name`). The second part starts after the last `#`.

**Auto-evaluation rule:** The `value` attribute on operations and aliases auto-evaluates expressions. Most other attributes require `{}` brackets to evaluate expressions. When in doubt, wrap in `{}`.

### Component references
`#viewName#componentName` accesses the data bound to that component. You must always specify both view and component name (the `application` attribute on triggers may also be used in place of `view`):
- `#MyApp#input1` — reference to the bound data (keeps Object+Base+Selection)
- `{#MyApp#input1}` — serialized string value

### XPath on expressions
Append `#` followed by XPath after a reference:
- `{#MyApp#input1#@name}` — gets the `name` attribute of the selected node
- `{$alias#/root/item[1]}` — absolute XPath from document root
- `{$alias#@href}` — relative XPath from current selection

If XPath starts with `/`, it is absolute from the document root. Without `/`, it is relative to the current selection.

### Curly braces: reference vs serialized
- **Without braces** (`$myAlias`, `#view#comp`) — returns a reference (Xbind with Object+Base+Selection intact). Use when binding to components.
- **With braces** (`{$myAlias}`, `{#view#comp}`) — serializes to string. Use when you need text: `Name: {#DE#tree#@name} ID: {#DE#tree#@id}`

**No nesting serialization brackets.** `{Name: {$first} {$last}}` is invalid. Instead write: `Name: {$first} {$last}` — multiple `{}` expressions can appear side by side in the same attribute or text node, but cannot be nested inside each other. (Math double-braces like `={{$a} / {$b}}` are a separate construct, not nesting.)

### The trigger context (!)
`!` is the trigger context — the event data from the component or system event that activated the current step:
- `!` — full event data reference
- `{!}` — serialized string value
- `!#@name` — XPath on the trigger data
- `!#/config/include` — navigate the trigger's XML
- `!.id` — property access on the trigger object
- `!.clear()` — method call on the trigger object

Save it early: `<alias name="myTrigger" value="!"/>` because `!` changes context inside `decision`, `foreach`, etc.

### Functions in expressions
Functions take expressions as arguments:
- `count($data#/employees/employee)` — count nodes
- `local-name($data#/employees/*)` — element name
- `selection(#View#Comp)` — returns the selection XPath
- `filename(#View#Comp)` — returns the document name

Combine with serialization: `{count($data#/items/*)}`.

### Recursive expressions
Expressions can be nested — inner `{}` resolve first:
- `#{InnerExpression}#Comp` — dynamically build a reference
- `#app{nr{context.xml#/apps/*[last()]/@id}}#input1`

### Method calls on expressions
Use `.method()` syntax: `{#view#comp.getValue()}`, `#app.maximize()`, `#app#comp.clear()`. Method calls cannot be combined with XPath in the same expression.

### Math expressions
Prefix with `=`. Operators: `+`, `-`, `*`, `/`, `**`, `%`, `(`, `)`. Expressions inside `{}` resolve first, then arithmetic is evaluated. `/` and `%` require double braces: `={{$a} / {$b}}`. Parentheses can group sub-expressions: `=({$a} + {$b}) * {$c}`.

Examples:
```xml
<alias name="identitiesStart" value="={$pageOffset} + 1"/>
<alias name="identitiesEnd" value="={$pageOffset} + {$pageCount}"/>
<alias name="counted" value="={$counted} - 1"/>
<alias name="totalPrice" value="={$quantity} * {$unitPrice}"/>
<alias name="exponentiation" value="={$counted} ** {$power}"/>
<alias name="average" value="={{$sum} / {$counted}}"/>
<alias name="modulus" value="={{$sum} % {$counted}}"/>
<!-- Rounding to 2 decimals -->
<alias name="decimals" value="={5555 / 3}"/>
<alias name="rounded" value="{substring({={{$decimals} + 0.005}}, 'endString:.', 'endOffset:3')}"/>
```

### Event propagation
These operations alter the `!` trigger context for their called steps, replacing it with the expression in their `value`: `decision`, `foreach`. The event data transforms as it flows through the operation chain.

---

## Process Logic

### Trigger-step-operation chain
A **trigger** listens for an event. When it fires, the trigger activates a **step** by its `id`. The step contains **operations** that execute sequentially:
```xml
<trigger view="myView" component="btn1" event="Select" step="doSomething"/>
<step id="doSomething">
  <operation name="debug" value="{!}">alert</operation>
</step>
```

### Initialization order
1. **`step id="start"`** — runs before any view loads. Use for aliases, channels, config. Cannot reference UI components.
2. **`Loaded` event** — fires when a view has finished loading and components can be referenced. Use for data binding.
3. **`Opened` event** — fires when a view is fully visible and ready for interaction. Use for final UI setup.

### Error handling in steps
```xml
<step id="config" error="configError" success="configSuccess">
  <operation name="open" value="{$fileName}"/>
</step>
```
If any operation fails, the `error` step runs. If all succeed, the `success` step runs.

### Calling steps from steps
```xml
<operation name="call" value="config"/>
<!-- With parameters -->
<operation name="call" value="printName">
  <param name="name" value="John"/>
</operation>
```

### Event-driven loops
When a loop depends on an event chain (e.g. select component → load → Loaded event → next cycle), **every exit path must maintain the loop**. If a step fails and the expected event never fires, the loop dies silently. Always add loop-back logic to `error` handlers too:
```xml
<step id="load" error="loadError">
  <operation name="bind" value="{$url}">
    <component view="main" name="comp"/>
  </operation>
</step>
<!-- Normal path: Loaded trigger fires → continues loop -->
<!-- Error path: must also continue the loop -->
<step id="loadError">
  <operation name="decision">
    <when test="'{$autoMode}' = 'true'">
      <operation name="call" value="nextCycle"><timer wait="500"/></operation>
    </when>
  </operation>
</step>
```

### Listening for database changes
Use triggers with `communicator` and system events:
```xml
<trigger communicator="CBE" event="Insert" step="handleInsert"/>
```
Or use `database listen` for specific container changes:
```xml
<operation name="database" value="tenant://Settings">
  <listen event="Append" step="rebuild"/>
  <listen event="Remove" step="rebuild"/>
  <listen event="ReplaceText" step="rebuild"/>
</operation>
```

### Modifying XML data with change
```xml
<operation name="change" value="$myDoc">
  <store select="/calendar" type="append">
    <appointment date="{$date}">{#Calendar#Description}</appointment>
  </store>
</operation>
```
Store types: `append`, `prepend`, `replace`, `replaceText`. Expressions in `{}` are evaluated at execution time.

---

## UI Layout and Views

### Panel layout
Set `type="rows"` for vertical stacking, `type="columns"` for horizontal. Nest for complex layouts:
```xml
<panel type="columns" width="400" height="400" padding="5" gap="5">
  <panel type="rows" width="100" height="100%">
    <panel width="100" height="100" look="white"/>
    <panel width="auto" height="fill" look="white"/>
  </panel>
  <panel type="rows" width="auto" height="100%">
    <panel width="100%" height="150" look="white"/>
    <panel width="100%" height="fill" look="white"/>
  </panel>
</panel>
```

### Sizing values
| Value | Meaning |
|-------|---------|
| `100` | Fixed 100px |
| `100%` | 100% of parent's space |
| `auto` | Remaining space after fixed siblings, split equally if multiple |
| `fill` | Stretch to fill remaining space |

### Menus, menubars, toolbars
Placed as direct children of `<view>`, before the main `<panel>`:
```xml
<view name="myView" width="100%" height="100%" title="Example">
  <menubar name="menuBar" position="top">
    <menu name="fileMenu" text="File">...</menu>
  </menubar>
  <toolbar name="toolbarName" position="top">
    <group name="leftBar">...</group>
  </toolbar>
  <panel><!-- content --></panel>
</view>
```

### Responsive views
Use `screen` attribute on `<view>`: `phone` (max 600px), `tablet` (601-1024px), `desktop` (min 1025px):
```xml
<view name="phoneView" screen="phone">...</view>
<view name="desktopView" screen="desktop">...</view>
```
Custom breakpoints: `screen="(max-width: 360px)"`.

### Decorationless windows
```xml
<view name="myView" look="plain" bgblur="false" taskbar="false"
      mode="window" winstate="false" resize="false"
      alwaysontop="true" draggable="true" width="300" height="100">
```

---

## Rules

### How rules work
The `<rule>` element defines how a data-driven component renders bound XML. Rules use XPath via `match` to select which elements to act on. The data is unaltered — multiple components can show the same data differently:
```xml
<combobox name="CB" width="150">
  <plate name="CBplate" height="30">
    <rule match="component"><item>{@name}</item></rule>
  </plate>
</combobox>
```

### Match attribute
`match` takes an XPath selecting which nodes to render. On Grid `<row>`, it selects the repeating element; on `<column>`, it selects the attribute/child relative to the row:
```xml
<row match="component" height="50">
  <column name="Name" match="@name" display="."/>
  <column name="Tag" match="@tag" display="."/>
</row>
```

### Display attribute
`display` is an XPath relative to what `match` selected. It determines cell text and makes cells **read-only**. Omitting `display` and using `look` instead makes cells **editable**:
```xml
<column name="Name" match="@name" display="."/>        <!-- read-only -->
<column name="Group" match="@group" look="classic"/>    <!-- editable -->
```

---

## Events

### Three event types
- **Component Events** — user interacts with a component (click, select). Trigger: `<trigger view="v" component="btn" event="Select" step="s"/>`
- **View Events** — keyboard shortcuts, lifecycle (Opened, Closing, Focus). Trigger omits `component`: `<trigger view="v" event="Ctrl+S" step="s"/>`
- **System Events** — from XIOS/3 system (Login, Error, Timeout). Uses `communicator`: `<trigger communicator="xios" event="Login" step="s"/>`

### Keyboard shortcuts
```xml
<trigger view="calc" event="Alt+A" step="Add"/>
<trigger view="calc" event="Ctrl+B" step="Bold"/>
<trigger view="calc" event="Escape" step="Cancel"/>
```

### Drag and drop
Set `draggable="true"` on the source. Listen for `Drop` on the target:
```xml
<trigger view="appView" component="targetList" event="Drop" step="droppedItem"/>
```
Event data `{!}` contains the dragged item's value.

### Default button
```xml
<button name="submitBtn" text="Submit" default="true"/>
```
Pressing Enter triggers this button's `Select` event. Only one per view.

---

## Components

### Actions vs Methods
**Actions** are preferred — they are faster. Use for state changes (show, hide, enable, disable, set, clear, focus, error, valid, busy, warning).

**Methods** (via `callMethod`) are for when no action exists:
```xml
<operation name="callMethod" value="#ButtonView#myLabel">
  <method name="setValue"><param type="string">Hello World</param></method>
</operation>
```
Rule: if an action can do it, use the action.

### Inherited Attributes
These attributes are available on **all** components (omitted from individual component lookups to save space):
- **draggable** (boolean, default: false) — if the component should be draggable
- **dragicon** (string, path) — icon to use as drag handle, or "true" for auto
- **label** (string) — adds a label to a component (requires panel parent)
- **label-style** (string, CSS) — overrides default label style (requires panel parent)
- **tabindex** (numeric, 1+) — override tab order between components
- **theme** (string) — set theme for this component and its children
- **windowdrag** (boolean, default: false) — drag the window when this component is dragged


## Styling and Themes

### Three layers (use in order)
1. **`theme="name"`** on `<application>` — base look (aqua, cbe, classic, fabric, glass, graphite, liquid, marble, sparse)
2. **`look="value"`** on components — component appearance within the theme
3. **`style=""` / `<style>` block** — CSS overrides

### CSS in views
```xml
<view ...>
  <style>
    #componentName { color: red; background: #f0f0f0; }
    #componentName:hover { background: #ddd; }
  </style>
  <panel>...</panel>
</view>
```
External CSS: `<style href="/assets/main.css"/>`

### Icon protocol
`icon://name?color=FF5722&size=32&theme=marble&shadow=true`
Overlay a badge icon: `icon://folder?overlay=star&opos=ne&ocolor=green&osize=0.5` — positions: n, ne, e, se, s, sw, w, nw, c. Use `xios_icons` tool to search for icon names.

### Inline theme overrides
Override theme defaults per-app using `<theme>` inside `<application>`:
```xml
<application theme="fabric">
  <theme>
    <components><panel gap="5"/></components>
  </theme>
  ...
</application>
```

### Custom themes
Inherit from `marble` (the only inheritable standard theme):
```xml
<theme name="myTheme" file="mytheme" icon="icon://palette" author="Author">
  <inherit href="/xios/gui/themes/marble.xml"/>
  <colors><color name="green">#53a616</color></colors>
  <components><button look="fabric"/></components>
</theme>
```

### Dynamic theme switching
```xml
<operation name="change" value="$package">
  <store select="/@theme" type="replaceText">{$newTheme}</store>
</operation>
```

---

## Component Patterns

### Grid with data binding (Todo pattern)
```xml
<grid name="TaskList" height="fill" width="100%" selection="row">
  <row match="task" height="18">
    <column name="dateCol" match="@added" display="." width="75" label="Added"/>
    <column name="nameCol" match="@name" display="." width="100%" label="Task"/>
    <column name="doneCol" match="@done" display="." width="30" label="Done"/>
  </row>
  <rule match="@done"><checkbox/></rule>
</grid>
```
Note: `rule match="@done"` with `<checkbox/>` renders a checkbox for boolean attributes.

### Toolbar with groups
```xml
<toolbar name="mainBar" position="top">
  <group name="leftBar">
    <buttonbox name="addBtn" text="Add" icon="icon://plus?color=orange"/>
  </group>
  <group name="rightBar" align="right">
    <buttonbox name="deleteBtn" text="Delete" icon="icon://delete?color=red"/>
  </group>
</toolbar>
```
Note: Use `<group align="right">` to push buttons to the right side.

### Context menu pattern
```xml
<!-- In view (outside panel) -->
<menu name="contextMenu">
  <item name="editItem" text="Edit" icon="icon://edit"/>
  <item name="deleteItem" text="Delete" icon="icon://delete"/>
</menu>
<!-- Trigger: ContextMenu event opens it, Select events on items handle actions -->
<trigger view="v" component="grid1" event="ContextMenu" step="showCtx"/>
<trigger view="v" component="editItem" event="Select" step="editStep"/>
<!-- Open with action -->
<operation name="action" value="#v">
  <component name="contextMenu" action="open"/>
</operation>
```

### Chat/container component
```xml
<container name="messages" show="all" width="100%">
  <rule match="question"><label class="question" name="q"/></rule>
  <rule match="response"><label class="response" name="r"/></rule>
</container>
```
Note: The `container` component renders each child element according to matching rules. Use with in-memory alias + `change` append to add messages.

### Combobox with static items
```xml
<combobox name="selector" editable="false" subplate="selectorPlate">
  <plate name="selectorPlate" height="200">
    <item value="opt1" contenttext="Option 1">Option 1</item>
    <item value="opt2" contenttext="Option 2">Option 2</item>
  </plate>
</combobox>
```

### Combobox with dynamic data (rules)
```xml
<combobox name="selector" editable="false" subplate="selectorPlate">
  <plate name="selectorPlate" width="230" height="100">
    <rule match="db:container"><item>{@name}</item></rule>
  </plate>
</combobox>
```

### Map with markers
```xml
<map name="mapComp" controls="false" zoomlevel="5" mapcenter="59.5,15.2">
  <rule match="station[active='true']">
    <marker lng="{longitude}" lat="{latitude}" title="{name}"
            icon="icon://pin?theme=aqua" icon-select="icon://pin?color=red" size="20"/>
  </rule>
</map>
```

### Menubar with hotkeys
```xml
<menubar name="menuBar" position="top">
  <menu name="fileMenu" text="File">
    <item name="mNew" text="New" icon="icon://document_new" hotkeytext="Ctrl+N"/>
    <divider/>
    <item name="mSave" text="Save" icon="icon://save" hotkeytext="Ctrl+S"/>
  </menu>
</menubar>
```
Note: `hotkeytext` displays the shortcut text. You still need a separate `<trigger>` for the actual keyboard event.

### Tree visualization
```xml
<tree name="myTree" width="100%" height="100%" tree-expand="true" rename="false">
  <rule match="list" display="@name" icon="icon://list_style_numbered" open="true"/>
  <rule match="item" display="@name" icon="icon://pencil"/>
  <rule match="item/text" display="."/>
</tree>
```
Note: `display` on rules uses XPath — `@attr` for attributes, `.` for text content. `open="true"` expands nodes by default.

### Multi-panel layout patterns
```xml
<!-- Sidebar + main -->
<panel type="columns" width="100%" height="100%">
  <panel name="sidebar" width="200" type="rows" bgcolor="#f0f0f0" padding="10"/>
  <panel name="main" width="fill" type="rows" padding="10"/>
</panel>

<!-- Header + content + footer -->
<panel type="rows" width="100%" height="100%">
  <panel height="50" bgcolor="#333"/>
  <panel height="fill" type="rows" padding="10"/>
  <panel height="30" bgcolor="#eee"/>
</panel>
```

### XSL transform with render component
```xml
<resources>
  <item name="breakfast"><breakfast-menu>...</breakfast-menu></item>
</resources>
<render name="render" href="xios://apps/help/layout/menu.xsl"/>
<!-- Bind: -->
<operation name="bind" value="#breakfast">
  <component view="xslView" name="render" select="/"/>
</operation>
```
Note: `<resources><item name="...">` embeds inline XML accessible as `#itemName`. `render` applies XSL to produce HTML.

### Proxy API call (JSON)
```xml
<step id="start">
  <operation name="channel">
    <name>myapi</name>
    <proxy>myproxy</proxy>
    <title>API</title>
    <protocol>PROXY</protocol>
    <adapter path="/" type="CompactJSON"/>
  </operation>
</step>
<step id="callApi">
  <operation name="callService" value="myapi://endpoint">
    <wait>true</wait>
    <document>api://response</document>
    <method>POST</method>
    <body type="json" eval="pct">{ "key": "(%$value%)" }</body>
  </operation>
</step>
```
Note: `eval="pct"` uses `(%...%)` delimiters instead of `{}` for expression evaluation inside JSON bodies.

### Confirm input dialog
```xml
<step id="askName">
  <operation name="confirm">
    <type value="input"/>
    <message>Enter the name:</message>
    <modal>false</modal>
    <title>New Item</title>
    <ok step="createItem" text="OK"/>
    <cancel step="cancelled" text="Cancel"/>
  </operation>
</step>
<step id="createItem">
  <alias name="itemName" value="{!}"/>
</step>
```
Note: `confirm` with `type="input"` prompts for text. The entered value is available as `{!}` in the `ok` step. Use `type="message"` for a plain alert with no input.

### Iconlist container navigation
```xml
<iconlist name="boards" layout="submenu" deselect="false" scroll="false">
  <rule match="db:container">
    <item text="{@name}" icon="icon://folder"/>
  </rule>
</iconlist>

<!-- Bind container listing -->
<operation name="bind" value="tenant://Kanban">
  <component view="v" name="boards" select="/db:result"/>
</operation>

<!-- Set selection programmatically -->
<operation name="setSelection" value="">
  <component view="v" name="boards">
    <item select="/db:result/db:container[1]"/>
  </component>
</operation>

<!-- Navigate into selected container -->
<operation name="bind" value="{#v#boards#@xlink:href}">
  <component view="v" name="subList" select=""/>
</operation>
```
Note: `setSelection` sets the active item without user interaction. `{#v#boards#@xlink:href}` reads the selected container's URL to drill into it.

### Full app manifest template
```xml
<application name="MyApp" icon="icon://rocket" instances="0" theme="fabric">
  <share>false</share>
  <settings>
    <home></home>
  </settings>
  <about loader="false" version="1.0" author="Author">
    <description>App description</description>
  </about>
  <view name="Main" title="My App" icon="icon://rocket">
    <panel name="MainPanel" type="rows"/>
  </view>
  <process name="MyApp - Process">
    <trigger view="Main" event="Loaded" step="init"/>
    <step id="init"/>
  </process>
</application>
```

### Multi-file app manifest
Split views and processes into separate files using `xlink:href`:
```xml
<application name="MyApp" icon="icon://rocket" xmlns:xlink="http://www.w3.org/1999/xlink">
  <settings><home></home></settings>
  <view name="Main" xlink:actuate="onLoad" xlink:href="view.xml"/>
  <process name="MyApp - Process" xlink:actuate="onLoad" xlink:href="process.xml"/>
</application>
```
Note: The linked files contain the inner content (e.g. `view.xml` has `<panel>...</panel>`, `process.xml` has `<trigger>...<step>...`). Paths are relative to the manifest.

---

### Multi-file view or process
Split views and processes into separate files using `xlink:href` and `xlink:actuate`
```xml
<application name="app" icon="icon://rocket" xmlns:xlink="http://www.w3.org/1999/xlink">
  <settings><home></home></settings>
  <view name="homepage" xlink:actuate="onRequest" xlink:href="homepage.xml"/>
  <view name="settings" xlink:actuate="onRequest" xlink:href="settings.xml"/>
  <view name="loginpage" xlink:actuate="onLoad" xlink:href="loginpage.xml"/>
  <process name="appProcess" xlink:actuate="onLoad" xlink:href="appProcess.xml"/>
</application>
```

---

### Linking views from other views
You can link view files into other view files with `xlink:href` and `xlink:actuate`
```xml
<view xmlns:xlink="http://www.w3.org/1999/xlink" name="stats" height="100%" width="100%">
  <panel name="columnStructure" type="columns" bgcolor="white" scroll="true">
    <panel name="column1" width="25%" height="100%">
      <panel name="sidePanel" width="100%" height="100%" xlink:actuate="onLoad" xlink:href="sidePanel.xml"/>
    </panel>
    <panel name="column2" width="75%" height="100%">
      <panel name="contentPanel" height="100%" width="100%" xlink:actuate="onLoad" xlink:href="contentPanel.xml"/>
    </panel>
  </panel>
</view>
```

---

## Advanced Patterns

### Synthetic data
Copy real data into a temp doc and modify it:
```xml
<alias name="cfgData" model="newsilent">{xml(tenant://Settings)}</alias>
<operation name="change" value="$cfgData">
  <store select="/db:result" type="prepend">
    <db:container name="Fake" xlink:href="home://"/>
  </store>
</operation>
```

### Live-updated synthetic data
Use `database listen` to watch for changes, then re-run the rebuild step:
```xml
<operation name="database" value="tenant://Settings">
  <listen event="Append" step="syntheticTabs"/>
  <listen event="Remove" step="syntheticTabs"/>
</operation>
```

### Localization
1. Create locale XML files with `<keys><key id="Stream">Mediastream</key></keys>`
2. Add namespace `xmlns:l="https://xios3.com/lang"` to `<application>`
3. Set `<locale>home://locale</locale>` in `<settings>`
4. Prefix attributes with `l:`: `<label l:value="Stream"/>`
5. In process code: `get-label('key')` or `apply-locale()`

### URL query string parameters
```xml
<alias name="country" value="{host://.url#/url/param[@key='cty']}" model="value"/>
<alias name="quantity" value="{host://.url#/url/param[@key='qty']}" model="value"/>
```

### JavaScript integration
**JS as steps** — export functions, call from XML:
```xml
<process>
  <script href="myModules.js"/>
  <step id="start">
    <operation name="call" value="greet"/>
  </step>
</process>
```

**JS as full process class** — replace entire process with ES6 class:
```js
export default class MyApp {
  constructor(context, basePath) {
    sys.evtMng.addTrigger("View", null, "Loaded", this, this.loadView);
    sys.evtMng.addTrigger("View", "Btn", "Select", this, this.onclick);
  }
  loadView = (evt) => { this.view = evt.getView(); }
  onclick = (evt) => { console.log('Clicked!'); }
}
```

Rule of thumb: start with XML. Only add JS for things XML can't do cleanly. Never use full JS class unless explicitly needed.
