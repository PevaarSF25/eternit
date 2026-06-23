import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { createDataTable } from '../components/dataTable.js';
import { getParametros } from '../services/parametricaService.js';
import { initDatePicker } from '../components/datePicker.js';
import {
    getAllInspecciones,
    getInspeccionById,
    createInspeccion,
    updateInspeccion,
    deleteInspeccion
} from '../services/inspeccionArnesesService.js';
import { getAllInventario } from '../services/inventarioArnesesService.js';

let currentRecordId = null;
let dataTableInstance = null;

const CATEGORIAS_EVALUACION = [
    {
        title: 'Cintas y Correas',
        categoryKey: 'cintas',
        items: [
            { key: 'cintas_cortes', label: 'Cortes' },
            { key: 'cintas_rasgaduras', label: 'Rasgaduras' },
            { key: 'cintas_deshilachados', label: 'Deshilachados' },
            { key: 'cintas_quemaduras', label: 'Quemaduras' },
            { key: 'cintas_deformaciones', label: 'Deformaciones' },
            { key: 'cintas_abrasion', label: 'Abrasión/Desgaste' },
            { key: 'cintas_costuras_sueltas', label: 'Costuras sueltas' },
            { key: 'cintas_costuras_rotas', label: 'Costuras rotas' },
            { key: 'cintas_dano_quimico', label: 'Daño químico' },
            { key: 'cintas_endurecimiento', label: 'Endurecimiento' },
            { key: 'cintas_decoloracion_uv', label: 'Decoloración UV' },
            { key: 'cintas_contaminantes', label: 'Contaminantes' }
        ]
    },
    {
        title: 'Costuras',
        categoryKey: 'costuras',
        items: [
            { key: 'costuras_hilos_rotos', label: 'Hilos rotos' },
            { key: 'costuras_hilos_sueltos', label: 'Hilos sueltos' },
            { key: 'costuras_incompletas', label: 'Incompletas' },
            { key: 'costuras_desgaste', label: 'Desgaste' },
            { key: 'costuras_alteraciones', label: 'Alteraciones' }
        ]
    },
    {
        title: 'Hebillas y Ajustes',
        categoryKey: 'hebillas',
        items: [
            { key: 'hebillas_funcionamiento', label: 'Funcionamiento' },
            { key: 'hebillas_corrosion', label: 'Corrosión' },
            { key: 'hebillas_grietas', label: 'Grietas' },
            { key: 'hebillas_deformaciones', label: 'Deformaciones' },
            { key: 'hebillas_desgaste', label: 'Desgaste' },
            { key: 'hebillas_cierre', label: 'Cierre' },
            { key: 'hebillas_bloqueo', label: 'Bloqueo' }
        ]
    },
    {
        title: 'Argollas (D-Rings)',
        categoryKey: 'argollas',
        items: [
            { key: 'argollas_corrosion', label: 'Corrosión' },
            { key: 'argollas_fisuras', label: 'Fisuras' },
            { key: 'argollas_impactos', label: 'Impactos' },
            { key: 'argollas_deformaciones', label: 'Deformaciones' },
            { key: 'argollas_bordes_afilados', label: 'Bordes afilados' },
            { key: 'argollas_movimiento', label: 'Mov. libre' },
            { key: 'argollas_desgaste', label: 'Desgaste' }
        ]
    },
    {
        title: 'Etiquetas y Marcación',
        categoryKey: 'etiquetas',
        helpText: 'Si la etiqueta no es legible, el arnés debe retirarse de servicio.',
        items: [
            { key: 'etiquetas_legible', label: 'No legible' },
            { key: 'etiquetas_serie', label: 'Serie no visible' },
            { key: 'etiquetas_fabricacion', label: 'Fab. no visible' },
            { key: 'etiquetas_certificaciones', label: 'Certif. no visibles' },
            { key: 'etiquetas_advertencias', label: 'Sin advertencias' }
        ]
    },
    {
        title: 'Evidencia de Caída',
        categoryKey: 'caida',
        helpText: 'Si el arnés detuvo una caída, debe retirarse inmediatamente.',
        items: [
            { key: 'caida_indicador', label: 'Indicador activado' },
            { key: 'caida_danos', label: 'Daños por caída' },
            { key: 'caida_historial', label: 'Historial de caída' }
        ]
    },
    {
        title: 'Estado General',
        categoryKey: 'general',
        items: [
            { key: 'general_limpieza', label: 'Suciedad' },
            { key: 'general_modificaciones', label: 'Modificaciones no autorizadas' },
            { key: 'general_accesorios', label: 'Accesorios improvisados' },
            { key: 'general_almacenamiento', label: 'Mal almacenamiento' },
            { key: 'general_compatibilidad', label: 'Incompatibilidad' }
        ]
    }
];

