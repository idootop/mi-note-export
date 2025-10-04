import { exists, writeString } from "@del-wang/utils/node";
import { rename, rm } from "node:fs/promises";
import { getNoteDetail, getNoteList } from "./api";
import {
	createEmptyState,
	loadState,
	saveState,
	type SyncState,
} from "./state";
import type { NoteEntry } from "./typing";
import { getFolderDir, getNoteFilePath, note2markdown } from "./utils";

async function getNoteEntries(limit = 200) {
	console.log("🔥 获取笔记列表中...");
	let entries: NoteEntry[] = [];
	let folders: Record<string, string> = { "0": "未分类" };
	let syncTag: string | undefined = "";
	while (syncTag != null) {
		const res = await getNoteList(syncTag, limit);
		syncTag = res.syncTag;
		entries = [...entries, ...res.notes];
		folders = { ...folders, ...res.folders };
		console.log(`🚗 已获取 ${entries.length} 条笔记...`);
	}
	return { entries, folders };
}

const main = async () => {
	// 加载之前的同步状态
	let state = await loadState();
	if (!state) {
		state = createEmptyState();
		console.log("🚗 开始同步笔记");
	} else {
		console.log("♻️ 检测到之前的同步记录，将进行增量更新");
		console.log(`📊 已有 ${Object.keys(state.notes).length} 条笔记`);
	}

	// 获取最新的笔记列表
	const { entries, folders } = await getNoteEntries();

	// 更新笔记（删除）
	await updateNotes(state, entries);

	// 更新文件夹（删除、重命名）
	await updateFolders(state, folders);

	// 筛选需要同步的笔记（新增或修改的）
	const toSync: NoteEntry[] = [];
	let skipped = 0;

	for (const entry of entries) {
		const existingNote = state.notes[entry.id];
		if (!existingNote || existingNote.modifyDate < entry.modifyDate) {
			toSync.push(entry);
		} else {
			skipped++;
		}
	}

	if (toSync.length > 0) {
		console.log(`🔥 需要同步 ${toSync.length} 条笔记`);
	}
	if (skipped > 0) {
		console.log(`⏭️  跳过 ${skipped} 条未修改的笔记`);
	}

	// 同步笔记
	let synced = 0;
	let failed = 0;

	for (let i = 0; i < toSync.length; i++) {
		const entry = toSync[i];
		if (!entry) continue;
		const progress = ((i + 1) / toSync.length) * 100;
		console.log(
			`🔥 正在同步第 ${i + 1}/${toSync.length} 条笔记 (${progress.toFixed(2)}%)...`,
		);

		try {
			// 同步笔记详情
			const note = await getNoteDetail(entry.id, folders);
			const markdown = note2markdown(note);
			const filePath = getNoteFilePath(note, folders);

			// 删除旧文件（如果笔记名称变更或移动到其他文件夹）
			const existingNote = state.notes[note.id];
			if (existingNote) {
				const oldFilePath = getNoteFilePath(existingNote, folders);
				if (oldFilePath !== filePath && exists(oldFilePath)) {
					await rm(oldFilePath, { force: true });
				}
			}

			// 写入新文件
			await writeString(filePath, markdown || " ");

			// 更新状态
			state.notes[note.id] = note;
			state.noteFilePaths[note.id] = filePath;
			synced++;

			// 每同步 10 条保存一次状态
			if ((i + 1) % 10 === 0) {
				state.lastSyncTime = Date.now();
				await saveState(state);
			}
		} catch (e) {
			console.error(`❌ 同步笔记 ${entry.id} 失败:`, e);
			failed++;
		}
	}

	// 保存最终状态
	state.lastSyncTime = Date.now();
	await saveState(state);

	console.log("\n✅ 同步完毕");
	console.log(`  - 总笔记数: ${entries.length}`);
	console.log(`  - 本次同步: ${synced}`);
	if (skipped > 0) {
		console.log(`  - 跳过: ${skipped}`);
	}
	if (failed > 0) {
		console.log(`  - 失败: ${failed}`);
	}
};

main().catch((e) => {
	console.error(e);
	process.exit(1);
});

async function updateNotes(
	state: SyncState,
	entries: NoteEntry[],
): Promise<void> {
	// 清理已删除的笔记
	const currentNoteIds = new Set(entries.map((e) => e.id));
	const deletedNotes: string[] = [];
	for (const noteId of Object.keys(state.notes)) {
		if (!currentNoteIds.has(noteId)) {
			deletedNotes.push(noteId);
		}
	}
	if (deletedNotes.length > 0) {
		console.log(`🗑️ 清理 ${deletedNotes.length} 个已删除的笔记`);
		for (const noteId of deletedNotes) {
			const filePath = state.noteFilePaths[noteId];
			if (filePath && exists(filePath)) {
				await rm(filePath, { force: true });
				console.log(`  ❌ 删除: ${filePath}`);
			}
			delete state.notes[noteId];
			delete state.noteFilePaths[noteId];
		}
	}
}

async function updateFolders(
	state: SyncState,
	newFolders: Record<string, string>,
) {
	// 处理已删除的文件夹
	const deletedFolders: string[] = [];
	for (const folderId of Object.keys(state.folders)) {
		if (!newFolders[folderId]) {
			deletedFolders.push(folderId);
		}
	}
	if (deletedFolders.length > 0) {
		console.log(`🗑️  清理 ${deletedFolders.length} 个已删除的文件夹`);
		for (const folderId of deletedFolders) {
			const oldPath = getFolderDir(state.folders[folderId]);
			if (exists(oldPath)) {
				await rm(oldPath, { force: true, recursive: true });
				console.log(`  ❌ 删除: ${oldPath}`);
			}
		}
	}

	// 重命名文件夹
	for (const [folderId, newName] of Object.entries(newFolders)) {
		const oldName = state.folders[folderId];
		if (oldName && oldName !== newName) {
			console.log(`📁 重命名分类: ${oldName} -> ${newName}`);
			const oldPath = getFolderDir(oldName);
			const newPath = getFolderDir(newName);
			if (exists(oldPath)) {
				await rename(oldPath, newPath);
			}
		}
	}

	// 更新状态
	state.folders = newFolders;
	state.folderPaths = Object.fromEntries(
		Object.entries(newFolders).map(([folderId, folderName]) => [
			folderId,
			getFolderDir(folderName),
		]),
	);
	await saveState(state);
}
