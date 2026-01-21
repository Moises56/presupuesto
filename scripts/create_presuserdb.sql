-- ═══════════════════════════════════════════════════════════════════════════════
-- SCRIPT: Crear Base de Datos presuserdb
-- Sistema de Presupuesto AMDC - Módulo de Autenticación
-- ═══════════════════════════════════════════════════════════════════════════════

-- Crear la base de datos
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'presuserdb')
BEGIN
    CREATE DATABASE presuserdb;
END
GO

USE presuserdb;
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLA: Usuarios
-- ═══════════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Usuarios' AND xtype='U')
BEGIN
    CREATE TABLE Usuarios (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        Username        NVARCHAR(50) NOT NULL UNIQUE,
        Email           NVARCHAR(100) NOT NULL UNIQUE,
        Password        NVARCHAR(255) NOT NULL,
        Nombre          NVARCHAR(50) NOT NULL,
        Apellido        NVARCHAR(50) NOT NULL,
        NumEmpleado     NVARCHAR(20) NOT NULL,
        Gerencia        NVARCHAR(100) NOT NULL,
        Rol             NVARCHAR(20) DEFAULT 'usuario',
        Activo          BIT DEFAULT 1,
        FechaCreacion   DATETIME DEFAULT GETDATE(),
        UltimoAcceso    DATETIME NULL
    );
    
    PRINT 'Tabla Usuarios creada exitosamente.';
END
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- TABLA: Bitacora
-- ═══════════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Bitacora' AND xtype='U')
BEGIN
    CREATE TABLE Bitacora (
        Id              INT IDENTITY(1,1) PRIMARY KEY,
        UsuarioId       INT NOT NULL,
        Username        NVARCHAR(50) NOT NULL,
        Accion          NVARCHAR(50) NOT NULL,
        Detalle         NVARCHAR(500) NULL,
        IpAddress       NVARCHAR(45) NULL,
        UserAgent       NVARCHAR(255) NULL,
        FechaHora       DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (UsuarioId) REFERENCES Usuarios(Id)
    );
    
    PRINT 'Tabla Bitacora creada exitosamente.';
END
GO

-- Crear índice para búsquedas en bitácora
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Bitacora_FechaHora')
BEGIN
    CREATE INDEX IX_Bitacora_FechaHora ON Bitacora(FechaHora DESC);
END
GO

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Bitacora_UsuarioId')
BEGIN
    CREATE INDEX IX_Bitacora_UsuarioId ON Bitacora(UsuarioId);
END
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- INSERTAR USUARIO ADMINISTRADOR INICIAL
-- Password: @Asd.456@ (hasheado con bcrypt)
-- ═══════════════════════════════════════════════════════════════════════════════
IF NOT EXISTS (SELECT * FROM Usuarios WHERE Username = 'mougrind')
BEGIN
    INSERT INTO Usuarios (Username, Email, Password, Nombre, Apellido, NumEmpleado, Gerencia, Rol)
    VALUES (
        'mougrind',
        'admin@amdc.hn',
        '$2b$10$pj6ozFce/pBn2ote5Rf5fevcnUDAwcKG8AQwr/ox6/sSxtT0obqRK', -- Password: @Asd.456@
        'Administrador',
        'Sistema',
        '0001',
        'Tecnología',
        'admin'
    );
    
    PRINT 'Usuario administrador mougrind creado exitosamente.';
END
GO

-- ═══════════════════════════════════════════════════════════════════════════════
-- PROCEDIMIENTOS ALMACENADOS
-- ═══════════════════════════════════════════════════════════════════════════════

-- Procedimiento para registrar en bitácora
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'sp_RegistrarBitacora')
    DROP PROCEDURE sp_RegistrarBitacora;
GO

CREATE PROCEDURE sp_RegistrarBitacora
    @UsuarioId INT,
    @Username NVARCHAR(50),
    @Accion NVARCHAR(50),
    @Detalle NVARCHAR(500) = NULL,
    @IpAddress NVARCHAR(45) = NULL,
    @UserAgent NVARCHAR(255) = NULL
AS
BEGIN
    INSERT INTO Bitacora (UsuarioId, Username, Accion, Detalle, IpAddress, UserAgent)
    VALUES (@UsuarioId, @Username, @Accion, @Detalle, @IpAddress, @UserAgent);
    
    -- Actualizar último acceso si es LOGIN
    IF @Accion = 'LOGIN'
    BEGIN
        UPDATE Usuarios SET UltimoAcceso = GETDATE() WHERE Id = @UsuarioId;
    END
END
GO

PRINT '══════════════════════════════════════════════════════════════════════';
PRINT 'Base de datos presuserdb creada exitosamente.';
PRINT 'Tablas: Usuarios, Bitacora';
PRINT 'Usuario admin: mougrind (password se configurará desde la aplicación)';
PRINT '══════════════════════════════════════════════════════════════════════';
GO
