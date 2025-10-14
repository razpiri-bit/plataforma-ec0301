const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, 'public')));

// ===== APIS DE AUTENTICACIÓN Y PAGO =====

// Procesar pago con tarjeta de prueba
app.post('/api/process-payment', (req, res) => {
  const { cardNumber } = req.body || {};
  const clean = (cardNumber || '').replace(/\s/g, '');
  
  if (clean !== '4111111111111111') {
    return res.status(400).json({ 
      success: false, 
      message: 'Tarjeta inválida. Use: 4111 1111 1111 1111' 
    });
  }
  
  // Simular demora de procesamiento
  setTimeout(() => {
    res.json({ 
      success: true, 
      transactionId: 'TXN-' + Date.now(), 
      amount: 2500 
    });
  }, 800);
});

// Generar clave de acceso
app.post('/api/generate-access-key', (_req, res) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let key = 'EC01-';
  
  for (let i = 0; i < 8; i++) {
    if (i === 4) key += '-';
    key += chars[Math.floor(Math.random() * chars.length)];
  }
  
  const expiry = new Date();
  expiry.setMonth(expiry.getMonth() + 3);
  
  res.json({ 
    success: true, 
    accessKey: key, 
    expiry: expiry.toISOString() 
  });
});

// Registrar usuario
app.post('/api/register-user', (req, res) => {
  const { name, email, whatsapp, accessKey } = req.body || {};
  
  // Validaciones
  if (!name || !email || !whatsapp) {
    return res.status(400).json({ 
      success: false, 
      message: 'Todos los campos son requeridos' 
    });
  }
  
  if (!/^EC01-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(accessKey || '')) {
    return res.status(400).json({ 
      success: false, 
      message: 'Formato de clave de acceso incorrecto' 
    });
  }
  
  res.json({ 
    success: true, 
    userId: 'USR-' + Date.now(),
    message: 'Usuario registrado exitosamente'
  });
});

// ===== APIS DE GENERACIÓN DE PDFs =====

// Evaluación Diagnóstica
app.post('/api/generate-diag-pdf', (req, res) => {
  try {
    const { encabezado, preguntas } = req.body;
    
    // Simulación de PDF usando texto plano (placeholder)
    let content = `EVALUACIÓN DIAGNÓSTICA\n\n`;
    content += `Curso: ${encabezado.curso || ''}\n`;
    content += `Instructor: ${encabezado.instructor || ''}\n`;
    content += `Lugar: ${encabezado.lugar || ''}\n`;
    content += `Duración: ${encabezado.duracion || ''} hrs\n`;
    content += `Fecha: ${encabezado.fecha || ''}\n\n`;
    content += `INSTRUCCIONES: Responda las siguientes preguntas de acuerdo a sus conocimientos previos.\n\n`;
    
    (preguntas || []).forEach((q, i) => {
      content += `${i + 1}. ${q.texto || ''}\n`;
      content += `_`.repeat(60) + '\n\n';
    });
    
    content += `Nombre del participante: _________________________\n`;
    content += `Fecha de aplicación: ____________________________\n`;
    content += `Firma: _________________________________________`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Evaluacion_Diagnostica.pdf"');
    res.send(Buffer.from(content, 'utf-8'));
    
  } catch (error) {
    console.error('Error generando PDF diagnóstica:', error);
    res.status(500).json({ success: false, error: 'Error generando PDF' });
  }
});

