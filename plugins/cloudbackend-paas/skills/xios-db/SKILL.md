---
name: xios-db
description: Store, find and share application data in CloudBackend from an XIOS app - datatypes, folders, documents, searching with predicate paths, live updates and folder rights. Use when an XIOS app keeps records on tenant://, home:// or a group drive, lists or searches them, or several users write the same data. Not for local:// (see xios-process, files).
---

# CloudBackend data in XIOS apps

Records are XML documents in folders on a drive: `tenant://` (shared by the tenant), `home://` (the user's), a group drive (`Store-S014://`). A datatype makes their fields searchable.

## Datatypes first

Without a datatype the server finds a document only by its name and dates. Make one per kind of record before the app saves any:

```xml
<operation name="database" value="tenant://Settings/Datatypes/">
  <create type="object" name="Sale.xdt" rename="keep">
    <content type="text/xml">
      <type xmlns="https://cloudbackend.com/datatype.xsd" name="Sale" mime="text/xml" element="sale">
        <description>A receipt</description>
        <index>
          <key name="number" xpath="/sale/@number"/>
          <key name="cashier" xpath="/sale/@cashier"/>
          <key name="total" xpath="/sale/@total"/>
        </index>
        <listviews/>
      </type>
    </content>
  </create>
</operation>
```

- Only the Owner and Administrator roles may write `tenant://Settings/Datatypes`: an admin installs it once (CloudBackend PaaS's Datatypes page, or a setup step the admin runs). The app's normal users can not.
- It matches documents by `mime` and root `element`. One `<key>` per field to search, sort or show in a list; `index="false"` keeps it for lists only.
- Key names: a letter or `_` first, no spaces or `:`. Reserved, silently not indexed: author, category, content, contributor, date, email, entry, feed, generator, icon, id, link, logo, name, published, rights, size, source, subtitle, summary, title, updated, uri. Use `label`, `section`.
- A document saved before its datatype or key existed gets the keys when it is saved again.
- In a listing each key is a child of the document's `db:object`: `{total}` in a list rule or table column.

## Folders and names

- Name files for what you look up: `R-20261103-0001.xml`. A name prefix and a date are the fastest searches.
- A listing gives 100 entries: `?count=1000` (the most) and `?offset=` page on. A total stops at 30,000.
- Keep a folder small enough to list; archive by year, then month, then day (`Sales/2026/11/03/`). Keep subfolders well under 1,000 per folder.
- Rights: tenant members can only read `tenant://` folders by default. Give the roles that write rights on the folder: `<acl read="true" write="true" delete="false" changeACL="false"><role group="tenant/Store-S014">Cashier</role></acl>` in a `database` operation on it.

## Writing shared data

- Saves are last-writer-wins: no versions, no locks. Shared data is add-only: one new document per sale, move or event; totals are added up.
- `<create type="object" name="R-20261103-0042.xml" rename="false">` fails if the name is taken, and only one client wins: use it for gap-free numbers and safe retries. `rename="true"` picks a free name instead; `rename="keep"` keeps the existing document.
- In `create` content a `{xml(ref)}` does not become elements: create the document, then `change` append and `save`.
- `<listen event="*" step="id"/>` in a `database` operation on a folder runs the step when any client adds, changes or removes a document there; `delay="ms"` gathers bursts.

## Searching

A predicate after the folder searches its documents by their keys and name, and loads and binds like the folder:

```xml
<alias name="hits" value="tenant://App/Sales/2026/11/03/[total > 50 and payment = 'Card']" model="value"/>
<operation name="bind" value="{$hits}">
  <component view="v1" name="sales"/>
</operation>
```

with rows matching `db:object` (`<row match="db:object" key="@xlink:href"/>` in a table). A row's document is `{#v1#sales#@xlink:href}`.

- `=`, `!=`, `<`, `<=`, `>`, `>=`, `and`, `or`, `not()`, `starts-with(@name, 'R-2026')`; decimals work.
- One folder per path, not its subfolders. `!=`, `not()` and negative numbers make the server send the whole folder for the browser to filter: fine for a day, slow for a big folder.
- Across many folders, sorting by a key, or paging a big result: [query.md](query.md).
