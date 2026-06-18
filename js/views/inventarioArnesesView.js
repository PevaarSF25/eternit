import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { createDataTable } from '../components/dataTable.js';
import { getParametros } from '../services/parametricaService.js';
import { initDatePicker } from '../components/datePicker.js';
import {
  getAllInventario,
  createInventario,
  updateInventario,
  deleteInventario,
  getArnesInspectionsHistory
} from '../services/inventarioArnesesService.js';

let currentRecordId = null;
let dataTableInstance = null;
let cachedInventario = null;

export async function renderInventarioArneses(container) {
    container.innerHTML = '<div class="registro-container">'
    + '<div class="registro-header" style="display:flex; flex-direction:column; align-items:stretch; gap:var(--space-4); margin-bottom:var(--space-6); width:100%;">'
    + '<h2>Arneses</h2>'
    + '<div style="display:flex; align-items:center; width:100%; gap: 12px; flex-wrap: wrap;">'
    + '<div class="search-wrapper" id="table-search-wrapper" style="position:relative; flex:0 1 400px;">'
    + '<input type="text" class="form-input" id="table-search-input" placeholder="Buscar por número, marca..." style="width:100%; padding-left:40px; background-color:var(--bg-surface); border:1px solid var(--border-default);">'
    + '<i data-lucide="search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted); width:16px; height:16px; pointer-events:none;"></i>'
    + '</div>'
    + '<button class="btn btn-primary btn-glow" id="btn-nuevo-registro" style="display:none; flex-shrink:0; white-space:nowrap; align-items:center; gap:6px; margin-left:auto;">'
    + '<i data-lucide="plus" style="width:16px;height:16px;"></i> Nuevo Arnés'
    + '</button>'
    + '</div>'
    + '</div>'
    + '<div id="view-table" class="registros-table-section card active-view">'
    + '<div class="table-header" style="margin-bottom:var(--space-4);">'
    + '<h3 class="card-title"><i data-lucide="list"></i> Arneses Registrados</h3>'
    + '</div>'
    + '<div id="table-container"></div>'
    + '</div>'
    + '<div id="view-form" class="registro-form" style="display: none;">'
    + '<div style="margin-bottom: var(--space-4);">'
    + '<button class="btn-back" id="btn-volver-tabla" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; gap:8px; font-weight:500;">'
    + '<i data-lucide="arrow-left" style="width:18px;height:18px;"></i> Volver al inventario'
    + '</button>'
    + '</div>'
    + '<form id="registro-form">'
    + '<fieldset id="form-fieldset" style="border:none; padding:0; margin:0;">'

    // ---- Card 1: Identificación general ----
    + '<div class="card form-section" style="margin-bottom:var(--space-6)">'
    + '<h3 class="form-section-title">Identificación general</h3>'
    + '<div class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));">'
    + '<input type="hidden" id="input-codigo" name="codigo">'
    + '<div class="form-group"><label for="input-numero_inventario" class="form-label">Número de Inventario</label>'
    + '<input type="text" class="form-input" id="input-numero_inventario" name="numero_inventario" required placeholder="Ej: INV-100"></div>'
    + '<div class="form-group"><label for="input-tipo_equipo" class="form-label">Tipo de Equipo</label>'
    + '<select class="form-select" id="input-tipo_equipo" name="tipo_equipo" required>'
    + '<option value="" disabled>Seleccione...</option>'
    + '</select></div>'
    + '<div class="form-group"><label for="input-marca" class="form-label">Marca</label>'
    + '<input type="text" class="form-input" id="input-marca" name="marca" placeholder="..."></div>'
    + '<div class="form-group"><label for="input-fabricante" class="form-label">Fabricante</label>'
    + '<input type="text" class="form-input" id="input-fabricante" name="fabricante" placeholder="..."></div>'
    + '<div class="form-group"><label for="input-lote" class="form-label">Lote de Fabricación</label>'
    + '<input type="text" class="form-input" id="input-lote" name="lote" placeholder="..."></div>'
    + '<div class="form-group"><label for="input-pais_fabricacion" class="form-label">País de Fabricación</label>'
    + '<input type="text" class="form-input" id="input-pais_fabricacion" name="pais_fabricacion" placeholder="..."></div>'
    + '</div>'
    + '</div>'

    // ---- Card 2: Información Técnica ----
    + '<div class="card form-section" style="margin-bottom:var(--space-6)">'
    + '<h3 class="form-section-title">Información Técnica</h3>'
    + '<div class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));">'
    + '<div class="form-group"><label for="input-norma_certificacion" class="form-label">Norma de Certificación</label>'
    + '<select class="form-select" id="input-norma_certificacion" name="norma_certificacion">'
    + '<option value="" disabled selected>Seleccione...</option>'
    + '<option value="ANSI">ANSI</option>'
    + '<option value="OSHA">OSHA</option>'
    + '<option value="EN 361">EN 361</option>'
    + '<option value="EN 358">EN 358</option>'
    + '<option value="EN 813">EN 813</option>'
    + '<option value="Otra">Otra</option>'
    + '</select></div>'
    + '<div class="form-group" id="group-norma-otra" style="display:none;"><label for="input-norma_certificacion_otra" class="form-label">Especifique Norma</label>'
    + '<input type="text" class="form-input" id="input-norma_certificacion_otra" name="norma_certificacion_otra" placeholder="Escriba la norma..."></div>'
    + '<div class="form-group"><label for="input-capacidad_carga" class="form-label">Capacidad Máxima de Carga</label>'
    + '<input type="text" class="form-input" id="input-capacidad_carga" name="capacidad_carga" placeholder="Ej: 140 kg"></div>'
    + '<div class="form-group"><label for="input-numero_argollas" class="form-label">Número de Argollas</label>'
    + '<input type="number" class="form-input" id="input-numero_argollas" name="numero_argollas" min="0"></div>'
    + '<div class="form-group"><label for="input-ubicacion_argollas" class="form-label">Ubicación de Argollas</label>'
    + '<select class="form-select" id="input-ubicacion_argollas" name="ubicacion_argollas">'
    + '<option value="" disabled selected>Seleccione...</option>'
    + '<option value="Dorsal">Dorsal</option>'
    + '<option value="Esternal">Esternal</option>'
    + '<option value="Laterales de posicionamiento">Laterales de posicionamiento</option>'
    + '<option value="Ventral">Ventral</option>'
    + '</select></div>'
    + '<div class="form-group"><label for="input-talla" class="form-label">Talla</label>'
    + '<select class="form-select" id="input-talla" name="talla">'
    + '<option value="" disabled selected>Seleccione...</option>'
    + '<option value="S">S</option>'
    + '<option value="M">M</option>'
    + '<option value="L">L</option>'
    + '<option value="XL">XL</option>'
    + '</select></div>'
    + '</div>'
    + '</div>'

    // ---- Card 3: Información de compra ----
    + '<div class="card form-section" style="margin-bottom:var(--space-6)">'
    + '<h3 class="form-section-title">Información de compra</h3>'
    + '<div class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));">'
    + '<div class="form-group"><label for="input-fecha_compra" class="form-label">Fecha de Compra</label>'
    + '<input type="text" class="form-input" id="input-fecha_compra" name="fecha_compra" readonly placeholder="Seleccione fecha..."></div>'
    + '<div class="form-group"><label for="input-proveedor" class="form-label">Proveedor</label>'
    + '<input type="text" class="form-input" id="input-proveedor" name="proveedor" placeholder="..."></div>'
    + '<div class="form-group"><label for="input-numero_factura" class="form-label">Número de Factura</label>'
    + '<input type="text" class="form-input" id="input-numero_factura" name="numero_factura" placeholder="..."></div>'
    + '</div>'
    + '</div>'

    // ---- Card 4: Información de uso ----
    + '<div class="card form-section" style="margin-bottom:var(--space-6)">'
    + '<h3 class="form-section-title">Información de uso</h3>'
    + '<div class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));">'
    + '<div class="form-group"><label for="input-fecha_fabricacion" class="form-label">Fecha de Fabricación</label>'
    + '<input type="text" class="form-input" id="input-fecha_fabricacion" name="fecha_fabricacion" readonly placeholder="Seleccione fecha..."></div>'
    + '<div class="form-group"><label for="input-estado" class="form-label">Estado Actual</label>'
    + '<select class="form-select" id="input-estado" name="estado" required>'
    + '<option value="Disponible">Disponible</option>'
    + '<option value="En uso">En uso</option>'
    + '<option value="En inspeccion">En inspección</option>'
    + '<option value="Fuera de servicio">Fuera de servicio</option>'
    + '<option value="Dado de baja">Dado de baja</option>'
    + '</select></div>'
    + '</div>'
    + '</div>'

    // ---- Card 5: Información de Inspecciones ----
    + '<div class="card form-section" style="margin-bottom:var(--space-6)">'
    + '<h3 class="form-section-title">Información de Inspecciones</h3>'
    + '<div class="form-grid" style="grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));">'
    + '<div class="form-group"><label for="input-fecha_ultima_inspeccion" class="form-label">Fecha Última Inspección</label>'
    + '<input type="text" class="form-input" id="input-fecha_ultima_inspeccion" name="fecha_ultima_inspeccion" readonly placeholder="Seleccione fecha..."></div>'
    + '<div class="form-group"><label for="input-resultado_inspeccion" class="form-label">Resultado</label>'
    + '<select class="form-select" id="input-resultado_inspeccion" name="resultado_inspeccion">'
    + '<option value="" disabled selected>Seleccione...</option>'
    + '<option value="Aprobado">Aprobado</option>'
    + '<option value="Condicionado">Condicionado</option>'
    + '<option value="Rechazado">Rechazado</option>'
    + '</select></div>'
    + '<div class="form-group"><label for="input-fecha_proxima_inspeccion" class="form-label">Fecha Próxima Inspección</label>'
    + '<input type="text" class="form-input" id="input-fecha_proxima_inspeccion" name="fecha_proxima_inspeccion" readonly placeholder="Seleccione fecha..."></div>'
    + '</div>'
    + '</div>'

    + '<div class="form-actions" id="form-actions-container">'
    + '<button type="button" class="btn btn-secondary" id="btn-limpiar"><i data-lucide="refresh-cw"></i> Limpiar</button>'
    + '<button type="submit" class="btn btn-primary" id="btn-guardar"><i data-lucide="save"></i> Guardar Arnés</button>'
    + '</div>'
    + '</fieldset>'
    + '</form>'

    // ---- Historial ----
    + '<div id="historial-inspecciones-section" style="margin-top: var(--space-6); display: none;">'
    + '<div class="card form-section" style="padding: var(--space-4);">'
    + '<h3 class="form-section-title" style="display: flex; align-items: center; gap: 8px; margin-bottom: var(--space-4);">'
    + '<i data-lucide="history" style="width: 20px; height: 20px; color: var(--accent);"></i>'
    + ' Historial de Inspecciones y Mantenimiento'
    + '</h3>'
    + '<div id="historial-lista-container"></div>'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>';

    if (window.lucide) window.lucide.createIcons();

    await loadParametricas(container);

    initDatePicker(container.querySelector('#input-fecha_compra'), null, 'YYYY-MM-DD');
    initDatePicker(container.querySelector('#input-fecha_fabricacion'), null, 'YYYY-MM-DD');
    initDatePicker(container.querySelector('#input-fecha_ultima_inspeccion'), null, 'YYYY-MM-DD');
    initDatePicker(container.querySelector('#input-fecha_proxima_inspeccion'), null, 'YYYY-MM-DD');

    bindEvents(container);
    await refreshTable(container);
    resetForm(container);

    // Show the button and search bar on initial load (table view is the default)
    var btnNuevo = container.querySelector('#btn-nuevo-registro');
    var searchWrapper = container.querySelector('#table-search-wrapper');
    if (btnNuevo) btnNuevo.style.display = 'inline-flex';
    if (searchWrapper) searchWrapper.style.display = 'block';
}

