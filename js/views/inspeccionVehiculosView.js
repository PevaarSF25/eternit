import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { hasPermission } from '../auth.js';
import { initDatePicker } from '../components/datePicker.js';
import {
    getAllInspeccionesVehiculos,
    createInspeccionVehiculos,
    updateInspeccionVehiculos,
    deleteInspeccionVehiculos
} from '../services/inspeccionVehiculosService.js';

const SECCIONES = [
    {
        num: 'I', titulo: 'DOCUMENTOS',
        items: [
            { key: 'doc_1', label: '¿El conductor posee la tarjeta de propiedad a la mano?' },
            { key: 'doc_2', label: '¿El conductor posee su licencia de conducción vigente?' },
            { key: 'doc_3', label: '¿La revisión técnico mecánica y de gases está vigente?' },
            { key: 'doc_4', label: '¿El seguro obligatorio SOAT está vigente?' }
        ]
    },
    {
        num: 'II', titulo: 'ILUMINACIÓN',
        items: [
            { key: 'ilu_1', label: '¿Las luces altas y bajas encienden e iluminan adecuadamente?' },
            { key: 'ilu_2', label: '¿Las luces de parqueo, freno y reversa encienden correctamente?' },
            { key: 'ilu_3', label: '¿Las luces direccionales delanteras y traseras encienden correctamente?' },
            { key: 'ilu_4', label: '¿La baliza estroboscópica enciende correctamente?' },
            { key: 'ilu_5', label: '¿Las luces internas de la cabina encienden e iluminan adecuadamente?' },
            { key: 'ilu_6', label: '¿La Antena Buggy Whip enciende correctamente?' }
        ]
    },
    {
        num: 'III', titulo: 'NIVELES Y FUGAS',
        items: [
            { key: 'niv_1', label: '¿El nivel de combustible es suficiente para el trayecto que se realizará?' },
            { key: 'niv_2', label: '¿La cantidad de aceite del motor, frenos y la dirección hidráulica se encuentran en sus niveles normales?' },
            { key: 'niv_3', label: '¿La viscosidad del aceite del motor es gruesa?' },
            { key: 'niv_4', label: '¿La cantidad de agua del radiador, batería y el limpia para brisas se encuentran en sus niveles normales?' }
        ]
    },
    {
        num: 'IV', titulo: 'TABLERO',
        items: [
            { key: 'tab_1', label: '¿El indicador del nivel de temperatura se encuentra en los niveles adecuados?' },
            { key: 'tab_2', label: '¿El velocímetro y tacómetro funcionan adecuadamente?' },
            { key: 'tab_3', label: '¿Los indicadores de mal funcionamiento del vehículo están apagados?' }
        ]
    },
    {
        num: 'V', titulo: 'MANDOS',
        items: [
            { key: 'man_1', label: '¿La bocina principal (pito) y de reversa funcionan adecuadamente?' },
            { key: 'man_2', label: '¿El acelerador, freno y embrague funcionan correctamente?' },
            { key: 'man_3', label: '¿Los frenos de emergencia funcionan correctamente?' }
        ]
    },
    {
        num: 'VI', titulo: 'CARROCERÍA',
        items: [
            { key: 'car_1', label: '¿Las puertas se encuentran sin aparente deterioro?' },
            { key: 'car_2', label: '¿La latonería y pintura se encuentra sin evidencias de grietas, fisuras, fracturas u oxidación?' },
            { key: 'car_3', label: '¿Los vidrios, ventanillas y parabrisas se encuentran sin fisuras, funcionan y permiten visibilidad?' },
            { key: 'car_4', label: '¿Los cinturones de seguridad existen para cada asiento y funcionan adecuadamente?' },
            { key: 'car_5', label: '¿Los asientos se encuentran sin daño aparente, rotos, sucios o descosidos?' },
            { key: 'car_6', label: '¿Las palancas de accionamiento de los asientos funcionan?' },
            { key: 'car_7', label: '¿Se cuenta con espejos retrovisores (panorámico y laterales) y tienen buena movilidad?' },
            { key: 'car_8', label: '¿El sistema de alarma, seguros y bloqueos funciona?' }
        ]
    },
    {
        num: 'VII', titulo: 'ESTADO MECÁNICO',
        items: [
            { key: 'mec_1', label: '¿La caja de cambios funciona de manera correcta?' },
            { key: 'mec_2', label: '¿El volante o cabrilla funciona adecuadamente?' },
            { key: 'mec_3', label: '¿El aire acondicionado funciona y ofrece confort térmico?' },
            { key: 'mec_4', label: '¿La suspensión se encuentra sin ningún tipo de ruido como chillidos?' },
            { key: 'mec_5', label: '¿Al encender el vehículo la batería da un buen arranque?' },
            { key: 'mec_6', label: '¿Las correas del motor se encuentran sin ningún tipo de ruido (chillidos) que evidencien deterioro o desajuste?' },
            { key: 'mec_7', label: '¿El sistema de escape se encuentra sin ningún ruido que evidencie alguna fisura o deterioro?' }
        ]
    },
    {
        num: 'VIII', titulo: 'LLANTAS',
        items: [
            { key: 'lla_1', label: '¿Los rines se encuentran sin fisuras, grietas, y bien ajustados?' },
            { key: 'lla_2', label: '¿Las llantas se encuentran sin cortaduras profundas, abultamientos, abolladuras?' },
            { key: 'lla_3', label: '¿Las llantas poseen el labrado mínimo de 3 milímetros de huella?' },
            { key: 'lla_4', label: '¿Las llantas visualmente se encuentran con un nivel de aire adecuado?' },
            { key: 'lla_5', label: '¿Se cuenta con llanta de repuesto?' }
        ]
    },
    {
        num: 'IX', titulo: 'EQUIPO DE CARRETERAS',
        items: [
            { key: 'eqp_1', label: '¿El extintor se encuentra con carga vigente y en buen estado, con su respectivo soporte?' },
            { key: 'eqp_2', label: '¿El botiquín de primeros auxilios se encuentra dotado y todos sus elementos sin vencerse?' },
            { key: 'eqp_3', label: '¿Se cuenta con gato, cruceta, llaves, cable de ignición, tacos y conos de señalización?' },
            { key: 'eqp_4', label: '¿Se cuenta con otras herramientas que permitan un desvare?' }
        ]
    }
];

