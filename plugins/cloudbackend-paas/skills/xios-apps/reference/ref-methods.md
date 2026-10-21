# Methods Reference

> **Methods should be a last resort.** Prefer actions over methods when possible -- actions are handled faster by XIOS/3. Never use methods to update or redraw components; use `bind` instead, which automatically handles updates when data changes.

There are two ways to call methods:
1. **callMethod operation** -- `<operation name="callMethod" value="#view#component">...</operation>`
2. **Expression syntax** -- `#view#component.methodName()`

---

## Calendar and Clock Methods

### appointmentColor

Sets an RGB color on an appointment in the Calendar.
Components: Calendar

#### Parameters
- **param1** (string): RGB color value (e.g. `ff0000`)

#### Example
```xml
<operation name="callMethod" value="#view1#calendar1">
  <method name="appointmentColor">
    <param type="string">ff0000</param>
  </method>
</operation>
```

---

### changeInterval

Changes the time interval that an hour is divided into when displayed.
Components: Calendar

#### Parameters
- **param1** (string): interval in minutes

#### Example
```xml
<operation name="callMethod" value="#view1#calendar1">
  <method name="changeInterval">
    <param type="string">5</param>
  </method>
</operation>
```

---

### getDateValue

Returns the date that was clicked in the calendar (Clock component). Value returned as string: `2019-03-05THH:MM:SS+0100`
Components: Clock

#### Example
```xml
<alias name="selection" value="#view1#clock1.getDateValue()"/>
```

---

### getEndDate

Retrieves the endDate key/value from the selected appointment.
Components: Calendar

#### Example
```xml
<alias name="appointmentEndDate" value="{#view#calendar.getEndDate()}"/>
```

---

### getEndTime

Retrieves the endTime key/value from the selected appointment.
Components: Calendar

#### Example
```xml
<alias name="appointmentEndDate" value="{#view#calendar.getEndTime()}"/>
```

---

### getPaste

Retrieves clipboard information from the Calendar component. Used for paste operations involving date/time recalculation.
Components: Calendar

#### Example
```xml
<alias name="NewEndTime" value="{#view#calendar.getPaste('{$startDate} {$startTime}','{$endDate} {$endTime}','{$newStartDate} {$newStartTime}')}"/>
```

---

### getSelection

Retrieves the selection in the calendar component.
Components: Calendar

#### Example
```xml
<alias name="content" value="#view1#calendar1.getSelection()"/>
```

---

### getStartDate

Retrieves the startDate key/value of the selection.
Components: Calendar

#### Example
```xml
<alias name="appointmentStartDate" value="{#view1#calendar1.getStartDate()}"/>
```

---

### getStartTime

Retrieves the startTime key/value of the selection.
Components: Calendar

#### Example
```xml
<alias name="appointmentStartTime" value="{#view1#calendar1.getStartTime()}"/>
```

---

### setRange

Sets the time range of the Calendar component.
Components: Calendar

#### Parameters
- **param1** (string): start time (e.g. `07:00`)
- **param2** (string): end time (e.g. `19:00`)

#### Example
```xml
<operation name="callMethod" value="#view1#calendar1">
  <method name="setRange">
    <param type="string">07:00</param>
    <param type="string">19:00</param>
  </method>
</operation>
```

---

### setSelectedDate

Selects a date in the calendar component, making it visually stand out.
Components: Calendar

#### Parameters
- **param1** (string): date in format `2019-03-05THH:MM:SS+0100`

#### Example
```xml
<operation name="callMethod" value="#view1#calendar1">
  <method name="setSelectedDate">
    <param type="string">2019-03-05THH:MM:SS+0100</param>
  </method>
</operation>
```

---

### setSkin

Sets XSL skin renderers for the Clock component when in calendar mode.
Components: Clock

#### Parameters
- **param1** (string): path to XSL file

#### Example
```xml
<operation name="callMethod" value="#view#clCalendar">
  <method name="setSkin">
    <param type="string">apps/widgets/layout/cal_binder.xsl</param>
  </method>
</operation>
```

---

### setType

Sets the display type of the calendar component.
Components: Calendar

#### Parameters
- **param1** (string): type value (e.g. `7week`)
- **param2** (boolean): flag

#### Example
```xml
<operation name="callMethod" value="#Calendar#Calendar">
  <method name="setType">
    <param type="string">7week</param>
    <param type="boolean">true</param>
  </method>
</operation>
```

