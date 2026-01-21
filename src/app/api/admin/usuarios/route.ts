import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import bcrypt from 'bcryptjs';
import {
  getAllUsuarios,
  getUsuarioById,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  checkUsernameExists,
  checkEmailExists,
  updateUserPassword,
  registrarBitacora,
} from '@/lib/authDb';

// GET - Listar usuarios (admin y supervisor)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    if (!['admin', 'supervisor'].includes(session.user.rol)) {
      return NextResponse.json({ error: 'No tiene permisos' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (id) {
      const usuario = await getUsuarioById(parseInt(id));
      if (!usuario) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
      }
      return NextResponse.json(usuario);
    }
    
    const usuarios = await getAllUsuarios();
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST - Crear usuario (solo admin)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    if (session.user.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede crear usuarios' }, { status: 403 });
    }
    
    const body = await request.json();
    const { username, email, password, nombre, apellido, numEmpleado, gerencia, rol } = body;
    
    if (!username || !email || !password || !nombre || !apellido || !numEmpleado || !gerencia || !rol) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }
    
    if (!['admin', 'supervisor', 'user'].includes(rol)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }
    
    if (await checkUsernameExists(username)) {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 400 });
    }
    
    if (await checkEmailExists(email)) {
      return NextResponse.json({ error: 'El email ya existe' }, { status: 400 });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const newUserId = await createUsuario({
      Username: username,
      Email: email,
      Password: hashedPassword,
      Nombre: nombre,
      Apellido: apellido,
      NumEmpleado: numEmpleado,
      Gerencia: gerencia,
      Rol: rol,
    });
    
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    await registrarBitacora(
      parseInt(session.user.id),
      session.user.username,
      'CREAR_USUARIO',
      `Usuario creado: ${username} (ID: ${newUserId})`,
      ip
    );
    
    return NextResponse.json({ id: newUserId, message: 'Usuario creado exitosamente' }, { status: 201 });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// PUT - Actualizar usuario (solo admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    if (session.user.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede editar usuarios' }, { status: 403 });
    }
    
    const body = await request.json();
    const { id, username, email, password, nombre, apellido, numEmpleado, gerencia, rol, activo } = body;
    
    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }
    
    const existingUser = await getUsuarioById(id);
    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    if (username && await checkUsernameExists(username, id)) {
      return NextResponse.json({ error: 'El nombre de usuario ya existe' }, { status: 400 });
    }
    
    if (email && await checkEmailExists(email, id)) {
      return NextResponse.json({ error: 'El email ya existe' }, { status: 400 });
    }
    
    if (rol && !['admin', 'supervisor', 'user'].includes(rol)) {
      return NextResponse.json({ error: 'Rol inválido' }, { status: 400 });
    }
    
    await updateUsuario(id, {
      Username: username,
      Email: email,
      Nombre: nombre,
      Apellido: apellido,
      NumEmpleado: numEmpleado,
      Gerencia: gerencia,
      Rol: rol,
      Activo: activo,
    });
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await updateUserPassword(id, hashedPassword);
    }
    
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    await registrarBitacora(
      parseInt(session.user.id),
      session.user.username,
      'EDITAR_USUARIO',
      `Usuario editado: ${existingUser.Username} (ID: ${id})`,
      ip
    );
    
    return NextResponse.json({ message: 'Usuario actualizado exitosamente' });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE - Eliminar usuario (solo admin)
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    if (session.user.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede eliminar usuarios' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID de usuario requerido' }, { status: 400 });
    }
    
    const userId = parseInt(id);
    
    if (userId === parseInt(session.user.id)) {
      return NextResponse.json({ error: 'No puede eliminarse a sí mismo' }, { status: 400 });
    }
    
    const existingUser = await getUsuarioById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }
    
    await deleteUsuario(userId);
    
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    await registrarBitacora(
      parseInt(session.user.id),
      session.user.username,
      'ELIMINAR_USUARIO',
      `Usuario eliminado: ${existingUser.Username} (ID: ${userId})`,
      ip
    );
    
    return NextResponse.json({ message: 'Usuario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