const ALL_KEYS = SECCIONES.flatMap(function(s) { return s.items.map(function(i) { return i.key; }); });

var _BASE_BTN = 'padding:5px 16px; border-radius:20px; border:1.5px solid; cursor:pointer; font-size:12px; font-weight:700; transition:all 0.15s; white-space:nowrap; line-height:1.4; display:inline-flex; align-items:center; min-width:44px; justify-content:center;';

function getBtnStyle(val, isActive) {
    if (val === 'B')  return _BASE_BTN + (isActive ? 'background:#22c55e;color:#fff;border-color:#22c55e;box-shadow:0 0 0 2px rgba(34,197,94,0.2);' : 'background:#f0fdf4;color:#16a34a;border-color:#bbf7d0;');
    if (val === 'M')  return _BASE_BTN + (isActive ? 'background:#ef4444;color:#fff;border-color:#ef4444;box-shadow:0 0 0 2px rgba(239,68,68,0.2);' : 'background:#fef2f2;color:#dc2626;border-color:#fecaca;');
    return _BASE_BTN + (isActive ? 'background:#6b7280;color:#fff;border-color:#6b7280;box-shadow:0 0 0 2px rgba(107,114,128,0.2);' : 'background:#f3f4f6;color:#4b5563;border-color:#e5e7eb;');
}

function countB(ev) { return ALL_KEYS.filter(function(k) { return ev[k] === 'B'; }).length; }
function countM(ev) { return ALL_KEYS.filter(function(k) { return ev[k] === 'M'; }).length; }

function getActionButtons(id, canEdit) {
    return '<div style="display:flex;align-items:center;justify-content:center;gap:6px;">'
        + '<button data-action="view" data-id="' + id + '" title="Ver" style="background:var(--accent-bg);border:1px solid var(--border-focus);border-radius:6px;padding:6px;cursor:pointer;color:var(--accent);display:flex;align-items:center;"><i data-lucide="eye" style="width:14px;height:14px;"></i></button>'
        + (canEdit
            ? '<button data-action="edit" data-id="' + id + '" title="Editar" style="background:rgba(0,180,216,0.1);border:1px solid rgba(0,180,216,0.2);border-radius:6px;padding:6px;cursor:pointer;color:#00b4d8;display:flex;align-items:center;"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>'
            + '<button data-action="delete" data-id="' + id + '" title="Eliminar" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:6px;padding:6px;cursor:pointer;color:#ef4444;display:flex;align-items:center;"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>'
            : '')
        + '</div>';
}