async function loadParametricas(container) {
    const tipos = await getParametros('arnes_tipo');
    const selectTipo = container.querySelector('#input-tipo_equipo');
    if (selectTipo) {
        if (tipos.data && tipos.data.length > 0) {
            selectTipo.innerHTML = '<option value="" disabled selected>Seleccione...</option>'
                + tipos.data.map(function(p) {
                    return '<option value="' + p.valor + '">' + p.valor + '</option>';
                }).join('');
        } else {
            selectTipo.innerHTML = '<option value="" disabled selected>Seleccione...</option>';
        }
    }
}

function bindEvents(container) {
    var form = container.querySelector('#registro-form');
    var btnLimpiar = container.querySelector('#btn-limpiar');
    var btnNuevoRegistro = container.querySelector('#btn-nuevo-registro');
    var btnVolverTabla = container.querySelector('#btn-volver-tabla');
    var viewTable = container.querySelector('#view-table');
    var viewForm = container.querySelector('#view-form');
    var tableSearchInput = container.querySelector('#table-search-input');
    var tableSearchWrapper = container.querySelector('#table-search-wrapper');
    var selectNorma = container.querySelector('#input-norma_certificacion');
    var groupNormaOtra = container.querySelector('#group-norma-otra');

    var showForm = function() {
        viewTable.style.display = 'none';
        btnNuevoRegistro.style.display = 'none';
        if (tableSearchWrapper) tableSearchWrapper.style.display = 'none';
        viewForm.style.display = 'block';
    };

    var showTable = function() {
        viewForm.style.display = 'none';
        viewTable.style.display = 'block';
        btnNuevoRegistro.style.display = 'inline-flex';
        if (tableSearchWrapper) tableSearchWrapper.style.display = 'block';
        refreshTable(container);
    };

    container._showForm = showForm;

    if (tableSearchInput) {
        var timeout;
        tableSearchInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(function() { refreshTable(container); }, 300);
        });
    }

    if (selectNorma) {
        selectNorma.addEventListener('change', function() {
            groupNormaOtra.style.display = selectNorma.value === 'Otra' ? 'block' : 'none';
        });
    }

    btnNuevoRegistro.addEventListener('click', function() {
        resetForm(container);
        setReadOnly(container, false);
        showForm();
    });

    btnVolverTabla.addEventListener('click', function() { showTable(); });
    btnLimpiar.addEventListener('click', function() { resetForm(container); });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        await saveRecord(container);
        showTable();
    });
}

