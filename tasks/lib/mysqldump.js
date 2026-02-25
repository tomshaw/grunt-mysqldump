"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const zlib = __importStar(require("zlib"));
const child_process_1 = require("child_process");
const archiver = __importStar(require("archiver"));
const bytes_1 = __importDefault(require("bytes"));
const mysql = __importStar(require("mysql2/promise"));
module.exports = function (grunt) {
    const exports = {
        options: {},
        async gzip(files) {
            try {
                const databases = await exports.process(files);
                await exports.init(databases, () => zlib.createGzip(), '.gzip');
            }
            catch (err) {
                grunt.log.error(err);
            }
        },
        async deflate(files) {
            try {
                const databases = await exports.process(files);
                await exports.init(databases, () => zlib.createDeflate(), '.deflate');
            }
            catch (err) {
                grunt.log.error(err);
            }
        },
        async deflateRaw(files) {
            try {
                const databases = await exports.process(files);
                await exports.init(databases, () => zlib.createDeflateRaw(), '.deflateRaw');
            }
            catch (err) {
                grunt.log.error(err);
            }
        },
        async tar(files) {
            try {
                const databases = await exports.process(files);
                await exports.init(databases, 'tar', '.tar');
            }
            catch (err) {
                grunt.log.error(err);
            }
        },
        async tgz(files) {
            try {
                const databases = await exports.process(files);
                await exports.init(databases, 'tgz', '.tgz');
            }
            catch (err) {
                grunt.log.error(err);
            }
        },
        async zip(files) {
            try {
                const databases = await exports.process(files);
                await exports.init(databases, 'zip', '.zip');
            }
            catch (err) {
                grunt.log.error(err);
            }
        },
        async sql(files) {
            try {
                const databases = await exports.process(files);
                await exports.init(databases, 'sql', '.sql');
            }
            catch (err) {
                grunt.log.error(err);
            }
        },
        async process(files) {
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
                    const databases = [];
                    for (const row of rows) {
                        const db = row['Database'];
                        if (forget.includes(db))
                            continue;
                        databases.push(db);
                    }
                    return databases;
                }
                finally {
                    await connection.end();
                }
            }
            return files;
        },
        async init(files, algorithm, extension) {
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
                        (0, child_process_1.execSync)(cmd, { stdio: 'pipe' });
                    }
                    catch (err) {
                        const exitCode = err.status ?? 1;
                        const stderr = err.stderr?.toString() ?? '';
                        grunt.log.writeln(`Warning: \x1b[36m${file}\x1b[0m code: (\x1b[31m${exitCode}\x1b[0m) output: (\x1b[31m${stderr}\x1b[0m)`);
                        return;
                    }
                    grunt.log.writeln(`Exported: \x1b[36m${dest}\x1b[0m (${exports.getSize(dest)})`);
                    if (options.compress) {
                        await exports.compress(dest, algorithm, extension);
                    }
                }
                catch (err) {
                    grunt.log.error(err);
                }
            });
            await Promise.all(promises);
        },
        compress(file, algorithm, extension) {
            return new Promise((resolve, reject) => {
                if (['.gzip', '.deflate', '.deflateRaw'].includes(extension)) {
                    let ext = extension;
                    if (ext === '.gzip') {
                        ext = '.gz';
                    }
                    const srcStream = fs.createReadStream(file);
                    const destStream = fs.createWriteStream(file + ext);
                    const compressor = algorithm();
                    compressor.on('error', (err) => {
                        grunt.log.error(err);
                        reject(err);
                    });
                    destStream.on('close', () => {
                        grunt.log.writeln(`Generated file: \x1b[36m${file + ext}\x1b[0m (${exports.getSize(file + ext)})`);
                        exports.remove(file);
                        resolve();
                    });
                    destStream.on('error', (err) => {
                        reject(err);
                    });
                    srcStream.pipe(compressor).pipe(destStream);
                }
                else if (['.zip', '.tar', '.tgz'].includes(extension)) {
                    let ext = extension;
                    let archiveFormat = algorithm;
                    if (ext === '.tgz') {
                        ext = '.tar.gz';
                        archiveFormat = 'tar';
                        exports.options.gzip = true;
                        exports.options.gzipOptions = {
                            level: exports.options.level,
                        };
                    }
                    const archive = archiver.create(archiveFormat, exports.options);
                    const destStream = fs.createWriteStream(file + ext);
                    archive.on('error', (err) => {
                        grunt.fail.warn(err);
                        reject(err);
                    });
                    archive.on('entry', (entry) => {
                        grunt.verbose.writeln(JSON.stringify(entry));
                    });
                    destStream.on('error', (err) => {
                        grunt.fail.warn(err);
                        reject(err);
                    });
                    destStream.on('close', () => {
                        const size = archive.pointer();
                        grunt.log.writeln(`Archived: \x1b[36m${file + ext}\x1b[0m (${(0, bytes_1.default)(size)})`);
                        exports.remove(file);
                        resolve();
                    });
                    archive.pipe(destStream);
                    if (grunt.file.isFile(file)) {
                        archive.file(file, { name: path.basename(file) });
                    }
                    archive.finalize();
                }
                else {
                    grunt.fail.warn(`Compress mode: ${extension} is not supported.`);
                    resolve();
                }
            });
        },
        remove(file) {
            if (grunt.file.isFile(file)) {
                try {
                    grunt.file.delete(file);
                }
                catch {
                    // ignore deletion errors
                }
            }
        },
        getSize(file) {
            let size = 0;
            if (typeof file === 'string') {
                try {
                    size = fs.statSync(file).size;
                }
                catch {
                    // ignore stat errors
                }
            }
            return (0, bytes_1.default)(size) ?? '0B';
        },
    };
    return exports;
};
//# sourceMappingURL=mysqldump.js.map