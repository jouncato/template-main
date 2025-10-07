export interface ClientRecord {
  iCodeErrorId: number;
  vchMessageError: string;
  id_tipo_documento_int: number;
  numero_documento_num: number;
  nombre_razon_social_vch: string;
  contrato_marco_vch: string;
  estado_contrato_bit: number | boolean;
}

export interface ClientResponseError {
  iCodeErrorId: number;
  vchMessageError: string;
}
