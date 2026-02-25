import type { GruntInstance, MysqldumpOptions, MysqldumpModule } from './lib/types';

module.exports = function (grunt: GruntInstance): void {

  const mysqldump: MysqldumpModule = require('./lib/mysqldump')(grunt);

  grunt.registerMultiTask('mysqldump', 'MySQL dump databases.', function (this: { target: string; options: <T>(defaults: T) => T; async: () => () => void }) {

    const config = grunt.config.get('mysqldump')[this.target] as Partial<MysqldumpOptions>;

    mysqldump.options = this.options<MysqldumpOptions>({
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
      const method = mysqldump[mysqldump.options.algorithm] as (files: string[]) => Promise<void>;
      method.call(mysqldump, config.databases ?? []).then(done);
    } else {
      mysqldump.sql(config.databases ?? []).then(done);
    }
  });
};
