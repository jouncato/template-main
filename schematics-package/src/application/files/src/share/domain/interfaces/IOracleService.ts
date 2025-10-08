import * as oracledb from 'oracledb';

/**
 * @description Interfaz abstracta que define el contrato para el servicio de productor de mensajes.
 * Permite cambiar la implementación sin afectar el código cliente.
 *
 * @author Celula Azure
 */
export abstract class IOracleService {
  /**
   * Ejecuta un procedimiento almacenado con soporte completo para IN/OUT binds.
   */
  abstract callProcedure<K = unknown>(
    prcName: string,
    binds: oracledb.BindParameters,
    options?: oracledb.ExecuteOptions,
  ): Promise<oracledb.Result<K>>;

  /**
   * Obtiene una conexión activa del pool configurado.
   */
  abstract getConnection(poolAlias: string): Promise<oracledb.Connection>;

  /**
   * Cierra de manera segura una conexión activa.
   */
  abstract closeConnection(connection: oracledb.Connection): Promise<void>;
}
