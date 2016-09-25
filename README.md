# grunt-mysqldump

> Grunt plugin for dumping and archiving MySQL databases. Supports exporting and archiving multiple databases in a single operation. Runs asynchronously and extremely fast. Outputs export and compression information as each operation completes. Tested on moderate to large size databases without any problems. 

## Getting Started
This plugin requires Grunt `>=0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-mysqldump --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-mysqldump');
```

## The "mysqldump" task

### Overview
In your project's Gruntfile, add a section named `mysqldump` to the data object passed into `grunt.initConfig()`.

```js
db: grunt.file.readJSON('config/database.json'),    
mysqldump: {
  dist: {
    user: '<%= db.local.user %>',
    pass: '<%= db.local.pass %>',
    host: '<%= db.local.host %>',
    port: '<%= db.local.port %>',
    dest: 'backup/',
    options: {
      compress: 'gzip'
    },
    databases: [
      'my_forum',
      'my_blog',
      'employees',
      'sakila'
    ],
  },
},
```

### Wildcard Usage
To dump all available databases simply use an asterisk aka wildcard. When using the wildcard flag you have the option to ignore specific databases by creating an ignore array.

```js
db: grunt.file.readJSON('config/database.json'),    
mysqldump: {
  dist: {
    user: '<%= db.local.user %>',
    pass: '<%= db.local.pass %>',
    host: '<%= db.local.host %>',
    port: '<%= db.local.port %>',
    dest: 'backup/',
    options: {
      compress: true,
      algorithm: 'zip',
      level: 5,
      both: true
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
### Arguments

#### user

The database user.

#### pass

The user's password.

#### host

The host of the database.

#### port

The port where the database is running, mostly 3306.

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

#### both

Type: `Boolean`

Default: `false`

Required: `false`

You have the option of saving both the sql dump file and the compressed file. Only relevant when archiving.

#### type

Type: `String`

Default: `both`

Required: `false`

Currently supports `data only`, `schema only` or `both`.

#### ignore

Type: `Array`

An array of database names to ignore when exporting. Valid when using a wildcard.

### Running 
To run all tasks type `grunt mysqldump` 

### Awesome Libraries Used

+ [shelljs](https://github.com/arturadib/shelljs) - Portable Unix shell commands for Node.js.
+ [node-archiver](https://github.com/ctalkington/node-archiver) - A streaming interface for archive generation.
+ [each-async](https://github.com/sindresorhus/each-async) - Async concurrent iterator (async forEach).
+ [bytes.js](https://github.com/visionmedia/bytes.js) - Node byte string parser.
+ [mysql](https://github.com/felixge/node-mysql) - A pure node.js JavaScript Client implementing the MySql protocol.

### License

### (The MIT License)

Copyright © 2016 [tom@visfx.me](mailto:tom@visfx.me) 

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the ‘Software’), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED ‘AS IS’, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
