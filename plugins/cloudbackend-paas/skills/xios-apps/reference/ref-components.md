# XIOS/3 Component Reference

## Accordion
Vertical sliding panels. Each Panel has a clickable header; uses mutex behavior. Requires 2+ panels.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px, %, fill, auto |
| width | measure | px, %, fill, auto |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| look | enumeration | aqua, graphite | |
| style | string | CSS | |
| title | string | tooltip | |
| value | string | name of preselected panel | |

**Child Elements:** Panel

**Actions:** hide, show

**Events:** Hide, Init, Select, Show

**Methods:** getValue, setValue

```xml
<accordion name="accordion1" width="150" height="fill">
  <panel name="panel1" type="flow" look="white" selected="true" title="Panel 1" padding="5" icon="icon://brush">
    <label name="lBrushes" text="Brushes"/>
  </panel>
  <panel name="panel2" type="flow" look="white" title="Panel 2" padding="5" icon="icon://painters_palette">
    <button name="bOK" text="OK"/>
  </panel>
</accordion>
```

---

## App
Runs an application as a component within another application.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| href | string | URL to application |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| name | string | unique name | |
| height | measure | px, % | |
| style | string | CSS | |
| width | measure | px, % | |

**Actions:** hide, show

**Events:** Reloading, Hide, Show

**Methods:** runStep

```xml
<panel type="rows" gap="4">
  <label text="This is a wrapper"/>
  <app href="xios://apps/shell/shell.xml"/>
</panel>
```

---

## Breadcrumbs
Clickable path into a structure. Data-driven; uses rules to display ancestor nodes.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| height | measure | px, % | 100% |
| width | measure | px, % | 25 |
| max-chars | integer | positive integer | |
| style | string | CSS | |
| default | string | fallback text | |

**Child Elements: rule**
| Attribute | Type | Required |
|---|---|---|
| display | string (XPath) | yes |
| match | string (XPath) | yes |

```xml
<breadcrumbs name="breadcrumbs" height="20" width="100%" max-chars="15" default="Databases">
  <rule match="db:container" display="{@name}"/>
  <rule match="db:database[not(@hidden = 'true')]" display="{@friendly}"/>
</breadcrumbs>
```

---

## Bush
Lazy-loading tree for large datasets (e.g. database navigators). Expands branches on click by following xlinks. For smaller datasets, use Tree instead.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px |
| width | measure | px |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| bgcolor | color | #rrggbb, transparent | |
| class | string | CSS class | |
| focusnew | boolean | true, false | true |
| hover | boolean | true, false | true |
| layout | string | graphite, graphiteIcon, default, defaultIcon | default |
| look | string | marble, glass, graphite | marble |
| multiple | boolean | true, false | false |
| sort | string | ascending, descending, none | none |
| sortproperty | string | sort key | display |
| style | string | CSS | |
| wait | string | loading label | |

**Child Elements: rule > item**

rule attributes:
| Attribute | Type | Required |
|---|---|---|
| match | string (XPath) | yes |

item attributes:
| Attribute | Type | Required |
|---|---|---|
| display | string (XPath) | yes |
| icon | string (URL) | yes |

item optional: class, open (boolean, default true), renamepath (XPath), style

**Actions:** enable, disable, hide, select, show

**Events:** ContextMenu, Disable, Enable, Hide, Hover, Release, Select, Show

```xml
<bush name="myBush" width="100%" height="100%" look="marble">
  <rule match="components">
    <item display="Component List" icon="icon://pieces"/>
  </rule>
  <rule match="component">
    <item display="{@name}" icon="icon://piece"/>
  </rule>
</bush>
```

---

## Button
Clickable button with text label. Fires Select event on click.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| height | measure | px, % |
| text | string | button label |
| width | measure | px, % |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| default | boolean | true, false | false |
| enabled | boolean | true, false | true |
| hide | boolean | true, false | false |
| icon | string | URL | |
| icon-align | enumeration | left, right | left |
| look | enumeration | alert, classic, fabric, glass, graphite, marble | |
| name | string | unique name | |
| style | string | CSS | |
| title | string | tooltip | |
| upload | boolean | true, false | false |

**Actions:** enable, disable, hide, select, show

**Events:** Disable, Enable, Hide, Select, Show

**Methods:** getValue, setValue

**Notes:** `default="true"` makes button trigger on Enter press. Max one per view. `upload="true"` opens file upload dialog on click.

```xml
<panel type="rows" padding="5">
  <button name="Btn1" text="Alert" height="30" width="90" look="alert" title="Button Title"/>
  <button name="Btn2" text="Marble" height="30" width="90" look="marble"/>
</panel>
```

---

## ButtonBox
Button-like box for toolbars and menus. Supports toggle/switch/mutex modes, icons, submenu opening.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px |
| icon | string | URL |
| text | string | display text |
| width | measure | px |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| disabled-icon | string | URL | |
| duration | measure | milliseconds | |
| enabled | boolean | true, false | true |
| hide | boolean | true, false | false |
| hover | string | URL (hover icon) | |
| icon2 | string | URL (animation icon) | |
| iconsize | integer | icon size | 24 |
| mode | enumeration | default, switch, toggle | default |
| repeat | integer | animation repeats | |
| selected | boolean | true, false | false |
| style | string | CSS | |
| submenu | string | menu component name | |
| textposition | enumeration | default, ontop | default |
| title | string | tooltip | |
| value | string | trigger value | |

**Notes:** `mode="toggle"` stays pressed after click. `mode="switch"` is toggle without mutex. Place in Group with `mode="mutex"` for radio-like behavior. Text only shows inside toolbar or menu.

**Actions:** enable, disable, hide, select, show

**Events:** ContextMenu, Disable, Enable, Hide, Hover, Release, Select, Show

**Methods:** getValue, release, setIcon

```xml
<toolbar name="fileToolbar" position="top">
  <group name="fileGroup">
    <buttonbox name="bbNew" width="100" height="50" icon="icon://document_new" text="New"/>
    <buttonbox name="bbEdit" width="100" height="50" icon="icon://edit" text="Edit" mode="toggle"/>
  </group>
</toolbar>
```

