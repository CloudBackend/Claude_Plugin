# XIOS/3 Events Reference

---

### RichText Formatting Events

These events fire on the **RichText** component when the cursor enters (Select) or leaves (Release) formatted text regions.

| Event | Formatting |
|---|---|
| AlignCenterSelect / AlignCenterRelease | Center-aligned text |
| AlignJustifiedSelect / AlignJustifiedRelease | Justified text |
| AlignLeftSelect / AlignLeftRelease | Left-aligned text |
| AlignRightSelect / AlignRightRelease | Right-aligned text |
| BGColorSelect / BGColorRelease | Background color |
| BoldSelect / BoldRelease | Bold |
| BulletListSelect / BulletListRelease | Bullet list |
| DecorationSelect / DecorationRelease | Underline (decoration) |
| FGColorSelect / FGColorRelease | Foreground color |
| FontFamilySelect / FontFamilyRelease | Font family |
| FontSizeSelect / FontSizeRelease | Font size |
| ItalicSelect / ItalicRelease | Italic |
| NumberListSelect | Numbered list |

Components: RichText

*25 events total (12 Select/Release pairs + NumberListSelect which has no corresponding Release)*

Additional RichText command-related Select/Release events are documented below as individual event entries.

---

## AlignCenterSelect

Fires when the cursor enters center-aligned text in RichText.

Components: RichText

---

## AlignCenterRelease

Fires when the cursor leaves center-aligned text in RichText.

Components: RichText

---

## AlignJustifiedSelect

Fires when the cursor enters justified text in RichText.

Components: RichText

---

## AlignJustifiedRelease

Fires when the cursor leaves justified text in RichText.

Components: RichText

---

## AlignLeftSelect

Fires when the cursor enters left-aligned text in RichText.

Components: RichText

---

## AlignLeftRelease

Fires when the cursor leaves left-aligned text in RichText.

Components: RichText

---

## AlignRightSelect

Fires when the cursor enters right-aligned text in RichText.

Components: RichText

---

## AlignRightRelease

Fires when the cursor leaves right-aligned text in RichText.

Components: RichText

---

## BGColorSelect

Fires when the cursor enters text with a background color in RichText.

Components: RichText

---

## BGColorRelease

Fires when the cursor leaves text with a background color in RichText.

Components: RichText

---

## BoldSelect

Fires when the cursor enters bold text in RichText.

Components: RichText

---

## BoldRelease

Fires when the cursor leaves bold text in RichText.

Components: RichText

---

## BulletListSelect

Fires when the cursor enters a bullet list in RichText.

Components: RichText

---

## BulletListRelease

Fires when the cursor leaves a bullet list in RichText.

Components: RichText

---

## DecorationSelect

Fires when the cursor enters underlined (decorated) text in RichText.

Components: RichText

---

## DecorationRelease

Fires when the cursor leaves underlined (decorated) text in RichText.

Components: RichText

---

## FGColorSelect

Fires when the cursor enters text with a foreground color in RichText.

Components: RichText

---

## FGColorRelease

Fires when the cursor leaves text with a foreground color in RichText.

Components: RichText

---

## FontFamilySelect

Fires when the cursor enters text with a specific font family in RichText.

Components: RichText

---

## FontFamilyRelease

Fires when the cursor leaves text with a specific font family in RichText.

Components: RichText

---

## FontSizeSelect

Fires when the cursor enters text with a specific font size in RichText.

Components: RichText

---

## FontSizeRelease

Fires when the cursor leaves text with a specific font size in RichText.

Components: RichText

---

## ItalicSelect

Fires when the cursor enters italic text in RichText.

Components: RichText

---

## ItalicRelease

Fires when the cursor leaves italic text in RichText.

Components: RichText

---

## NumberListSelect

Fires when the cursor enters a numbered list in RichText.

Components: RichText

---

## HttpHyperlink

Fires when a hyperlink (`https://`) is clicked inside a RichText editor.

Components: RichText

---

## IndentSelect

Fires when indentation formatting becomes active in RichText.

Components: RichText

---

## IndentRelease

Fires when indentation formatting becomes inactive in RichText.

Components: RichText

---

## OutdentSelect

Fires when outdent formatting becomes active in RichText.

Components: RichText

---

## OutdentRelease

Fires when outdent formatting becomes inactive in RichText.

Components: RichText

---

## UnderlineSelect

Fires when underline formatting becomes active in RichText.

Components: RichText

---

## UnderlineRelease

Fires when underline formatting becomes inactive in RichText.

