import { formatDate, jsonDecode } from "@del-wang/utils";
import type { NoteDetail, NoteEntry, NoteFile } from "./typing";

function parseNoteFiles(note: NoteEntry): NoteFile[] {
	const files = note.setting?.data ?? [];
	const result: NoteFile[] = [];
	for (const file of files) {
		const date = formatDate(note.createDate);
		const id = file.fileId.split(".")[1]!;
		const type = file.mimeType.split("/")[0]!;
		const suffix = file.mimeType.split("/")[1]!;
		const name = `${type}_${date}_${id}.${suffix}`;
		result.push({ name, id, type, suffix, rawId: file.fileId });
	}
	return result;
}

function sanitizePath(filename: string): string {
	return filename
		.replace(/[/\\?%*:|"<>]/g, "_")
		.replace(/\s+/g, "_")
		.replace(/_{2,}/g, "_")
		.toLowerCase();
}

export function parseNoteRawData(
	_note: NoteEntry,
	folders?: Record<string, string>,
): NoteDetail {
	const note = _note as NoteDetail;
	const extraInfo = jsonDecode(note.extraInfo as any) || {};
	note.id = note.id.toString();
	note.extraInfo = extraInfo;
	if (!note.content) {
		note.content = note.snippet;
	}
	if (extraInfo.mind_content) {
		note.content = extraInfo.mind_content;
	}
	note.subject = extraInfo.title || note.content.slice(0, 10) || "未命名";
	note.subject = sanitizePath(note.subject);
	if (folders) {
		note.folderName = folders[note.folderId] || "未分类";
		note.folderName = sanitizePath(note.folderName);
	}
	if (note.setting?.data) {
		note.files = parseNoteFiles(note);
	}
	return note;
}

/**
 * 将笔记内容转换为 Markdown 格式
 */
export function note2markdown(note: NoteDetail) {
	let markdown = note.content;

	// 1. 去掉 <new-format/> 标签
	markdown = markdown.replace(/<new-format\s*\/>/g, "");

	// 2. 处理分割线
	markdown = markdown.replace(/<hr\s*\/>/g, "---");

	// 3. 处理引用块
	markdown = markdown.replace(/<quote>(.*?)<\/quote>/gs, "> $1");

	// 4. 处理文本样式标签（需要在处理 <text> 之前）
	// 处理加粗
	markdown = markdown.replace(/<b>(.*?)<\/b>/g, "**$1**");
	// 处理斜体
	markdown = markdown.replace(/<i>(.*?)<\/i>/g, "*$1*");
	// 处理下划线（Markdown 标准不支持，使用 HTML）
	markdown = markdown.replace(/<u>(.*?)<\/u>/g, "<u>$1</u>");
	// 处理删除线
	markdown = markdown.replace(/<delete>(.*?)<\/delete>/g, "~~$1~~");

	// 5. 处理对齐标签（保留 HTML，因为 Markdown 不原生支持）
	markdown = markdown.replace(
		/<center>(.*?)<\/center>/g,
		"<center>$1</center>",
	);
	markdown = markdown.replace(
		/<left>(.*?)<\/left>/g,
		'<div align="left">$1</div>',
	);
	markdown = markdown.replace(
		/<right>(.*?)<\/right>/g,
		'<div align="right">$1</div>',
	);

	// 6. 处理背景色（保留 HTML）
	markdown = markdown.replace(
		/<background color="([^"]+)">(.*?)<\/background>/g,
		'<span style="background-color: $1">$2</span>',
	);

	// 7. 处理字体大小标签
	markdown = markdown.replace(/<size>(.*?)<\/size>/g, "# $1"); // 大标题
	markdown = markdown.replace(/<mid-size>(.*?)<\/mid-size>/g, "## $1"); // 中标题
	markdown = markdown.replace(/<h3-size>(.*?)<\/h3-size>/g, "### $1"); // 小标题

	// 8. 处理有序列表
	markdown = markdown.replace(
		/<order indent="(\d+)" inputNumber="\d+" \/>/g,
		(_, indentStr) => {
			const indentCount = parseInt(indentStr, 10) - 1;
			const spaces = "  ".repeat(indentCount);
			return `${spaces}- `; // 正则处理不了序号，按无序列表处理
		},
	);

	// 9. 处理无序列表
	markdown = markdown.replace(/<bullet indent="(\d+)" \/>/g, (_, indentStr) => {
		const indentCount = parseInt(indentStr, 10) - 1;
		const spaces = "  ".repeat(indentCount);
		return `${spaces}- `;
	});

	// 10. 处理带缩进和层级的复选框
	markdown = markdown.replace(
		/<input type="checkbox" indent="(\d+)" level="\d+"(?: checked="true")? \/>/g,
		(match, indentStr) => {
			const indentCount = parseInt(indentStr, 10) - 1;
			const spaces = "  ".repeat(indentCount);
			const checked = match.includes('checked="true"') ? "x" : " ";
			return `${spaces}- [${checked}] `;
		},
	);

	// 11. 处理文件
	for (const file of note.files ?? []) {
		const filePath = `../../assets/${file.name}`;
		// 处理图片
		markdown = markdown.replace(
			new RegExp(`<img fileid="${file.rawId}"[^>]*>`, "g"),
			`![](${filePath})`,
		);

		// 处理音频
		markdown = markdown.replace(
			new RegExp(`<sound fileid="${file.rawId}"[^>]*>`, "g"),
			`[${file.name}](${filePath})`,
		);

		// 处理视频
		markdown = markdown.replace(
			new RegExp(`<video fileid="${file.rawId}"[^>]*>`, "g"),
			`[${file.name}](${filePath})`,
		);

		// 处理文件 ID
		markdown = markdown.replace(
			new RegExp(`☺ ${file.rawId}`, "g"),
			`![](${filePath})`,
		);
	}

	// 12. 处理 <text> 标签（包含嵌套内容）
	markdown = markdown.replace(
		/<text indent="(\d+)">(.*?)<\/text>/gs,
		(_, indentStr, content) => {
			const indentCount = parseInt(indentStr, 10) - 1;
			const spaces = "  ".repeat(indentCount);
			return spaces + content;
		},
	);

	// 13. 处理简单 checkbox（无缩进）
	markdown = markdown.replaceAll(
		'<input type="checkbox" checked="true" />',
		"- [x] ",
	);
	markdown = markdown.replaceAll('<input type="checkbox" />', "- [ ] ");

	// 14. 处理换行
	markdown = markdown.replaceAll("\n", "\n\n");
	// 处理表格之间的换行
	markdown = markdown.replace(/- (.*?)\n\n- /g, "\- $1\n\- ");
	// 把多个换行合并成两个
	markdown = markdown.replace(/\n{3,}/g, "\n\n");

	return markdown.trim();
}