---

### setWeekStartDay

Sets the first day of the week for the calendar. Value can be Monday (default) or Sunday.
Components: Calendar

#### Parameters
- **param1** (string): `Monday` or `Sunday`

#### Example
```xml
<operation name="callMethod" value="#view1#calendar1">
  <method name="setWeekStartDay">
    <param type="string">Monday</param>
  </method>
</operation>
```

---

## RichText Methods

### disableAutoSpellcheck

Disables automatic spellchecking in the RichText component.
Components: RichText

#### Example
```xml
<operation name="callMethod" value="#view1#richtext">
    <method name="disableAutoSpellcheck"/>
</operation>
```

---

### enableAutoSpellcheck

Enables automatic spellchecking in the RichText component.
Components: RichText

#### Example
```xml
<operation name="callMethod" value="#view1#richtext">
  <method name="enableAutoSpellcheck"/>
</operation>
```

---

### executeCommand

Passes a command to the RichText component. Available commands: `InsertOrderedList`, `InsertUnorderedList`, `redo`, `selectAll`, `undo`.
Components: RichText

#### Parameters
- **param1** (string): command name

#### Example
```xml
<operation name="callMethod" value="#viewName#rte1">
  <method name="executeCommand">
    <param type="string">insertOrderedList</param>
  </method>
</operation>
```

---

### getLineBottomMargin

Reads the paragraph's bottom margin.
Components: RichText

#### Example
```xml
<alias name="bottomMargin" value="{#view1#richtext1.getLineBottomMargin()}"/>
```

---

### getLineTopMargin

Reads the paragraph's top margin.
Components: RichText

#### Example
```xml
<alias name="topMargin" value="{#view1#richtext1.getLineTopMargin()}"/>
```

---

### getSelectedText

Retrieves the selected text in the RichText component.
Components: RichText

#### Example
```xml
<alias name="selectedText" value="#view1#richtext1.getSelectedText()"/>
```

---

### insertHyperlink

Inserts a hyperlink (`home://` or `https://`) into a RichText component. Both parameters are required.
Components: RichText

#### Parameters
- **param1** (string): display name of the link
- **param2** (string): actual URL

#### Example
```xml
<operation name="callMethod" value="#Write#richtextWrite">
  <method name="insertHyperlink">
    <param type="string">www.corren.se</param>
    <param type="string">https://www.corren.se</param>
  </method>
</operation>
```

---

### insertImage

Inserts an image into the RichText component. The image HTTP URL is provided as a parameter.
Components: RichText

#### Parameters
- **param1** (string): image URL

#### Example
```xml
<operation name="callMethod" value="#view1#richtext1">
  <method name="insertImage">
    <param type="string">icon://table</param>
  </method>
</operation>
```

---

### insertText

Inserts text into the RichText component.
Components: RichText

#### Parameters
- **param1** (string): text to insert

#### Example
```xml
<operation name="callMethod" value="#view1#richtext1">
  <method name="insertText">
    <param type="string">Here is the text</param>
  </method>
</operation>
```

---

### modStyle

Inserts CSS styles into the RichText component. First param is style name, second is value.
Available style names: `fontFamily`, `fontWeight`, `fontStyle`, `fontSize`, `textAlign`.
Components: RichText

#### Parameters
- **param1** (string): style property name
- **param2** (string): style value

#### Example
```xml
<operation name="callMethod" value="#view1#richText1">
  <method name="modStyle">
    <param type="string">fontWeight</param>
    <param type="string">normal</param>
  </method>
</operation>
```

---

### removeList

Removes a selected list in the RichText component.
Components: RichText

#### Example
```xml
<operation name="callMethod" value="#view1#richtext">
  <method name="removeList"/>
</operation>
```

---

### setLineMargin

Changes the line height (margins) in a RichText component. First param is top margin, second is bottom margin.
Components: RichText

#### Parameters
- **param1** (string): top margin
- **param2** (string): bottom margin

#### Example
```xml
<operation name="callMethod" value="#view1#component1">
  <method name="setLineMargin">
    <param type="string">0</param>
    <param type="string">0</param>
  </method>
</operation>
```

---

### setLineIndent

Sets indentation in pixels in a RichText component. First param is left indent, second is right indent. If no text is selected, indentation applies to the entire component.
Components: RichText

