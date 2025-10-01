import { formatDate } from "@del-wang/utils";
import { exists, writeJSON, writeString } from "@del-wang/utils/node";
import { getNoteDetail, getNoteList } from "./api";
import { kMarkdownDir, kNotesPath } from "./config";
import type { NoteDetail, NoteEntry } from "./typing";
import { note2markdown } from "./utils";

async function getNoteEntries(limit = 200) {
	console.log("🔥 获取笔记列表中...");
	let entries: NoteEntry[] = [];
	let folders: Record<string, string> = {};
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
	if (exists(kNotesPath)) {
		console.log("✅ 笔记数据已存在，跳过下载");
		console.log("💡 如果需要重新下载，请先删除笔记数据目录");
		return;
	}
	const notes: NoteDetail[] = [];
	const { entries, folders } = await getNoteEntries();
	for (let i = 0; i < entries.length; i++) {
		const entry = entries[i]!;
		const progress = ((i + 1) / entries.length) * 100;
		console.log(
			`🔥 正在下载第 ${i + 1}/${entries.length} 条笔记 (${progress.toFixed(2)}%)...`,
		);
		const note = await getNoteDetail(entry.id, folders);
		const markdown = note2markdown(note);
		const name = `${formatDate(note.createDate)}_${note.subject}.md`;
		await writeString(`${kMarkdownDir}/${note.folderName}/${name}`, markdown);
		notes.push(note);
	}
	if (notes.length > 0) {
		await writeJSON(kNotesPath, { notes, folders });
	}
	console.log("✅ 下载完毕");
};

main().catch((e) => {
	console.error(e);
	process.exit(1);
});
