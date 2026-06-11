// ==========================================================================
// MÓDULO DE ESCÁNER: MODO RÁFAGA DE ALTA VELOCIDAD INDUSTRIAL
// Optimizado para flujos masivos en Casinos Jumbo
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
    if (!id) return "";
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
    // Si la cámara sigue apuntando al carnet de Juan, se ignora silenciosamente
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
        playSound('error');
        showNotification(`⚠️ Ya registrado hoy: ${yaRegistradoHoy.nombre}`, 'error');

        // Seteamos controles de cooldown para evitar spam de alertas en pantalla
        ultimoRutEscaneado = rutNormalizadoScan;
        tiempoUltimoEscaneo = ahora;
        return;
    }

    // ⚡ CONTROL LIBERADO: Registramos la marca del tiempo para ESTE rut, pero
    // dejamos la cámara abierta para el siguiente operario en los próximos 0 milisegundos.
    ultimoRutEscaneado = rutNormalizadoScan;
    tiempoUltimoEscaneo = ahora;

    // 📂 BUSCAR EN LA PLANILLA DE PERSONAL CARGADA (Normalización Cruzada)
    const empleado = dbPersonal.find(p => {
        const idPlanilla = p.ID || p.id || p.Id || p.Rut || p.RUT || p.rut;
        return normalizarID(idPlanilla) === rutNormalizadoScan;
    });

    // 🔄 Sincronización Estricta de Propiedades con excel.js y main.js
    const nuevoRegistro = {
        rut: rutNormalizadoScan, // Enlazado con registro.rut
        nombre: empleado ? (empleado.NOMBRE || empleado.Nombre || empleado.nombre) : "Desconocido",
        seccion: empleado ? (empleado.SECCION || empleado.Seccion || empleado.SECCIÓN || empleado.Sección || empleado.Area || empleado.ÁREA || empleado.area) : "Sin Sección",
        horario: empleado ? (empleado.HORARIO || empleado.Horario || empleado.horario) : "Sin Horario",
        fecha: fechaActual, // Enlazado con registro.fecha
        hora: horaActual    // Enlazado con registro.hora
    };

    // 💾 Guardar inmediatamente en memoria RAM y persistir en el LocalStorage de la tablet
    db.push(nuevoRegistro);
    localStorage.setItem('qrRegistros', JSON.stringify(db));

    // 🎨 Actualizar Interfaz Gráfica de forma asíncrona inmediata
    updateTable();
    playSound('success');

    // Desplegar notificación flotante limpia (PWA Custom Toast)
    if (empleado) {
        showNotification(`✅ Ingreso: ${nuevoRegistro.nombre}`, 'success');
    } else {
        showNotification(`✅ RUT Registrado: ${rutNormalizadoScan}`, 'info');
    }
}

/**
 * 🛠️ INICIALIZADOR DE RENDIMIENTO NATIVO (Ejecutar al montar la cámara)
 * Asegúrate de pasar 'configEscanerRapido' cuando instancies la librería en tu main.js
 * Ejemplo: const html5QrcodeScanner = new Html5QrcodeScanner("reader", configEscanerRapido, false);
 */