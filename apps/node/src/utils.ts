import { formatDate, jsonDecode } from "@del-wang/utils";
import { kMarkdownDir } from "./config";
import type { NoteDetail, NoteEntry, NoteFile } from "./typing";

const MIMIND_PREFIX = "<MiMind Prdfix>";

interface MiMindNode {
	label: string;
	children?: MiMindNode[];
}

/**
 * 检测内容是否为 MiMind 思维导图格式
 */
export function isMindMap(content: string): boolean {
	return content.startsWith(MIMIND_PREFIX);
}

/**
 * 将 MiMind 思维导图转换为 Markdown 嵌套列表
 */
export function mindMapToMarkdown(content: string): string {
	const jsonStr = content.substring(MIMIND_PREFIX.length);
	const mindData = JSON.parse(jsonStr);
	const innerData = JSON.parse(mindData.content);
	const root: MiMindNode = innerData.data;

	const lines: string[] = [`# ${root.label}`, ""];

	function traverse(node: MiMindNode, depth: number) {
		const indent = "  ".repeat(depth);
		lines.push(`${indent}- ${node.label}`);
		for (const child of node.children ?? []) {
			traverse(child, depth + 1);
		}
	}

	for (const child of root.children ?? []) {
		traverse(child, 0);
	}

	return lines.join("\n");
}

/**
 * 将 MiMind 思维导图转换为 HTML 嵌套列表
 */
export function mindMapToHtml(content: string): string {
	const jsonStr = content.substring(MIMIND_PREFIX.length);
	const mindData = JSON.parse(jsonStr);
	const innerData = JSON.parse(mindData.content);
	const root: MiMindNode = innerData.data;

	function buildList(node: MiMindNode): string {
		if (!node.children || node.children.length === 0) {
			return "";
		}
		const items = node.children
			.map((child) => {
				const nested = buildList(child);
				return `<li>${child.label}${nested}</li>`;
			})
			.join("");
		return `<ul>${items}</ul>`;
	}

	return `<h1>${root.label}</h1>${buildList(root)}`;
}

/**
 * 将 HTML <ul>/<li> 列表转换为 Markdown 嵌套列表
 */
export function convertHtmlLists(content: string): string {
	// 没有 <ul> 标签则直接返回
	if (!content.includes("<ul>")) {
		return content;
	}

	const lines: string[] = [];
	let indent = -1;
	let currentText = "";
	let inListItem = false;

	// 按标签分词
	const regex = /(<ul>|<\/ul>|<li>|<\/li>)/g;
	let lastIndex = 0;
	const tokens: { type: string; text: string }[] = [];
	let match: RegExpExecArray | null;

	while ((match = regex.exec(content)) !== null) {
		if (match.index > lastIndex) {
			tokens.push({
				type: "text",
				text: content.substring(lastIndex, match.index),
			});
		}
		tokens.push({ type: match[1], text: match[1] });
		lastIndex = regex.lastIndex;
	}
	if (lastIndex < content.length) {
		tokens.push({ type: "text", text: content.substring(lastIndex) });
	}

	for (const token of tokens) {
		switch (token.type) {
			case "<ul>":
				// 如果在列表项内遇到嵌套 <ul>，先输出当前文本作为列表项
				if (inListItem && currentText.trim()) {
					const spaces = indent >= 0 ? "  ".repeat(indent) : "";
					lines.push(`${spaces}- ${currentText.trim()}`);
				}
				currentText = "";
				indent++;
				break;
			case "</ul>":
				indent--;
				break;
			case "<li>":
				inListItem = true;
				currentText = "";
				break;
			case "</li>":
				if (currentText.trim()) {
					const spaces = indent >= 0 ? "  ".repeat(indent) : "";
					lines.push(`${spaces}- ${currentText.trim()}`);
				}
				inListItem = false;
				currentText = "";
				break;
			default:
				if (inListItem) {
					currentText += token.text;
				}
				break;
		}
	}

	return lines.join("\n");
}

/**
 * 解码常见 HTML 实体
 */
export function decodeHtmlEntities(content: string): string {
	return content
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'");
}

