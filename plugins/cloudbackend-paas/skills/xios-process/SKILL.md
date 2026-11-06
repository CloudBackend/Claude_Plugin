---
name: xios-process
description: Write XIOS process logic (process, trigger, step, alias, XIOS expressions and XPath, and the Core operations such as action, bind, change, decision, call, confirm, save, database) with their current API only. Use when writing or editing the process of an XIOS application, choosing an operation, or writing {...} expressions, references like `#view#comp`, `$alias` and `!`, or XPath tests.
---

# Writing XIOS processes

`<trigger view="id" component="id" event="id" step="id"><param name="{}" value="ref"/></trigger>`: runs the step on the component's event; without `component`, on the view's
`<step id="id" error="id">operations, if, alias</step>`: `error` runs that step instead when an operation fails; `success` and `goto` run one after
`<alias name="id" value="ref"/>`: sets `$name`

## Rules

Read the files you will need in one go, at the start: for a new app the three language files below (not `functions.md`) and the operation groups ui, data, flow and files.

In the forms an attribute's value is its language: **ref** names data (`#doc`, `$alias`, `!`, `#view#comp`); **{}** is text whose `{...}` are filled; **xpath** is XPath 1.0 once its `{...}` are filled; **id** a literal name; **n** a number; else the allowed values.

- A trigger queues its step: a process runs one step at a time, a step its children in order, each waiting for the one before. The step `start` (or `<process step>`) runs first; a step id may name a step of any process of the application.
- A failed operation is logged and the step goes on, unless the step has `error="id"`; `error=""` ignores failures.
- Logic stays in the process: state in `model="value"` aliases, branches in `<if>`/decision, sums in `{…}`: `<if value="#v1" test="'{$op}' = 'add'"><alias name="cur" value="{$acc + $cur}" model="value"/></if>`.
- JS only for what that can't do: `<script href="steps.js"/>` makes its exports steps, `step="name"` runs `name(evt, context)`.
- Own operations: xios-extend.

# Language

- [Triggers](language/trigger.md) - events, keys, what `!` holds, `<param>`
- [Aliases](language/alias.md) - models, `when`, scope, reading `$name`
- [Expressions](language/expressions.md) - XPath, rules and XIOS, references, `{...}`, operators, functions, traps
- [Expression functions](language/functions.md) - every other function; read it only when you need one

# Operations

Use only these operations, as their group file writes them.

- [`action`, `callMethod`, `setSelection`](operations/ui.md) - set, show, hide components, field states; call methods; select rows
- [`bind`, `change`, `foreach`, `create`](operations/data.md) - bind, edit (add, set text, delete, move), loop, in-memory documents
- [`decision`, `call`, `async`, `confirm`, `debug`](operations/flow.md) - branch (`<if>`), run steps, timers, dialogs, log
- [`save`, `database`, `download`](operations/files.md) - save, files and folders on a drive, download
- [`open`, `close`, `config`, `system`, `callService`](operations/apps.md) - views and applications, language, settings, clipboard, HTTP
- [`channel`, `login`, `groups`, `friends`, `tenant`, `mail`, `share`, `stats`](operations/cloudbackend.md) - CloudBackend services (need a signed-in channel)
