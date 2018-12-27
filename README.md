# Pocket CMS

### A pocket sized CMS written for Node and Express.

Designed as a non-intrusive middleware. Pocket offers :

* Automatic API generation based on schemas
* User and session management
* Admin panel
* Multi-db support (Currently Mongo and Nedb)
* File uploads

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

## Datastores

Currently the following stores are available :

### Mongo

The mongodb adapter **requires** the following options :

| Key  | Description | Type |
| ------------- | ------------- | ------------- |
| **dbName**  | Name of the mongo database | String |
| **url** | Database url (e.g `user:password@localhost:27017`) | String |

### Disk

The disk adapter supports the following options :

| Key  | Description | Type | Defaults |
| ------------- | ------------- | ------------- | ------------- |
| **dataFolder**  | Folder in which the data will be stored | String | `${POCKET_HOME}/${ENV}_db` |

## Filestores

Currently Pocket only supports files saved on disk.
S3 support is on the roadmap

### Disk

| Key  | Description | Type | Defaults |
| ------------- | ------------- | ------------- | ------------- |
| **uploadFolder**  | Folder in which the files will be stored | String | `${POCKET_HOME}/${ENV}_db/uploads` |



