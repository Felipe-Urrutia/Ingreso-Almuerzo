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

const PIN_CORRECTO = "3805"; // 🔒 Tu contraseña real se mantiene intacta

// --- 🚀 2. INICIALIZADOR DE LA APP (DOM Ready) ---
document.addEventListener("DOMContentLoaded", function () {
    // Dibujar la tabla inicialmente con los datos persistidos
    updateTable();

    // Encender la cámara conectándola a la configuración rápida de scanner.js
    if (document.getElementById("reader")) {
        try {
            // Si por alguna razón configEscanerRapido no cargó, usamos un fallback optimizado
            const opcionesCamara = typeof configEscanerRapido !== 'undefined' ? configEscanerRapido : { fps: 25, qrbox: 250, aspectRatio: 1.0 };

            let html5QrcodeScanner = new Html5QrcodeScanner(
                "reader", opcionesCamara, false
            );
            html5QrcodeScanner.render(onScanSuccess, () => { });
        } catch (error) {
            console.error("Error al iniciar el motor de la cámara:", error);
        }
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
    modal.style.display = "flex"; // Lo muestra en pantalla con desenfoque
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

// --- 🎨 5. RENDERIZADO DINÁMICO DE LA INTERFAZ (Tabla de Marcajes) ---
function updateTable() {
    const tbody = document.getElementById('scanned-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Si la base de datos local está vacía, mostramos el mensaje de espera limpio
    if (!db || db.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="${isAdminActive ? 6 : 5}" style="text-align: center; color: #94a3b8; padding: 30px; font-size: 0.95rem;">
                    📸 Esperando escaneo de códigos QR...
                </td>
            </tr>
        `;
        return;
    }

    // Recorremos el arreglo al revés para que el último en marcar aparezca arriba
    for (let i = db.length - 1; i >= 0; i--) {
        const entry = db[i];
        const tr = document.createElement('tr');

        // 🛡️ BLINDAJE ABSOLUTO DE PROPIEDADES (Mapeo cruzado anti-fallos)
        const horaMarcaje = entry.hora || entry.HORA || '';
        const nombreTrabajador = entry.nombre || entry.NOMBRE || 'Desconocido';
        const rutTrabajador = entry.rut || entry.RUT || entry.id || entry.ID || '';
        const horarioTrabajador = entry.horario || entry.HORARIO || 'Sin Horario';

        // Validamos todas las variaciones posibles de la palabra "Sección"
        const seccionTrabajador = entry.seccion || entry.SECCION || entry.sección || entry.SECCIÓN || entry.area || entry.Area || 'General';

        // Inyectamos la fila limpia en la tabla de la tablet
        tr.innerHTML = `
            <td style="font-family: monospace; font-size: 0.95rem; color: #475569;">${horaMarcaje}</td>
            <td><strong style="color: #1e293b;">${nombreTrabajador}</strong></td>
            <td><span class="tag-seccion" style="background-color: #f1f5f9; color: #475569; padding: 4px 8px; border-radius: 6px; font-size: 0.85rem; font-weight: 600;">${seccionTrabajador}</span></td>
            <td style="color: #64748b;">${horarioTrabajador}</td>
            <td style="font-weight: 600; color: #0f172a;">${rutTrabajador}</td>
            <td class="admin-only" style="display: ${isAdminActive ? 'table-cell' : 'none'} !important; text-align: center;">
                <button onclick="deleteRecord(${i})" style="background: none; border: none; cursor: pointer; font-size: 1.1rem; padding: 4px;">❌</button>
            </td>
        `;
        tbody.appendChild(tr);
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

// ==========================================
// ACCIÓN ADMINISTRATIVA: VACIAR HISTORIAL (MODAL PRO)
// ==========================================
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

// Esta función inicializa y activa el motor de audio de forma segura
function asegurarAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    // Si el motor está dormido por restricciones del navegador, lo despertamos de golpe
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    return audioCtx;
}

// 📱 ESCUCHADORES TÁCTILES: Apenas el usuario toque CUALQUIER parte de la pantalla,
// el navegador autorizará los sonidos y el escáner podrá pitar libremente en ráfaga.
['click', 'touchstart', 'touchend'].forEach(evento => {
    document.addEventListener(evento, () => {
        asegurarAudioContext();
    }, { once: true }); // 'once: true' hace que se ejecute solo la primera vez y no gaste recursos
});

function playSound(type) {
    try {
        // Activamos/Verificamos el estado del motor antes de reproducir
        const ctx = asegurarAudioContext();

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        if (type === 'success') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(880, ctx.currentTime); // Pitido agudo limpio
            gainNode.gain.setValueAtTime(0.12, ctx.currentTime);       // Subimos un pelo el volumen
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.12);                  // 120 milisegundos de duración
        } else if (type === 'error') {
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(180, ctx.currentTime); // Zumbido grave raspado de alerta
            gainNode.gain.setValueAtTime(0.18, ctx.currentTime);       // Volumen más fuerte para errores
            oscillator.start();
            oscillator.stop(ctx.currentTime + 0.3);                   // 300 milisegundos de duración
        }
    } catch (e) {
        console.warn("El sistema de audio nativo no pudo reproducir el tono en este fotograma:", e);
    }
}