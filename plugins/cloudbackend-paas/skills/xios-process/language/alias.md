# Aliases

- `<alias name value>` (`model="data"`, the default): `$name` is the reference itself - document plus selection, read live
- `model="value"`: `$name` is plain text, with no selection
- `when="undefined"`: only if `$name` is not set yet; `when="empty"`: also when its value is empty
- names that can not be set: `date`, `time`, `tm`, `widget`, `instance`, `package`, `home`

- A reference is kept, not copied: `<alias name="doc" value="#todos"/>` sees later changes, `<alias name="row" value="!"/>` keeps what ran the step with the rows selected then. A `{...}` value is text taken now: `value="{count($doc#/todos/item)}"`.
- One `$name` per application instance: its steps, processes and `<param>`s share it; another instance has its own.
- Read it bare in a **ref** attribute (`value="$doc"`); `$doc#/todos/item[1]` goes from the root, `$row#@title` from the selected node; `{$name}` is its text. Read before it is set it is empty ("Alias is not defined" in the log).
