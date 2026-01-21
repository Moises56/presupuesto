import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getBitacora, getBitacoraCount } from '@/lib/authDb';

// GET - Obtener bitácora (solo admin)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }
    
    if (session.user.rol !== 'admin') {
      return NextResponse.json({ error: 'Solo el administrador puede ver la bitácora' }, { status: 403 });
    }
    
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;
    
    const [entries, total] = await Promise.all([
      getBitacora(limit, offset),
      getBitacoraCount(),
    ]);
    
    return NextResponse.json({
      data: entries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener bitácora:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