#### Parameters
- **param1** (string): left indentation (px)
- **param2** (string): right indentation (px)

#### Example
```xml
<operation name="callMethod" value="#view1#component1">
  <method name="setLineIndent">
    <param type="string">10</param>
    <param type="string">0</param>
  </method>
</operation>
```

---

## View Methods

### attach

Attaches views to each other. The target view must still be opened using the `open` operation.
Components: View

#### Parameters
- **param1** (string): view to attach (e.g. `#View1`)
- **param2** (string): position -- `top`, `bottom`, `right`, or `left`
- **param3** (string): offset values as `topOffset,leftOffset,stretchOffset`

#### Example
```xml
<operation name="callMethod" value="#view1">
  <method name="attach">
    <param type="string">#View1</param>
    <param type="string">bottom</param>
    <param type="string">50,0,0</param>
  </method>
</operation>
```

---

### detach

Detaches views from each other.
Components: View

#### Parameters
- **param1** (string): view to detach (e.g. `#two`)

#### Example
```xml
<operation name="callMethod" value="#one">
  <method name="detach">
    <param type="string">#two</param>
  </method>
</operation>
```

---

### focus

Sets focus on a window/view.
Components: View

#### Parameters
- **param1** (boolean): focus state

#### Example
```xml
<operation name="callMethod" value="#view1">
  <method name="focus">
    <param type="boolean">true</param>
  </method>
</operation>
```

---

### getDimension

Fetches the height and width of a view window. Returns an object with `.height` and `.width` properties.
Components: View

#### Example
```xml
<alias name="myView" value="#view1"/>
<alias name="myViewHeight" value="$myView.getDimension().height"/>
<alias name="myViewWidth" value="$myView.getDimension().width"/>
```

---

### maximize

Maximizes a view window.
Components: View

#### Example
```xml
<operation name="callMethod" value="#{!#@name}">
  <method name="maximize"/>
</operation>
```

---

### minimize

Minimizes a view window.
Components: View

#### Example
```xml
<operation name="callMethod" value="#{!#@name}">
  <method name="minimize"/>
</operation>
```

---

### restore

Restores a view (application) window to the desktop.
Components: View

#### Example
```xml
<operation name="callMethod" value="#view1">
  <method name="restore"/>
</operation>
```

---

### restoreAppDlg

Restores the application window from the application toolbar to the desktop.
Components: View

#### Example
```xml
<operation name="callMethod" value="#{!#@name}">
  <method name="restoreAppDlg"/>
</operation>
```

---

### setDimension

Changes the width and height of a view.
Components: View

#### Parameters
- **param1** (integer): width
- **param2** (integer): height

#### Example
```xml
<operation name="callMethod" value="#view1">
  <method name="setDimension">
    <param type="integer">100</param>
    <param type="integer">200</param>
  </method>
</operation>
```

---

### setImage

Sets a background image on a view.
Components: View

#### Parameters
- **param1** (string): URL to the image

#### Example
```xml
<operation name="callMethod" value="#view1">
  <method name="setImage">
    <param type="string">{#viewName#inputComponent}</param>
  </method>
</operation>
```

---

## General Methods

### activate

Sets focus to a component.
Components: Input, ListView, RichText, TextArea

#### Example
```xml
<operation name="callMethod" value="#view1#component1">
  <method name="activate"/>
</operation>
```

---

### clear

Clears the contents of the component.
Components: ComboBox, TextArea, Input, RichText, Shell

#### Example
```xml
<operation name="callMethod" value="#view1#widgetpane1">
  <method name="clear"/>
</operation>
```

---

### clearContent

Clears the contents of the Container component.
Components: Container

#### Example
```xml
<operation name="callMethod" value="#view1#container1">
  <method name="clearContent"/>
</operation>
```

---

### copyToClipboard

Copies XML data to the clipboard, similar to Ctrl+C.
Components: All components

#### Parameters
- **param1** (string): component name

#### Example
```xml
<operation name="callMethod" value="#view">
  <method name="copyToClipboard">
    <param type="string">Component1</param>
  </method>
</operation>
```

---

### deselect

Deselects the selected row inside a component.
Components: Grid

#### Example
```xml
<operation name="callMethod" value="#view1#widgetpane1">
  <method name="deselect"/>
</operation>
```

---

### edit

