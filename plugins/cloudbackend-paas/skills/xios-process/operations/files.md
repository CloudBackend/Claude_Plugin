# save

`<operation name="save" value="ref"/>`: writes a drive document (`local://app/x.xml`) back
`<create path="{}"/>`: in a save of a `create` document: makes that file once (its folder must exist; a taken name fails); without it the Save dialog opens

- `local://` (the browser's drive, no login) starts empty: make the folder first, `database` on `local://` with `<create type="container" name="app" rename="keep"/>`. Data kept across runs: make the file so too, then bind, change, save it.

# database

`<operation name="database" value="ref"><create type="container|object" name="{}" rename="keep" alias="id"><content>XML or text</content></create></operation>`: `value` is the folder, ending in `/`; `rename="keep"` keeps an existing file (else a free name is picked); `alias` gets the name
`<delete silent="true" permanent="true"/>`, `<move to="{}"/>`, `<copy to="{}"/>`, `<rename to="{}"/>`, `<upload to="{}"/>`: `value` is the file, folder or a file list's selected rows; `to` a folder ending in `/`, for rename the new name

- `<delete>` asks the user unless `silent="true"`; without `permanent` it goes to the trashcan.

# download

`<operation name="download" value="ref" filename="{}" type="{}"/>`: `type` is a MIME type
