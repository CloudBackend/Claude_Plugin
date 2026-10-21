# Actions Reference

Actions change a component's state via the `action` operation in process logic.

```xml
<operation name="action" value="#viewName">
  <component name="componentName" action="actionName"/>
</operation>
```

Actions are faster than methods -- prefer actions when both can achieve the same result.

---

## activate

Sets a component to be the active component in a page, giving it focus for keyboard input. Similar to the `focus` method but handled as an action.

Applies to: RichText, TextArea, Tree

---

## add

Dynamically creates (adds) child components inside a container. Use the `value` attribute to reference the view fragment to add.

Applies to: Container, Menu

```xml
<component name="component1" action="add" value="#view1#ListDynamicCreation"/>
```

---

## busy

Sets a component into a busy, non-responsive state. Visually indicates working/waiting -- functionally equivalent to disabled but with a different visual treatment.

Applies to: Button

### Notes
- Use `enable` to return the component to its normal state

---

## clear

Clears the value inside input components. Useful for resetting forms after data is saved.

Applies to: Input, TextArea

---

## disable

Applies to: Button, ButtonBox, Calendar, CheckBox, Color, ComboBox, DataItem, Date, Grid, Group, Input, Item, Menu, Menu Item, RichText, Slider, TextArea

---

## enable

Reverses the `disable` action, returning the component to its normal interactive state.

Applies to: Button, ButtonBox, Calendar, CheckBox, Color, ComboBox, DataItem, Date, Grid, Group, Input, Item, Menu, Menu Item, RichText, Slider, TextArea

---

## error

Sets the component into an error state with visual feedback (turns red). Use the `valid` action to clear.

Applies to: Label, Input

---

## focus

Gives focus to a component.

Applies to: (general -- no specific list documented)

---

## hide

Applies to: Accordion, Button, ButtonBox, Calendar, CheckBox, Clock, Color, ComboBox, Shell, Container, DataItem, Date, Form, Grid, Group, Image, Input, Label, List, ListView, Menu, Menu Item, MenuBar, Panel, Radio, Render, RichText, Slider, TabStrip, TextArea, Toggle, Toolbar, Tree

---

## open

Opens context menus programmatically.

Applies to: Menu

---

## readonly

Sets the component to read-only mode -- it will not accept user input that would modify bound data.

Applies to: (general -- no specific list documented)

### Notes
- If the bound data is inherently read-only, the component enters this mode automatically

---

## readwrite

Reverses the `readonly` action, allowing user input to modify bound data again.

Applies to: (general -- no specific list documented)

---

## release

Programmatically deselects a component, simulating end-user interaction. Triggers the Release event.

Applies to: Button, ButtonBox

### Notes
- Fires the Release event on the component

---

## select

Programmatically selects a component, simulating end-user interaction. Useful for selecting multiple components at once without manual user clicks.

Applies to: Button, ButtonBox, Image, Menu Item

---

## set

Sets a simple string value to a component. The value can be a composite of free text and expressions.

Applies to: (general -- no specific list documented)

```xml
<component name="component1" action="set">
  Composite of free text and {#view1#component2}.
</component>
```

### Notes
- Value is specified as the text content of the `<component>` element, not as an attribute
- Supports expression interpolation with `{}`

---

## show

Reverses the `hide` action, making the component visible and interactive again.

Applies to: Accordion, Button, ButtonBox, Calendar, CheckBox, Clock, Color, ComboBox, Shell, Container, DataItem, Date, Form, Grid, Group, Image, Input, Label, List, ListView, Menu, Menu Item, MenuBar, Panel, Radio, Render, RichText, Slider, TabStrip, TextArea, Toggle, Toolbar, Tree

---

## unbind

Removes data binding from a component that was bound via the `bind` operation.

Applies to: All components where data can be bound

---

## valid

Clears an error or warning state, returning the component to its normal valid visual state.

Applies to: Label, Input

---

## warning

Sets the component into a warning state with visual feedback.

Applies to: Label, Input

---

# Action URLs

Action URLs are expression URLs tied to a specific channel (e.g. `home://`) that perform operations on a database. They resemble functions with parameters.

---

## lastLogins

Returns a `db:container` document listing the last logins to a specific group.

```
XML = [channel]://lastLogins([groupPath])
```

**Parameter:** group path (e.g. `XideZone/europeans`)

```xml
<alias name="lastLogins" value="home://lastLogins(XideZone/europeans)"/>
```

---

## leaveGroup

Makes the current user leave a group. The user loses all association with the group including username and Objects.

```
nothing = [channel]://leaveGroup([groupPath])
```

**Parameter:** group path (e.g. `XideZone/europeans`)

```xml
<alias name="leave" value="home://leaveGroup(XideZone/europeans)"/>
```

### Notes
- When a user leaves a group, they lose any association with it (username, Objects, etc.)

---

## search

Returns a composite database result (`db:container` with `db:object` elements) matching a search query across containers.

```
XML = [channel]://search('[containerPath]','[query]',depth)
```

**Parameters:**
1. Root container path(s) -- join multiple with `|` (e.g. `search(/Documents/|/Applications/)`)
2. Search term -- property searches use `property:value` syntax (e.g. `root:html`, `type:text/xml`)
3. Search depth (optional) -- how many containers deep; 0 or omitted = unlimited

```xml
<alias name="searchResults" value="home://search(/Documents/,type:text/xml)" model="data"/>
```

### Search modifiers (URL parameters)
- **order** -- sort field: `published` (default), `updated`, `title`, `length`
- **ascending** -- `true` (default) or `false`

```
home://search(/Documents/)?order=updated&ascending=false
```

### Notes
- Recursive search can be very resource-demanding

---

## searchUser

Returns an XML node-set of user information (id, alias, display name). Searches by username (alias) by default, or by user id with the `user:` prefix.

```
XML = home://searchUser(['query'],['groupPath'])
```

**Parameters:**
1. Search term (required) -- username by default, or `user:[id]` for id search
2. Group path (optional) -- if omitted, searches tenant group users

```xml
<alias name="userData" value="home://searchUser(goran)"/>
<alias name="userId" value="$userData#/db:result/db:object/@id"/>
```

### Notes
- Result fields: `@id`, `@name`, `name` (full name), `display` (chosen display name)

---

## tap

Taps into a container on a different database using its container-id (cid). From there you can navigate as if it were a local container.

```xml
<alias name="tappedContainer" value="main://tap({$cid})"/>
<alias name="gold" value="main://tap({$cid})/treasure/chest.png"/>
```

### Notes
- The channel must use the same communicator as the target container (e.g. cannot access tenant-database from `local://`)
