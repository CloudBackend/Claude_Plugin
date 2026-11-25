---
name: xios-apps
description: Build or change a XIOS/3 application on CloudBackend PaaS - project layout, looking up components and operations before writing XML, finding and reading existing projects (home, tenant or a project group), then upload_project and validation. Deploying is done by the user in CloudBackend PaaS. Use whenever the task involves XIOS/3 views, processes, an application manifest (index.xml), or a project, project group or deployment on CloudBackend PaaS.
---

# XIOS/3 applications

The `cbemcp` server works with projects on CloudBackend PaaS: `whoami`, `list_projects`,
`list_project_groups`, `read_project` and `list_deployments` only read,
and `upload_project` and `delete_files` change a project in the database. There is no
deploy tool: the user publishes an application from CloudBackend PaaS. This skill covers
getting a project onto CloudBackend PaaS ready to deploy; writing the XML is for the XIOS
skills that ship alongside it.

## Write the XML with the XIOS skills

XIOS/3 is XML with a schema behind it, and attribute names do not follow from the tag
names. Before writing or changing XML, load the skill for that part and use only the
current API it lists:

| Writing                                              | Skill          |
|------------------------------------------------------|----------------|
| the application, views, panels and Core components   | `xios-views`   |
| processes, triggers, aliases, operations, `{...}`    | `xios-process` |
| a theme or an app's CSS                              | `xios-theme`   |
| a new component or operation of your own             | `xios-extend`  |
| records on `tenant://`, `home://` or a group drive   | `xios-db`      |

If Node.js is installed, check each file before uploading it with the validator that
ships with `xios-views`:

```
node <xios-views skill folder>/validator/cli.js <file.xml>
```

It catches unknown attributes that the schema lets through, and the `xios-views` skill
lists forms it wrongly reports as errors. Node.js is optional: the plugin's session-start
note says whether it is installed. Without it, skip the validator and the other node, npm
or npx steps in the XIOS skills, and tell the user once that installing Node.js adds them.
The schema check `upload_project` does needs nothing installed.

If something is not in the skills, say so rather than guessing at attribute names: upload
validates against the schema by default, and a guess usually comes back as a validation
failure.

## Project layout

An application can be one file with its views and processes inline, as `xios-views`
shows, or split across files:

```
index.xml              the application manifest, root tag <application>
views/mainView.xml     root tag <view>
processes/main.xml     root tag <process>
locale/en_US.xml       optional
```

An application needs the manifest at `index.xml` to be deployed. It ties the files
together, and references are relative to the project root:

```xml
<?xml version="1.0" encoding="utf-8"?>
<application name="Hello World" xmlns:xlink="http://www.w3.org/1999/xlink">
  <about author="..." version="1.0">
    <description>What this application is</description>
  </about>
  <view xlink:type="simple" xlink:actuate="onLoad" xlink:href="views/mainView.xml"/>
  <process xlink:type="simple" xlink:actuate="onLoad" xlink:href="processes/main.xml"/>
</application>
```

## Where a project lives

A project is in one of three places:

| Where                          | Shared with              | `source_db` / `destination_db` | Deployed by the user from |
|--------------------------------|--------------------------|--------------------------------|---------------------------|
| `home://Applications/<name>/`  | only the user            | `home` (the default)           | CloudBackend PaaS         |
| `tenant://Applications/<name>/`| everyone in the tenant   | `tenant`                       | CloudBackend PaaS         |
| `p<id>://Development/<name>/`  | the project group's members | `project`, with `project_group` | the Deployments board in CloudBackend PaaS |

A project group is a project in CloudBackend PaaS with a drive of its own, `p<id>://`.
Most work now happens in project groups, so when the user names a project, look in all
three: `list_projects` with no arguments covers them, and `list_project_groups` lists the
groups the user is in, their role there and their apps. To reach a group's app, pass
`source_db` (or `destination_db` for an upload) `"project"` and `project_group`, the
group's name or id. An app name in a project group may only have letters, digits, spaces
and `_ . -`.

## Look before you change

The read-only tools are always safe to call, so use them instead of assuming:

- `list_projects` to find the project the user means, or to check a name is free before
  creating one. `list_project_groups` for the user's project groups and their role in each.
- `read_project` to change a project that is not on disk. Without `paths` it lists the
  files; with `paths` it returns them in the same `{path, content, encoding}` form
  `upload_project` takes, so a file can be edited and sent back as is.
- `list_deployments` for an application's URL, or to tell the user what deploying would
  replace. `whoami` for which user and tenant the tools act as.

## Upload

`upload_project` takes a `project_name` and a list of files with paths relative to the
project root. It writes to `home://Applications/<project_name>/` by default,
`tenant://Applications/<project_name>/` with `destination_db: "tenant"` for a project
shared with the tenant, or `p<id>://Development/<project_name>/` with
`destination_db: "project"` and `project_group` for an app in a project group. Files that already exist are overwritten and files that are not
sent are left alone, so a fix can be a single file rather than the whole project.

It refuses to write into a project that already exists unless `update_existing` is true.
Set it for a project you created earlier in the conversation or one the user asked you to
change. If the refusal is for a project you did not expect to exist, ask the user whether
to overwrite it or pick another name rather than setting the flag.

Images, fonts and other binary files go in the same call: send the content as base64 with
`encoding: "base64"`. A binary file sent as text is refused.

Uploading never removes anything, so after renaming or dropping a file, remove the old one
with `delete_files`. It deletes files, not folders, and by default validates what is
left, so it reports a file that something still references.

Both tools validate by default: the manifest and everything reachable from it through
`xlink:href` are checked against the schema, and other referenced files have to exist. A
failure names the file and the reason, so fix and re-upload until it validates. Validation
is optional: pass `validate: false` to skip it, for example while uploading a project in
parts whose manifest refers to files not sent yet. Validate before telling the user the
project is ready to deploy.

## Deploying is for the user

The `cbemcp` server has no deploy tool, so Claude cannot publish an application. Once an
upload validates, tell the user the project is ready and that they deploy it from
CloudBackend PaaS: a home or tenant project from there, and an app in a project group by
moving it to Test, and from Test to Live, on the Deployments board, which freezes and
fingerprints the code. Say which project and where it was uploaded, and use
`list_deployments` to say what is deployed now and would be replaced. Do not offer to
deploy it yourself.

A project needs `index.xml` with an `<application>` root tag to be deployed; without one
it is just files in the database.

## Ask before sharing or removing

Uploading is part of developing: it publishes nothing, so upload and re-upload as often as
validation needs. Sharing and deleting are not, so check with the user first:

- Ask before uploading with `destination_db: "tenant"`, since that shares the project with
  everyone in the tenant, and a deploy from there is public rather than private.
- Ask before uploading into or deleting from a project group the user did not name in
  this conversation: its members share its files, and what is uploaded becomes the
  project's code. If `list_project_groups` shows the user is not an Owner or
  Administrator there, say so before writing, as they may not be allowed to.
- Ask before `delete_files`, unless the user asked for the deletion or the files are ones
  you created or renamed in this conversation.
- Ask before overwriting a project you did not create (see `update_existing` above).