// Evaluación Sumativa
app.post('/api/generate-sumativa-pdf', (req, res) => {
  try {
    const { encabezado, configuracion, reactivos } = req.body;
    
    let content = `EVALUACIÓN SUMATIVA\n\n`;
    content += `Curso: ${encabezado.curso || ''}\n`;
    content += `Instructor: ${encabezado.instructor || ''}\n`;
    content += `Lugar: ${encabezado.lugar || ''}\n`;
    content += `Fecha: ${encabezado.fecha || ''}\n\n`;
    content += `Objetivo: ${configuracion.objetivo || ''}\n`;
    content += `Tiempo: ${configuracion.tiempo || 0} minutos\n`;
    content += `Valor por reactivo: ${configuracion.valor_reactivo || 0} puntos\n\n`;
    content += `INSTRUCCIONES: Seleccione la respuesta correcta para cada pregunta.\n\n`;
    
    (reactivos || []).forEach((r, i) => {
      content += `${i + 1}. ${r.pregunta || ''}\n`;
      ['a', 'b', 'c', 'd'].forEach(key => {
        content += `   ${key}) ${r.opciones[key] || ''}\n`;
      });
      content += '\n';
    });
    
    // Hoja de respuestas
    content += `\n${'='.repeat(50)}\n`;
    content += `HOJA DE RESPUESTAS\n\n`;
    (reactivos || []).forEach((r, i) => {
      content += `${i + 1}. ${r.correcta}) ${r.opciones[r.correcta] || ''}\n`;
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Evaluacion_Sumativa.pdf"');
    res.send(Buffer.from(content, 'utf-8'));
    
  } catch (error) {
    console.error('Error generando PDF sumativa:', error);
    res.status(500).json({ success: false, error: 'Error generando PDF' });
  }
});

// Evaluación de Satisfacción
app.post('/api/generate-satisfaction-pdf', (req, res) => {
  try {
    const { encabezado, preguntasSeleccionadas, preguntasAbiertas } = req.body;
    
    let content = `EVALUACIÓN DE SATISFACCIÓN\n\n`;
    content += `Curso: ${encabezado.nombreCurso || ''}\n`;
    content += `Instructor: ${encabezado.nombreInstructor || ''}\n`;
    content += `Lugar: ${encabezado.lugarImparticion || ''}\n`;
    content += `Duración: ${encabezado.duracionCurso || ''}\n`;
    content += `Horario: ${encabezado.horario || ''}\n`;
    content += `Fecha: ${encabezado.fechaImparticion || ''}\n\n`;
    content += `ESCALA DE EVALUACIÓN:\n`;
    content += `Excelente (10) | Bueno (8-9) | Regular (6-7) | Malo/Deficiente (5)\n\n`;
    
    Object.keys(preguntasSeleccionadas).forEach(seccion => {
      content += `${seccion.toUpperCase()}\n`;
      content += `${'='.repeat(seccion.length)}\n`;
      preguntasSeleccionadas[seccion].forEach((pregunta, i) => {
        content += `${i + 1}. ${pregunta}\n`;
        content += `   [  ] Excelente  [  ] Bueno  [  ] Regular  [  ] Malo\n\n`;
      });
      content += '\n';
    });
    
    content += `PREGUNTAS ABIERTAS\n`;
    content += `${'='.repeat(18)}\n`;
    preguntasAbiertas.forEach((pregunta, i) => {
      content += `${i + 1}. ${pregunta}\n`;
      content += `_`.repeat(60) + '\n';
      content += `_`.repeat(60) + '\n\n';
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Evaluacion_Satisfaccion.pdf"');
    res.send(Buffer.from(content, 'utf-8'));
    
  } catch (error) {
    console.error('Error generando PDF satisfacción:', error);
    res.status(500).json({ success: false, error: 'Error generando PDF' });
  }
});

// Lista de Asistencia
app.post('/api/generate-attendance-pdf', (req, res) => {
  try {
    const { header, num } = req.body;
    
    let content = `LISTA DE ASISTENCIA\n\n`;
    content += `Curso: ${header.curso || ''}\n`;
    content += `Instructor: ${header.instructor || ''}\n`;
    content += `Lugar: ${header.lugar || ''}\n`;
    content += `Fecha: ${header.fecha || ''}\n\n`;
    content += `No.\tNOMBRE\t\t\t\tFIRMA\n`;
    content += `${'='.repeat(60)}\n`;
    
    for (let i = 1; i <= (num || 10); i++) {
      content += `${i}\t_______________________\t_______________________\n\n`;
    }
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Lista_Asistencia.pdf"');
    res.send(Buffer.from(content, 'utf-8'));
    
  } catch (error) {
    console.error('Error generando PDF asistencia:', error);
    res.status(500).json({ success: false, error: 'Error generando PDF' });
  }
});

// Contrato de Aprendizaje
app.post('/api/generate-contract-pdf', (req, res) => {
  try {
    const { header } = req.body;
    
    let content = `CONTRATO DE APRENDIZAJE\n\n`;
    content += `Curso: ${header.curso || ''}\n`;
    content += `Instructor: ${header.instructor || ''}\n`;
    content += `Lugar: ${header.lugar || ''}\n`;
    content += `Fecha: ${header.fecha || ''}\n\n`;
    
    content += `1. COMPROMISOS DEL FACILITADOR/INSTRUCTOR\n`;
    content += `${'='.repeat(40)}\n`;
    const compromisosInstructor = [
      'Proporcionar materiales claros y completos',
      'Facilitar un ambiente de aprendizaje respetuoso',
      'Explicar los conceptos con ejemplos prácticos',
      'Responder preguntas de manera oportuna',
      'Evaluar el progreso de los participantes',
      'Fomentar la participación activa'
    ];
    compromisosInstructor.forEach((c, i) => {
      content += `${i + 1}. ${c}\n`;
    });
    
    content += `\n2. COMPROMISOS DEL PARTICIPANTE\n`;
    content += `${'='.repeat(32)}\n`;
    const compromisosParticipante = [
      'Asistir puntualmente a todas las sesiones',
      'Participar activamente en las actividades',
      'Realizar las tareas y prácticas asignadas',
      'Respetar las normas del grupo y del instructor',
      'Comunicar dudas y retroalimentación',
      'Cumplir con los objetivos de aprendizaje'
    ];
    compromisosParticipante.forEach((c, i) => {
      content += `${i + 1}. ${c}\n`;
    });
    
    content += `\n\n`;
    content += `Nombre y firma del Participante: _________________________\n\n`;
    content += `Firma del Facilitador/Instructor: _______________________\n`;
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Contrato_Aprendizaje.pdf"');
    res.send(Buffer.from(content, 'utf-8'));
    
  } catch (error) {
    console.error('Error generando PDF contrato:', error);
    res.status(500).json({ success: false, error: 'Error generando PDF' });
  }
});

// Lista de Verificación de Requerimientos
app.post('/api/generate-checklist-pdf', (req, res) => {
  try {
    const data = req.body;
    
    let content = `LISTA DE VERIFICACIÓN DE REQUERIMIENTOS\n\n`;
    content += `Curso: ${data.header?.curso || ''}\n`;
    content += `Instructor: ${data.header?.instructor || ''}\n`;
    content += `Lugar: ${data.header?.lugar || ''}\n`;
    content += `Fecha: ${data.header?.fecha || ''}\n\n`;
    
    const secciones = [
      { key: 'instalaciones', title: '1. INSTALACIONES, MOBILIARIO Y DISTRIBUCIÓN' },
      { key: 'equipo', title: '2. EQUIPO DE APOYO Y DISTRIBUCIÓN' },
      { key: 'mats', title: '3. MATERIALES DE APOYO' },
      { key: 'rh', title: '4. REQUERIMIENTOS HUMANOS' },
      { key: 'otros', title: '5. OTROS REQUERIMIENTOS' }
    ];
    
    secciones.forEach(sec => {
      content += `${sec.title}\n`;
      content += `${'='.repeat(sec.title.length)}\n`;
      content += `DESCRIPCIÓN\t\t\tEXISTE\tNO EXISTE\tNOTA\n`;
      content += `${'='.repeat(60)}\n`;
      
      const items = data[sec.key] || [];
      items.forEach(item => {
        const desc = (item.desc || '').substring(0, 30);
        const existe = item.existe ? '[X]' : '[ ]';
        const noExiste = item.noExiste ? '[X]' : '[ ]';
        const nota = (item.nota || '').substring(0, 20);
        content += `${desc}\t\t${existe}\t${noExiste}\t${nota}\n`;
      });
      content += '\n';
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Lista_Verificacion.pdf"');
    res.send(Buffer.from(content, 'utf-8'));
    
  } catch (error) {
    console.error('Error generando PDF checklist:', error);
    res.status(500).json({ success: false, error: 'Error generando PDF' });
  }
});

// ===== APIS DE HOJA DE RESPUESTAS UNIFICADA =====

// Recopilar respuestas de todas las evaluaciones
app.post('/api/collect-responses', (req, res) => {
  try {
    const { courseId } = req.body;
    
    // Simulación de datos - En producción consultarías la BD
    const header = {
      curso: 'Curso EC0301 Demo',
      instructor: 'Instructor Demo',
      lugar: 'Aula Virtual',
      fecha: new Date().toLocaleDateString('es-MX')
    };
    
    const diagnostica = [
      { num: 1, correcta: 'b', texto: 'Respuesta diagnóstica 1' },
      { num: 2, correcta: 'a', texto: 'Respuesta diagnóstica 2' }
    ];
    
    const sumativa = [
      { num: 1, correcta: 'b', texto: 'GAFI' },
      { num: 2, correcta: 'c', texto: 'UIF' },
      { num: 3, correcta: 'a', texto: 'Respuesta sumativa 3' }
    ];
    
    const formativaCotejo = [
      { num: 1, descripcion: 'El producto está redactado de forma clara' },
      { num: 2, descripcion: 'Cumple con los criterios establecidos' }
    ];
    
    const formativaGuia = [
      { num: 1, descripcion: 'Participa activamente en discusiones', maxPuntos: 2 },
      { num: 2, descripcion: 'Demuestra comprensión del tema', maxPuntos: 3 }
    ];
    
    res.json({ header, diagnostica, sumativa, formativaCotejo, formativaGuia });
    
  } catch (error) {
    console.error('Error recopilando respuestas:', error);
    res.status(500).json({ success: false, error: 'Error recopilando respuestas' });
  }
});

// Generar PDF unificado de respuestas
app.post('/api/generate-unified-sheet', (req, res) => {
  try {
    const { header, diagnostica, sumativa, formativaCotejo, formativaGuia } = req.body;
    
    let content = `HOJA DE RESPUESTAS UNIFICADA PARA EL INSTRUCTOR\n\n`;
    content += `Curso: ${header.curso || ''}\n`;
    content += `Instructor: ${header.instructor || ''}\n`;
    content += `Lugar: ${header.lugar || ''}\n`;
    content += `Fecha: ${header.fecha || ''}\n\n`;
    
    // Evaluación Sumativa
    content += `1. RESPUESTAS DEL CUESTIONARIO FINAL (EVALUACIÓN SUMATIVA)\n`;
    content += `${'='.repeat(60)}\n`;
    (sumativa || []).forEach(r => {
      content += `${r.num}. ${r.correcta}) ${r.texto}\n`;
    });
    content += '\n';
    
    // Lista de Cotejo
    content += `2. CRITERIOS DE LOGRO ESPERADOS (EVALUACIÓN FORMATIVA - LISTA DE COTEJO)\n`;
    content += `${'='.repeat(70)}\n`;
    (formativaCotejo || []).forEach(r => {
      content += `* ${r.descripcion} → Resultado Esperado: Sí\n`;
    });
    content += '\n';
    
    // Guía de Observación
    content += `3. CRITERIOS DE LOGRO ESPERADOS (EVALUACIÓN FORMATIVA - GUÍA DE OBSERVACIÓN)\n`;
    content += `${'='.repeat(75)}\n`;
    (formativaGuia || []).forEach(r => {
      content += `* ${r.descripcion} → Logro Máximo (${r.maxPuntos} pts)\n`;
    });
    content += '\n';
    
    // Evaluación Diagnóstica
    content += `4. RESPUESTAS DEL CUESTIONARIO INICIAL (EVALUACIÓN DIAGNÓSTICA)\n`;
    content += `${'='.repeat(65)}\n`;
    (diagnostica || []).forEach(r => {
      content += `${r.num}. ${r.correcta}) ${r.texto}\n`;
    });
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Hoja_Respuestas_Unificada.pdf"');
    res.send(Buffer.from(content, 'utf-8'));
    
  } catch (error) {
    console.error('Error generando PDF unificado:', error);
    res.status(500).json({ success: false, error: 'Error generando PDF' });
  }
});

// ===== API DE SALUD =====
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'EC0301 Generator Pro'
  });
});

// ===== FALLBACK SPA =====
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== INICIO DEL SERVIDOR =====
app.listen(PORT, () => {
  console.log(`🚀 EC0301 Generator Pro escuchando en puerto ${PORT}`);
  console.log(`📂 Sirviendo archivos desde: ${path.join(__dirname, 'public')}`);
  console.log(`🌐 Acceso local: http://localhost:${PORT}`);
});

module.exports = app;
