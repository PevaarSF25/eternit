import { showToast } from '../components/toast.js';
import { showModal, showConfirmModal } from '../components/modal.js';
import { createDataTable } from '../components/dataTable.js';
import { getParametros } from '../services/parametricaService.js';
import { initDatePicker } from '../components/datePicker.js';
import { 
  getAllInspecciones, 
  getInspeccionById, 
  createInspeccion, 
  updateInspeccion, 
  deleteInspeccion 
} from '../services/inspeccionExtintoresService.js';
import { getAllInventario } from '../services/inventarioExtintoresService.js';

let currentRecordId = null;
let dataTableInstance = null;
let cachedInspecciones = null;

const ELEMENTOS_ESTADOS = ['Buen estado', 'Mal estado', 'No aplica'];

const ELEMENTOS_LISTA = [
    { key: 'estado_acceso', label: 'Acceso' },
    { key: 'estado_senalizacion', label: 'Señalización' },
    { key: 'estado_pared_altura', label: 'Pared/Altura' },
    { key: 'estado_piso_base', label: 'Piso (Base)' },
    { key: 'estado_limpieza', label: 'Limpieza' },
    { key: 'estado_rotulo', label: 'Rótulo' },
    { key: 'estado_cilindro', label: 'Cilindro' },
    { key: 'estado_manometro', label: 'Manómetro' },
    { key: 'estado_boquilla', label: 'Boquilla' },
    { key: 'estado_presion', label: 'Presión' },
    { key: 'estado_pin_seguridad', label: 'Pin de seguridad' },
    { key: 'estado_manguera', label: 'Manguera' },
    { key: 'estado_corneta', label: 'Corneta' },
    { key: 'estado_pintura', label: 'Pintura' },
    { key: 'estado_manija_transporte', label: 'Manija de transporte' },
    { key: 'estado_sello_garantia', label: 'Sello de garantía' }
];

