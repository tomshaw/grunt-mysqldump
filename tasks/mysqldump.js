/*
 * grunt-mysqldump
 * https://github.com/tomshaw/grunt-mysqldump
 *
 * Copyright (c) 2016 Tom Shaw
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
      level: 8,
      data_only: false,
      forget: [],
      databases: []
    });

    if (config.hasOwnProperty("databases")) {
      mysqldump.options.databases = config.databases;
    }

    if (config.hasOwnProperty("forget")) {
      mysqldump.options.forget = config.forget;
    }

    if (mysqldump.options.compress) {
      mysqldump[mysqldump.options.algorithm](config.databases, this.async());
    } else {
      mysqldump['sql'](config.databases, this.async());
    }

  });
};