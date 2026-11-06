# Queries from a JS step

For what a predicate path can not do: many folders in one search, sorting by a key, paging a big result.

In a step from `<script href="steps.js"/>`:

```js
export async function findSales(evt, context) {
  const cid = (await sys.docMng.getDocument(folder + "/")).doc.documentElement.getAttribute("id");
  const result = await new Promise((resolve, reject) => {
    sys.baxide.queryContainer("+cashier:tomas -payment:Cash", [cid], { offset: 0, count: 500, order: "s1", numeric: "true", ascending: "false" })
      .addCallbacks(resolve, reject);
  });
  // result: a db:result with db:paging @total and one db:object per hit, carrying its keys
}
```

Bind a result: `sys.docMng.createTempDocument("#hits", result, true)` replaces `#hits` in place.

## Query terms

- `key:value`, `key:pre*` (a prefix), `title:R-20261103-*` (the file name), `pubyear:2026`, `pubmonth:11`; `key>n`, `key<n`.
- `+term` must match, `-term` must not. Write `+` on every term that must match: plain terms are OR'd, even with different keys. `AND`, `OR`, `NOT` and brackets are not operators.
- A query fails, rather than returning no hits, when a `+` term matches nothing in the folders: treat that error as no hits.
- Decimals: the server splits `39.80` at the dot, so `total:39.80` finds nothing and `total>50` matches 39.80. Ask for the whole part (`total:39`) and check the value, or store whole cents (`3980`).
- A value in quotes means all its words, in any order.

## Folders and order

- A query searches only the folders whose ids it gets, not their subfolders; list the tree for the ids. About 3 ms per folder; split hundreds of folders over parallel queries (16 queries of about 60 folders).
- `count` is at most 1000; `offset` pages on.
- `order`: `title`, `published`, `updated`, `length`, or `s1` to `s4` (index keys named `s1` to `s4` in the datatype); `numeric: "true"` sorts numbers as numbers; `ascending: "false"` reverses. Without `order` the order is by relevance.
