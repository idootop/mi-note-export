import { exists, readJSON, writeJSON } from "@del-wang/utils/node";
import { kNotesPath, kStatePath } from "./config";
import type { NoteDetail } from "./typing";

export interface SyncState {
	/**
	 * 上次同步的时间戳
	 */
	lastSyncTime: number;
	/**
	 * 已同步的笔记映射 (noteId -> NoteDetail)
	 */
	notes: Record<string, NoteDetail>;
	/**
	 * 文件夹映射 (folderId -> folderName)
	 */
	folders: Record<string, string>;
	/**
	 * 笔记文件路径映射 (noteId -> filePath)
	 */
	noteFilePaths: Record<string, string>;
	/**
	 * 文件夹路径映射 (folderId -> folderPath)
	 */
	folderPaths: Record<string, string>;
}

/**
 * 加载同步状态
 */
export async function loadState(): Promise<SyncState | null> {
	if (!exists(kStatePath)) {
		return null;
	}
	try {
		return (await readJSON(kStatePath)) as SyncState;
	} catch {
		console.warn("⚠️  读取状态文件失败，将重新开始同步");
		return null;
	}
}

/**
 * 保存同步状态
 */
export async function saveState(state: SyncState): Promise<void> {
	// 保存状态
	await writeJSON(kStatePath, state);
	// 保存笔记列表
	await writeJSON(kNotesPath, {
		folders: state.folders,
		notes: Object.values(state.notes),
	});
}

/**
 * 创建新的同步状态
 */
export function createEmptyState(): SyncState {
	return {
		lastSyncTime: 0,
		notes: {},
		folders: {},
		noteFilePaths: {},
		folderPaths: {},
	};
}
