# Pocket CMS

![](https://forthebadge.com/images/badges/uses-js.svg)
![](https://forthebadge.com/images/badges/made-with-vue.svg)
![](https://travis-ci.org/patrixr/pocket-cms.svg?branch=master)

### A pocket sized CMS written for Node and Express.

Designed as a non-intrusive middleware. Pocket offers :

* Automatic API generation
* Schema validation ([Pocket Schema](github.com/patrixr/pocket-schema))
* User and session management
* Admin panel
* Multi-db support (Currently Mongo and Nedb)
* File uploads
* Server stats

Features planned: 

* Logs
* API Keys
* Plugin support

![](http://g.recordit.co/nCibS69Xzw.gif)

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**  *generated with [DocToc](https://github.com/thlorenz/doctoc)*

- [Getting started](#getting-started)
- [Configuration](#configuration)
  - [Datastores](#datastores)
    - [Mongo](#mongo)
    - [Disk](#disk)
  - [Filestores](#filestores)
    - [Disk](#disk-1)
- [Using the CMS](#using-the-cms)
  - [Resources](#resources)
    - [Methods](#methods)
      - [Creating a record](#creating-a-record)
      - [Updating a record](#updating-a-record)
      - [Updating multiple records](#updating-multiple-records)
      - [Reading a single record](#reading-a-single-record)
      - [Reading multiple records](#reading-multiple-records)
      - [Removing a record](#removing-a-record)
      - [Removing multiple records](#removing-multiple-records)
      - [Attaching a file to a record](#attaching-a-file-to-a-record)
      - [Deleting an attachment](#deleting-an-attachment)
      - [Reading an attachment](#reading-an-attachment)
  - [Schema](#schema)
    - [CMS properties](#cms-properties)
    - [Indexes](#indexes)
    - [Hooks](#hooks)
  - [Users](#users)
    - [Groups](#groups)
  - [REST API](#rest-api)
    - [Authentication](#authentication)
    - [Resource management](#resource-management)
    - [ACL](#acl)
      - [Admins](#admins)
      - [Schema access configuration](#schema-access-configuration)
      - [Group access configuration](#group-access-configuration)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->

## Getting started

Firstly, install `pocket-cms` as a dependency of your project.

```bash
npm install --save pocket-mms
```

In your Node project, hook pocket to your express server :

```javascript
var express = require("express");
var Pocket = require("pocket-mms");

var app = express();
var cms = new Pocket();

app.use(cms.middleware());

app.listen(3000, () => { console.log('Server running'); })
```
Done ! A pocket cms is now running in your server.

## Configuration

Pocket takes an optional configuration object during construction.

e.g

```javascript
new Pocket({
    datastore: {
        adapter: 'mongo',
        options: {
            dbName: 'pocket_dev',
            url: 'localhost:27017'
        }
    }
})
```

The following options are available:

| Key  | Description | Type | Default value |
| ------------- | ------------- | ------------- | ------------- |
| **session**  | Authentication configuration |||
| session.secret  | JWT secret  | String | random |
| session.expiresIn | Session expiry time in seconds | Number | 60 days |
| **datastore** | Database configuration |||
| datastore.adapter | Available options : mongo, disk | String | disk |
| datastore.options | Datastore specific options | Object | |
| **filestore** | File upload configuration |||
| filestore.adapter | Available options: disk | String | disk |
| filestore.options | Filestore specific options | Object | |

### Datastores

Currently the following stores are available :

#### Mongo

The mongodb adapter **requires** the following options :

| Key  | Description | Type |
| ------------- | ------------- | ------------- |
| **dbName**  | Name of the mongo database | String |
| **url** | Database url (e.g `user:password@localhost:27017`) | String |

#### Disk

The disk adapter supports the following options :

| Key  | Description | Type | Defaults |
| ------------- | ------------- | ------------- | ------------- |
| **dataFolder**  | Folder in which the data will be stored | String | `${POCKET_HOME}/${ENV}_db` |

### Filestores

Currently Pocket only supports files saved on disk.
S3 support is on the roadmap

#### Disk

| Key  | Description | Type | Defaults |
| ------------- | ------------- | ------------- | ------------- |
| **uploadFolder**  | Folder in which the files will be stored | String | `${POCKET_HOME}/${ENV}_db/uploads` |



## Using the CMS

### Resources

Pocket uses the generic term `Resource` to define a data type within the CMS.
Each resource has :

* A schema
	* Enables validation of posted data
	* Allows the admin panel to generate a form to edit the records
* An automatically generated rest endpoint

Resources are created using the following CMS api :

```javascript
let cms = new Pocket();

cms.resource('cars', schema);
```


Resources are retrieved using the following CMS api :

```javascript
const cars = cms.resource('cars');

await cars.find({});
```

#### Methods


##### Creating a record

`await resource.create(payload, opts = {})` will create a record matching the payload parameter. Options :

* `skipValidation`  allows the record to be created without being validated against its schema. *Use with care*
* `userId` will set the `_createdBy` property of a record

##### Updating a record

`await resource.mergeOne(id, payload, opts = {})` will update the record specified by `id` by overriding the properties set in `payload`. Options :

* `skipValidation`  allows the record to be created without being validated against its schema. *Use with care*

##### Updating multiple records

`await resource.update(query, operations, options = {})` will update records specified by `query` with the `operations` formatted in a mongo like syntax. Options :

* `multi` will enable the update to run on multiple records. Defaults to true.

##### Reading a single record

`await resource.get(id)` will return the record specified by `id`

##### Reading multiple records

`await resource.find(query = {}, opts = {})` will return records that match the `query` argument. Options :

* `pageSize` and `page` will allow to retrieve paginated records

##### Removing a record

`await resource.removeOne(id)` will delete the record specified by `id`

##### Removing multiple records

`await resource.remove(query, opts = {})` will remove all elements that match the `query` argument. Options :

* `multi` will allow multiple records to be removed if set to true. Otherwise only one of them will be deleted

##### Attaching a file to a record

`await resource.attach(recordId, fileName, file)` will save the file specified by the `file` argument in the file store, add add it to the record's `_attachments` list. `file` can either be a **String** pointing to the file on disk or a **Stream**

##### Deleting an attachment

`await resource.deleteAttachment(recordId, attachmentId)` will delete the file from the file store and remove the attachment from its record

##### Reading an attachment

`await resource.readAttachment(attachmentId)` will return a node stream of the file


### Schema

Pocket exposes a `Schema` class which can be used to create a resource's schema.
More details can be found on the [Pocket Schema](https://github.com/patrixr/pocket-schema) repo.

e.g

```javascript
const Pocket = require('pocket-cms');
const { Schema } = Pocket;

const carSchema = new Schema({
    additionalProperties: false,
    fields: {
        name: {
	    type: 'string',
	    index: {
		unique: true
	    }
	}
	brand: {
	    type: 'text',
	    maxLength: 64
	},
	noOfWheels: {
	    type: 'number',
	    required: true,
	},
	color: {
	    type: 'select',
	    options: ['red', 'yellow', 'magenta']
	},
	tags: {
	    type: 'array',
	    items: { type: 'string' }
	}
    }
});

```

The following types are available :

* `any`

* `array|list`  - options:
	* `items?` A field definition of the expected array items

* `checkbox|boolean`

* `date`  - options:
	* `format?` The expected date format (defaults to YYYY-MM-DD)

* `datetime`

* `email`  - options:
	* `match?` A regular expression to match the email against

* `map`  - options:
	* `items?` A field definition of the expected map items

* `multiselect`  - options:
	* `options` List or options to select from. An async function can also be passed

* `number`  - options:
	* `min?` Minimum allowed value
	* `max?` Maximum allowed value

* `object|json`  - options:
	* `schema?` Schema used to validate the object against

* `password`  - options:
	* `minLength?` The minimum length of the password

* `select|enum`  - options:
	* `options` List or options to select from. An async function can also be passed

* `text|string`  - options:
	* `minLength?` The minimum length of the string
	* `maxLength?` The maximum length of the string
	* `match?` A regular expression to match the string against

* `time`

* `timestamp`

#### CMS properties

When records are created/updated the CMS automatically adds and keeps track of a number or *private* properties which **cannot** be updated manually. All those private properties start by underscore `_`.

Currently those are:

* `_id`
* `_createdAt`
* `_updatedAt`
* `_createdBy`
* `_attachments` the list of attachments

#### Indexes

To mark a field as a database index, its schema field supports the `index` parameter. Which can either be :

* A `true|false` value
* An object with the following properties :
	* **unique** `true|false`


Example :

```javascript
const Pocket = require('pocket-cms');
const { Schema } = Pocket;

const person = new Schema({
    fields: {
        name: {
            type: 'string',
	    index: {
	        unique: true
	}
    }
});
```

#### Hooks

Pre and Post hooks can be added to a schema which allow adding extra functionality and ACL to the CMS.

Available api :

* `schema.before(action, method)`
* `schema.after(action, method)`

Available methods

* `create`
* `remove`
* `update`
* `save`
* `validate`
* `read`

Example usage

```javascript
const Pocket = require('pocket-cms');
const { Schema } = Pocket;

const postSchema = new Schema({
    fields: {
        message: {
	    type: 'string',
	}
    }
})
.before('save', async ({ record }, ctx) => {
    const { user } = ctx;

    if (await userCheck(user, record) === false) {
        throw 'User should not save this record';
    }
});

const cms = new Pocket();

pocket.resource('posts', postSchema);
```

### Users

The Pocket CMS class exposes a user manager that can be used to create/remove and authenticate users.

e.g

```javascript
const Pocket = require('pocket-cms');

const cms = new Pocket();

// Creating a user
await pocket.users.create('username', 'password', [ 'users' ]);

// Authenticating a user
const user = await pocket.users.auth('username', 'password');

// Extracting a user from the JWT auth token
const user = await pocket.users.fromJWT(token)
```

The underlying resource is named `_users`

#### Groups

By default the following groups are created :

* `admins`
* `users`

Groups can be added by using the underlying resource `_groups`  

### REST API

For each resource created, a generic rest api is automatically created for it.

Here's a rundown of the different endpoints

#### Authentication

* `POST /users/signup` to create a user. The following JSON body is expected
	* `username`
	* `password`
	* `groups` (defaults to `['users']`)

* `POST /users/login` to log in a user.   
**Important**: This endpoint will return a Java Web Token, which should be included into following requests -> `Authorization: Bearer <token>`. The following JSON body is expected
	* `username`
	* `password`  

* `POST /users/logout` to logout out. **NOTE:** As authentication is done via JWT, this endpoint doesn't actually do anything. It exists as a placeholder for future additions (hooks/logs/etc)

* `GET /users/status` to retrieve the user and status of an existing JWT Token

#### Resource management

* `GET /rest/{resource}` lists records for the given resource. Available options :
	* `pageSize` - The number of records to return per page
	* `page` - The page to return

* `GET /rest/{resource}/{id}` returns a single record specified by `id`

* `POST /rest/{resource}` creates a record of the `resource` type

* `PUT /rest/{resource}/{id}` updates the record specified by `id` of the `resource` type

* `DELETE /rest/{resource}/{id} deletes the record specified by `id`

* `POST /rest/{resource}/{id}/attachments` uploads a file and a attach it to the record specified by `id`

* `GET /rest/{resource}/{id}/attachments/{attachmentId}` downloads the attachment of a record

* `DELETE /rest/{resource}/{id}/attachments/{attachmentId}` deletes the attachment of a record


The resource key of the endpoints listed above can all be prefixed with a user id to filter on records createdBy that user.  
  
e.g  
  
`GET /rest/users/:userId/{resource}/{id}` will return only records created by the user specified by `userId`


#### ACL

There are multiple rules and ways to control the access of resources by users.

We either `allow` or `deny` actions on certain resources.
The following actions exist:

* read
* create
* update
* remove

##### Admins

Users from the `admins` group are whitelisted and have permission to make any change to any resources.

Private CMS resources (prefixed with `_`) cannot be modified by any other group. Currently those are :

* `_users`
* `_groups`


##### Schema access configuration

A entire resource can be configured to only be accessible to a certain set of groups.

That is done on the schema level with the following 2 methods :
* `schema.allow(group, actions[])` 
* `deny(group, actions[])`  

**Note:** A wildcard `*` can be used as a group name to represent all of them

Example :

```javascript
const Pocket = require('pocket-cms');
const { Schema } = Pocket;

const postSchema = new Schema({
    fields: {
        message: {
        type: 'string'
        }
    }
})
.allow('users', [ 'read' ])
.allow('moderators', [ 'read', 'create', 'update', 'delete' ])
```
  

##### Group access configuration

A group can be given access to a resource through its `permissions` field.

e.g

```javascript

pocket.resource('_groups').create({
    name: 'moderators',
    permissions: {
        '*': ['read'],
        'posts': ['read', 'create', 'update', 'delete' ]
    }
});
```
