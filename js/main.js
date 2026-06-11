// Estado de la App compartido entre archivos
let db = JSON.parse(localStorage.getItem('qrRegistros')) || [];
let dbPersonal = JSON.parse(localStorage.getItem('dbPersonal')) || [];
let isProcessing = false;
let isAdminActive = false;

const PIN_CORRECTO = "3805"; // 🔒 Tu contraseña

let clickCount = 0;
let clickTimeout;


let audioCtx = null;
function playSound(type) {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    // ... (Tu lógica de generación de osciladores para success/error)
}

function showNotification(message, type) {
    const notif = document.getElementById('notification');
    if (!notif) return;
    notif.textContent = message;
    notif.className = `toast ${type}`;
    notif.style.display = 'block';
    setTimeout(() => { notif.style.display = 'none'; }, 3000);
}

function updateTable() {
    const tbody = document.getElementById('scanned-list');
    if (!tbody) return;
    tbody.innerHTML = '';

    for (let i = db.length - 1; i >= 0; i--) {
        const entry = db[i];
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${entry.hora}</td>
            <td><strong>${entry.nombre}</strong></td>
            <td>${entry.seccion}</td>
            <td>${entry.horario}</td>
            <td>${entry.id}</td>
            <td class="admin-only"><button onclick="deleteRecord(${i})">❌</button></td>
        `;
        tbody.appendChild(tr);
    }
}

// Inicializar la app al cargar la página
document.addEventListener("DOMContentLoaded", function () {
    updateTable();

    if (document.getElementById("reader")) {
        let html5QrcodeScanner = new Html5QrcodeScanner(
            "reader", { fps: 15, qrbox: 250, aspectRatio: 1.0 }, false
        );
        html5QrcodeScanner.render(onScanSuccess, () => { });
    }
});

// ==========================================
// MECANISMO OCULTO (MODAL PROGRAMADO)
// ==========================================
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
    modal.style.display = "flex"; // Lo muestra en pantalla
    pinInput.focus(); // Enfoca automáticamente el input para escribir directo
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

// Permitir presionar "Enter" en el teclado físico/virtual para ingresar
document.getElementById('modal-pin')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        verificarPinModal();
    }
});

function activarModoAdmin() {
    isAdminActive = true;
    const adminElements = document.querySelectorAll('.admin-only');
    adminElements.forEach(el => {
        el.style.setProperty('display', 'block', 'important');
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