# Expressions

- XIOS operators, spaced: `or`, `and`, `=`, `!=`, `<`, `<=`, `>`, `>=`, `+`, `-`, `*`, `div`, `mod`, unary `-`, `( )`; `lt`, `le`, `gt`, `ge`, `eq`, `ne` too
- literals: 'text' (a `{...}` in it is filled), "it's", numbers, `true()`, `false()`; a comparison gives the text `true()` or `false()`

- **XPath 1.0** (`test`, `select`, `match`) on the value's node. `{…}` is filled first: in quotes quoted for you (`@id = '{!#@id}'`), outside as it is (`{count($doc#/todos/item)} > 0`, `{$n = 4}`).
- **Rule** (`{…}` in a `rule`, a table `column`, `display`): a path on the row, `{@a} {@b}`, `{../@name}`; no XPath functions or operators, no `$` or `#`. `display` takes one.
- **XIOS**: a ref attribute (`value`, alias, param) is one expression giving data + selection: `$doc`, `#todos`, `#v1#list` (its data, selected rows), `!` (what ran the step); `#name` alone is a view or an in-memory document, never a component, so a list is always `#view#list`; a `#xpath` after it goes from its node, from the root with `/`: `$row#@id`, `$doc#/todos/@name`. Other attributes and bodies are text, each `{…}` filled: `{#v1#title}`, `{#v1#list#@id}` (the selected row's); a body's `{xml(ref)}` becomes elements. Operators only in `{…}`.
- Common functions: `count(ref)`, `count-selection`, `selection` (its XPath), `concat`, `contains`, `string-length`, `translate`, `substring-before`/`-after`, `uuid()`, `formatdate(date, 'yyyy-MM-dd')`, `file-exists(path)`; for others read `functions.md`.

Traps:
- `value="{$doc}"` is text, `value="$doc"` data.
- Unspaced is a name or text: `{$n+1}`, `{1=1}`.
- No operator in an argument or `not()`, even in a nested `{…}`: `{$n != 4}`.
- A `test` is XPath; each `{…}` in it is evaluated by XIOS first and its text put in. XPath's own functions (`normalize-space`, `sum`, `number`, `starts-with`, `round`) go outside the braces: blank or empty is `test="normalize-space('{#v1#name}') = ''"`. XIOS functions (`count-selection`, `file-exists`) go inside: `test="{count-selection(#v1#list)} > 0"`. In `{…}` an XPath function is its own text, so `{number($n) + 1}` is NaN. `substring` takes `'startPos:n'`.
- `{ref}` of several nodes runs them together: `join(ref, ',')`.
- (text) functions read a bare ref as its address and keep quotes: `upcase({$row#@title})`, `upcase(abc)`.
- In a test: a ref needs `{…}`; `true` text is a path: `'{$t}' = 'true'`; with a `{…}` an apostrophe in "…" is dropped.
- `#x` is the view `x` while open, else the document.
