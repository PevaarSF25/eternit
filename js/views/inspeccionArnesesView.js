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
            { key: 'cintas_abrasion', label: 'Abrasión/Desgaste excesivo' },
            { key: 'cintas_costuras_sueltas', label: 'Costuras sueltas' },
            { key: 'cintas_costuras_rotas', label: 'Costuras rotas' },
            { key: 'cintas_dano_quimico', label: 'Daño por productos químicos' },
            { key: 'cintas_endurecimiento', label: 'Endurecimiento de fibras' },
            { key: 'cintas_decoloracion_uv', label: 'Decoloración por rayos UV' },
            { key: 'cintas_contaminantes', label: 'Presencia de pintura, grasa o contaminantes' }
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
            { key: 'argollas_movimiento', label: 'Movimiento libre' },
            { key: 'argollas_desgaste', label: 'Desgaste' }
        ]
    },
    {
        title: 'Etiquetas y Marcación',
        categoryKey: 'etiquetas',
        helpText: 'Si la etiqueta no es legible, generalmente el arnés debe retirarse de servicio.',
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

// Shared tag styles
var STYLE_TAG_BASE = 'padding:5px 13px; border-radius:20px; border:1.5px solid; cursor:pointer; font-size:12px; font-weight:500; transition:all 0.15s; white-space:nowrap; line-height:1.4;';
var STYLE_TAG_GOOD_ON  = STYLE_TAG_BASE + 'background:#dcfce7; color:#15803d; border-color:#86efac;';
var STYLE_TAG_GOOD_OFF = STYLE_TAG_BASE + 'background:#f9fafb; color:#9ca3af; border-color:#e5e7eb;';
var STYLE_TAG_BAD_ON   = STYLE_TAG_BASE + 'background:#fee2e2; color:#b91c1c; border-color:#fca5a5; font-weight:600;';
var STYLE_TAG_BAD_OFF  = STYLE_TAG_BASE + 'background:#f9fafb; color:#9ca3af; border-color:#e5e7eb;';

export async function renderInspeccionArneses(container) {
    container.innerHTML = `
    <div class="registro-container">
      <div class="registro-header" style="display:flex; flex-direction:column; align-items:stretch; gap:var(--space-4); margin-bottom:var(--space-6); width:100%;">
        <h2>Inspección de Arneses</h2>
        
        <div style="display:flex; align-items:center; width:100%; gap: 12px; flex-wrap: wrap;">
          <div class="search-wrapper" id="table-search-wrapper" style="position:relative; flex:0 1 400px;">
            <input type="text" class="form-input" id="table-search-input" placeholder="Buscar inspecciones..." style="width:100%; padding-left:40px; background-color:var(--bg-surface); border:1px solid var(--border-default);">
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
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--space-4);">
                        <h3 class="form-section-title" style="margin-bottom:0;">2. Evaluación de Arneses</h3>
                        <button type="button" class="btn btn-secondary" id="btn-add-arnes" style="font-size: var(--text-sm);">
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
    
    // Initialize custom date picker
    const fechaInput = container.querySelector('#input-fecha');
    initDatePicker(fechaInput, null, 'YYYY-MM-DD');

    bindEvents(container);
    await refreshTable(container);
    resetForm(container);
}

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

    // Guardar para uso en renderizado dinámico
    window._inventarioArneses = inventario.data || [];
}

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
            timeout = setTimeout(() => {
                refreshTable(container);
            }, 300);
        });
    }

    btnNuevoRegistro.addEventListener('click', () => {
        resetForm(container);
        setReadOnly(container, false);
        showForm();
    });

    btnVolverTabla.addEventListener('click', () => {
        showTable();
    });

    btnLimpiar.addEventListener('click', () => {
        resetForm(container);
    });

    btnAddArnes.addEventListener('click', () => {
        addArnesCard(container);
    });

    // Delegación para eliminar arneses
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
        await saveRecord(container);
        showTable();
    });

    showTable();
}

function getArnesCardHTML(index, data) {
    data = data || {};
    var gruposHtml = '';

    CATEGORIAS_EVALUACION.forEach(function(cat) {
        // Check if any defect in this category is marked
        var anyDefect = cat.items.some(function(elem) { return data[elem.key] === 'Mal estado'; });
        var buenOn = !anyDefect;

        var helpHtml = '';
        if (cat.helpText) {
            helpHtml = '<div style="font-size:11px; color:#d97706; margin-bottom:8px; display:flex; align-items:center; gap:4px;">'
                + '<i data-lucide="alert-triangle" style="width:12px;height:12px;"></i> '
                + cat.helpText
                + '</div>';
        }

        var tagsHtml = '<button type="button" class="eval-tag tag-buen-estado' + (buenOn ? ' active' : '') + '" '
            + 'data-category-key="' + cat.categoryKey + '" '
            + 'style="' + (buenOn ? STYLE_TAG_GOOD_ON : STYLE_TAG_GOOD_OFF) + '">'
            + 'Buen estado'
            + '</button>';

        cat.items.forEach(function(elem) {
            var isActive = data[elem.key] === 'Mal estado';
            tagsHtml += '<button type="button" class="eval-tag tag-defect' + (isActive ? ' active' : '') + '" '
                + 'data-field="' + elem.key + '" '
                + 'style="' + (isActive ? STYLE_TAG_BAD_ON : STYLE_TAG_BAD_OFF) + '">'
                + elem.label
                + '</button>';
            tagsHtml += '<input type="hidden" data-field="' + elem.key + '" value="' + (isActive ? 'Mal estado' : '') + '">';
        });

        gruposHtml += '<div style="border-top:1px solid var(--border-light); padding-top:var(--space-3); margin-top:var(--space-3);">'
            + '<h5 style="margin:0 0 8px 0; color:var(--text-secondary); font-size:11px; text-transform:uppercase; letter-spacing:0.6px; font-weight:600;">' + cat.title + '</h5>'
            + helpHtml
            + '<div class="eval-tags-container" data-category-key="' + cat.categoryKey + '" '
            + 'style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">'
            + tagsHtml
            + '</div>'
            + '</div>';
    });

    var inventarioOptions = '';
    if (window._inventarioArneses) {
        window._inventarioArneses.forEach(function(ext) {
            inventarioOptions += '<option value="' + ext.codigo + '"'
                + (data.codigo_arnes === ext.codigo ? ' selected' : '') + '>'
                + (ext.numero_inventario || ext.codigo) + ' (' + (ext.tipo_equipo || 'Arnés') + ')'
                + '</option>';
        });
    }
    if (data.codigo_arnes && (!window._inventarioArneses || !window._inventarioArneses.some(function(e) { return e.codigo === data.codigo_arnes; }))) {
        inventarioOptions += '<option value="' + data.codigo_arnes + '" selected>' + data.codigo_arnes + ' (Inactivo/Eliminado)</option>';
    }

    return '<div class="arnes-card card" data-index="' + index + '" style="position:relative; border-left:4px solid var(--info); padding-bottom:var(--space-4);">'
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
        + '</div>';
}

function addArnesCard(container, data) {
    data = data || {};
    var extContainer = container.querySelector('#arneses-container');
    var index = extContainer.children.length;

    extContainer.insertAdjacentHTML('beforeend', getArnesCardHTML(index, data));
    var newCard = extContainer.lastElementChild;

    // 1. Auto-complete from inventory
    var selectorCodigo = newCard.querySelector('.selector-codigo-arnes');
    if (selectorCodigo) {
        selectorCodigo.addEventListener('change', function() {
            var arnes = window._inventarioArneses && window._inventarioArneses.find(function(e) { return e.codigo === selectorCodigo.value; });
            var fieldMarca = newCard.querySelector('[data-field="marca"]');
            var fieldTalla = newCard.querySelector('[data-field="talla"]');
            if (arnes) {
                if (fieldMarca) { fieldMarca.value = arnes.marca || ''; }
                if (fieldTalla) { fieldTalla.value = arnes.talla || ''; }
            } else {
                if (fieldMarca) fieldMarca.value = '';
                if (fieldTalla) fieldTalla.value = '';
            }
        });
    }

    // 2. Tag click logic per category
    newCard.querySelectorAll('.eval-tags-container').forEach(function(tagsContainer) {
        var catKey = tagsContainer.dataset.categoryKey;
        var buenBtn = tagsContainer.querySelector('.tag-buen-estado');

        // Click "Buen estado" → clear all defects in this category
        if (buenBtn) {
            buenBtn.addEventListener('click', function() {
                var fieldset = container.querySelector('#form-fieldset');
                if (fieldset && fieldset.disabled) return;

                buenBtn.classList.add('active');
                buenBtn.style.cssText = STYLE_TAG_GOOD_ON;

                tagsContainer.querySelectorAll('.tag-defect').forEach(function(defBtn) {
                    defBtn.classList.remove('active');
                    defBtn.style.cssText = STYLE_TAG_BAD_OFF;
                    var hidden = tagsContainer.querySelector('input[data-field="' + defBtn.dataset.field + '"]');
                    if (hidden) hidden.value = '';
                });
            });
        }

        // Click a defect tag → toggle it, deactivate "Buen estado"
        tagsContainer.querySelectorAll('.tag-defect').forEach(function(defBtn) {
            defBtn.addEventListener('click', function() {
                var fieldset = container.querySelector('#form-fieldset');
                if (fieldset && fieldset.disabled) return;

                var nowActive = !defBtn.classList.contains('active');
                defBtn.classList.toggle('active', nowActive);
                defBtn.style.cssText = nowActive ? STYLE_TAG_BAD_ON : STYLE_TAG_BAD_OFF;

                var hidden = tagsContainer.querySelector('input[data-field="' + defBtn.dataset.field + '"]');
                if (hidden) hidden.value = nowActive ? 'Mal estado' : '';

                // Check if any defect is now active
                var anyActive = Array.from(tagsContainer.querySelectorAll('.tag-defect')).some(function(d) {
                    return d.classList.contains('active');
                });

                // Toggle "Buen estado" accordingly
                if (buenBtn) {
                    buenBtn.classList.toggle('active', !anyActive);
                    buenBtn.style.cssText = !anyActive ? STYLE_TAG_GOOD_ON : STYLE_TAG_GOOD_OFF;
                }
            });
        });
    });

    if (window.lucide) window.lucide.createIcons({ nodes: [newCard] });
    updateArnesesEmptyState(container);
}


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
    if (extContainer.children.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
    }
}

function resetForm(container) {
    currentRecordId = null;
    const form = container.querySelector('#registro-form');
    form.reset();
    
    // Default date
    container.querySelector('#input-fecha').value = new Date().toISOString().slice(0, 10);
    
    // Clear arneses
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
    const cards = container.querySelectorAll('.arnes-card');
    cards.forEach(card => {
        const item = {};
        // Find inputs and selects (we only want those with data-field)
        card.querySelectorAll('input[data-field], select[data-field]').forEach(el => {
            // we don't save readonly display fields like marca, talla to the DB detail
            // we just save the ones that are actual db columns for arneses_detalle
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
        
    } catch (err) {
        showToast(err.message || 'Error al guardar', 'error');
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
    if (btnAdd) btnAdd.style.display = readonly ? 'none' : 'inline-block';
    
    // Hide remove buttons if readonly
    container.querySelectorAll('.btn-remove-arnes').forEach(btn => {
        btn.style.display = readonly ? 'none' : 'block';
    });
}

function renderDetallesForView(container, data) {
    const extContainer = container.querySelector('#arneses-container');
    extContainer.innerHTML = '';
    
    if (data.arneses_detalle && data.arneses_detalle.length > 0) {
        data.arneses_detalle.forEach((det, index) => {
            // Find in inventory to get extra info
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
        filteredData = data.filter(item => {
            return (item.lugar_trabajo && item.lugar_trabajo.toLowerCase().includes(term)) ||
                   (item.inspector_nombre && item.inspector_nombre.toLowerCase().includes(term));
        });
    }

    if (filteredData.length === 0) {
        tableContainer.innerHTML = '<div class="empty-state" style="padding:var(--space-8); text-align:center; color:var(--text-secondary); border: 1px dashed var(--border-default); border-radius:var(--radius-md);">No se encontraron inspecciones.</div>';
        return;
    }

    const columns = [
        { 
            key: 'fecha', 
            label: 'Fecha', 
            sortable: true,
            format: (val) => val ? new Date(val).toLocaleDateString() : 'N/A'
        },
        { key: 'lugar_trabajo', label: 'Lugar', sortable: true },
        { key: 'inspector_nombre', label: 'Inspector', sortable: true },
        { 
            key: 'total_arneses', 
            label: 'Arneses Insp.', 
            sortable: true,
            format: (val) => `<span class="badge badge-primary">${val || 0}</span>`
        }
    ];

    dataTableInstance = createDataTable({
        containerId: 'table-container',
        columns: columns,
        data: filteredData,
        pageSize: 10,
        onView: async (record) => {
            currentRecordId = record.id;
            container.querySelector('#input-lugar_trabajo').value = record.lugar_trabajo;
            container.querySelector('#input-fecha').value = record.fecha;
            container.querySelector('#input-inspector_nombre').value = record.inspector_nombre;
            container.querySelector('#input-inspector_cargo').value = record.inspector_cargo;
            container.querySelector('#input-observaciones_generales').value = record.observaciones_generales || '';
            
            renderDetallesForView(container, record);
            setReadOnly(container, true);
            container._showForm();
        },
        onEdit: async (record) => {
            currentRecordId = record.id;
            container.querySelector('#input-lugar_trabajo').value = record.lugar_trabajo;
            container.querySelector('#input-fecha').value = record.fecha;
            container.querySelector('#input-inspector_nombre').value = record.inspector_nombre;
            container.querySelector('#input-inspector_cargo').value = record.inspector_cargo;
            container.querySelector('#input-observaciones_generales').value = record.observaciones_generales || '';
            
            renderDetallesForView(container, record);
            setReadOnly(container, false);
            container._showForm();
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
