# XIOS/3 Components Reference

## Application Structure
```xml
<application name="AppName" icon="icon://name" instances="0" theme="fabric">
  <share>false</share>
  <settings><home>home://</home><path>tenant://Applications</path></settings>
  <about loader="false" version="1.0" revised="DATE" created="DATE" author="" publisher="">
    <description>Description</description>
  </about>
  <resources><item name="resName">...inline data...</item></resources>
  <view .../>
  <process .../>
</application>
```
Themes: aqua, fabric, glass, graphite, liquid, marble, sparse

## View
```xml
<view name="vName" title="Title" icon="icon://name" width="500" height="400" winstate="false">
```
Attrs: `alwaysontop`, `bgimage`, `bgscale`, `focus`, `handle-close`, `max-height`, `max-width`, `min-height`, `min-width`, `modal`, `opacity`, `position`, `resize`, `screen` (phone|tablet|desktop), `splash`, `taskbar`, `theme`
Look: blue, graphite, liquid

Children order: menu/menubar/toolbar/style/script first, then panel.

---

## Layout Components

### panel
Core layout container. Nests all components including itself.
```xml
<panel name="p" type="rows" width="100%" height="fill" padding="10" bgcolor="#fff">
```
Type: `flow` (default), `column`, `columns`, `row`, `rows`, `table`, `form`
Sizing: fixed px, `auto`, `fill`, `100%`
Attrs: `align` (left|center|right), `valign` (top|middle|center|bottom), `scroll` (auto|scroll|true|visible|false), `gap`, `border` (none|left|right), `opacity`, `closeable`, `expanded`, `resize`, `colspan`, `rowspan`, `cols`, `selected`, `class`, `style`
Look: alert, back, barblue, bardark, barlight, cell, dark, gradient, gradient2, gradient3, gradientblue, gradientgrey, graphite, graphiteoutline, green, important, inset, light, none, outset, plate, plategrad, purple, small, title, transparent, white, window, window2
Mode: aqua, aquabar, closeable, expander, frame, glossy, header, none, round, side

### tabstrip
```xml
<tabstrip name="ts" position="top" border="0">
  <panel name="tab1" label="Tab 1">...</panel>
</tabstrip>
```
Position: top, bottom. Attrs: `tabs`, `add`, `font`, `look`, `style`

### accordion
```xml
<accordion name="acc"><panel label="Section">...</panel></accordion>
```

### expander
Expandable/collapsible plate.
```xml
<expander name="exp" header="Title" mode="plate" padding="5">...</expander>
```
Mode: plate, closed. Attrs: `hcontent`, `content-style`

### container
Dynamic host via rules. Displays children based on bound data.
```xml
<container name="ct" show="all"><rule match="tagName"><label name="lbl"/></rule></container>
```
Show: default, all. Attrs: `scroll`, `style`

### group
Groups components (buttonboxes, radios, etc).
```xml
<group name="g" mode="toggle" align="right">...</group>
```
Mode: none, toggle, mutex. Attrs: `look`, `type`, `enabled`

---

## Input Components

### button
```xml
<button name="btn" text="Click" default="true" style=""/>
```
Attrs: `btstyle`, `disabled`, `title`, `type` (do|revert)

### buttonbox (toolbar button)
```xml
<buttonbox name="bb" text="Add" icon="icon://plus" mode="toggle" enabled="true"/>
```
Mode: none, toggle, mutex, switch, rebound. Attrs: `align`, `animate`, `disabled-icon`, `duration`, `icon2`, `onclick`, `opacity`, `repeat`, `selected`, `style`, `submenu`, `title`, `trigger`, `value`
Children: `<menu>`

### input
```xml
<input name="inp" placeholder="Enter text" icon="icon://search" type="default" enabled="true"/>
```
Type: default, icon, counter, numeric, more, password, new-password, selector
Attrs: `autocomplete`, `clearsearch`, `default`, `focus`, `folder`, `hold`, `length`, `max`, `min`, `minlength`, `pattern`, `pattern-error`, `step`, `style`, `tstyle`, `onchange`
Look: classic, graphite

### textarea
```xml
<textarea name="ta" height="200" wrap="soft" placeholder="..." enabled="true"/>
```
Attrs: `default`, `focus`, `hold`, `href`, `length`, `mode` (xml), `style`
Look: classic, graphite, white. Wrap: soft, hard, off

