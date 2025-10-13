import fs from "fs";
import matter from "gray-matter";
import { marked } from "marked";
import path from "path";

const NOTES_DIR = "./data/notes";
const OUTPUT_FILE = "./data/notes.json";

const kBaseFolderId = 1000;

// 生成唯一 ID
function generateId(index) {
	return (kBaseFolderId + index).toString();
}

// 生成时间戳
function parseDate(dateStr) {
	if (!dateStr) return Date.now();
	try {
		return new Date(dateStr).getTime();
	} catch {
		return Date.now();
	}
}

// 提取图片文件信息
function extractFiles(markdown, content) {
	const files = [];
	// 匹配 markdown 中的图片 ![](path)
	const imageRegex = /!\[.*?\]\((.*?)\)/g;
	let match;

	while ((match = imageRegex.exec(markdown)) !== null) {
		const imagePath = match[1];
		const fileName = path.basename(imagePath);

		// 从文件名中提取 ID
		const idMatch = fileName.match(
			/_([a-zA-Z0-9_-]+)\.(webp|png|jpg|jpeg|gif)$/,
		);
		if (idMatch) {
			const id = idMatch[1];
			const suffix = idMatch[2];
			files.push({
				name: fileName,
				id: id,
				type: "image",
				suffix: suffix,
				rawId: `944107325.${id}`,
			});
		}
	}

	// 匹配 HTML 中的 video 和 audio 标签
	const videoRegex = /<video[^>]*src="([^"]+)"[^>]*>/g;
	const audioRegex = /<audio[^>]*src="([^"]+)"[^>]*>/g;

	while ((match = videoRegex.exec(content)) !== null) {
		const videoUrl = match[1];
		const fileName = path.basename(videoUrl);
		files.push({
			name: fileName,
			id: "video_" + Date.now(),
			type: "video",
			suffix: path.extname(fileName).slice(1),
			rawId: `video.${Date.now()}`,
		});
	}

	while ((match = audioRegex.exec(content)) !== null) {
		const audioUrl = match[1];
		const fileName = path.basename(audioUrl);
		files.push({
			name: fileName,
			id: "audio_" + Date.now(),
			type: "audio",
			suffix: path.extname(fileName).slice(1),
			rawId: `audio.${Date.now()}`,
		});
	}

	return files;
}

// 修复 HTML 中的相对链接，将 ../assets/ 转换为 /data/assets/
function fixAssetLinks(html) {
	// 修复 img 标签中的 src
	html = html.replace(/src="\.\.\/assets\//g, 'src="/data/assets/');
	// 修复 a 标签中的 href
	html = html.replace(/href="\.\.\/assets\//g, 'href="/data/assets/');
	// 也处理单引号的情况
	html = html.replace(/src='\.\.\/assets\//g, "src='/data/assets/");
	html = html.replace(/href='\.\.\/assets\//g, "href='/data/assets/");
	return html;
}

// 生成 snippet（从内容中提取纯文本，限制长度）
function generateSnippet(html) {
	// 移除 HTML 标签
	const text = html.replace(/<[^>]*>/g, "");
	// 限制长度到 200 字符
	return text.length > 200 ? text.substring(0, 200) + "..." : text;
}

// 主处理函数
async function buildNotesJson() {
	const notesData = {
		folders: {},
		notes: [],
	};

	// 用于存储文件夹 ID 映射
	const folderMap = new Map();
	let folderIdCounter = kBaseFolderId;

	try {
		// 读取所有 markdown 文件
		const files = fs
			.readdirSync(NOTES_DIR)
			.filter((file) => file.endsWith(".md"));

		console.log(`找到 ${files.length} 个 markdown 文件`);

		// 临时数组用于存储笔记和时间信息
		const notesWithTime = [];

		files.forEach((file, index) => {
			const filePath = path.join(NOTES_DIR, file);
			const fileContent = fs.readFileSync(filePath, "utf-8");

			// 解析 gray-matter
			const { data: frontmatter, content: markdownContent } =
				matter(fileContent);

			console.log(`处理文件: ${file}`);
			console.log(`  标题: ${frontmatter.title || "无标题"}`);
			console.log(`  文件夹: ${frontmatter.folder || "未分类"}`);

			// 将 markdown 转换为 HTML
			let htmlContent = marked(markdownContent);

			// 修复资源文件的相对链接
			htmlContent = fixAssetLinks(htmlContent);
			htmlContent = htmlContent.replace(
				/<li>(<input.*?>)(.*?)<\/li>/gs,
				"<p>$1$2</p>",
			);
			htmlContent = htmlContent.replace(
				/<a href="(.*?)">(.*?)<\/a>/gs,
				'<a href="$1" target="_blank">$2</a>',
			);
			htmlContent = htmlContent.replaceAll("p>", "div>");

			// 处理文件夹
			const folderName = frontmatter.folder || "未分类";
			if (!folderMap.has(folderName)) {
				const folderId = folderIdCounter.toString();
				folderIdCounter++;
				folderMap.set(folderName, folderId);
				notesData.folders[folderId] = folderName;
			}
			const folderId = folderMap.get(folderName);

			// 提取文件信息
			const files = extractFiles(markdownContent, htmlContent);

			// 生成笔记对象
			const noteDate = parseDate(frontmatter.date);
			const note = {
				snippet: generateSnippet(htmlContent),
				modifyDate: noteDate,
				colorId: 0,
				subject: frontmatter.title || file.replace(".md", ""),
				alertDate: 0,
				type: "note",
				folderId: folderId,
				content: htmlContent,
				id: generateId(index),
				createDate: noteDate,
				status: "normal",
				extraInfo: {
					title: frontmatter.title || file.replace(".md", ""),
				},
			};

			// 只有当有文件时才添加 files 字段
			if (files.length > 0) {
				note.files = files;

				// 如果有图片，也添加 setting.data 字段
				const imageFiles = files.filter((f) => f.type === "image");
				if (imageFiles.length > 0) {
					note.setting = {
						data: imageFiles.map((f) => ({
							digest: "generated_digest_" + f.id,
							mimeType: `image/${f.suffix}`,
							fileId: f.rawId,
						})),
					};
				}
			}

			notesWithTime.push(note);
		});

		// 按时间排序（最新的在前面）
		notesWithTime.sort((a, b) => b.modifyDate - a.modifyDate);

		// 重新分配 ID（按排序后的顺序）
		notesWithTime.forEach((note, index) => {
			note.id = generateId(index);
		});

		notesData.notes = notesWithTime;

		// 写入 JSON 文件
		fs.writeFileSync(
			OUTPUT_FILE,
			JSON.stringify(notesData, null, "\t"),
			"utf-8",
		);

		console.log(`\n✅ 成功生成 ${OUTPUT_FILE}`);
		console.log(`   包含 ${notesData.notes.length} 条笔记`);
		console.log(`   ${Object.keys(notesData.folders).length} 个文件夹`);
	} catch (error) {
		console.error("❌ 处理出错:", error);
		process.exit(1);
	}
}

// 运行脚本
buildNotesJson();
