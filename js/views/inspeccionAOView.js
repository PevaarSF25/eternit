import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { hasPermission } from '../auth.js';
import {
    getAllInspeccionesAO,
    getInspeccionAOById,
    createInspeccionAO,
    updateInspeccionAO,
    deleteInspeccionAO
} from '../services/inspeccionAOService.js';

let cachedInspecciones = null;

const SECCIONES = [
    {
        num: 'I',
        titulo: 'SEGURIDAD',
        items: [
            { key: 'seg_1', label: '¿La iluminación de los puestos de trabajo es suficiente para realizar tareas?' },
            { key: 'seg_2', label: '¿Los enchufes se encuentran en buen estado y bien ubicados?' },
            { key: 'seg_3', label: '¿Los cables eléctricos están en buen estado y protegidos?' },
            { key: 'seg_4', label: '¿Las sillas y escritorios están en buen estado y permiten posturas adecuadas?' },
            { key: 'seg_5', label: '¿Las ventanas cuentan con un sistema de apertura óptimo y los vidrios están en buen estado?' },
            { key: 'seg_6', label: '¿Los peldaños de las escaleras están en buen estado y cuentan con antideslizantes?' },
            { key: 'seg_7', label: '¿Las vías de evacuación y áreas están señalizadas?' },
            { key: 'seg_8', label: '¿Los extintores y equipos de contra incendios están bien ubicados y señalizados?' }
        ]
    },
    {
        num: 'II',
        titulo: 'ORDEN',
        items: [
            { key: 'ord_1', label: '¿Las vías de evacuación y de circulación están libres de material innecesario que puedan obstruir o dificultar el paso de personas, máquinas o equipos?' },
            { key: 'ord_2', label: '¿Los cajones y archivadores están en orden?' },
            { key: 'ord_3', label: '¿Los escritorios están libres de acumulación innecesaria de papeles?' },
            { key: 'ord_4', label: '¿Hay baños suficientes y están debidamente dotados?' },
            { key: 'ord_5', label: '¿Los escritorios o puestos de trabajo están bien distribuidos y ordenados?' },
            { key: 'ord_6', label: '¿Los techos se encuentran sin material innecesario (objetos colgantes, estructuras)?' }
        ]
    },
    {
        num: 'III',
        titulo: 'LIMPIEZA',
        items: [
            { key: 'lim_1', label: '¿El baño de mujeres y hombres están limpios y óptimos para su utilización?' },
            { key: 'lim_2', label: '¿Los equipos de oficina permanecen limpios?' },
            { key: 'lim_3', label: '¿Los pisos están limpios, secos y sin desperdicios?' },
            { key: 'lim_4', label: '¿Las paredes están libres de humedad y limpias?' },
            { key: 'lim_5', label: '¿Los techos están limpios y libres de goteras?' },
            { key: 'lim_6', label: '¿Se evidencia en el área que hay sistema de reciclaje?' }
        ]
    }
];

const ALL_KEYS = SECCIONES.flatMap(s => s.items.map(i => i.key));

function getEvaluaciones(container) {
    var result = {};
    ALL_KEYS.forEach(function(key) {
        var checked = container.querySelector('input[name="' + key + '"]:checked');
        result[key] = checked ? checked.value : null;
    });
    return result;
}

function setEvaluaciones(container, evaluaciones) {
    evaluaciones = evaluaciones || {};
    ALL_KEYS.forEach(function(key) {
        var val = evaluaciones[key];
        if (val) {
            var radio = container.querySelector('input[name="' + key + '"][value="' + val + '"]');
            if (radio) radio.checked = true;
        }
    });
}

function countSI(evaluaciones) {
    return ALL_KEYS.filter(function(k) { return evaluaciones[k] === 'SI'; }).length;
}
function countNO(evaluaciones) {
    return ALL_KEYS.filter(function(k) { return evaluaciones[k] === 'NO'; }).length;
}

