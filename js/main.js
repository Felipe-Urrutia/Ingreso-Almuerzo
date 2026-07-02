// Variable global para rastrear el estado del Administrador
let isAdminModeActive = false;

// 1. CONTROLADOR DE CAMBIO DE PESTAÑAS (TABS)
function switchTab(tabId) {
    // Alternar clases activas en los botones de pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (tabId === 'vista-kiosco') document.getElementById('btn-tab-kiosco').classList.add('active');
    if (tabId === 'vista-dashboard') document.getElementById('btn-tab-dashboard').classList.add('active');

    // Alternar visibilidad de las pantallas
    document.getElementById('vista-kiosco').style.display = tabId === 'vista-kiosco' ? 'block' : 'none';
    document.getElementById('vista-dashboard').style.display = tabId === 'vista-dashboard' ? 'block' : 'none';

    // Acciones al activar pestañas específicas
    if (tabId === 'vista-dashboard') {
        renderizarDashboardTable();
    } else {
        fuerzaEnfoqueLectorExterno();
    }
}

// 2. CONMUTADOR DE MODOS (Kiosco Seguro / Supervisor Administrador)
function setModoVisualAdmin(activado) {
    isAdminModeActive = activado;
    const elementosAdmin = document.querySelectorAll('.admin-only');
    const contenedorCamara = document.getElementById('contenedor-camara-local');
    const tabsNav = document.getElementById('admin-tabs-nav');

    elementosAdmin.forEach(el => {
        el.style.display = activado ? 'block' : 'none';
    });

    if (activado) {
        tabsNav.style.display = 'flex';
        if (contenedorCamara) contenedorCamara.style.display = 'block';
    } else {
        tabsNav.style.display = 'none';
        if (contenedorCamara) contenedorCamara.style.display = 'none';
        switchTab('vista-kiosco'); // Regresa forzosamente a modo seguro
    }
}

// 3. MOTOR COMPILADOR DEL DASHBOARD ANALÍTICO
function renderizarDashboardTable() {
    // 💡 IMPORTANTE: Reemplaza 'attendance_logs' si tu LocalStorage usa otra clave
    const logs = JSON.parse(localStorage.getItem('attendance_logs')) || []; 
    const tbody = document.getElementById('dashboard-table-body');
    
    // Actualizar KPIs superiores en tiempo real
    document.getElementById('dash-total-marcajes').innerText = logs.length;
    
    const areasUnicas = [...new Set(logs.map(log => log.role || log.area || 'General'))];
    const cuentaAreas = areasUnicas.filter(a => a !== 'General' && a !== '').length;
    document.getElementById('dash-areas-activas').innerText = logs.length > 0 ? (cuentaAreas === 0 ? 1 : cuentaAreas) : 0;

    tbody.innerHTML = '';

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px;">No hay marcajes registrados hoy.</td></tr>`;
        return;
    }

    // Listar del más reciente al más antiguo
    [...logs].reverse().forEach(log => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td style="font-weight:bold; color:#0f172a;">${log.time || '00:00'}</td>
            <td>${log.rut || log.id || 'N/A'}</td>
            <td style="font-weight:600;">${log.name || 'Desconocido'}</td>
            <td><span style="background:#e2e8f0; padding:3px 8px; border-radius:4px; font-size:0.75rem; font-weight:500;">${log.role || log.area || 'General'}</span></td>
            <td><b style="color:#22c55e;">${log.status || 'Ingreso'}</b></td>
        `;
        tbody.appendChild(fila);
    });
}

// 4. FILTRADO FILO-BUSCADOR EN TIEMPO REAL
function filtrarDashboard() {
    const termino = document.getElementById('dash-search').value.toLowerCase();
    const filas = document.querySelectorAll('#dashboard-table-body tr');

    filas.forEach(fila => {
        const texto = fila.innerText.toLowerCase();
        fila.style.display = texto.includes(termino) ? '' : 'none';
    });
}

// 5. BLINDAJE DE ENFOQUE PARA CAPTURA DE PISTOLA QR
function fuerzaEnfoqueLectorExterno() {
    const inputExterno = document.getElementById('lector-externo-input');
    const modalAdmin = document.getElementById('custom-admin-modal');
    
    // Si el modal de contraseña está abierto, no robamos el foco para dejar escribir el PIN
    if (modalAdmin && (modalAdmin.style.display === 'block' || modalAdmin.classList.contains('active'))) {
        return;
    }
    
    // Si estamos en la pestaña de análisis tampoco robamos foco para dejar usar el buscador
    if (document.getElementById('vista-dashboard').style.display === 'block') {
        return;
    }

    if (inputExterno) inputExterno.focus();
}

// 6. ESCUCHADORES E INICIALIZACIÓN DE DISPOSITIVOS EXTERNOS
document.addEventListener('DOMContentLoaded', () => {
    const inputExterno = document.getElementById('lector-externo-input');

    // Forzar foco inicial
    setTimeout(fuerzaEnfoqueLectorExterno, 500);

    // Evitar que desvíen el foco al hacer clics accidentales en el cuerpo del Kiosco
    document.addEventListener('click', fuerzaEnfoqueLectorExterno);

    // Capturar disparo de la pistola de hardware
    if (inputExterno) {
        inputExterno.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const codigoEscaneado = inputExterno.value.trim();
                
                if (codigoEscaneado.length > 0) {
                    console.log("🚀 Captura Externa:", codigoEscaneado);
                    
                    // Enrutador inteligente hacia tu procesador nativo de scanner.js
                    if (typeof onScanSuccess === 'function') {
                        onScanSuccess(codigoEscaneado);
                    } else if (typeof procesarMarcaje === 'function') {
                        procesarMarcaje(codigoEscaneado);
                    }
                }
                inputExterno.value = ''; // Vaciar caja de inmediato para la siguiente credencial
                setTimeout(fuerzaEnfoqueLectorExterno, 50);
            }
        });
    }
});