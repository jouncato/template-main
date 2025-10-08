import * as dotenv from 'dotenv';

// Cargar variables de entorno lo más temprano posible
dotenv.config();

/**
 * Configuración de rutas que se evalúa en tiempo de carga del módulo
 * @author Celula Azure
 */

// Obtener la ruta desde variable de entorno, cargada por dotenv
export const TRANSACTION_CONTROLLER_PATH =
  process.env.CONTROLLER_PATH ?? 'api/transactions';
