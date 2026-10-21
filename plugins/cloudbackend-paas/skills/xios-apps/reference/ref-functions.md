# XIOS/3 Functions Reference

## absolute-path

signature: `string = absolute-path('relative path', 'absolute-path')`
Resolves a relative path to a document given an absolute base path.

### Example
```xml
<operation name="open" value="{absolute-path('./view/exampleView.xml', 'tenant://Applications/hello/example.xml')}"/>
```

## apply-locale

signature: `XML node-set = apply-locale('[XML Document]', '[XPath]')`
Applies language localization to an XML document. Optional second param limits localization to a specific node.

### Example
```xml
<alias name="localizedDoc" value="apply-locale(data/text.xml)"/>
<!-- Localize only a specific node -->
<alias name="localizedDoc" value="apply-locale('data/text.xml', '/node[1]/node[3]')"/>
```

## capitalize

signature: `string = capitalize([string])`
Capitalizes the first letter of the passed string.

### Example
```xml
<alias name="newString" value="capitalize(internet rocks)"/>
<!-- Result: "Internet rocks" -->
```

## changedate

signature: `string = changedate('[string]', '[string]')`
Adds or subtracts time from a given date/time. First param is the input date (YYYY-MM-DD or 'now'). Second param format: `[+-]?[0-9]+[smhdMy]` where s=seconds, m=minutes, h=hours, d=days, M=months, y=years.

### Example
```xml
<alias name="inTwoHours" value="{format-date('{changedate('now', '+2h')}', 'yyyy-MM-dd hh:mm')}"/>
<alias name="tomorrow" value="{format-date('{changedate('now', '+1d')}', 'yyyy-MM-dd')}"/>
```

## changes

signature: `integer = changes([string])`
Returns the number of changes made to a document since it was loaded or saved.

### Example
```xml
<alias name="myDataDoc" value="home://Documents/file.xml"/>
<alias name="changesMade" value="changes($myDataDoc)"/>
```

## channelname

signature: `string = channelname([string])`
Returns the name of the communication channel which provides the document.

### Example
```xml
<alias name="mainChannel" value="channelname(home://Documents/Picture/home.png)"/>
<!-- Result: "home" -->
```

## combine-path

signature: `string = combine-path('segment', ...)`
Combines path segments into a single path. No double slashes created (except "database://"). Any ".." segment removes the previous segment, e.g. "/foo/../bar" becomes "/bar".

### Example
```xml
<alias name="path" value="combine-path($folder,$name)"/>
```

## concat

signature: `string = concat([string]...)`
Returns a concatenation of its parameters.

### Example
```xml
<alias name="email" value="concat('lars','@','domain.com')" model="value"/>
```

## contains

signature: `boolean = contains('source-string','search-string')`
Checks if a string contains a specific substring.

### Example
```xml
<alias name="containsEtto" value="contains('Singing in falsetto.', 'etto')"/>

<!-- In a decision -->
<operation name="decision">
  <when test="{contains('{$loginLogo}', 'http')}()">
    ..do some logic..
  </when>
</operation>
```

## count

signature: `integer = count([xpath])`
Returns the number of elements matching the given XPath.

### Example
```xml
<alias name="intItemsInFile" value="count($dataDoc#//item)" model="value"/>
```

## count-selection

signature: `integer = count-selection([xpath])`
Returns the length of a selection.

### Example
```xml
<alias name="itemLength" value="count-selection($dataDoc#//item)" model="value"/>
```

## datatype

signature: `XML = datatype([string])`
Returns the datatype XML of the passed Object.

### Example
```xml
<alias name="datatypedata" value="datatype(home://Documents/Photots/home.png)"/>
```

## document

signature: `string = document([string])`
Returns the name of a document without file extensions or container path.

### Example
```xml
<alias name="documentname" value="document(home://Documents/Italy Vacation.xml)"/>
<!-- Result: "Italy Vacation" -->
```

## downcase

signature: `string = downcase([string])`
Returns the passed string in lowercase.

