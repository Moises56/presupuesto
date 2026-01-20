import { NextRequest, NextResponse } from 'next/server';
import { getPartida } from '@/lib/db';
import { generarPresupuestoPDF } from '@/lib/pdfGenerator';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { anio, noPartida } = body;

    if (!anio || !noPartida) {
      return NextResponse.json(
        { error: 'Se requiere año y número de partida' },
        { status: 400 }
      );
    }

    const partida = await getPartida(parseInt(anio), parseInt(noPartida));

    if (!partida) {
      return NextResponse.json(
        { error: 'No se encontró la partida especificada' },
        { status: 404 }
      );
    }

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