export async function renderInspeccionExtintores(container) {
    container.innerHTML = `
    <div class="registro-container">
      <div class="registro-header" style="display:flex; flex-direction:column; align-items:stretch; gap:var(--space-4); margin-bottom:var(--space-6); width:100%;">
        <h2>Inspección Extintores</h2>
        
        <div style="display:flex; align-items:center; width:100%; gap: 12px; flex-wrap: wrap;">
          <div class="search-wrapper" id="table-search-wrapper" style="position:relative; flex:0 1 400px;">
            <input type="text" class="form-input" id="table-search-input" placeholder="Buscar por lugar, inspector, fecha..." style="width:100%; padding-left:40px; background-color:var(--bg-surface); border:1px solid var(--border-default);">
            <i data-lucide="search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted); width:16px; height:16px; pointer-events:none;"></i>
          </div>
          
          <button class="btn btn-primary btn-glow" id="btn-nuevo-registro" style="display:none; flex-shrink:0; white-space:nowrap; align-items:center; gap:6px; margin-left:auto;">
            <i data-lucide="plus" style="width:16px;height:16px;"></i> Crear nueva inspección
          </button>
        </div>
      </div>

      <!-- Tabla de Registros -->
      <div id="view-table" class="registros-table-section card active-view">
        <div class="table-header" style="margin-bottom:var(--space-4);">
          <h3 class="card-title"><i data-lucide="list"></i> Inspecciones Guardadas</h3>
        </div>
        <div id="table-container"></div>
      </div>

      <!-- Formulario de Registro -->
      <div id="view-form" class="registro-form" style="display: none;">
        <div style="margin-bottom: var(--space-4);">
          <button class="btn-back" id="btn-volver-tabla" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; gap:8px; font-weight:500;">
            <i data-lucide="arrow-left" style="width:18px;height:18px;"></i> Volver a la tabla
          </button>
        </div>

        <form id="registro-form">
            <fieldset id="form-fieldset" style="border:none; padding:0; margin:0;">
                
                <div class="card form-section" style="margin-bottom:var(--space-6)">
                    <h3 class="form-section-title">1. Datos Generales</h3>
                    <div class="form-grid">
                        <div class="form-group">
                            <label for="input-lugar_trabajo" class="form-label">Lugar de trabajo</label>
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
                        <h3 class="form-section-title" style="margin-bottom:0;">2. Detalle de Extintores</h3>
                        <button type="button" class="btn btn-secondary" id="btn-add-extintor" style="font-size: var(--text-sm);">
                            <i data-lucide="plus-circle" style="width:16px;height:16px;"></i> Añadir Extintor
                        </button>
                    </div>
                    
                    <div id="extintores-container" style="display:flex; flex-direction:column; gap: var(--space-4);">
                        <!-- Dynamic items will be injected here -->
                    </div>
                    <div id="extintores-empty-state" class="empty-state" style="margin-top:var(--space-4); background:var(--bg-surface); padding:var(--space-6); border-radius:var(--radius-md); text-align:center; border:1px dashed var(--border-default);">
                        <p style="color:var(--text-secondary); margin:0;">No se han añadido extintores a esta inspección.</p>
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
    const [ciudades, codigos, ubicaciones, inventario] = await Promise.all([
        getParametros('ciudad'),
        getParametros('extintor_codigo'),
        getParametros('extintor_ubicacion'),
        getAllInventario()
    ]);

    const selectLugar = container.querySelector('#input-lugar_trabajo');
    if (selectLugar && ciudades.data) {
        selectLugar.innerHTML = '<option value="" disabled selected>Seleccione...</option>' + 
            ciudades.data.map(p => `<option value="${p.valor}">${p.valor}</option>`).join('');
    }

    // Guardar para uso en renderizado dinámico
    window._paramExtintorCodigos = codigos.data || [];
    window._paramExtintorUbicaciones = ubicaciones.data || [];
    window._inventarioExtintores = inventario.data || [];
}

function bindEvents(container) {
    const form = container.querySelector('#registro-form');
    const btnLimpiar = container.querySelector('#btn-limpiar');
    const btnNuevoRegistro = container.querySelector('#btn-nuevo-registro');
    const btnVolverTabla = container.querySelector('#btn-volver-tabla');
    const btnAddExtintor = container.querySelector('#btn-add-extintor');
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

    btnAddExtintor.addEventListener('click', () => {
        addExtintorCard(container);
    });

    // Delegación para eliminar extintores
    container.querySelector('#extintores-container').addEventListener('click', (e) => {
        const btnRemove = e.target.closest('.btn-remove-extintor');
        if (btnRemove && !container.querySelector('#form-fieldset').disabled) {
            btnRemove.closest('.extintor-card').remove();
            updateExtintoresEmptyState(container);
            renumberExtintores(container);
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveRecord(container);
        showTable();
    });

    showTable();
}

function getExtintorCardHTML(index, data = {}) {
    const elementosHtml = ELEMENTOS_LISTA.map(elem => {
        const selectedValue = data[elem.key] || '';
        
        // Define button styles based on selected state
        const isB = selectedValue === 'Buen estado';
        const isM = selectedValue === 'Mal estado';
        const isN = selectedValue === 'No aplica';

        const styleB = isB 
            ? 'background-color: #15803d; color: #ffffff; border-color: #15803d; opacity: 1;' 
            : 'background-color: #f0fdf4; color: #16a34a; border-color: #bbf7d0; opacity: 0.6;';

        const styleM = isM 
            ? 'background-color: #b91c1c; color: #ffffff; border-color: #b91c1c; opacity: 1;' 
            : 'background-color: #fef2f2; color: #dc2626; border-color: #fecaca; opacity: 0.6;';

        const styleN = isN 
            ? 'background-color: #c2410c; color: #ffffff; border-color: #c2410c; opacity: 1;' 
            : 'background-color: #fff7ed; color: #ea580c; border-color: #ffedd5; opacity: 0.6;';
        
        return `
        <div class="form-group" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center;">
            <label class="form-label" style="font-size:11px; font-weight:600; color:var(--text-secondary); margin-bottom:0; text-align:center; white-space:nowrap;">${elem.label}</label>
            <div class="status-btn-group" style="display: flex; gap: 4px; width: 100%;">
                <button type="button" class="status-btn btn-b" data-value="Buen estado" title="Buen estado" style="flex: 1; height: 30px; font-weight: 700; font-size: 13px; border: 1px solid; border-radius: 6px; cursor: pointer; transition: all 0.2s; ${styleB}">B</button>
                <button type="button" class="status-btn btn-m" data-value="Mal estado" title="Mal estado" style="flex: 1; height: 30px; font-weight: 700; font-size: 13px; border: 1px solid; border-radius: 6px; cursor: pointer; transition: all 0.2s; ${styleM}">M</button>
                <button type="button" class="status-btn btn-n" data-value="No aplica" title="No aplica" style="flex: 1; height: 30px; font-weight: 700; font-size: 13px; border: 1px solid; border-radius: 6px; cursor: pointer; transition: all 0.2s; ${styleN}">N</button>
            </div>
            <input type="hidden" data-field="${elem.key}" value="${selectedValue}" required>
        </div>
        `;
    }).join('');

    return `
    <div class="extintor-card card" data-index="${index}" style="position:relative; border-left: 4px solid var(--info); padding-bottom:var(--space-4);">
        <button type="button" class="btn-remove-extintor" style="position:absolute; top:var(--space-3); right:var(--space-3); background:none; border:none; color:var(--danger); cursor:pointer; padding:4px; border-radius:var(--radius-sm);">
            <i data-lucide="trash-2" style="width:18px;height:18px;"></i>
        </button>
        
        <h4 class="extintor-title" style="margin-top:0; margin-bottom:var(--space-4); color:var(--text-primary); font-size:var(--text-md);">Extintor #${index + 1}</h4>
        
        <div class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:var(--space-3); margin-bottom:var(--space-4);">
            <div class="form-group">
                <label class="form-label">Código / #</label>
                <select class="form-select selector-codigo-extintor" data-field="codigo" required>
                    <option value="" disabled ${!data.codigo ? 'selected' : ''}>Seleccione un extintor...</option>
                    ${window._inventarioExtintores ? window._inventarioExtintores.map(ext => `<option value="${ext.numero_serie}" ${data.codigo === ext.numero_serie ? 'selected' : ''}>${ext.numero_serie} (${ext.tipo})</option>`).join('') : ''}
                    ${data.codigo && (!window._inventarioExtintores || !window._inventarioExtintores.some(e => e.numero_serie === data.codigo)) ? `<option value="${data.codigo}" selected>${data.codigo} (Inactivo/Eliminado)</option>` : ''}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Tipo</label>
                <select class="form-select extintor-param-codigo" data-field="tipo" required disabled style="background-color: var(--bg-body); cursor: not-allowed;">
                    <option value="" disabled ${!data.tipo ? 'selected' : ''}>Seleccione...</option>
                    ${window._paramExtintorCodigos ? window._paramExtintorCodigos.map(p => `<option value="${p.valor}" ${data.tipo === p.valor ? 'selected' : ''}>${p.valor}</option>`).join('') : ''}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Capacidad</label>
                <input type="text" class="form-input" data-field="capacidad" value="${data.capacidad || ''}" required placeholder="..." disabled style="background-color: var(--bg-body); cursor: not-allowed;">
            </div>
            <div class="form-group">
                <label class="form-label">Ubicación</label>
                <select class="form-select extintor-param-ubicacion" data-field="ubicacion" required disabled style="background-color: var(--bg-body); cursor: not-allowed;">
                    <option value="" disabled ${!data.ubicacion ? 'selected' : ''}>Seleccione...</option>
                    ${window._paramExtintorUbicaciones ? window._paramExtintorUbicaciones.map(p => `<option value="${p.valor}" ${data.ubicacion === p.valor ? 'selected' : ''}>${p.valor}</option>`).join('') : ''}
                </select>
            </div>
            <div class="form-group">
                <label class="form-label">Fecha de Recarga</label>
                <input type="date" class="form-input" data-field="fecha_recarga" value="${data.fecha_recarga || ''}" required disabled style="background-color: var(--bg-body); cursor: not-allowed;">
            </div>
        </div>
        
        <div style="border-top:1px solid var(--border-light); padding-top:var(--space-4); margin-top:var(--space-3);">
            <h5 style="margin-top:0; margin-bottom:var(--space-4); color:var(--text-secondary); font-size:var(--text-sm); text-transform:uppercase; letter-spacing:0.5px; text-align:center;">Estado de Elementos</h5>
            <div style="display:grid; grid-template-columns: repeat(8, 1fr); gap: 12px 16px;">
                ${elementosHtml}
            </div>
        </div>
    </div>
    `;
}

function addExtintorCard(container, data = {}) {
    const extContainer = container.querySelector('#extintores-container');
    const index = extContainer.children.length;
    
    // Insert HTML
    extContainer.insertAdjacentHTML('beforeend', getExtintorCardHTML(index, data));
    const newCard = extContainer.lastElementChild;
    
    // 1. Add logic for auto-complete from inventory
    const selectorCodigo = newCard.querySelector('.selector-codigo-extintor');
    if (selectorCodigo) {
        const handleAutocomplete = () => {
            const selectedSerie = selectorCodigo.value;
            const extintor = window._inventarioExtintores?.find(e => e.numero_serie === selectedSerie);
            
            const fieldTipo = newCard.querySelector('[data-field="tipo"]');
            const fieldCapacidad = newCard.querySelector('[data-field="capacidad"]');
            const fieldUbicacion = newCard.querySelector('[data-field="ubicacion"]');
            const fieldFechaRecarga = newCard.querySelector('[data-field="fecha_recarga"]');
            
            if (extintor) {
                if(fieldTipo) { fieldTipo.value = extintor.tipo; fieldTipo.disabled = true; fieldTipo.style.backgroundColor = 'var(--bg-body)'; }
                if(fieldCapacidad) { fieldCapacidad.value = extintor.capacidad; fieldCapacidad.disabled = true; fieldCapacidad.style.backgroundColor = 'var(--bg-body)'; }
                if(fieldUbicacion) { fieldUbicacion.value = extintor.ubicacion; fieldUbicacion.disabled = true; fieldUbicacion.style.backgroundColor = 'var(--bg-body)'; }
                if(fieldFechaRecarga) { fieldFechaRecarga.value = extintor.ultima_recarga; fieldFechaRecarga.disabled = true; fieldFechaRecarga.style.backgroundColor = 'var(--bg-body)'; }
            } else if (!data.codigo) {
                if(fieldTipo) { fieldTipo.value = ''; fieldTipo.disabled = true; }
                if(fieldCapacidad) { fieldCapacidad.value = ''; fieldCapacidad.disabled = true; }
                if(fieldUbicacion) { fieldUbicacion.value = ''; fieldUbicacion.disabled = true; }
                if(fieldFechaRecarga) { fieldFechaRecarga.value = ''; fieldFechaRecarga.disabled = true; }
            }
        };

        selectorCodigo.addEventListener('change', handleAutocomplete);
    }

    // 2. Add logic for button states in "Estado de Elementos"
    newCard.querySelectorAll('.status-btn-group').forEach(group => {
        const hiddenInput = group.nextElementSibling; // the input type="hidden"
        const btnB = group.querySelector('.btn-b');
        const btnM = group.querySelector('.btn-m');
        const btnN = group.querySelector('.btn-n');

        const updateBtnStyles = (selectedValue) => {
            // Reset B
            if (selectedValue === 'Buen estado') {
                btnB.style.cssText = 'flex: 1; height: 30px; font-weight: 700; font-size: 13px; border: 1px solid #15803d; border-radius: 6px; cursor: pointer; transition: all 0.2s; background-color: #15803d; color: #ffffff; opacity: 1;';
            } else {
                btnB.style.cssText = 'flex: 1; height: 30px; font-weight: 700; font-size: 13px; border: 1px solid #bbf7d0; border-radius: 6px; cursor: pointer; transition: all 0.2s; background-color: #f0fdf4; color: #16a34a; opacity: 0.6;';
            }
            // Reset M
            if (selectedValue === 'Mal estado') {
                btnM.style.cssText = 'flex: 1; height: 30px; font-weight: 700; font-size: 13px; border: 1px solid #b91c1c; border-radius: 6px; cursor: pointer; transition: all 0.2s; background-color: #b91c1c; color: #ffffff; opacity: 1;';
            } else {
                btnM.style.cssText = 'flex: 1; height: 30px; font-weight: 700; font-size: 13px; border: 1px solid #fecaca; border-radius: 6px; cursor: pointer; transition: all 0.2s; background-color: #fef2f2; color: #dc2626; opacity: 0.6;';
            }
            // Reset N
            if (selectedValue === 'No aplica') {
                btnN.style.cssText = 'flex: 1; height: 30px; font-weight: 700; font-size: 13px; border: 1px solid #c2410c; border-radius: 6px; cursor: pointer; transition: all 0.2s; background-color: #c2410c; color: #ffffff; opacity: 1;';
            } else {
                btnN.style.cssText = 'flex: 1; height: 30px; font-weight: 700; font-size: 13px; border: 1px solid #ffedd5; border-radius: 6px; cursor: pointer; transition: all 0.2s; background-color: #fff7ed; color: #ea580c; opacity: 0.6;';
            }
        };

        group.addEventListener('click', (e) => {
            const fieldset = container.querySelector('#form-fieldset');
            if (fieldset && fieldset.disabled) return; // ignore clicks if read-only
            
            const btn = e.target.closest('.status-btn');
            if (!btn) return;
            const val = btn.dataset.value;
            hiddenInput.value = val;
            updateBtnStyles(val);
        });
    });
    
    // Re-init icons
    if (window.lucide) window.lucide.createIcons({ nodes: [newCard] });
    
    updateExtintoresEmptyState(container);
}

function renumberExtintores(container) {
    const cards = container.querySelectorAll('.extintor-card');
    cards.forEach((card, i) => {
        card.dataset.index = i;
        const title = card.querySelector('.extintor-title');
        if (title) title.innerText = `Extintor #${i + 1}`;
    });
}