function getFormData(container) {
    var normaVal = container.querySelector('#input-norma_certificacion').value;
    var finalNorma = normaVal === 'Otra'
        ? (container.querySelector('#input-norma_certificacion_otra').value || 'Otra')
        : normaVal;

    var codigoActual = container.querySelector('#input-codigo').value;
    if (!codigoActual) {
        codigoActual = 'ARN-' + Date.now().toString(36).toUpperCase();
    }

    return {
        codigo: codigoActual,
        numero_inventario: container.querySelector('#input-numero_inventario').value || null,
        marca: container.querySelector('#input-marca').value || null,
        fabricante: container.querySelector('#input-fabricante').value || null,
        lote: container.querySelector('#input-lote').value || null,
        pais_fabricacion: container.querySelector('#input-pais_fabricacion').value || null,
        tipo_equipo: container.querySelector('#input-tipo_equipo').value || 'Arnes de cuerpo completo',
        norma_certificacion: finalNorma || null,
        capacidad_carga: container.querySelector('#input-capacidad_carga').value || null,
        numero_argollas: container.querySelector('#input-numero_argollas').value || null,
        ubicacion_argollas: container.querySelector('#input-ubicacion_argollas').value || null,
        talla: container.querySelector('#input-talla').value || null,
        fecha_compra: container.querySelector('#input-fecha_compra').value || null,
        proveedor: container.querySelector('#input-proveedor').value || null,
        numero_factura: container.querySelector('#input-numero_factura').value || null,
        fecha_fabricacion: container.querySelector('#input-fecha_fabricacion').value || null,
        estado: container.querySelector('#input-estado').value,
        fecha_ultima_inspeccion: container.querySelector('#input-fecha_ultima_inspeccion').value || null,
        resultado_inspeccion: container.querySelector('#input-resultado_inspeccion').value || null,
        fecha_proxima_inspeccion: container.querySelector('#input-fecha_proxima_inspeccion').value || null
    };
}

