import * as fs from 'fs';
import path from 'path';

import { jsonDecode } from './utils/base.js';
import { exists, readString, writeString } from './utils/io.js';

interface Note {
  date: string;
  id: string;
  content: string;
  title: string;
  folderId: string;
  files?: {
    id: string;
    path: string;
  }[];
}

const exportDir = 'data/export';
const notesJsonPath = 'data/notes.json';
const assetsDir = 'data/assets';

// 文件夹ID到名称的映射
const folderNames: { [key: string]: string } = {
  '0': 'default',
  // 可以根据需要添加更多文件夹映射
};

const sanitizeFilename = (filename: string): string => {
  // Replace invalid characters with underscore
  return filename
    .replace(/[/\\?%*:|"<>]/g, '_')
    .replace(/\s+/g, '_') // Replace spaces with underscore
    .toLowerCase();
};

const generateMarkdownContent = (note: Note, folderPath: string): string => {
  const parts: string[] = [];

  // Add title as h1 if exists
  if (note.title) {
    parts.push(`# ${note.title}\n`);
  }

  // Add metadata section
  parts.push('## Metadata\n');
  parts.push(`- Created: ${note.date}`);
  parts.push(`- ID: ${note.id}`);
  if (note.folderId) {
    parts.push(`- Folder: ${note.folderId}`);
  }
  parts.push('\n## Content\n');

  // Process content to fix image paths
  let processedContent = note.content;
  if (note.files) {
    for (const file of note.files) {
      // Calculate relative path from the note's folder to the assets directory
      const relativePath = path.relative(folderPath, assetsDir);
      // Replace absolute paths with relative paths
      const oldPath = file.path;
      const newPath = path.join(relativePath, path.basename(file.path));
      // Replace all occurrences of the file path in the content
      processedContent = processedContent.replace(
        new RegExp(oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
        newPath,
      );
    }
  }

  // Add processed content
  parts.push(processedContent);

  return parts.join('\n');
};

const getFolderPath = (folderId: string): string => {
  const folderName = folderNames[folderId] || `folder_${folderId}`;
  return path.join(exportDir, folderName);
};

const generateFilename = (note: Note): string => {
  const id = String(note.id).padStart(8, '0');
  const date = note.date;
  const title = note.title ? sanitizeFilename(note.title) : 'untitled';
  return `[${id}][${date}][${title}].md`;
};

const copyAssets = async () => {
  // Create export assets directory if it doesn't exist
  const exportAssetsDir = path.join(exportDir, 'assets');
  if (!exists(exportAssetsDir)) {
    fs.mkdirSync(exportAssetsDir, { recursive: true });
  }

  // Copy all assets to the export directory
  if (exists(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    for (const file of files) {
      const sourcePath = path.join(assetsDir, file);
      const targetPath = path.join(exportAssetsDir, file);
      if (!exists(targetPath)) {
        fs.copyFileSync(sourcePath, targetPath);
        console.log(`📎 Copied asset: ${file}`);
      }
    }
  }
};

const exportNotes = async () => {
  // Read notes.json
  if (!exists(notesJsonPath)) {
    console.error('notes.json not found!');
    return;
  }

  const notesStr = await readString(notesJsonPath);
  const notes: Note[] = jsonDecode(notesStr);

  // Create export directory if it doesn't exist
  if (!exists(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }

  // Copy assets first
  await copyAssets();

  // Group notes by folderId
  const notesByFolder: { [key: string]: Note[] } = {};
  for (const note of notes) {
    const folderId = note.folderId || '0';
    if (!notesByFolder[folderId]) {
      notesByFolder[folderId] = [];
    }
    notesByFolder[folderId].push(note);
  }

  // Export notes by folder
  for (const [folderId, folderNotes] of Object.entries(notesByFolder)) {
    // Create folder if it doesn't exist
    const folderPath = getFolderPath(folderId);
    if (!exists(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }

    // Export notes in this folder
    for (const note of folderNotes) {
      const filename = generateFilename(note);
      const filepath = path.join(folderPath, filename);
      const content = generateMarkdownContent(note, folderPath);

      await writeString(filepath, content);
      console.log(`✅ Exported: ${filepath}`);
    }
  }

  console.log('\n✨ Export completed!');
};

// Run the export
exportNotes().catch((error) => {
  console.error('Export failed:', error);
  process.exit(1);
});