function updateExtintoresEmptyState(container) {
    const extContainer = container.querySelector('#extintores-container');
    const emptyState = container.querySelector('#extintores-empty-state');
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
    
    // Clear extintores
    container.querySelector('#extintores-container').innerHTML = '';
    updateExtintoresEmptyState(container);
    
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
    const cards = container.querySelectorAll('.extintor-card');
    cards.forEach(card => {
        const item = {};
        // Find inputs and selects
        card.querySelectorAll('input[data-field], select[data-field]').forEach(el => {
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

function getEstadosBadgesHtml(det) {
    const vals = ELEMENTOS_LISTA.map(el => det[el.key]).filter(Boolean);
    if (vals.length === 0) return '<span style="color:var(--text-muted); font-size:11px;">Sin evaluar</span>';

    const bCount = vals.filter(v => v === 'Buen estado').length;
    const mCount = vals.filter(v => v === 'Mal estado').length;
    const nCount = vals.filter(v => v === 'No aplica').length;

    let html = '<div style="display:flex;gap:4px;align-items:center;flex-wrap:wrap;">';
    if (bCount > 0) html += `<span title="Buen estado: ${bCount} elemento(s)" style="display:inline-flex;align-items:center;gap:3px;padding:3px 7px;border-radius:12px;background:#15803d;color:#fff;font-weight:700;font-size:11px;cursor:default;">B <span style="font-weight:400;opacity:0.85;">${bCount}</span></span>`;
    if (mCount > 0) html += `<span title="Mal estado: ${mCount} elemento(s)" style="display:inline-flex;align-items:center;gap:3px;padding:3px 7px;border-radius:12px;background:#b91c1c;color:#fff;font-weight:700;font-size:11px;cursor:default;">M <span style="font-weight:400;opacity:0.85;">${mCount}</span></span>`;
    if (nCount > 0) html += `<span title="No aplica: ${nCount} elemento(s)" style="display:inline-flex;align-items:center;gap:3px;padding:3px 7px;border-radius:12px;background:#c2410c;color:#fff;font-weight:700;font-size:11px;cursor:default;">N <span style="font-weight:400;opacity:0.85;">${nCount}</span></span>`;
    html += '</div>';
    return html;
}

function getActionButtons(id) {
    return `
    <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
        <button data-action="view" data-id="${id}" title="Ver" style="background:var(--accent-bg);border:1px solid var(--border-focus);border-radius:6px;padding:6px;cursor:pointer;color:var(--accent);display:flex;align-items:center;">
            <i data-lucide="eye" style="width:14px;height:14px;"></i>
        </button>
        <button data-action="edit" data-id="${id}" title="Editar" style="background:rgba(0,180,216,0.1);border:1px solid rgba(0,180,216,0.2);border-radius:6px;padding:6px;cursor:pointer;color:#00b4d8;display:flex;align-items:center;">
            <i data-lucide="pencil" style="width:14px;height:14px;"></i>
        </button>
        <button data-action="delete" data-id="${id}" title="Eliminar" style="background:var(--danger-bg);border:1px solid rgba(239,68,68,0.2);border-radius:6px;padding:6px;cursor:pointer;color:var(--danger);display:flex;align-items:center;">
            <i data-lucide="trash-2" style="width:14px;height:14px;"></i>
        </button>
    </div>`;
}

async function refreshTable(container, forceFetch = false) {
    const tableContainer = container.querySelector('#table-container');

    if (!cachedInspecciones) {
        tableContainer.innerHTML = '<div class="spinner" style="margin:20px auto"></div>';
    }

    if (forceFetch || !cachedInspecciones) {
        const res = await getAllInspecciones();
        if (res.error) {
            tableContainer.innerHTML = `<p style="color:var(--color-danger)">Error: ${res.error.message}</p>`;
            return;
        }
        cachedInspecciones = res.data || [];
    }

    if (dataTableInstance) {
        dataTableInstance.destroy();
        dataTableInstance = null;
    }

    const searchInput = container.querySelector('#table-search-input');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

    const displayRows = cachedInspecciones.filter(r => {
        if (!query) return true;
        return `${r.lugar_trabajo || ''} ${r.fecha || ''} ${r.inspector_nombre || ''}`.toLowerCase().includes(query);
    });

    if (displayRows.length === 0) {
        tableContainer.innerHTML = `
            <div style="text-align:center; padding:48px 24px; color:#5a6a7a; font-size:14px; border-radius:12px; border:1px solid var(--border-default); background:var(--bg-surface);">
                <i data-lucide="inbox" style="width:48px;height:48px;margin-bottom:16px;opacity:0.4;display:block;margin-left:auto;margin-right:auto;"></i>
                <p style="margin:0;">No hay inspecciones guardadas.</p>
            </div>`;
        if (window.lucide) window.lucide.createIcons({ nodes: [tableContainer] });
        return;
    }

    let rowsHtml = '';
    displayRows.forEach((insp, inspIdx) => {
        const detalles = insp.extintores_detalle || [];
        const rowCount = Math.max(detalles.length, 1);
        const borderTop = inspIdx > 0 ? '3px solid var(--border-default)' : 'none';
        const bgRow = inspIdx % 2 === 0 ? 'var(--bg-surface)' : 'rgba(148,163,184,0.04)';
        const cellStyleHeader = `padding:10px; font-size:12px; color:var(--text-secondary); white-space:nowrap; vertical-align:middle; border-right:1px solid var(--border-light);`;

        if (detalles.length === 0) {
            rowsHtml += `
            <tr style="border-top:${borderTop}; background:${bgRow};">
                <td style="${cellStyleHeader} font-weight:600; color:var(--text-primary);" rowspan="1">${insp.fecha || '\u2014'}</td>
                <td style="${cellStyleHeader}" rowspan="1">${insp.lugar_trabajo || '\u2014'}</td>
                <td style="${cellStyleHeader}" rowspan="1">${insp.inspector_nombre || '\u2014'}</td>
                <td colspan="4" style="padding:10px; font-size:12px; color:var(--text-muted); font-style:italic;">Sin extintores registrados</td>
                <td rowspan="1" style="padding:10px; text-align:center; vertical-align:middle;">${getActionButtons(insp.id)}</td>
            </tr>`;
        } else {
            detalles.forEach((det, detIdx) => {
                const isFirst = detIdx === 0;
                const cellStyleDet = `padding:8px 10px; font-size:12px; color:var(--text-secondary); white-space:nowrap; border-bottom:1px dashed var(--border-light);`;
                rowsHtml += `
                <tr style="${isFirst ? `border-top:${borderTop};` : ''} background:${bgRow};">
                    ${isFirst ? `
                    <td rowspan="${rowCount}" style="${cellStyleHeader} font-weight:600; color:var(--text-primary);">${insp.fecha || '\u2014'}</td>
                    <td rowspan="${rowCount}" style="${cellStyleHeader}">${insp.lugar_trabajo || '\u2014'}</td>
                    <td rowspan="${rowCount}" style="${cellStyleHeader}">${insp.inspector_nombre || '\u2014'}</td>
                    ` : ''}
                    <td style="${cellStyleDet} font-weight:600; color:var(--text-primary);">
                        <span style="display:inline-flex;align-items:center;gap:6px;">
                            <span style="font-size:10px;color:var(--text-muted);">#${detIdx + 1}</span>
                            ${det.codigo || '\u2014'}
                        </span>
                    </td>
                    <td style="${cellStyleDet}">${det.tipo || '\u2014'}</td>
                    <td style="${cellStyleDet}">${det.capacidad || '\u2014'}</td>
                    <td style="padding:8px 10px; border-bottom:1px dashed var(--border-light);">${getEstadosBadgesHtml(det)}</td>
                    ${isFirst ? `
                    <td rowspan="${rowCount}" style="padding:10px; text-align:center; vertical-align:middle; border-left:1px solid var(--border-light);">${getActionButtons(insp.id)}</td>
                    ` : ''}
                </tr>`;
            });
        }
    });

    const thStyle = 'padding:8px 10px; text-align:left; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-secondary); border-bottom:1px solid var(--border-default); white-space:nowrap;';

    tableContainer.innerHTML = `
        <div style="overflow-x:auto; border-radius:12px; border:1px solid var(--border-default); background:var(--bg-surface);">
            <table style="width:100%; border-collapse:collapse; font-family:'Inter',sans-serif;">
                <thead>
                    <tr>
                        <th style="${thStyle}">FECHA</th>
                        <th style="${thStyle}">LUGAR DE TRABAJO</th>
                        <th style="${thStyle}">INSPECTOR</th>
                        <th style="${thStyle}">C\u00d3DIGO / #</th>
                        <th style="${thStyle}">TIPO</th>
                        <th style="${thStyle}">CAPACIDAD</th>
                        <th style="${thStyle}">ESTADOS</th>
                        <th style="${thStyle} text-align:center; width:110px;">ACCIONES</th>
                    </tr>
                </thead>
                <tbody>${rowsHtml}</tbody>
            </table>
        </div>`;

    if (window.lucide) window.lucide.createIcons({ nodes: [tableContainer] });

    // Delegation for action buttons
    tableContainer.addEventListener('click', async (e) => {
        const btn = e.target.closest('[data-action]');
        if (!btn) return;
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        const insp = cachedInspecciones.find(r => r.id === id);
        if (!insp) return;

        if (action === 'view') {
            await openRecordForEdit(container, id, true);
        } else if (action === 'edit') {
            await openRecordForEdit(container, id, false);
        } else if (action === 'delete') {
            const confirmed = await showConfirmModal('Eliminar', `\u00bfSeguro que desea eliminar la inspecci\u00f3n del ${insp.fecha}?`);
            if (confirmed) {
                const delRes = await deleteInspeccion(id);
                if (delRes.error) showToast('Error al eliminar', 'error');
                else {
                    showToast('Inspecci\u00f3n eliminada', 'success');
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
    
    loadRecordIntoForm(container, res.data);
    setReadOnly(container, isReadOnly);
    container._showForm();
}

function setReadOnly(container, isReadOnly) {
    const fieldset = container.querySelector('#form-fieldset');
    const actionsContainer = container.querySelector('#form-actions-container');
    const btnAddExtintor = container.querySelector('#btn-add-extintor');
    
    if (fieldset) {
        fieldset.disabled = isReadOnly;
    }
    
    if (actionsContainer) {
        actionsContainer.style.display = isReadOnly ? 'none' : 'flex';
    }

    if (btnAddExtintor) {
        btnAddExtintor.style.display = isReadOnly ? 'none' : 'inline-flex';
    }
    
    // Hide all remove buttons if readonly
    const removeBtns = container.querySelectorAll('.btn-remove-extintor');
    removeBtns.forEach(btn => {
        btn.style.display = isReadOnly ? 'none' : 'block';
    });
}

function loadRecordIntoForm(container, record) {
    currentRecordId = record.id;
    
    // Set Header
    container.querySelector('#input-lugar_trabajo').value = record.lugar_trabajo || '';
    container.querySelector('#input-fecha').value = record.fecha || '';
    container.querySelector('#input-inspector_nombre').value = record.inspector_nombre || '';
    container.querySelector('#input-inspector_cargo').value = record.inspector_cargo || '';
    container.querySelector('#input-observaciones_generales').value = record.observaciones_generales || '';
    
    // Clear existing details
    container.querySelector('#extintores-container').innerHTML = '';
    
    // Add Details
    if (record.extintores_detalle && record.extintores_detalle.length > 0) {
        record.extintores_detalle.forEach(det => {
            addExtintorCard(container, det);
        });
    } else {
        updateExtintoresEmptyState(container);
    }
    
    container.querySelector('#btn-guardar').innerHTML = '<i data-lucide="edit"></i> Actualizar Inspección';
    if (window.lucide) window.lucide.createIcons();
    
    // Scroll up
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
