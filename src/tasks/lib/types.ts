import type { ZlibOptions } from 'zlib';

export type AlgorithmType = 'gzip' | 'deflate' | 'deflateRaw' | 'tar' | 'tgz' | 'zip';

export interface MysqldumpOptions {
  user: string;
  pass: string;
  host: string;
  port: number;
  dest: string;
  compress: boolean;
  algorithm: AlgorithmType;
  level: number;
  data_only: boolean;
  forget: string[];
  databases: string[];
  gzip?: boolean;
  gzipOptions?: ZlibOptions;
}

export interface GruntLog {
  writeln(msg: string): void;
  error(msg: string | Error): void;
}

export interface GruntVerbose {
  writeln(msg: string): void;
}

export interface GruntFile {
  exists(path: string): boolean;
  mkdir(path: string): void;
  isDir(path: string): boolean;
  isFile(path: string): boolean;
  delete(path: string): void;
}

export interface GruntFail {
  warn(msg: string | Error): void;
}

export interface GruntInstance {
  log: GruntLog;
  verbose: GruntVerbose;
  file: GruntFile;
  fail: GruntFail;
  config: {
    get(key: string): Record<string, unknown>;
  };
  registerMultiTask(
    name: string,
    description: string,
    fn: (this: GruntTask) => void
  ): void;
  loadTasks(path: string): void;
  loadNpmTasks(name: string): void;
  registerTask(name: string, tasks: string[]): void;
  initConfig(config: Record<string, unknown>): void;
}

export interface GruntTask {
  target: string;
  options<T>(defaults: T): T;
  async(): () => void;
}

export interface MysqldumpModule {
  options: MysqldumpOptions;
  gzip(files: string[]): Promise<void>;
  deflate(files: string[]): Promise<void>;
  deflateRaw(files: string[]): Promise<void>;
  tar(files: string[]): Promise<void>;
  tgz(files: string[]): Promise<void>;
  zip(files: string[]): Promise<void>;
  sql(files: string[]): Promise<void>;
  [key: string]: unknown;
}