### Example
```xml
<alias name="newString" value="downcase('HELLO WORLD')"/>
<!-- Result: "hello world" -->
```

## emitter

signature: `string = emitter([event])`
Returns the id of the emitting component for the event. Returns empty string when not given an event.

### Example
```xml
<alias name="evt" value="emitter(!)"/>
<operation name="decision">
  <when test="'{$evt}' = 'btnOK'" step="stepOK"/>
  <when test="'{$evt}' = 'btnCancel'" step="stepCancel"/>
</operation>
```

## escape-string

signature: `string = escape-string([string])`
Escapes strings for inclusion in expressions and JSON literals. Backslash, single quote, and double quote are prefixed with backslash. Newline, carriage return, and tab become `\n`, `\r`, `\t`.

### Example
```xml
<alias name="newString" value="read('store://Documents/escape-string({$untrustedName})')"/>
```

## file-exists

signature: `boolean = file-exists('[string]')`
Returns true or false depending on whether a file (Object) exists at the given path.

### Example
```xml
<alias name="myFile" value="file-exists('home://Documents/fakeFile.xml')"/>
```

## filename

signature: `string = filename([string])`
Returns the file name (including suffix) from a URL.

### Example
```xml
<alias name="filename" value="filename(home://Documents/Photos/home.png)"/>
<!-- Result: "home.png" -->
```

## folder-exists

signature: `boolean = folder-exists([string])`
Returns true or false depending on whether a Container (folder) exists at the given path.

### Example
```xml
<alias name="myFolder" value="folder-exists(home://fakeFolder/)"/>
```

## folderid

signature: `integer = folderid([string])`
Returns the unique database id of a Container (folder) when passed a Container path.

### Example
```xml
<alias name="folderId" value="folderid(home://Documents/)"/>
```

## foldername

signature: `string = foldername('[string|id]', '[int]')`
Returns the name of the Container (folder) containing the document. Optional second param defines the Container depth from root. Omitted returns the immediate container; '2' returns the second-level folder name.

### Example
```xml
<alias name="folderLocation" value="foldername('home://Documents/Pictures/home.png')"/>
<!-- Result: "Pictures" -->
<alias name="folderListing" value="foldername('home://Documents/Pictures/home.png', '2')"/>
<!-- Result: "Pictures" -->
```

## folderpath

signature: `string = folderpath('[document]', '[int]')`
Returns the full Container path of the Object. Optional second param defines depth from root. Supports negative index (-1 = parent, -2 = grandparent). '0' returns channel name (e.g. `home://`).

### Example
```xml
<alias name="DocFolderPath" value="folderpath('home://Documents/Pictures/home.png')"/>
<!-- Result: "home://Documents/Pictures/" -->
<alias name="ParentFolder" value="folderpath('home://Documents/Pictures/home.png','1')"/>
<!-- Result: "home://Documents/" -->
```

## format-bytes

signature: `string = format-bytes(integer)`
Converts bytes into a human-readable size string (KB, MB, GB, TB) automatically selecting the appropriate unit.

### Example
```xml
<alias name="byteSize" value="{$dbObject#db:streams/@first}"/>
<alias name="size" value="format-bytes({$byteSize})"/>
```

## format-date

signature: `string = format-date('[string]', '[string]')`
Formats a date according to a format string. First param is the date (supports 'now', 'tomorrow', 'next Monday', 't + 3 d', natural language dates, ISO dates). Second param is optional format string.

Format tokens: `hh` (12h padded), `h` (12h), `HH` (24h padded), `H` (24h), `mm` (min padded), `m` (min), `ss` (sec padded), `s` (sec), `yyyy` (full year), `yy` (2-digit year), `dddd` (weekday name), `ddd` (weekday abbrev), `dd` (day padded), `d` (day), `MMMM` (month name), `MMM` (month abbrev), `MM` (month padded), `M` (month), `tt` (AM/PM), `t` (A/P), `S` (ordinal suffix). Escape with backslash.

