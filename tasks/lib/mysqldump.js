'use strict';

const fs = require('fs');
const shell = require('shelljs');
const path = require('path');
const zlib = require('zlib');
const archiver = require('archiver');
const bytes = require('bytes');
const mysql = require('mysql');

module.exports = function (grunt) {

  /**
   * @exports
   * @type {Object}
   */
  const exports = {
    options: {}
  };

  /**
   * @method gzip
   * @param {Array} files
   * @returns {Promise}
   */
  exports.gzip = async function (files) {
    try {
      const databases = await exports.process(files);
      exports.init(databases, zlib.createGzip, '.gzip');
    } catch (err) {
      grunt.log.error(err);
    }
  };

  /**
   * @method deflate
   * @param {Array} files
   * @returns {Promise}
   */
  exports.deflate = async function (files) {
    try {
      const databases = await exports.process(files);
      exports.init(databases, zlib.createDeflate, '.deflate');
    } catch (err) {
      grunt.log.error(err);
    }
  };

  /**
   * @method deflateRaw
   * @param {Array} files
   * @returns {Promise}
   */
  exports.deflateRaw = async function (files) {
    try {
      const databases = await exports.process(files);
      exports.init(databases, zlib.createDeflateRaw, '.deflateRaw');
    } catch (err) {
      grunt.log.error(err);
    }
  };

  /**
   * @method tar
   * @param {Array} files
   * @returns {Promise}
   */
  exports.tar = async function (files) {
    try {
      const databases = await exports.process(files);
      exports.init(databases, 'tar', '.tar');
    } catch (err) {
      grunt.log.error(err);
    }
  };

  /**
   * @method tgz
   * @param {Array} files
   * @returns {Promise}
   */
  exports.tgz = async function (files) {
    try {
      const databases = await exports.process(files);
      exports.init(databases, 'tgz', '.tgz');
    } catch (err) {
      grunt.log.error(err);
    }
  };

  /**
   * @method gzip
   * @param {Array} files
   * @returns {Promise}
   */
  exports.zip = async function (files) {
    try {
      const databases = await exports.process(files);
      exports.init(databases, 'zip', '.zip');
    } catch (err) {
      grunt.log.error(err);
    }
  };

  /**
   * @method sql
   * @param {Array} files
   * @returns {Promise}
   */
  exports.sql = async function (files) {
    try {
      const databases = await exports.process(files);
      exports.init(databases, 'sql', '.sql');
    } catch (err) {
      grunt.log.error(err);
    }
  };

  /**
   * @method process
   * @param {Array} files
   * @returns {Promise}
   */
  exports.process = function (files) {
    return new Promise((resolve, reject) => {
      if (files.indexOf("*") > -1) {
        const options = exports.options;
        const forget = options.forget;

        const connection = mysql.createConnection({
          host: options.host,
          port: options.port,
          user: options.user,
          password: options.pass
        });

        connection.connect();

        connection.query('SHOW DATABASES', function (err, rows, fields) {
          if (err) reject(err);

          const databases = [];
          for (let i = 0; i < rows.length; i++) {
            const db = rows[i].Database;
            if (forget.indexOf(db) > -1) continue;
            databases.push(db);
          }

          resolve(databases);
        });

        connection.end();

      } else {
        resolve(files);
      }
    });
  };

  /**
   * @method init
   * @param {Array} files
   * @param {Function} algorithm
   * @param {String} extension
   */
  exports.init = function (files, algorithm, extension) {
    const options = exports.options;
    const folder = options.dest;

    if (!grunt.file.exists(folder)) {
      grunt.file.mkdir(folder);
    }

    const promises = files.map(async function (file) {
      try {
        const dest = options.dest + file + '.sql';

        if (grunt.file.isDir(dest)) {
          return Promise.resolve(); // Skip this iteration
        }

        const args = {
          user: options.user,
          pass: '--password="' + options.pass + '"',
          database: file,
          host: options.host,
          port: options.port,
          dest: dest,
          data: (options.data_only) ? '--no-create-info' : ''
        }

        const cmd = grunt.template.process("mysqldump -h <%= host %> -P <%= port %> -u <%= user %> <%= pass %> <%= data %> <%= database %> -r <%= dest %>", { data: args });

        shell.exec(cmd, {
          silent: true
        }, function (code, output) {

          if (code !== 0) {
            grunt.log.writeln('Warning: ' + String(file).cyan + ' code: (' + String(code).red + ') output: (' + String(output).red + ')');
            return;
          }

          grunt.log.writeln('Exported: ' + String(dest).cyan + ' (' + exports.getSize(dest) + ')');

          if (options.compress) {
            exports.compress(dest, algorithm, extension);
          }

        });

      } catch (err) {
        grunt.log.error(err);
      }
    });

    return Promise.all(promises);
  };

  exports.compress = function (file, algorithm, extension) {

    if (grunt.util._.includes(['.gzip', '.deflate', '.deflateRaw'], extension) === true) {

      if (extension === '.gzip') {
        extension = '.gz';
      }

      let srcStream = fs.createReadStream(file);
      let destStream = fs.createWriteStream(file + extension);
      let compressor = algorithm.call(zlib, exports.options);

      compressor.on('error', function (err) {
        grunt.log.error(err);
      });

      destStream.on('close', function () {
        grunt.log.writeln('Generated file: ' + String(file + extension).cyan + ' (' + exports.getSize(file + extension) + ')');
        exports.delete(file);
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

      let archive = archiver.create(algorithm, exports.options);

      let destStream = fs.createWriteStream(file + extension);

      archive.on('error', function (err) {
        grunt.fail.warn(err);
      });

      archive.on('entry', function (file) {
        grunt.verbose.writeln(String(JSON.stringify(file)).red);
      });

      destStream.on('error', function (err) {
        grunt.fail.warn(err);
      });

      destStream.on('close', function () {
        let size = archive.pointer();
        grunt.log.writeln('Archived: ' + String(file + extension).cyan + ' (' + bytes(size) + ')');
        exports.delete(file);
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
    let size = 0;
    if (typeof file === 'string') {
      try {
        size = fs.statSync(file).size;
      } catch (e) { }
    }
    return bytes(size);
  };

  return exports;
};