function setFormData(container, data) {
    container.querySelector('#input-codigo').value = data.codigo || '';
    container.querySelector('#input-numero_inventario').value = data.numero_inventario || '';
    container.querySelector('#input-marca').value = data.marca || '';
    container.querySelector('#input-fabricante').value = data.fabricante || '';
    container.querySelector('#input-lote').value = data.lote || '';
    container.querySelector('#input-pais_fabricacion').value = data.pais_fabricacion || '';
    container.querySelector('#input-tipo_equipo').value = data.tipo_equipo || 'Arnes de cuerpo completo';

    var normaSelect = container.querySelector('#input-norma_certificacion');
    var normaOtraGroup = container.querySelector('#group-norma-otra');
    var normaOtraInput = container.querySelector('#input-norma_certificacion_otra');
    var standardOptions = ['ANSI', 'OSHA', 'EN 361', 'EN 358', 'EN 813', 'Otra'];

    if (data.norma_certificacion) {
        if (standardOptions.includes(data.norma_certificacion)) {
            normaSelect.value = data.norma_certificacion;
            normaOtraGroup.style.display = 'none';
        } else {
            normaSelect.value = 'Otra';
            normaOtraInput.value = data.norma_certificacion;
            normaOtraGroup.style.display = 'block';
        }
    } else {
        normaSelect.value = '';
        normaOtraGroup.style.display = 'none';
        normaOtraInput.value = '';
    }

    container.querySelector('#input-capacidad_carga').value = data.capacidad_carga || '';
    container.querySelector('#input-numero_argollas').value = data.numero_argollas || '';
    container.querySelector('#input-ubicacion_argollas').value = data.ubicacion_argollas || '';
    container.querySelector('#input-talla').value = data.talla || '';
    container.querySelector('#input-fecha_compra').value = data.fecha_compra || '';
    container.querySelector('#input-proveedor').value = data.proveedor || '';
    container.querySelector('#input-numero_factura').value = data.numero_factura || '';
    container.querySelector('#input-fecha_fabricacion').value = data.fecha_fabricacion || '';
    container.querySelector('#input-estado').value = data.estado || 'Disponible';
    container.querySelector('#input-fecha_ultima_inspeccion').value = data.fecha_ultima_inspeccion || '';
    container.querySelector('#input-resultado_inspeccion').value = data.resultado_inspeccion || '';
    container.querySelector('#input-fecha_proxima_inspeccion').value = data.fecha_proxima_inspeccion || '';
}

