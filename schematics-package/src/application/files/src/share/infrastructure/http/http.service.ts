import * as http from 'http';
import * as https from 'https';

import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';

import apm from 'elastic-apm-node';

import { safeJsonParse } from '@src/share/utils/utils';
import { Logger20Service } from '@share/domain/config/logger/logger20.service';

import { ApmService } from '../../domain/config/apm/apm.service';
import { LogExecutionAndCatch } from '../../domain/config/decorators/logExecutionAndCatch.decorator';
import {
  ExecuteHttpRequestParams,
  HttpGetParams,
  HttpParams,
} from '../../domain/interfaces/httpRequestParams';
import {
  HttpResponse,
  IHttpService,
} from '../../domain/interfaces/IHttpService';
import envConfig from '../../domain/resources/env.config';

/**
 * Servicio HTTP optimizado que maneja peticiones HTTP/HTTPS con configuración flexible.
 *
 * Variables de entorno utilizadas:
 * @param
 *  - Timeout por defecto para peticiones HTTP (ms)
 * @param DISABLE_SSL_VERIFICATION - Deshabilitar verificación de certificados SSL (true/false)
 * @param HTTP_KEEP_ALIVE - Habilitar keep-alive para conexiones HTTPS (true/false)
 *
 * CONFIGURACIÓN SSL:
 * - La verificación SSL se controla mediante DISABLE_SSL_VERIFICATION
 * - Para desarrollo: DISABLE_SSL_VERIFICATION=true
 * - Para producción: DISABLE_SSL_VERIFICATION=false con certificados válidos
 */
@Injectable()
export class HttpService extends IHttpService {
  constructor(
    @Inject(envConfig.KEY)
    private readonly configService: ConfigType<typeof envConfig>,
    private readonly logger: Logger20Service,
    private readonly apmService: ApmService,
  ) {
    super();
  }

  async post<TResponse = unknown, TPayload = unknown, TError = unknown>(
    params: HttpParams<TPayload>,
  ): Promise<HttpResponse<TResponse, TError>> {
    const { url, body, headers = {} } = params;
    const postHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    return this.executeHttpRequest<TResponse, TError>({
      url,
      method: 'POST',
      headers: postHeaders,
      timeout: params.timeout,
      body,
    });
  }

  async get<TResponse = unknown, TError = unknown>(
    params: HttpGetParams,
  ): Promise<HttpResponse<TResponse, TError>> {
    const { url, headers = {}, query } = params;

    return this.executeHttpRequest<TResponse, TError>({
      url,
      method: 'GET',
      headers,
      timeout: params.timeout,
      query,
    });
  }

  async patch<TResponse = unknown, TPayload = unknown, TError = unknown>(
    params: HttpParams<TPayload>,
  ): Promise<HttpResponse<TResponse, TError>> {
    const { url, body, headers = {} } = params;
    const patchHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    return this.executeHttpRequest<TResponse, TError>({
      url,
      method: 'PATCH',
      headers: patchHeaders,
      timeout: params.timeout,
      body,
    });
  }

  async put<TResponse = unknown, TPayload = unknown, TError = unknown>(
    params: HttpParams<TPayload>,
  ): Promise<HttpResponse<TResponse, TError>> {
    const { url, body, headers = {} } = params;
    const putHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };

    return this.executeHttpRequest<TResponse, TError>({
      url,
      method: 'PUT',
      headers: putHeaders,
      timeout: params.timeout,
      body,
    });
  }

  @LogExecutionAndCatch()
  private async executeHttpRequest<TResponse, TError = unknown>(
    params: ExecuteHttpRequestParams,
  ): Promise<HttpResponse<TResponse, TError>> {
    const { method, headers = {}, timeout, body } = params;
    let url = params.url;
    const finalTimeout = this.normalizeTimeout(timeout);

    if (params.query) {
      url = this.buildUrlWithParams(url, params.query);
    }

    this.validateUrl(url);

    const spanAPM: apm.Span | null = this.apmService.startSpan(
      url,
      'http',
      'http',
      body && typeof body === 'object' ? JSON.stringify(body) : '',
    );

    const parsedUrl = new URL(url);

    const bodyString = body ? JSON.stringify(body) : '';

    const requestHeaders = { ...headers };
    if (body && bodyString) {
      requestHeaders['Content-Length'] =
        Buffer.byteLength(bodyString).toString();
    }

    const options = this.requestOptions(
      parsedUrl,
      method,
      requestHeaders,
      finalTimeout,
    );
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    return new Promise((resolve) => {
      const req = protocol.request(options, (res) =>
        this.handleResponse<TResponse, TError>(res, resolve, spanAPM),
      );

      req.on('error', (error) => this.handleError(error, resolve, spanAPM));
      req.on('timeout', () => this.handleTimeout(url, req, resolve, spanAPM));

      if (bodyString) {
        req.write(bodyString);
      }

      req.end();
    });
  }

  private validateUrl(url: string): void {
    try {
      new URL(url);
    } catch {
      throw new Error(`Invalid URL: ${url}`);
    }
  }

  private normalizeTimeout(timeout?: number): number {
    return timeout || this.configService.HTTP.TIMEOUT || 5000;
  }

  private requestOptions(
    parsedUrl: URL,
    method: string,
    headers: Record<string, string>,
    timeout: number,
  ): http.RequestOptions {
    const baseHeaders: Record<string, string> = {
      Accept: 'application/json',
    };

    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      baseHeaders['Content-Type'] = 'application/json';
    }

    const options: http.RequestOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        ...baseHeaders,
        ...headers,
      },
      timeout,
    };

    if (parsedUrl.protocol === 'https:') {
      options.agent = new https.Agent({
        rejectUnauthorized: !this.configService.HTTP.DISABLE_SSL_VERIFICATION,
        keepAlive: this.configService.HTTP.KEEP_ALIVE,
      });
    }

    return options;
  }

  private handleResponse<T, TError>(
    res: http.IncomingMessage,
    resolve: (response: HttpResponse<T, TError>) => void,
    spanAPM: apm.Span | null,
  ) {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        if (res.statusCode && res.statusCode >= 400) {
          const parsedError = safeJsonParse(data) as TError;
          resolve({
            statusCode: res.statusCode,
            success: false,
            error: parsedError,
          });
        } else {
          const parsedData = safeJsonParse(data) as T;
          resolve({
            statusCode: res.statusCode,
            success: true,
            data: parsedData,
          });
        }
      } catch (error: unknown) {
        this.logger.error(
          `Error processing response: ${(error as Error)?.message}`,
        );
        resolve({
          statusCode: res.statusCode,
          success: false,
          error: {
            statusCode: 500,
            message: `Error processing response: ${(error as Error)?.message}`,
          } as TError,
        });
      } finally {
        if (spanAPM) spanAPM.end();
      }
    });
  }

  private handleError(
    error: Error,
    resolve: (response: HttpResponse<any>) => void,
    spanAPM: apm.Span | null,
  ) {
    if (
      error.message.includes('certificate') ||
      error.message.includes('SSL') ||
      error.message.includes('TLS')
    ) {
      this.logger.error(`SSL/Certificate Error: ${error.message}`);
      this.logger.warn(
        'Verificar configuración de certificados SSL. El servidor remoto puede tener un certificado expirado o inválido.',
      );
    } else {
      this.logger.error(`Request Error: ${error.message}`);
    }

    resolve({
      success: false,
      error: {
        statusCode: 500,
        message: error.message,
      },
    });
    if (spanAPM) spanAPM.end();
  }

  private handleTimeout(
    url: string,
    req: http.ClientRequest,
    resolve: (response: HttpResponse<any>) => void,
    spanAPM: apm.Span | null,
  ) {
    this.logger.error(`Request Timeout: ${url}`);

    req.destroy();
    resolve({
      success: false,
      error: {
        statusCode: 408,
        message: 'Request Timeout',
      },
    });
    if (spanAPM) spanAPM.end();
  }

  private buildUrlWithParams(url: string, query?: object): string {
    if (!query || Object.keys(query).length === 0) {
      return url;
    }

    const urlObj = new URL(url);

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        urlObj.searchParams.append(key, String(value));
      }
    });

    return urlObj.toString();
  }
}
