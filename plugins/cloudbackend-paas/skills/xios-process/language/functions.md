# Expression functions

An argument is a bare reference or 'quoted' text: `concat($a, '-', $b)`. **(text)**: the arguments are read as one text with its `{...}` filled, then split at commas, so a reference goes in braces: `upcase({$row#@title})`, `contains({$s}, 'x')`.

**Data and selection**

- `count(ref)` how many nodes it selects
- `count-selection(ref)` how many rows are selected
- `selection(ref)` the absolute XPath of the first selected node
- `join(ref, 'sep')` the texts of its nodes, joined
- `position(ref)` the selected node's position
- `local-name(ref)` its local name
- `name(ref)` its qualified name
- `xml(ref)` its nodes as XML (elements again in an operation body)
- `inner-xml(ref)` the XML of its children
- `changes(ref)` how many unsaved changes the document has
- `is-alias(name)` (text) `true()` if `$name` is set

**Text**

- `concat(a, b, ...)` joined
- `string-length(s)` how many characters
- `substring(s, 'startPos:n', 'endPos:n')` from 0, negative from the end; or 'startString:x', 'endString:x', 'substringLength:n'
- `substring-before(s, t)` before the first `t`
- `substring-after(s, t)` after the first `t`
- `upcase(s)` (text) upper case
- `downcase(s)` (text) lower case
- `capitalize(s)` (text) the first letter upper case
- `trim(s)` without surrounding whitespace
- `pad(s, n, 'c')` padded at the end to `n`
- `translate(s, 'abc', 'xy')` characters mapped, or dropped
- `replace(s, 'regex', 'with')` every match replaced (JavaScript regex)
- `match(s, 'regex')` (text) the first match, or empty
- `index-of(s, t)` (text) where `t` starts from 0, or -1
- `contains(s, t)` (text) `true()` or `false()`
- `equal(a, b)` `true()` if the same text
- `not(x)` `true()` unless `x` is `true()` or `true`; a value, not a comparison
- `uuid()` a new random UUID
- `escape-xml(s)` (text) escaped for XML
- `xpath-escape(s)` (text) a quoted XPath literal: `@id = {xpath-escape({$id})}`
- `encode-for-uri(s)` encoded for a URL

**Numbers**

- `random(min, max)` (text) a whole number, both included
- `formatnumber(n)` (text) thousands separated
- `format-digits(n, width)` (text) padded with leading zeros
- `format-bytes(n, decimals)` bytes as KB, MB ...

**Dates (ISO `yyyy-MM-ddTHH:mm:ssZ` unless formatted)**

- `formatdate(date, 'yyyy-MM-dd HH:mm')` (text) formatted; with only the format: now; `'posix'`: seconds
- `parsedate(s, 'format')` (text) a date text read; format optional
- `changedate(date, '+1day-2hours')` (text) moved: seconds ... years
- `comparedate(a, b)` (text) -1, 0 or 1
- `dayspan(a, b)` (text) days between `yyyy-MM-dd` dates
- `validatedate(s, 'format')` (text) plain `true` or `false`
- `localizedate(date)` (text) the user's date and time

**Files and paths**

- `file-exists(path)` (text) `true()` or `false()`
- `folder-exists(path)` (text) `true()` or `false()`
- `filename(path)` (text) the name with extension
- `document(path)` (text) the name without extension
- `folderpath(path, n)` its folder, or `n` levels of it
- `foldername(path, n)` the `n`th folder's name, or the last
- `channelname(path)` (text) the drive (`local`)
- `combine-path(a, b, ...)` joined with `/`
- `absolute-path(path, base)` made absolute
- `datadoc(ref)` its document's address
- `replace-illegal(name)` (text) a valid file name

**Views and applications**

- `is-open(view)` (text) `true()` if open
- `is-running(app)` (text) how many instances run
- `is-main-app()` `true()` if this instance has the main view
- `screen('phone')` (text) `true()` on a phone; also `'tablet'`, `'desktop'`, a media query

**Labels**

- `get-label(KEY, 'dir', 'name:value')` the translation; folder and values optional

- A `true()` or `false()` works as a boolean in a test: `test="{file-exists(local://app/x.xml)}"`.
- `upcase`, `downcase`, `capitalize`, `trim` keep a literal's quotes: `upcase(abc)`, `trim({$s})`. An apostrophe in a (text) function's filled value breaks its arguments.
- A missing function (`sum`, `number`, `round` ...) comes back as its text.