### checkbox
```xml
<checkbox name="cb" checked="false" default="false" pre-text="Before" post-text="After"/>
```
Default values: false, true, off, on, 0, 1. Attrs: `selected`, `pre-label`, `post-label`, `look` (bold|boldwhite|white), `style`

### toggle
Same as checkbox but switch UI. Same attributes.

### radio
```xml
<radio name="r" value="optA" selected="false" bold="true"/>
```
Attrs: `color`, `font`, `look`, `pre-label`, `post-label`, `style`, `title`

### combobox
```xml
<combobox name="cb" editable="false" subplate="plateName" placeholder="Select...">
  <plate name="plateName" height="200"><rule match="item"><item>{@name}</item></rule></plate>
</combobox>
```
Attrs: `clicklabel`, `enabled`, `usethumbnail`
Look: classic, graphite, grid

### color
```xml
<color name="clr" color="#ff0000" input="true" transparent="true"/>
```
Attrs: `enabled`, `icon`, `look`, `value`

### date
```xml
<date name="dt" editable="true" toggle="true" storeformat="" value=""/>
```
Attrs: `icon` (align), `look`, `rotateable`

### slider
```xml
<slider name="sl" min="0" max="100" default="50" units="%" marks="true"/>
```
Attrs: `hideplate`, `hidevalue`, `type` (media|toolbar), `style`
Children: `<plate>`

---

## Display Components

### label
```xml
<label name="lbl" text="Hello" size="16" bold="true" color="#333" icon="icon://info"/>
```
Attrs: `bgcolor`, `decoration`, `element`, `ellipsis`, `format` (timestamp|date|time), `enabled`, `fgcolor`, `font`, `icon-pos` (left|right), `opacity`, `style`, `title`, `type` (text|link), `disableClass`, `hoverClass`
Look: bold, boldwhite, white

### image
```xml
<image name="img" src="icon://photo" size="48" align="center" scale="true"/>
```
Attrs: `method`, `style`, `title`, `type` (link), `valign`
Children: `<hover src="..." style="..."/>`

### browser
```xml
<browser name="br" href="https://example.com"/>
```

### render (XSLT sandbox)
```xml
<render name="rnd" href="#myXSL" scroll="auto"/>
```
Attrs: `entitys`, `fade`, `frame`, `selectable`, `style`

### richtext
```xml
<richtext name="rt" padding="5" scroll="true"/>
```
Attrs: `default`, `style`, `transformer`, `wrap`

### codeeditor
```xml
<codeeditor name="ce" highlight="true" mode="xml"/>
```

### media
```xml
<media name="med" progress="true" style=""/>
```

### clock
```xml
<clock name="clk" mode="digital" calendar="true" date="true"/>
```

### calendar
```xml
<calendar name="cal" type="month" startTime="08:00" endTime="18:00" interval="30"/>
```
Type: day, 5week, 7week, month

### map
```xml
<map name="mp" controls="true" zoomlevel="10" mapcenter="59.3,18.0" maptype="normal">
  <rule match="item"><marker lng="{@lng}" lat="{@lat}" title="{@name}" icon="icon://pin"/></rule>
</map>
```
Maptype: normal, satellite, hybrid. Attrs: `icon-marker`, `icon-select`, `multiple`, `show`

### chart
```xml
<chart name="ch" charttype="barchart" chartgrid="true"/>
```
Charttype: piechart, linechart, barchart

### progressbar
```xml
<progressbar name="pb" maxValue="100" length="200" units="%"/>
```
Attrs: `aboveLabel`, `belowLabel`, `mode`

---

## Data/List Components

### grid
```xml
<grid name="gr" height="100%" selection="row" sorting="true" scroll="true">
  <row match="item" height="20">
    <column name="c1" match="@name" display="." label="Name" width="100%" filter="true" sort="ascending"/>
  </row>
  <rule match="@done"><checkbox/></rule>
</grid>
```
Column type: alpha, float, int, integer, numeric, pubdate
Grid attrs: `datachange`, `href`, `inset`, `newrow`, `page-message`, `type` (generic)
Look: graphite. Mode: default, grid