Renames a document inside a component (e.g. an item in the ListView).
Components: ListView, Tree

#### Example
```xml
<operation name="callMethod" value="#view1#listView1">
  <method name="edit"/>
</operation>
```

---

### execCommand

Performs a command on a component. Available commands: `cut`, `paste`, `copy`, `undo`, `redo`, `selectAll`.
Components: TextArea, Input, RichText

#### Parameters
- **param1** (string): command name

#### Example
```xml
<operation name="callMethod" value="#view1#textarea1">
  <method name="execCommand">
    <param type="string">cut</param>
  </method>
</operation>
```

---

### flashTab

Creates a flashing appearance on a tab by switching its visual mode. Default flash length is 2000ms, default flash delay is 200ms.
Components: TabStrip

#### Parameters
- **param1** (string): name of the tab (panel component) -- required
- **param2** (string): flash duration in ms -- optional
- **param3** (string): flash speed in ms -- optional

#### Example
```xml
<operation name="callMethod" value="#view1#tabstrip1">
  <method name="flashTab">
    <param type="string">examplepanel2</param>
    <param type="string">3000</param>
    <param type="string">100</param>
  </method>
</operation>
```

---

### focusItem

Focuses the selection on an item in the ListView.
Components: ListView

#### Parameters
- **param1** (string): XPath or identifier of the item
- **param2** (boolean): flag

#### Example
```xml
<operation name="callMethod" value="#view1#listview1">
  <method name="focusItem">
    <param type="string">{$dataDoc/settings/subscriptions/apprefs/appref[@id='']}</param>
    <param type="boolean">true</param>
  </method>
</operation>
```

---

### focusSelection

Sets focus on a single selection inside the component.
Components: ListView

#### Parameters
- **param1** (string): XPath to the selection

#### Example
```xml
<operation name="callMethod" value="#view1#listview1">
  <method name="focusSelection">
    <param type="string">/settings/applicationlist/application[3]</param>
  </method>
</operation>
```

---

### getCurrentLabel

Retrieves the label of the selected node in the Tree component.
Components: Tree

#### Example
```xml
<alias name="labelOfSelection" value="{#view1#tree1.getCurrentLabel()}"/>
```

---

### getDataLocation

Returns the data that is selected in the component.
Components: Tree, IconList, ListView

#### Example
```xml
<alias name="selection" value="#view1#tree1.getDataLocation()"/>
```

---

### getLat

Retrieves the latitude value from the selected coordinate.
Components: Map

#### Example
```xml
<alias name="markerLat" value="{#view#map.getLat()}"/>
```

---

### getLng

Retrieves the longitude value from the selected coordinate.
Components: Map

#### Example
```xml
<alias name="markerLng" value="{#view#map.getLng()}"/>
```

---

### getMapType

Retrieves the map type currently used in the component.
Components: Map

#### Example
```xml
<alias name="mapType" value="{#view1#map.getMapType()}"/>
```

---

### getZoom

Retrieves the zoom level currently used in the component.
Components: Map

#### Example
```xml
<alias name="mapType" value="{#view1#map.getZoom()}"/>
```

---

### getNodePath

Retrieves the full node path of the selection in the Tree component.
Components: Tree

#### Example
```xml
<alias name="fullPath" value="{#view1#tree1.getNodePath()}"/>
```

---

### getParam

Retrieves the value of a named parameter. In XSLT, use `lv:getParam` to receive it.
Components: ListView

#### Example
```xml
<alias name="lengthOfContent" value="#view1#listview1.getParam('keyword')"/>
```

---

### getSelected

Retrieves the XML data bound to the selected component rendered by a Container.
Components: Container

#### Example
```xml
<alias name="content" value="#view1#container1.getSelected()"/>
```

---

### getSelectedItem

Retrieves the selected item in a ListView.
Components: ListView

#### Example
```xml
<alias name="content" value="#viewName#componentName.getSelectedItem()"/>
```

---

### getSelectionLength

Retrieves the length of the content in the component.
Components: TextArea

#### Example
```xml
<alias name="lengthOfContent" value="#view1#textarea1.getSelectionLength()"/>
```

---

### getSelectionValue

Retrieves the selected value of the content in the component.
Components: TextArea

#### Example
```xml
<alias name="ValueOfTextarea" value="#view1#textarea1.getSelectionValue()"/>
```

---

### getSrcDataLocation

