/*
 * grunt-mysqldump
 * https://github.com/tomshaw/grunt-mysqldump
 *
 * Copyright (c) 2014 Tom Shaw
 * Licensed under the MIT license.
 */
'use strict';

module.exports = function (grunt) {

  var mysqldump = require('./lib/mysqldump')(grunt);

  grunt.registerMultiTask('mysqldump', 'MySQL dump databases.', function () {

    var config = grunt.config.get('mysqldump')[this.target];

    mysqldump.options = this.options({
      user: config.user,
      pass: config.pass,
      host: config.host,
      port: config.port,
      dest: config.dest,
      compress: false,
      algorithm: 'zip',
      level: 1,
      both: false
    });

    if (config.hasOwnProperty("ignore")) {
      mysqldump.options.ignore = config.ignore;
    } else {
      mysqldump.options.ignore = [];
    }

    if (mysqldump.options.compress) {
      mysqldump[mysqldump.options.algorithm](config.databases, this.async());
    } else {
      mysqldump.init(config.databases, false, '.sql', this.async());
    }

  });
};