Shorthand single-char formats: `d`=M/d/yyyy, `D`=dddd MMMM dd yyyy, `F`=full datetime, `m`=MMMM dd, `r`=RFC, `s`=sortable, `t`=short time, `T`=long time, `u`=universal, `y`=month year. `posix` returns seconds since epoch.

### Example
```xml
<alias name="time" value="{format('hh:mm')}"/>
<alias name="tomorrow" value="{format-date('tomorrow', 'yy-M-d')}"/>
<alias name="timeVariable" value="{format-date('t + 3 d', 'yy-M-d')}"/>
<alias name="timeVariable" value="{format-date('next Monday', 'yyyy-M-d')}"/>
```

## get-label

signature: `string = get-label([string])`
Returns the localized language version of the passed label. Returns the user's configured language translation, falling back to en_US, then to the input string itself if no translation found. Prefer localization in views; use this in processes only when necessary.

### Example
```xml
<alias name="okText" value="{get-label('open')}"/>

<operation name="confirm">
  <type value="message"/>
  <message>{get-label('Not authorized.')}</message>
  <title>{get-label('Message')}</title>
  <icon>icon://lock</icon>
  <ok/>
</operation>
```

## index-of

signature: `integer = index-of('source-string','search-string')`
Returns the position of the search string within the source string. Returns -1 if not found.

### Example
```xml
<alias name="integerPos" value="index-of('Singing in falsetto.', 'in')"/>
```

## is-alias

signature: `boolean = is-alias([string])`
Checks if an alias has been defined. Returns true() if set, false() if not. **Note:** Write the alias name without the leading `$`.

### Example
```xml
<operation name="decision">
  <when test="{is-alias(username)}" step="continueWithStartUp"/>
  <otherwise step="getUsername"/>
</operation>
```

## is-color

signature: `boolean = is-color([string])`
Returns true() if the supplied parameter is a hex color in the format `#fff`, `#ffffff`, or `#000,#fff` for color ranges. Does not support rgb() colors.

### Example
```xml
<operation name="decision">
  <when test="{is-color({$colorStr})}" step="myStep"/>
</operation>
```

## is-open

signature: `boolean = is-open(name:instance)`
Returns true() or false() depending on whether a view is open. Parameter is the view name with instance number.

### Example
```xml
<alias name="open" value="is-open(DE:1)"/>
<!-- true if Document Explorer instance 1 is open -->
```

## is-running

signature: `integer = is-running(string)`
Returns the number of running instances of an application.

### Example
```xml
<alias name="instances" value="is-running(Document Explorer)"/>
```

## is-text-type

signature: `boolean = is-text-type([string] | [node])`
Returns true() or false() depending on whether a mime-type is text-based. Parameter can be a string mime-type or an XML node with a mime attribute.

### Example
```xml
<alias name="isText" value="is-text-type('text/plain')"/>
<!-- true -->

<!-- With a component node reference -->
<alias name="isText" value="is-text-type(#DE#content#)" />
```

## join

signature: `string = join(nodeset, 'delimiter')`
Concatenates all nodes of a node set using an optional delimiter string.

### Example
```xml
<alias name="views" value="join(#ViewManager#//view/@name,'|')"/>
```

## local-name

signature: `string = local-name(string)`
Returns the name of an attribute or element without the namespace. E.g. `exp:item` returns `item`.

### Example
```xml
<operation name="decision">
  <when test="local-name($documentEntry) = 'title'" step="100"/>
  <otherwise step="200"/>
</operation>
```

## localizedate

signature: `string = localizedate([string])`
Returns the passed system date string localized to the user's settings.

### Example
```xml
<alias name="localDate" value="localizedate(2022-04-09T13:10:54Z)"/>
<!-- Result: "2022-04-09 15:10" (depending on user timezone) -->
```

## match

signature: `string = match('[string]', '[regexp]')`
Returns the first match of a JavaScript regular expression in the string.

