import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { PartidaData, decryptDate, decryptTime } from './db';
import path from 'path';
import fs from 'fs';

export async function generarPresupuestoPDF(
  data: PartidaData,
  anio: number
): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]); // Letter size
  
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const width = 612;
  const height = 792;
  const margenIzq = 50;
  let y = height - 50;

  // Logo (mantener proporción original)
  const logoPath = path.join(process.cwd(), 'public', 'logo.jpg');
  if (fs.existsSync(logoPath)) {
    const logoBytes = fs.readFileSync(logoPath);
    const logoImage = await pdfDoc.embedJpg(logoBytes);
    const logoScale = 55 / logoImage.height;
    const logoWidth = logoImage.width * logoScale;
    const logoHeight = 55;
    page.drawImage(logoImage, { x: margenIzq, y: y - logoHeight, width: logoWidth, height: logoHeight });
  }

  // Títulos
  page.drawText('Alcaldia Municipal del Distrito Central', {
    x: width / 2 - helveticaBold.widthOfTextAtSize('Alcaldia Municipal del Distrito Central', 12) / 2,
    y: y - 15,
    size: 12,
    font: helveticaBold,
  });
  
  const tituloPresupuesto = `Presupuesto ${anio}`;
  page.drawText(tituloPresupuesto, {
    x: width / 2 - helveticaBold.widthOfTextAtSize(tituloPresupuesto, 14) / 2,
    y: y - 35,
    size: 14,
    font: helveticaBold,
  });

  // No. de Partida
  page.drawText('No. de Partida', { x: width / 2 - 40, y: y - 60, size: 10, font: helvetica });
  page.drawText(data.No_Pda_New.toString(), { x: width / 2 + 50, y: y - 60, size: 10, font: helvetica });

  y = height - 140;

  // Fecha (usar fecha desencriptada de Fecha_Grabo)
  const fechaGrabo = decryptDate(data.Fecha_Grabo);
  page.drawText('Fecha', { x: margenIzq, y, size: 10, font: helvetica });
  page.drawText(':', { x: margenIzq + 50, y, size: 10, font: helvetica });
  page.drawText(fechaGrabo, { x: margenIzq + 70, y, size: 10, font: helvetica });

  y -= 25;

  // Para
  page.drawText('Para', { x: margenIzq, y, size: 10, font: helvetica });
  page.drawText(':', { x: margenIzq + 50, y, size: 10, font: helvetica });
  page.drawText((data.Nombres_Gerente || '').trim(), { x: margenIzq + 70, y, size: 10, font: helvetica });
  y -= 15;
  page.drawText((data.Nombres_Cargo || '').trim(), { x: margenIzq + 70, y, size: 10, font: helvetica });

  y -= 25;

  // De
  page.drawText('De', { x: margenIzq, y, size: 10, font: helvetica });
  page.drawText(':', { x: margenIzq + 50, y, size: 10, font: helvetica });
  page.drawText('Jefe de Presupuesto', { x: margenIzq + 70, y, size: 10, font: helvetica });

  y -= 25;

  // Proveedor
  page.drawText('Proveedor:', { x: margenIzq, y, size: 10, font: helvetica });
  page.drawText((data.PROVEEDOR || '').trim(), { x: margenIzq + 60, y, size: 10, font: helvetica });

  y -= 25;

  // Suma de Valores
  const sumaText = 'Suma de Valores';
  page.drawText(sumaText, {
    x: width / 2 - helveticaBold.widthOfTextAtSize(sumaText, 10) / 2,
    y,
    size: 10,
    font: helveticaBold,
  });

  y -= 15;
  const tableWidth = 510;
  const colWidth = tableWidth / 3;

  // Dibujar tabla de valores
  page.drawRectangle({ x: margenIzq, y: y - 40, width: tableWidth, height: 40, borderWidth: 1, borderColor: rgb(0, 0, 0) });
  page.drawLine({ start: { x: margenIzq + colWidth, y }, end: { x: margenIzq + colWidth, y: y - 40 }, thickness: 0.5 });
  page.drawLine({ start: { x: margenIzq + colWidth * 2, y }, end: { x: margenIzq + colWidth * 2, y: y - 40 }, thickness: 0.5 });
  page.drawLine({ start: { x: margenIzq, y: y - 20 }, end: { x: margenIzq + tableWidth, y: y - 20 }, thickness: 0.5 });

  page.drawText('Monto Partida', { x: margenIzq + 40, y: y - 12, size: 9, font: helvetica });
  page.drawText('Acumulado por O/P', { x: margenIzq + colWidth + 25, y: y - 12, size: 9, font: helvetica });
  page.drawText('Vlr Disponible', { x: margenIzq + colWidth * 2 + 35, y: y - 12, size: 9, font: helvetica });

  const montoFormatted = data.Monto_Pda.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const acumuladoFormatted = data.OP_Acumulado.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const disponibleFormatted = data.Vlr_Disponible.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  page.drawText(montoFormatted, { x: margenIzq + 50, y: y - 32, size: 10, font: helvetica });
  page.drawText(acumuladoFormatted, { x: margenIzq + colWidth + 55, y: y - 32, size: 10, font: helvetica });
  page.drawText(disponibleFormatted, { x: margenIzq + colWidth * 2 + 40, y: y - 32, size: 10, font: helvetica });

  y -= 55;

  // Descripción
  page.drawText('Descripcion', { x: margenIzq, y, size: 10, font: helveticaBold });
  y -= 15;
  
  // Función para justificar texto
  const justifyText = (text: string, maxWidth: number, fontSize: number) => {
    const words = text.split(' ');
    const lines: string[][] = [];
    let currentLine: string[] = [];
    let currentWidth = 0;
    
    words.forEach(word => {
      const wordWidth = helvetica.widthOfTextAtSize(word + ' ', fontSize);
      if (currentWidth + wordWidth <= maxWidth) {
        currentLine.push(word);
        currentWidth += wordWidth;
      } else {
        if (currentLine.length > 0) lines.push(currentLine);
        currentLine = [word];
        currentWidth = wordWidth;
      }
    });
    if (currentLine.length > 0) lines.push(currentLine);
    return lines;
  };

  const descripcion = (data.Descripcion || '').trim();
  const lineasJustificadas = justifyText(descripcion, tableWidth, 9);
  
  lineasJustificadas.slice(0, 4).forEach((palabras, index) => {
    const isLastLine = index === lineasJustificadas.length - 1 || index === 3;
    if (isLastLine || palabras.length === 1) {
      page.drawText(palabras.join(' '), { x: margenIzq, y, size: 9, font: helvetica });
    } else {
      const textWidth = palabras.reduce((acc, word) => acc + helvetica.widthOfTextAtSize(word, 9), 0);
      const totalSpaces = palabras.length - 1;
      const spaceWidth = (tableWidth - textWidth) / totalSpaces;
      let xPos = margenIzq;
      palabras.forEach((word, i) => {
        page.drawText(word, { x: xPos, y, size: 9, font: helvetica });
        xPos += helvetica.widthOfTextAtSize(word, 9) + spaceWidth;
      });
    }
    y -= 12;
  });

  y -= 15;

  // Programa, Actividad y Estructura
  const progText = 'Programa, Actividad y Estructura';
  page.drawText(progText, {
    x: width / 2 - helveticaBold.widthOfTextAtSize(progText, 10) / 2,
    y,
    size: 10,
    font: helveticaBold,
  });

  y -= 15;

  // Función para formatear códigos con ceros iniciales
  const padCode = (code: string | number, length: number) => String(code).padStart(length, '0');
  
  // Tabla con columnas: Código | Nombre
  const progColWidths = [50, 460];
  
  const programaData = [
    { codigo: padCode(data.Codigo_de_Programa, 2), nombre: (data.Nombre_del_Programa || '').trim() },
    { codigo: padCode(data.Codigo_de_Actividad, 3), nombre: (data.Nombre_del_Actividad || '').trim() },
    { codigo: padCode(data.Codigo_de_Estructura, 3), nombre: (data.Nombre_del_Estructura || '').trim() }
  ];

  programaData.forEach((item) => {
    let xProg = margenIzq;
    page.drawRectangle({ x: xProg, y: y - 15, width: progColWidths[0], height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
    page.drawText(item.codigo, { x: xProg + 15, y: y - 11, size: 9, font: helvetica });
    xProg += progColWidths[0];
    page.drawRectangle({ x: xProg, y: y - 15, width: progColWidths[1], height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
    page.drawText(item.nombre.substring(0, 70), { x: xProg + 5, y: y - 11, size: 9, font: helvetica });
    y -= 15;
  });

  y -= 20;

  // Centro de Costo y Departamento
  const centroText = 'Centro de Costo y Departamento';
  page.drawText(centroText, {
    x: width / 2 - helveticaBold.widthOfTextAtSize(centroText, 10) / 2,
    y,
    size: 10,
    font: helveticaBold,
  });

  y -= 15;

  // Tabla con columnas: Código | Nombre
  const centroColWidths = [50, 460];
  
  const centroData = [
    { codigo: String(data.Codigo_Centro_de_Costo), nombre: (data.Nombre_Centro_de_Costo || '').trim() },
    { codigo: padCode(data.Codigo_de_Depto, 2), nombre: (data.Nombre_de_Depto || '').trim() }
  ];

  centroData.forEach((item) => {
    let xCentro = margenIzq;
    page.drawRectangle({ x: xCentro, y: y - 15, width: centroColWidths[0], height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
    page.drawText(item.codigo, { x: xCentro + 10, y: y - 11, size: 9, font: helvetica });
    xCentro += centroColWidths[0];
    page.drawRectangle({ x: xCentro, y: y - 15, width: centroColWidths[1], height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
    page.drawText(item.nombre.substring(0, 70), { x: xCentro + 5, y: y - 11, size: 9, font: helvetica });
    y -= 15;
  });

  y -= 15;
  page.drawText('Según : Leyes, Procedimientos , Controles y Presupuesto.', { x: margenIzq, y, size: 9, font: helvetica });

  y -= 18;

  // Objetos de Gasto
  const objText = 'Objetos de Gasto';
  page.drawText(objText, {
    x: width / 2 - helveticaBold.widthOfTextAtSize(objText, 10) / 2,
    y,
    size: 10,
    font: helveticaBold,
  });

  y -= 15;

  // Definir anchos de columnas para Objetos de Gasto
  const objColWidths = [60, 60, 80, 310]; // Grupo, Sub, GrupoObjeto, Detalle
  
  // Encabezados
  let xObj = margenIzq;
  page.drawRectangle({ x: xObj, y: y - 15, width: objColWidths[0], height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawText('Grupo', { x: xObj + 10, y: y - 11, size: 9, font: helveticaBold });
  xObj += objColWidths[0];
  
  page.drawRectangle({ x: xObj, y: y - 15, width: objColWidths[1], height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawText('Sub', { x: xObj + 15, y: y - 11, size: 9, font: helveticaBold });
  xObj += objColWidths[1];
  
  page.drawRectangle({ x: xObj, y: y - 15, width: objColWidths[2], height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawText('GrupoObjeto', { x: xObj + 5, y: y - 11, size: 9, font: helveticaBold });
  xObj += objColWidths[2];
  
  page.drawRectangle({ x: xObj, y: y - 15, width: objColWidths[3], height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawText('Detalle', { x: xObj + 10, y: y - 11, size: 9, font: helveticaBold });
  
  y -= 15;

  // Datos
  xObj = margenIzq;
  page.drawRectangle({ x: xObj, y: y - 15, width: objColWidths[0], height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawText(String(data.Grupo), { x: xObj + 20, y: y - 11, size: 9, font: helvetica });
  xObj += objColWidths[0];
  
  page.drawRectangle({ x: xObj, y: y - 15, width: objColWidths[1], height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawText(String(data.Sub_Grupo), { x: xObj + 20, y: y - 11, size: 9, font: helvetica });
  xObj += objColWidths[1];
  
  page.drawRectangle({ x: xObj, y: y - 15, width: objColWidths[2], height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawText(String(data.Objeto), { x: xObj + 25, y: y - 11, size: 9, font: helvetica });
  xObj += objColWidths[2];
  
  page.drawRectangle({ x: xObj, y: y - 15, width: objColWidths[3], height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawText((data.Nombre_Objeto_de_Gasto || '').trim().substring(0, 45), { x: xObj + 10, y: y - 11, size: 9, font: helvetica });
  
  y -= 25;

  // Organismo, Convenio, Fondos
  const orgWidth1 = 70;
  const orgWidth2 = 170;
  const orgWidth3 = 70;
  const orgWidth4 = 200;

  // Fila 1 - Organismo
  page.drawRectangle({ x: margenIzq, y: y - 15, width: orgWidth1, height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawRectangle({ x: margenIzq + orgWidth1, y: y - 15, width: orgWidth2 + orgWidth3 + orgWidth4, height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawText('Organismo', { x: margenIzq + 5, y: y - 11, size: 9, font: helvetica });
  page.drawText(`${data.Codigo_Organismo} ${(data.Nombres_Organismo || '').trim().substring(0, 40)}`, { x: margenIzq + orgWidth1 + 5, y: y - 11, size: 9, font: helvetica });
  y -= 15;

  // Fila 2 - Convenio
  page.drawRectangle({ x: margenIzq, y: y - 15, width: orgWidth1, height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawRectangle({ x: margenIzq + orgWidth1, y: y - 15, width: orgWidth2 + orgWidth3 + orgWidth4, height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawText('Convenio', { x: margenIzq + 5, y: y - 11, size: 9, font: helvetica });
  page.drawText(`${data.Codigo_Convenio} ${(data.Nombres_Convenio || '').trim().substring(0, 40)}`, { x: margenIzq + orgWidth1 + 5, y: y - 11, size: 9, font: helvetica });
  y -= 15;

  // Fila 3 - Fondos y Vigencia
  page.drawRectangle({ x: margenIzq, y: y - 15, width: orgWidth1, height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawRectangle({ x: margenIzq + orgWidth1, y: y - 15, width: orgWidth2, height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawRectangle({ x: margenIzq + orgWidth1 + orgWidth2, y: y - 15, width: orgWidth3, height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawRectangle({ x: margenIzq + orgWidth1 + orgWidth2 + orgWidth3, y: y - 15, width: orgWidth4, height: 15, borderWidth: 0.5, borderColor: rgb(0, 0, 0) });
  page.drawText('Fondos', { x: margenIzq + 5, y: y - 11, size: 9, font: helvetica });
  page.drawText(`${data.Fondo} ${(data.Nombres_del_Fondo || '').trim().substring(0, 20)}`, { x: margenIzq + orgWidth1 + 5, y: y - 11, size: 9, font: helvetica });
  page.drawText('Vigencia', { x: margenIzq + orgWidth1 + orgWidth2 + 5, y: y - 11, size: 9, font: helvetica });
  page.drawText((data.Dias_Calendario || '').trim(), { x: margenIzq + orgWidth1 + orgWidth2 + orgWidth3 + 5, y: y - 11, size: 9, font: helvetica });

  y -= 35;

  // Pie de página
  const horaGrabo = decryptTime();

  page.drawText(`Elaborado Por   ${(data.Usuario_Grabo || '').trim()}`, { x: margenIzq, y, size: 10, font: helvetica });
  page.drawText(`Fecha    ${fechaGrabo}`, { x: width / 2 - 50, y, size: 10, font: helvetica });
  page.drawText(`Hora       ${horaGrabo}`, { x: width - 150, y, size: 10, font: helvetica });

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
