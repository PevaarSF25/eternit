import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { createDataTable } from '../components/dataTable.js';
import { hasPermission } from '../auth.js';
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
    + '<h2>Equipos de Altura</h2>'
    + '<div style="display:flex; align-items:center; width:100%; gap: 12px; flex-wrap: wrap;">'
    + '<div class="search-wrapper" id="table-search-wrapper" style="position:relative; flex:0 1 400px;">'
    + '<input type="text" class="form-input" id="table-search-input" placeholder="Buscar por número, marca..." style="width:100%; padding-left:40px; background-color:var(--bg-surface); border:1px solid var(--border-default);">'
    + '<i data-lucide="search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted); width:16px; height:16px; pointer-events:none;"></i>'
    + '</div>'
    + '<button class="btn btn-primary btn-glow" id="btn-nuevo-registro" style="display:none; flex-shrink:0; white-space:nowrap; align-items:center; gap:6px; margin-left:auto;">'
    + '<i data-lucide="plus" style="width:16px;height:16px;"></i> Nuevo Equipo'
    + '</button>'
    + '</div>'
    + '</div>'
    + '<div id="view-table" class="registros-table-section card active-view">'
    + '<div class="table-header" style="margin-bottom:var(--space-4);">'
    + '<h3 class="card-title"><i data-lucide="list"></i> Equipos de Altura Registrados</h3>'
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
    + '<select class="form-select" id="input-norma_certificacion" name="norma_certificacion" required>'
    + '<option value="" disabled selected>Seleccione...</option>'
    + '</select></div>'
    + '<div class="form-group"><label for="input-capacidad_carga" class="form-label">Capacidad Máxima de Carga</label>'
    + '<input type="text" class="form-input" id="input-capacidad_carga" name="capacidad_carga" placeholder="Ej: 140 kg"></div>'
    + '<div class="form-group"><label for="input-numero_argollas" class="form-label">Número de Argollas</label>'
    + '<input type="number" class="form-input" id="input-numero_argollas" name="numero_argollas" min="0"></div>'
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

    // Card 5: Información de Inspecciones - removed per user request

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

    const normas = await getParametros('arnes_norma');
    const selectNorma = container.querySelector('#input-norma_certificacion');
    if (selectNorma) {
        if (normas.data && normas.data.length > 0) {
            selectNorma.innerHTML = '<option value="" disabled selected>Seleccione...</option>'
                + normas.data.map(function(p) {
                    return '<option value="' + p.valor + '">' + p.valor + '</option>';
                }).join('');
        } else {
            selectNorma.innerHTML = '<option value="" disabled selected>Seleccione...</option>';
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

    var showForm = function() {
        viewTable.style.display = 'none';
        btnNuevoRegistro.style.display = 'none';
        if (tableSearchWrapper) tableSearchWrapper.style.display = 'none';
        viewForm.style.display = 'block';
    };

    var canEdit = hasPermission('EDIT_INVENTARIO_ARNESES');

    var showTable = function() {
        viewForm.style.display = 'none';
        viewTable.style.display = 'block';
        if (canEdit) btnNuevoRegistro.style.display = 'inline-flex';
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

    // No specific listener needed for norma

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
        norma_certificacion: container.querySelector('#input-norma_certificacion').value || null,
        capacidad_carga: container.querySelector('#input-capacidad_carga').value || null,
        numero_argollas: container.querySelector('#input-numero_argollas').value || null,
        talla: container.querySelector('#input-talla').value || null,
        fecha_compra: container.querySelector('#input-fecha_compra').value || null,
        proveedor: container.querySelector('#input-proveedor').value || null,
        numero_factura: container.querySelector('#input-numero_factura').value || null,
        fecha_fabricacion: container.querySelector('#input-fecha_fabricacion').value || null,
        estado: container.querySelector('#input-estado').value
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
    container.querySelector('#input-norma_certificacion').value = data.norma_certificacion || '';
    container.querySelector('#input-capacidad_carga').value = data.capacidad_carga || '';
    container.querySelector('#input-numero_argollas').value = data.numero_argollas || '';
    container.querySelector('#input-talla').value = data.talla || '';
    container.querySelector('#input-fecha_compra').value = data.fecha_compra || '';
    container.querySelector('#input-proveedor').value = data.proveedor || '';
    container.querySelector('#input-numero_factura').value = data.numero_factura || '';
    container.querySelector('#input-fecha_fabricacion').value = data.fecha_fabricacion || '';
    container.querySelector('#input-estado').value = data.estado || 'Disponible';
}

function resetForm(container) {
    currentRecordId = null;
    container.querySelector('#registro-form').reset();
    container.querySelector('#input-codigo').value = '';
    container.querySelector('#input-tipo_equipo').value = 'Arnes de cuerpo completo';
    container.querySelector('#input-estado').value = 'Disponible';
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
    var canEdit = hasPermission('EDIT_INVENTARIO_ARNESES');
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
        { key: 'tipo_equipo', label: 'Tipo de Equipo', sortable: true },
        { key: 'marca', label: 'Marca', sortable: true },
        { key: 'fabricante', label: 'Fabricante', sortable: true },
        { key: 'talla', label: 'Talla', sortable: true },
        {
            key: 'estado', label: 'Estado Arneses', sortable: true,
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
        pageSize: 50,
        onView: async function(record) {
            currentRecordId = record.id;
            setFormData(container, record);
            setReadOnly(container, true);
            await loadHistorial(container, record.codigo);
            container._showForm();
        },
        onEdit: canEdit ? async function(record) {
            currentRecordId = record.id;
            setFormData(container, record);
            setReadOnly(container, false);
            await loadHistorial(container, record.codigo);
            container._showForm();
        } : undefined,
        onDelete: canEdit ? async function(record) {
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
        } : undefined
    });
}

async function loadHistorial(container, codigoArnes) {
    var historialSection = container.querySelector('#historial-inspecciones-section');
    var historialContainer = container.querySelector('#historial-lista-container');

    if (!codigoArnes) { historialSection.style.display = 'none'; return; }

    historialContainer.innerHTML = '<div style="text-align:center; padding:10px;"><div class="spinner" style="width:20px;height:20px;"></div></div>';
    historialSection.style.display = 'block';

    try {
        var result = await getArnesInspectionsHistory(codigoArnes);
        if (result.error) {
            historialContainer.innerHTML = '<div style="color:var(--danger); padding:10px; text-align:center;">Error al cargar el historial.</div>';
            return;
        }

        var history = result.data || [];
        if (history.length === 0) {
            historialContainer.innerHTML = `
                <div style="text-align:center; padding:32px 16px; color:var(--text-muted); font-size:13px; border-radius:8px; border:1px dashed var(--border-default); background:rgba(148,163,184,0.02);">
                    <i data-lucide="info" style="width:24px; height:24px; margin-bottom:8px; opacity:0.5; display:block; margin-left:auto; margin-right:auto;"></i>
                    <p style="margin:0;">No se registran inspecciones previas para este arnés.</p>
                </div>`;
            if (window.lucide) window.lucide.createIcons({ nodes: [historialContainer] });
            return;
        }

        var CATEGORIAS_EVALUACION = [
            {
                key: 'cintas',
                label: 'Cintas y Correas',
                short: 'CC',
                fields: [
                    'cintas_cortes', 'cintas_rasgaduras', 'cintas_deshilachados', 'cintas_quemaduras',
                    'cintas_deformaciones', 'cintas_abrasion', 'cintas_costuras_sueltas',
                    'cintas_costuras_rotas', 'cintas_dano_quimico', 'cintas_endurecimiento',
                    'cintas_decoloracion_uv', 'cintas_contaminantes'
                ]
            },
            {
                key: 'costuras',
                label: 'Costuras',
                short: 'CO',
                fields: [
                    'costuras_hilos_rotos', 'costuras_hilos_sueltos', 'costuras_incompletas',
                    'costuras_desgaste', 'costuras_alteraciones'
                ]
            },
            {
                key: 'hebillas',
                label: 'Hebillas y Ajustes',
                short: 'HA',
                fields: [
                    'hebillas_funcionamiento', 'hebillas_corrosion', 'hebillas_grietas',
                    'hebillas_deformaciones', 'hebillas_desgaste', 'hebillas_cierre', 'hebillas_bloqueo'
                ]
            },
            {
                key: 'argollas',
                label: 'Argollas (D-Rings)',
                short: 'AR',
                fields: [
                    'argollas_corrosion', 'argollas_fisuras', 'argollas_impactos',
                    'argollas_deformaciones', 'argollas_bordes_afilados', 'argollas_movimiento',
                    'argollas_desgaste'
                ]
            },
            {
                key: 'etiquetas',
                label: 'Etiquetas y Marcación',
                short: 'EM',
                fields: [
                    'etiquetas_legible', 'etiquetas_serie', 'etiquetas_fabricacion',
                    'etiquetas_certificaciones', 'etiquetas_advertencias'
                ]
            },
            {
                key: 'caida',
                label: 'Evidencia de Caída',
                short: 'EC',
                fields: [
                    'caida_indicador', 'caida_danos', 'caida_historial'
                ]
            },
            {
                key: 'general',
                label: 'Estado General',
                short: 'EG',
                fields: [
                    'general_limpieza', 'general_modificaciones', 'general_accesorios',
                    'general_almacenamiento', 'general_compatibilidad'
                ]
            }
        ];

        var thStyle = "padding:8px 10px; text-align:center; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-secondary); border-bottom:1px solid var(--border-default); white-space:nowrap; background:rgba(148,163,184,0.02);";
        var thLeftStyle = "padding:8px 12px; text-align:left; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-secondary); border-bottom:1px solid var(--border-default); white-space:nowrap; background:rgba(148,163,184,0.02);";
        var tdStyle = "padding:8px 10px; font-size:12px; color:var(--text-secondary); border-bottom:1px solid var(--border-light); vertical-align:middle; text-align:center;";
        var tdLeftStyle = "padding:8px 12px; font-size:12px; color:var(--text-secondary); border-bottom:1px solid var(--border-light); vertical-align:middle;";

        var headersHtml = `
            <th style="${thLeftStyle}">Fecha Inspección</th>
            <th style="${thLeftStyle}">Inspector</th>
            <th style="${thStyle}">Ver</th>
        `;
        CATEGORIAS_EVALUACION.forEach(function(cat) {
            headersHtml += `<th style="${thStyle}" title="${cat.label}">${cat.short}</th>`;
        });
        headersHtml += `<th style="${thStyle}">Resumen</th>`;

        var rowsHtml = '';
        history.forEach(function(item) {
            var insp = item.inspecciones_arneses || {};
            var fechaVal = insp.fecha || '—';
            var inspector = insp.inspector_nombre || 'Desconocido';
            var cargo = insp.inspector_cargo || '';
            var inspectorFull = '<strong>' + inspector + '</strong>' + (cargo ? '<span style="font-size:10px; color:var(--text-muted); display:block; margin-top:1px;">' + cargo + '</span>' : '');

            var bCount = 0;
            var mCount = 0;
            var nCount = 0;

            var elementCellsHtml = '';
            CATEGORIAS_EVALUACION.forEach(function(cat) {
                var isNa = item[cat.key + '_no_aplica'] === 'true' || item[cat.key + '_no_aplica'] === true;
                var isMal = !isNa && cat.fields.some(function(f) { return item[f] === 'Mal estado'; });
                
                var valLabel = 'Buen estado';
                var bg = '#dcfce7', color = '#166534', border = '1px solid #bbf7d0';

                if (isNa) {
                    valLabel = 'No aplica';
                    bg = '#f3f4f6';
                    color = '#6b7280';
                    border = '1px solid #e5e7eb';
                    nCount++;
                } else if (isMal) {
                    valLabel = 'Mal estado';
                    bg = '#fee2e2';
                    color = '#991b1b';
                    border = '1px solid #fecaca';
                    mCount++;
                } else {
                    bCount++;
                }

                elementCellsHtml += `
                    <td style="${tdStyle}">
                        <span title="${cat.label}: ${valLabel}" style="display:inline-flex; align-items:center; justify-content:center; width:26px; height:20px; border-radius:4px; font-weight:700; font-size:9px; cursor:help; transition:transform 0.15s; background:${bg}; color:${color}; border:${border};" onmouseover="this.style.transform='scale(1.2)'" onmouseout="this.style.transform='scale(1)'">${cat.short}</span>
                    </td>
                `;
            });

            var resumenHtml = '<div style="display:flex; flex-direction:column; gap:3px; align-items:center; min-width:52px;">';
            if (bCount > 0) resumenHtml += `<span style="padding:1px 5px; border-radius:4px; background:#e0f2fe; color:#0369a1; font-weight:700; font-size:9px; white-space:nowrap;">🟢 ${bCount}</span>`;
            if (mCount > 0) resumenHtml += `<span style="padding:1px 5px; border-radius:4px; background:#fee2e2; color:#b91c1c; font-weight:700; font-size:9px; white-space:nowrap;">🔴 ${mCount}</span>`;
            if (nCount > 0) resumenHtml += `<span style="padding:1px 5px; border-radius:4px; background:#f3f4f6; color:#4b5563; border:1px solid #e5e7eb; font-weight:700; font-size:9px; white-space:nowrap;">⚪ ${nCount}</span>`;
            resumenHtml += '</div>';

            var observ = insp.observaciones_generales ? '<div style="font-size:10px; font-style:italic; color:var(--text-muted); margin-top:3px;"><strong style="color:var(--text-secondary);">Obs:</strong> ' + insp.observaciones_generales + '</div>' : '';

            rowsHtml += `
                <tr>
                    <td style="${tdLeftStyle}">
                        <div style="font-weight:600; color:var(--text-primary); font-size:12px;">${fechaVal}</div>
                        ${observ}
                    </td>
                    <td style="${tdLeftStyle}">${inspectorFull}</td>
                    <td style="${tdStyle}">
                        <a href="#inspeccion-arneses" onclick="localStorage.setItem('view_inspeccion_id', '${item.inspeccion_id || ''}')" title="Ver Inspección" style="background:var(--accent-bg); border:1px solid var(--border-focus); border-radius:6px; padding:5px 7px; cursor:pointer; color:var(--accent); display:inline-flex; align-items:center;">
                            <i data-lucide="eye" style="width:14px; height:14px;"></i>
                        </a>
                    </td>
                    ${elementCellsHtml}
                    <td style="${tdStyle}">${resumenHtml}</td>
                </tr>
            `;
        });

        var tableHtml = `
            <div style="overflow-x:auto; border-radius:12px; border:1px solid var(--border-default); background:var(--bg-surface); margin-top:16px;">
                <table style="width:100%; border-collapse:collapse; font-family:'Inter',sans-serif;">
                    <thead><tr>${headersHtml}</tr></thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
        `;

        historialContainer.innerHTML = tableHtml;
        if (window.lucide) window.lucide.createIcons({ nodes: [historialContainer] });

    } catch (err) {
        console.error(err);
        historialContainer.innerHTML = '<div style="color:var(--danger); padding:10px; text-align:center;">Error inesperado al cargar el historial.</div>';
    }
}
