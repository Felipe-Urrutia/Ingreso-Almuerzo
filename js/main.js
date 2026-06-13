// ==========================================================================
// CENTRAL DE INTELIGENCIA: js/main.js (Cerebro de la PWA)
// Versión: Corporativa Modular - Optimizado para Flujo Extremo
// ==========================================================================

// --- 📦 1. ESTADO GLOBAL DE LA APLICACIÓN ---
let db = JSON.parse(localStorage.getItem('qrRegistros')) || [];
// Blindaje: Buscamos dbPersonal o planillaPersonal en el almacenamiento de la tablet
let dbPersonal = JSON.parse(localStorage.getItem('dbPersonal')) || JSON.parse(localStorage.getItem('planillaPersonal')) || [];

let isAdminActive = false;
let clickCount = 0;
let clickTimeout;

const PIN_CORRECTO = "3805"; // 🔒 Contraseña real de supervisor

// --- 🚀 2. INICIALIZADOR DE LA APP (DOM Ready) ---
document.addEventListener("DOMContentLoaded", function () {
    // 1. Dibujar las tarjetas inicialmente con los datos persistidos en LocalStorage
    if (typeof updateTable === 'function') {
        updateTable();
    }

    // 2. 🔄 DESBLOQUEO DE ORIENTACIÓN POR SOFTWARE
    if (screen.orientation && screen.orientation.unlock) {
        try {
            screen.orientation.unlock(); // Rompe cualquier bloqueo vertical previo del navegador en la Lenovo
            console.log("🔄 Orientación desbloqueada por software con éxito.");
        } catch (e) {
            console.warn("No se pudo desbloquear la orientación por software:", e);
        }
    }

    // 3. 📸 ARRANQUE ÚNICO BIEN VINCULADO
    // Delegamos el encendido completo al motor multi-cámara híbrido de scanner.js
    if (typeof inicializarEscaner === 'function') {
        inicializarEscaner();
        console.log("🚀 Motor multi-cámara inicializado desde scanner.js");
    } else {
        console.error("❌ Error crítico: inicializarEscaner no está disponible. Verifica el orden de los scripts.");
    }
});

// --- 👁️ 3. LÓGICA DEL LOGO SECRETO (Huevo de Pascua Aurora) ---
function clickSecretoAdmin() {
    if (isAdminActive) {
        cerrarModoAdmin();
        return;
    }

    clickCount++;

    clearTimeout(clickTimeout);
    clickTimeout = setTimeout(() => {
        clickCount = 0;
    }, 1500);

    if (clickCount === 5) {
        clickCount = 0;
        abrirModalSecreto();
    }
}

function abrirModalSecreto() {
    const modal = document.getElementById('custom-admin-modal');
    const pinInput = document.getElementById('modal-pin');
    if (!modal || !pinInput) return;

    pinInput.value = ""; // Limpia intentos anteriores
    modal.style.display = "flex"; // Lo muestra en pantalla con un flexbox centrado
    pinInput.focus(); // Enfoca automáticamente el input para escribir directo en móviles
}

function cerrarModalSecreto() {
    const modal = document.getElementById('custom-admin-modal');
    if (modal) modal.style.display = "none";
}

function verificarPinModal() {
    const pinInput = document.getElementById('modal-pin');
    if (!pinInput) return;

    if (pinInput.value === PIN_CORRECTO) {
        cerrarModalSecreto();
        activarModoAdmin();
    } else {
        playSound('error');
        showNotification('❌ PIN Incorrecto', 'error');
        pinInput.value = "";
        pinInput.focus();
    }
}

// Permitir presionar "Enter" en el teclado físico/virtual para ingresar rápido
document.getElementById('modal-pin')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        verificarPinModal();
    }
});

// --- ⚙️ 4. CONTROL DEL MODO ADMINISTRADOR ---
function activarModoAdmin() {
    isAdminActive = true;
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        // Corrección: Forzamos la visualización en cascada de celdas de tablas si corresponde
        if (el.tagName === 'TD' || el.tagName === 'TH') {
            el.style.setProperty('display', 'table-cell', 'important');
        } else {
            el.style.setProperty('display', 'block', 'important');
        }
    });
    showNotification('🔓 Acceso Autorizado', 'success');
    updateTable();
}

function cerrarModoAdmin() {
    isAdminActive = false;
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.style.setProperty('display', 'none', 'important');
    });
    showNotification('🔒 Acceso Cerrado', 'info');
    updateTable();
}

