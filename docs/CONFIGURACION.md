# Configuración del Sistema de Presupuesto AMDC

## Variables de Entorno (.env.local)

Agregar las siguientes variables al archivo `.env.local`:

```env
# Base de datos principal (solo lectura)
DB_SERVER=tu_servidor_sql
DB_DATABASE=nombre_bd_presupuesto
DB_USER=usuario_lectura
DB_PASSWORD=password_lectura

# Base de datos de autenticación (presuserdb)
# Si es el mismo servidor, puedes omitir AUTH_DB_SERVER, AUTH_DB_USER, AUTH_DB_PASSWORD
AUTH_DB_SERVER=tu_servidor_sql
AUTH_DB_DATABASE=presuserdb
AUTH_DB_USER=usuario_auth
AUTH_DB_PASSWORD=password_auth

# Auth.js - Generar con: openssl rand -base64 32
AUTH_SECRET=tu_secret_generado_aqui
```

## Configuración de Base de Datos

### 1. Crear la base de datos presuserdb

Ejecutar el script SQL ubicado en:
```
scripts/create_presuserdb.sql
```

Este script creará:
- Base de datos `presuserdb`
- Tabla `Usuarios`
- Tabla `Bitacora`
- Usuario administrador inicial: `mougrind`

### 2. Usuario Administrador Inicial

- **Username:** mougrind
- **Password:** @Asd.456@
- **Email:** admin@amdc.hn

## Estructura de Tablas

### Tabla Usuarios
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Id | INT | ID único |
| Username | NVARCHAR(50) | Nombre de usuario único |
| Email | NVARCHAR(100) | Email único |
| Password | NVARCHAR(255) | Hash bcrypt |
| Nombre | NVARCHAR(50) | Nombre |
| Apellido | NVARCHAR(50) | Apellido |
| NumEmpleado | NVARCHAR(20) | Número de empleado |
| Gerencia | NVARCHAR(100) | Gerencia/Departamento |
| Rol | NVARCHAR(20) | admin/usuario |
| Activo | BIT | Estado activo |
| FechaCreacion | DATETIME | Fecha de creación |
| UltimoAcceso | DATETIME | Último inicio de sesión |

### Tabla Bitacora
| Campo | Tipo | Descripción |
|-------|------|-------------|
| Id | INT | ID único |
| UsuarioId | INT | FK a Usuarios |
| Username | NVARCHAR(50) | Username del usuario |
| Accion | NVARCHAR(50) | LOGIN, LOGOUT, BUSCAR_PARTIDA, GENERAR_PDF |
| Detalle | NVARCHAR(500) | Detalles de la acción |
| IpAddress | NVARCHAR(45) | IP del cliente |
| UserAgent | NVARCHAR(255) | Navegador/Cliente |
| FechaHora | DATETIME | Fecha y hora de la acción |

## Comandos

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Iniciar producción
npm run start -p 3006
```
