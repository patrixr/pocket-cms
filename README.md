# Pocket CMS

![](https://travis-ci.org/patrixr/pocket-cms.svg?branch=master)

### A pocket sized CMS written for Node and Express.

Designed as a non-intrusive middleware. Pocket offers :

* Automatic API generation based on schemas
* User and session management
* Admin panel
* Multi-db support (Currently Mongo and Nedb)
* File uploads

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

e.g

```javascript
const Pocket = require('pocket-cms');
const { Schema } = Pocket;

const carSchema = new Schema({
	fields: {
		brand: {
			type: 'text',
			maxLength: 64
		},
		noOfWheels: {
			type: 'number'
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

* `text|string`
	* `maxLength` - The maximum length of the string
* `number`
* `date`
* `email`
* `password`
* `object`
* `select|enum`  
	* `options` - **required** - A list of string options to select the value from
* `array|list`
	* `minItems` - The minimum number of items
	* `items` - An optional type of the items
* `map`
	* `items` - An optional type of the items
