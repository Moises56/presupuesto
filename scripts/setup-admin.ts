import bcrypt from 'bcryptjs';
import sql from 'mssql';

const config: sql.config = {
  server: process.env.AUTH_DB_SERVER || process.env.DB_SERVER || '',
  database: 'presuserdb',
  user: process.env.AUTH_DB_USER || process.env.DB_USER || '',
  password: process.env.AUTH_DB_PASSWORD || process.env.DB_PASSWORD || '',
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

async function setupAdmin() {
  const password = '@Asd.456@';
  const hashedPassword = await bcrypt.hash(password, 10);
  
  console.log('Password hasheado:', hashedPassword);
  console.log('\nConectando a la base de datos...');
  
  try {
    const pool = await sql.connect(config);
    
    // Verificar si el usuario existe
    const checkUser = await pool.request()
      .input('username', sql.NVarChar, 'mougrind')
      .query('SELECT Id FROM Usuarios WHERE Username = @username');
    
    if (checkUser.recordset.length > 0) {
      // Actualizar password
      await pool.request()
        .input('username', sql.NVarChar, 'mougrind')
        .input('password', sql.NVarChar, hashedPassword)
        .query('UPDATE Usuarios SET Password = @password WHERE Username = @username');
      
      console.log('✓ Password del usuario mougrind actualizado correctamente');
    } else {
      // Crear usuario
      await pool.request()
        .input('username', sql.NVarChar, 'mougrind')
        .input('email', sql.NVarChar, 'admin@amdc.hn')
        .input('password', sql.NVarChar, hashedPassword)
        .input('nombre', sql.NVarChar, 'Administrador')
        .input('apellido', sql.NVarChar, 'Sistema')
        .input('numEmpleado', sql.NVarChar, '0001')
        .input('gerencia', sql.NVarChar, 'Tecnología')
        .input('rol', sql.NVarChar, 'admin')
        .query(`
          INSERT INTO Usuarios (Username, Email, Password, Nombre, Apellido, NumEmpleado, Gerencia, Rol)
          VALUES (@username, @email, @password, @nombre, @apellido, @numEmpleado, @gerencia, @rol)
        `);
      
      console.log('✓ Usuario mougrind creado correctamente');
    }
    
    await pool.close();
    console.log('\n══════════════════════════════════════════');
    console.log('Usuario: mougrind');
    console.log('Password: @Asd.456@');
    console.log('══════════════════════════════════════════');
    
  } catch (error) {
    console.error('Error:', error);
  }
  
  process.exit(0);
}

setupAdmin();