Retrieves the document bound to the component, when regular expressions might return xlinked documents.
Components: Tree

#### Example
```xml
<alias name="dataSrc" value="#view1#tree1.getSrcDataLocation()"/>
```

---

### getText

Retrieves the content of the text() node.
Components: Plate

#### Example
```xml
<alias name="myTextValue" value="{#view1#plate2.getText()}"/>
```

---

### getValue

Retrieves the value of the content in the component.
Components: Accordion, Button, ButtonBox, CheckBox, Clock, Color, ComboBox, Date, Grid, Group, Image, Input, ListView, Menu Item, Panel, Plate, Radio, RichText, Slider, TextArea, Toggle

#### Example
```xml
<alias name="ValueOfTextarea" value="#view1#textarea1.getValue()"/>
```

---

### gotoLine

Selects the defined line in the CodeEditor component.
Components: CodeEditor

#### Parameters
- **param1**: line number

#### Example
```xml
<operation name="callMethod" value="#view1#CodeEditor1">
  <method name="gotoLine">
    <param>12</param>
  </method>
</operation>
```

---

### hideColumn

Hides a visible column in a grid.
Components: Grid

#### Parameters
- **param1** (string): name of the column to hide

#### Example
```xml
<operation name="callMethod" value="#view1#grid1">
  <method name="hideColumn">
    <param type="string">grid1Firstname</param>
  </method>
</operation>
```

---

### haveSelection

Checks if a ListView has a selection. Returns `true` or `false` as a string.
Components: ListView

#### Example
```xml
<alias name="ListViewSelection" value="{#view1#listview1.haveSelection()}"/>
```

---

### navigateUp

Navigates to the parent of the current selection in the Tree component.
Components: Tree

#### Example
```xml
<operation name="callMethod" value="#view1#Tree1">
  <method name="navigateUp"/>
</operation>
```

---

### nodeExpanded

Determines if the selected node is expanded or not. Returns `true` or `false`.
Components: Tree

#### Example
```xml
<operation name="decision">
  <when test="'{#view1#Tree1.nodeExpanded()}'='true'" step="20"/>
  <otherwise step="21"/>
</operation>
```

---

### pasteFromClipboard

Pastes XML data from the clipboard, similar to Ctrl+V.
Components: All components

#### Parameters
- **param1** (string): component name

#### Example
```xml
<operation name="callMethod" value="#view">
  <method name="pasteFromClipboard">
    <param type="string">Component1</param>
  </method>
</operation>
```

---

### print

Prints out a document.
Components: RichText, Shell

#### Example
```xml
<operation name="callMethod" value="#view1#editor1">
  <method name="print"/>
</operation>
```

---

### pause

Pauses the media playing in the component. Does nothing if no media is currently playing.
Components: Video

#### Example
```xml
<operation name="callMethod" value="#view1#video">
  <method name="pause"/>
</operation>
```

---

### play

Starts playing the currently selected media. Does nothing if media is already playing.
Components: Video

#### Example
```xml
<operation name="callMethod" value="#view1#video">
  <method name="play"/>
</operation>
```

---

### printPresentation

Prints an Editor component document.
Components: (Editor)

#### Example
```xml
<operation name="callMethod" value="#view1#editor1">
  <method name="printPresentation" />
</operation>
```

---

### release

Simulates the release command on components.
Components: ButtonBox

#### Example
```xml
<operation name="callMethod" value="#view1#button1">
  <method name="release"/>
</operation>
```

---

### releaseEnter

Simulates the release of the Enter key.
Components: TextArea

#### Example
```xml
<operation name="callMethod" value="#view1#component1">
  <method name="releaseEnter"/>
</operation>
```

---

### resetSelection

Resets the selection in a component.
Components: List, ListView

#### Example
```xml
<operation name="callMethod" value="#viewName#componentName">
  <method name="resetSelection"/>
</operation>
```

---

### search

Searches within a document in the CodeEditor.
Components: CodeEditor

#### Parameters
- **param1** (string): search term
- **param2** (integer): direction (`0` or `-1`)
- **param3** (boolean): match whole word (`1` or `0`)
- **param4** (boolean): match case (`1` or `0`)

#### Example
```xml
<operation name="callMethod" value="#view1#XMLEditor1">
  <method name="search">
    <param type="string">XIOS</param>
    <param type="Integer">0</param>
    <param type="Boolean">1</param>
    <param type="Boolean">0</param>
  </method>
</operation>
```