function buildEvalTable(evaluaciones) {
    evaluaciones = evaluaciones || {};
    var thStyle = 'padding:8px 10px; text-align:center; font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-secondary); border-bottom:1px solid var(--border-default); border-right:1px solid var(--border-light); white-space:nowrap;';
    var html = '<table style="width:100%; border-collapse:collapse; font-size:13px;">'
        + '<thead><tr>'
        + '<th style="' + thStyle + ' text-align:left; width:40px;">No</th>'
        + '<th style="' + thStyle + ' text-align:left; width:auto;">DESCRIPCIÓN DE ASPECTOS A EVALUAR</th>'
        + '<th style="' + thStyle + ' width:60px;">SI</th>'
        + '<th style="' + thStyle + ' width:60px;">NO</th>'
        + '<th style="' + thStyle + ' width:60px; border-right:none;">N/A</th>'
        + '</tr></thead><tbody>';

    var globalIdx = 1;
    SECCIONES.forEach(function(sec) {
        html += '<tr style="background:var(--bg-hover);">'
            + '<td style="padding:8px 10px; font-weight:700; font-size:12px; color:var(--text-primary); border-bottom:1px solid var(--border-light); border-right:1px solid var(--border-light);">' + sec.num + '</td>'
            + '<td colspan="4" style="padding:8px 10px; font-weight:700; font-size:12px; letter-spacing:0.5px; color:var(--text-primary); border-bottom:1px solid var(--border-light);">' + sec.titulo + '</td>'
            + '</tr>';

        sec.items.forEach(function(item) {
            var tdStyle = 'padding:8px 10px; border-bottom:1px solid var(--border-light); border-right:1px solid var(--border-light); vertical-align:middle;';
            html += '<tr style="background:var(--bg-surface);">'
                + '<td style="' + tdStyle + ' color:var(--text-muted); font-size:12px; text-align:center;">' + globalIdx + '</td>'
                + '<td style="' + tdStyle + ' color:var(--text-primary);">' + item.label + '</td>'
                + '<td style="' + tdStyle + ' text-align:center;"><input type="radio" name="' + item.key + '" value="SI" style="accent-color:var(--success,#22c55e);"' + (evaluaciones[item.key] === 'SI' ? ' checked' : '') + '></td>'
                + '<td style="' + tdStyle + ' text-align:center;"><input type="radio" name="' + item.key + '" value="NO" style="accent-color:var(--danger,#ef4444);"' + (evaluaciones[item.key] === 'NO' ? ' checked' : '') + '></td>'
                + '<td style="padding:8px 10px; border-bottom:1px solid var(--border-light); text-align:center; vertical-align:middle;"><input type="radio" name="' + item.key + '" value="NA" style="accent-color:var(--text-muted);"' + (evaluaciones[item.key] === 'NA' ? ' checked' : '') + '></td>'
                + '</tr>';
            globalIdx++;
        });
    });

    html += '</tbody></table>';
    return html;
}

function getActionButtons(id) {
    var canEdit = hasPermission('EDIT_INSPECCION_AO');
    return '<div style="display:flex;align-items:center;justify-content:center;gap:6px;">'
        + '<button data-action="view" data-id="' + id + '" title="Ver" style="background:var(--accent-bg);border:1px solid var(--border-focus);border-radius:6px;padding:6px;cursor:pointer;color:var(--accent);display:flex;align-items:center;">'
        + '<i data-lucide="eye" style="width:14px;height:14px;"></i></button>'
        + (canEdit
            ? '<button data-action="edit" data-id="' + id + '" title="Editar" style="background:rgba(0,180,216,0.1);border:1px solid rgba(0,180,216,0.2);border-radius:6px;padding:6px;cursor:pointer;color:#00b4d8;display:flex;align-items:center;">'
            + '<i data-lucide="pencil" style="width:14px;height:14px;"></i></button>'
            + '<button data-action="delete" data-id="' + id + '" title="Eliminar" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:6px;padding:6px;cursor:pointer;color:#ef4444;display:flex;align-items:center;">'
            + '<i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>'
            : '')
        + '</div>';
}