---

## Calendar
Interactive calendar for displaying appointment data. Navigable by week or month.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | %, px |
| width | measure | %, px |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| endTime | integer | 0-24 | |
| intervals | integer | 1-60 | |
| shared | boolean | true, false | false |
| startTime | integer | 0-24 | |
| storeformat | enumeration | YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY | |
| style | string | CSS | |
| type | enumeration | 5week, 7week, day, today, month | 5week |
| shorthand | boolean | true, false | true |

**Notes:** Must be bound to data (even if empty). Date format: YYYY-MM-DD. Full timestamp: YYYY-MM-DDThh:mm:ss(Z/+/-)hh:mm. `shared="true"` shares with system calendar. F2 on selected event opens inline editor.

**Actions:** enable, disable

**Events:** ContextMenu, DateChanged, Disable, DoubleClick, Drop, Enable, Enter, Menu, Release, Select, SelectedDate, SelectedMore, SubjectMore

**Methods:** appointmentColor, changeInterval, getEndDate, getEndTime, getPaste, getSelection, getStartDate, getStartTime, setRange, setType, setWeekStartDay

```xml
<calendar name="Calendar" type="5week" width="100%" height="100%" startTime="06" endTime="20"/>
```

---

## CheckBox
Binary toggle that changes state on click. Supports pre-text/post-text labels.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| checked | boolean | true, false | false |
| class | string | CSS class | |
| default | string | false, off, 0 | false |
| enabled | boolean | true, false | true |
| hide | boolean | true, false | false |
| look | enumeration | aqua, classic, marble, fabric, glass, graphite | marble |
| post-text | string | label after checkbox | |
| pre-text | string | label before checkbox | |
| selected | boolean | true, false | false |
| style | string | CSS | |
| title | string | tooltip | |

**Notes:** `default` sets the value pair: false/true, off/on, or 0/1. Expression returns true/false. Use setValue method to change state programmatically.

**Actions:** disable, enable, hide, show

**Events:** Disable, Enable, Hide, Release, Select, Show

**Methods:** getValue, setValue

```xml
<panel type="rows" gap="10" padding="5">
  <checkbox name="post-text" post-text="Checkbox with post-text" selected="true"/>
  <checkbox name="pre-text" pre-text="Checkbox with pre-text"/>
</panel>
```

---

## Clock
Displays analog or digital clock. Can also render as monthly calendar with optional name days.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| calendar | boolean | true, false | false |
| calendars | integer | 0-12 | |
| class | string | CSS class | |
| date | boolean | true, false | false |
| height | measure | px, %, auto | |
| href | string | URL (custom XSLT renderer) | |
| mode | enumeration | digital, analog | digital |
| namesday | boolean | true, false | false |
| selectdate | boolean | true, false | false |
| shared | boolean | true, false | false |
| style | string | CSS | |
| summer | boolean | true, false | false |
| title | string | tooltip | |
| width | measure | px, %, auto, fill | |
| xyscale | integer | percent value | |

**Child Elements: style** (required for analog mode)