Components: RichText

---

## StrikeSelect

Fires when strike-through formatting becomes active in RichText.

Components: RichText

---

## StrikeRelease

Fires when strike-through formatting becomes inactive in RichText.

Components: RichText

---

## OrderedListSelect

Fires when an ordered list becomes active in RichText.

Components: RichText

---

## OrderedListRelease

Fires when an ordered list becomes inactive in RichText.

Components: RichText

---

## UnorderedListSelect

Fires when an unordered list becomes active in RichText.

Components: RichText

---

## UnorderedListRelease

Fires when an unordered list becomes inactive in RichText.

Components: RichText

---

## InsertHRSelect

Fires when an insert-horizontal-rule command becomes active in RichText.

Components: RichText

---

## InsertHRRelease

Fires when an insert-horizontal-rule command becomes inactive in RichText.

Components: RichText

---

## InsertImageSelect

Fires when an insert-image command becomes active in RichText.

Components: RichText

---

## InsertImageRelease

Fires when an insert-image command becomes inactive in RichText.

Components: RichText

---

## InsertLinkSelect

Fires when an insert-link command becomes active in RichText.

Components: RichText

---

## InsertLinkRelease

Fires when an insert-link command becomes inactive in RichText.

Components: RichText

---

## Add

Fires when the add tab (+) button is clicked.

Components: TabStrip

---

## AddColumn

Components: Grid

---

## AddRow

Fires when a new row is added.

Components: Grid

---

## BindingReady

Components: IconList, FileList

---

## Blur

Components: Input, View

---

## Change

Fires when the selected value of the component has been changed.

Components: ComboBox, Input, RichText

---

## Changed

Fires when the data bound to the component has been changed.

Components: TextArea, RichText, CodeEditor

---

## Clear

Components: IconList, FileList

---

## Close

Components: Shell, Panel

---

## Closing

Fires when the X button is clicked to close the application, but the app is NOT closed -- only the event fires.

Components: View

### Notes
- Requires `handle-close` element set to `true` in the open operation, or the `handle-close` attribute on the view element.
- The application will not be closed; the developer decides what to do in the event handler.

---

## ContextMenu

Fires on right-click.

Components: ButtonBox, Calendar, Grid, FileList, IconList, Image, ListView, RichText, TabStrip, TextArea, Tree

---

## DateChanged

Fires when a new date has been set.

Components: Calendar, Date

---

## Delete

Fires when a selected item has been deleted.

Components: Grid, Tree

---

## Disable

Components: All components

---

## DoubleClick

Components: Calendar, Grid, Image, Label, ListView, Render, RichText, Tree

---

## Drop

Fires when something is dropped onto the component.

Components: Calendar, FileList, Grid, IconList, Image, Label, List, ListView, Panel, RichText, Shell, Tree

---

## Edit

Fires after editing has been performed on data in the component. To initiate editing, use `callMethod edit`.

Components: ListView, Tree

---

## EditEnd

Fires after the edit field is closed, regardless of whether changes were made.

Components: ListView

---

## Empty

Fires when the component is emptied.

Components: List

---

## Enable

Components: All components

---

## Enter

Fires when the Enter key is pressed while the component has focus.

Components: Calendar, Grid, Input, ListView, TextArea

---

## Escape

Fires when the Escape key is pressed while the component has focus.

Components: Input

---

## FileUploadStarted

Components: Upload

---

## FileUploadComplete

Components: Upload

---

## FirstItem

Components: IconList, FileList

---

## Focus

Components: ComboBox, Date, Input, RichText

---

## Fullscreen

Fires when the component is displayed in full screen.

Components: Shell

---

## Header

Fires when the user clicks on the header of a grid.

Components: Grid

---

## HeaderContextMenu

Fires when the user right-clicks on the header of a grid.

Components: Grid

---

## Hide

Components: All components

---

## Hover

Components: ButtonBox

---

## Init

Fires when the component is rendered.

Components: Accordion, Menu, Panel

---

## Key

Fires on keyDown while focus is on a supported component.

Components: Input, RichText, TextArea

### Notes
- The trigger does not contain any XML information.

---

## LayoutChanged

Components: IconList, FileList

---

## LastItem

Components: IconList, FileList

---

## Loaded

Fires when the entire view with its components is set up and ready.

Components: View

### Notes
- There is no guarantee that components can be referenced before this event triggers.
- The Loaded event is retroactive: if a process with a Loaded event trigger is loaded after the view already fired Loaded, the associated step will still be called.
- Fires before `Opened`.