// --- 🎨 RENDERIZADO DINÁMICO: MODO TARJETAS (CARDS) RESPONSIVAS ---
function updateTable() {
    const contenedor = document.getElementById('scanned-list');
    if (!contenedor) return;
    contenedor.innerHTML = '';

    // Si la base de datos local está vacía, mostramos el mensaje de espera estilizado
    if (!db || db.length === 0) {
        contenedor.innerHTML = `
            <div class="tarjeta-vacia">
                📸 Esperando escaneo de códigos QR o códigos de barra...
            </div>
        `;
        return;
    }

    // Recorremos el arreglo al revés para que la última tarjeta aparezca primero arriba
    for (let i = db.length - 1; i >= 0; i--) {
        const entry = db[i];

        // 🛡️ BLINDAJE DE PROPIEDADES (Mapeo anti-fallos)
        const horaMarcaje = entry.hora || entry.HORA || '';
        const nombreTrabajador = entry.nombre || entry.NOMBRE || 'Desconocido';
        const rutTrabajador = entry.rut || entry.RUT || entry.id || entry.ID || '';
        const horarioTrabajador = entry.horario || entry.HORARIO || 'Sin Horario';
        const seccionTrabajador = entry.seccion || entry.SECCION || entry.sección || entry.SECCIÓN || 'General';

        // Creamos el elemento contenedor de la tarjeta
        const card = document.createElement('div');
        card.className = 'tarjeta-registro';

        // Inyectamos la estructura visual de la tarjeta
        card.innerHTML = `
            <div class="tarjeta-encabezado">
                <span class="tarjeta-hora">🕒 ${horaMarcaje}</span>
                <span class="tarjeta-badge">${seccionTrabajador}</span>
            </div>
            <div class="tarjeta-cuerpo">
                <h3 class="tarjeta-nombre">${nombreTrabajador}</h3>
                <div class="tarjeta-detalles">
                    <p><strong>RUT:</strong> ${rutTrabajador}</p>
                    <p><strong>Horario contratado:</strong> ${horarioTrabajador}</p>
                </div>
            </div>
            <div class="admin-only tarjeta-acciones" style="display: ${isAdminActive ? 'flex' : 'none'} !important;">
                <button onclick="deleteRecord(${i})" class="btn-eliminar-tarjeta">❌ Eliminar Marcaje</button>
            </div>
        `;

        contenedor.appendChild(card);
    }
}

// Acción administrativa: Borrar un marcaje específico de la tabla
function deleteRecord(index) {
    if (index > -1 && index < db.length) {
        const nombreEliminado = db[index].nombre;
        db.splice(index, 1); // Lo removemos del arreglo global
        localStorage.setItem('qrRegistros', JSON.stringify(db)); // Sincronizamos localmente
        updateTable(); // Refrescamos vista
        showNotification(`🗑️ Eliminado marcaje de: ${nombreEliminado}`, 'info');
    }
}

// ==========================================================================
// ACCIÓN ADMINISTRATIVA: VACIAR HISTORIAL (MODAL PRO)
// ==========================================================================
function clearAllRecords() {
    const confirmModal = document.getElementById('custom-confirm-modal');
    if (confirmModal) {
        confirmModal.style.display = "flex";
    }
}

function cerrarConfirmModal() {
    const confirmModal = document.getElementById('custom-confirm-modal');
    if (confirmModal) {
        confirmModal.style.display = "none";
    }
}

function ejecutarVaciadoReal() {
    db = [];
    localStorage.setItem('qrRegistros', JSON.stringify(db));
    cerrarConfirmModal();
    updateTable();
    showNotification('⚠️ Historial del día vaciado por completo', 'error');
    cerrarModoAdmin();
}

// --- 🔊 6. AUDIO INTEGRADO POR HARDWARE (Pitidos Nativos con Desbloqueo Táctil) ---
let audioCtx = null;

function asegurarAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// Escuchadores táctiles para desbloquear políticas de reproducción multimedia de navegadores
['click', 'touchstart', 'touchend'].forEach(evento => {
    document.addEventListener(evento, () => {
        asegurarAudioContext();
    }, { once: true });
});

function playSound(type) {
    try {
        const ctx = asegurarAudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (type === 'success') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime); // Tono agudo limpio
            gainNode.gain.setValueAtTime(0.12, ctx.currentTime);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.12);
        } else if (type === 'error') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(180, ctx.currentTime); // Zumbido grave de alerta
            gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.3);
        }
    } catch (e) {
        console.warn("El sistema de audio nativo no pudo reproducir el tono:", e);
    }
}

