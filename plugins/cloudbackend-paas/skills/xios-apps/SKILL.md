---
name: xios-apps
description: Build or change a XIOS/3 application on CloudBackend PaaS - project layout, looking up components and operations before writing XML, reading existing projects, then upload_project and deploy. Use whenever the task involves XIOS/3 views, processes, an application manifest (index.xml), or a project or deployment on CloudBackend PaaS.
---

# XIOS/3 applications

The `cbemcp` server works with projects on CloudBackend PaaS: `whoami`, `list_projects`,
`read_project`, `validate_project` and `list_deployments` only read, `upload_project` and
`delete_files` change a project in the database, and `deploy` publishes it. This skill
covers getting a project onto CloudBackend PaaS; writing the XML is for the XIOS skills
that ship alongside it.

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

Check each file before uploading it with the validator that ships with `xios-views`:

```
node <xios-views skill folder>/validator/cli.js <file.xml>
```

It needs only Node.js. The `xios-views` skill lists forms it wrongly reports as errors;
`validate_project` is the schema check that counts for an upload.

If something is not in the skills, say so rather than guessing at attribute names: upload
validates against the schema and a guess usually comes back as a validation failure.

## Project layout

An application can be one file with its views and processes inline, as `xios-views`
shows, or split across files:

```
index.xml              the application manifest, root tag <application>
views/mainView.xml     root tag <view>
processes/main.xml     root tag <process>
locale/en_US.xml       optional
```

Deploying needs the manifest at `index.xml`. It ties the files together, and references
are relative to the project root:

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

## Look before you change

The read-only tools are always safe to call, so use them instead of assuming:

- `list_projects` to find the project the user means, or to check a name is free before
  creating one.
- `read_project` to change a project that is not on disk. Without `paths` it lists the
  files; with `paths` it returns them in the same `{path, content, encoding}` form
  `upload_project` takes, so a file can be edited and sent back as is.
- `validate_project` to check files before uploading them. With `project_name`, files you
  do not send are read from the uploaded project, so one changed view can be checked
  against the rest.
- `list_deployments` for an application's URL, or to tell the user what a deploy would
  replace. `whoami` for which user and tenant the tools act as.

## Upload and deploy

`upload_project` takes a `project_name` and a list of files with paths relative to the
project root. It writes to `home://Applications/<project_name>/` by default, or
`tenant://Applications/<project_name>/` with `destination_db: "tenant"` for a project
shared with the tenant. Files that already exist are overwritten and files that are not
sent are left alone, so a fix can be a single file rather than the whole project.

It refuses to write into a project that already exists unless `update_existing` is true.
Set it for a project you created earlier in the conversation or one the user asked you to
change. If the refusal is for a project you did not expect to exist, ask the user whether
to overwrite it or pick another name rather than setting the flag.

Images, fonts and other binary files go in the same call: send the content as base64 with
`encoding: "base64"`. A binary file sent as text is refused.

Uploading never removes anything, so after renaming or dropping a file, remove the old one
with `delete_files`. It deletes files, not folders, and validates what is left, so it
reports a file that something still references.

It validates by default: the manifest and everything reachable from it through
`xlink:href` are checked against the schema, and other referenced files have to exist. A
failure names the file and the reason, so fix and re-upload rather than deploying anyway.

`deploy` then publishes it. Two things to know:

- `deployment_name` may only contain lowercase alphanumeric characters. If the project
  name has capitals, a hyphen or a space, pass `deployment_name` explicitly, eg. project
  `HelloWorld` deploys as `helloworld`.
- Pass `source_db` only when the same project name exists in both `home://Applications/`
  and `tenant://Applications/`.

Deploying requires `index.xml` with an `<application>` root tag; a project without one is
just files in the database.

## Ask before publishing or removing

Uploading is part of developing: it publishes nothing, so upload and re-upload as often as
validation needs. Deploying and deleting are not, so check with the user first:

- Never call `deploy` unless the user asked for a deploy in this conversation or agreed to
  one. After an upload validates, ask whether they want it deployed, and say which
  deployment name it would get. A redeploy replaces the version that is live.
- Ask before uploading with `destination_db: "tenant"`, since that shares the project with
  everyone in the tenant, and a deploy from there is public rather than private.
- An earlier "yes, deploy it" covers that deploy, not every later change. Ask again after
  further edits unless the user said to keep deploying.
- Ask before `delete_files`, unless the user asked for the deletion or the files are ones
  you created or renamed in this conversation.
- Ask before overwriting a project you did not create (see `update_existing` above).
