# grunt-mysqldump

[![Version npm](https://img.shields.io/npm/v/grunt-mysqldump.svg)](https://www.npmjs.com/package/grunt-mysqldump)
[![Downloads npm](https://img.shields.io/npm/dt/grunt-mysqldump.svg)](https://www.npmjs.com/package/grunt-mysqldump)
[![MIT license](https://img.shields.io/npm/l/grunt-mysqldump.svg)](https://opensource.org/licenses/MIT)

> Grunt plugin for dumping and archiving MySQL databases. Supports exporting and archiving multiple databases in a single operation. Runs asynchronously and extremely fast. Outputs export and compression information as each operation completes. Tested on moderate to large size databases without any problems. 

Install the plugin with this command:

```shell
npm install grunt-mysqldump --save-dev
```

Enabled the plugin inside your Gruntfile:

```js
grunt.loadNpmTasks('grunt-mysqldump');
```

To run the task issue the following command.

```sh
grunt mysqldump
```

## The MySQL Dump Task
In your project's Gruntfile, add a section named `mysqldump` to the data object passed into `grunt.initConfig()`.

```js
db: grunt.file.readJSON('config/database.json'),    
```

```js  
mysqldump: {
  dist: {
    user: '<%= db.local.user %>',
    pass: '<%= db.local.pass %>',
    host: '<%= db.local.host %>',
    port: '<%= db.local.port %>',
    dest: 'exports/',
    options: {
      compress: 'gzip'
    },
    databases: [
      'sakila',
      'world'
      'employees'
    ],
  },
},
```
Example config/database.json

```json
{
  "local": {
    "username": "root",
    "password": "password",
    "hostname": "127.0.0.1",
    "port": "3306"
  }
}
```

### Wildcard Usage
Dump all your databases by using an asterisk aka wildcard. 

> Note: When using the wildcard flag you have the option to ignore specific databases by creating an ignore array.

```js 
mysqldump: {
  dist: {
    user: '<%= db.local.user %>',
    pass: '<%= db.local.pass %>',
    host: '<%= db.local.host %>',
    port: '<%= db.local.port %>',
    dest: 'backups/',
    options: {
      compress: true,
      algorithm: 'zip',
      level: 5,
      data_only: true
    },
    databases: [
      '*'
    ],
    ignore: [
      'information_schema',
      'performance_schema',
      'phpmyadmin',
      'mysql',
      'sakila',
      'world'
    ],
  },
},
```
---

### Arguments

#### user

The database user.

#### pass

The user's password.

#### host

The host of the database.

#### port

The port where the database is running normally 3306.

#### dest

The destination folder to write the dump to.

### Options

#### compress

Type: `Boolean`

Default: `false`

Required: `false`

Set to false for no compression. Will only perform a mysqldump of the target database files.

#### algorithm

Type: `String`

Default: `zip`

Required: `false`

Currently supports `gzip`, `deflate`, `deflateRaw`, `tar`, `tgz` and `zip`.

#### level

Type: `Integer`

Default: `1`

Required: `false`

Sets the level of archive compression.

#### data_only

Type: `Boolean`

Default: false

Required: `false`

Suppress the `CREATE TABLE` statements from the output.

#### ignore

Type: `Array`

An array of database names to ignore when exporting. Valid when using a wildcard.

---

### Awesome Libraries Used

+ [shelljs](https://github.com/arturadib/shelljs) - Portable Unix shell commands for Node.js.
+ [node-archiver](https://github.com/ctalkington/node-archiver) - A streaming interface for archive generation.
+ [each-async](https://github.com/sindresorhus/each-async) - Async concurrent iterator (async forEach).
+ [bytes.js](https://github.com/visionmedia/bytes.js) - Node byte string parser.
+ [mysql](https://github.com/felixge/node-mysql) - A pure node.js JavaScript Client implementing the MySql protocol.

## License

The MIT License (MIT). See [License File](LICENSE) for more information.