function resetForm(container) {
    currentRecordId = null;
    container.querySelector('#registro-form').reset();
    container.querySelector('#input-codigo').value = '';
    container.querySelector('#input-tipo_equipo').value = 'Arnes de cuerpo completo';
    container.querySelector('#input-estado').value = 'Disponible';
    container.querySelector('#group-norma-otra').style.display = 'none';
    container.querySelector('#btn-guardar').innerHTML = '<i data-lucide="save"></i> Guardar Arnés';
    container.querySelector('#historial-inspecciones-section').style.display = 'none';
    if (window.lucide) window.lucide.createIcons();
}

function setReadOnly(container, readonly) {
    container.querySelector('#form-fieldset').disabled = readonly;
    container.querySelector('#form-actions-container').style.display = readonly ? 'none' : 'flex';
}

async function saveRecord(container) {
    var btn = container.querySelector('#btn-guardar');
    var originalHtml = btn.innerHTML;
    btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></div> Guardando...';
    btn.disabled = true;

    try {
        var data = getFormData(container);
        var res;
        if (currentRecordId) {
            res = await updateInventario(currentRecordId, data);
        } else {
            res = await createInventario(data);
        }
        if (res.error) throw res.error;
        showToast(currentRecordId ? 'Arnés actualizado' : 'Arnés guardado', 'success');
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

async function refreshTable(container, force) {
    var tableContainer = container.querySelector('#table-container');
    var searchInput = container.querySelector('#table-search-input');

    if (force || !cachedInventario) {
        tableContainer.innerHTML = '<div style="text-align:center; padding:var(--space-8); color:var(--text-secondary);"><div class="spinner"></div> Cargando inventario...</div>';
        var result = await getAllInventario();
        if (result.error) {
            tableContainer.innerHTML = '<div style="text-align:center; padding:var(--space-8); color:var(--danger);">Error al cargar los datos.</div>';
            return;
        }
        cachedInventario = result.data || [];
    }

    var filteredData = cachedInventario;
    if (searchInput && searchInput.value.trim() !== '') {
        var term = searchInput.value.trim().toLowerCase();
        filteredData = cachedInventario.filter(function(item) {
            return (item.numero_inventario && item.numero_inventario.toLowerCase().includes(term))
                || (item.marca && item.marca.toLowerCase().includes(term));
        });
    }

    if (filteredData.length === 0) {
        tableContainer.innerHTML = '<div class="empty-state" style="padding:var(--space-8); text-align:center; color:var(--text-secondary); border: 1px dashed var(--border-default); border-radius:var(--radius-md);">No se encontraron arneses.</div>';
        return;
    }

    var columns = [
        { key: 'numero_inventario', label: 'N° Inventario', sortable: true },
        { key: 'marca', label: 'Marca', sortable: true },
        { key: 'talla', label: 'Talla', sortable: true },
        {
            key: 'estado', label: 'Estado', sortable: true,
            format: function(val) {
                var cls = 'badge-secondary';
                if (val === 'Disponible') cls = 'badge-success';
                else if (val === 'En uso') cls = 'badge-primary';
                else if (val === 'En inspeccion') cls = 'badge-warning';
                else if (val === 'Fuera de servicio' || val === 'Dado de baja') cls = 'badge-danger';
                return '<span class="badge ' + cls + '">' + (val || 'N/A') + '</span>';
            }
        }
    ];

    dataTableInstance = createDataTable({
        containerId: 'table-container',
        columns: columns,
        data: filteredData,
        pageSize: 10,
        onView: async function(record) {
            currentRecordId = record.id;
            setFormData(container, record);
            setReadOnly(container, true);
            await loadHistorial(container, record.codigo);
            container._showForm();
        },
        onEdit: async function(record) {
            currentRecordId = record.id;
            setFormData(container, record);
            setReadOnly(container, false);
            await loadHistorial(container, record.codigo);
            container._showForm();
        },
        onDelete: async function(record) {
            var confirmed = await showConfirmModal('Eliminar Arnés', 'Esta acción no se puede deshacer y borrará las inspecciones asociadas.');
            if (confirmed) {
                var res = await deleteInventario(record.id);
                if (res.error) {
                    showToast('Error al eliminar el arnés', 'error');
                } else {
                    showToast('Arnés eliminado', 'success');
                    await refreshTable(container, true);
                }
            }
        }
    });
}

async function loadHistorial(container, codigoArnes) {
    var historialSection = container.querySelector('#historial-inspecciones-section');
    var historialContainer = container.querySelector('#historial-lista-container');

    if (!codigoArnes) { historialSection.style.display = 'none'; return; }

    historialContainer.innerHTML = '<div style="text-align:center; padding:10px;"><div class="spinner" style="width:20px;height:20px;"></div></div>';
    historialSection.style.display = 'block';

    var result = await getArnesInspectionsHistory(codigoArnes);
    if (result.error) {
        historialContainer.innerHTML = '<div style="color:var(--danger); padding:10px;">Error al cargar el historial.</div>';
        return;
    }
    if (!result.data || result.data.length === 0) {
        historialContainer.innerHTML = '<div style="color:var(--text-secondary); padding:10px; font-style:italic;">No hay inspecciones registradas para este arnés.</div>';
        return;
    }

    var html = result.data.map(function(item) {
        var insp = item.inspecciones_arneses;
        if (!insp) return '';
        var fechaFormat = insp.fecha ? new Date(insp.fecha).toLocaleDateString() : 'Sin fecha';
        return '<div style="border-bottom: 1px solid var(--border-light); padding: 12px 0;">'
            + '<div style="display:flex; justify-content:space-between; margin-bottom:4px;">'
            + '<strong>' + fechaFormat + ' - ' + (insp.lugar_trabajo || 'Sin ubicación') + '</strong>'
            + '<span class="badge badge-secondary" style="font-size:10px;">Inspector: ' + (insp.inspector_nombre || '-') + '</span>'
            + '</div>'
            + (insp.observaciones_generales ? '<div style="font-size:12px; color:var(--text-secondary); margin-top:4px;"><strong>Obs:</strong> ' + insp.observaciones_generales + '</div>' : '')
            + '</div>';
    }).join('');

    historialContainer.innerHTML = html;
}
