import * as fs from 'fs';
import * as path from 'path';

export const kRoot = process.cwd();

export const exists = (filePath: string) => fs.existsSync(filePath);

export const readFile = <T = any>(
  filePath: string,
  options?: fs.WriteFileOptions,
) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    return undefined;
  }
  return new Promise<T | undefined>((resolve) => {
    fs.readFile(filePath, options, (err, data) => {
      resolve(err ? undefined : (data as any));
    });
  });
};

export const writeFile = (
  filePath: string,
  data: string | NodeJS.ArrayBufferView,
  options?: fs.WriteFileOptions,
) => {
  const dirname = path.dirname(filePath);
  if (!fs.existsSync(dirname)) {
    fs.mkdirSync(dirname, { recursive: true });
  }
  return new Promise<boolean>((resolve) => {
    if (options) {
      fs.writeFile(filePath, data, options, (err) => {
        resolve(err ? false : true);
      });
    } else {
      fs.writeFile(filePath, data, (err) => {
        resolve(err ? false : true);
      });
    }
  });
};

export const readString = (filePath: string) =>
  readFile<string>(filePath, 'utf8');

export const writeString = (filePath: string, content: string) =>
  writeFile(filePath, content, 'utf8');