// ── Tag style helpers ──────────────────────────────────────────────────────────
var _BASE = 'padding:5px 12px; border-radius:20px; border:1.5px solid; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.15s; white-space:nowrap; line-height:1.2; display:inline-flex; align-items:center;';
var STYLE_BUEN_ON  = _BASE + 'background:#22c55e; color:#ffffff; border-color:#22c55e; box-shadow:0 0 0 2px rgba(34,197,94,0.2);';
var STYLE_BUEN_OFF = _BASE + 'background:#f0fdf4; color:#16a34a; border-color:#bbf7d0;';
var STYLE_BAD_ON   = _BASE + 'background:#ef4444; color:#ffffff; border-color:#ef4444; box-shadow:0 0 0 2px rgba(239,68,68,0.2);';
var STYLE_BAD_OFF  = _BASE + 'background:#fef2f2; color:#dc2626; border-color:#fecaca;';
var STYLE_NA_ON    = _BASE + 'background:#6b7280; color:#ffffff; border-color:#6b7280; box-shadow:0 0 0 2px rgba(107,114,128,0.2);';
var STYLE_NA_OFF   = _BASE + 'background:#f3f4f6; color:#4b5563; border-color:#e5e7eb;';

// ── Estado badge helper ────────────────────────────────────────────────────────
var ESTADO_STYLES = {
    'Disponible':        { bg: '#dcfce7', color: '#15803d', border: '#86efac' },
    'En uso':            { bg: '#dbeafe', color: '#1d4ed8', border: '#93c5fd' },
    'En inspeccion':     { bg: '#fef9c3', color: '#a16207', border: '#fde047' },
    'Fuera de servicio': { bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
    'Dado de baja':      { bg: '#f3f4f6', color: '#6b7280', border: '#e5e7eb' }
};

function badgeHtml(text, bg, color, border) {
    return '<span style="background:' + bg + '; color:' + color + '; border:1px solid ' + border + '; padding:4px 14px; border-radius:12px; font-size:13px; font-weight:700; display:inline-block;">' + text + '</span>';
}

// ══════════════════════════════════════════════════════════════════════════════
// RENDER ENTRY
// ══════════════════════════════════════════════════════════════════════════════
export async function renderInspeccionArneses(container) {
    container.innerHTML = `
    <div class="registro-container">
      <div class="registro-header" style="display:flex; flex-direction:column; align-items:stretch; gap:var(--space-4); margin-bottom:var(--space-6); width:100%;">
        <h2>Inspección de Arneses</h2>
        
        <div style="display:flex; align-items:center; width:100%; gap: 12px; flex-wrap: wrap;">
          <div class="search-wrapper" id="table-search-wrapper" style="position:relative; flex:0 1 400px;">
            <input type="text" class="form-input" id="table-search-input" placeholder="Buscar por inspector, código..." style="width:100%; padding-left:40px; background-color:var(--bg-surface); border:1px solid var(--border-default);">
            <i data-lucide="search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted); width:16px; height:16px; pointer-events:none;"></i>
          </div>
          
          <button class="btn btn-primary btn-glow" id="btn-nuevo-registro" style="display:none; flex-shrink:0; white-space:nowrap; align-items:center; gap:6px; margin-left:auto;">
            <i data-lucide="plus" style="width:16px;height:16px;"></i> Nueva Inspección
          </button>
        </div>
      </div>

      <!-- Tabla de Registros -->
      <div id="view-table" class="registros-table-section card active-view">
        <div class="table-header" style="margin-bottom:var(--space-4);">
          <h3 class="card-title"><i data-lucide="list"></i> Historial de Inspecciones</h3>
        </div>
        <div id="table-container"></div>
      </div>

      <!-- Formulario de Registro -->
      <div id="view-form" class="registro-form" style="display: none;">
        <div style="margin-bottom: var(--space-4);">
          <button class="btn-back" id="btn-volver-tabla" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; gap:8px; font-weight:500;">
            <i data-lucide="arrow-left" style="width:18px;height:18px;"></i> Volver a la lista
          </button>
        </div>

        <form id="registro-form">
            <fieldset id="form-fieldset" style="border:none; padding:0; margin:0;">
                
                <div class="card form-section" style="margin-bottom:var(--space-6)">
                    <h3 class="form-section-title">1. Datos de la Inspección</h3>
                    <div class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));">
                        <div class="form-group">
                            <label for="input-lugar_trabajo" class="form-label">Lugar de Trabajo / Ciudad</label>
                            <select class="form-select" id="input-lugar_trabajo" name="lugar_trabajo" required>
                                <option value="" disabled selected>Seleccione...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="input-fecha" class="form-label">Fecha de Inspección</label>
                            <input type="text" class="form-input" id="input-fecha" name="fecha" required readonly placeholder="Seleccione fecha...">
                        </div>
                        <div class="form-group">
                            <label for="input-inspector_nombre" class="form-label">Nombre del Inspector</label>
                            <input type="text" class="form-input" id="input-inspector_nombre" name="inspector_nombre" required>
                        </div>
                        <div class="form-group">
                            <label for="input-inspector_cargo" class="form-label">Cargo del Inspector</label>
                            <input type="text" class="form-input" id="input-inspector_cargo" name="inspector_cargo" required>
                        </div>
                        <div class="form-group" style="grid-column: 1 / -1;">
                            <label for="input-observaciones_generales" class="form-label">Observaciones Generales</label>
                            <textarea class="form-input" id="input-observaciones_generales" name="observaciones_generales" rows="2"></textarea>
                        </div>
                    </div>
                </div>

                <div class="card form-section" style="margin-bottom:var(--space-6); background: transparent; border: none; box-shadow: none; padding: 0;">
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4); padding-bottom:8px; border-bottom:1px solid var(--border-default);">
                        <h3 class="form-section-title" style="margin-bottom:0;">2. Evaluación de Arneses</h3>
                        <button type="button" class="btn btn-secondary" id="btn-add-arnes" style="font-size: var(--text-sm); display: flex; align-items: center; gap: 6px;">
                            <i data-lucide="plus-circle" style="width:16px;height:16px;"></i> Añadir Arnés
                        </button>
                    </div>
                    
                    <div id="arneses-container" style="display:flex; flex-direction:column; gap: var(--space-4);">
                        <!-- Dynamic items will be injected here -->
                    </div>
                    <div id="arneses-empty-state" class="empty-state" style="margin-top:var(--space-4); background:var(--bg-surface); padding:var(--space-6); border-radius:var(--radius-md); text-align:center; border:1px dashed var(--border-default);">
                        <p style="color:var(--text-secondary); margin:0;">No se han añadido arneses a esta inspección.</p>
                    </div>
                </div>

                <div class="form-actions" id="form-actions-container">
                    <button type="button" class="btn btn-secondary" id="btn-limpiar">
                        <i data-lucide="refresh-cw"></i> Limpiar
                    </button>
                    <button type="submit" class="btn btn-primary" id="btn-guardar">
                        <i data-lucide="save"></i> Guardar Inspección
                    </button>
                </div>

            </fieldset>
        </form>
      </div>
    </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    await loadParametricas(container);
    
    const fechaInput = container.querySelector('#input-fecha');
    initDatePicker(fechaInput, null, 'YYYY-MM-DD');

    bindEvents(container);
    await refreshTable(container);
    resetForm(container);

    const viewInspeccionId = localStorage.getItem('view_inspeccion_id');
    if (viewInspeccionId) {
        localStorage.removeItem('view_inspeccion_id');
        setTimeout(async () => {
            await openRecordForEdit(container, viewInspeccionId, true);
        }, 100);
    }
}

// ══════════════════════════════════════════════════════════════════════════════
// PARAMETRICAS
// ══════════════════════════════════════════════════════════════════════════════
async function loadParametricas(container) {
    const [ciudades, inventario] = await Promise.all([
        getParametros('ciudad'),
        getAllInventario()
    ]);

    const selectLugar = container.querySelector('#input-lugar_trabajo');
    if (selectLugar && ciudades.data) {
        selectLugar.innerHTML = '<option value="" disabled selected>Seleccione...</option>' + 
            ciudades.data.map(p => `<option value="${p.valor}">${p.valor}</option>`).join('');
    }

    window._inventarioArneses = inventario.data || [];
}

// ══════════════════════════════════════════════════════════════════════════════
// EVENTS
// ══════════════════════════════════════════════════════════════════════════════
function bindEvents(container) {
    const form = container.querySelector('#registro-form');
    const btnLimpiar = container.querySelector('#btn-limpiar');
    const btnNuevoRegistro = container.querySelector('#btn-nuevo-registro');
    const btnVolverTabla = container.querySelector('#btn-volver-tabla');
    const btnAddArnes = container.querySelector('#btn-add-arnes');
    const viewTable = container.querySelector('#view-table');
    const viewForm = container.querySelector('#view-form');
    const tableSearchInput = container.querySelector('#table-search-input');
    const tableSearchWrapper = container.querySelector('#table-search-wrapper');

    const showForm = () => {
        viewTable.style.display = 'none';
        btnNuevoRegistro.style.display = 'none';
        if (tableSearchWrapper) tableSearchWrapper.style.display = 'none';
        viewForm.style.display = 'block';
    };

    const showTable = () => {
        viewForm.style.display = 'none';
        viewTable.style.display = 'block';
        btnNuevoRegistro.style.display = 'inline-flex';
        if (tableSearchWrapper) tableSearchWrapper.style.display = 'block';
        refreshTable(container);
    };

    container._showForm = showForm;

    if (tableSearchInput) {
        let timeout;
        tableSearchInput.addEventListener('input', () => {
            clearTimeout(timeout);
            timeout = setTimeout(() => refreshTable(container), 300);
        });
    }

    btnNuevoRegistro.addEventListener('click', () => {
        resetForm(container);
        setReadOnly(container, false);
        showForm();
    });

    btnVolverTabla.addEventListener('click', () => showTable());
    btnLimpiar.addEventListener('click', () => resetForm(container));

    btnAddArnes.addEventListener('click', () => addArnesCard(container));

    // Delegation: remove arnes card
    container.querySelector('#arneses-container').addEventListener('click', (e) => {
        const btnRemove = e.target.closest('.btn-remove-arnes');
        if (btnRemove && !container.querySelector('#form-fieldset').disabled) {
            btnRemove.closest('.arnes-card').remove();
            updateArnesesEmptyState(container);
            renumberArneses(container);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const success = await saveRecord(container);
        if (success) {
            showTable();
        }
    });

    showTable();
}

// ══════════════════════════════════════════════════════════════════════════════
// ARNES CARD HTML
// ══════════════════════════════════════════════════════════════════════════════
function getArnesCardHTML(index, data) {
    data = data || {};

    // ── Inventory selector options ──────────────────────────────────────────
    var inventarioOptions = '';
    if (window._inventarioArneses) {
        window._inventarioArneses.forEach(function(arnes) {
            inventarioOptions += '<option value="' + arnes.codigo + '"'
                + (data.codigo_arnes === arnes.codigo ? ' selected' : '') + '>'
                + (arnes.numero_inventario || arnes.codigo) + ' (' + (arnes.tipo_equipo || 'Arnés') + ')'
                + '</option>';
        });
    }
    if (data.codigo_arnes && (!window._inventarioArneses || !window._inventarioArneses.some(function(e) { return e.codigo === data.codigo_arnes; }))) {
        inventarioOptions += '<option value="' + data.codigo_arnes + '" selected>' + data.codigo_arnes + ' (Inactivo/Eliminado)</option>';
    }

    // ── Category sections ───────────────────────────────────────────────────
    var gruposHtml = '';
    CATEGORIAS_EVALUACION.forEach(function(cat) {
        var isNA   = data[cat.categoryKey + '_no_aplica'] === 'true';

        // Help text
        var helpHtml = '';
        if (cat.helpText) {
            helpHtml = '<div style="font-size:11px; color:#d97706; margin-bottom:8px; display:flex; align-items:center; gap:4px;">'
                + '<i data-lucide="alert-triangle" style="width:12px;height:12px;"></i> ' + cat.helpText
                + '</div>';
        }

        // All tags in ONE flat row: Buen Estado · No Aplica · defects
        var buenOn = false;
        if (Object.keys(data).length > 0) {
            buenOn = !isNA && !cat.items.some(function(elem) { return data[elem.key] === 'Mal estado'; });
        }
        var allTagsHtml =
            '<button type="button" class="eval-tag tag-buen-estado' + (buenOn ? ' active' : '') + '" '
            + 'data-category-key="' + cat.categoryKey + '" '
            + 'style="' + (buenOn ? STYLE_BUEN_ON : STYLE_BUEN_OFF) + '">Buen Estado</button>'
            + '<button type="button" class="eval-tag tag-no-aplica' + (isNA ? ' active' : '') + '" '
            + 'data-category-key="' + cat.categoryKey + '" '
            + 'style="' + (isNA ? STYLE_NA_ON : STYLE_NA_OFF) + '">No Aplica</button>';

        cat.items.forEach(function(elem) {
            var isActive = data[elem.key] === 'Mal estado';
            allTagsHtml += '<button type="button" class="eval-tag tag-defect' + (isActive ? ' active' : '') + '" '
                + 'data-field="' + elem.key + '" '
                + 'style="' + (isActive ? STYLE_BAD_ON : STYLE_BAD_OFF) + '">'
                + elem.label + '</button>';
        });

        // Hidden fields
        var hiddenHtml = '';
        cat.items.forEach(function(elem) {
            var isActive = data[elem.key] === 'Mal estado';
            hiddenHtml += '<input type="hidden" data-field="' + elem.key + '" value="' + (isActive ? 'Mal estado' : '') + '">';
        });
        hiddenHtml += '<input type="hidden" data-field="' + cat.categoryKey + '_no_aplica" value="' + (isNA ? 'true' : '') + '">';
        hiddenHtml += '<input type="hidden" data-field="' + cat.categoryKey + '_buen" value="' + (buenOn ? 'true' : '') + '">';

        gruposHtml +=
            '<div class="eval-category" data-cat-key="' + cat.categoryKey + '" '
            + 'style="border-top:1px solid var(--border-light); padding-top:var(--space-4); margin-top:var(--space-4);">'
            + '<div style="margin-bottom:8px;">'
            + '<h5 style="margin:0 0 8px 0; color:var(--text-secondary); font-size:11px; text-transform:uppercase; letter-spacing:0.6px; font-weight:700;">' + cat.title + '</h5>'
            + helpHtml
            + '<div class="eval-tags-row" data-category-key="' + cat.categoryKey + '" '
            + 'style="display:flex; flex-wrap:wrap; gap:8px; align-items:center; min-height:32px;">'
            + allTagsHtml
            + hiddenHtml
            + '</div>'
            + '</div>'
            + '</div>';
    });

    // ── Status strip ────────────────────────────────────────────────────────
    var currentResultado = data.resultado_inspeccion || '';
    var RESULTADO_OPTIONS = [
        { value: 'Aprobado',               label: 'Aprobado' },
        { value: 'Aprobado con observaciones', label: 'Aprobado con observaciones' },
        { value: 'Con Defectos',           label: 'Con Defectos' },
        { value: 'Rechazado',              label: 'Rechazado' },
        { value: 'Fuera de servicio',      label: 'Fuera de servicio' }
    ];
    var resultadoOptions = '<option value="" disabled' + (!currentResultado ? ' selected' : '') + '>Seleccione resultado...</option>'
        + RESULTADO_OPTIONS.map(function(o) {
            return '<option value="' + o.value + '"' + (currentResultado === o.value ? ' selected' : '') + '>' + o.label + '</option>';
        }).join('');

    var statusStripHtml =
        '<div class="arnes-status-strip" style="display:flex; align-items:center; gap:var(--space-4); background:var(--bg-light,#f8fafc); border-top:1.5px solid var(--border-default); border-radius:0 0 calc(var(--radius-md) - 4px) calc(var(--radius-md) - 4px); padding:var(--space-4) var(--space-6); margin-top:var(--space-6); margin-left:calc(-1*var(--space-4)); margin-right:calc(-1*var(--space-4)); margin-bottom:calc(-1*var(--space-4));">'
        + '<div style="flex:1; max-width:320px;">'
        + '<label style="font-size:11px; color:var(--text-secondary); font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin-bottom:6px; display:block;">Resultado de la Inspección</label>'
        + '<select class="form-select arnes-resultado-select" data-field="resultado_inspeccion" style="font-size:13px; font-weight:600; padding:6px 12px;">'
        + resultadoOptions
        + '</select>'
        + '</div>'
        + '</div>';

    return '<div class="arnes-card card" data-index="' + index + '" style="position:relative; border-left:4px solid var(--info,#00b4d8); padding-bottom:0; overflow:hidden;">'
        + '<button type="button" class="btn-remove-arnes" style="position:absolute; top:var(--space-3); right:var(--space-3); background:none; border:none; color:var(--danger); cursor:pointer; padding:4px; border-radius:var(--radius-sm);">'
        + '<i data-lucide="trash-2" style="width:18px;height:18px;"></i></button>'
        + '<h4 class="arnes-title" style="margin-top:0; margin-bottom:var(--space-4); color:var(--text-primary); font-size:var(--text-md);">Arnés #' + (index + 1) + '</h4>'
        + '<div class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:var(--space-3); margin-bottom:var(--space-4);">'
        + '<div class="form-group"><label class="form-label">N° Inventario / Arnés</label>'
        + '<select class="form-select selector-codigo-arnes" data-field="codigo_arnes" required>'
        + '<option value="" disabled ' + (!data.codigo_arnes ? 'selected' : '') + '>Seleccione un arnés...</option>'
        + inventarioOptions
        + '</select></div>'
        + '<div class="form-group"><label class="form-label">Marca</label>'
        + '<input type="text" class="form-input" data-field="marca" value="' + (data.marca || '') + '" disabled style="background-color:#e2e8f0; color:var(--text-secondary); cursor:not-allowed;"></div>'
        + '<div class="form-group"><label class="form-label">Talla</label>'
        + '<input type="text" class="form-input" data-field="talla" value="' + (data.talla || '') + '" disabled style="background-color:#e2e8f0; color:var(--text-secondary); cursor:not-allowed;"></div>'
        + '</div>'
        + gruposHtml
        + statusStripHtml
        + '</div>';
}

// ══════════════════════════════════════════════════════════════════════════════
// ADD ARNES CARD + EVENT BINDING
// ══════════════════════════════════════════════════════════════════════════════
function addArnesCard(container, data) {
    data = data || {};
    var extContainer = container.querySelector('#arneses-container');
    var index = extContainer.children.length;

    extContainer.insertAdjacentHTML('beforeend', getArnesCardHTML(index, data));
    var newCard = extContainer.lastElementChild;

    // 1. Auto-complete from inventory when codigo_arnes selector changes
    var selectorCodigo = newCard.querySelector('.selector-codigo-arnes');
    if (selectorCodigo) {
        selectorCodigo.addEventListener('change', function() {
            var arnes = window._inventarioArneses && window._inventarioArneses.find(function(e) { return e.codigo === selectorCodigo.value; });
            var fieldMarca = newCard.querySelector('[data-field="marca"]');
            var fieldTalla = newCard.querySelector('[data-field="talla"]');
            if (arnes) {
                if (fieldMarca) fieldMarca.value = arnes.marca || '';
                if (fieldTalla) fieldTalla.value = arnes.talla || '';
            } else {
                if (fieldMarca) fieldMarca.value = '';
                if (fieldTalla) fieldTalla.value = '';
            }
        });
    }

    // 2. Free-toggle logic for all tags in each category (no blocking)
    newCard.querySelectorAll('.eval-category').forEach(function(categoryEl) {
        var catKey = categoryEl.dataset.catKey;
        var tagsRow = categoryEl.querySelector('.eval-tags-row[data-category-key="' + catKey + '"]');
        if (!tagsRow) return;

        // Helper to get hidden field inside tagsRow
        function getHidden(fieldName) {
            return tagsRow.querySelector('input[data-field="' + fieldName + '"]');
        }

        // All clickable tags inside this category
        tagsRow.querySelectorAll('.eval-tag').forEach(function(tagBtn) {
            tagBtn.addEventListener('click', function() {
                var fieldset = container.querySelector('#form-fieldset');
                if (fieldset && fieldset.disabled) return;

                var isBuen = tagBtn.classList.contains('tag-buen-estado');
                var isNA   = tagBtn.classList.contains('tag-no-aplica');
                var isDefect = tagBtn.classList.contains('tag-defect');

                if (isBuen) {
                    var nowActive = !tagBtn.classList.contains('active');
                    tagBtn.classList.toggle('active', nowActive);
                    tagBtn.style.cssText = nowActive ? STYLE_BUEN_ON : STYLE_BUEN_OFF;
                    var buenH = getHidden(catKey + '_buen');
                    if (buenH) buenH.value = nowActive ? 'true' : '';

                    if (nowActive) {
                        // Deselect "No Aplica"
                        var naBtn = tagsRow.querySelector('.tag-no-aplica');
                        if (naBtn && naBtn.classList.contains('active')) {
                            naBtn.classList.remove('active');
                            naBtn.style.cssText = STYLE_NA_OFF;
                            var naH = getHidden(catKey + '_no_aplica');
                            if (naH) naH.value = '';
                        }
                        // Deselect all defects
                        tagsRow.querySelectorAll('.tag-defect').forEach(function(defBtn) {
                            if (defBtn.classList.contains('active')) {
                                defBtn.classList.remove('active');
                                defBtn.style.cssText = STYLE_BAD_OFF;
                                var defH = getHidden(defBtn.dataset.field);
                                if (defH) defH.value = '';
                            }
                        });
                    }
                } else if (isNA) {
                    var nowActive = !tagBtn.classList.contains('active');
                    tagBtn.classList.toggle('active', nowActive);
                    tagBtn.style.cssText = nowActive ? STYLE_NA_ON : STYLE_NA_OFF;
                    var naH = getHidden(catKey + '_no_aplica');
                    if (naH) naH.value = nowActive ? 'true' : '';

                    if (nowActive) {
                        // Deselect "Buen Estado"
                        var buenBtn = tagsRow.querySelector('.tag-buen-estado');
                        if (buenBtn && buenBtn.classList.contains('active')) {
                            buenBtn.classList.remove('active');
                            buenBtn.style.cssText = STYLE_BUEN_OFF;
                            var buenH = getHidden(catKey + '_buen');
                            if (buenH) buenH.value = '';
                        }
                        // Deselect all defects
                        tagsRow.querySelectorAll('.tag-defect').forEach(function(defBtn) {
                            if (defBtn.classList.contains('active')) {
                                defBtn.classList.remove('active');
                                defBtn.style.cssText = STYLE_BAD_OFF;
                                var defH = getHidden(defBtn.dataset.field);
                                if (defH) defH.value = '';
                            }
                        });
                    }
                } else if (isDefect) {
                    var nowActive = !tagBtn.classList.contains('active');
                    tagBtn.classList.toggle('active', nowActive);
                    tagBtn.style.cssText = nowActive ? STYLE_BAD_ON : STYLE_BAD_OFF;
                    var defH = getHidden(tagBtn.dataset.field);
                    if (defH) defH.value = nowActive ? 'Mal estado' : '';

                    if (nowActive) {
                        // Deselect "Buen Estado"
                        var buenBtn = tagsRow.querySelector('.tag-buen-estado');
                        if (buenBtn && buenBtn.classList.contains('active')) {
                            buenBtn.classList.remove('active');
                            buenBtn.style.cssText = STYLE_BUEN_OFF;
                            var buenH = getHidden(catKey + '_buen');
                            if (buenH) buenH.value = '';
                        }
                        // Deselect "No Aplica"
                        var naBtn = tagsRow.querySelector('.tag-no-aplica');
                        if (naBtn && naBtn.classList.contains('active')) {
                            naBtn.classList.remove('active');
                            naBtn.style.cssText = STYLE_NA_OFF;
                            var naH = getHidden(catKey + '_no_aplica');
                            if (naH) naH.value = '';
                        }
                    }
                }
            });
        });
    });

    if (window.lucide) window.lucide.createIcons({ nodes: [newCard] });
    updateArnesesEmptyState(container);
}

// ── (status strip is now a select - no dynamic badge update needed) ────────────

// ══════════════════════════════════════════════════════════════════════════════
// UTILITIES
// ══════════════════════════════════════════════════════════════════════════════
function renumberArneses(container) {
    var cards = container.querySelectorAll('.arnes-card');
    cards.forEach(function(card, i) {
        card.dataset.index = i;
        var title = card.querySelector('.arnes-title');
        if (title) title.innerText = 'Arnés #' + (i + 1);
    });
}

function updateArnesesEmptyState(container) {
    const extContainer = container.querySelector('#arneses-container');
    const emptyState = container.querySelector('#arneses-empty-state');
    emptyState.style.display = extContainer.children.length === 0 ? 'block' : 'none';
}

function resetForm(container) {
    currentRecordId = null;
    const form = container.querySelector('#registro-form');
    form.reset();
    container.querySelector('#input-fecha').value = new Date().toISOString().slice(0, 10);
    container.querySelector('#arneses-container').innerHTML = '';
    updateArnesesEmptyState(container);
    container.querySelector('#btn-guardar').innerHTML = '<i data-lucide="save"></i> Guardar Inspección';
    if (window.lucide) window.lucide.createIcons();
}

function getFormData(container) {
    const cabecera = {
        lugar_trabajo: container.querySelector('#input-lugar_trabajo').value,
        fecha: container.querySelector('#input-fecha').value,
        inspector_nombre: container.querySelector('#input-inspector_nombre').value,
        inspector_cargo: container.querySelector('#input-inspector_cargo').value,
        observaciones_generales: container.querySelector('#input-observaciones_generales').value || null
    };

    const detalles = [];
    container.querySelectorAll('.arnes-card').forEach(card => {
        const item = {};
        // Capture hidden inputs for field values
        card.querySelectorAll('input[data-field]').forEach(el => {
            if (['marca', 'talla'].includes(el.dataset.field)) return;
            if (el.dataset.field.endsWith('_buen')) return;
            item[el.dataset.field] = el.value || null;
        });
        // Capture select inputs (resultado_inspeccion and codigo_arnes)
        card.querySelectorAll('select[data-field]').forEach(el => {
            if (['marca', 'talla'].includes(el.dataset.field)) return;
            item[el.dataset.field] = el.value || null;
        });
        detalles.push(item);
    });

    return { cabecera, detalles };
}

async function saveRecord(container) {
    const btn = container.querySelector('#btn-guardar');
    const originalHtml = btn.innerHTML;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></div> Guardando...';
    btn.disabled = true;

    try {
        const { cabecera, detalles } = getFormData(container);
        
        let res;
        if (currentRecordId) {
            res = await updateInspeccion(currentRecordId, cabecera, detalles);
        } else {
            res = await createInspeccion(cabecera, detalles);
        }

        if (res.error) throw res.error;
        showToast(currentRecordId ? 'Inspección actualizada' : 'Inspección guardada', 'success');
        resetForm(container);
        await refreshTable(container, true);
        return true;
    } catch (err) {
        showToast(err.message || 'Error al guardar', 'error');
        return false;
    } finally {
        btn.innerHTML = originalHtml;
        btn.disabled = false;
        if (window.lucide) window.lucide.createIcons();
    }
}

function setReadOnly(container, readonly) {
    const fieldset = container.querySelector('#form-fieldset');
    fieldset.disabled = readonly;
    const actions = container.querySelector('#form-actions-container');
    actions.style.display = readonly ? 'none' : 'flex';
    const btnAdd = container.querySelector('#btn-add-arnes');
    if (btnAdd) btnAdd.style.display = readonly ? 'none' : 'flex';
    
    container.querySelectorAll('.btn-remove-arnes').forEach(btn => {
        btn.style.display = readonly ? 'none' : 'block';
    });
}

function renderDetallesForView(container, data) {
    const extContainer = container.querySelector('#arneses-container');
    extContainer.innerHTML = '';
    
    if (data.arneses_detalle && data.arneses_detalle.length > 0) {
        data.arneses_detalle.forEach((det, index) => {
            const inv = window._inventarioArneses?.find(e => e.codigo === det.codigo_arnes);
            if (inv) {
                det.marca = inv.marca;
                det.talla = inv.talla;
            }
            addArnesCard(container, det);
        });
    }
    
    updateArnesesEmptyState(container);
}

// ══════════════════════════════════════════════════════════════════════════════
// REFRESH TABLE
// ══════════════════════════════════════════════════════════════════════════════
async function refreshTable(container, force = false) {
    const tableContainer = container.querySelector('#table-container');
    const searchInput = container.querySelector('#table-search-input');
    
    tableContainer.innerHTML = '<div style="text-align:center; padding:var(--space-8); color:var(--text-secondary);"><div class="spinner"></div> Cargando inspecciones...</div>';
    
    const { data, error } = await getAllInspecciones();
    if (error) {
        tableContainer.innerHTML = '<div style="text-align:center; padding:var(--space-8); color:var(--danger);">Error al cargar los datos.</div>';
        return;
    }

    let filteredData = data || [];
    
    if (searchInput && searchInput.value.trim() !== '') {
        const term = searchInput.value.trim().toLowerCase();
        filteredData = filteredData.filter(item => {
            const firstDet = item.arneses_detalle && item.arneses_detalle[0];
            return (item.lugar_trabajo && item.lugar_trabajo.toLowerCase().includes(term)) ||
                   (item.inspector_nombre && item.inspector_nombre.toLowerCase().includes(term)) ||
                   (firstDet && firstDet.codigo_arnes && firstDet.codigo_arnes.toLowerCase().includes(term));
        });
    }

    if (filteredData.length === 0) {
        tableContainer.innerHTML = '<div class="empty-state" style="padding:var(--space-8); text-align:center; color:var(--text-secondary); border: 1px dashed var(--border-default); border-radius:var(--radius-md);">No se encontraron inspecciones.</div>';
        return;
    }

    // Pre-process rows with computed fields
    const inv = window._inventarioArneses || [];
    const processedData = filteredData.map(item => {
        const firstDet = item.arneses_detalle && item.arneses_detalle[0];
        const invArnes = firstDet && inv.find(e => e.codigo === firstDet.codigo_arnes);

        // Calculate resumen across all arneses in the inspection
        let buen = 0, mal = 0, na = 0;
        (item.arneses_detalle || []).forEach(det => {
            CATEGORIAS_EVALUACION.forEach(cat => {
                if (det[cat.categoryKey + '_no_aplica'] === 'true') na++;
                else if (cat.items.some(i => det[i.key] === 'Mal estado')) mal++;
                else buen++;
            });
        });

        return {
            ...item,
            _codigo: firstDet ? (firstDet.codigo_arnes || '—') : null,
            _tipo_arnes: invArnes ? (invArnes.tipo_equipo || null) : null,
            _buen: buen,
            _mal: mal,
            _na: na,
            _total_cats: buen + mal + na
        };
    });

    const columns = [
        { 
            key: 'fecha', 
            label: 'Fecha', 
            sortable: true,
            format: (val) => val
                ? new Date(val + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
                : 'N/A'
        },
        { 
            key: 'inspector_nombre', 
            label: 'Inspector', 
            sortable: true 
        },
        { 
            key: '_codigo', 
            label: 'Código',
            format: (val) => val
                ? '<span style="font-family:monospace; font-weight:600; font-size:12px;">' + val + '</span>'
                : '<span style="color:var(--text-muted)">—</span>'
        },
        { 
            key: '_tipo_arnes', 
            label: 'Tipo Arnés',
            format: (val) => val
                ? val
                : '<span style="color:var(--text-muted)">—</span>'
        },
        { 
            key: '_total_cats',
            label: 'Resumen',
            format: (total, row) => {
                if (total === 0) return '<span style="color:var(--text-muted); font-size:12px;">Sin datos</span>';
                var parts = [];
                if (row._buen > 0)
                    parts.push('<span style="background:#dcfce7; color:#15803d; border:1px solid #86efac; border-radius:12px; padding:2px 8px; font-size:11px; font-weight:700; white-space:nowrap; display:inline-block;">✓ ' + row._buen + ' Bien</span>');
                if (row._mal > 0)
                    parts.push('<span style="background:#fee2e2; color:#b91c1c; border:1px solid #fca5a5; border-radius:12px; padding:2px 8px; font-size:11px; font-weight:700; white-space:nowrap; display:inline-block;">✗ ' + row._mal + ' Defecto</span>');
                if (row._na > 0)
                    parts.push('<span style="background:#e5e7eb; color:#374151; border:1px solid #9ca3af; border-radius:12px; padding:2px 8px; font-size:11px; font-weight:700; white-space:nowrap; display:inline-block;">— ' + row._na + ' N/A</span>');
                return '<div style="display:flex; gap:5px; align-items:center; flex-wrap:wrap;">' + parts.join('') + '</div>';
            }
        }
    ];

    dataTableInstance = createDataTable({
        containerId: 'table-container',
        columns: columns,
        data: processedData,
        pageSize: 10,
        onView: async (record) => {
            await openRecordForEdit(container, record.id, true);
        },
        onEdit: async (record) => {
            await openRecordForEdit(container, record.id, false);
        },
        onDelete: async (record) => {
            const confirmed = await showConfirmModal('Eliminar Inspección', '¿Estás seguro de que deseas eliminar este registro?');
            if (confirmed) {
                const res = await deleteInspeccion(record.id);
                if (res.error) {
                    showToast('Error al eliminar', 'error');
                } else {
                    showToast('Inspección eliminada', 'success');
                    await refreshTable(container, true);
                }
            }
        }
    });
}

async function openRecordForEdit(container, id, isReadOnly) {
    const res = await getInspeccionById(id);
    if (res.error || !res.data) {
        showToast('Error al cargar la inspección', 'error');
        return;
    }
    const record = res.data;
    currentRecordId = record.id;
    container.querySelector('#input-lugar_trabajo').value = record.lugar_trabajo || '';
    container.querySelector('#input-fecha').value = record.fecha || '';
    container.querySelector('#input-inspector_nombre').value = record.inspector_nombre || '';
    container.querySelector('#input-inspector_cargo').value = record.inspector_cargo || '';
    container.querySelector('#input-observaciones_generales').value = record.observaciones_generales || '';
    renderDetallesForView(container, record);
    setReadOnly(container, isReadOnly);
    container._showForm();
}
