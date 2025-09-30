import { isNotEmpty, isObject, jsonDecode, jsonEncode } from "@del-wang/utils";
import pTimeout from "./p-timeout.js";
import { writeFile } from "@del-wang/utils/node";

type HttpConfig = {
  timeout?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

const _buildURL = (url: string, query?: Record<string, any>) => {
  const _url = new URL(url);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (isNotEmpty(value)) {
      _url.searchParams.append(key, value.toString());
    }
  }
  return _url.href;
};

export const http = {
  timeout: 3000,
  async get<T = any>(
    url: string,
    query?: Record<string, string | number | boolean | undefined>,
    config?: HttpConfig
  ): Promise<T | undefined> {
    const { timeout = http.timeout, headers = {}, signal } = config ?? {};
    const newUrl = query ? _buildURL(url, query) : url;
    const response = await pTimeout(
      fetch(newUrl, {
        method: "GET",
        headers: {
          ...headers,
        },
        signal,
      }).catch((e) => {
        if (!e.message?.includes("aborted")) {
          console.error("❌ 网络异常：", e);
        }
        return undefined;
      }),
      timeout
    ).catch(() => {
      console.error("🕙 请求超时");
      return undefined;
    });
    let result: any = await response?.text();
    result = jsonDecode(result) ?? result;
    return result;
  },
  async post<T = any>(
    url: string,
    data?: any,
    config?: HttpConfig
  ): Promise<T | undefined> {
    const { timeout = http.timeout, headers = {}, signal } = config ?? {};
    const body = isObject(data) ? jsonEncode(data) : data;
    const response = await pTimeout(
      fetch(url, {
        method: "POST",
        headers: {
          ...headers,
        },
        body,
        signal,
      }).catch((e) => {
        if (!e.message?.includes("aborted")) {
          console.error("❌ 网络异常：", e);
        }
        return undefined;
      }),
      timeout
    ).catch(() => {
      console.error("🕙 请求超时");
      return undefined;
    });
    let result: any = await response?.text();
    result = jsonDecode(result) ?? result;
    return result;
  },
  async download(url: string, path: string, config?: HttpConfig) {
    const { timeout = http.timeout, headers = {}, signal } = config ?? {};
    const response = await pTimeout(
      fetch(url, {
        headers: {
          ...headers,
        },
        signal,
      }),
      timeout
    ).catch(() => {
      console.error("🕙 请求超时");
      return undefined;
    });
    if (response?.ok) {
      const buffer = await response.arrayBuffer();
      return await writeFile(path, Buffer.from(buffer));
    }
  },
};
