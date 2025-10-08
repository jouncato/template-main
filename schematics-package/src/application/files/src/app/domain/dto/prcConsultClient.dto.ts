import * as sql from 'mssql';

import { ClientRecord, ClientResponseError } from './clientResponse.type';

export class PrcConsultClientInput {
  id_tipo_documento_int: number;
  numero_documento_num: number;

  constructor(data: Partial<PrcConsultClientInput>) {
    this.id_tipo_documento_int = data?.id_tipo_documento_int ?? 0;
    this.numero_documento_num = data?.numero_documento_num ?? 0;
  }

  toSqlParams(): Record<string, { type: sql.ISqlType; value: any }> {
    return {
      id_tipo_documento_int: {
        type: sql.Int(),
        value: this.id_tipo_documento_int,
      },
      numero_documento_num: {
        type: sql.Numeric(),
        value: this.numero_documento_num,
      },
    };
  }
}

export interface PrcConsultClientResult {
  recordsets: [ClientRecord[], ClientResponseError[]];
  recordset: ClientRecord[];
  output: Record<string, never>;
  rowsAffected: number[];
  returnValue: number;
}
