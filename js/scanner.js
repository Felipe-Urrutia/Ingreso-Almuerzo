// ==========================================================================
// MÓDULO DE ESCÁNER: MODO RÁFAGA DE ALTA VELOCIDAD INDUSTRIAL
// Optimizado para flujos masivos en Casinos Jumbo
// Versión: Multi-Cámara Híbrida (Tótem Frontal / Trasera)
// ==========================================================================

// Variables de control de ráfaga inteligente (Cooldown individual por RUT)
let ultimoRutEscaneado = "";
let tiempoUltimoEscaneo = 0;
const COOLDOWN_MISMO_USUARIO = 3000; // 3 segundos de bloqueo SOLO si es el mismo RUT continuo

// Instancia global del escáner y control de hardware
let html5QrCode = null;
let camaraActualId = null;

/**
 * 📸 DETECTOR DINÁMICO DE HARDWARE:
 * Lista todas las cámaras de la tablet Lenovo y prioriza la frontal (Face Cam) para el modo Tótem.
 */
function inicializarEscaner() {
    if (typeof Html5Qrcode === 'undefined') {
        console.error("La librería Html5Qrcode no está cargada en el index.html");
        return;
    }

    // Solicitamos al sistema operativo de la tablet la lista de lentes reales de video
    Html5Qrcode.getCameras().then(devices => {
        if (devices && devices.length > 0) {

            // 1. Poblamos el selector (<select>) en el HTML si existe para control del supervisor
            const selectorCamaras = document.getElementById('selector-camaras');
            if (selectorCamaras) {
                selectorCamaras.innerHTML = ''; // Limpiamos opciones residuales
                devices.forEach((device, index) => {
                    const option = document.createElement('option');
                    option.value = device.id;
                    option.text = device.label || `Cámara ${index + 1}`;
                    selectorCamaras.appendChild(option);
                });

                // Vinculamos el evento de cambio manual "en caliente"
                selectorCamaras.addEventListener('change', (e) => {
                    cambiarDeCamara(e.target.value);
                });
            }

            // 2. CRITERIO DE SELECCIÓN INTELIGENTE JUMBO (Modo Tótem Autoservicio):
            // Buscamos si algún lente se identifica por texto como cámara frontal
            const camaraFrontal = devices.find(device =>
                device.label.toLowerCase().includes('front') ||
                device.label.toLowerCase().includes('face') ||
                device.label.toLowerCase().includes('frontal')
            );

            // Si hay cámara frontal se selecciona por defecto; de lo contrario se usa la primera de la lista
            camaraActualId = camaraFrontal ? camaraFrontal.id : devices[0].id;

            // Sincronizamos el componente visual dropdown
            if (selectorCamaras) selectorCamaras.value = camaraActualId;

            // 3. Montamos el motor gráfico sobre el div contenedor
            html5QrCode = new Html5Qrcode("reader");
            encenderCamara(camaraActualId);

        } else {
            console.error("No se detectaron cámaras en esta tablet Lenovo.");
            if (typeof showNotification === 'function') {
                showNotification("No se detectaron cámaras de video", "error");
            }
        }
    }).catch(err => {
        console.error("Error crítico de permisos o hardware al listar cámaras:", err);
        if (typeof showNotification === 'function') {
            showNotification("Error de acceso a periféricos de video", "error");
        }
    });
}

/**
 * 🚀 ARRANQUE MATRICIAL: Enciende la cámara seleccionada con rendimiento industrial
 */
function encenderCamara(cameraId) {
    if (!html5QrCode) return;

    // Configuración optimizada de renderizado para acelerar el procesador de la tablet
    const configEscanerRapido = {
        fps: 25, // Muestreo acelerado para lecturas instantáneas al vuelo
        qrbox: function (viewfinderWidth, viewfinderHeight) {
            // Reducimos el área analizada al 70% central para mitigar el estrés de la GPU
            const minDimension = Math.min(viewfinderWidth, viewfinderHeight);
            return {
                width: Math.floor(minDimension * 0.7),
                height: Math.floor(minDimension * 0.7)
            };
        },
        experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Aceleración por hardware nativa en chips compatibles
        },
        // Reemplazamos la restricción rígida por un mapeo elástico adaptativo
        aspectRatio: 1.0
    };

    html5QrCode.start(
        cameraId,
        configEscanerRapido,
        (decodedText) => {
            // Invoca al callback de éxito nativo al capturar un QR o Barra
            onScanSuccess(decodedText);
        },
        (errorMessage) => {
            // Captura analítica silenciosa cuadro a cuadro cuando no hay códigos presentes
        }
    ).catch(err => {
        console.error("Fallo al inicializar el flujo de transmisión de video:", err);
    });
}

/**
 * 🔄 CONMUTADOR CALIENTE: Detiene de forma segura el lente activo e inicia el nuevo
 */
function cambiarDeCamara(nuevaCameraId) {
    if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
            encenderCamara(nuevaCameraId);
        }).catch(err => console.error("Error al pausar el flujo de video anterior:", err));
    } else {
        encenderCamara(nuevaCameraId);
    }
}

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
    if (rutNormalizadoScan === ultimoRutEscaneado && (ahora - tiempoUltimoEscaneo) < COOLDOWN_MISMO_USUARIO) {
        return;
    }

    // 🕒 Formateadores de fecha y hora bajo el estándar estricto de Chile (24 Horas fijas)
    const now = new Date();
    const fechaActual = now.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const horaActual = now.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

    // 🛡️ VALIDACIÓN EN BASE DE DATOS LOCAL: ¿Ya almorzó o registró hoy este RUT?
    const yaRegistradoHoy = db.find(reg => normalizarID(reg.rut) === rutNormalizadoScan && reg.fecha === fechaActual);

    if (yaRegistradoHoy) {
        if (typeof playSound === 'function') playSound('error');
        if (typeof showNotification === 'function') {
            showNotification(`⚠️ Ya registrado hoy: ${yaRegistradoHoy.nombre || 'Colaborador'}`, 'error');
        }

        ultimoRutEscaneado = rutNormalizadoScan;
        tiempoUltimoEscaneo = ahora;
        return;
    }

    // ⚡ CONTROL LIBERADO: Marcamos tiempos pero dejamos vía libre para el siguiente operario
    ultimoRutEscaneado = rutNormalizadoScan;
    tiempoUltimoEscaneo = ahora;

    // 📂 BUSCAR EN LA PLANILLA DE PERSONAL CARGADA (Mapeo Cruzado Blindado)
    const empleado = dbPersonal.find(p => {
        if (!p) return false;
        const idPlanilla = p.id || p.ID || p.rut || p.RUT || p.Id || p.Rut || "";
        return normalizarID(idPlanilla) === rutNormalizadoScan;
    });

    // 🔄 Sincronización Estricta de Propiedades con excel.js y main.js
    const nuevoRegistro = {
        rut: rutNormalizadoScan,
        nombre: empleado ? (empleado.nombre || empleado.NOMBRE || empleado.Nombre || "Desconocido") : "Desconocido",
        seccion: empleado ? (empleado.seccion || empleado.SECCION || empleado.Seccion || empleado.SECCIÓN || empleado.area || empleado.Area || "Sin Sección") : "Sin Sección",
        horario: empleado ? (empleado.horario || empleado.HORARIO || empleado.Horario || "Sin Horario") : "Sin Horario",
        fecha: fechaActual,
        hora: horaActual
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

// Vinculamos el arranque seguro al ciclo de vida global del archivo principal al inicializar la app
window.inicializarEscaner = inicializarEscaner;