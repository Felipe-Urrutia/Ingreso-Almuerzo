// ==========================================
// PROCESAMIENTO EXCEL (CARGA DE PERSONAL)
// ==========================================
document.getElementById('excel-upload')?.addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const firstSheet = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheet];
            const jsonResult = XLSX.utils.sheet_to_json(worksheet);

            if (jsonResult.length > 0) {
                dbPersonal = jsonResult;
                localStorage.setItem('dbPersonal', JSON.stringify(dbPersonal));
                
                const btnText = document.getElementById('btn-text');
                if (btnText) btnText.textContent = `BD Cargada (${dbPersonal.length} personas)`;
                
                showNotification(`¡Plantilla cargada con éxito!`, 'info');
            } else {
                showNotification('El archivo Excel está vacío', 'error');
            }
        } catch (error) {
            showNotification('Error al leer el archivo Excel', 'error');
        }
    };
    reader.readAsArrayBuffer(file);
});

// Auxiliares analíticos para el reporte final
function obtenerDiaSemana(dateStr) {
    if (!dateStr) return "N/A";
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const dateObj = new Date(parts[2], parts[1] - 1, parts[0]);
        const dias = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
        return dias[dateObj.getDay()] || "N/A";
    }
    return "N/A";
}

function obtenerBloqueHorario(timeStr) {
    if (!timeStr) return "N/A";
    const hour = parseInt(timeStr.split(':')[0], 10);
    if (isNaN(hour)) return "N/A";
    if (hour >= 6 && hour < 8)   return "06:00 - 07:59 (Turno Mañana A)";
    if (hour >= 8 && hour < 10)  return "08:00 - 09:59 (Turno Mañana B)";
    if (hour >= 12 && hour < 14) return "12:00 - 13:59 (Almuerzo Tarde)";
    if (hour >= 20 && hour < 22) return "20:00 - 21:59 (Turno Noche A)";
    return "Otros Bloques / Intermedios";
}

// EXPORTACIÓN CON LOGICA DE ESTILOS (xlsx.style)
function exportToExcel() {
    if (db.length === 0) {
        alert("No hay registros de asistencia para exportar hoy.");
        return;
    }

    const wb = XLSX.utils.book_new();
    const fechaActual = new Date().toLocaleDateString('es-CL');

    const dataMatrix = [[
        "RUT / ID", "Nombre Colaborador", "Área / Cargo", "Acción / Estado",
        "Fecha Completa", "Año", "Mes", "Día", "Día de la Semana",
        "Hora Completa", "Hora Numérica", "Rango Horario"
    ]];

    db.forEach(log => {
        const f = log.fecha || fechaActual;
        const h = log.hora || '00:00';
        const fParts = f.split('/');

        dataMatrix.push([
            log.id || 'N/A',
            log.nombre || 'Desconocido',
            log.seccion || 'General',
            'Ingreso',
            f,
            parseInt(fParts[2], 10) || '',
            parseInt(fParts[1], 10) || '',
            parseInt(fParts[0], 10) || '',
            obtenerDiaSemana(f),
            h,
            parseInt(h.split(':')[0], 10) || 0,
            obtenerBloqueHorario(h)
        ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(dataMatrix);

    // Cabecera Verde Casino Jumbo
    const headerStyle = {
        font: { name: 'Arial', size: 11, bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "56D683" } },
        alignment: { horizontal: "center", vertical: "center" }
    };

    const columnas = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'];
    columnas.forEach(col => {
        const cellRef = `${col}1`;
        if (ws[cellRef]) ws[cellRef].s = headerStyle;
    });

    // Efecto Cebra para filas de datos
    for (let i = 1; i < dataMatrix.length; i++) {
        const colorFila = (i % 2 === 0) ? "F9F9F9" : "FFFFFF";
        columnas.forEach((col, idx) => {
            const cellRef = col + (i + 1);
            if (ws[cellRef]) {
                ws[cellRef].s = {
                    font: { name: 'Arial', size: 10, color: { rgb: "333333" } },
                    fill: { fgColor: { rgb: colorFila } },
                    alignment: { horizontal: (idx === 1 || idx === 2) ? "left" : "center" }
                };
            }
        });
    }

    ws['!cols'] = [{ wch: 15 }, { wch: 28 }, { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 8 }, { wch: 8 }, { wch: 8 }, { wch: 15 }, { wch: 14 }, { wch: 14 }, { wch: 28 }];
    
    XLSX.utils.book_append_sheet(wb, ws, "BD_Asistencia");

    // Descarga binaria local a través de navegador
    try {
        const wbout = XLSX.write(wb, { bookType: 'xlsx', bookSST: false, type: 'binary' });
        function s2ab(s) {
            const buf = new ArrayBuffer(s.length);
            const view = new Uint8Array(buf);
            for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xFF;
            return buf;
        }
        const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `BD_Asistencia_Jumbo_${fechaActual.replace(/\//g, '-')}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    } catch (error) {
        XLSX.writeFile(wb, `BD_Asistencia_Jumbo_${fechaActual.replace(/\//g, '-')}.xlsx`);
    }
}