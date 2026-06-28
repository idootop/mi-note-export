import fs from "node:fs";
import path from "node:path";
import { rename, rm } from "node:fs/promises";

//#region node_modules/.pnpm/@del-wang+utils@1.5.0_@types+node@24.6.1/node_modules/@del-wang/utils/dist/core/object.js
function jsonEncode(obj, options) {
	const { prettier, removeNullish: _removeNullish } = options ?? {};
	try {
		return JSON.stringify(_removeNullish ? removeNullish(obj) : obj, null, prettier ? 4 : 0);
	} catch {
		return null;
	}
}
function jsonDecode(json) {
	if (!json) return null;
	try {
		return JSON.parse(json);
	} catch {
		return null;
	}
}
function removeBy(data, by) {
	if (!data) return data;
	if (Array.isArray(data)) return data.filter((e) => !by(e));
	const res = {};
	for (const key in data) if (!by(data[key])) res[key] = data[key];
	return res;
}
function removeNullish(data) {
	return removeBy(data, (e) => e == null);
}

//#endregion
//#region node_modules/.pnpm/@del-wang+utils@1.5.0_@types+node@24.6.1/node_modules/@del-wang/utils/dist/node/io.js
const kRoot = process.cwd();
const exists = (filePath) => fs.existsSync(filePath);
const readFile = async (filePath, options) => {
	const dirname = path.dirname(filePath);
	if (!fs.existsSync(dirname)) return;
	return await new Promise((resolve) => {
		fs.readFile(filePath, options, (err, data) => {
			resolve(err ? void 0 : data);
		});
	});
};
const writeFile = async (filePath, data, options) => {
	if (!data) return false;
	const dirname = path.dirname(filePath);
	if (!fs.existsSync(dirname)) fs.mkdirSync(dirname, { recursive: true });
	return await new Promise((resolve) => {
		if (options) fs.writeFile(filePath, data, options, (err) => {
			resolve(!err);
		});
		else fs.writeFile(filePath, data, (err) => {
			resolve(!err);
		});
	});
};
const writeString = (filePath, content) => writeFile(filePath, content, "utf8");
const readJSON = async (filePath) => jsonDecode(await readFile(filePath, "utf8"));
const writeJSON = (filePath, content) => writeFile(filePath, jsonEncode(content) ?? "", "utf8");

//#endregion
//#region node_modules/.pnpm/ky@1.11.0/node_modules/ky/distribution/errors/HTTPError.js
var HTTPError = class extends Error {
	response;
	request;
	options;
	constructor(response, request, options) {
		const code = response.status || response.status === 0 ? response.status : "";
		const title = response.statusText ?? "";
		const status = `${code} ${title}`.trim();
		const reason = status ? `status code ${status}` : "an unknown error";
		super(`Request failed with ${reason}: ${request.method} ${request.url}`);
		this.name = "HTTPError";
		this.response = response;
		this.request = request;
		this.options = options;
	}
};

//#endregion
//#region node_modules/.pnpm/ky@1.11.0/node_modules/ky/distribution/errors/TimeoutError.js
var TimeoutError = class extends Error {
	request;
	constructor(request) {
		super(`Request timed out: ${request.method} ${request.url}`);
		this.name = "TimeoutError";
		this.request = request;
	}
};

//#endregion
//#region node_modules/.pnpm/ky@1.11.0/node_modules/ky/distribution/core/constants.js
const supportsRequestStreams = (() => {
	let duplexAccessed = false;
	let hasContentType = false;
	const supportsReadableStream = typeof globalThis.ReadableStream === "function";
	const supportsRequest = typeof globalThis.Request === "function";
	if (supportsReadableStream && supportsRequest) try {
		hasContentType = new globalThis.Request("https://empty.invalid", {
			body: new globalThis.ReadableStream(),
			method: "POST",
			get duplex() {
				duplexAccessed = true;
				return "half";
			}
		}).headers.has("Content-Type");
	} catch (error) {
		if (error instanceof Error && error.message === "unsupported BodyInit type") return false;
		throw error;
	}
	return duplexAccessed && !hasContentType;
})();
const supportsAbortController = typeof globalThis.AbortController === "function";
const supportsAbortSignal = typeof globalThis.AbortSignal === "function" && typeof globalThis.AbortSignal.any === "function";
const supportsResponseStreams = typeof globalThis.ReadableStream === "function";
const supportsFormData = typeof globalThis.FormData === "function";
const requestMethods = [
	"get",
	"post",
	"put",
	"patch",
	"head",
	"delete"
];
const validate = () => void 0;
validate();
const responseTypes = {
	json: "application/json",
	text: "text/*",
	formData: "multipart/form-data",
	arrayBuffer: "*/*",
	blob: "*/*",
	bytes: "*/*"
};
const maxSafeTimeout = 2147483647;
const usualFormBoundarySize = new TextEncoder().encode("------WebKitFormBoundaryaxpyiPgbbPti10Rw").length;
const stop = Symbol("stop");
const kyOptionKeys = {
	json: true,
	parseJson: true,
	stringifyJson: true,
	searchParams: true,
	prefixUrl: true,
	retry: true,
	timeout: true,
	hooks: true,
	throwHttpErrors: true,
	onDownloadProgress: true,
	onUploadProgress: true,
	fetch: true
};
const requestOptionsRegistry = {
	method: true,
	headers: true,
	body: true,
	mode: true,
	credentials: true,
	cache: true,
	redirect: true,
	referrer: true,
	referrerPolicy: true,
	integrity: true,
	keepalive: true,
	signal: true,
	window: true,
	dispatcher: true,
	duplex: true,
	priority: true
};