/**
 * 将笔记内容转换为 HTML 格式
 */
export function note2html(note: NoteDetail) {
	let html = note.content;

	// 去掉 <new-format/> 标签
	html = html.replace(/<new-format\s*\/>/g, "");

	// 处理对齐标签
	html = html.replace(/<left>(.*?)<\/left>/g, '<div align="left">$1</div>');
	html = html.replace(/<right>(.*?)<\/right>/g, '<div align="right">$1</div>');

	// 处理背景色
	html = html.replace(
		/<background color="([^"]+)">(.*?)<\/background>/g,
		'<span style="background-color: $1">$2</span>',
	);

	// 处理特殊标签
	html = html.replace(/<quote>(.*?)<\/quote>/gs, "<blockquote>$1</blockquote>");
	html = html.replace(/<b>(.*?)<\/b>/g, "<strong>$1</strong>");
	html = html.replace(/<i>(.*?)<\/i>/g, "<em>$1</em>");
	html = html.replace(/<u>(.*?)<\/u>/g, "<u>$1</u>");
	html = html.replace(/<delete>(.*?)<\/delete>/g, "<del>$1</del>");

	// 处理字体大小标签
	html = html.replace(/<size>(.*?)<\/size>/g, "<h1>$1</h1>"); // 大标题
	html = html.replace(/<mid-size>(.*?)<\/mid-size>/g, "<h2>$1</h2>"); // 中标题
	html = html.replace(/<h3-size>(.*?)<\/h3-size>/g, "<h3>$1</h3>"); // 小标题

	// 处理有序列表
	html = html.replace(
		/<order indent="(\d+)" inputNumber="\d+" \/>(.*?)\n/gs,
		(_, indentStr, content) => {
			const indentCount = parseInt(indentStr, 10) - 1;
			return `<li style="list-style-type: decimal; list-style-position: inside; margin-left: ${indentCount * 16}px;">${content}</li>\n`;
		},
	);

	// 处理无序列表
	html = html.replace(
		/<bullet indent="(\d+)" \/>(.*?)\n/gs,
		(_, indentStr, content) => {
			const indentCount = parseInt(indentStr, 10) - 1;
			return `<li style="list-style-type: disc; list-style-position: inside; margin-left: ${indentCount * 16}px;">${content}</li>\n`;
		},
	);

	// 处理带缩进和层级的复选框
	html = html.replace(
		/<input type="checkbox" indent="(\d+)" level="\d+"(?: checked="true")? \/>(.*?)\n/gs,
		(match, indentStr, content) => {
			const indentCount = parseInt(indentStr, 10) - 1;
			const checked = match.includes('checked="true"');
			return `<div style="margin-left: ${indentCount * 16}px;"><input type="checkbox" checked="${checked}" />${content}</div>\n`;
		},
	);
	html = html.replaceAll(' checked="false"', "");

	// 处理文件
	for (const file of note.files ?? []) {
		const filePath = `/data/assets/${file.name}`;
		// 处理图片
		html = html.replace(
			new RegExp(`<img fileid="${file.rawId}"[^>]*>`, "g"),
			`<img src="${filePath}" />`,
		);

		// 处理音频
		html = html.replace(
			new RegExp(`<sound fileid="${file.rawId}"[^>]*>`, "g"),
			`<audio src="${filePath}" />`,
		);

		// 处理视频
		html = html.replace(
			new RegExp(`<video fileid="${file.rawId}"[^>]*>`, "g"),
			`<video src="${filePath}" />`,
		);

		// 处理文件 ID
		html = html.replace(
			new RegExp(`☺ ${file.rawId}`, "g"),
			`<img src="${filePath}" />`,
		);
	}

	// 处理 <text> 标签（包含嵌套内容）
	html = html.replace(
		/<text indent="(\d+)">(.*?)<\/text>/gs,
		(_, indentStr, content) => {
			const indentCount = parseInt(indentStr, 10) - 1;
			return `<div style="margin-left: ${indentCount * 16}px;">${content}</div>`;
		},
	);

	// 处理换行
	html = html.replaceAll("\n", "\n\n");
	// 把多个换行合并成两个
	html = html.replace(/\n{3,}/g, "\n\n");
	// 处理空缩进
	html = html.replaceAll(' style="margin-left: 0px;"', "");
	html = html.replaceAll(" margin-left: 0px;", "");
	// 处理空 div
	html = html.replaceAll("<div></div>", "<br/>");

	return html.trim();
}
