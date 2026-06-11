// ==========================================================================
// MÓDULO DE EXPORTACIÓN A EXCEL (Optimizado para Gráficos y Tablas Dinámicas)
// Versión: Turnos Oficiales Jumbo - Consolidado Corporativo
// ==========================================================================

function exportToExcel() {
    // 1. Verificación de seguridad: ¿Hay datos cargados en la memoria global?
    if (!db || db.length === 0) {
        if (typeof showNotification === 'function') {
            showNotification('❌ No hay datos analíticos para exportar hoy.', 'error');
        } else {
            alert('No hay registros para exportar.');
        }
        return;
    }

    try {
        // 2. Mapeamos la base de datos a una matriz plana de Inteligencia de Negocios (BI)
        const rowsForExcel = db.map((registro, index) => {

            // Obtener la hora limpia y segura para la clasificación analítica
            const horaMarcaje = registro.hora || registro.HORA || "00:00:00";
            const clasificacion = clasificarRangoHorario(horaMarcaje);

            return {
                "ID_REGISTRO": index + 1,
                "FECHA": registro.fecha || obtenerFechaActualChile(),
                "HORA_COMPLETA": horaMarcaje,
                "BLOQUE_HORA": clasificacion.bloque,     // Ej: "12:00 - 12:30", "Tarde"
                "TIPO_SERVICIO": clasificacion.servicio, // Ej: "TURNO 1", "ALMUERZO FUERA DE TURNO"
                "RUT": registro.rut || registro.id || registro.RUT || registro.ID || "S/R",
                "NOMBRE_TRABAJADOR": registro.nombre || registro.NOMBRE || "No Registrado en Base de Datos",
                "SECCION": registro.seccion || registro.SECCION || "Sin Sección",
                "CASINO": "Casino Central",
                "CANTIDAD": 1 // 🔢 Columna clave para sumatorias directas en tablas dinámicas
            };
        });

        // 3. Inicializar el libro de trabajo de la librería SheetJS
        const wb = XLSX.utils.book_new();

        // 4. Convertir nuestro JSON mapeado directamente a una hoja de datos limpia
        const ws = XLSX.utils.json_to_sheet(rowsForExcel);

        // 5. Configurar anchos de columna fijos para evitar que los datos se corten al abrir
        const colWidths = [
            { wch: 12 }, // ID_REGISTRO
            { wch: 14 }, // FECHA
            { wch: 16 }, // HORA_COMPLETA
            { wch: 16 }, // BLOQUE_HORA
            { wch: 26 }, // TIPO_SERVICIO (Ancho para nombres largos)
            { wch: 15 }, // RUT
            { wch: 35 }, // NOMBRE_TRABAJADOR
            { wch: 25 }, // SECCION
            { wch: 16 }, // CASINO
            { wch: 12 }  // CANTIDAD
        ];
        ws['!cols'] = colWidths;

        // 6. Añadir la hoja al libro de trabajo
        XLSX.utils.book_append_sheet(wb, ws, "Base_Analitica_Casino");

        // 7. Generar el nombre de archivo con la fecha del día actual
        const fechaArchivo = obtenerFechaActualChile().replace(/\//g, '-');
        const nombreArchivo = `BI_Asistencia_Casino_Jumbo_${fechaArchivo}.xlsx`;

        // 8. Disparar la descarga automática en el dispositivo (Tablet o Móvil)
        XLSX.writeFile(wb, nombreArchivo);

        // Notificación de éxito estilizada propia de la PWA
        if (typeof showNotification === 'function') {
            showNotification('📊 Base analítica por turnos exportada', 'success');
        }

    } catch (error) {
        console.error("Error crítico en módulo excel.js:", error);
        if (typeof showNotification === 'function') {
            showNotification('❌ Error al estructurar matriz de gráficos', 'error');
        }
    }
}

/**
 * 🕵️ DETECTOR ANALÍTICO: Clasifica el marcaje en minutos totales del día
 * para encajarlo perfectamente en los 4 turnos estrictos de Jumbo.
 */
function clasificarRangoHorario(horaString) {
    if (!horaString || String(horaString).trim() === "") {
        return { bloque: "Sin Hora", servicio: "INDETERMINADO" };
    }

    try {
        const partes = String(horaString).split(':');
        const hora = parseInt(partes[0], 10) || 0;
        const minutos = parseInt(partes[1], 10) || 0;

        // Convertimos la hora actual a minutos totales transcurridos desde las 00:00
        const minTotales = (hora * 60) + minutos;

        // --------------------------------------------------------------------------
        // 1. EVALUACIÓN DE VENTANAS HORARIAS DE LOS 4 TURNOS OFICIALES JUMBO
        // --------------------------------------------------------------------------

        // 🕒 TURNO 1: 12:00 a 12:30 (720 a 750 minutos)
        if (minTotales >= 720 && minTotales <= 750) {
            return { bloque: "12:00 - 12:30", servicio: "TURNO 1" };
        }

        // 🕒 TURNO 2: 12:45 a 13:15 (765 a 795 minutos)
        if (minTotales >= 765 && minTotales <= 795) {
            return { bloque: "12:45 - 13:15", servicio: "TURNO 2" };
        }

        // 🕒 TURNO 3: 13:30 a 14:00 (810 a 840 minutos)
        if (minTotales >= 810 && minTotales <= 840) {
            return { bloque: "13:30 - 14:00", servicio: "TURNO 3" };
        }

        // 🕒 TURNO 4: 14:15 a 14:45 (855 a 885 minutos)
        if (minTotales >= 855 && minTotales <= 885) {
            return { bloque: "14:15 - 14:45", servicio: "TURNO 4" };
        }

        // --------------------------------------------------------------------------
        // 2. EVALUACIÓN DE OTROS SERVICIOS, REZAGADOS Y VENTANAS INTERMEDIAS
        // --------------------------------------------------------------------------

        // 🥞 Desayuno: 06:00 a 11:59 (360 a 719 minutos)
        if (minTotales >= 360 && minTotales < 720) {
            return { bloque: "Mañana", servicio: "DESAYUNO" };
        }

        // ⏳ Almuerzo Fuera de Turno / Ventanas Muertas / Rezagados de Tarde: 
        // Cubre desde las 12:00 (720) hasta las 16:59 (1019) que no hayan calzado con los turnos oficiales arriba.
        if (minTotales >= 720 && minTotales < 1020) {
            return { bloque: "Ventana / Rezagado", servicio: "ALMUERZO FUERA DE TURNO" };
        }

        // ☕ Once / Cena: 17:00 a 20:59 (1020 a 1259 minutos)
        if (minTotales >= 1020 && minTotales < 1260) {
            return { bloque: "Tarde", servicio: "ONCE / CENA" };
        }

        // 🌙 Colación Nocturna / Turno de Cierre: 21:00 a 05:59 (1260 a 359 minutos)
        // Nota: Maneja limpiamente el cambio de día a la medianoche (minTotales >= 1260 o minTotales < 360)
        return { bloque: "Nocturno", servicio: "COLACIÓN NOCTURNA" };

    } catch (e) {
        console.error("Error al segmentar el string de tiempo:", e);
        return { bloque: "Error Formato", servicio: "ERROR ANALÍTICO" };
    }
}

/**
 * HELPER: Retorna la fecha actual formateada rigurosamente para el huso de Chile (DD/MM/YYYY)
 */
function obtenerFechaActualChile() {
    try {
        const ahora = new Date();
        return ahora.toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch (e) {
        return "11-06-2026"; // Respaldo estático con fecha actual
    }
}

// Vinculación explícita al entorno global de la PWA
window.exportToExcel = exportToExcel;