function _esc(str) {
    return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function renderInspeccionVehiculos(container) {
    var evalState = {};
    var mediasRows = [];
    var currentId = null;
    var isReadOnly = false;
    var cachedData = null;

    container.innerHTML = '<style>'
        + '.mv-item::-webkit-outer-spin-button,.mv-item::-webkit-inner-spin-button{-webkit-appearance:none;margin:0;}'
        + '.mv-item{-moz-appearance:textfield;}'
        + '</style>'
        + '<div class="registro-container">'

        // Header
        + '<div class="registro-header" style="display:flex;flex-direction:column;align-items:stretch;gap:var(--space-4);margin-bottom:var(--space-6);width:100%;">'
        + '<h2>Inspección de Vehículos</h2>'
        + '<div style="display:flex;align-items:center;width:100%;gap:12px;flex-wrap:wrap;">'
        + '<div class="search-wrapper" id="table-search-wrapper" style="position:relative;flex:0 1 400px;">'
        + '<input type="text" class="form-input" id="table-search-input" placeholder="Buscar por conductor, vehículo, fecha..." style="width:100%;padding-left:40px;background-color:var(--bg-surface);border:1px solid var(--border-default);">'
        + '<i data-lucide="search" style="position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--text-muted);width:16px;height:16px;pointer-events:none;"></i>'
        + '</div>'
        + '<button class="btn btn-primary btn-glow" id="btn-nuevo-registro" style="display:none;flex-shrink:0;white-space:nowrap;align-items:center;gap:6px;margin-left:auto;">'
        + '<i data-lucide="plus" style="width:16px;height:16px;"></i> Nueva Inspección'
        + '</button>'
        + '</div>'
        + '</div>'

        // TABLE VIEW
        + '<div id="view-table">'
        + '<div style="background:var(--bg-surface);border:1px solid var(--border-default);border-radius:12px;padding:var(--space-4);">'
        + '<h3 style="margin:0 0 var(--space-4) 0;display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;color:var(--text-primary);">'
        + '<i data-lucide="list" style="width:18px;height:18px;"></i> Inspecciones Guardadas'
        + '</h3>'
        + '<div id="table-container"></div>'
        + '</div>'
        + '</div>'

        // FORM VIEW
        + '<div id="view-form" style="display:none;">'
        + '<div style="margin-bottom:var(--space-4);">'
        + '<button id="btn-volver-tabla" style="background:none;border:none;color:var(--text-secondary);cursor:pointer;display:flex;align-items:center;gap:8px;font-weight:500;font-size:14px;">'
        + '<i data-lucide="arrow-left" style="width:18px;height:18px;"></i> Volver a la tabla'
        + '</button>'
        + '</div>'

        + '<form id="veh-form">'

        // 1. General
        + '<div class="card form-section" style="margin-bottom:var(--space-6);">'
        + '<h3 class="form-section-title">1. Información General</h3>'
        + '<div class="form-grid">'
        + '<div class="form-group"><label class="form-label">Fecha de inspección *</label>'
        + '<input type="text" class="form-input" id="veh-fecha" readonly placeholder="Seleccione fecha..." style="cursor:pointer;"></div>'
        + '<div class="form-group"><label class="form-label">Nombre del conductor</label>'
        + '<input type="text" class="form-input" id="veh-conductor" placeholder="Nombre del conductor"></div>'
        + '<div class="form-group"><label class="form-label">Cargo</label>'
        + '<input type="text" class="form-input" id="veh-cargo" placeholder="Cargo"></div>'
        + '<div class="form-group"><label class="form-label">Fecha próxima inspección</label>'
        + '<input type="text" class="form-input" id="veh-fecha-proxima" readonly placeholder="Seleccione fecha..." style="cursor:pointer;"></div>'
        + '</div>'
        + '</div>'

        // 2. Datos del vehículo
        + '<div class="card form-section" style="margin-bottom:var(--space-6);">'
        + '<h3 class="form-section-title">2. Datos del Vehículo</h3>'
        + '<div class="form-grid">'
        + '<div class="form-group"><label class="form-label">Tipo</label>'
        + '<input type="text" class="form-input" id="veh-tipo" placeholder="Tipo de vehículo"></div>'
        + '<div class="form-group"><label class="form-label">Marca</label>'
        + '<input type="text" class="form-input" id="veh-marca" placeholder="Marca"></div>'
        + '<div class="form-group"><label class="form-label">Modelo</label>'
        + '<input type="text" class="form-input" id="veh-modelo" placeholder="Modelo"></div>'
        + '<div class="form-group"><label class="form-label">No. Interno</label>'
        + '<input type="text" class="form-input" id="veh-no-interno" placeholder="No. interno"></div>'
        + '<div class="form-group"><label class="form-label">Kilometraje</label>'
        + '<input type="text" class="form-input" id="veh-kilometraje" placeholder="Km"></div>'
        + '<div class="form-group"><label class="form-label">Proyecto</label>'
        + '<input type="text" class="form-input" id="veh-proyecto" placeholder="Proyecto"></div>'
        + '</div>'
        + '</div>'

        // 3. Evaluation table
        + '<div class="card form-section" style="margin-bottom:var(--space-6);overflow-x:auto;">'
        + '<h3 class="form-section-title" style="margin-bottom:var(--space-4);">3. Descripción de Aspectos a Evaluar</h3>'
        + '<div id="eval-table-container"></div>'
        + '</div>'

        // 4. Otro aspecto
        + '<div class="card form-section" style="margin-bottom:var(--space-6);">'
        + '<h3 class="form-section-title">4. Descripción de otro aspecto observado</h3>'
        + '<div class="form-group" style="margin-bottom:0;">'
        + '<textarea class="form-input" id="veh-otro-aspecto" rows="4" placeholder="Describa aquí cualquier otro aspecto observado..." style="resize:vertical;"></textarea>'
        + '</div>'
        + '</div>'

        // 5. Medidas
        + '<div class="card form-section" style="margin-bottom:var(--space-6);">'
        + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:var(--space-4);">'
        + '<h3 class="form-section-title" style="margin:0;">5. Medidas de Intervención</h3>'
        + '<button type="button" id="btn-add-medida" class="btn btn-secondary" style="font-size:13px;display:flex;align-items:center;gap:6px;">'
        + '<i data-lucide="plus" style="width:14px;height:14px;"></i> Agregar medida'
        + '</button>'
        + '</div>'
        + '<div style="overflow-x:auto;">'
        + '<table style="width:100%;border-collapse:collapse;font-size:13px;min-width:860px;table-layout:fixed;">'
        + '<colgroup><col style="width:80px;"><col><col><col style="width:170px;"><col style="width:160px;"><col style="width:40px;"></colgroup>'
        + '<thead><tr style="background:var(--bg-hover);">'
        + '<th style="padding:10px 12px;text-align:center;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-secondary);border-bottom:2px solid var(--border-default);">ITEM</th>'
        + '<th style="padding:10px 12px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-secondary);border-bottom:2px solid var(--border-default);">DESCRIPCIÓN DEL ASPECTO</th>'
        + '<th style="padding:10px 12px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-secondary);border-bottom:2px solid var(--border-default);">MEDIDA DE CONTROL PROPUESTA</th>'
        + '<th style="padding:10px 12px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-secondary);border-bottom:2px solid var(--border-default);">FECHA PARA IMPLEMENTAR</th>'
        + '<th style="padding:10px 12px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-secondary);border-bottom:2px solid var(--border-default);">RESPONSABLE</th>'
        + '<th style="border-bottom:2px solid var(--border-default);"></th>'
        + '</tr></thead>'
        + '<tbody id="medidas-tbody"></tbody>'
        + '</table>'
        + '<div id="medidas-empty" style="text-align:center;padding:28px;color:var(--text-muted);font-size:13px;display:none;">'
        + 'Sin medidas registradas. Haz clic en "Agregar medida" para añadir una.'
        + '</div>'
        + '</div>'
        + '</div>'

        // Actions
        + '<div id="form-actions" style="display:flex;gap:var(--space-3);justify-content:flex-end;padding-bottom:var(--space-6);">'
        + '<button type="button" class="btn btn-secondary" id="btn-limpiar">Limpiar</button>'
        + '<button type="submit" class="btn btn-primary btn-glow" id="btn-guardar">'
        + '<i data-lucide="save" style="width:16px;height:16px;"></i> Guardar inspección'
        + '</button>'
        + '</div>'
        + '</form>'
        + '</div>'
        + '</div>';

    if (window.lucide) window.lucide.createIcons();

    var canEdit = hasPermission('EDIT_INSPECCION_VEHICULOS');

    var viewTable      = container.querySelector('#view-table');
    var viewForm       = container.querySelector('#view-form');
    var tableContainer = container.querySelector('#table-container');
    var evalContainer  = container.querySelector('#eval-table-container');
    var medidasTbody   = container.querySelector('#medidas-tbody');
    var medidasEmpty   = container.querySelector('#medidas-empty');
    var btnNuevo       = container.querySelector('#btn-nuevo-registro');
    var btnVolver      = container.querySelector('#btn-volver-tabla');
    var btnLimpiar     = container.querySelector('#btn-limpiar');
    var btnAddMedida   = container.querySelector('#btn-add-medida');
    var form           = container.querySelector('#veh-form');
    var inputFecha     = container.querySelector('#veh-fecha');
    var inputConductor = container.querySelector('#veh-conductor');
    var inputCargo     = container.querySelector('#veh-cargo');
    var inputFechaProx = container.querySelector('#veh-fecha-proxima');
    var inputTipo      = container.querySelector('#veh-tipo');
    var inputMarca     = container.querySelector('#veh-marca');
    var inputModelo    = container.querySelector('#veh-modelo');
    var inputNoInterno = container.querySelector('#veh-no-interno');
    var inputKm        = container.querySelector('#veh-kilometraje');
    var inputProyecto  = container.querySelector('#veh-proyecto');
    var inputOtro      = container.querySelector('#veh-otro-aspecto');
    var searchInput    = container.querySelector('#table-search-input');
    var formActions    = container.querySelector('#form-actions');

    if (canEdit) btnNuevo.style.display = 'inline-flex';

    initDatePicker(inputFecha, null, 'YYYY-MM-DD');
    initDatePicker(inputFechaProx, null, 'YYYY-MM-DD');

    // ── Eval table (B / M / N/A) ───────────────────────────────────────────────
    function buildEvalTable() {
        var thStyle = 'padding:8px 12px;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-secondary);border-bottom:2px solid var(--border-default);white-space:nowrap;';
        var html = '<table style="width:100%;border-collapse:collapse;font-size:13px;">'
            + '<thead><tr>'
            + '<th style="' + thStyle + ' text-align:center;width:44px;">No</th>'
            + '<th style="' + thStyle + '">DESCRIPCIÓN DE ASPECTOS A EVALUAR</th>'
            + '<th style="' + thStyle + ' text-align:center;width:72px;">B</th>'
            + '<th style="' + thStyle + ' text-align:center;width:72px;">M</th>'
            + '<th style="' + thStyle + ' text-align:center;width:72px;">N/A</th>'
            + '</tr></thead><tbody>';

        var idx = 1;
        SECCIONES.forEach(function(sec) {
            html += '<tr style="background:rgba(var(--accent-rgb,59,130,246),0.06);">'
                + '<td style="padding:8px 12px;font-weight:700;font-size:12px;color:var(--text-primary);border-bottom:1px solid var(--border-light);text-align:center;">' + sec.num + '</td>'
                + '<td colspan="4" style="padding:8px 12px;font-weight:700;font-size:12px;letter-spacing:0.5px;color:var(--text-primary);border-bottom:1px solid var(--border-light);">' + sec.titulo + '</td>'
                + '</tr>';
            sec.items.forEach(function(item) {
                var td = 'padding:9px 12px;border-bottom:1px solid var(--border-light);vertical-align:middle;';
                html += '<tr style="background:var(--bg-surface);">'
                    + '<td style="' + td + ' text-align:center;color:var(--text-muted);font-size:12px;">' + idx + '</td>'
                    + '<td style="' + td + ' color:var(--text-primary);">' + item.label + '</td>'
                    + '<td style="' + td + ' text-align:center;"><button type="button" class="veh-eval-btn" data-key="' + item.key + '" data-val="B"  title="Buen estado"  style="' + getBtnStyle('B',  false) + '">B</button></td>'
                    + '<td style="' + td + ' text-align:center;"><button type="button" class="veh-eval-btn" data-key="' + item.key + '" data-val="M"  title="Mal estado"   style="' + getBtnStyle('M',  false) + '">M</button></td>'
                    + '<td style="' + td + ' text-align:center;"><button type="button" class="veh-eval-btn" data-key="' + item.key + '" data-val="NA" title="No aplica"    style="' + getBtnStyle('NA', false) + '">N/A</button></td>'
                    + '</tr>';
                idx++;
            });
        });

        html += '</tbody></table>';
        evalContainer.innerHTML = html;

        evalContainer.addEventListener('click', function(e) {
            var btn = e.target.closest('.veh-eval-btn');
            if (!btn) return;
            var key = btn.dataset.key;
            var val = btn.dataset.val;
            evalState[key] = (evalState[key] === val) ? null : val;
            updateEvalButtons(key);
        });
    }

    function updateEvalButtons(key) {
        var cur = evalState[key] || null;
        evalContainer.querySelectorAll('.veh-eval-btn[data-key="' + key + '"]').forEach(function(btn) {
            btn.style.cssText = getBtnStyle(btn.dataset.val, btn.dataset.val === cur);
        });
    }

    function setEvalState(ev) {
        ev = ev || {};
        evalState = {};
        ALL_KEYS.forEach(function(k) { evalState[k] = ev[k] || null; });
        ALL_KEYS.forEach(updateEvalButtons);
    }

    buildEvalTable();

    // ── Medidas table ──────────────────────────────────────────────────────────
    var _INPUT = 'width:100%;box-sizing:border-box;padding:7px 10px;font-size:13px;border:1px solid var(--border-default);border-radius:6px;background:var(--bg-input,var(--bg-surface));color:var(--text-primary);';

    function saveMedidasFromDOM() {
        var rows = medidasTbody.querySelectorAll('tr');
        mediasRows = Array.from(rows).map(function(tr) {
            return {
                item:        tr.querySelector('.mv-item').value,
                descripcion: tr.querySelector('.mv-desc').value,
                medida:      tr.querySelector('.mv-control').value,
                fecha:       tr.querySelector('.mv-fecha').value,
                responsable: tr.querySelector('.mv-resp').value
            };
        });
    }

    function renderMedidasTable(readonly) {
        var tdStyle = 'padding:6px 8px;border-bottom:1px solid var(--border-light);vertical-align:middle;';
        if (mediasRows.length === 0) {
            medidasTbody.innerHTML = '';
            medidasEmpty.style.display = 'block';
        } else {
            medidasEmpty.style.display = 'none';
            var ro = readonly ? ' readonly' : '';
            medidasTbody.innerHTML = mediasRows.map(function(row, i) {
                return '<tr>'
                    + '<td style="' + tdStyle + ' text-align:center;">'
                    + '<input type="number" class="mv-item" min="1" value="' + (row.item || '') + '" placeholder="N°" style="' + _INPUT + ' text-align:center;width:60px;"' + ro + '>'
                    + '</td>'
                    + '<td style="' + tdStyle + '"><input type="text" class="mv-desc" value="' + _esc(row.descripcion) + '" placeholder="Descripción del aspecto" style="' + _INPUT + '"' + ro + '></td>'
                    + '<td style="' + tdStyle + '"><input type="text" class="mv-control" value="' + _esc(row.medida) + '" placeholder="Medida de control propuesta" style="' + _INPUT + '"' + ro + '></td>'
                    + '<td style="' + tdStyle + '"><input type="text" class="mv-fecha" value="' + _esc(row.fecha) + '" placeholder="Seleccione fecha..." style="' + _INPUT + (readonly ? '' : ' cursor:pointer;') + '" readonly></td>'
                    + '<td style="' + tdStyle + '"><input type="text" class="mv-resp" value="' + _esc(row.responsable) + '" placeholder="Responsable" style="' + _INPUT + '"' + ro + '></td>'
                    + '<td style="' + tdStyle + ' text-align:center;">'
                    + (readonly ? '' : '<button type="button" class="btn-del-medida" data-idx="' + i + '" title="Eliminar" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:6px;width:28px;height:28px;cursor:pointer;color:#ef4444;font-size:16px;line-height:1;display:inline-flex;align-items:center;justify-content:center;">×</button>')
                    + '</td>'
                    + '</tr>';
            }).join('');
        }

        if (!readonly) {
            medidasTbody.querySelectorAll('.mv-fecha').forEach(function(el) {
                initDatePicker(el, null, 'YYYY-MM-DD');
            });
        }

        medidasTbody.querySelectorAll('.btn-del-medida').forEach(function(btn) {
            btn.addEventListener('click', function() {
                saveMedidasFromDOM();
                mediasRows.splice(parseInt(btn.dataset.idx, 10), 1);
                renderMedidasTable(false);
            });
        });
    }

    btnAddMedida.addEventListener('click', function() {
        saveMedidasFromDOM();
        mediasRows.push({ item: '', descripcion: '', medida: '', fecha: '', responsable: '' });
        renderMedidasTable(false);
    });

    renderMedidasTable(false);

    // ── View switching ─────────────────────────────────────────────────────────
    function showTable() {
        viewForm.style.display = 'none';
        viewTable.style.display = 'block';
        refreshTable();
    }

    function showFormView(readonly) {
        isReadOnly = readonly;
        viewTable.style.display = 'none';
        viewForm.style.display = 'block';

        var textInputs = [inputConductor, inputCargo, inputTipo, inputMarca,
                          inputModelo, inputNoInterno, inputKm, inputProyecto, inputOtro];
        textInputs.forEach(function(el) {
            el.readOnly = readonly;
            el.style.opacity = readonly ? '0.75' : '';
        });

        evalContainer.querySelectorAll('.veh-eval-btn').forEach(function(b) {
            b.disabled = readonly;
            b.style.cursor = readonly ? 'default' : 'pointer';
        });

        btnAddMedida.style.display = readonly ? 'none' : '';
        formActions.style.display  = readonly ? 'none' : 'flex';

        renderMedidasTable(readonly);
        if (window.lucide) window.lucide.createIcons();
    }

    function resetForm() {
        currentId = null;
        form.reset();
        inputFecha.value = '';
        evalState = {};
        ALL_KEYS.forEach(updateEvalButtons);
        mediasRows = [];
        renderMedidasTable(false);
    }

    // ── Saved table ────────────────────────────────────────────────────────────
    async function refreshTable() {
        tableContainer.innerHTML = '<div style="text-align:center;padding:48px;color:var(--text-secondary);"><div class="spinner"></div></div>';

        var res = await getAllInspeccionesVehiculos();
        if (res.error) {
            tableContainer.innerHTML = '<p style="color:var(--danger);padding:16px;">Error al cargar: ' + res.error.message + '</p>';
            return;
        }
        cachedData = res.data || [];

        var query = (searchInput.value || '').trim().toLowerCase();
        var filtered = query
            ? cachedData.filter(function(r) {
                return (r.fecha || '').includes(query)
                    || (r.nombre_conductor || '').toLowerCase().includes(query)
                    || (r.marca || '').toLowerCase().includes(query)
                    || (r.tipo_vehiculo || '').toLowerCase().includes(query);
            })
            : cachedData;

        if (!filtered.length) {
            tableContainer.innerHTML = '<div style="text-align:center;padding:48px 24px;color:#5a6a7a;font-size:14px;border-radius:12px;border:1px solid var(--border-default);background:var(--bg-surface);">'
                + '<i data-lucide="inbox" style="width:48px;height:48px;margin-bottom:16px;opacity:0.4;display:block;margin-left:auto;margin-right:auto;"></i>'
                + '<p style="margin:0;">No hay inspecciones guardadas.</p></div>';
            if (window.lucide) window.lucide.createIcons({ nodes: [tableContainer] });
            return;
        }

        var thStyle = 'padding:10px 12px;text-align:left;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.4px;color:var(--text-secondary);border-bottom:1px solid var(--border-default);white-space:nowrap;';
        var tdStyle = 'padding:10px 12px;font-size:13px;color:var(--text-secondary);border-bottom:1px solid var(--border-light);white-space:nowrap;vertical-align:middle;';

        var rows = filtered.map(function(r) {
            var ev = r.evaluaciones || {};
            var b  = countB(ev), m = countM(ev), na = ALL_KEYS.length - b - m;
            var scoreHtml = '<div style="display:flex;gap:6px;align-items:center;">'
                + '<span style="background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">B ' + b + '</span>'
                + '<span style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">M ' + m + '</span>'
                + '<span style="background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">N/A ' + na + '</span>'
                + '</div>';
            var vehiculo = [r.tipo_vehiculo, r.marca, r.modelo].filter(Boolean).join(' / ') || '—';
            return '<tr style="background:var(--bg-surface);">'
                + '<td style="' + tdStyle + ' font-weight:600;color:var(--text-primary);">' + (r.fecha || '—') + '</td>'
                + '<td style="' + tdStyle + '">' + (r.nombre_conductor || '—') + '</td>'
                + '<td style="' + tdStyle + '">' + vehiculo + '</td>'
                + '<td style="padding:10px 12px;border-bottom:1px solid var(--border-light);vertical-align:middle;">' + scoreHtml + '</td>'
                + '<td style="padding:10px 12px;text-align:center;border-bottom:1px solid var(--border-light);vertical-align:middle;">' + getActionButtons(r.id, canEdit) + '</td>'
                + '</tr>';
        }).join('');

        tableContainer.innerHTML = '<div style="overflow-x:auto;border-radius:12px;border:1px solid var(--border-default);background:var(--bg-surface);">'
            + '<table style="width:100%;border-collapse:collapse;">'
            + '<thead><tr>'
            + '<th style="' + thStyle + '">FECHA</th>'
            + '<th style="' + thStyle + '">CONDUCTOR</th>'
            + '<th style="' + thStyle + '">VEHÍCULO</th>'
            + '<th style="' + thStyle + '">RESUMEN</th>'
            + '<th style="' + thStyle + ' text-align:center;width:120px;">ACCIONES</th>'
            + '</tr></thead><tbody>' + rows + '</tbody></table></div>';

        if (window.lucide) window.lucide.createIcons({ nodes: [tableContainer] });

        tableContainer.addEventListener('click', async function(e) {
            var btn = e.target.closest('[data-action]');
            if (!btn) return;
            var action = btn.dataset.action;
            var id     = btn.dataset.id;
            var record = cachedData.find(function(r) { return r.id === id; });
            if (!record) return;

            if (action === 'view') {
                currentId = record.id;
                fillForm(record);
                showFormView(true);
            } else if (action === 'edit') {
                currentId = record.id;
                fillForm(record);
                showFormView(false);
            } else if (action === 'delete') {
                var ok = await showConfirmModal('Eliminar inspección', '¿Seguro que deseas eliminar esta inspección? Esta acción no se puede deshacer.');
                if (!ok) return;
                var delRes = await deleteInspeccionVehiculos(id);
                if (delRes.error) { showToast('Error al eliminar: ' + delRes.error.message, 'error'); return; }
                cachedData = null;
                showToast('Inspección eliminada', 'success');
                refreshTable();
            }
        });
    }

    function fillForm(record) {
        inputFecha.value      = record.fecha || '';
        inputConductor.value  = record.nombre_conductor || '';
        inputCargo.value      = record.cargo || '';
        inputFechaProx.value  = record.fecha_proxima_inspeccion || '';
        inputTipo.value       = record.tipo_vehiculo || '';
        inputMarca.value      = record.marca || '';
        inputModelo.value     = record.modelo || '';
        inputNoInterno.value  = record.no_interno || '';
        inputKm.value         = record.kilometraje || '';
        inputProyecto.value   = record.proyecto || '';
        inputOtro.value       = record.descripcion_otro_aspecto || '';
        setEvalState(record.evaluaciones || {});
        mediasRows = Array.isArray(record.medidas) ? record.medidas.slice() : [];
        renderMedidasTable(false);
    }

    // ── Save ───────────────────────────────────────────────────────────────────
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isReadOnly) return;

        var fecha = inputFecha.value;
        if (!fecha) { showToast('La fecha es obligatoria', 'error'); inputFecha.focus(); return; }

        saveMedidasFromDOM();

        var payload = {
            fecha: fecha,
            nombre_conductor: inputConductor.value.trim() || null,
            cargo: inputCargo.value.trim() || null,
            fecha_proxima_inspeccion: inputFechaProx.value || null,
            tipo_vehiculo: inputTipo.value.trim() || null,
            marca: inputMarca.value.trim() || null,
            modelo: inputModelo.value.trim() || null,
            no_interno: inputNoInterno.value.trim() || null,
            kilometraje: inputKm.value.trim() || null,
            proyecto: inputProyecto.value.trim() || null,
            evaluaciones: Object.assign({}, evalState),
            descripcion_otro_aspecto: inputOtro.value.trim() || null,
            medidas: mediasRows
        };

        var btnGuardar = container.querySelector('#btn-guardar');
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> Guardando...';

        try {
            var res = currentId
                ? await updateInspeccionVehiculos(currentId, payload)
                : await createInspeccionVehiculos(payload);
            if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
            cachedData = null;
            showToast(currentId ? 'Inspección actualizada' : 'Inspección guardada', 'success');
            showTable();
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i data-lucide="save" style="width:16px;height:16px;"></i> Guardar inspección';
            if (window.lucide) window.lucide.createIcons();
        }
    });

    // ── Events ─────────────────────────────────────────────────────────────────
    btnNuevo.addEventListener('click', function() { resetForm(); showFormView(false); });
    btnVolver.addEventListener('click', showTable);
    btnLimpiar.addEventListener('click', resetForm);

    var searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(refreshTable, 300);
    });

    inputFecha.value = new Date().toISOString().slice(0, 10);
    showTable();
}