---

## MapTypeChanged

Components: Map

---

## Maximize

Components: View

---

## Menu

Fires differently depending on component.

Components: Calendar, Menu, Panel

### Notes
- **Calendar**: fires when the user right-clicks on the calendar without selecting any appointments.
- **Panel**: fires when the user clicks the small arrow (only visible when `menu` attribute is `true`).

---

## Minimize

Components: View

---

## MoveItem

Fires when the user drags a selected item.

Components: List, ListView

---

## Opened

Fires when the entire view with its components is visible.

Components: View

### Notes
- Fires after `Loaded`.

---

## Paste

Fires on Ctrl+V. The paste-node becomes the trigger.

Components: ListView

---

## ReadOnly

Components: All components

---

## ReadWrite

Components: All components

---

## Ready

Fires when a component with external dependencies has been loaded and can accept interaction.

Components: Map

---

## Release

Fires on mouse-up or when something is deselected (component-specific).

Components: ButtonBox, Calendar, List, ListView, Radio, RichText, TabStrip

---

## Reloading

Components: App

---

## Renamed

Components: IconList, FileList

---

## Restore

Components: View

---

## Refresh

Components: View

---

## Saved

Fires when the data bound to the component has been saved.

Components: TextArea

---

## Select

Equivalent to onclick (and in some cases onmousedown).

Components: Accordion, Button, ButtonBox, Calendar, CheckBox, Clock, ComboBox, DataItem, Grid, Group, Image, Input, Item, Label, List, ListView, Panel, Radio, Render, RichText, Slider, TabStrip, Toggle, Tree

---

## SelectedDate

Fires when a date is selected and displayed in the Calendar.

Components: Calendar

---

## SelectedMore

Fires when a calendar event has been extended from a single day to two or more days while in single-day view.

Components: Calendar

---

## SetActive

Fires when the view has been focused.

Components: View

---

## Show

Components: All components

---

## SubjectMore

Fires when the "More Details" link is clicked in the Calendar Quick Event Scheduler.

Components: Calendar

---

## Updated

Components: View

---

## Tab

Fires when the Tab key is pressed.

Components: Shell

---

## TriggerEvent

Catch your own custom-defined events from ListView and Render components. In Listview components the trigger will contain the selection data.
This however is not available in the render component

Components: ListView, Render

### Notes
- In ListView, the trigger contains the selection data.
- In Render, the selection data is not available in the trigger.

---

## System Events

These Events are made by the XIOS/3 system.
These events do not require any component or view attribute when defining them in an event listener. It does, however, need a communicator attribute to define
which part of XIOS/3 throws the event. The standard communicator is CBE (CloudBackend). You can however make your own communicator using the channel operation.
Groups can also be communicators; when applications are stored in groups databases

---

## Login

Fires when a `channel` operation requires a login to continue.

Operations: channel

### Notes
- If this event is not listened to, the channel will not be established.
- Typically you show a login dialog prompting for username/password, then use the `login` operation to pass credentials.

---

## LoginFailure

Fires when the `login` operation has failed to authorize.

Operations: login

### Notes
- If this event is not listened to, a default login failure dialog will appear.

---

## Authorized

Fires when a `channel` or `login` operation successfully authorizes a login.

Operations: channel, login

### Notes
- Both `channel` and `login` operations can trigger a login that causes this event.

---

### Deprecated / Removed Events

This section collects legacy and system-oriented events.

Some entries are removed/commented out in parts of the source, while others are still emitted and supported.
If an event is included as a normal `## EventName` heading, it is intentionally retrievable via `xios_event(...)`.

---

### Media Events (removed 2023-04-04)

#### Complete

Fires when a media object resumes playing after buffering. The component pauses and fires `Loading`, waits for enough data, then fires `Complete` when playback resumes.

Components: Media

#### MediaEnded

Fires when the media item has completed playback. The trigger contains a reference to the container.

Components: Media

#### MediaRange

Fires when a song has started playback. The trigger contains a reference to the container.

Components: Media

#### UpdateTime

Fires continuously throughout media playback.

Components: Media

### Other Deprecated Events

#### Click

Components: Map

#### Completed

Fires after content has been loaded.

Components: Browser

#### Loading

Components: Browser, Media

- **Browser**: fires when the content has started to load a webpage.
- **Media**: fires when the user tries to play a part that has not been loaded yet, causing the media to pause.

#### UnSelect

Fires when a shape has been unselected.

Components: Editor

#### UnSelection

Components: XMLEditor
