# XIOS/3 Data, Channels & Database Reference

## Data Virtualization Layer
All data accessed via URL protocols, presented as XML regardless of source.

### Protocols
- `home://` — personal database (user's own storage)
- `tenant://` — shared tenant database (organization-wide)
- `https://` — external HTTPS resources
- `channelName://` — custom channel endpoints
- `icon://` — icon resources
- `agent://` — in-process document references

### Path Format
```
{protocol}://container/document.xml
home://Documents/myfile.xml
tenant://Applications/myApp.xml
tenant://MyData/records.xml
```

---

## CloudBackend Database

### Structure
Database > Containers (folders) > Objects (files)

### Namespace
```xml
xmlns:db="https://cloudbackend.com/db.xsd"
```

### Query Results Format
```xml
<db:result>
  <db:container name="Folder1" id="..." xlink:href="tenant://Folder1"/>
  <db:object name="doc.xml" id="..." updated="2025-01-01T10:00:00Z" xlink:href="tenant://Folder1/doc.xml"/>
</db:result>
```

### Key Elements
`db:databases`, `db:database`, `db:result`, `db:container`, `db:object`, `db:paging`, `db:streams`, `db:stream`, `db:acl`

### Permissions
- Owner, Administrator, Member roles
- Objects inherit container rights unless overridden with ACL
- ACL set at creation time:
```xml
<create type="container" name="Shared">
  <acl>
    <group id="{$groupId}" read="true" write="true" delete="true" changeACL="false"/>
  </acl>
</create>
```

### Object Size
Up to 2GB per stream. Objects can have unlimited streams.

---

## Channel Setup

### HTTPS Channel
```xml
<step id="start">
  <operation name="channel">
    <name>https</name>
    <title>HTTPS</title>
    <protocol>HTTPS</protocol>
  </operation>
</step>
```

### Proxy Channel (secure API calls)
```xml
<operation name="channel">
  <name>channelName</name>
  <proxy>proxyName</proxy>
  <title>API Title</title>
  <protocol>PROXY</protocol>
  <adapter path="/" type="CompactJSON"/>
</operation>
```

---

## Proxy Configuration
Stored at `tenant://Settings/Proxy/`
```xml
<proxy name="NAME" service="SERVICE" xmlns="https://cloudbackend.com/proxy.xsd">
  <http-domain allow-override="false">https://api.example.com</http-domain>
  <http-path allow-override="false">/v1</http-path>
  <http-header allow-override="false" name="Authorization" value="Bearer ${SECRET_KEY}"/>
  <http-header allow-override="false" name="Content-Type" value="application/json"/>
  <http-data allow-override="true"/>
  <variable allow-override="false" name="VAR1" value="data"/>
</proxy>
```
Secrets stored securely, referenced as `${proxyName_key}`.

---

## API Calls

### GET
```xml
<operation name="callService" value="channelName://path">
  <wait>true</wait>
  <document>alias://response</document>
  <method>GET</method>
</operation>
<alias name="result" value="alias://response#/xpath"/>
```

### POST with JSON
```xml
<operation name="callService" value="channelName://path">
  <wait>true</wait>
  <document>alias://response</document>
  <method>POST</method>
  <body type="json" eval="pct">{ "key": "(%$aliasValue%)" }</body>
</operation>
```
Use `eval="pct"` with `(%$alias%)` for percent-encoded alias evaluation in JSON bodies.

---

## Database Operations

### Create container
```xml
<operation name="database" value="tenant://">
  <create type="container" name="MyFolder"/>
</operation>
```

### Create object with XML content
```xml
<operation name="database" value="tenant://MyFolder">
  <create type="object" name="data.xml" rename="false">
    <content type="text/xml"><root><item name="test"/></root></content>
  </create>
</operation>
```

### Delete permanently
```xml
<operation name="database" value="$objectUrl">
  <delete permanent="true"/>
</operation>
```

### Move object
```xml
<operation name="database" value="$sourceUrl">
  <move to="{$targetFolder}" silent="false" progress="true"/>
</operation>
```

---

## Data Binding Patterns

### Bind document to component
```xml
<operation name="bind" value="tenant://path/doc.xml">
  <component view="viewName" name="compName" select="xpath"/>
</operation>
```

### Bind container listing
```xml
<operation name="bind" value="tenant://MyFolder">
  <component view="v" name="iconlist1" select="/db:result"/>
</operation>
```

### Bind selection to label
```xml
<operation name="bind" value="#viewName#sourceComp">
  <component view="viewName" name="targetLabel" select="fieldName" model="selection"/>
</operation>
```

### In-memory document
```xml
<alias name="memDoc" model="newsilent">
  <root><item name="initial"/></root>
</alias>
<operation name="bind" value="$memDoc">
  <component view="v" name="comp1"/>
</operation>
```

---

## Datatypes
Custom type definitions for objects:
```xml
<type name="TypeName" element="rootElement" mime="text/xml" xmlns="https://cloudbackend.com/datatype.xsd">
  <description>Description</description>
  <icon>icon://iconname</icon>
  <index>
    <key name="field1" index="true" xpath="/root/field1"/>
    <key name="field2" index="false" xpath="/root/field2"/>
  </index>
  <search>@name</search>
</type>
```

---

## System References
- `#Profile#/profile/userid` — current user ID
- `#Profile#/profile/username` — current username
- `#Profile#/profile/locale` — user locale
- `#GroupManager#/db:group/db:group[@name='tenant']/@id` — tenant group ID
- `host://.url#/url/param[@key='paramName']` — URL query parameter