### Example
```xml
<alias name="emailDomain" value="match('goran@domain.com', '@[a-zA-Z0-9.-]+\.[a-zA-Z]')"/>
<!-- Result: "@domain.com" -->
```

## parent

signature: `event = parent([component])`
Returns the current data binding or state of the parent component. Only works on components within a container-type component (accordion, boxlist, bush, buttonbox, expander, form, grid, group, html, menu, menubar, panel, slider, tabstrip, toolbar).

Useful for components like image or button inside a container with `select="false()"` that have no data binding of their own.

### Example
```xml
<!-- Parent of the triggering component -->
<alias name="parentDoc" value="parent(!)"/>
<!-- Parent of a named component -->
<alias name="parentDoc" value="parent(#myView#myComp)"/>
```

## parsedate

signature: `string = parsedate('[string]', '[string]')`
Parses a date string and returns it in the requested format. First param is the input date string. Second param (optional) is the format string; defaults to yyyy-MM-ddTHH:mm:ss.

### Example
```xml
<alias name="newDate" value="parsedate(now)"/>
<alias name="newDate" value="parsedate('July 8th, 2025, 10:30 PM')"/>
<!-- Result: "2025-07-08T22:30:00" -->
<alias name="newDate" value="parsedate('10/15/2019', 'M/d/yyyy')"/>
```

## position

signature: `integer = position([xpath])`
Returns the position of the element requested by the XPath parameter.

### Example
```xml
<operation name="decision">
  <when test="position(#view1#listview10) = 5" step="100"/>
  <otherwise step="200"/>
</operation>
```

## random

signature: `integer = random('[int]', '[int]')`
Returns a random number between x and y.

### Example
```xml
<alias name="randomNumber" value="random('1','100')"/>
<operation name="debug" value="I have {random('1','100')} cars!"/>
```

## read

signature: `XML = read('[string]')`
Returns a read-only version of the passed document.

### Example
```xml
<alias name="docReadOnly" value="read('home://Documents/important.xml')"/>
```

## replace

signature: `string = replace('[string]', '[string|RegExp]', '[string]')`
Returns a string with substrings replaced. Uses JavaScript RegExp syntax with the global ("g") flag.

### Example
```xml
<alias name="replacedString" value="replace('version 12.', '[^\d]','')"/>
<!-- Result: "12" -->
```

## screen

signature: `boolean = screen('media-query')`
Evaluates a CSS media query using `window.matchMedia()`. Also supports predefined values: `phone` (max-width: 600px), `tablet` (601px-1024px), `desktop` (min-width: 1025px).

### Example
```xml
<operation name="decision">
  <when test="{screen('(min-width: 480px)')}">
    ..do some logic..
  </when>
</operation>

<!-- Using predefined value -->
<operation name="decision">
  <when test="{screen('phone')}">
    ..do some logic..
  </when>
</operation>
```

## selected-text

signature: `string = selected-text()`
Returns the user-selected text in the currently active view.

### Example
```xml
<alias name="selectedText" value="selected-text()"/>
```

## selection

signature: `string = selection('[object|alias]')`
Returns the XPath selection of the event object or alias. Selection is limited to an attribute or element. Text, comment, or processing instruction nodes resolve to the parent element.

### Example
```xml
<alias name="currentSelection" value="selection(#view1#listview1)"/>
```

## substring

signature: `string = substring('[string]', '[instruction]', '[instruction]'+)`
Returns a substring using instruction-based parameters. Two or more params: first is the source string, the rest are substring instructions.

**Instructions:** `startPos:N`, `endPos:N`, `startString:str`, `endString:str`, `startOffset:N`, `endOffset:N`, `startType:firstIndex|lastIndex`, `endType:firstIndex|lastIndex`, `substringLength:N`.

