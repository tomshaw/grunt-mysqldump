/*
 * grunt-mysqldump
 * https://github.com/tomshaw/grunt-mysqldump
 *
 * Copyright (c) 2016 Tom Shaw
 * Licensed under the MIT license.
 */
'use strict';

module.exports = function (grunt) {

  /**
   * Initializes the configuration object for Grunt.
   * @function initConfig
   */
  grunt.initConfig({

    /**
     * Configuration for the jshint task.
     * @property jshint
     * @type {Object}
     */
    jshint: {
      all: [
        'Gruntfile.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },

    /**
     * Deletes files and directories specified by path.
     * @property clean
     * @type {Object}
     */
    clean: ['exports'],

  });

  /**
   * Loads tasks from the tasks directory.
   * @function loadTasks
   */
  grunt.loadTasks('tasks');

  /**
   * Loads the jshint plugin.
   * @function loadNpmTasks
   */
  grunt.loadNpmTasks('grunt-contrib-jshint');

  /**
   * Loads the clean plugin.
   * @function loadNpmTasks
   */
  grunt.loadNpmTasks('grunt-contrib-clean');

  /**
   * Loads the nodeunit plugin.
   * @function loadNpmTasks
   */
  grunt.loadNpmTasks('grunt-contrib-nodeunit');

  /**
   * Registers the default task.
   * @function registerTask
   */
  grunt.registerTask('default', ['jshint']);
};
