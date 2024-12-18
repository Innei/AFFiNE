import { existsSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export class Path {
  static dir(url: string) {
    return new Path(join(fileURLToPath(url), '..'));
  }

  get value() {
    return this.path;
  }

  get relativePath() {
    return './' + this.path.slice(ProjectRoot.path.length).replace(/\\/g, '/');
  }

  constructor(public readonly path: string) {}

  join(...paths: string[]) {
    return new Path(join(this.path, ...paths));
  }

  parent() {
    return this.join('..');
  }

  toString() {
    return this.path;
  }

  exists() {
    return existsSync(this.path);
  }

  stats() {
    return statSync(this.path);
  }

  isFile() {
    return this.exists() && this.stats().isFile();
  }

  isDirectory() {
    return this.exists() && this.stats().isDirectory();
  }

  toFileUrl() {
    return pathToFileURL(this.path);
  }

  relative(to: string) {
    return relative(this.value, to);
  }
}

export const ProjectRoot = Path.dir(import.meta.url).join('../../../');
