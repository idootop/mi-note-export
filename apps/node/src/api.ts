import { exists, writeFile } from "@del-wang/utils/node";
import ky from "ky";
import { kAssetsDir } from "./config";
import type { NoteDetailResponse, NoteListResponse } from "./typing";
import { parseNoteRawData, sanitizePath } from "./utils";

const api = ky.extend({
	headers: {
		cookie: process.env.MI_COOKIE || "",
		referrer: "https://i.mi.com/note/h5",
		"user-agent":
			"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0",
	},
	hooks: {
		afterResponse: [
			async (input, __, response) => {
				if (
					response.status === 401 &&
					response.url.startsWith("https://s010.i.mi.com")
				) {
					return ky(response.url, { headers: input.headers });
				}
			},
		],
	},
});

async function get<T>(url: string): Promise<T | undefined> {
	try {
		return await api.get(url).json();
	} catch (e) {
		console.error("❌ 网络异常：", e);
		return undefined;
	}
}

async function download(url: string, path: string) {
	if (exists(path)) {
		return true;
	}
	try {
		const file = await api.get(url).bytes();
		return await writeFile(path, file);
	} catch (e) {
		console.error("❌ 网络异常：", e);
		return false;
	}
}

export async function getNoteList(syncTag?: string, limit = 200) {
	const res = await get<NoteListResponse>(
		`https://i.mi.com/note/full/page/?ts=${Date.now()}&limit=${limit}&syncTag=${syncTag}`,
	);
	if (!res?.data?.entries) {
		const divider =
			"-----------------------------------------------------------------------";
		const tips = `\n${divider}\n👉 获取 Cookie 教程: https://github.com/idootop/mi-note-export/issues/4\n${divider}`;
		if (!process.env.MI_COOKIE || process.env.MI_COOKIE.startsWith("xxx")) {
			throw new Error(
				`❌ Cookie 未设置，请在 env 文件中设置 MI_COOKIE 后重试。${tips}`,
			);
		}
		throw new Error(
			`获取笔记列表失败 ${syncTag}\n❌ 当前 Cookie 无效或已过期，请更新 Cookie 后重试。${tips}`,
		);
	}
	const folders = Object.fromEntries(
		res.data.folders.map((folder) => [folder.id, sanitizePath(folder.subject)]),
	);
	return {
		syncTag: res.data.lastPage ? undefined : res.data.syncTag,
		notes: res.data.entries.map((entry) => parseNoteRawData(entry, folders)),
		folders,
	};
}

export async function getNoteDetail(
	id: string,
	folders?: Record<string, string>,
) {
	const res = await get<NoteDetailResponse>(
		`https://i.mi.com/note/note/${id}/?ts=${Date.now()}`,
	);
	if (!res?.data?.entry) {
		throw new Error(`获取笔记详情失败 ${id}`);
	}
	const note = parseNoteRawData(res.data.entry, folders);
	for (const file of note.files ?? []) {
		const path = `${kAssetsDir}/${file.name}`;
		const url = `https://i.mi.com/file/full?fileid=${file.rawId}&type=note_img`;
		const success = await download(url, path);
		if (!success) {
			throw new Error(`下载文件失败 ${file.rawId}`);
		}
	}
	return note;
}
