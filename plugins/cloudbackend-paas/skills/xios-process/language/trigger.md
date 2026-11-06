# Triggers

- `<trigger view component event step>`: `event` is one of the component's events (its file in the xios-views skill lists them)
- `<trigger view event step>` (no `component`): the view's own events `Opened`, `Loaded`, `Close`, `Focus`, `Blur`, `ResizeEnd`
- keys, on the view: KeyboardEvent.key with its modifiers, a letter in capitals (`Escape`, `8`, `Ctrl+S`, `Shift+*` for Shift+8) or an action, mapped per platform: `Save`, `New`, `Open`, `Copy`, `Cut`, `Paste`, `Undo`, `Redo`, `SelectAll`, `Find`, `Print`
- `<trigger communicator="channel" event step>`: `Login` (the channel needs a login), `Authorized`, `LoginFailure`
- in a step run by `error="id"`, `!` is a document `<error>` with `process`, `step`, `operationNumber`, `description`, `details`

- `!` is what fired: a component (`{!}` its value, `!#@id` its selected row, `{selection(!)}`), the view for a view event or key, the channel for a communicator. A `success` or `goto` step has no `!`: keep it in an alias.
- `<param name value>` sets `$name` to `value` evaluated on the event, on firing: `value="{!}"` is the pressing component's value (a button's text); a step still queued reads the next firing's.
- `CharX` fires for a typed character X with any modifiers (`Char*`). `event="*"` matches every event, never the * key. Keys fire while the view's window is active (no focus needed), not in an input or textarea (Ctrl/Cmd keys do); Enter on a focused button presses it instead. A focused list, table or tree keeps the keys it uses (arrows, Enter, F2, Delete with a row selected): for Delete there, trigger its own event, `component="files" event="Delete"`.
- While a component's step for an event is queued or running, the same event from it is dropped. `Opened` and `Loaded` run once per view, also if it opened before the process started: bind in `Loaded`.
