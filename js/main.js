// ==========================================
// ESTADO GLOBAL DE LA APLICACIÓN (SSOT)
// ==========================================
let db = JSON.parse(localStorage.getItem('qrRegistros')) || [];
let dbPersonal = JSON.parse(localStorage.getItem('dbPersonal')) || [];
let isProcessing = false;
let isAdminActive = false; // Controlado por tu lógica de PIN
let confirmActionType = null;
let targetDeleteIndex = null;

// Audio Context Seguro (Lazy Loading para móviles)
let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(type) {
    initAudio();
    if (audioCtx.state === 'suspended') { audioCtx.resume(); }
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    if (type === 'success') {
        oscillator.type = 'square';
        oscillator.frequency.value = 900;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 150);
    } else if (type === 'error') {
        oscillator.type = 'sawtooth';
        oscillator.frequency.value = 250;
        oscillator.start();
        setTimeout(() => oscillator.stop(), 400);
    }
}

// ==========================================
// CAPA INTERFAZ DE USUARIO (UI)
// ==========================================
function showNotification(message, type) {
    const notif = document.getElementById('notification');
    const visualWrapper = document.getElementById('scanner-visuals');
    if (!notif) return;

    notif.textContent = message;
    notif.className = `toast ${type}`;
    notif.style.display = 'block';

    if (visualWrapper) visualWrapper.classList.add(type);

    setTimeout(() => {
        notif.style.display = 'none';
        if (visualWrapper) visualWrapper.classList.remove(type);
    }, 3000);
}

function updateTable() {
    const tbody = document.getElementById('scanned-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Renderizado inverso (Últimos marcajes arriba)
    for (let i = db.length - 1; i >= 0; i--) {
        const entry = db[i];
        const tr = document.createElement('tr');
        const seccionMostrar = entry.seccion ? `<span class="tag-seccion">${entry.seccion}</span>` : "-";
        const displayDeleteCell = isAdminActive ? 'style="display: table-cell !important;"' : '';

        tr.innerHTML = `
            <td>${entry.hora}</td>
            <td><strong>${entry.nombre || "-"}</strong></td>
            <td>${seccionMostrar}</td>
            <td>${entry.horario || "-"}</td>
            <td style="color:#666;">${entry.id}</td>
            <td class="admin-only" ${displayDeleteCell}>
                <button class="btn-delete-row" onclick="deleteRecord(${i})" title="Eliminar Registro">❌</button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

// Acciones Administrativas
function deleteRecord(index) {
    if (!isAdminActive) return;
    // Llama a tu modal de confirmación si existe, o usa un confirm nativo local:
    if (confirm("¿Deseas eliminar este registro?")) {
        db.splice(index, 1);
        localStorage.setItem('qrRegistros', JSON.stringify(db));
        updateTable();
        showNotification('Registro eliminado', 'info');
    }
}

function clearAllRecords() {
    if (!isAdminActive) return;
    if (confirm("⚠️ ¿Vaciar todo el historial del día?")) {
        db = [];
        localStorage.setItem('qrRegistros', JSON.stringify(db));
        updateTable();
        showNotification('Historial vaciado', 'error');
    }
}

// ==========================================
// INICIALIZACIÓN Y EVENTOS
// ==========================================
document.addEventListener("DOMContentLoaded", function () {
    updateTable();

    // Inicializa el Escáner QR local (html5QrcodeScanner)
    if (document.getElementById("reader")) {
        let html5QrcodeScanner = new Html5QrcodeScanner(
            "reader",
            { fps: 15, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
            false
        );
        // onScanSuccess vive en js/scanner.js
        html5QrcodeScanner.render(onScanSuccess, () => { });
    }
});

// REGISTRO DEL SERVICE WORKER (Manteniendo la ruta raíz para sw.js)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('✅ PWA: Service Worker activo en:', reg.scope))
            .catch(err => console.error('❌ PWA: Falló el Service Worker:', err));
    });
}