---

### searchMap

Searches for a location in a map.
Components: Map

#### Parameters
- **param1** (string): search query

#### Example
```xml
<operation name="callMethod" value="#view1#map">
  <method name="searchMap">
    <param type="string">{#view1#searchField}</param>
  </method>
</operation>
```

---

### selectAll

Selects all rows in a grid.
Components: Grid

#### Parameters
- **param1** (string): `true` to select all

#### Example
```xml
<operation name="callMethod" value="#view1#grid1">
  <method name="selectAll">
    <param type="string">true</param>
  </method>
</operation>
```

---

### selectFirstRow

Sets selection to the first item in the grid.
Components: Grid

#### Example
```xml
<operation name="callMethod" value="#view1#grid1">
  <method name="selectFirstRow"/>
</operation>
```

---

### selectLastRow

Sets selection to the last item in the grid.
Components: Grid

#### Example
```xml
<operation name="callMethod" value="#view1#grid1">
  <method name="selectLastRow"/>
</operation>
```

---

### selectTab

Sets which tab is shown in the TabStrip from the process language.
Components: TabStrip

#### Parameters
- **param1** (string): name of the tab (panel)

#### Example
```xml
<operation name="callMethod" value="#view1#tabStrip1">
  <method name="selectTab">
    <param type="string">tabClients</param>
  </method>
</operation>
```

---

### setEditableMode

Enables or disables editing of the component.
Components: RichText

#### Parameters
- **param1** (boolean): `true` (editable) or `false` (not editable)

#### Example
```xml
<operation name="callMethod" value="#view1#xmleditor1">
  <method name="setEditableMode">
    <param type="boolean">true</param>
  </method>
</operation>
```

---

### setFont

Sets a new font on the component. Three parameters: font-family, font-style, font-size.
Components: TextArea

#### Parameters
- **param1** (string): font family
- **param2** (string): font style
- **param3** (string): font size

#### Example
```xml
<operation name="callMethod" value="#view1#Shell1">
  <method name="setFont">
    <param type="string">Lucida Console</param>
    <param type="string">normal</param>
    <param type="string">12pt</param>
  </method>
</operation>
```

---

### setIcon

Sets a new icon for a view window or menu item. Optional second parameter for image scaling (`scale` or empty).
Components: ButtonBox, Menu Item, View

#### Parameters
- **param1** (string): URL to the icon
- **param2** (string): scaling mode (`scale` or empty) -- only for Views

#### Example
```xml
<operation name="callMethod" value="#view1">
  <method name="setIcon">
    <param type="string">icon://add</param>
    <param type="string">scale</param>
  </method>
</operation>
```

---

### setLabel

Changes the label set for input fields.
Components: Input

#### Parameters
- **param1** (string): new label text

#### Example
```xml
<operation name="callMethod" value="#view1#input2">
  <method name="setLabel">
    <param type="string">New Label</param>
  </method>
</operation>
```

---

### setParam

Sends a parameter to the XSLT used by the component. In XSLT, use `lv:getParam` to receive it.
Components: ListView, Render

#### Parameters
- **param1** (string): parameter name
- **param2** (string): parameter value

#### Example
```xml
<operation name="callMethod" value="#viewName#componentName">
  <method name="setParam">
    <param type="string">company</param>
    <param type="string">XIOS/3</param>
  </method>
</operation>
```

---

### setSelect

Selects a component with the option to decide whether it fires a Select event.
Components: Menu Item

#### Parameters
- **param1** (string): `true` or `false`

#### Example
```xml
<operation name="callMethod" value="#view1#menuItem2">
  <method name="setSelect">
    <param type="string">false</param>
  </method>
</operation>
```

---

### setSelectionEx

Sets the selection expression in the Tree component.
Components: Tree

#### Parameters
- **param1** (string): XPath expression

#### Example
```xml
<operation name="callMethod" value="#view1#Tree1">
  <method name="setSelectionEx">
    <param type="string">/item[1]/p[2]</param>
  </method>
</operation>
```

---

### setSelectionRoot

Sets selection to the root in the Tree component.
Components: Tree

#### Parameters
- **param1** (string): root XPath

#### Example
```xml
<operation name="callMethod" value="#view1#Tree1">
  <method name="setSelectionRoot">
    <param type="string">/db:result[1]</param>
  </method>
</operation>
```

