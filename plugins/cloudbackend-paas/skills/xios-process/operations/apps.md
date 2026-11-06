# open

`<operation name="open" value="ref"><param name="{}" value="ref"/></operation>`: another view, `value="$package#view[@name = 'v2']"` (same instance), or a file (an instance of its own); `<param>`s set the opened instance's aliases
`<browser/>`: in an open: `value` as a URL in a browser tab

# close

`<operation name="close" value="id"/>`: the view of that name, no `#`; `<mode>application</mode>` in it closes this application, `<mode>document</mode>` drops `value="#name"`

# config

`<operation name="config"><setLanguage value="{}"/></operation>`: one child per operation; the value is a locale file's name: `sv_SE`
`<operation name="config" value="{}"><getProperty alias="id"/></operation>`, `<setProperty value="{}"/>`: the signed-in user's setting at that path

- `{get-label(KEY)}` answers in the new language from the next operation on.

# system

`<operation name="system"><copyToClipboard>{}</copyToClipboard></operation>`, `<logout/>`: one child per operation

# callService

`<operation name="callService" value="ref"><param name="{}">{}</param><document>{}</document></operation>`: `value` is `channel://path`; GET, params in the query; the answer, as XML, becomes the `<document>`
`<body type="json" eval="pct">{"q": "(%$city%)"}</body>`: sends a POST; only `(%...%)` is filled; one XML element in `<body>` sends XML
`<silent>true</silent>`: a failure does not fail the step; `<headers>` holds one element per header
