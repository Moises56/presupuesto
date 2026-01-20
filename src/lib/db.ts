import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER || '',
  database: process.env.DB_DATABASE || '',
  user: process.env.DB_USER || '',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool) {
    return pool;
  }
  pool = await sql.connect(config);
  return pool;
}

export interface PartidaData {
  No_Pda_New: number;
  Nombres_Gerente: string;
  Nombres_Cargo: string;
  PROVEEDOR: string;
  Monto_Pda: number;
  OP_Acumulado: number;
  Vlr_Disponible: number;
  Descripcion: string;
  Codigo_de_Programa: number;
  Nombre_del_Programa: string;
  Codigo_de_Actividad: string;
  Nombre_del_Actividad: string;
  Codigo_de_Estructura: number;
  Nombre_del_Estructura: string;
  Codigo_Centro_de_Costo: number;
  Nombre_Centro_de_Costo: string;
  Codigo_de_Depto: number;
  Nombre_de_Depto: string;
  Grupo: number;
  Sub_Grupo: number;
  Objeto: number;
  Nombre_Objeto_de_Gasto: string;
  Codigo_Organismo: number;
  Nombres_Organismo: string;
  Codigo_Convenio: number;
  Nombres_Convenio: string;
  Fondo: number;
  Nombres_del_Fondo: string;
  Dias_Calendario: string;
  Usuario_Grabo: string;
  Fecha_Grabo: Buffer | string;
  Hora_Grabo: Buffer | string;
}

export async function getPartida(anio: number, noPartida: number): Promise<PartidaData | null> {
  const pool = await getConnection();
  
  const query = `
    SELECT No_Pda_New,
      G.Nombres_Gerente,
      C.Nombres_Cargo,
      P.Beneficiario AS PROVEEDOR,
      P.Monto_Pda,
      P.OP_Acumulado,
      P.Vlr_Disponible,
      P.Descripcion,
      PG.Codigo_de_Programa,
      PG.Nombre_del_Programa,
      A.Codigo_de_Actividad,
      A.Nombre_del_Actividad,
      E.Codigo_de_Estructura,
      E.Nombre_del_Estructura,
      CC.Codigo_Centro_de_Costo,
      CC.Nombre_Centro_de_Costo,
      CC.Codigo_de_Depto,
      CC.Nombre_de_Depto,
      O.Grupo,
      O.Sub_Grupo,
      O.Objeto,
      O.Nombre_Objeto_de_Gasto,
      OG.Codigo_Organismo,
      OG.Nombres_Organismo,
      CV.Codigo_Convenio,
      CV.Nombres_Convenio,
      F.Fondo,
      F.Nombres_del_Fondo,
      P.Dias_Calendario,
      P.Usuario_Grabo,
      P.Fecha_Grabo,
      P.Hora_Grabo
    FROM Partidas_2018 P
    INNER JOIN Gerentes_2018 G ON G.Codigo = P.Numero_Gerente
    INNER JOIN Centro_de_Costo_y_Depto_2018 CC ON (CC.Codigo_Centro_de_Costo = P.Codigo_de_Centro_de_Costo AND CC.Codigo_de_Depto = P.Codigo_de_Depto)
    INNER JOIN Programas_2018 PG ON PG.Codigo_de_Programa = P.Codigo_de_Programa
    INNER JOIN Actividades_2018 A ON A.Codigo_de_Actividad = P.Codigo_de_Actividad
    INNER JOIN Estructura_2018 E ON E.Codigo_de_Estructura = P.Codigo_de_Estructura
    INNER JOIN Objetos_de_Gasto_2010 O ON (O.Grupo = P.Grupo AND O.Sub_Grupo = P.Sub_Grupo AND O.Objeto = P.Objeto)
    INNER JOIN Cargos_2018 C ON C.Codigo = P.Codigo_del_Cargo
    INNER JOIN Organismo OG ON OG.Codigo_Organismo = P.Codigo_Organismo
    INNER JOIN Convenios CV ON CV.Codigo_Convenio = P.Codigo_Convenio
    INNER JOIN Fondos_2018 F ON F.FONDO = P.FONDO
    WHERE P.Anio = @anio AND P.No_Pda_New = @noPartida
  `;

  const result = await pool.request()
    .input('anio', sql.Int, anio)
    .input('noPartida', sql.Int, noPartida)
    .query(query);

  if (result.recordset.length === 0) {
    return null;
  }

  return result.recordset[0] as PartidaData;
}

export function decryptDate(encrypted: Buffer | string): string {
  if (!encrypted) return new Date().toLocaleDateString('es-HN');
  
  if (Buffer.isBuffer(encrypted)) {
    const bytes = encrypted;
    if (bytes.length >= 4) {
      const day = bytes[0] ^ 0xC3;
      const month = bytes[1] ^ 0x49;
      const yearHigh = bytes[2] ^ 0x60;
      const yearLow = bytes[3] ^ 0x24;
      const year = (yearHigh << 8) | yearLow;
      
      if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 2000 && year <= 2100) {
        return `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}/${year}`;
      }
    }
  }
  
  return new Date().toLocaleDateString('es-HN');
}

export function decryptTime(encrypted: Buffer | string): string {
  if (!encrypted) return new Date().toLocaleTimeString('es-HN');
  
  if (Buffer.isBuffer(encrypted)) {
    const bytes = encrypted;
    if (bytes.length >= 4) {
      const hours = bytes[0] ^ 0xC3;
      const minutes = bytes[1] ^ 0x03;
      const seconds = bytes[2] ^ 0x3E;
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59 && seconds >= 0 && seconds <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
    }
  }
  
  return new Date().toLocaleTimeString('es-HN');
}
