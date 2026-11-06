# decision

`<if value="ref" test="xpath">ops</if>`: one condition, no else, straight in a step or branch.
`<operation name="decision" value="ref"><when test="xpath">ops</when><otherwise>ops</otherwise></operation>`: several branches. A branch holds operations or `step="id"`.

- If/else is a `decision` with `<otherwise>`: two `<if>`s in a row both run, and the second tests what the first changed.
- `value` is a document or view (`#v1` if the test needs no node); a value alias there opens as a file.
- `test` is XPath on the value's selected node: `value="$doc" test="count(/todos/item) = 0"`. Each `{…}` in it is evaluated first and its text put in: `test="normalize-space('{#v1#title}') = ''"` (blank too), `test="{file-exists(local://app/x.xml)}"`.

# call

`<operation name="call" value="id"><param name="{}" value="ref"/></operation>`: runs the step now and waits
`<timer interval="n|stop" wait="n|stop" alias="id"/>`: in a call: every n ms, or once after n ms; `stop` ends it; returns at once

- `<param>`s set aliases of the whole instance. A step can not call itself, even through others: loop with `foreach` or a timer.

# async

`<operation name="async">operations</operation>`: starts them together, ends when all have

- The children must not depend on each other's aliases.

# confirm

`<operation name="confirm"><type value="message|confirm|input"/><message>{}</message><ok step="id" text="{}"/><cancel step="id" text="{}"/></operation>`: `<message>` is required; `<button step text>` goes between ok and cancel; `<initial>` fills an input

- It waits for the pressed button's step; that step gets this step's `!`, no text. Only an input's ok step gets the typed text, as `{!}`.

# debug

`<operation name="debug" value="ref"/>`: logs the value, or a reference's document, XPath and selection; body `alert`: a dialog
