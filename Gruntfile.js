'use strict';

module.exports = function (grunt) {

  grunt.initConfig({
    clean: ['exports'],
  });

  grunt.loadTasks('tasks');

  grunt.loadNpmTasks('grunt-contrib-clean');

  grunt.registerTask('default', []);
};
