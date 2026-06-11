// Utilidad estricta de normalización para evitar fallos de lectura en Chile
function normalizarID(id) {
    if (!id) return "";
    return String(id).trim().replace(/[\.\-]/g, '').toUpperCase();
}

// Callback del escáner exitoso
function onScanSuccess(decodedText) {
    if (isProcessing) return; // Evita lecturas fantasma duplicadas por milisegundos
    isProcessing = true;

    const idNormalizadoScan = normalizarID(decodedText);
    const now = new Date();
    const fechaActual = now.toLocaleDateString('es-CL');
    const horaActual = now.toLocaleTimeString('es-CL');

    // Validación de duplicados en el mismo día
    const yaRegistrado = db.find(reg => normalizarID(reg.id) === idNormalizadoScan && reg.fecha === fechaActual);

    if (yaRegistrado) {
        playSound('error');
        showNotification(`⚠️ Ya registrado hoy: ${yaRegistrado.nombre}`, 'error');
        setTimeout(() => isProcessing = false, 800); // Cooldown rápido en error
        return;
    }

    // Cooldown normal para pases exitosos (1.5 segundos)
    setTimeout(() => isProcessing = false, 1500);

    // Buscar en la planilla de personal usando normalización cruzada
    const empleado = dbPersonal.find(p => {
        const idPlanilla = p.ID || p.id || p.Id || p.Rut || p.RUT;
        return normalizarID(idPlanilla) === idNormalizadoScan;
    });

    const nuevoRegistro = {
        id: decodedText,
        nombre: empleado ? (empleado.NOMBRE || empleado.Nombre || empleado.nombre) : "Desconocido",
        seccion: empleado ? (empleado.SECCION || empleado.Seccion || empleado.SECCIÓN || empleado.Sección || empleado.Area || empleado.ÁREA) : "Sin Sección",
        horario: empleado ? (empleado.HORARIO || empleado.Horario) : "Sin Horario",
        fecha: fechaActual,
        hora: horaActual
    };

    // Guardar en el estado y almacenamiento
    db.push(nuevoRegistro);
    localStorage.setItem('qrRegistros', JSON.stringify(db));
    
    // Actualizar UI (Funciones globales de main.js)
    updateTable();
    playSound('success');

    if (empleado) {
        showNotification(`✅ Ingreso: ${nuevoRegistro.nombre}`, 'success');
    } else {
        showNotification(`✅ ID Registrado: ${decodedText}`, 'info');
    }
}