style optional attributes: class, hour (#rrggbb), href (clock face image), length (px), min (#rrggbb), sec (#rrggbb), style, weight (px)

**Actions:** hide, show

**Events:** Hide, Select, Show

**Methods:** getDateValue, getValue, setSkin

```xml
<clock name="clockAnalog" mode="analog" height="135" width="135">
  <style href="xios/ui/Clock/ClockAqua1.png" length="2" weight="2pt" hour="#000" min="#000" sec="#000"/>
</clock>
```

---

## CodeEditor
Specialized XML editor with syntax highlighting, real-time validation, and find/replace.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| mode | xml | xml |
| highlight | boolean | true, false |
| update-enabled | boolean | true, false |
| height | measure | px, % |
| width | measure | px, % |

```xml
<codeeditor name="codeeditor" mode="xml" highlight="true" update-enabled="true" height="100%" width="100%"/>
```

---

## Color
Visual color picker with optional hex input field.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| color | color | #rrggbb | |
| editable | boolean | true, false | true |
| enabled | boolean | true, false | true |
| hide | boolean | true, false | false |
| height | measure | px, % | |
| icon | string | URL | |
| input | boolean | true, false | false |
| look | enumeration | aqua, classic, marble, fabric, glass, graphite, grid | marble |
| style | string | CSS | |
| title | string | tooltip | |
| transparent | boolean | true, false | true |
| value | color | #rrggbb | |
| width | measure | px, % | |

**Actions:** disable, enable, hide, show

**Events:** Disable, Enable, Enter, Hide, Select, Show

**Methods:** getValue, setValue

```xml
<color name="colorName" color="#66cc66" icon="icon://paint_brush" input="true"/>
```

---

## ComboBox
Dropdown selector (like HTML select). Can be static items or data-driven with rules/plate.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| width | measure | px, %, auto, fill (min 25px) |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| editable | boolean | true, false | false |
| hide | boolean | true, false | false |
| look | enumeration | aqua, classic, marble, fabric, glass, graphite, grid | marble |
| placeholder | string | pretext | |
| placeholder-value | string | default value if none chosen | |
| style | string | CSS | |
| subplate | string | external plate name | |
| title | string | tooltip | |
| usethumbnail | boolean | true, false | true |

**Child Elements:** Plate

**Notes:** `editable="true"` allows typed input. `subplate` references an external Plate component for sharing. Keyboard: arrows navigate, Enter selects, Escape closes.

**Actions:** enable, disable, hide, show

**Events:** Change, Disable, Enable, Focus, Hide, Select, Show

**Methods:** clear, getValue, setValue

```xml
<combobox name="cbExample" width="200" editable="false">
  <plate name="myPlate" height="200">
    <item>Combo Box</item>
    <item selected="true">Combination Box</item>
    <item>DropdownBox</item>
  </plate>
</combobox>
```

---

## Container
Repeating list builder using UI components as templates. Matches XML nodes via rules, creating a list item per match. Auto-updates when bound data changes.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| height | measure | px, %, auto | |
| scroll | enumeration | auto, scroll, visible, false | auto |
| show | enumeration | all, selected | all |
| style | string | CSS | |
| width | measure | px, %, auto | |

**Child Elements: rule**
| Attribute | Type | Required |
|---|---|---|
| match | string (XPath) | yes |

**Notes:** Use `select="false()"` on child components to prevent auto-binding. Use `{xpath}` in attribute values for dynamic data. When inside a panel, the container inherits the parent panel layout. Events from components within items propagate through the container.

**Actions:** hide, show

**Events:** ContextMenu, Hide, Select, Show

**Methods:** clearContent, getSelected

```xml
<container name="coButtons" show="all" width="300" height="100">
  <rule match="component">
    <button text="{@name}" width="100"/>
  </rule>
</container>
```

---

## Date
Date picker with input field and calendar popup. ISO 8601 format (YYYY-MM-DD).

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| default | string | YYYY-MM-DD | |
| editable | boolean | true, false | true |
| enabled | boolean | true, false | true |
| hide | boolean | true, false | false |
| look | enumeration | aqua, classic, marble, fabric, glass, graphite, grid | marble |
| shared | boolean | true, false | false |
| style | string | CSS | |
| storeformat | enumeration | YYYY-MM-DD, YYYY/MM/DD, DD/MM/YYYY | |
| title | string | tooltip | |
| toggle | boolean | true, false | false |
| value | string | today(), YYYY-MM-DD | today() |

**Notes:** Developer always works in ISO 8601. End-user display format is controlled by system settings. `shared="true"` shares with system calendar. `toggle="true"` opens calendar on input click.

**Actions:** disable, enable, hide, show

**Events:** DateChanged, Disable, Enable, Focus, Hide, Select, Show

**Methods:** getValue

```xml
<date name="dateToday" value="today()" toggle="true" label="Enabled"/>
```

---

## Dummy
Placeholder component to prevent missing-component warnings. Place directly inside view element.

```xml
<dummy name="one"/>
```

---

## FileList
Specialized IconList for database content (Data Virtualization Layer). No rules needed; automatically understands db: namespace format.

**Inherits:** IconList (all IconList required/optional attributes apply unless overridden below)

**Lookup tip:** Use `xios_component("filelist, iconlist")` when you need full attribute coverage.

**Required Attributes**
See IconList documentation.

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| container | enumeration | Container, folder | Container |
| database | enumeration | database | database |
| driveicon | string | icon path | icon://data_cloud |
| folders | boolean | true, false | true |
| showloader | boolean | true, false | false |
| style | string | CSS | |
| upload | boolean | true, false | false |
| silent | boolean | true, false | false |
| onlyfolders | boolean | true, false | false |

**Actions:** enable, disable, hide, show

**Events:** BindingReady, Clear, ContextMenu, Delete, Disable, DoubleClick, Drop, Enable, Enter, FirstItem, Hide, Init, LastItem, LayoutChanged, Menu, Release, Renamed, Select, Show

```xml
<filelist name="content" width="fill" height="fill" scroll="true" paging="more"
  iconsize="32" layout="list" sort="ascending" sortproperty="name" container="folder"/>
```

---

## Form
Auto-generates form UI from bound XML data. Rules override default rendering per XML node.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px, %, fill, auto |
| width | measure | px, %, fill, auto |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| look | string | overrides child component looks | |
| style | string | CSS | |
| title | string | tooltip | |

**Notes:** Rules match XML nodes; unmatched attributes/elements default to input fields. Use `children="false"` on a rule to render only the current node.

**Actions:** hide, show

```xml
<form name="formExample" vmargin="30" hmargin="10" height="auto">
  <rule match="component/@tag">
    <input width="80"/>
  </rule>
</form>
```

---

## Grid
Data table with sortable columns, cell editing, filtering, and pagination.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| width | measure | px, %, fill, auto |
| height | measure | px, %, fill, auto |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| datachange | boolean | true, false | true |
| deselect | boolean | true, false | false |
| inset | boolean | true, false | false |
| look | enumeration | default, graphite | default |
| mode | enumeration | default, grid, database | default |
| page-message | string | pagination text | |
| scroll | boolean | true, false | true |
| selection | enumeration | row, multi | |
| selection-mode | string | single, multi, off | single |
| style | string | CSS | |

**Child Elements: row > column**

row attributes:
| Attribute | Type | Required |
|---|---|---|
| match | string (XPath) | yes |
| height | measure (px) | no |

column attributes:
| Attribute | Type | Values |
|---|---|---|
| match | string (XPath) | required |
| name | string | column identifier/label |
| display | string (XPath) | makes cell read-only |
| look | enumeration | default, classic, white |
| label | string | column header text |
| width | measure | px, % |
| sort | string | ascending, descending |
| type | string | alpha, numeric, integer, float, int, pubdate |
| filter | boolean | true, false |
| align | enumeration | left, right |
| format | enumeration | date |
| timezone | string | timezone name |
| icon | string | URL |
| scroll | boolean | true, false |
| draggable | boolean | true, false |
| title | string | tooltip |

**Notes:** `mode="grid"` adds row numbers and enables cell/column selection. `mode="database"` adds row/column insertion. `display` + `match` = read-only cells; `look` + `match` = editable cells. Match values must be unique across rows/columns.

**Actions:** disable, enable, hide, show

**Events:** AddColumn, AddRow, ContextMenu, Delete, Disable, DoubleClick, Drop, Enable, Enter, Header, HeaderContextMenu, Hide, Select, Show

**Methods:** deselect, getValue, hideColumn, selectAll, selectFirstRow, selectLastRow, showColumn, sortColumn, update

**CSS Classes:** .cell, .input, .rowColor0, .rowColor1, .rowMarker, .selected, .selectedSynch, .table_head, .xios-grid, .xios-grid-cell, .xios-grid-cell-fake-nodata, .xios-grid-cell-nodata, .xios-grid-cell-span, .xios-grid-ColHeaderHandle, .xios-grid-divider, .xios-grid-filter, .xios-grid-filter-image, .xios-grid-filter-images, .xios-grid-header-cell, .xios-grid-last-fill-col, .xios-grid-main-body, .xios-grid-maincontainer, .xios-grid-main-header, .xios-grid-main-table, .xios-grid-new-col-header-cell, .xios-grid-new-row, .xios-grid-PageArrow_disabled, .xios-grid-PageArrow_enabled, .xios-grid-PageInfo, .xios-grid-PageMessage, .xios-grid-paging-row, .xios-grid-row, .xios-grid-row-cell-icon, .xios-grid-row-cell-span, .xios-grid-sorting-arrow, .xios-grid-th-cell

```xml
<grid name="gridExample" width="auto" height="auto" datachange="false">
  <row match="component" height="50">
    <column width="60" name="Name" match="@name" display="."/>
    <column width="80" name="Group" match="@group" look="grid"/>
  </row>
</grid>
```

---

## Group
Wrapper that lets child components share behavior (mutex, toggle, switch).

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| align | enumeration | right, left, center | left |
| class | string | CSS class | |
| enabled | boolean | true, false | true |
| height | measure | px | |
| hide | boolean | true, false | false |
| mode | enumeration | default, mutex, switch, toggle | default |
| style | string | CSS | |
| title | string | tooltip | |
| value | string | preselected value | |
| width | measure | px | |

**Child Elements:** ButtonBox, Radio

**Notes:** `mode="mutex"` allows only one selection at a time. `mode="toggle"` is mutex + buttonboxes appear pressed. `mode="switch"` allows multiple pressed buttonboxes. Radio buttons auto-mutex when grouped.

**Actions:** enable, disable, hide, show

**Events:** Disable, Enable, Hide, Select, Show

**Methods:** getValue, setValue

```xml
<group name="group1" mode="mutex">
  <radio name="radio1" post-text="One" value="1"/>
  <radio name="radio2" post-text="Two" value="2"/>
</group>
```

---

## HTML
Renders raw HTML content inside a panel.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| height | measure | px, % | |
| style | string | CSS | |
| width | measure | px, % | |

**Actions:** hide, show

**Events:** Hide, Show

---

## IconList
Displays data as icons in list, thumbnail, or tile layout. Data-driven with rules.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px, %, fill, auto |
| width | measure | px, %, fill, auto |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| deselect | boolean | true, false | true |
| hide | boolean | true, false | false |
| hover | boolean | true, false | true |
| iconsize | integer | px | 32 |
| lasso | boolean | true, false | true |
| layout | enumeration | list, thumbnail, tile, submenu | thumbnail |
| look | enumeration | aqua, marble, graphite, glass | marble |
| multipleselect | boolean | true, false | true |
| paging | enumeration | more, scroll, none | more |
| partialupdate | boolean | true, false | false |
| renameable | boolean | true, false | false |
| scroll | boolean | true, false | true |
| sort | enumeration | ascending, descending | |
| sortproperty | string | property to sort | name |
| style | string | CSS | |
| wait | string | loading text | |

**Child Elements: rule > item**

rule attributes: match (XPath, required)

item attributes:
| Attribute | Type | Required |
|---|---|---|
| display | string (XPath) | yes |
| icon | string (URL/XPath) | yes |

item optional: class, name, renamepath, style, title, value

**Actions:** enable, disable, hide, show

**Events:** BindingReady, Clear, ContextMenu, Delete, Disable, DoubleClick, Drop, Enable, Enter, FirstItem, Hide, Init, LastItem, LayoutChanged, Menu, Release, Renamed, Select, Show

**Methods:** deselect, getDataLocation, getSelected, getSrcDataLocation, getValue, setLayout, setSelectionEx, update

```xml
<iconlist name="iconList" width="100%" height="100%" layout="list" iconsize="32">
  <rule match="component">
    <item display="{@name}" icon="icon://piece"/>
  </rule>
</iconlist>
```

---

## Image
Displays an image from a URL or data binding.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| src | string | URL |
| width | measure | px, % | |
| height | measure | px, % | |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| crop | boolean | true, false | false |
| enabled | boolean | true, false | true |
| hide | boolean | true, false | false |
| look | enumeration | aqua, marble, graphite, glass | marble |
| mode | enumeration | default, cover, contain | default |
| size | integer | px | |
| style | string | CSS | |
| title | string | tooltip | |

**Child Elements:** hover (src), error (src), disabled (src), selected (src) -- alternate image sources for states

**Actions:** disable, enable, hide, show, select

**Events:** Disable, Enable, Hide, Release, Select, Show

**Methods:** setIcon, getValue, setValue

**CSS Classes:** .imageCrop, .imageCropOverlay, .xios-image

```xml
<image name="myImage" width="40" height="40" src="icon://flower" size="64" title="A flower"/>
```

---

## Input
Single-line text input field with optional icon, addon, counter, and validation.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| width | measure | px, %, auto, fill |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| addon | string | suffix text | |
| class | string | CSS class | |
| counter | boolean | true, false | false |
| default | string | default value | |
| enabled | boolean | true, false | true |
| focus | boolean | true, false | false |
| hide | boolean | true, false | false |
| hold | boolean | true, false | false |
| icon | string | URL | |
| length | integer | max chars | |
| look | enumeration | aqua, classic, marble, fabric, glass, graphite, grid | marble |
| mode | enumeration | default, password | default |
| placeholder | string | hint text | |
| style | string | CSS | |
| title | string | tooltip | |
| type | enumeration | default, numeric | default |

**Actions:** enable, disable, hide, show

**Events:** Blur, Change, Changed, ContextMenu, Disable, Enable, Enter, Escape, Focus, Hide, Key, Release, Select, Show

**Methods:** activate, clear, getSelectionLength, getValue, setLabel, execCommand

**CSS Classes:** .xios-input, .xios-input .addon, .xios-input .arw, .xios-input .clr, .xios-input .counter, .xios-input input

```xml
<input name="inputName" width="200" placeholder="Type here..." icon="icon://search"/>
```

---

## Item
Reference component. See List Item, Menu Item, or Plate Item depending on parent context.

---

## Label
Displays text, optionally with icon and link behavior.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| bold | boolean | true, false | false |
| class | string | CSS class | |
| color | color | #rrggbb | |
| enabled | boolean | true, false | true |
| height | measure | px, %, auto | |
| hide | boolean | true, false | false |
| href | string | URL | |
| icon | string | URL | |
| icon-align | enumeration | left, right | left |
| italic | boolean | true, false | false |
| link | boolean | true, false | false |
| look | enumeration | aqua, marble, graphite | marble |
| size | integer | font size px | |
| style | string | CSS | |
| text | string | display text | |
| title | string | tooltip | |
| underline | boolean | true, false | false |
| width | measure | px, %, auto | |

**Actions:** disable, enable, hide, show

**Events:** ContextMenu, Disable, Enable, Hide, Release, Select, Show

**Methods:** getValue, setIcon, setValue

**CSS Classes:** .xios-label, .xios-label .icon, .xios-label-disabled, .xios-label-link

```xml
<label name="myLabel" text="Hello World" size="16" bold="true" icon="icon://star"/>
```

---

## List
Simple data-driven list. Uses rules to match and display items.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px, % |
| width | measure | px, % |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| deselect | boolean | true, false | false |
| hide | boolean | true, false | false |
| hover | boolean | true, false | true |
| look | enumeration | aqua, marble, graphite, glass | marble |
| multiple | boolean | true, false | false |
| scroll | enumeration | auto, visible, false | auto |
| sort | string | ascending, descending | |
| sort-key | string (XPath) | sort expression | |
| style | string | CSS | |
| title | string | tooltip | |

**Child Elements: rule > item**

rule: match (XPath, required)

item: display (XPath, required), icon (URL), value, class, style

**Actions:** enable, disable, hide, show

**Events:** ContextMenu, Disable, DoubleClick, Empty, Enable, Hide, MoveItem, Release, Select, Show

**Methods:** getDataLocation, getSrcDataLocation, getValue

```xml
<list name="myList" width="200" height="300">
  <rule match="component">
    <item display="{@name}" icon="icon://piece"/>
  </rule>
</list>
```

---

## List Item
Child element of List, used within rules.

| Attribute | Type | Required |
|---|---|---|
| display | string (XPath) | yes |
| icon | string (URL) | no |
| value | string | no |
| class | string | no |
| style | string (CSS) | no |

---

## ListView
XSLT-driven list for custom HTML rendering. Three levels of XSLT attributes: root, item, sub-item.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px, % |
| width | measure | px, % |
| href | string | URL to XSLT |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| deselect | boolean | true, false | true |
| hide | boolean | true, false | false |
| hover | boolean | true, false | true |
| look | enumeration | aqua, marble, graphite, glass | marble |
| multiple | boolean | true, false | false |
| paging | enumeration | more, scroll, none | more |
| partialupdate | boolean | true, false | false |
| scroll | boolean | true, false | true |
| sort | string | ascending, descending | |
| sortproperty | string | property to sort | |
| style | string | CSS | |
| wait | string | loading text | |

**Notes:** XSLT receives parameters via `xsl:param`: triggerEvent (event name to fire), triggerComponent (component name for event source). Three levels of rendering: root template, item template (per matched node), sub-item template (children).

**Actions:** enable, disable, hide, show

**Events:** ContextMenu, Delete, Disable, DoubleClick, Drop, EditEnd, Enable, Hide, Menu, MoveItem, Paste, Release, Select, Show, TriggerEvent

**Methods:** deselect, getDataLocation, getSrcDataLocation, getValue, setSelectionEx, update

```xml
<listview name="myListView" width="100%" height="100%" href="layout/mylist.xsl"/>
```

---

## Map
Displays an interactive map with markers, paths, circles, and areas.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px, % |
| width | measure | px, % |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| controls | boolean | true, false | true |
| class | string | CSS class | |
| icon-select | string | URL | |
| lat | integer | latitude | |
| lng | integer | longitude | |
| mapcenter | string | float value | |
| style | string | CSS | |
| zoomlevel | integer | 1..n | |

**Child Elements:**

**marker:** lat, lng, icon, title, draggable
**path:** color, weight, opacity, points (lat/lng pairs)
**circle:** lat, lng, radius, color, opacity
**area:** points (lat/lng pairs), color, opacity

**Actions:** hide, show

**Events:** ContextMenu, Hide, MapTypeChanged, Select, Show, Ready

**Methods:** addMarker, clearMarkers, fitBounds, getCenter, panTo, removeMarker, setCenter, setZoom

```xml
<map name="myMap" width="100%" height="100%" lat="59.33" lng="18.07" zoomlevel="12">
  <marker lat="59.33" lng="18.07" title="Stockholm"/>
</map>
```

---

## Menu
Context menu or popup menu with items, dividers, and data-driven items.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| caption | boolean | true, false | true |
| class | string | CSS class | |
| style | string | CSS | |
| text | string | menu caption | |

**Child Elements:** Menu Item, DataItem, Divider

**Actions:** hide, show

**Events:** Hide, Select, Show

**Methods:** getValue

---

## DataItem
Data-driven child of Menu. Uses rules to populate menu items dynamically.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| match | string (XPath) | data match |
| display | string (XPath) | display value |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| icon | string | URL | |
| value | string | item value | |

---

## Divider
Visual separator in a Menu.

No attributes required. Place between Menu Items.

---

## Menu Item
Static item in a Menu.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| text | string | display text |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| enabled | boolean | true, false | true |
| hide | boolean | true, false | false |
| icon | string | URL | |
| hotkeytext | string | keyboard shortcut text | |
| submenu | string | child menu name | |
| value | string | item value | |

---

## MenuBar
Application menu bar containing Menu components.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| position | enumeration | top, bottom, right, left |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| look | enumeration | aqua, marble, graphite | marble |
| style | string | CSS | |

**Child Elements:** Menu

**Actions:** hide, show

**Events:** Hide, Select, Show

```xml
<menubar name="mainMenu" position="top">
  <menu name="fileMenu" text="File">
    <item name="new" text="New" icon="icon://document_new" hotkeytext="Ctrl+N"/>
    <divider/>
    <item name="exit" text="Exit"/>
  </menu>
</menubar>
```

---

## Panel
Layout container. The fundamental building block for arranging components.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| align | enumeration | left, right, center | left |
| bgcolor | color | #rrggbb, transparent | |
| class | string | CSS class | |
| closeable | boolean | true, false | false |
| enabled | boolean | true, false | true |
| gap | integer | px between children | |
| height | measure | px, %, auto, fill | |
| hide | boolean | true, false | false |
| icon | string | URL (for tabstrip tab) | |
| look | enumeration | aqua, classic, fabric, glass, graphite, marble, white | |
| mode | enumeration | default, closeable, expander | default |
| padding | integer | px | |
| position | enumeration | default, absolute | default |
| scroll | enumeration | auto, visible, false | auto |
| selected | boolean | true, false | false |
| style | string | CSS | |
| title | string | tooltip or tab title | |
| type | enumeration | flow, columns, column, rows, row | flow |
| valign | enumeration | top, bottom, center | top |
| width | measure | px, %, auto, fill | |
| xlink:actuate | enumeration | onRequest, onLoad | |
| xlink:href | string | URL to lazy-load | |

**Notes:** `type="rows"` stacks vertically. `type="columns"` lays out horizontally. `type="flow"` wraps like CSS flex-wrap. Use `xlink:actuate="onRequest"` for lazy loading panels. `selected="true"` makes this the visible panel in a tabstrip/accordion. `closeable="true"` adds a close button in tabstrip.

**Actions:** enable, disable, hide, show

**Events:** Close, Disable, Drop, Enable, Hide, Init, Menu, Select, Show

**Methods:** getValue, setTitle

```xml
<panel name="main" type="rows" padding="10" gap="5">
  <label text="Row 1"/>
  <label text="Row 2"/>
</panel>
```

---

## Plate
Popup list used by ComboBox. Contains static items or data-driven rules.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| count | string | element name for count | |
| header | string | plate header text | |
| height | measure | px | |
| style | string | CSS | |
| width | measure | px | |

**Child Elements:** Plate Item, rule

**Events:** Select

---

## Plate Item
Static item in a Plate.

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| icon | string | URL | |
| selected | boolean | true, false | false |
| value | string | item value | |

Text content becomes the display value.

---

## Radio
Radio button. Auto-mutex when placed in a Group.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| checked | boolean | true, false | false |
| class | string | CSS class | |
| enabled | boolean | true, false | true |
| hide | boolean | true, false | false |
| look | enumeration | aqua, classic, marble, fabric, glass, graphite | marble |
| post-text | string | label after radio | |
| pre-text | string | label before radio | |
| selected | boolean | true, false | false |
| style | string | CSS | |
| title | string | tooltip | |
| value | string | radio value | |

**Actions:** disable, enable, hide, show

**Events:** Disable, Enable, Hide, Release, Select, Show

**Methods:** getValue, setValue

**CSS Classes:** .xios-radio, .xios-radio .container, .xios-radio .RBCircle, .xios-radio .RBCircle_checked, .xios-radio .RBCircle_disabled, .xios-radio .RBDot, .xios-radio .RBDot_checked

```xml
<group name="group1" mode="mutex">
  <radio name="r1" post-text="Option A" value="a"/>
  <radio name="r2" post-text="Option B" value="b" selected="true"/>
</group>
```

---

## Render
XSLT-driven component that renders bound XML data through a stylesheet.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| href | string | URL to XSLT |
| height | measure | px, % |
| width | measure | px, % |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| scroll | enumeration | auto, visible, false | auto |
| style | string | CSS | |

**Notes:** XSLT parameters `triggerEvent` and `triggerComponent` enable event forwarding from rendered HTML back to XIOS process code.

**Actions:** hide, show

**Events:** ContextMenu, Hide, Select, Show, TriggerEvent

**Methods:** getValue, update

```xml
<render name="myRender" href="layout/template.xsl" width="100%" height="100%" scroll="visible"/>
```

---

## RichText
Rich text editor with formatting toolbar actions.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px, % |
| width | measure | px, % |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| enabled | boolean | true, false | true |
| focus | boolean | true, false | false |
| hide | boolean | true, false | false |
| mode | enumeration | default, xml | default |
| style | string | CSS | |

**Actions:** enable, disable, hide, show

**Events:** AlignCenterRelease, AlignCenterSelect, AlignJustifiedRelease, AlignJustifiedSelect, AlignLeftRelease, AlignLeftSelect, AlignRightRelease, AlignRightSelect, BGColorSelect, BGColorRelease, BoldRelease, BoldSelect, Changed, ContextMenu, Disable, Enable, FontFamilySelect, FontFamilyRelease, FontSizeSelect, FontSizeRelease, FGColorSelect, FGColorRelease, Hide, HttpHyperlink, IndentRelease, IndentSelect, InsertHRRelease, InsertHRSelect, InsertImageRelease, InsertImageSelect, InsertLinkRelease, InsertLinkSelect, ItalicRelease, ItalicSelect, OrderedListRelease, OrderedListSelect, OutdentRelease, OutdentSelect, Release, Select, Show, StrikeRelease, StrikeSelect, UnderlineRelease, UnderlineSelect, UnorderedListRelease, UnorderedListSelect

**Methods:** activate, clear, execCommand, getSelectionLength, getSelectionValue, getValue, wordWrap

---

## Shell
Interactive command-line shell component.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px, % |
| width | measure | px, % |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| style | string | CSS | |

**Child Elements:** banner (text), look (theme), macro (name, value), group (name), command (name, value, desc)

**Actions:** hide, show

**Events:** Hide, Show, Fullscreen

**Methods:** clear, getHistory, print, setPrompt

**CSS Classes:** .xios-shell, .xios-shell-input, .xios-shell-output, .xios-shell-pre

```xml
<shell name="myShell" width="100%" height="100%">
  <banner>Welcome to XIOS Shell</banner>
  <command name="hello" value="print" desc="Say hello"/>
</shell>
```

---

## Slider
Range slider for numeric value selection.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| enabled | boolean | true, false | true |
| height | measure | px | |
| hide | boolean | true, false | false |
| look | enumeration | aqua, marble, graphite | marble |
| max | integer | maximum value | 100 |
| min | integer | minimum value | 0 |
| orientation | enumeration | horizontal, vertical | horizontal |
| step | integer | increment | 1 |
| style | string | CSS | |
| title | string | tooltip | |
| value | integer | initial value | 0 |
| width | measure | px | |

**Actions:** disable, enable, hide, show

**Events:** Disable, Change, Enable, Hide, Select, Show

**Methods:** getValue, setValue

```xml
<slider name="mySlider" min="0" max="100" value="50" width="200"/>
```

---

## TabStrip
Tabbed navigation container. Tabs are defined by child Panel components. Uses mutex behavior.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| width | measure | px, %, fill, auto |
| height | measure | px, %, fill, auto |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| add | boolean | true, false | false |
| class | string | CSS class | |
| position | enumeration | top, bottom | top |
| look | enumeration | aqua, classic, marble, graphite | marble |
| style | string | CSS | |
| tabheight | integer | px | 24 |
| tabs | boolean | true, false | true |
| title | string | tooltip | |

**Child Elements:** Panel

**Notes:** Tab labels come from Panel `title` attribute. Use Panel `selected="true"` for default tab. Panel `icon` sets tab icon. `add="true"` shows an add button emitting Add event. `tabs="false"` hides the tab bar. Rules can create dynamic tabs via `<rule>` with `<item>` children. Show/hide actions on contained panels switch tabs.

**Actions:** hide, show

**Events:** Add, ContextMenu, Hide, Release, Select, Show

**Events on contained panels:** Select

**Methods:** flashTab, selectTab

```xml
<tabstrip name="tabstrip1" width="auto" height="auto" position="top">
  <panel name="panel1" type="rows" selected="true">
    <label name="lab1" text="This is a label"/>
  </panel>
  <panel name="panel2" type="rows" icon="icon://question">
    <label name="lab2" text="This is another label"/>
  </panel>
</tabstrip>
```

---

## TextArea
Multi-line text editing area.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| width | measure | px, % |
| height | measure | px, % |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| default | string | default text | |
| enabled | boolean | true, false | true |
| focus | boolean | true, false | false |
| hide | boolean | true, false | false |
| hold | boolean | true, false | false |
| length | integer | max chars | |
| look | enumeration | aqua, classic, marble, fabric, glass, graphite, grid | marble |
| mode | enumeration | xml, default | default |
| placeholder | string | hint text | |
| style | string | CSS | |
| title | string | tooltip | |
| wrap | enumeration | soft, hard, off | soft |

**Notes:** `mode="xml"` does not escape XML text. `mode="default"` escapes text.

**Actions:** enable, disable, hide, show

**Events:** Changed, ContextMenu, Disable, Enable, Enter, Hide, Key, Release, Saved, Select, Show

**Methods:** activate, clear, execCommand, getSelectionLength, getSelectionValue, getValue, releaseEnter, setFont, takeEnter, wordWrap

```xml
<textarea name="Textarea1" height="50" width="100" wrap="soft" placeholder="Click here for focus."/>
```

---

## Toggle
Binary on/off switch. Visually distinct from CheckBox.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| checked | boolean | true, false | false |
| default | string | false, off, 0 | false |
| enabled | boolean | true, false | true |
| hide | boolean | true, false | false |
| look | enumeration | aqua, classic, marble, fabric, glass, graphite | marble |
| post-text | string | label after toggle | |
| pre-text | string | label before toggle | |
| selected | boolean | true, false | false |
| shape | string | round, square | round |
| size | integer | px | 15 |
| style | string | CSS | |
| title | string | tooltip | |

**Notes:** `default` sets value pair: false/true, off/on, or 0/1. Use setValue to change state programmatically.

**Actions:** disable, enable, hide, show

**Events:** Disable, Enable, Hide, Release, Select, Show

**Methods:** getValue, setValue

```xml
<panel type="rows" gap="10" padding="5">
  <toggle name="toggle1" checked="true" post-text="Toggle with post-text" shape="square"/>
  <toggle name="toggle2" checked="true" pre-text="Toggle with pre-text"/>
</panel>
```

---

## ToolBar
Container for toolbar buttons, inputs, and groups. Docks to window edges or floats.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px |
| position | enumeration | top, bottom, left, right, float |
| width | measure | px, fill |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| align | string | right, [none] | [none] |
| class | string | CSS class | |
| hide | boolean | true, false | false |
| icon | boolean | true, false | false |
| look | enumeration | aqua, marble, glass, graphite, liquid | marble |
| opacity | integer | 0-100 | 100 |
| style | string | CSS | |
| title | string | tooltip | |
| xpos | integer | left px (float) | |
| ypos | integer | top px (float) | |

**Child Elements:** ButtonBox, Group, Date, Color, Slider, Input, ComboBox, Label, Clock, Container, Image

**Notes:** `position="float"` requires xpos/ypos. Cannot use float inside a panel. Use Group to create separator sections and shared behavior among buttonboxes.

**Actions:** hide, show

**Events:** ContextMenu, Hide, Show

```xml
<toolbar name="toolbarName" width="100%" height="100" position="top">
  <group name="leftBar">
    <buttonbox name="addBoard" text="Add Board" icon="icon://plus"/>
  </group>
  <group name="rightBar" align="right">
    <buttonbox name="deleteCard" text="Delete" icon="icon://delete?color=red"/>
  </group>
</toolbar>
```

---

## Tree
Classic tree view for displaying hierarchical data. Uses rules to define branches.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px, % |
| icon | string | URL |
| width | measure | px, % |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| border | integer | px | |
| bgcolor | color | #rrggbb | |
| class | string | CSS class | |
| docmatch | string | external doc match | |
| focusnew | boolean | true, false | true |
| hideroot | boolean | true, false | false |
| multiple | boolean | true, false | true |
| sort | enumeration | ascending, descending | ascending |
| sort-key | Expression | XPath sort key | |
| style | string | CSS | |
| rename | boolean | true, false | |
| title | string | tooltip | |
| tree-expanded | boolean | true, false | false |
| wait | string | loading text | |

**Child Elements: rule**
| Attribute | Type | Required |
|---|---|---|
| match | string (XPath) | yes |
| display | string (XPath) | yes |
| icon | string (URL) | yes |

rule optional: draggable (boolean), icon2 (URL, expanded icon), open (boolean)

**Notes:** Must have a root node bound. `hideroot="true"` shows children at top level. `tree-expanded="true"` expands all nodes on load. Expression returns selected item data and children.

**Actions:** activate, hide, show

**Events:** ContextMenu, Delete, DoubleClick, Drop, Edit, Hide, Select, Show

**Methods:** edit, getNodePath, getCurrentLabel, getDataLocation, getSrcDataLocation, navigateUp, nodeExpanded, setSelectionEx, setSelectionRoot, toggleNode

```xml
<tree name="myTree" width="100%" height="100%" icon="icon://rocket">
  <rule match="components" display="'Component List'" icon="icon://pieces" open="true"/>
  <rule match="component" display="@name" icon="icon://piece"/>
</tree>
```

---

## Upload
File upload component. Hidden by default; triggered via process methods.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| camera | boolean | true, false | false |
| overwrite | boolean | true, false | false |
| silent | boolean | true, false | false |
| class | string | CSS class | |
| height | measure | px, % | |
| hide | boolean | true, false | false |
| style | string | CSS | |
| width | measure | px, % | |

**Notes:** Workflow: (1) add to view, (2) call setDestination to set upload endpoint, (3) call uploadStart with MIME type and optional filename. `camera="true"` with `accept="image/*"` opens camera on mobile. `hide="true"` hides progress bars.

**Events:** FileUploadStarted, FileUploadComplete

**Methods:** setDestination, uploadStart

```xml
<upload hide="true" name="upload" camera="true"/>
```

---

## Video
Simple video player for externally hosted streams.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| height | measure | px |
| src | string | public URL |
| width | measure | px |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| class | string | CSS class | |
| name | string | unique name | |
| style | string | CSS | |
| title | string | hover title | |

**Methods:** play, pause

---

## View
Root element for UI markup. Represents the window or widget that contains all components.

**Required Attributes**
| Attribute | Type | Values |
|---|---|---|
| name | string | unique name |
| height | measure | px |
| width | measure | px |

**Optional Attributes**
| Attribute | Type | Values | Default |
|---|---|---|---|
| alwaysontop | boolean | true, false | false |
| author | string | author name | |
| autoresize | boolean | true, false | false |
| bottom | integer | px from bottom | |
| bottom-exclusion | integer | px | |
| bgblur | boolean | true, false | false |
| bgimage | string | URL or #rrggbb | |
| bgscale | boolean | true, false | false |
| class | string | CSS class | |
| close | boolean | true, false | true |
| copyright | string | notice | |
| created | date | YYYY-MM-DD | |
| draggable | boolean | true, false | true |
| handle-close | boolean | true, false | false |
| icon | string | URL | |
| iconbar | boolean | true, false | true |
| left | integer | px from left | |
| localedirs | string | URL list | |
| logotype | string | URL (110x25px) | |
| look | enumeration | blue, graphite, liquid, alert, plain | blue |
| max-height | measure | px | |
| max-width | measure | px | |
| menu | boolean | true, false | true |
| min-height | measure | px | |
| min-width | measure | px | |
| modal | boolean | true, false | false |
| mode | enumeration | main, widget, window | main |
| native-context-menu | boolean | true, false | false |
| position | enumeration | default, center | default |
| publisher | string | publisher name | |
| resize | boolean | true, false | true |
| revised | date | YYYY-MM-DD | |
| right | integer | px from right | |
| screen | string | media query or phone/tablet/desktop | |
| share | boolean | true, false | true |
| splash | boolean | true, false | false |
| style | string | CSS | |
| taskbar | boolean | true, false | false |
| theme | enumeration | aqua, cbe, classic, fabric, glass, graphite, liquid, marble, sparse | |
| title | string | window title | |
| top | integer | px from top | |
| top-exclusion | integer | px | |
| version | enumeration | 1.0 | 1.0 |
| winstate | boolean | true, false | true |

**Child Elements:** Menu, MenuBar, Panel, ToolBar

**Notes:** First opened view becomes main view (full background). Subsequent views open as floating windows. `mode="widget"` removes title bar and close/min/max buttons; transparent background by default. `handle-close="true"` emits Closing event instead of closing. `modal="true"` blocks access to other views. `screen` enables responsive views (phone/tablet/desktop shortcuts). Events bubble up from child components. Add a Menu component to a widget view for custom widget context menu.

**Events:** Blur, Close, Closing, ContextMenu, Drop, Focus, Loaded, Maximize, Minimize, Opened, SetActive, Refresh, Restore, Select, Updated

**Methods:** attach, detach, focus, maximize, minimize, getDimension, restore, restoreAppDlg, setImage, setDimension, setIcon, setTitle

```xml
<view name="basicView" title="Basic" icon="icon://flower" width="400" height="300">
  <panel bgcolor="grey" padding="10">
    <label text="Basic View" size="16"/>
  </panel>
</view>
```

---

**Components processed: 50**

Active components: Accordion, App, Breadcrumbs, Bush, Button, ButtonBox, Calendar, CheckBox, Clock, CodeEditor, Color, ComboBox, Container, Date, Dummy, FileList, Form, Grid, Group, HTML, IconList, Image, Input, Item, Label, List, List Item, ListView, Map, Menu, DataItem, Divider, Menu Item, MenuBar, Panel, Plate, Plate Item, Radio, Render, RichText, Shell, Slider, TabStrip, TextArea, Toggle, ToolBar, Tree, Upload, Video, View.

Excluded (commented out): Browser, Editor, Expander, ExpanderItem, ExpanderMenu, Info, Media, Rating, XMLEditor.
