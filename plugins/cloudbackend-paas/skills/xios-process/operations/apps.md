# open

`<operation name="open" value="ref"><param name="{}" value="ref"/></operation>`: another view, `value="$package#view[@name = 'v2']"` (same instance), or a file (an instance of its own); `<param>`s set the opened file's aliases; a view of this package gets none: set an `<alias>` before the `open`
`<browser/>`: in an open: `value` as a URL in a browser tab

- To edit a row in it with Save and Cancel, fill the field with `action="set"` and write on Save with `change`: a bound field writes each edit at once.

# close

`<operation name="close" value="id"/>`: the view of that name, no `#`; `<mode>application</mode>` in it closes this application, `<mode>document</mode>` drops `value="#name"`

# config

`<operation name="config"><setLanguage value="{}"/></operation>`: one child per operation; the value is a locale file's name: `sv_SE`
`<operation name="config" value="{}"><getProperty alias="id"/></operation>`, `<setProperty value="{}"/>`: the signed-in user's setting at that path

- `{get-label(KEY)}` answers in the new language from the next operation on.

# system

`<operation name="system"><copyToClipboard>{}</copyToClipboard></operation>`, `<logout/>`: one child per operation

# callService

`<operation name="callService" value="ref"><param name="{}">{}</param><document>{}</document></operation>`: `value` is `channel://path`; GET, params in the query; the answer, as XML, becomes the `<document>`; on an HTTPS channel an HTTP error answer (400 or above) does too, and fails the step with the status and its text: `400: ...`
`<body type="json" eval="pct">{"q": "(%$city%)"}</body>`: sends a POST; only `(%...%)` is filled; without `eval="pct"` a `{` in text starts an expression, so write JSON this way; one XML element in `<body>` sends XML
`<method>PUT</method>`: the request method, for PUT and DELETE; left out it is GET, or POST when there is a `<body>`
`<silent>true</silent>`: a failure does not fail the step; `<headers>` holds one element per header