### iconlist
```xml
<iconlist name="il" layout="default" scroll="auto" deselect="false" iconsize="32">
  <rule match="db:container"><item text="{@name}" icon="icon://folder"/></rule>
</iconlist>
```
Layout: albumicon, columns, default, drives, drivesDetailed, drivesMenu, icon, list, listdetail, mail, miniature, playlist, submenu, subpanel, sectionlist, text, textListColumn, thumbnail, tracklist, treelist, vertical
Attrs: `sort` (ascending|descending|position), `selecttype` (execute|toggle), `rightselect`, `paging` (more), `dragableitems`, `group`, `hover`, `lasso`, `multipleselect`, `partialupdate`, `sortproperty`, `textstyle`, `unselectevents`

### filelist (extends iconlist)
```xml
<filelist name="fl" container="path" upload="true" folders="true" layout="miniature"/>
```
Attrs: `database` (database|drive), `driveicon`, `showloader`

### bush
```xml
<bush name="bsh" hover="true" multiple="false">
  <rule match="node"><item display="{@name}" icon="icon://file"/></rule>
</bush>
```
Attrs: `bgcolor`, `focusnew`, `layout`, `look`, `sort`, `sortproperty`, `style`, `wait`

### listview (XSLT list)
```xml
<listview name="lv" href="#myXSL" multiple="true" scroll="auto"/>
```
Attrs: `deselect`, `dimension`, `floating`, `focus`, `groupmatch`, `lasso`, `mode`, `moving`, `relative`, `reload`, `style`, `treeview`, `wait`

### list
```xml
<list name="lst" mode="multiple">
  <header display="Title" match="@title"/>
  <item display="{@name}" match="node" icon="icon://file"/>
</list>
```
Mode: multiple, columns, mutex. Attrs: `bgClass`, `header`, `headerClass`, `itemClass`, `tabstop`, `tree-expanded`

### tree
```xml
<tree name="tr" multiple="false" sort="ascending">
  <rule match="node">...</rule>
</tree>
```
Attrs: `bgcolor`, `border`, `focusnew`, `nodedrag`, `style`, `wait`

### form (auto-generated)
```xml
<form name="frm" hmargin="5" vmargin="5"><rule match="field">...</rule></form>
```

### breadcrumbs
```xml
<breadcrumbs name="bc" max-chars="50" default="Home"><rule match="node">...</rule></breadcrumbs>
```

---

## Menu Components

### menubar
```xml
<menubar name="mb" position="top" compact="false">
  <menu name="fileMenu" text="File">
    <item name="mNew" text="New" icon="icon://doc_new" hotkeytext="Ctrl+N"/>
    <divider/>
    <item name="mClose" text="Close"/>
  </menu>
</menubar>
```
Position: top, bottom, left, right, float. Attrs: `draggable`, `look` (graphite), `opacity`, `style`, `type`, `width`

### toolbar
```xml
<toolbar name="tb" position="top">
  <group name="leftGrp">
    <buttonbox name="bb1" text="Action" icon="icon://bolt"/>
  </group>
  <group name="rightGrp" align="right">
    <input name="search" placeholder="Search"/>
  </group>
</toolbar>
```
Position: top, bottom, left, right, float. Attrs: `draggable`, `mode` (none|toggle|mutex), `opacity`, `type` (system|zoom|dark), `style`, `title`

### menu (standalone context menu)
```xml
<menu name="ctxMenu">
  <item name="mi1" text="Edit" icon="icon://edit"/>
  <item name="mi2" text="Delete" icon="icon://delete"/>
  <menu name="subMenu" text="More..."><item .../></menu>
</menu>
```

### expandermenu
```xml
<expandermenu name="em"><expanderitem><menu>...</menu></expanderitem></expandermenu>
```

---

## Special Components

### style (inline CSS)
```xml
<style>
  .myClass { color: red; font-weight: bold; }
</style>
```

### script (inline JS or external)
```xml
<script href="myModule.js"/>
```

### rule (data templating)
```xml
<rule match="xpath-expression" display="{@attr}" children="true">
  <item text="{@name}" icon="icon://file"/>
</rule>
```

---

## Common Attributes (shared by most components)
`name`, `draggable`, `dragicon`, `height`, `hide` (bool), `label`, `label-style`, `tabindex`, `theme`, `width`, `windowdrag`

## Localization Attributes (xmlns:l="https://xios3.com/lang")
`l:text`, `l:placeholder`, `l:post-label`, `l:pre-label`, `l:post-text`, `l:pre-text`, `l:title`, `l:value`, `l:default`, `l:label`, `l:src`
