import { kCookie } from './services/env/index.js';
import { http } from './services/http/index.js';
import { jsonDecode, jsonEncode, printf } from './utils/base.js';
import { exists, readString, writeString } from './utils/io.js';
import { isEmpty } from './utils/is.js';

interface Note {
  id: string;
  content: string;
  createDate: number;
  files?: {
    id: string;
    path: string;
  }[];
  title: string;
}

const limit = 200;
const assetsDir = 'data/assets';
const rawDataPath = 'data/raw.json';
const noteDataPath = 'data/notes.json';
const httpConfig = {
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0',
    referrer: 'https://i.mi.com/note/h5',
    cookie: kCookie,
  },
};

const getNotes = async () => {
  let datas: any = [];
  let syncTag = '';
  const syncPage = async (syncTag = '') => {
    return (
      await http.get(
        `https://i.mi.com/note/full/page/?ts=${Date.now()}&limit=${limit}&syncTag=${syncTag}`,
        undefined,
        httpConfig,
      )
    )?.data;
  };
  while (syncTag !== undefined) {
    const data = await syncPage(syncTag);
    datas = [...datas, ...data.entries];
    syncTag = isEmpty(data.syncTag) ? undefined : data.syncTag;
    if (!data || data.entries.length < limit) {
      break;
    }
  }
  await writeString(rawDataPath, jsonEncode(datas) ?? '');
  return datas;
};

const getNoteDate = (createDate: number) =>
  new Date(createDate).toISOString().slice(0, 10);

const getNotesFromLocal = async (): Promise<Note[]> => {
  const str = await readString(rawDataPath);
  let datas = jsonDecode(str);
  datas = datas.map((e) => {
    const files = e.setting?.data ?? [];
    // process folderId
    const folderId = String(e.folderId);
    //process title
    const title = (() => {
      if (!e.extraInfo) return '';
      try {
        return JSON.parse(e.extraInfo).title || '';
      } catch (error) {
        console.error('Failed to parse extraInfo:', error);
        return '';
      }
    })();
    let content = e.snippet;
    content = content.replaceAll('<input type="checkbox" />', '- [ ] ');
    content = content.replaceAll(
      '<input type="checkbox" checked="true" />',
      '- [x] ',
    );
    const noteDate = getNoteDate(e.createDate);
    for (const file of files) {
      const fileId = file.fileId.split('.')[1];
      const fileType = file.mimeType.split('/')[0];
      const fileSuffix = file.mimeType.split('/')[1];
      const filePath = `${assetsDir}/${noteDate}-${fileId}.${fileSuffix}`;
      const fileLink =
        fileType === 'image'
          ? `![](${filePath})`
          : `[${fileType}](${filePath})`;
      content = content.replaceAll(
        `<sound fileid="${file.fileId}" />`,
        fileLink,
      );
      content = content.replaceAll(file.fileId, fileLink);
      file.id = file.fileId;
      file.path = filePath;
    }
    const finalFiles = files.map((e) => {
      return {
        id: e.id,
        path: e.path,
      };
    });
    return {
      id: e.id,
      createDate: e.createDate,
      content: content,
      files: finalFiles,
      folderId: folderId,
      title: title,
    };
  });
  [].sort();
  const finalDatas = datas
    .sort((a, b) => b - a) //从新到旧排序
    .map((e) => {
      return {
        date: getNoteDate(e.createDate),
        id: e.id,
        content: e.content,
        folderId: e.folderId,
        title: e.title,
        ...(e.files.length > 0 ? { files: e.files } : {}),
      };
    });
  return finalDatas;
};

const downloadAsset = async (id: string, path: string) => {
  if (exists(path)) {
    return true;
  }
  return http.download(
    `https://i.mi.com/file/full?type=note_img&fileid=${id}`,
    path,
    httpConfig,
  );
};

const main = async () => {
  if (!exists(rawDataPath)) {
    await getNotes();
  }
  const notes = await getNotesFromLocal();
  let assets: any = [];
  for (const note of notes) {
    if (note.files) {
      assets = [...assets, ...note.files];
    }
  }
  await Promise.all(
    assets.map((e) =>
      (async () => {
        const success = await downloadAsset(e.id, e.path);
        console.log(e.path, success ? '✅' : '❌');
        return success;
      })(),
    ),
  );
  await writeString(noteDataPath, jsonEncode(notes) ?? '');
  printf('✅ 已完成');
};

main();
