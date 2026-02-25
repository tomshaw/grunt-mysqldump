import * as fs from 'fs';
import * as path from 'path';
import * as zlib from 'zlib';
import { execSync } from 'child_process';
import * as archiver from 'archiver';
import bytes from 'bytes';
import * as mysql from 'mysql2/promise';
import type { GruntInstance, MysqldumpOptions } from './types';

interface MysqldumpExports {
  options: MysqldumpOptions;
  gzip(files: string[]): Promise<void>;
  deflate(files: string[]): Promise<void>;
  deflateRaw(files: string[]): Promise<void>;
  tar(files: string[]): Promise<void>;
  tgz(files: string[]): Promise<void>;
  zip(files: string[]): Promise<void>;
  sql(files: string[]): Promise<void>;
  process(files: string[]): Promise<string[]>;
  init(files: string[], algorithm: string | (() => zlib.Gzip | zlib.Deflate | zlib.DeflateRaw), extension: string): Promise<void>;
  compress(file: string, algorithm: string | (() => zlib.Gzip | zlib.Deflate | zlib.DeflateRaw), extension: string): Promise<void>;
  remove(file: string): void;
  getSize(file: string): string;
  [key: string]: unknown;
}

module.exports = function (grunt: GruntInstance): MysqldumpExports {

  const exports: MysqldumpExports = {
    options: {} as MysqldumpOptions,

    async gzip(files: string[]): Promise<void> {
      try {
        const databases = await exports.process(files);
        await exports.init(databases, () => zlib.createGzip(), '.gzip');
      } catch (err) {
        grunt.log.error(err as Error);
      }
    },

    async deflate(files: string[]): Promise<void> {
      try {
        const databases = await exports.process(files);
        await exports.init(databases, () => zlib.createDeflate(), '.deflate');
      } catch (err) {
        grunt.log.error(err as Error);
      }
    },

    async deflateRaw(files: string[]): Promise<void> {
      try {
        const databases = await exports.process(files);
        await exports.init(databases, () => zlib.createDeflateRaw(), '.deflateRaw');
      } catch (err) {
        grunt.log.error(err as Error);
      }
    },

    async tar(files: string[]): Promise<void> {
      try {
        const databases = await exports.process(files);
        await exports.init(databases, 'tar', '.tar');
      } catch (err) {
        grunt.log.error(err as Error);
      }
    },

    async tgz(files: string[]): Promise<void> {
      try {
        const databases = await exports.process(files);
        await exports.init(databases, 'tgz', '.tgz');
      } catch (err) {
        grunt.log.error(err as Error);
      }
    },

    async zip(files: string[]): Promise<void> {
      try {
        const databases = await exports.process(files);
        await exports.init(databases, 'zip', '.zip');
      } catch (err) {
        grunt.log.error(err as Error);
      }
    },

    async sql(files: string[]): Promise<void> {
      try {
        const databases = await exports.process(files);
        await exports.init(databases, 'sql', '.sql');
      } catch (err) {
        grunt.log.error(err as Error);
      }
    },

    async process(files: string[]): Promise<string[]> {
      if (files.includes('*')) {
        const options = exports.options;
        const forget = options.forget;

        const connection = await mysql.createConnection({
          host: options.host,
          port: options.port,
          user: options.user,
          password: options.pass,
        });

        try {
          const [rows] = await connection.query('SHOW DATABASES');
          const databases: string[] = [];

          for (const row of rows as mysql.RowDataPacket[]) {
            const db = row['Database'] as string;
            if (forget.includes(db)) continue;
            databases.push(db);
          }

          return databases;
        } finally {
          await connection.end();
        }
      }

      return files;
    },

    async init(
      files: string[],
      algorithm: string | (() => zlib.Gzip | zlib.Deflate | zlib.DeflateRaw),
      extension: string
    ): Promise<void> {
      const options = exports.options;
      const folder = options.dest;

      if (!grunt.file.exists(folder)) {
        grunt.file.mkdir(folder);
      }

      const promises = files.map(async (file) => {
        try {
          const dest = path.join(options.dest, file + '.sql');

          if (grunt.file.isDir(dest)) {
            return;
          }

          const dataFlag = options.data_only ? '--no-create-info' : '';
          const cmd = `mysqldump -h ${options.host} -P ${options.port} -u ${options.user} --password="${options.pass}" ${dataFlag} ${file} -r ${dest}`;

          try {
            execSync(cmd, { stdio: 'pipe' });
          } catch (err) {
            const exitCode = (err as { status?: number }).status ?? 1;
            const stderr = (err as { stderr?: Buffer }).stderr?.toString() ?? '';
            grunt.log.writeln(`Warning: \x1b[36m${file}\x1b[0m code: (\x1b[31m${exitCode}\x1b[0m) output: (\x1b[31m${stderr}\x1b[0m)`);
            return;
          }

          grunt.log.writeln(`Exported: \x1b[36m${dest}\x1b[0m (${exports.getSize(dest)})`);

          if (options.compress) {
            await exports.compress(dest, algorithm, extension);
          }
        } catch (err) {
          grunt.log.error(err as Error);
        }
      });

      await Promise.all(promises);
    },

    compress(
      file: string,
      algorithm: string | (() => zlib.Gzip | zlib.Deflate | zlib.DeflateRaw),
      extension: string
    ): Promise<void> {
      return new Promise((resolve, reject) => {
        if (['.gzip', '.deflate', '.deflateRaw'].includes(extension)) {
          let ext = extension;
          if (ext === '.gzip') {
            ext = '.gz';
          }

          const srcStream = fs.createReadStream(file);
          const destStream = fs.createWriteStream(file + ext);
          const compressor = (algorithm as () => zlib.Gzip | zlib.Deflate | zlib.DeflateRaw)();

          compressor.on('error', (err: Error) => {
            grunt.log.error(err);
            reject(err);
          });

          destStream.on('close', () => {
            grunt.log.writeln(`Generated file: \x1b[36m${file + ext}\x1b[0m (${exports.getSize(file + ext)})`);
            exports.remove(file);
            resolve();
          });

          destStream.on('error', (err: Error) => {
            reject(err);
          });

          srcStream.pipe(compressor).pipe(destStream);

        } else if (['.zip', '.tar', '.tgz'].includes(extension)) {
          let ext = extension;
          let archiveFormat = algorithm as string;

          if (ext === '.tgz') {
            ext = '.tar.gz';
            archiveFormat = 'tar';
            exports.options.gzip = true;
            exports.options.gzipOptions = {
              level: exports.options.level,
            };
          }

          const archive = archiver.create(archiveFormat as archiver.Format, exports.options);
          const destStream = fs.createWriteStream(file + ext);

          archive.on('error', (err: Error) => {
            grunt.fail.warn(err);
            reject(err);
          });

          archive.on('entry', (entry: archiver.EntryData) => {
            grunt.verbose.writeln(JSON.stringify(entry));
          });

          destStream.on('error', (err: Error) => {
            grunt.fail.warn(err);
            reject(err);
          });

          destStream.on('close', () => {
            const size = archive.pointer();
            grunt.log.writeln(`Archived: \x1b[36m${file + ext}\x1b[0m (${bytes(size)})`);
            exports.remove(file);
            resolve();
          });

          archive.pipe(destStream);

          if (grunt.file.isFile(file)) {
            archive.file(file, { name: path.basename(file) });
          }

          archive.finalize();

        } else {
          grunt.fail.warn(`Compress mode: ${extension} is not supported.`);
          resolve();
        }
      });
    },

    remove(file: string): void {
      if (grunt.file.isFile(file)) {
        try {
          grunt.file.delete(file);
        } catch {
          // ignore deletion errors
        }
      }
    },

    getSize(file: string): string {
      let size = 0;
      if (typeof file === 'string') {
        try {
          size = fs.statSync(file).size;
        } catch {
          // ignore stat errors
        }
      }
      return bytes(size) ?? '0B';
    },
  };

  return exports;
};
