import axios, { AxiosRequestConfig } from 'axios';

const _http = axios.create({
  timeout: 3000,
  baseURL: kAPI!,
  headers: {
    'Content-Type': 'application/json',
  },
});

_http.interceptors.request.use((requestConfig) => {
  if (requestConfig.baseURL === kAPI) {
    const timestamp = new Date().toISOString();
    requestConfig.headers!['timestamp'] = timestamp;
  }
  return requestConfig;
});

interface HttpError {
  isError: true;
  code: string;
  message: string;
}

_http.interceptors.response.use(
  (res) => res.data.data,
  (err) => {
    const apiError: HttpError = {
      isError: true,
      code: err.response.data?.code ?? err.code ?? 'UNKNOWN CODE',
      message: err.response.data?.msg ?? err.message ?? 'UNKNOWN ERROR',
    };
    console.error(
      '❌ Network request failed:',
      apiError.code,
      apiError.message,
    );
    return apiError;
  },
);

export const http = {
  get<T = any>(
    url: string,
    query?: Record<string, string | number | boolean | undefined>,
    config?: AxiosRequestConfig<any> | undefined,
  ): Promise<T | HttpError> {
    if (query) {
      url +=
        '?' +
        Object.entries(query)
          .map(
            ([k, v = '']) =>
              `${encodeURIComponent(k)}=${encodeURIComponent(v)}`,
          )
          .join('&');
    }
    return _http.get<T>(url, config) as any;
  },
  post<T = any>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig<any> | undefined,
  ): Promise<T | HttpError> {
    return _http.post<T>(url, data, config) as any;
  },
};
