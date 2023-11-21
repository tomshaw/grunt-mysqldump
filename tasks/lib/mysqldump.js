/*
 * grunt-mysqldump
 * https://github.com/tomshaw/grunt-mysqldump
 *
 * Copyright (c) 2016 Tom Shaw
 * Licensed under the MIT license.
 */
'use strict';

var fs = require('fs');
var shell = require('shelljs');
var path = require('path');
var eachAsync = require('each-async');
var zlib = require('zlib');
var archiver = require('archiver');
var bytes = require('bytes');
var mysql = require('mysql');

module.exports = function (grunt) {

  var exports = {
    options: {}
  };

  exports.gzip = function (files, done) {
    exports.process(files, function (databases) {
      exports.init(databases, zlib.createGzip, '.gzip', done);
    });
  };

  exports.deflate = function (files, done) {
    exports.process(files, function (databases) {
      exports.init(databases, zlib.createDeflate, '.deflate', done);
    });
  };

  exports.deflateRaw = function (files, done) {
    exports.process(files, function (databases) {
      exports.init(databases, zlib.createDeflateRaw, '.deflate', done);
    });
  };

  exports.tar = function (files, done) {
    exports.process(files, function (databases) {
      exports.init(databases, 'tar', '.tar', done);
    });
  };

  exports.tgz = function (files, done) {
    exports.process(files, function (databases) {
      exports.init(databases, 'tgz', '.tgz', done);
    });
  };

  exports.zip = function (files, done) {
    exports.process(files, function (databases) {
      exports.init(databases, 'zip', '.zip', done);
    });
  };

  exports.sql = function (files, done) {
    exports.process(files, function (databases) {
      exports.init(databases, 'sql', '.sql', done);
    });
  };

  exports.process = function (files, done) {

    if (files.indexOf("*") > -1) {

      var options = exports.options;
      var forget = options.forget;

      console.log('forget', forget);

      var connection = mysql.createConnection({
        host: options.host,
        port: options.port,
        user: options.user,
        password: options.pass
      });

      connection.connect();

      connection.query('SHOW DATABASES', function (err, rows, fields) {
        if (err) throw err;

        var databases = [];
        for (var i = 0; i < rows.length; i++) {
          var db = rows[i].Database;
          if (forget.indexOf(db) > -1) continue;
          databases.push(db);
        }

        return done(databases);

      });

      connection.end();

    } else {
      return done(files);
    }

  };

  exports.init = function (files, algorithm, extension, done) {

    eachAsync(files, function (file, index, done) {

      var options = exports.options;
      var folder = options.dest;
      var dest = options.dest + file + '.sql';

      if (grunt.file.isDir(dest)) {
        return done();
      }

      grunt.file.mkdir(folder);

      var args = {
        user: options.user,
        pass: '--password="' + options.pass + '"',
        database: file,
        host: options.host,
        port: options.port,
        dest: dest,
        data: (options.data_only) ? '--no-create-info' : ''
      }

      var cmd = grunt.template.process("mysqldump -h <%= host %> -P <%= port %> -u <%= user %> <%= pass %> <%= data %> <%= database %> -r <%= dest %>", { data: args });

      shell.exec(cmd, {
        silent: true
      }, function (code, output) {

        if (code !== 0) {
          grunt.log.writeln('Warning: ' + String(file).cyan + ' code: (' + String(code).red + ') output: (' + String(output).red + ')');
          return done();
        }

        grunt.log.writeln('Exported: ' + String(dest).cyan + ' (' + exports.getSize(dest) + ')');

        if (options.compress) {
          exports.compress(dest, algorithm, extension, done);
        } else {
          return done();
        }

      });

    });
  };

  exports.compress = function (file, algorithm, extension, done) {

    if (grunt.util._.includes(['.gzip', '.deflate', '.deflateRaw'], extension) === true) {

      if (extension === '.gzip') {
        extension = '.gz';
      }

      var srcStream = fs.createReadStream(file);
      var destStream = fs.createWriteStream(file + extension);
      var compressor = algorithm.call(zlib, exports.options);

      compressor.on('error', function (err) {
        grunt.log.error(err);
        return done();
      });

      destStream.on('close', function () {
        grunt.log.writeln('Generated file: ' + String(file + extension).cyan + ' (' + exports.getSize(file + extension) + ')');
        exports.delete(file);
        return done();
      });

      srcStream.pipe(compressor).pipe(destStream);

    } else if (grunt.util._.includes(['.zip', '.tar', '.tgz'], extension) === true) {

      if (extension === '.tgz') {
        extension = '.tar.gz';
        algorithm = 'tar';
        exports.options.gzip = true;
        exports.options.gzipOptions = {
          level: exports.options.level
        };
      }

      var archive = archiver.create(algorithm, exports.options);

      var destStream = fs.createWriteStream(file + extension);

      archive.on('error', function (err) {
        grunt.fail.warn(err);
        return done();
      });

      archive.on('entry', function (file) {
        grunt.verbose.writeln(String(JSON.stringify(file)).red);
      });

      destStream.on('error', function (err) {
        grunt.fail.warn(err);
        return done();
      });

      destStream.on('close', function () {
        var size = archive.pointer();
        grunt.log.writeln('Archived: ' + String(file + extension).cyan + ' (' + bytes(size) + ')');
        exports.delete(file);
        return done();
      });

      archive.pipe(destStream);

      if (grunt.file.isFile(file)) {
        archive.file(file, {
          name: path.basename(file)
        });
      }

      archive.finalize();

    } else {
      grunt.fail.warn('Compress mode: ' + extension + ' is not supported.');
      return done();
    }

  }

  exports.delete = function (file) {
    if (grunt.file.isFile(file)) {
      try {
        grunt.file.delete(file);
      } catch (e) { }
    }
  };

  exports.getSize = function (file) {
    var size = 0;
    if (typeof file === 'string') {
      try {
        size = fs.statSync(file).size;
      } catch (e) { }
    }
    return bytes(size);
  };

  return exports;
};