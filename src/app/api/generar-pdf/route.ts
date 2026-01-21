import { NextRequest, NextResponse } from 'next/server';
import { getPartida } from '@/lib/db';
import { generarPresupuestoPDF } from '@/lib/pdfGenerator';
import { auth } from '@/auth';
import { registrarBitacora } from '@/lib/authDb';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { anio, noPartida } = body;

    if (!anio || !noPartida) {
      return NextResponse.json(
        { error: 'Se requiere año y número de partida' },
        { status: 400 }
      );
    }

    const userId = parseInt(session.user.id);
    const username = session.user.username;
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    // Registrar búsqueda en bitácora
    await registrarBitacora(
      userId,
      username,
      'BUSCAR_PARTIDA',
      `Año: ${anio}, Partida: ${noPartida}`,
      ip,
      userAgent.substring(0, 255)
    );

    const partida = await getPartida(parseInt(anio), parseInt(noPartida));

    if (!partida) {
      return NextResponse.json(
        { error: 'No se encontró la partida especificada' },
        { status: 404 }
      );
    }

    // Registrar generación de PDF en bitácora
    await registrarBitacora(
      userId,
      username,
      'GENERAR_PDF',
      `Año: ${anio}, Partida: ${noPartida}, No_Pda_New: ${partida.No_Pda_New}`,
      ip,
      userAgent.substring(0, 255)
    );

    const pdfBuffer = await generarPresupuestoPDF(partida, parseInt(anio));

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=Presupuesto_${anio}_Partida_${noPartida}.pdf`,
      },
    });
  } catch (error) {
    console.error('Error al generar PDF:', error);
    return NextResponse.json(
      { error: 'Error al generar el PDF: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
