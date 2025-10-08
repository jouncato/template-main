/**
 * Interfaces para los parámetros de las peticiones HTTP con tipado mejorado
 */
export interface HttpRequestParams {
  url: string;
  headers?: Record<string, string>;
  timeout?: number;
}

export interface HttpGetParams extends HttpRequestParams {
  query?: Record<string, string | number | boolean | undefined>;
}

export interface HttpParams<TPayload = unknown> extends HttpRequestParams {
  body?: TPayload;
}

/**
 * Interfaces para métodos internos de ejecución HTTP
 */
export interface ExecuteHttpRequestParams<TPayload = unknown> {
  url: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT';
  headers?: Record<string, string>;
  timeout?: number;
  body?: TPayload;
  query?: Record<string, string | number | boolean | undefined>;
}
