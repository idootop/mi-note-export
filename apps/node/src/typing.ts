export interface NoteRawFile {
	digest: string;
	/**
	 * 文件类型，比如 image/jpeg
	 */
	mimeType: string;
	/**
	 * 文件 ID，格式：userId.fileId，比如 123456.NT0kr_xxxxxx
	 */
	fileId: string;
}

export interface NoteFile {
	rawId: string;
	/**
	 * 文件名：type_date_id.suffix
	 */
	name: string;
	id: string;
	type: string;
	suffix: string;
}

export interface NoteFolder {
	id: string;
	type: "folder";
	createDate: number;
	modifyDate: number;
	/**
	 * 名称
	 */
	subject: string;
}

export interface NoteExtraInfo {
	/**
	 * 标题
	 */
	title: string;
	/**
	 * 类型：便签、思维导图
	 */
	note_content_type?: "note" | "mind";
}

export interface NoteEntry {
	id: string;
	type: "note";
	createDate: number;
	modifyDate: number;
	/**
	 * 标题
	 */
	subject: string;
	/**
	 * 摘要
	 */
	snippet: string;
	/**
	 * 主题色枚举
	 */
	colorId: number;
	/**
	 * 文件夹 ID
	 */
	folderId: string;
	setting?: { data?: NoteRawFile[] };
	/**
	 * 额外信息（需要 jsonDecode）
	 */
	extraInfo: NoteExtraInfo;
}

export interface NoteDetail extends NoteEntry {
	content: string;
	/**
	 * 文件附件
	 */
	files: NoteFile[];
}

export interface NoteListResponse {
	result: "ok";
	data: {
		entries: NoteEntry[];
		folders: NoteFolder[];
		lastPage: boolean;
		syncTag: string;
	};
}

export interface NoteDetailResponse {
	result: "ok";
	data: {
		entry: NoteDetail;
	};
}