---

### setTitle

Sets a title and/or subtitle on a View or Panel. The `-` delimiter between title and subtitle is added automatically for views. You can send only a second parameter to update just the subtitle.
Components: Panel, View

#### Parameters
- **param1** (string): title text
- **param2** (string): subtitle text (View only)

#### Example
```xml
<operation name="callMethod" value="#view1">
  <method name="setTitle">
    <param type="string">Application Name</param>
    <param type="string">Subtitle Text</param>
  </method>
</operation>
```

---

### setValue

Sets a value on a component. For media components, sets the playback position in seconds.
Components: Accordion, Button, Color, ComboBox, Group, Image, Input, Label, List, Menu, Radio, Slider

#### Parameters
- **param1** (string): value to set
- **param2** (boolean): optional flag

#### Example
```xml
<operation name="callMethod" value="#viewName#componentName">
  <method name="setValue">
    <param type="string">tasks</param>
    <param type="boolean">true</param>
  </method>
</operation>
```

---

### setView

Changes the XSLT document in render components while keeping the bound data. The replacement is done by Object name (excluding the datatype suffix), and both should be in the same Container.
Components: ListView, Render

#### Parameters
- **param1** (string): name of the new view object
- **param2** (boolean): flag

#### Example
```xml
<operation name="callMethod" value="#view1#listview1">
  <method name="setView">
    <param type="string">documents_list</param>
    <param type="boolean">true</param>
  </method>
</operation>
```

---

### showColumn

Shows a hidden column in a grid.
Components: Grid

#### Parameters
- **param1** (string): name of the column to show

#### Example
```xml
<operation name="callMethod" value="#view1#grid1">
  <method name="showColumn">
    <param type="string">grid1Firstname</param>
  </method>
</operation>
```

---

### sortColumn

Defines how a grid should be sorted.
Components: Grid

#### Parameters
- **param1** (string): column name
- **param2** (string): `ascending` or `descending`

#### Example
```xml
<operation name="callMethod" value="#view1#grid1">
  <method name="sortColumn">
    <param type="string">grid1Firstname</param>
    <param type="string">ascending</param>
  </method>
</operation>
```

---

### takeEnter

Simulates the press of the Enter key. Makes it possible to have focus on several components.
Components: TextArea

#### Parameters
- **param1** (string): component reference

#### Example
```xml
<operation name="callMethod" value="$appComp">
  <method name="takeEnter">
    <param type="string">#FR#findNext</param>
  </method>
</operation>
```

---

### toggleCheckable

Toggles the checkable mode of a Menu Item to `true` or `false`. Simulates a selection on the component.
Components: Menu Item

#### Parameters
- **param1** (boolean): `true` or `false`

#### Example
```xml
<operation name="callMethod" value="#view1#mItemComments">
  <method name="toggleCheckable">
    <param type="boolean">true</param>
  </method>
</operation>
```

---

### toggleNode

Toggles a node (expand/collapse) in the Tree component.
Components: Tree

#### Example
```xml
<operation name="callMethod" value="#view1#Tree1">
  <method name="toggleNode"/>
</operation>
```

---

### update

Updates the data bound to a component. For panels, can update the panel title.
Components: Grid, ListView, Panel

#### Example
```xml
<operation name="callMethod" value="#viewName#Component">
  <method name="update"/>
</operation>
```

---

### updateData

Makes an update to the data document bound to the component.
Components: CodeEditor

#### Parameters
- **param1**: flag (e.g. `true`)

#### Example
```xml
<operation name="callMethod" value="#view1#CodeEditor1">
  <method name="updateData">
    <param>true</param>
  </method>
</operation>
```

---

### updateRedraw

Redraws the component, applying new data or parameters that may have been passed to it.
Components: ListView, Render

#### Example
```xml
<operation name="callMethod" value="#viewName#componentName">
  <method name="updateRedraw"/>
</operation>
```

---

### wordWrap

Defines the type of word-wrap. Options: `hard`, `soft`, or `off`.
Components: RichText, TextArea

#### Parameters
- **param1** (string): wrap mode (`hard`, `soft`, `off`)

#### Example
```xml
<operation name="callMethod" value="#view1#XMLEditor1">
  <method name="wordWrap">
    <param type="string">hard</param>
  </method>
</operation>
```
