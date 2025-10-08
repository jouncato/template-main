/**
 * @description Interfaz abstracta que define el contrato para el servicio HTTP.
 * Define los métodos disponibles para realizar peticiones HTTP de manera genérica.
 * Aplica el principio de inversión de dependencias separando la abstracción de la implementación.
 *
 * @author Celula Azure
 */

import { HttpGetParams, HttpParams } from './httpRequestParams';

/**
 * Respuesta HTTP tipada con información extendida
 */
export interface HttpResponse<TData = unknown, TError = any> {
  statusCode?: number;
  success: boolean;
  data?: TData;
  error?: TError;
}

export abstract class IHttpService {
  /**
   * Realiza una petición HTTP GET
   * @template TResponse - Tipo esperado de la respuesta
   * @param params - Parámetros de la petición GET
   * @returns Promise con la respuesta HTTP tipada
   */
  abstract get<TResponse = unknown, TError = unknown>(
    params: HttpGetParams,
  ): Promise<HttpResponse<TResponse, TError>>;

  /**
   * Realiza una petición HTTP POST
   * @template TResponse - Tipo esperado de la respuesta
   * @template TPayload - Tipo del payload enviado
   * @param params - Parámetros de la petición POST
   * @returns Promise con la respuesta HTTP tipada
   */
  abstract post<TResponse = unknown, TPayload = unknown, TError = unknown>(
    params: HttpParams<TPayload>,
  ): Promise<HttpResponse<TResponse, TError>>;

  /**
   * Realiza una petición HTTP PATCH
   * @template TResponse - Tipo esperado de la respuesta
   * @template TPayload - Tipo del payload enviado
   * @param params - Parámetros de la petición PATCH
   * @returns Promise con la respuesta HTTP tipada
   */
  abstract patch<TResponse = unknown, TPayload = unknown, TError = unknown>(
    params: HttpParams<TPayload>,
  ): Promise<HttpResponse<TResponse, TError>>;

  /**
   * Realiza una petición HTTP PUT
   * @template TResponse - Tipo esperado de la respuesta
   * @template TPayload - Tipo del payload enviado
   * @param params - Parámetros de la petición PUT
   * @returns Promise con la respuesta HTTP tipada
   */
  abstract put<TResponse = unknown, TPayload = unknown, TError = unknown>(
    params: HttpParams<TPayload>,
  ): Promise<HttpResponse<TResponse, TError>>;
}
