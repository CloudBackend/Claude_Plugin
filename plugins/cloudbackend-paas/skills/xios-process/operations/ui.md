# action

`<operation name="action" value="ref"><component name="{}" action="set">{}</component></operation>`: `value="#v1"` with a `<component name>` per change, or `value="#v1#title"` and no `name`
`action`: set (the body), show, hide, enable, disable, busy, select, release, focus, activate, clear, readonly, readwrite, error, warning, success, valid (clears the state), open (a menu, from a mouse event), add (appends the body's markup to a panel)
`<view action="maximize|minimize|restore|focus|resize" width="n" height="n"/>`: the view's window

# callMethod

`<operation name="callMethod" value="ref"><method name="{}" alias="id"><param type="string|boolean|integer|object">{}</param></method></operation>`: `value` is a component; `alias` keeps what the method returns; an `object` param is a reference
`then="id"` on the operation runs a step when the method's work is done; `wait="true"` holds this step until then

- Its methods are listed in the component's xios-views file; a `<param>` without `type` is a string.

# setSelection

`<operation name="setSelection" value="ref"><component view="{}" name="{}"><item select="xpath"/></component></operation>`: without `view` nothing happens; without `<item>` it selects what `value` points at; one `<item>` per row