// --- 💬 7. TOAST CUSTOM: NOTIFICACIONES FLOTANTES ---
function showNotification(message, type = 'success') {
    const notif = document.getElementById('notification');
    if (!notif) return;

    notif.textContent = message;
    notif.style.display = 'block';

    // Inyección de colores de estado dinámicos adaptados al diseño corporativo
    if (type === 'success') {
        notif.style.backgroundColor = '#2ecc71'; // Verde Éxito
    } else if (type === 'error') {
        notif.style.backgroundColor = '#e74c3c'; // Rojo Alerta
    } else if (type === 'info') {
        notif.style.backgroundColor = '#34495e'; // Gris Informativo
    } else {
        notif.style.backgroundColor = '#2980b9'; // Azul
    }

    setTimeout(() => {
        notif.style.display = 'none';
    }, 3000);
}

// ==========================================================================
// 📂 CARGADOR MAESTRO DE PERSONAL: Sincronización Absoluta de Planilla
// ==========================================================================
function cargarBasePersonal(event) {
    const file = event.target.files[0];
    if (!file) return;

    showNotification('⏳ Procesando nómina de personal...', 'info');

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });

            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const jsonCrudo = XLSX.utils.sheet_to_json(worksheet);

            if (!jsonCrudo || jsonCrudo.length === 0) {
                throw new Error("El archivo Excel está vacío.");
            }

            // Normalización cruzada inmediata al mapear
            dbPersonal = jsonCrudo.map(empleado => {
                const idOriginal = empleado.ID || empleado.id || empleado.Id || empleado.Rut || empleado.RUT || empleado.rut || "";

                return {
                    id: String(idOriginal).trim(),
                    rut: String(idOriginal).trim(),
                    ID: String(idOriginal).trim(),
                    RUT: String(idOriginal).trim(),
                    nombre: empleado.NOMBRE || empleado.Nombre || empleado.nombre || "Desconocido",
                    seccion: empleado.SECCION || empleado.Seccion || empleado.sección || empleado.SECCIÓN || empleado.Area || empleado.ÁREA || empleado.area || "Sin Sección",
                    horario: empleado.HORARIO || empleado.Horario || empleado.horario || "Sin Horario"
                };
            });

            // 💾 PERSISTENCIA EN MEMORIA GEMELA (Guardamos bajo ambos nombres por compatibilidad)
            localStorage.setItem('dbPersonal', JSON.stringify(dbPersonal));
            localStorage.setItem('planillaPersonal', JSON.stringify(dbPersonal));

            playSound('success');
            showNotification(`✅ Base cargada: ${dbPersonal.length} trabajadores listos`, 'success');
            event.target.value = '';

        } catch (error) {
            console.error("Error crítico al procesar el Excel de personal:", error);
            playSound('error');
            showNotification('❌ Error: Formato de Excel inválido', 'error');
        }
    };

    reader.readAsArrayBuffer(file);
}

// 📡 ESCUCHADOR GLOBAL PARA PISTOLAS DE CÓDIGO DE BARRA EXTERNAS
let bufferTecladoPistola = "";
let tiempoUltimaTecla = Date.now();

window.addEventListener('keydown', function (e) {
    const ahora = Date.now();

    // Si el usuario está escribiendo en el modal del PIN, no interferimos
    if (document.activeElement.id === 'modal-pin') return;

    // Las pistolas escriben con una velocidad sobrehumana (menos de 30ms entre caracteres)
    if (ahora - tiempoUltimaTecla > 50) {
        bufferTecladoPistola = ""; // Si tardó mucho, es un humano escribiendo despacio, limpiamos
    }
    tiempoUltimaTecla = ahora;

    // Si presiona Enter, la pistola terminó de leer
    if (e.key === 'Enter') {
        if (bufferTecladoPistola.length >= 7) { // Un RUT chileno válido tiene al menos 7-8 caracteres
            console.log("🎯 Código detectado por pistola externa:", bufferTecladoPistola);
            if (typeof onScanSuccess === 'function') {
                onScanSuccess(bufferTecladoPistola); // Le enviamos el RUT directo al motor de scanner.js
            }
        }
        bufferTecladoPistola = ""; // Limpiamos el contenedor
        return;
    }

    // Almacenamos el carácter si es un número o la letra K
    if (e.key.match(/^[0-9kK\.\-]+$/)) {
        bufferTecladoPistola += e.key;
    }
});

// --- 🔀 8. PUENTES DE ENLACE GLOBAL PARA EVENTOS HTML ---
window.cargarBasePersonal = cargarBasePersonal;
window.handleFileUpload = cargarBasePersonal;
window.handleExcelUpload = cargarBasePersonal;