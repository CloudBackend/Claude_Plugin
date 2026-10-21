# XIOS/3 Rules & Decisions

## Storage — Always In-Memory
- **NEVER** use `tenant://`, `home://` for data, or `database` operations
- **ALWAYS** use in-memory aliases: `<alias name="data" model="newsilent"><root/></alias>`
- No `save` operations needed — everything lives in aliases
- Settings: omit `<path>`, omit or leave `<home>` empty

## Execution Order
1. `step id="start"` — runs before any view opens. Use for: alias setup, channel creation
2. Component initialization — happens automatically, cannot set component values here
3. `Loaded` event — fires after view renders. Use for: data binding, setting component values
- **Never** try to set component values in `start` — they don't exist yet

## Process XML vs JavaScript

### Use XML process code when:
- Binding data to components (`bind`, `action`, `change`)
- Simple branching (`decision` with `when`/`otherwise`)
- UI interactions (confirm dialogs, alerts, open/close views)
- Setting aliases and reading component values
- Most apps should be 100% XML process code

### Use JS as steps when:
- Complex string manipulation beyond what `replace`/`substring` can do
- Fetch calls to external APIs
- Heavy computation or loops over data
- Things that would require many awkward XML operations
- Syntax: `<script href="file.js"/>` inside `<process>`, call with `<operation name="call" value="functionName"/>`

### Use JS as full process class when:
- The entire app logic is complex enough that XML process becomes unreadable
- You need fine-grained event handling
- Rare — most apps don't need this

### Rule of thumb
Start with XML. Only add JS steps for things XML can't do cleanly. Never use full JS class unless the user asks for it.

## Styling & Skinning

### Three layers (use in this order)
1. **`theme="name"`** on `<application>` — sets the base look. Options: aqua, fabric, glass, graphite, liquid, marble, sparse
2. **`look="value"`** on components — changes component appearance within the theme
3. **`style="css"` / `<style>` block** — fine-grained CSS overrides

### Look values per component
| Component | Look Values |
|-----------|-------------|
| Panel     | transparent, cell, white, alert, dark, title, light, window, plategrad, plate, gradient, inset, graphite, green, pink, purple |
| Button    | alert, classic, fabric, glass, graphite, marble |
| Input     | aqua, marble, fabric, glass, graphite, grid |
| ComboBox  | aqua, classic, marble, fabric, glass, graphite, grid |
| Grid      | default, graphite |
| TabStrip  | aqua, classic, marble, graphite |
| MenuBar   | aqua, marble, fabric, graphite, liquid |
| ToolBar   | aqua, marble, glass, graphite, liquid |

### Panel modes
| Mode | Use for |
|------|---------|
| (default) | Plain container |
| frame | Titled section with border |
| expander | Collapsible section |
| header | Subtle titled section |
| closeable | Closable tab in tabstrip |

### CSS styling
```xml
<!-- Inline CSS -->
<view ...>
  <style>
    #componentName { color: red; background: #f0f0f0; }
    #componentName:hover { background: #ddd; }
    .myClass { font-weight: bold; }
  </style>
  <panel>
    <label class="myClass" text="Styled"/>
    <panel style="margin: 10px; border: 1px solid #ccc;">...</panel>
  </panel>
</view>

<!-- External CSS (if href is set, inline content is ignored) -->
<style href="/assets/main.css"/>
```
- Target by `#componentName` (the `name` attribute)
- Target by `.className` (the `class` attribute)
- `style=""` attribute for inline CSS on any component
- `bgcolor=""` shorthand for background color
- External CSS via `href` for larger apps or reuse across views

## Math Expressions
- Prefix with `=`: `value="={$a}+{$b}"`
- Working operators: `+`, `-`, `*`, `**`, `%`, `(`, `)`
- **Division `/` is untested** — may conflict with XPath separator. Use JavaScript step if you need division.
- Aliases used in math must already be defined

## Component Gotchas
- **Combobox**: empty default value crashes. Always set a valid initial value or use `editable="true"`
- **sum()**: does not work in alias values. Use running totals with math expressions instead
- **Grid row match**: must match the child element name of the bound node, not the node itself

## Icons
- Syntax: `icon://name` or `icon://name?color=hex`
- Color is hex **without** the `#` prefix: `icon://star?color=FF5722`
- Use the `xios_icon` tool to search for icon names by keyword