//#endregion
//#region node_modules/.pnpm/ky@1.11.0/node_modules/ky/distribution/utils/body.js
const getBodySize = (body) => {
	if (!body) return 0;
	if (body instanceof FormData) {
		let size = 0;
		for (const [key, value] of body) {
			size += usualFormBoundarySize;
			size += new TextEncoder().encode(`Content-Disposition: form-data; name="${key}"`).length;
			size += typeof value === "string" ? new TextEncoder().encode(value).length : value.size;
		}
		return size;
	}
	if (body instanceof Blob) return body.size;
	if (body instanceof ArrayBuffer) return body.byteLength;
	if (typeof body === "string") return new TextEncoder().encode(body).length;
	if (body instanceof URLSearchParams) return new TextEncoder().encode(body.toString()).length;
	if ("byteLength" in body) return body.byteLength;
	if (typeof body === "object" && body !== null) try {
		const jsonString = JSON.stringify(body);
		return new TextEncoder().encode(jsonString).length;
	} catch {
		return 0;
	}
	return 0;
};
const withProgress = (stream, totalBytes, onProgress) => {
	let previousChunk;
	let transferredBytes = 0;
	return stream.pipeThrough(new TransformStream({
		transform(currentChunk, controller) {
			controller.enqueue(currentChunk);
			if (previousChunk) {
				transferredBytes += previousChunk.byteLength;
				let percent = totalBytes === 0 ? 0 : transferredBytes / totalBytes;
				if (percent >= 1) percent = 1 - Number.EPSILON;
				onProgress?.({
					percent,
					totalBytes: Math.max(totalBytes, transferredBytes),
					transferredBytes
				}, previousChunk);
			}
			previousChunk = currentChunk;
		},
		flush() {
			if (previousChunk) {
				transferredBytes += previousChunk.byteLength;
				onProgress?.({
					percent: 1,
					totalBytes: Math.max(totalBytes, transferredBytes),
					transferredBytes
				}, previousChunk);
			}
		}
	}));
};
const streamResponse = (response, onDownloadProgress) => {
	if (!response.body) return response;
	if (response.status === 204) return new Response(null, {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
	const totalBytes = Number(response.headers.get("content-length")) || 0;
	return new Response(withProgress(response.body, totalBytes, onDownloadProgress), {
		status: response.status,
		statusText: response.statusText,
		headers: response.headers
	});
};
const streamRequest = (request, onUploadProgress, originalBody) => {
	if (!request.body) return request;
	const totalBytes = getBodySize(originalBody ?? request.body);
	return new Request(request, {
		duplex: "half",
		body: withProgress(request.body, totalBytes, onUploadProgress)
	});
};

//#endregion
//#region node_modules/.pnpm/ky@1.11.0/node_modules/ky/distribution/utils/is.js
const isObject = (value) => value !== null && typeof value === "object";

//#endregion
//#region node_modules/.pnpm/ky@1.11.0/node_modules/ky/distribution/utils/merge.js
const validateAndMerge = (...sources) => {
	for (const source of sources) if ((!isObject(source) || Array.isArray(source)) && source !== void 0) throw new TypeError("The `options` argument must be an object");
	return deepMerge({}, ...sources);
};
const mergeHeaders = (source1 = {}, source2 = {}) => {
	const result = new globalThis.Headers(source1);
	const isHeadersInstance = source2 instanceof globalThis.Headers;
	const source = new globalThis.Headers(source2);
	for (const [key, value] of source.entries()) if (isHeadersInstance && value === "undefined" || value === void 0) result.delete(key);
	else result.set(key, value);
	return result;
};
function newHookValue(original, incoming, property) {
	return Object.hasOwn(incoming, property) && incoming[property] === void 0 ? [] : deepMerge(original[property] ?? [], incoming[property] ?? []);
}
const mergeHooks = (original = {}, incoming = {}) => ({
	beforeRequest: newHookValue(original, incoming, "beforeRequest"),
	beforeRetry: newHookValue(original, incoming, "beforeRetry"),
	afterResponse: newHookValue(original, incoming, "afterResponse"),
	beforeError: newHookValue(original, incoming, "beforeError")
});
const deepMerge = (...sources) => {
	let returnValue = {};
	let headers = {};
	let hooks = {};
	for (const source of sources) if (Array.isArray(source)) {
		if (!Array.isArray(returnValue)) returnValue = [];
		returnValue = [...returnValue, ...source];
	} else if (isObject(source)) {
		for (let [key, value] of Object.entries(source)) {
			if (isObject(value) && key in returnValue) value = deepMerge(returnValue[key], value);
			returnValue = {
				...returnValue,
				[key]: value
			};
		}
		if (isObject(source.hooks)) {
			hooks = mergeHooks(hooks, source.hooks);
			returnValue.hooks = hooks;
		}
		if (isObject(source.headers)) {
			headers = mergeHeaders(headers, source.headers);
			returnValue.headers = headers;
		}
	}
	return returnValue;
};

//#endregion
//#region node_modules/.pnpm/ky@1.11.0/node_modules/ky/distribution/utils/normalize.js
const normalizeRequestMethod = (input) => requestMethods.includes(input) ? input.toUpperCase() : input;
const defaultRetryOptions = {
	limit: 2,
	methods: [
		"get",
		"put",
		"head",
		"delete",
		"options",
		"trace"
	],
	statusCodes: [
		408,
		413,
		429,
		500,
		502,
		503,
		504
	],
	afterStatusCodes: [
		413,
		429,
		503
	],
	maxRetryAfter: Number.POSITIVE_INFINITY,
	backoffLimit: Number.POSITIVE_INFINITY,
	delay: (attemptCount) => .3 * 2 ** (attemptCount - 1) * 1e3
};
const normalizeRetryOptions = (retry = {}) => {
	if (typeof retry === "number") return {
		...defaultRetryOptions,
		limit: retry
	};
	if (retry.methods && !Array.isArray(retry.methods)) throw new Error("retry.methods must be an array");
	if (retry.statusCodes && !Array.isArray(retry.statusCodes)) throw new Error("retry.statusCodes must be an array");
	return {
		...defaultRetryOptions,
		...retry
	};
};

//#endregion
//#region node_modules/.pnpm/ky@1.11.0/node_modules/ky/distribution/utils/timeout.js
async function timeout(request, init, abortController, options) {
	return new Promise((resolve, reject) => {
		const timeoutId = setTimeout(() => {
			if (abortController) abortController.abort();
			reject(new TimeoutError(request));
		}, options.timeout);
		options.fetch(request, init).then(resolve).catch(reject).then(() => {
			clearTimeout(timeoutId);
		});
	});
}

//#endregion
//#region node_modules/.pnpm/ky@1.11.0/node_modules/ky/distribution/utils/delay.js
async function delay(ms, { signal }) {
	return new Promise((resolve, reject) => {
		if (signal) {
			signal.throwIfAborted();
			signal.addEventListener("abort", abortHandler, { once: true });
		}
		function abortHandler() {
			clearTimeout(timeoutId);
			reject(signal.reason);
		}
		const timeoutId = setTimeout(() => {
			signal?.removeEventListener("abort", abortHandler);
			resolve();
		}, ms);
	});
}

//#endregion
//#region node_modules/.pnpm/ky@1.11.0/node_modules/ky/distribution/utils/options.js
const findUnknownOptions = (request, options) => {
	const unknownOptions = {};
	for (const key in options) if (!(key in requestOptionsRegistry) && !(key in kyOptionKeys) && !(key in request)) unknownOptions[key] = options[key];
	return unknownOptions;
};
const hasSearchParameters = (search) => {
	if (search === void 0) return false;
	if (Array.isArray(search)) return search.length > 0;
	if (search instanceof URLSearchParams) return search.size > 0;
	if (typeof search === "object") return Object.keys(search).length > 0;
	if (typeof search === "string") return search.trim().length > 0;
	return Boolean(search);
};

//#endregion
//#region node_modules/.pnpm/ky@1.11.0/node_modules/ky/distribution/core/Ky.js
var Ky = class Ky {
	static create(input, options) {
		const ky$1 = new Ky(input, options);
		const function_ = async () => {
			if (typeof ky$1._options.timeout === "number" && ky$1._options.timeout > maxSafeTimeout) throw new RangeError(`The \`timeout\` option cannot be greater than ${maxSafeTimeout}`);
			await Promise.resolve();
			let response = await ky$1._fetch();
			for (const hook of ky$1._options.hooks.afterResponse) {
				const modifiedResponse = await hook(ky$1.request, ky$1._options, ky$1._decorateResponse(response.clone()));
				if (modifiedResponse instanceof globalThis.Response) response = modifiedResponse;
			}
			ky$1._decorateResponse(response);
			if (!response.ok && ky$1._options.throwHttpErrors) {
				let error = new HTTPError(response, ky$1.request, ky$1._options);
				for (const hook of ky$1._options.hooks.beforeError) error = await hook(error);
				throw error;
			}
			if (ky$1._options.onDownloadProgress) {
				if (typeof ky$1._options.onDownloadProgress !== "function") throw new TypeError("The `onDownloadProgress` option must be a function");
				if (!supportsResponseStreams) throw new Error("Streams are not supported in your environment. `ReadableStream` is missing.");
				return streamResponse(response.clone(), ky$1._options.onDownloadProgress);
			}
			return response;
		};
		const result = (ky$1._options.retry.methods.includes(ky$1.request.method.toLowerCase()) ? ky$1._retry(function_) : function_()).finally(async () => {
			const originalRequest = ky$1._originalRequest;
			const cleanupPromises = [];
			if (originalRequest && !originalRequest.bodyUsed) cleanupPromises.push(originalRequest.body?.cancel());
			if (!ky$1.request.bodyUsed) cleanupPromises.push(ky$1.request.body?.cancel());
			await Promise.all(cleanupPromises);
		});
		for (const [type, mimeType] of Object.entries(responseTypes)) {
			if (type === "bytes" && typeof globalThis.Response?.prototype?.bytes !== "function") continue;
			result[type] = async () => {
				ky$1.request.headers.set("accept", ky$1.request.headers.get("accept") || mimeType);
				const response = await result;
				if (type === "json") {
					if (response.status === 204) return "";
					const text = await response.text();
					if (text === "") return "";
					if (options.parseJson) return options.parseJson(text);
					return JSON.parse(text);
				}
				return response[type]();
			};
		}
		return result;
	}
	static #normalizeSearchParams(searchParams) {
		if (searchParams && typeof searchParams === "object" && !Array.isArray(searchParams) && !(searchParams instanceof URLSearchParams)) return Object.fromEntries(Object.entries(searchParams).filter(([, value]) => value !== void 0));
		return searchParams;
	}
	request;
	abortController;
	_retryCount = 0;
	_input;
	_options;
	_originalRequest;
	constructor(input, options = {}) {
		this._input = input;
		this._options = {
			...options,
			headers: mergeHeaders(this._input.headers, options.headers),
			hooks: mergeHooks({
				beforeRequest: [],
				beforeRetry: [],
				beforeError: [],
				afterResponse: []
			}, options.hooks),
			method: normalizeRequestMethod(options.method ?? this._input.method ?? "GET"),
			prefixUrl: String(options.prefixUrl || ""),
			retry: normalizeRetryOptions(options.retry),
			throwHttpErrors: options.throwHttpErrors !== false,
			timeout: options.timeout ?? 1e4,
			fetch: options.fetch ?? globalThis.fetch.bind(globalThis)
		};
		if (typeof this._input !== "string" && !(this._input instanceof URL || this._input instanceof globalThis.Request)) throw new TypeError("`input` must be a string, URL, or Request");
		if (this._options.prefixUrl && typeof this._input === "string") {
			if (this._input.startsWith("/")) throw new Error("`input` must not begin with a slash when using `prefixUrl`");
			if (!this._options.prefixUrl.endsWith("/")) this._options.prefixUrl += "/";
			this._input = this._options.prefixUrl + this._input;
		}
		if (supportsAbortController && supportsAbortSignal) {
			const originalSignal = this._options.signal ?? this._input.signal;
			this.abortController = new globalThis.AbortController();
			this._options.signal = originalSignal ? AbortSignal.any([originalSignal, this.abortController.signal]) : this.abortController.signal;
		}
		if (supportsRequestStreams) this._options.duplex = "half";
		if (this._options.json !== void 0) {
			this._options.body = this._options.stringifyJson?.(this._options.json) ?? JSON.stringify(this._options.json);
			this._options.headers.set("content-type", this._options.headers.get("content-type") ?? "application/json");
		}
		this.request = new globalThis.Request(this._input, this._options);
		if (hasSearchParameters(this._options.searchParams)) {
			const searchParams = "?" + (typeof this._options.searchParams === "string" ? this._options.searchParams.replace(/^\?/, "") : new URLSearchParams(Ky.#normalizeSearchParams(this._options.searchParams)).toString());
			const url = this.request.url.replace(/(?:\?.*?)?(?=#|$)/, searchParams);
			if ((supportsFormData && this._options.body instanceof globalThis.FormData || this._options.body instanceof URLSearchParams) && !(this._options.headers && this._options.headers["content-type"])) this.request.headers.delete("content-type");
			this.request = new globalThis.Request(new globalThis.Request(url, { ...this.request }), this._options);
		}
		if (this._options.onUploadProgress) {
			if (typeof this._options.onUploadProgress !== "function") throw new TypeError("The `onUploadProgress` option must be a function");
			if (!supportsRequestStreams) throw new Error("Request streams are not supported in your environment. The `duplex` option for `Request` is not available.");
			if (this.request.body) this.request = streamRequest(this.request, this._options.onUploadProgress, this._options.body);
		}
	}
	_calculateRetryDelay(error) {
		this._retryCount++;
		if (this._retryCount > this._options.retry.limit || error instanceof TimeoutError) throw error;
		if (error instanceof HTTPError) {
			if (!this._options.retry.statusCodes.includes(error.response.status)) throw error;
			const retryAfter = error.response.headers.get("Retry-After") ?? error.response.headers.get("RateLimit-Reset") ?? error.response.headers.get("X-RateLimit-Reset") ?? error.response.headers.get("X-Rate-Limit-Reset");
			if (retryAfter && this._options.retry.afterStatusCodes.includes(error.response.status)) {
				let after = Number(retryAfter) * 1e3;
				if (Number.isNaN(after)) after = Date.parse(retryAfter) - Date.now();
				else if (after >= Date.parse("2024-01-01")) after -= Date.now();
				const max = this._options.retry.maxRetryAfter ?? after;
				return after < max ? after : max;
			}
			if (error.response.status === 413) throw error;
		}
		const retryDelay = this._options.retry.delay(this._retryCount);
		return Math.min(this._options.retry.backoffLimit, retryDelay);
	}
	_decorateResponse(response) {
		if (this._options.parseJson) response.json = async () => this._options.parseJson(await response.text());
		return response;
	}
	async _retry(function_) {
		try {
			return await function_();
		} catch (error) {
			const ms = Math.min(this._calculateRetryDelay(error), maxSafeTimeout);
			if (this._retryCount < 1) throw error;
			await delay(ms, { signal: this._options.signal });
			for (const hook of this._options.hooks.beforeRetry) if (await hook({
				request: this.request,
				options: this._options,
				error,
				retryCount: this._retryCount
			}) === stop) return;
			return this._retry(function_);
		}
	}
	async _fetch() {
		for (const hook of this._options.hooks.beforeRequest) {
			const result = await hook(this.request, this._options);
			if (result instanceof Request) {
				this.request = result;
				break;
			}
			if (result instanceof Response) return result;
		}
		const nonRequestOptions = findUnknownOptions(this.request, this._options);
		this._originalRequest = this.request;
		this.request = this._originalRequest.clone();
		if (this._options.timeout === false) return this._options.fetch(this._originalRequest, nonRequestOptions);
		return timeout(this._originalRequest, nonRequestOptions, this.abortController, this._options);
	}
};

//#endregion
//#region node_modules/.pnpm/ky@1.11.0/node_modules/ky/distribution/index.js
const createInstance = (defaults) => {
	const ky$1 = (input, options) => Ky.create(input, validateAndMerge(defaults, options));
	for (const method of requestMethods) ky$1[method] = (input, options) => Ky.create(input, validateAndMerge(defaults, options, { method }));
	ky$1.create = (newDefaults) => createInstance(validateAndMerge(newDefaults));
	ky$1.extend = (newDefaults) => {
		if (typeof newDefaults === "function") newDefaults = newDefaults(defaults ?? {});
		return createInstance(validateAndMerge(defaults, newDefaults));
	};
	ky$1.stop = stop;
	return ky$1;
};
const ky = createInstance();
var distribution_default = ky;

//#endregion
//#region src/config.ts
const kAssetsDir = "public/data/assets";
const kMarkdownDir = "public/data/markdown";
const kNotesPath = "public/data/notes.json";
const kStatePath = "public/data/state.json";

//#endregion
//#region node_modules/.pnpm/@del-wang+utils@1.5.0_@types+node@24.6.1/node_modules/@del-wang/utils/dist/core/time.js
const kOneSecond = 1e3;
const kOneMinute = 60 * kOneSecond;
const kOneHour = 60 * kOneMinute;
const kOneDay = 24 * kOneHour;
/**
* 2024-01-01
*/
function formatDate(timestamp$1, offset = 0) {
	return new Date(timestamp$1 + offset * 36e5).toISOString().substring(0, 10);
}

//#endregion
//#region src/utils.ts
const MIMIND_PREFIX = "<MiMind Prdfix>";
/**
* 检测内容是否为 MiMind 思维导图格式
*/
function isMindMap(content) {
	return content.startsWith(MIMIND_PREFIX);
}
/**
* 将 MiMind 思维导图转换为 Markdown 嵌套列表
*/
function mindMapToMarkdown(content) {
	const jsonStr = content.substring(15);
	const mindData = JSON.parse(jsonStr);
	const root = JSON.parse(mindData.content).data;
	const lines = [`# ${root.label}`, ""];
	function traverse(node, depth) {
		const indent = "  ".repeat(depth);
		lines.push(`${indent}- ${node.label}`);
		for (const child of node.children ?? []) traverse(child, depth + 1);
	}
	for (const child of root.children ?? []) traverse(child, 0);
	return lines.join("\n");
}
/**
* 将 HTML <ul>/<li> 列表转换为 Markdown 嵌套列表
*/
function convertHtmlLists(content) {
	if (!content.includes("<ul>")) return content;
	const lines = [];
	let indent = -1;
	let currentText = "";
	let inListItem = false;
	const regex = /(<ul>|<\/ul>|<li>|<\/li>)/g;
	let lastIndex = 0;
	const tokens = [];
	let match;
	while ((match = regex.exec(content)) !== null) {
		if (match.index > lastIndex) tokens.push({
			type: "text",
			text: content.substring(lastIndex, match.index)
		});
		tokens.push({
			type: match[1],
			text: match[1]
		});
		lastIndex = regex.lastIndex;
	}
	if (lastIndex < content.length) tokens.push({
		type: "text",
		text: content.substring(lastIndex)
	});
	for (const token of tokens) switch (token.type) {
		case "<ul>":
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
			if (inListItem) currentText += token.text;
			break;
	}
	return lines.join("\n");
}
/**
* 解码常见 HTML 实体
*/
function decodeHtmlEntities(content) {
	return content.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, "\"").replace(/&#39;/g, "'");
}
/**
* 格式化时间戳为日期时间字符串
* @description 返回 YYYY-MM-DD_HH-mm-ss 格式，用于文件名
* @author xushouwang
* @date 2026-01-21
*/
function formatDateTime(timestamp) {
	const date = new Date(timestamp);
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	const hours = String(date.getHours()).padStart(2, "0");
	const minutes = String(date.getMinutes()).padStart(2, "0");
	const seconds = String(date.getSeconds()).padStart(2, "0");
	return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}
function parseNoteFiles(note) {
	const files = note.setting?.data ?? [];
	const result = [];
	for (const file of files) {
		const date = formatDate(note.createDate);
		const id = file.fileId.split(".")[1];
		const type = file.mimeType.split("/")[0];
		const suffix = file.mimeType.split("/")[1];
		const name = `${type}_${date}_${id}.${suffix}`;
		result.push({
			name,
			id,
			type,
			suffix,
			rawId: file.fileId
		});
	}
	return result;
}
function sanitizePath(filename) {
	return filename.replace(/[/\\?%*:|"<>]/g, "_").replace(/\s+/g, "_").replace(/_{2,}/g, "_").toLowerCase();
}
function getFolderDir(folderName) {
	return `${kMarkdownDir}/${sanitizePath(folderName)}`;
}
/**
* 生成笔记文件路径
* @description 文件名格式：YYYY-MM-DD_HH-mm-ss_标题.md，避免同一天多个笔记被覆盖
* @author xushouwang
* @date 2026-01-21
*/
function getNoteFilePath(note, folders) {
	const name = `${formatDateTime(note.createDate)}_${note.subject}.md`;
	const folderName = folders[note.folderId];
	return `${kMarkdownDir}/${folderName}/${name}`;
}
function parseNoteRawData(_note, _folders) {
	const note = _note;
	const extraInfo = jsonDecode(note.extraInfo) || {};
	note.id = note.id.toString();
	note.folderId = note.folderId.toString();
	note.extraInfo = extraInfo;
	if (!note.content) note.content = note.snippet;
	if (extraInfo.mind_content) note.content = extraInfo.mind_content;
	note.subject = extraInfo.title || note.content.split("\n")[0].slice(0, 10) || "未命名";
	note.subject = sanitizePath(note.subject);
	if (note.setting?.data) note.files = parseNoteFiles(note);
	return note;
}
/**
* 将笔记内容转换为 Markdown 格式
*/
function note2markdown(note) {
	let markdown = note.content;
	if (isMindMap(markdown)) return mindMapToMarkdown(markdown);
	markdown = markdown.replace(/<new-format\s*\/>/g, "");
	markdown = markdown.replace(/<hr\s*\/>/g, "---");
	markdown = markdown.replace(/<quote>(.*?)<\/quote>/gs, "> $1");
	markdown = markdown.replace(/<b>(.*?)<\/b>/g, "**$1**");
	markdown = markdown.replace(/<i>(.*?)<\/i>/g, "*$1*");
	markdown = markdown.replace(/<u>(.*?)<\/u>/g, "<u>$1</u>");
	markdown = markdown.replace(/<delete>(.*?)<\/delete>/g, "~~$1~~");
	markdown = markdown.replace(/<center>(.*?)<\/center>/g, "<center>$1</center>");
	markdown = markdown.replace(/<left>(.*?)<\/left>/g, "<div align=\"left\">$1</div>");
	markdown = markdown.replace(/<right>(.*?)<\/right>/g, "<div align=\"right\">$1</div>");
	markdown = markdown.replace(/<background color="([^"]+)">(.*?)<\/background>/g, (_, color, content) => {
		color = `#${color.slice(3)}${color.slice(1, 3)}`;
		return `<span style="background-color: ${color};">${content}</span>`;
	});
	markdown = markdown.replace(/<size>(.*?)<\/size>/g, "# $1");
	markdown = markdown.replace(/<mid-size>(.*?)<\/mid-size>/g, "## $1");
	markdown = markdown.replace(/<h3-size>(.*?)<\/h3-size>/g, "### $1");
	markdown = markdown.replace(/<order indent="(\d+)" inputNumber="\d+" \/>/g, (_, indentStr) => {
		const indentCount = parseInt(indentStr, 10) - 1;
		return `${"  ".repeat(indentCount)}- `;
	});
	markdown = markdown.replace(/<bullet indent="(\d+)" \/>/g, (_, indentStr) => {
		const indentCount = parseInt(indentStr, 10) - 1;
		return `${"  ".repeat(indentCount)}- `;
	});
	markdown = markdown.replace(/<input type="checkbox" indent="(\d+)" level="\d+"(?: checked="true")? \/>/g, (match, indentStr) => {
		const indentCount = parseInt(indentStr, 10) - 1;
		const spaces = "  ".repeat(indentCount);
		const checked = match.includes("checked=\"true\"") ? "x" : " ";
		return `${spaces}- [${checked}] `;
	});
	for (const file of note.files ?? []) {
		const filePath = `../../assets/${file.name}`;
		markdown = markdown.replace(new RegExp(`<img fileid="${file.rawId}"[^>]*>`, "g"), `![](${filePath})`);
		markdown = markdown.replace(new RegExp(`<sound fileid="${file.rawId}"[^>]*>`, "g"), `[${file.name}](${filePath})`);
		markdown = markdown.replace(new RegExp(`<video fileid="${file.rawId}"[^>]*>`, "g"), `[${file.name}](${filePath})`);
		markdown = markdown.replace(new RegExp(`☺ ${file.rawId}`, "g"), `![](${filePath})`);
	}
	markdown = markdown.replace(/<text indent="(\d+)">(.*?)<\/text>/gs, (_, indentStr, content) => {
		const indentCount = parseInt(indentStr, 10) - 1;
		return "  ".repeat(indentCount) + content;
	});
	markdown = markdown.replaceAll("<input type=\"checkbox\" checked=\"true\" />", "- [x] ");
	markdown = markdown.replaceAll("<input type=\"checkbox\" />", "- [ ] ");
	markdown = convertHtmlLists(markdown);
	markdown = decodeHtmlEntities(markdown);
	markdown = markdown.replaceAll("\n", "\n\n");
	markdown = markdown.replace(/- (.*?)\n\n- /g, "- $1\n- ");
	markdown = markdown.replace(/\n{3,}/g, "\n\n");
	return markdown.trim();
}

//#endregion
//#region src/api.ts
const api = distribution_default.extend({
	headers: {
		cookie: process.env.MI_COOKIE || "",
		referrer: "https://i.mi.com/note/h5",
		"user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:144.0) Gecko/20100101 Firefox/144.0"
	},
	hooks: { afterResponse: [async (input, __, response) => {
		if (response.status === 401 && response.url.startsWith("https://s010.i.mi.com")) return distribution_default(response.url, { headers: input.headers });
	}] }
});
async function get(url) {
	try {
		return await api.get(url).json();
	} catch (e) {
		console.error("❌ 网络异常：", e);
		return;
	}
}
async function download(url, path$1) {
	if (exists(path$1)) return true;
	try {
		const file = await api.get(url).bytes();
		return await writeFile(path$1, file);
	} catch (e) {
		console.error("❌ 网络异常：", e);
		return false;
	}
}
async function getNoteList(syncTag, limit = 200) {
	const res = await get(`https://i.mi.com/note/full/page/?ts=${Date.now()}&limit=${limit}&syncTag=${syncTag}`);
	if (!res?.data?.entries) {
		const divider = "-----------------------------------------------------------------------";
		const tips = `\n${divider}\n👉 获取 Cookie 教程: https://github.com/idootop/mi-note-export/issues/4\n${divider}`;
		if (!process.env.MI_COOKIE || process.env.MI_COOKIE.startsWith("xxx")) throw new Error(`❌ Cookie 未设置，请在 env 文件中设置 MI_COOKIE 后重试。${tips}`);
		throw new Error(`获取笔记列表失败 ${syncTag}\n❌ 当前 Cookie 无效或已过期，请更新 Cookie 后重试。${tips}`);
	}
	const folders = Object.fromEntries(res.data.folders.map((folder) => [folder.id, sanitizePath(folder.subject)]));
	return {
		syncTag: res.data.lastPage ? void 0 : res.data.syncTag,
		notes: res.data.entries.map((entry) => parseNoteRawData(entry, folders)),
		folders
	};
}
async function getNoteDetail(id, folders) {
	const res = await get(`https://i.mi.com/note/note/${id}/?ts=${Date.now()}`);
	if (!res?.data?.entry) throw new Error(`获取笔记详情失败 ${id}`);
	const note = parseNoteRawData(res.data.entry, folders);
	for (const file of note.files ?? []) {
		const path$1 = `${kAssetsDir}/${file.name}`;
		const url = `https://i.mi.com/file/full?fileid=${file.rawId}&type=note_img`;
		if (!await download(url, path$1)) throw new Error(`下载文件失败 ${file.rawId}`);
	}
	return note;
}

//#endregion
//#region src/state.ts
/**
* 加载同步状态
*/
async function loadState() {
	if (!exists(kStatePath)) return null;
	try {
		return await readJSON(kStatePath);
	} catch {
		console.warn("⚠️  读取状态文件失败，将重新开始同步");
		return null;
	}
}
/**
* 保存同步状态
*/
async function saveState(state) {
	await writeJSON(kStatePath, state);
	await writeJSON(kNotesPath, {
		folders: state.folders,
		notes: Object.values(state.notes)
	});
}
/**
* 创建新的同步状态
*/
function createEmptyState() {
	return {
		lastSyncTime: 0,
		notes: {},
		folders: {},
		noteFilePaths: {},
		folderPaths: {}
	};
}

//#endregion
//#region src/sync.ts
async function getNoteEntries(limit = 200) {
	console.log("🔥 获取笔记列表中...");
	let entries = [];
	let folders = { "0": "未分类" };
	let syncTag = "";
	while (syncTag != null) {
		const res = await getNoteList(syncTag, limit);
		syncTag = res.syncTag;
		entries = [...entries, ...res.notes];
		folders = {
			...folders,
			...res.folders
		};
		console.log(`🚗 已获取 ${entries.length} 条笔记...`);
	}
	return {
		entries,
		folders
	};
}
const main = async () => {
	let state = await loadState();
	if (!state) {
		state = createEmptyState();
		console.log("🚗 开始同步笔记");
	} else {
		console.log("♻️ 检测到之前的同步记录，将进行增量更新");
		console.log(`📊 已有 ${Object.keys(state.notes).length} 条笔记`);
	}
	const { entries, folders } = await getNoteEntries();
	await updateNotes(state, entries);
	await updateFolders(state, folders);
	const toSync = [];
	let skipped = 0;
	for (const entry of entries) {
		const existingNote = state.notes[entry.id];
		if (!existingNote || existingNote.modifyDate < entry.modifyDate) toSync.push(entry);
		else skipped++;
	}
	if (toSync.length > 0) console.log(`🔥 需要同步 ${toSync.length} 条笔记`);
	if (skipped > 0) console.log(`⏭️  跳过 ${skipped} 条未修改的笔记`);
	let synced = 0;
	let failed = 0;
	for (let i = 0; i < toSync.length; i++) {
		const entry = toSync[i];
		if (!entry) continue;
		const progress = (i + 1) / toSync.length * 100;
		console.log(`🔥 正在同步第 ${i + 1}/${toSync.length} 条笔记 (${progress.toFixed(2)}%)...`);
		try {
			const note = await getNoteDetail(entry.id, folders);
			const markdown = note2markdown(note);
			const filePath = getNoteFilePath(note, folders);
			const existingNote = state.notes[note.id];
			if (existingNote) {
				const oldFilePath = getNoteFilePath(existingNote, folders);
				if (oldFilePath !== filePath && exists(oldFilePath)) await rm(oldFilePath, { force: true });
			}
			await writeString(filePath, markdown || " ");
			state.notes[note.id] = note;
			state.noteFilePaths[note.id] = filePath;
			synced++;
			if ((i + 1) % 10 === 0) {
				state.lastSyncTime = Date.now();
				await saveState(state);
			}
		} catch (e) {
			console.error(`❌ 同步笔记 ${entry.id} 失败:`, e);
			failed++;
		}
	}
	state.lastSyncTime = Date.now();
	await saveState(state);
	console.log("\n✅ 同步完毕");
	console.log(`  - 总笔记数: ${entries.length}`);
	console.log(`  - 本次同步: ${synced}`);
	if (skipped > 0) console.log(`  - 跳过: ${skipped}`);
	if (failed > 0) console.log(`  - 失败: ${failed}`);
};
main().catch((e) => {
	console.error(e);
	process.exit(1);
});
async function updateNotes(state, entries) {
	const currentNoteIds = new Set(entries.map((e) => e.id));
	const deletedNotes = [];
	for (const noteId of Object.keys(state.notes)) if (!currentNoteIds.has(noteId)) deletedNotes.push(noteId);
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
async function updateFolders(state, newFolders) {
	const deletedFolders = [];
	for (const folderId of Object.keys(state.folders)) if (!newFolders[folderId]) deletedFolders.push(folderId);
	if (deletedFolders.length > 0) {
		console.log(`🗑️  清理 ${deletedFolders.length} 个已删除的文件夹`);
		for (const folderId of deletedFolders) {
			const oldPath = getFolderDir(state.folders[folderId]);
			if (exists(oldPath)) {
				await rm(oldPath, {
					force: true,
					recursive: true
				});
				console.log(`  ❌ 删除: ${oldPath}`);
			}
		}
	}
	for (const [folderId, newName] of Object.entries(newFolders)) {
		const oldName = state.folders[folderId];
		if (oldName && oldName !== newName) {
			console.log(`📁 重命名分类: ${oldName} -> ${newName}`);
			const oldPath = getFolderDir(oldName);
			const newPath = getFolderDir(newName);
			if (exists(oldPath)) await rename(oldPath, newPath);
		}
	}
	state.folders = newFolders;
	state.folderPaths = Object.fromEntries(Object.entries(newFolders).map(([folderId, folderName]) => [folderId, getFolderDir(folderName)]));
	await saveState(state);
}

//#endregion
export {  };