### Example
```xml
<!-- First 7 characters -->
<alias name="cutString" value="substring('3.1415926536', 'substringLength:7')"/>
<!-- Result: "3.14159" -->

<!-- Position-based extraction -->
<alias name="alphabetExtraction" value="substring('ABCDEFGHIJKL', 'startPos:2', 'endPos:6')"/>
<!-- Result: "CDEFG" -->

<!-- String-based extraction with offsets -->
<alias name="mainNumber" value="substring('198-2681-73', 'startString:-', 'endString:-', 'startOffset:1', 'endOffset:2', 'startType:firstIndex', 'endType:lastIndex')"/>
<!-- Result: "2681-7" -->
```

## substring-after

signature: `string = substring-after('[string]', '[string]')`
Returns the remainder of the string after the first occurrence of the pattern in the second parameter.

### Example
```xml
<!-- Extract file extension -->
<alias name="fileEnding" value="substring-after({$fileName}, '.')"/>

<!-- Extract time from ISO timestamp -->
<alias name="wasTime" value="substring-after({$datetime}, 'T')" model="value"/>
```

## substring-before

signature: `string = substring-before('[string]', '[string]')`
Returns the remainder of the string before the first occurrence of the pattern in the second parameter.

### Example
```xml
<!-- Extract filename without extension -->
<alias name="fileHead" value="substring-before({$fileName}, '.')"/>

<!-- Extract date from ISO timestamp -->
<alias name="wasDate" value="substring-before({$datetime}, 'T')" model="value"/>
```

## text-selection

signature: `string = text-selection('[object|alias]')`
Returns the XPath selection including text, comment, and processing instructions (if the component supports it). If the component supports text node offsets, they are appended as an XPath comment, e.g. `/element[1]/text()[3](:17:)`.

### Example
```xml
<alias name="currentSelection" value="text-selection(#view1#editor)"/>
```

## translate

signature: `string = translate(string, string, string)`
Replaces characters in the first string that match characters in the second string with the corresponding character in the third string. Identical to the XSLT translate function. Cannot replace entire words, only single characters.

### Example
```xml
<!-- Remove all spaces -->
translate(string, ' ', '')

<!-- Replace T and Z in timestamp with spaces -->
translate('2024-09-16T15:23:02Z', 'TZ', '  ')

<!-- Convert 1/0 to true/frue (useful when only checking for 'true') -->
<checkbox checked="{translate(@read, '10', 'tf')}rue"/>
```

## trim

signature: `string = trim([string])`
Removes all leading and trailing whitespace characters (Unicode whitespace including U+0009, U+000A, U+000B, U+000C, U+000D, U+0020, U+00A0, U+1680, U+2000-U+200A, U+2028, U+202F, U+205F, U+2029, U+3000, U+FEFF).

### Example
```xml
<alias name="trimmedString" value="trim( a b )"/>
<!-- Result: "a b" -->
```

## upcase

signature: `string = upcase('[string]')`
Returns the passed string in uppercase.

### Example
```xml
<alias name="newString" value="upcase('hello world')"/>
<!-- Result: "HELLO WORLD" -->
```

## xml

signature: `xml = xml(string|expression)` or `xml = xml('string|expression', 'true|false')`
Converts a string containing XML-like content into XML. The expression loses its dataDoc and XPath selection reference when enclosed in `{ }`. Optional second param 'true' evaluates XIOS/3 expressions inside the loaded XML.

### Example
```xml
<!-- Ensure component returns XML node, not text string -->
{xml($rootNode)}

<!-- Load template with expression evaluation -->
<operation name="create" value="#DemoCompDoc">
  {xml('service/data/templates/launcher.xml', 'true')}
</operation>
```

## xpath-escape

signature: `string = xpath-escape([string])`
Escapes a string for safe use as an XPath literal. Outputs the value wrapped in single quotes, double quotes, or a concat() function depending on the content. Do not add your own quotes around the expression.

**Note:** XIOS/3 automatically handles XPath escaping in operation attributes that expect XPath data. Use this function explicitly only when building XPath expressions outside of those attributes.

### Example
```xml
<xpath>/root/element[@name={$newString}]</xpath>
```
