"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
module.exports = function (grunt) {
    const mysqldump = require('./lib/mysqldump')(grunt);
    grunt.registerMultiTask('mysqldump', 'MySQL dump databases.', function () {
        const config = grunt.config.get('mysqldump')[this.target];
        mysqldump.options = this.options({
            user: config.user ?? '',
            pass: config.pass ?? '',
            host: config.host ?? 'localhost',
            port: config.port ?? 3306,
            dest: config.dest ?? 'exports/',
            compress: false,
            algorithm: 'zip',
            level: 8,
            data_only: false,
            forget: [],
            databases: [],
        });
        if (config.databases) {
            mysqldump.options.databases = config.databases;
        }
        if (config.forget) {
            mysqldump.options.forget = config.forget;
        }
        const done = this.async();
        if (mysqldump.options.compress) {
            const method = mysqldump[mysqldump.options.algorithm];
            method.call(mysqldump, config.databases ?? []).then(done);
        }
        else {
            mysqldump.sql(config.databases ?? []).then(done);
        }
    });
};
//# sourceMappingURL=mysqldump.js.map