/**
 * 格式化时间戳为日期时间字符串
 * @description 返回 YYYY-MM-DD_HH-mm-ss 格式，用于文件名
 * @author xushouwang
 * @date 2026-01-21
 */
function formatDateTime(timestamp: number): string {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	const seconds = String(date.getSeconds()).padStart(2, "0");
	return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

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

export function sanitizePath(filename: string): string {
	return filename
		.replace(/[/\\?%*:|"<>]/g, "_")
		.replace(/\s+/g, "_")
		.replace(/_{2,}/g, "_")
		.toLowerCase();
}

export function getFolderDir(folderName: string): string {
	return `${kMarkdownDir}/${sanitizePath(folderName)}`;
}

/**
 * 生成笔记文件路径
 * @description 文件名格式：YYYY-MM-DD_HH-mm-ss_标题.md，避免同一天多个笔记被覆盖
 * @author xushouwang
 * @date 2026-01-21
 */
export function getNoteFilePath(
	note: NoteDetail,
	folders: Record<string, string>,
): string {
	const name = `${formatDateTime(note.createDate)}_${note.subject}.md`;
	const folderName = folders[note.folderId];
	return `${kMarkdownDir}/${folderName}/${name}`;
}

export function parseNoteRawData(
	_note: NoteEntry,
	_folders?: Record<string, string>,
): NoteDetail {
	const note = _note as NoteDetail;
	const extraInfo = jsonDecode(note.extraInfo as any) || {};
	note.id = note.id.toString();
	note.folderId = note.folderId.toString();
	note.extraInfo = extraInfo;
	if (!note.content) {
		note.content = note.snippet;
	}
	if (extraInfo.mind_content) {
		note.content = extraInfo.mind_content;
	}
	note.subject =
		extraInfo.title || note.content.split("\n")[0].slice(0, 10) || "未命名";
	note.subject = sanitizePath(note.subject);
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

	// 0. 如果是 MiMind 思维导图，直接转换为 Markdown 列表
	if (isMindMap(markdown)) {
		return mindMapToMarkdown(markdown);
	}

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
		(_, color, content) => {
			color = `#${color.slice(3)}${color.slice(1, 3)}`;
			return `<span style="background-color: ${color};">${content}</span>`;
		},
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

	// 14. 处理 HTML <ul>/<li> 列表
	markdown = convertHtmlLists(markdown);

	// 15. 解码 HTML 实体
	markdown = decodeHtmlEntities(markdown);

	// 16. 处理换行
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

	// 如果是 MiMind 思维导图，直接转换为 HTML 列表
	if (isMindMap(html)) {
		return mindMapToHtml(html);
	}

	// 去掉 <new-format/> 标签
	html = html.replace(/<new-format\s*\/>/g, "");

	// 处理对齐标签
	html = html.replace(/<left>(.*?)<\/left>/g, '<div align="left">$1</div>');
	html = html.replace(/<right>(.*?)<\/right>/g, '<div align="right">$1</div>');

	// 处理背景色
	html = html.replace(
		/<background color="([^"]+)">(.*?)<\/background>/g,
		(_, color, content) => {
			color = `#${color.slice(3)}${color.slice(1, 3)}`;
			return `<span style="background-color: ${color};">${content}</span>`;
		},
	);

	// 处理特殊标签
	html = html.replace(/<quote>(.*?)<\/quote>/gs, "<blockquote>$1</blockquote>");
	html = html.replace(/<b>(.*?)<\/b>/g, "<strong>$1</strong>");
	html = html.replace(/<i>(.*?)<\/i>/g, "<i>$1</i>");
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
			`<audio controls="" playsinline="" src="${filePath}"></audio>`,
		);

		// 处理视频
		html = html.replace(
			new RegExp(`<video fileid="${file.rawId}"[^>]*>`, "g"),
			`<video controls="" src="${filePath}"></video>`,
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

	// 处理空缩进
	html = html.replaceAll(' style="margin-left: 0px;"', "");
	html = html.replaceAll(" margin-left: 0px;", "");
	// 处理空 div
	html = html.replaceAll("<div></div>", "<br/>");

	return html.trim();
}