export async function renderInspeccionAO(container) {
    container.innerHTML = `
    <div class="registro-container">
      <div class="registro-header" style="display:flex; flex-direction:column; align-items:stretch; gap:var(--space-4); margin-bottom:var(--space-6); width:100%;">
        <h2>Inspección A/O</h2>
        <div style="display:flex; align-items:center; width:100%; gap:12px; flex-wrap:wrap;">
          <div class="search-wrapper" id="table-search-wrapper" style="position:relative; flex:0 1 400px;">
            <input type="text" class="form-input" id="table-search-input" placeholder="Buscar por área, inspector, fecha..." style="width:100%; padding-left:40px; background-color:var(--bg-surface); border:1px solid var(--border-default);">
            <i data-lucide="search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted); width:16px; height:16px; pointer-events:none;"></i>
          </div>
          <button class="btn btn-primary btn-glow" id="btn-nuevo-registro" style="display:none; flex-shrink:0; white-space:nowrap; align-items:center; gap:6px; margin-left:auto;">
            <i data-lucide="plus" style="width:16px;height:16px;"></i> Nueva Inspección A/O
          </button>
        </div>
      </div>

      <!-- TABLE VIEW -->
      <div id="view-table">
        <div style="background:var(--bg-surface); border:1px solid var(--border-default); border-radius:12px; padding:var(--space-4); margin-bottom:var(--space-4);">
          <h3 style="margin:0 0 var(--space-4) 0; display:flex; align-items:center; gap:8px; font-size:15px; font-weight:600; color:var(--text-primary);">
            <i data-lucide="list" style="width:18px;height:18px;"></i> Inspecciones Guardadas
          </h3>
          <div id="table-container"></div>
        </div>
      </div>

      <!-- FORM VIEW -->
      <div id="view-form" style="display:none;">
        <div style="margin-bottom:var(--space-4);">
          <button id="btn-volver-tabla" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; gap:8px; font-weight:500; font-size:14px;">
            <i data-lucide="arrow-left" style="width:18px;height:18px;"></i> Volver a la tabla
          </button>
        </div>

        <form id="ao-form">
          <!-- Section 1: General -->
          <div class="card form-section" style="margin-bottom:var(--space-6);">
            <h3 class="form-section-title">1. Información General</h3>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Fecha de inspección *</label>
                <input type="date" class="form-input" id="ao-fecha" required>
              </div>
              <div class="form-group">
                <label class="form-label">Área</label>
                <input type="text" class="form-input" id="ao-area" placeholder="Ej: Administración">
              </div>
              <div class="form-group">
                <label class="form-label">Inspector</label>
                <input type="text" class="form-input" id="ao-inspector" placeholder="Nombre del inspector">
              </div>
              <div class="form-group" style="grid-column: 1 / -1;">
                <label class="form-label">Personas inspeccionadas</label>
                <input type="text" class="form-input" id="ao-personas" placeholder="Nombres de personas inspeccionadas">
              </div>
            </div>
          </div>

          <!-- Section 2: Evaluation -->
          <div class="card form-section" style="margin-bottom:var(--space-6); overflow-x:auto;">
            <h3 class="form-section-title" style="margin-bottom:var(--space-4);">2. Descripción de Aspectos a Evaluar</h3>
            <div id="eval-table-container"></div>
          </div>

          <!-- Section 3: Other observations -->
          <div class="card form-section" style="margin-bottom:var(--space-6);">
            <h3 class="form-section-title">3. Descripción de otra condición observada</h3>
            <div class="form-group" style="margin-bottom:0;">
              <textarea class="form-input" id="ao-otra-condicion" rows="4" placeholder="Describa aquí cualquier otra condición observada durante la inspección..." style="resize:vertical;"></textarea>
            </div>
          </div>

          <!-- Actions -->
          <div style="display:flex; gap:var(--space-3); justify-content:flex-end; padding-bottom:var(--space-6);">
            <button type="button" class="btn btn-secondary" id="btn-limpiar">Limpiar</button>
            <button type="submit" class="btn btn-primary btn-glow" id="btn-guardar">
              <i data-lucide="save" style="width:16px;height:16px;"></i> Guardar inspección
            </button>
          </div>
        </form>
      </div>
    </div>`;

    if (window.lucide) window.lucide.createIcons();

    const canEdit = hasPermission('EDIT_INSPECCION_AO');

    const viewTable = container.querySelector('#view-table');
    const viewForm = container.querySelector('#view-form');
    const tableContainer = container.querySelector('#table-container');
    const evalTableContainer = container.querySelector('#eval-table-container');
    const btnNuevo = container.querySelector('#btn-nuevo-registro');
    const btnVolver = container.querySelector('#btn-volver-tabla');
    const btnLimpiar = container.querySelector('#btn-limpiar');
    const form = container.querySelector('#ao-form');
    const inputFecha = container.querySelector('#ao-fecha');
    const inputArea = container.querySelector('#ao-area');
    const inputInspector = container.querySelector('#ao-inspector');
    const inputPersonas = container.querySelector('#ao-personas');
    const inputOtraCondicion = container.querySelector('#ao-otra-condicion');
    const searchInput = container.querySelector('#table-search-input');

    let currentId = null;
    let isReadOnly = false;

    if (canEdit) btnNuevo.style.display = 'inline-flex';

    // Render the evaluation table inside the form (once, so radios persist)
    evalTableContainer.innerHTML = buildEvalTable({});

    function showTable() {
        viewForm.style.display = 'none';
        viewTable.style.display = 'block';
        refreshTable();
    }

    function showFormView(readOnly) {
        isReadOnly = readOnly;
        viewTable.style.display = 'none';
        viewForm.style.display = 'block';
        // Toggle readonly on text inputs
        [inputFecha, inputArea, inputInspector, inputPersonas, inputOtraCondicion].forEach(function(el) {
            el.readOnly = readOnly;
            el.style.opacity = readOnly ? '0.75' : '';
        });
        container.querySelectorAll('#eval-table-container input[type="radio"]').forEach(function(r) {
            r.disabled = readOnly;
        });
        container.querySelector('#btn-guardar').style.display = readOnly ? 'none' : '';
        container.querySelector('#btn-limpiar').style.display = readOnly ? 'none' : '';
        if (window.lucide) window.lucide.createIcons();
    }

    function resetForm() {
        currentId = null;
        form.reset();
        // reset radios
        container.querySelectorAll('#eval-table-container input[type="radio"]').forEach(function(r) {
            r.checked = false;
        });
        // default date to today
        inputFecha.value = new Date().toISOString().slice(0, 10);
    }

    async function refreshTable() {
        tableContainer.innerHTML = '<div style="text-align:center; padding:48px; color:var(--text-secondary);"><div class="spinner"></div></div>';

        const res = await getAllInspeccionesAO();
        if (res.error) {
            tableContainer.innerHTML = '<p style="color:var(--danger); padding:16px;">Error al cargar: ' + res.error.message + '</p>';
            return;
        }
        cachedInspecciones = res.data || [];

        var query = (searchInput.value || '').trim().toLowerCase();
        var filtered = query
            ? cachedInspecciones.filter(function(r) {
                return (r.fecha || '').includes(query)
                    || (r.area || '').toLowerCase().includes(query)
                    || (r.inspector || '').toLowerCase().includes(query);
            })
            : cachedInspecciones;

        if (!filtered.length) {
            tableContainer.innerHTML = '<div style="text-align:center; padding:48px 24px; color:#5a6a7a; font-size:14px; border-radius:12px; border:1px solid var(--border-default); background:var(--bg-surface);">'
                + '<i data-lucide="inbox" style="width:48px;height:48px;margin-bottom:16px;opacity:0.4;display:block;margin-left:auto;margin-right:auto;"></i>'
                + '<p style="margin:0;">No hay inspecciones guardadas.</p></div>';
            if (window.lucide) window.lucide.createIcons({ nodes: [tableContainer] });
            return;
        }

        var thStyle = 'padding:8px 10px; text-align:left; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-secondary); border-bottom:1px solid var(--border-default); white-space:nowrap;';
        var tdStyle = 'padding:10px; font-size:13px; color:var(--text-secondary); border-bottom:1px solid var(--border-light); border-right:1px solid var(--border-light); white-space:nowrap; vertical-align:middle;';

        var rowsHtml = filtered.map(function(r) {
            var ev = r.evaluaciones || {};
            var si = countSI(ev);
            var no = countNO(ev);
            var total = ALL_KEYS.length;
            var scoreHtml = '<div style="display:flex;gap:6px;align-items:center;">'
                + '<span style="background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">SI ' + si + '</span>'
                + '<span style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">NO ' + no + '</span>'
                + '<span style="background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">N/A ' + (total - si - no) + '</span>'
                + '</div>';
            return '<tr style="background:var(--bg-surface);">'
                + '<td style="' + tdStyle + ' font-weight:600; color:var(--text-primary);">' + (r.fecha || '—') + '</td>'
                + '<td style="' + tdStyle + '">' + (r.area || '—') + '</td>'
                + '<td style="' + tdStyle + '">' + (r.inspector || '—') + '</td>'
                + '<td style="padding:10px; border-bottom:1px solid var(--border-light); vertical-align:middle;">' + scoreHtml + '</td>'
                + '<td style="padding:10px; text-align:center; border-bottom:1px solid var(--border-light); vertical-align:middle;">' + getActionButtons(r.id) + '</td>'
                + '</tr>';
        }).join('');

        tableContainer.innerHTML = '<div style="overflow-x:auto; border-radius:12px; border:1px solid var(--border-default); background:var(--bg-surface);">'
            + '<table style="width:100%; border-collapse:collapse;">'
            + '<thead><tr>'
            + '<th style="' + thStyle + '">FECHA</th>'
            + '<th style="' + thStyle + '">ÁREA</th>'
            + '<th style="' + thStyle + '">INSPECTOR</th>'
            + '<th style="' + thStyle + '">RESUMEN</th>'
            + '<th style="' + thStyle + ' text-align:center; width:110px;">ACCIONES</th>'
            + '</tr></thead>'
            + '<tbody>' + rowsHtml + '</tbody>'
            + '</table></div>';

        if (window.lucide) window.lucide.createIcons({ nodes: [tableContainer] });

        // Event delegation
        tableContainer.addEventListener('click', async function(e) {
            var btn = e.target.closest('[data-action]');
            if (!btn) return;
            var action = btn.dataset.action;
            var id = btn.dataset.id;
            var record = cachedInspecciones.find(function(r) { return r.id === id; });
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
                var res = await deleteInspeccionAO(id);
                if (res.error) { showToast('Error al eliminar: ' + res.error.message, 'error'); return; }
                cachedInspecciones = null;
                showToast('Inspección eliminada', 'success');
                refreshTable();
            }
        });
    }

    function fillForm(record) {
        inputFecha.value = record.fecha || '';
        inputArea.value = record.area || '';
        inputInspector.value = record.inspector || '';
        inputPersonas.value = record.personas_inspeccionadas || '';
        inputOtraCondicion.value = record.descripcion_otra_condicion || '';
        // Reset radios then set
        container.querySelectorAll('#eval-table-container input[type="radio"]').forEach(function(r) { r.checked = false; });
        setEvaluaciones(container.querySelector('#eval-table-container'), record.evaluaciones || {});
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isReadOnly) return;

        var fecha = inputFecha.value;
        if (!fecha) { showToast('La fecha es obligatoria', 'error'); inputFecha.focus(); return; }

        var payload = {
            fecha: fecha,
            area: inputArea.value.trim() || null,
            inspector: inputInspector.value.trim() || null,
            personas_inspeccionadas: inputPersonas.value.trim() || null,
            evaluaciones: getEvaluaciones(container.querySelector('#eval-table-container')),
            descripcion_otra_condicion: inputOtraCondicion.value.trim() || null
        };

        var btnGuardar = container.querySelector('#btn-guardar');
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> Guardando...';

        try {
            var res;
            if (currentId) {
                res = await updateInspeccionAO(currentId, payload);
            } else {
                res = await createInspeccionAO(payload);
            }
            if (res.error) { showToast('Error: ' + res.error.message, 'error'); return; }
            cachedInspecciones = null;
            showToast(currentId ? 'Inspección actualizada' : 'Inspección guardada', 'success');
            showTable();
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.innerHTML = '<i data-lucide="save" style="width:16px;height:16px;"></i> Guardar inspección';
            if (window.lucide) window.lucide.createIcons();
        }
    });

    btnNuevo.addEventListener('click', function() {
        resetForm();
        showFormView(false);
    });

    btnVolver.addEventListener('click', showTable);

    btnLimpiar.addEventListener('click', function() {
        resetForm();
    });

    var searchTimeout;
    searchInput.addEventListener('input', function() {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(refreshTable, 300);
    });

    // Initial render
    inputFecha.value = new Date().toISOString().slice(0, 10);
    showTable();
}
