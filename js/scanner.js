// ==========================================================================
// MÓDULO DE ESCÁNER: MODO RÁFAGA DE ALTA VELOCIDAD INDUSTRIAL
// Optimizado para flujos masivos en Casinos Jumbo
// Versión: Blindada Anti-Errores y Alta Densidad
// ==========================================================================

// Variables de control de ráfaga inteligente (Cooldown individual por RUT)
let ultimoRutEscaneado = "";
let tiempoUltimoEscaneo = 0;
const COOLDOWN_MISMO_USUARIO = 3000; // 3 segundos de bloqueo SOLO si es el mismo RUT continuo

// Configuración de alto rendimiento para el motor de la cámara (html5-qrcode)
const configEscanerRapido = {
    fps: 25, // 🚀 Muestreo al doble de velocidad para lecturas al vuelo instantáneas
    qrbox: function (viewfinderWidth, viewfinderHeight) {
        // Reducimos la zona analizada al 70% central para acelerar el procesador de la tablet
        const minDimension = Math.min(viewfinderWidth, viewfinderHeight);
        return {
            width: Math.floor(minDimension * 0.7),
            height: Math.floor(minDimension * 0.7)
        };
    },
    experimentalFeatures: {
        useBarCodeDetectorIfSupported: true // Aceleración por hardware nativa en Android/iOS
    },
    videoConstraints: {
        facingMode: "environment",
        aspectRatio: { ideal: 1.0 } // Formato cuadrado simétrico para decodificación veloz
    }
};

/**
 * 🧹 Utilidad estricta de normalización para evitar fallos de lectura en Chile
 * Remueve puntos, guiones y espacios en blanco de cédulas o códigos de barra
 */
function normalizarID(id) {
    if (id === null || id === undefined) return "";
    return String(id).trim().replace(/[\.\-]/g, '').toUpperCase();
}

/**
 * 👁️ CALLBACK DE ÉXITO DEL ESCÁNER (Se ejecuta al detectar un QR/Barra)
 */
function onScanSuccess(decodedText) {
    const ahora = Date.now();
    const rutNormalizadoScan = normalizarID(decodedText);

    if (!rutNormalizadoScan) return;

    // 🛡️ FILTRO ANTI-DUPLICADO INSTANTÁNEO (Mismo usuario en ráfaga continua)
    // Si la cámara sigue apuntando al carnet del mismo operario, se ignora silenciosamente
    if (rutNormalizadoScan === ultimoRutEscaneado && (ahora - tiempoUltimoEscaneo) < COOLDOWN_MISMO_USUARIO) {
        return;
    }

    // 🕒 Formateadores de fecha y hora bajo el estándar estricto de Chile
    const now = new Date();
    const fechaActual = now.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaActual = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    // 🛡️ VALIDACIÓN EN BASE DE DATOS LOCAL: ¿Ya almorzó o registró hoy este RUT?
    const yaRegistradoHoy = db.find(reg => normalizarID(reg.rut) === rutNormalizadoScan && reg.fecha === fechaActual);

    if (yaRegistradoHoy) {
        if (typeof playSound === 'function') playSound('error');
        if (typeof showNotification === 'function') {
            showNotification(`⚠️ Ya registrado hoy: ${yaRegistradoHoy.nombre || 'Colaborador'}`, 'error');
        }

        // Seteamos controles de cooldown para evitar spam de alertas en pantalla
        ultimoRutEscaneado = rutNormalizadoScan;
        tiempoUltimoEscaneo = ahora;
        return;
    }

    // ⚡ CONTROL LIBERADO: Registramos la marca del tiempo para ESTE rut, pero
    // dejamos la cámara lista para el siguiente operario en los próximos 0 milisegundos.
    ultimoRutEscaneado = rutNormalizadoScan;
    tiempoUltimoEscaneo = ahora;

    // 📂 BUSCAR EN LA PLANILLA DE PERSONAL CARGADA (Mapeo Cruzado Blindado)
    const empleado = dbPersonal.find(p => {
        if (!p) return false;
        // Buscamos dinámicamente cualquier variante de llave que contenga la ID
        const idPlanilla = p.id || p.ID || p.rut || p.RUT || p.Id || p.Rut || "";
        return normalizarID(idPlanilla) === rutNormalizadoScan;
    });

    // 🔄 Sincronización Estricta de Propiedades con excel.js y main.js
    const nuevoRegistro = {
        rut: rutNormalizadoScan, // Enlazado con registro.rut
        nombre: empleado ? (empleado.nombre || empleado.NOMBRE || empleado.Nombre || "Desconocido") : "Desconocido",
        seccion: empleado ? (empleado.seccion || empleado.SECCION || empleado.Seccion || empleado.SECCIÓN || empleado.area || empleado.Area || "Sin Sección") : "Sin Sección",
        horario: empleado ? (empleado.horario || empleado.HORARIO || empleado.Horario || "Sin Horario") : "Sin Horario",
        fecha: fechaActual, // Enlazado con registro.fecha
        hora: horaActual    // Enlazado con registro.hora
    };

    // 💾 Guardar inmediatamente en memoria RAM y persistir en el LocalStorage de la tablet
    db.push(nuevoRegistro);
    localStorage.setItem('qrRegistros', JSON.stringify(db));

    // 🎨 Actualizar Interfaz Gráfica de forma asíncrona inmediata a través de main.js
    if (typeof updateTable === 'function') {
        updateTable();
    }

    // Reproducir pitido de éxito nativo
    if (typeof playSound === 'function') {
        playSound('success');
    }

    // Desplegar notificación flotante limpia (PWA Custom Toast)
    if (typeof showNotification === 'function') {
        if (empleado) {
            showNotification(`✅ Ingreso: ${nuevoRegistro.nombre}`, 'success');
        } else {
            showNotification(`✅ RUT Registrado: ${rutNormalizadoScan}`, 'info');
        }
    }
}