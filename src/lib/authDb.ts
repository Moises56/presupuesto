import sql from 'mssql';

const authConfig: sql.config = {
  server: process.env.AUTH_DB_SERVER || process.env.DB_SERVER || '',
  database: process.env.AUTH_DB_DATABASE || 'presuserdb',
  user: process.env.AUTH_DB_USER || process.env.DB_USER || '',
  password: process.env.AUTH_DB_PASSWORD || process.env.DB_PASSWORD || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let authPool: sql.ConnectionPool | null = null;

export async function getAuthConnection(): Promise<sql.ConnectionPool> {
  if (authPool && authPool.connected) {
    return authPool;
  }
  // Usar ConnectionPool específico para evitar conflicto con otras conexiones
  authPool = new sql.ConnectionPool(authConfig);
  await authPool.connect();
  return authPool;
}

export interface Usuario {
  Id: number;
  Username: string;
  Email: string;
  Password: string;
  Nombre: string;
  Apellido: string;
  NumEmpleado: string;
  Gerencia: string;
  Rol: string;
  Activo: boolean;
  FechaCreacion: Date;
  UltimoAcceso: Date | null;
}

export async function findUserByUsernameOrEmail(identifier: string): Promise<Usuario | null> {
  const pool = await getAuthConnection();
  
  const result = await pool.request()
    .input('identifier', sql.NVarChar, identifier)
    .query(`
      SELECT * FROM Usuarios 
      WHERE (Username = @identifier OR Email = @identifier) AND Activo = 1
    `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return result.recordset[0] as Usuario;
}

export async function updateLastAccess(userId: number): Promise<void> {
  const pool = await getAuthConnection();
  
  // Fecha/hora local de Honduras (UTC-6)
  const fechaHoraLocal = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Tegucigalpa' }));
  
  await pool.request()
    .input('userId', sql.Int, userId)
    .input('fechaHora', sql.DateTime, fechaHoraLocal)
    .query('UPDATE Usuarios SET UltimoAcceso = @fechaHora WHERE Id = @userId');
}

export async function registrarBitacora(
  usuarioId: number,
  username: string,
  accion: string,
  detalle?: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const pool = await getAuthConnection();
  
  // Fecha/hora local de Honduras (UTC-6)
  const fechaHoraLocal = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Tegucigalpa' }));
  
  await pool.request()
    .input('usuarioId', sql.Int, usuarioId)
    .input('username', sql.NVarChar, username)
    .input('accion', sql.NVarChar, accion)
    .input('detalle', sql.NVarChar, detalle || null)
    .input('ipAddress', sql.NVarChar, ipAddress || null)
    .input('userAgent', sql.NVarChar, userAgent || null)
    .input('fechaHora', sql.DateTime, fechaHoraLocal)
    .query(`
      INSERT INTO Bitacora (UsuarioId, Username, Accion, Detalle, IpAddress, UserAgent, FechaHora)
      VALUES (@usuarioId, @username, @accion, @detalle, @ipAddress, @userAgent, @fechaHora)
    `);
}

export async function updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
  const pool = await getAuthConnection();
  
  await pool.request()
    .input('userId', sql.Int, userId)
    .input('password', sql.NVarChar, hashedPassword)
    .query('UPDATE Usuarios SET Password = @password WHERE Id = @userId');
}

// ============ CRUD USUARIOS ============

export async function getAllUsuarios(): Promise<Omit<Usuario, 'Password'>[]> {
  const pool = await getAuthConnection();
  
  const result = await pool.request()
    .query(`
      SELECT Id, Username, Email, Nombre, Apellido, NumEmpleado, Gerencia, Rol, Activo, FechaCreacion, UltimoAcceso
      FROM Usuarios
      ORDER BY FechaCreacion DESC
    `);
  
  return result.recordset;
}

export async function getUsuarioById(id: number): Promise<Omit<Usuario, 'Password'> | null> {
  const pool = await getAuthConnection();
  
  const result = await pool.request()
    .input('id', sql.Int, id)
    .query(`
      SELECT Id, Username, Email, Nombre, Apellido, NumEmpleado, Gerencia, Rol, Activo, FechaCreacion, UltimoAcceso
      FROM Usuarios
      WHERE Id = @id
    `);
  
  if (result.recordset.length === 0) {
    return null;
  }
  
  return result.recordset[0];
}

export interface CreateUsuarioData {
  Username: string;
  Email: string;
  Password: string;
  Nombre: string;
  Apellido: string;
  NumEmpleado: string;
  Gerencia: string;
  Rol: string;
}

export async function createUsuario(data: CreateUsuarioData): Promise<number> {
  const pool = await getAuthConnection();
  
  const result = await pool.request()
    .input('username', sql.NVarChar, data.Username)
    .input('email', sql.NVarChar, data.Email)
    .input('password', sql.NVarChar, data.Password)
    .input('nombre', sql.NVarChar, data.Nombre)
    .input('apellido', sql.NVarChar, data.Apellido)
    .input('numEmpleado', sql.NVarChar, data.NumEmpleado)
    .input('gerencia', sql.NVarChar, data.Gerencia)
    .input('rol', sql.NVarChar, data.Rol)
    .query(`
      INSERT INTO Usuarios (Username, Email, Password, Nombre, Apellido, NumEmpleado, Gerencia, Rol)
      OUTPUT INSERTED.Id
      VALUES (@username, @email, @password, @nombre, @apellido, @numEmpleado, @gerencia, @rol)
    `);
  
  return result.recordset[0].Id;
}

export interface UpdateUsuarioData {
  Username?: string;
  Email?: string;
  Nombre?: string;
  Apellido?: string;
  NumEmpleado?: string;
  Gerencia?: string;
  Rol?: string;
  Activo?: boolean;
}

export async function updateUsuario(id: number, data: UpdateUsuarioData): Promise<void> {
  const pool = await getAuthConnection();
  
  const fields: string[] = [];
  const request = pool.request().input('id', sql.Int, id);
  
  if (data.Username !== undefined) {
    fields.push('Username = @username');
    request.input('username', sql.NVarChar, data.Username);
  }
  if (data.Email !== undefined) {
    fields.push('Email = @email');
    request.input('email', sql.NVarChar, data.Email);
  }
  if (data.Nombre !== undefined) {
    fields.push('Nombre = @nombre');
    request.input('nombre', sql.NVarChar, data.Nombre);
  }
  if (data.Apellido !== undefined) {
    fields.push('Apellido = @apellido');
    request.input('apellido', sql.NVarChar, data.Apellido);
  }
  if (data.NumEmpleado !== undefined) {
    fields.push('NumEmpleado = @numEmpleado');
    request.input('numEmpleado', sql.NVarChar, data.NumEmpleado);
  }
  if (data.Gerencia !== undefined) {
    fields.push('Gerencia = @gerencia');
    request.input('gerencia', sql.NVarChar, data.Gerencia);
  }
  if (data.Rol !== undefined) {
    fields.push('Rol = @rol');
    request.input('rol', sql.NVarChar, data.Rol);
  }
  if (data.Activo !== undefined) {
    fields.push('Activo = @activo');
    request.input('activo', sql.Bit, data.Activo);
  }
  
  if (fields.length > 0) {
    await request.query(`UPDATE Usuarios SET ${fields.join(', ')} WHERE Id = @id`);
  }
}

export async function deleteUsuario(id: number): Promise<void> {
  const pool = await getAuthConnection();
  
  await pool.request()
    .input('id', sql.Int, id)
    .query('DELETE FROM Usuarios WHERE Id = @id');
}

export async function checkUsernameExists(username: string, excludeId?: number): Promise<boolean> {
  const pool = await getAuthConnection();
  
  const request = pool.request().input('username', sql.NVarChar, username);
  let query = 'SELECT COUNT(*) as count FROM Usuarios WHERE Username = @username';
  
  if (excludeId) {
    query += ' AND Id != @excludeId';
    request.input('excludeId', sql.Int, excludeId);
  }
  
  const result = await request.query(query);
  return result.recordset[0].count > 0;
}

export async function checkEmailExists(email: string, excludeId?: number): Promise<boolean> {
  const pool = await getAuthConnection();
  
  const request = pool.request().input('email', sql.NVarChar, email);
  let query = 'SELECT COUNT(*) as count FROM Usuarios WHERE Email = @email';
  
  if (excludeId) {
    query += ' AND Id != @excludeId';
    request.input('excludeId', sql.Int, excludeId);
  }
  
  const result = await request.query(query);
  return result.recordset[0].count > 0;
}

// ============ BITÁCORA ============

export interface BitacoraEntry {
  Id: number;
  UsuarioId: number;
  Username: string;
  Accion: string;
  Detalle: string | null;
  IpAddress: string | null;
  UserAgent: string | null;
  FechaHora: Date;
}

export async function getBitacora(limit: number = 100, offset: number = 0): Promise<BitacoraEntry[]> {
  const pool = await getAuthConnection();
  
  const result = await pool.request()
    .input('limit', sql.Int, limit)
    .input('offset', sql.Int, offset)
    .query(`
      SELECT Id, UsuarioId, Username, Accion, Detalle, IpAddress, UserAgent, FechaHora
      FROM (
        SELECT Id, UsuarioId, Username, Accion, Detalle, IpAddress, UserAgent, FechaHora,
               ROW_NUMBER() OVER (ORDER BY FechaHora DESC) AS RowNum
        FROM Bitacora
      ) AS T
      WHERE RowNum > @offset AND RowNum <= (@offset + @limit)
      ORDER BY FechaHora DESC
    `);
  
  return result.recordset;
}

export async function getBitacoraCount(): Promise<number> {
  const pool = await getAuthConnection();
  
  const result = await pool.request()
    .query('SELECT COUNT(*) as total FROM Bitacora');
  
  return result.recordset[0].total;
}
