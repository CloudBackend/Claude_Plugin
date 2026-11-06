# bind

`<operation name="bind" value="ref"><component view="{}" name="{}" select="xpath"/></operation>`: `select` is added to the value's selection, even with a leading `/`: `value="$doc"` with `select="/todos"`

- It binds to the node selected when it runs and does not follow later selections: fields that show a list's selected row are bound in the list's Select step, `value="!"`.
- An unknown component is skipped silently, an unknown view is an error. Binding again replaces; no `value` releases the listed components.

# change

`<operation name="change" value="ref"><store type="append|prepend|insert|insertAfter|replace|replaceText" select="xpath">XML or text</store></operation>`: `select` is added to the value's selection, even with a leading `/`
`<delete select="xpath"/>`, `<delete type="children"/>`, `<move select="xpath" before="xpath"/>`: `<move>` (or `after`, `into`) is always from the root

- With `value="$doc"` `select` goes from the root, with `value="!"` or `#v1#list` from the selected row.
- append/prepend: last/first child of the select node; insert/insertAfter: before/after it; replace: the node itself.
- The body is a template: `<store type="append" select="/todos"><item id="{uuid()}" title="{#v1#title}"/></store>`. In `replaceText` (the text of the element or `@attr`, made if missing) `!` is each matched element.
- A bare `<delete/>` with `value="#v1#list"` or `"!"` deletes the selected rows; with no row selected it deletes the list's bound node, every row with it: guard it with `<if value="#v1" test="{count-selection(#v1#list)} > 0">`.

# foreach

`<operation name="foreach" value="ref">operations</operation>`: once per node, in order, `!` the current one

- `value`: nodes (`$doc#/todos/item[@done = 'true']`), a component's selected rows (`#v1#list`), or `1..10`. No early exit: test inside with `<if>`.

# create

`<operation name="create" value="#name">one XML element</operation>`: makes the in-memory document `#name`, or replaces its content in place (bound components update); no alias is set
`<template value="{}"/>`: in place of the element: a file's content, from a full address (`app://Data/x.xml`); a relative path is not found

- Refer to it as `#todos`, or `<alias name="doc" value="#todos"/>`; nothing is on disk until a `save` with `<create path>`.
- `<template>` copies the file: changes never reach it. To show and change a file, bind and change it by its address: `value="app://contacts.xml"`.
