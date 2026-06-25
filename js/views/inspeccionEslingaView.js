import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { hasPermission } from '../auth.js';
import { initDatePicker } from '../components/datePicker.js';
import {
    getAllInspeccionesEslinga,
    createInspeccionEslinga,
    updateInspeccionEslinga,
    deleteInspeccionEslinga
} from '../services/inspeccionEslingaService.js';

const SECCIONES = [
    {
        num: '1',
        titulo: 'La reata o cuerda de la eslinga se encuentran sin:',
        items: [
            { key: 'c1_1', subNum: '1.1', label: 'Desgaste excesivo?' },
            { key: 'c1_2', subNum: '1.2', label: 'Cortes?' },
            { key: 'c1_3', subNum: '1.3', label: 'Quemaduras?' },
            { key: 'c1_4', subNum: '1.4', label: 'Bordes deshilachados?' },
            { key: 'c1_5', subNum: '1.5', label: 'Otros daños?' }
        ]
    },
    {
        num: '2',
        titulo: 'Revisadas las costuras de la eslinga, se encuentran sin:',
        items: [
            { key: 'c2_1', subNum: '2.1', label: 'Desgarres?' },
            { key: 'c2_2', subNum: '2.2', label: 'Costuras están flojas?' },
            { key: 'c2_3', subNum: '2.3', label: 'Faltan puntadas en las costuras?' }
        ]
    },
    {
        num: '3',
        titulo: 'Las partes metálicas de la eslinga se encuentran sin:',
        items: [
            { key: 'c3_1',  subNum: '3.1',  label: 'Deformaciones?' },
            { key: 'c3_2',  subNum: '3.2',  label: 'Fracturas?' },
            { key: 'c3_3',  subNum: '3.3',  label: 'Grietas?' },
            { key: 'c3_4',  subNum: '3.4',  label: 'Corrosión?' },
            { key: 'c3_5',  subNum: '3.5',  label: 'Agujeros profundos?' },
            { key: 'c3_6',  subNum: '3.6',  label: 'Rebabas?' },
            { key: 'c3_7',  subNum: '3.7',  label: 'Bordes cortantes?' },
            { key: 'c3_8',  subNum: '3.8',  label: 'Piezas flojas?' },
            { key: 'c3_9',  subNum: '3.9',  label: 'Funcionamiento inadecuado?' },
            { key: 'c3_10', subNum: '3.10', label: 'Otros daños?' }
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

function getEstadoBadge(estado) {
    if (estado === 'aprobado')  return '<span style="background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">Aprobado</span>';
    if (estado === 'rechazado') return '<span style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">Rechazado</span>';
    return '<span style="background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">Pendiente</span>';
}

function getTipoLabel(tipo) {
    if (tipo === 'pre-operacional') return 'Pre-operacional / Programada';
    if (tipo === 'despues-caida')   return 'Después de una caída';
    if (tipo === 'periodica')       return 'Periódica (anual)';
    return '—';
}

function getActionButtons(id, canEdit) {
    return '<div style="display:flex;align-items:center;justify-content:center;gap:6px;">'
        + '<button data-action="view" data-id="' + id + '" title="Ver" style="background:var(--accent-bg);border:1px solid var(--border-focus);border-radius:6px;padding:6px;cursor:pointer;color:var(--accent);display:flex;align-items:center;"><i data-lucide="eye" style="width:14px;height:14px;"></i></button>'
        + (canEdit
            ? '<button data-action="edit" data-id="' + id + '" title="Editar" style="background:rgba(0,180,216,0.1);border:1px solid rgba(0,180,216,0.2);border-radius:6px;padding:6px;cursor:pointer;color:#00b4d8;display:flex;align-items:center;"><i data-lucide="pencil" style="width:14px;height:14px;"></i></button>'
            + '<button data-action="delete" data-id="' + id + '" title="Eliminar" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:6px;padding:6px;cursor:pointer;color:#ef4444;display:flex;align-items:center;"><i data-lucide="trash-2" style="width:14px;height:14px;"></i></button>'
            : '')
        + '</div>';
}

var TIPO_OPCIONES = [
    { val: 'pre-operacional', label: 'Pre-operacional o Programada', sub: '' },
    { val: 'despues-caida',   label: 'Después de una Caída', sub: 'Realizada por persona competente' },
    { val: 'periodica',       label: 'Periódica (anual)', sub: 'Realizada por persona competente' }
];

export async function renderInspeccionEslinga(container) {
    var evalState = {};
    var mediasRows = [];
    var currentId = null;
    var isReadOnly = false;
    var cachedData = null;

    container.innerHTML = `
    <div class="registro-container">
      <div class="registro-header" style="display:flex; flex-direction:column; align-items:stretch; gap:var(--space-4); margin-bottom:var(--space-6); width:100%;">
        <h2>Inspección Eslinga</h2>
        <div style="display:flex; align-items:center; width:100%; gap:12px; flex-wrap:wrap;">
          <div class="search-wrapper" style="position:relative; flex:0 1 400px;">
            <input type="text" class="form-input" id="table-search-input" placeholder="Buscar por inspector, fecha, tipo..." style="width:100%; padding-left:40px; background-color:var(--bg-surface); border:1px solid var(--border-default);">
            <i data-lucide="search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted); width:16px; height:16px; pointer-events:none;"></i>
          </div>
          <button class="btn btn-primary btn-glow" id="btn-nuevo-registro" style="display:none; flex-shrink:0; white-space:nowrap; align-items:center; gap:6px; margin-left:auto;">
            <i data-lucide="plus" style="width:16px;height:16px;"></i> Nueva Inspección
          </button>
        </div>
      </div>

      <!-- TABLE VIEW -->
      <div id="view-table">
        <div style="background:var(--bg-surface); border:1px solid var(--border-default); border-radius:12px; padding:var(--space-4);">
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

        <form id="eslinga-form">

          <!-- Card 1: Información General -->
          <div class="card form-section" style="margin-bottom:var(--space-6);">
            <h3 class="form-section-title">1. Información General</h3>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">Fecha de inspección *</label>
                <input type="text" class="form-input" id="esl-fecha" readonly placeholder="Seleccione fecha..." style="cursor:pointer;">
              </div>
              <div class="form-group">
                <label class="form-label">Inspector</label>
                <input type="text" class="form-input" id="esl-inspector" placeholder="Nombre del inspector">
              </div>
            </div>
            <div style="margin-top:var(--space-4);">
              <label class="form-label" style="margin-bottom:var(--space-3); display:block;">Tipo de inspección *</label>
              <div id="tipo-inspeccion-group" style="display:flex; gap:12px; flex-wrap:wrap;">
                ${TIPO_OPCIONES.map(function(t) {
                    return '<label class="tipo-card" data-val="' + t.val + '" style="cursor:pointer; display:flex; align-items:flex-start; gap:10px; padding:12px 16px; border:1.5px solid var(--border-default); border-radius:10px; background:var(--bg-surface); transition:all 0.15s; flex:1; min-width:180px; max-width:280px;">'
                        + '<input type="radio" name="tipo_inspeccion" value="' + t.val + '" style="margin-top:2px; accent-color:var(--accent); flex-shrink:0;">'
                        + '<div>'
                        + '<div style="font-size:13px; font-weight:600; color:var(--text-primary);">' + t.label + '</div>'
                        + (t.sub ? '<div style="font-size:11px; color:var(--text-muted); margin-top:2px;">' + t.sub + '</div>' : '')
                        + '</div>'
                        + '</label>';
                }).join('')}
              </div>
            </div>
          </div>

          <!-- Card 2: Evaluación -->
          <div class="card form-section" style="margin-bottom:var(--space-6); overflow-x:auto;">
            <h3 class="form-section-title" style="margin-bottom:var(--space-4);">2. Evaluación de la Eslinga</h3>
            <div id="eval-table-container"></div>
          </div>

          <!-- Card 3: Medidas de Intervención -->
          <div class="card form-section" style="margin-bottom:var(--space-6);">
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:var(--space-4);">
              <h3 class="form-section-title" style="margin:0;">3. Medidas de Intervención</h3>
              <button type="button" id="btn-add-medida" class="btn btn-secondary" style="font-size:13px; display:flex; align-items:center; gap:6px;">
                <i data-lucide="plus" style="width:14px;height:14px;"></i> Agregar medida
              </button>
            </div>
            <div style="overflow-x:auto;">
              <table style="width:100%; border-collapse:collapse; font-size:13px; min-width:860px; table-layout:fixed;">
                <colgroup>
                  <col style="width:80px;">
                  <col>
                  <col>
                  <col style="width:170px;">
                  <col style="width:160px;">
                  <col style="width:40px;">
                </colgroup>
                <thead>
                  <tr style="background:var(--bg-hover);">
                    <th style="padding:10px 12px; text-align:center; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-secondary); border-bottom:2px solid var(--border-default);">ITEM</th>
                    <th style="padding:10px 12px; text-align:left; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-secondary); border-bottom:2px solid var(--border-default);">DESCRIPCIÓN DE LA CONDICIÓN</th>
                    <th style="padding:10px 12px; text-align:left; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-secondary); border-bottom:2px solid var(--border-default);">MEDIDA DE CONTROL PROPUESTA</th>
                    <th style="padding:10px 12px; text-align:left; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-secondary); border-bottom:2px solid var(--border-default);">FECHA DE IMPLEMENTACIÓN</th>
                    <th style="padding:10px 12px; text-align:left; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-secondary); border-bottom:2px solid var(--border-default);">RESPONSABLE</th>
                    <th style="border-bottom:2px solid var(--border-default);"></th>
                  </tr>
                </thead>
                <tbody id="medidas-tbody"></tbody>
              </table>
              <div id="medidas-empty" style="text-align:center; padding:28px; color:var(--text-muted); font-size:13px; display:none;">
                Sin medidas registradas. Haz clic en "Agregar medida" para añadir una.
              </div>
            </div>
          </div>

          <!-- Card 4: Estado -->
          <div class="card form-section" style="margin-bottom:var(--space-6);">
            <h3 class="form-section-title">4. Estado de la Inspección</h3>
            <div class="form-group" style="max-width:280px; margin-bottom:0;">
              <label class="form-label">Resultado</label>
              <select class="form-input form-select" id="esl-estado">
                <option value="">— Pendiente —</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
          </div>

          <!-- Actions -->
          <div id="form-actions" style="display:flex; gap:var(--space-3); justify-content:flex-end; padding-bottom:var(--space-6);">
            <button type="button" class="btn btn-secondary" id="btn-limpiar">Limpiar</button>
            <button type="submit" class="btn btn-primary btn-glow" id="btn-guardar">
              <i data-lucide="save" style="width:16px;height:16px;"></i> Guardar inspección
            </button>
          </div>

        </form>
      </div>
    </div>`;

    if (window.lucide) window.lucide.createIcons();

    var canEdit = hasPermission('EDIT_INSPECCION_ESLINGA');

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
    var form           = container.querySelector('#eslinga-form');
    var inputFecha     = container.querySelector('#esl-fecha');
    var inputInspector = container.querySelector('#esl-inspector');
    var selectEstado   = container.querySelector('#esl-estado');
    var searchInput    = container.querySelector('#table-search-input');
    var formActions    = container.querySelector('#form-actions');

    if (canEdit) btnNuevo.style.display = 'inline-flex';

    initDatePicker(inputFecha, null, 'YYYY-MM-DD');

    // ── Tipo inspección card highlight ─────────────────────────────────────────
    function updateTipoCards() {
        container.querySelectorAll('.tipo-card').forEach(function(card) {
            var radio = card.querySelector('input[type="radio"]');
            if (radio.checked) {
                card.style.borderColor = 'var(--accent)';
                card.style.background = 'var(--accent-bg)';
            } else {
                card.style.borderColor = 'var(--border-default)';
                card.style.background = 'var(--bg-surface)';
            }
        });
    }

    container.querySelector('#tipo-inspeccion-group').addEventListener('change', updateTipoCards);

    // ── Eval table ─────────────────────────────────────────────────────────────
    function buildEvalTable() {
        var thStyle = 'padding:8px 12px; font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-secondary); border-bottom:2px solid var(--border-default); white-space:nowrap;';
        var html = '<table style="width:100%; border-collapse:collapse; font-size:13px;">'
            + '<thead><tr>'
            + '<th style="' + thStyle + ' text-align:center; width:60px;">ITEM</th>'
            + '<th style="' + thStyle + '">DESCRIPCIÓN</th>'
            + '<th style="' + thStyle + ' text-align:center; width:72px;">B</th>'
            + '<th style="' + thStyle + ' text-align:center; width:72px;">M</th>'
            + '<th style="' + thStyle + ' text-align:center; width:72px;">N/A</th>'
            + '</tr></thead><tbody>';

        SECCIONES.forEach(function(sec) {
            html += '<tr style="background:rgba(99,102,241,0.07);">'
                + '<td style="padding:8px 12px; font-weight:700; font-size:13px; color:var(--text-primary); border-bottom:1px solid var(--border-light); text-align:center;">' + sec.num + '</td>'
                + '<td colspan="4" style="padding:8px 12px; font-weight:700; font-size:12px; color:var(--text-primary); border-bottom:1px solid var(--border-light);">' + sec.titulo
                + ' <span style="margin-left:8px; font-size:11px; font-weight:400; opacity:0.5;">SI &nbsp;&nbsp; NO &nbsp;&nbsp; NA</span></td>'
                + '</tr>';
            sec.items.forEach(function(item) {
                var td = 'padding:9px 12px; border-bottom:1px solid var(--border-light); vertical-align:middle;';
                html += '<tr style="background:var(--bg-surface);">'
                    + '<td style="' + td + ' text-align:center; color:var(--text-muted); font-size:12px;">' + item.subNum + '</td>'
                    + '<td style="' + td + ' color:var(--text-primary);">' + item.label + '</td>'
                    + '<td style="' + td + ' text-align:center;"><button type="button" class="esl-eval-btn" data-key="' + item.key + '" data-val="B"  title="Buen estado"  style="' + getBtnStyle('B',  false) + '">B</button></td>'
                    + '<td style="' + td + ' text-align:center;"><button type="button" class="esl-eval-btn" data-key="' + item.key + '" data-val="M"  title="Mal estado"   style="' + getBtnStyle('M',  false) + '">M</button></td>'
                    + '<td style="' + td + ' text-align:center;"><button type="button" class="esl-eval-btn" data-key="' + item.key + '" data-val="NA" title="No aplica"    style="' + getBtnStyle('NA', false) + '">N/A</button></td>'
                    + '</tr>';
            });
        });

        html += '</tbody></table>';
        evalContainer.innerHTML = html;

        evalContainer.addEventListener('click', function(e) {
            var btn = e.target.closest('.esl-eval-btn');
            if (!btn) return;
            var key = btn.dataset.key;
            var val = btn.dataset.val;
            evalState[key] = (evalState[key] === val) ? null : val;
            updateEvalButtons(key);
        });
    }

    function updateEvalButtons(key) {
        var cur = evalState[key] || null;
        evalContainer.querySelectorAll('.esl-eval-btn[data-key="' + key + '"]').forEach(function(btn) {
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
    var _INPUT = 'width:100%; box-sizing:border-box; padding:7px 10px; font-size:13px; border:1px solid var(--border-default); border-radius:6px; background:var(--bg-input, var(--bg-surface)); color:var(--text-primary);';

    function saveMedidasFromDOM() {
        var rows = medidasTbody.querySelectorAll('tr');
        mediasRows = Array.from(rows).map(function(tr) {
            return {
                item:        tr.querySelector('.m-item').value,
                descripcion: tr.querySelector('.m-desc').value,
                medida:      tr.querySelector('.m-control').value,
                fecha:       tr.querySelector('.m-fecha').value,
                responsable: tr.querySelector('.m-resp').value
            };
        });
    }

    function renderMedidasTable(readonly) {
        var tdStyle = 'padding:6px 8px; border-bottom:1px solid var(--border-light); vertical-align:middle;';
        if (mediasRows.length === 0) {
            medidasTbody.innerHTML = '';
            medidasEmpty.style.display = 'block';
        } else {
            medidasEmpty.style.display = 'none';
            medidasTbody.innerHTML = mediasRows.map(function(row, i) {
                var ro = readonly ? ' readonly' : '';
                return '<tr>'
                    + '<td style="' + tdStyle + ' text-align:center;">'
                    +   '<input type="number" class="m-item" min="1" value="' + (row.item || '') + '" placeholder="N°"'
                    +   ' style="' + _INPUT + ' text-align:center; width:60px;"' + ro + '>'
                    + '</td>'
                    + '<td style="' + tdStyle + '"><input type="text" class="m-desc" value="' + _esc(row.descripcion) + '" placeholder="Descripción de la condición" style="' + _INPUT + '"' + ro + '></td>'
                    + '<td style="' + tdStyle + '"><input type="text" class="m-control" value="' + _esc(row.medida) + '" placeholder="Medida de control propuesta" style="' + _INPUT + '"' + ro + '></td>'
                    + '<td style="' + tdStyle + '"><input type="text" class="m-fecha" value="' + _esc(row.fecha) + '" placeholder="Seleccione fecha..." style="' + _INPUT + (readonly ? '' : ' cursor:pointer;') + '" readonly></td>'
                    + '<td style="' + tdStyle + '"><input type="text" class="m-resp" value="' + _esc(row.responsable) + '" placeholder="Responsable" style="' + _INPUT + '"' + ro + '></td>'
                    + '<td style="' + tdStyle + ' text-align:center;">'
                    + (readonly ? '' : '<button type="button" class="btn-del-medida" data-idx="' + i + '" title="Eliminar" style="background:rgba(239,68,68,0.1);border:1px solid rgba(239,68,68,0.2);border-radius:6px;width:28px;height:28px;cursor:pointer;color:#ef4444;font-size:16px;line-height:1;display:inline-flex;align-items:center;justify-content:center;">×</button>')
                    + '</td>'
                    + '</tr>';
            }).join('');
        }

        if (!readonly) {
            medidasTbody.querySelectorAll('.m-fecha').forEach(function(el) {
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

    function _esc(str) {
        return (str || '').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
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

        inputInspector.readOnly = readonly;
        inputInspector.style.opacity = readonly ? '0.75' : '';
        selectEstado.disabled = readonly;
        selectEstado.style.opacity = readonly ? '0.75' : '';

        container.querySelectorAll('input[name="tipo_inspeccion"]').forEach(function(r) {
            r.disabled = readonly;
        });
        container.querySelectorAll('.tipo-card').forEach(function(card) {
            card.style.cursor = readonly ? 'default' : 'pointer';
            card.style.opacity = readonly ? '0.8' : '';
        });

        evalContainer.querySelectorAll('.esl-eval-btn').forEach(function(b) {
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
        updateTipoCards();
    }

    // ── Saved inspections table ────────────────────────────────────────────────
    async function refreshTable() {
        tableContainer.innerHTML = '<div style="text-align:center; padding:48px; color:var(--text-secondary);"><div class="spinner"></div></div>';

        var res = await getAllInspeccionesEslinga();
        if (res.error) {
            tableContainer.innerHTML = '<p style="color:var(--danger); padding:16px;">Error al cargar: ' + res.error.message + '</p>';
            return;
        }
        cachedData = res.data || [];

        var query = (searchInput.value || '').trim().toLowerCase();
        var filtered = query
            ? cachedData.filter(function(r) {
                return (r.fecha || '').includes(query)
                    || (r.inspector || '').toLowerCase().includes(query)
                    || getTipoLabel(r.tipo_inspeccion).toLowerCase().includes(query);
            })
            : cachedData;

        if (!filtered.length) {
            tableContainer.innerHTML = '<div style="text-align:center; padding:48px 24px; color:#5a6a7a; font-size:14px; border-radius:12px; border:1px solid var(--border-default); background:var(--bg-surface);">'
                + '<i data-lucide="inbox" style="width:48px;height:48px;margin-bottom:16px;opacity:0.4;display:block;margin-left:auto;margin-right:auto;"></i>'
                + '<p style="margin:0;">No hay inspecciones guardadas.</p></div>';
            if (window.lucide) window.lucide.createIcons({ nodes: [tableContainer] });
            return;
        }

        var thStyle = 'padding:10px 12px; text-align:left; font-weight:600; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; color:var(--text-secondary); border-bottom:1px solid var(--border-default); white-space:nowrap;';
        var tdStyle = 'padding:10px 12px; font-size:13px; color:var(--text-secondary); border-bottom:1px solid var(--border-light); white-space:nowrap; vertical-align:middle;';

        var rows = filtered.map(function(r) {
            var ev = r.evaluaciones || {};
            var b  = countB(ev), m = countM(ev), na = ALL_KEYS.length - b - m;
            var scoreHtml = '<div style="display:flex;gap:6px;align-items:center;">'
                + '<span style="background:#dcfce7;color:#15803d;border:1px solid #86efac;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">B ' + b + '</span>'
                + '<span style="background:#fee2e2;color:#b91c1c;border:1px solid #fca5a5;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">M ' + m + '</span>'
                + '<span style="background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb;border-radius:20px;padding:2px 10px;font-size:11px;font-weight:700;">N/A ' + na + '</span>'
                + '</div>';
            return '<tr style="background:var(--bg-surface);">'
                + '<td style="' + tdStyle + ' font-weight:600; color:var(--text-primary);">' + (r.fecha || '—') + '</td>'
                + '<td style="' + tdStyle + '">' + (r.inspector || '—') + '</td>'
                + '<td style="' + tdStyle + '">' + getTipoLabel(r.tipo_inspeccion) + '</td>'
                + '<td style="padding:10px 12px; border-bottom:1px solid var(--border-light); vertical-align:middle;">' + getEstadoBadge(r.estado) + '</td>'
                + '<td style="padding:10px 12px; border-bottom:1px solid var(--border-light); vertical-align:middle;">' + scoreHtml + '</td>'
                + '<td style="padding:10px 12px; text-align:center; border-bottom:1px solid var(--border-light); vertical-align:middle;">' + getActionButtons(r.id, canEdit) + '</td>'
                + '</tr>';
        }).join('');

        tableContainer.innerHTML = '<div style="overflow-x:auto; border-radius:12px; border:1px solid var(--border-default); background:var(--bg-surface);">'
            + '<table style="width:100%; border-collapse:collapse;">'
            + '<thead><tr>'
            + '<th style="' + thStyle + '">FECHA</th>'
            + '<th style="' + thStyle + '">INSPECTOR</th>'
            + '<th style="' + thStyle + '">TIPO</th>'
            + '<th style="' + thStyle + '">ESTADO</th>'
            + '<th style="' + thStyle + '">RESUMEN</th>'
            + '<th style="' + thStyle + ' text-align:center; width:120px;">ACCIONES</th>'
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
                var delRes = await deleteInspeccionEslinga(id);
                if (delRes.error) { showToast('Error al eliminar: ' + delRes.error.message, 'error'); return; }
                cachedData = null;
                showToast('Inspección eliminada', 'success');
                refreshTable();
            }
        });
    }

    function fillForm(record) {
        inputFecha.value = record.fecha || '';
        inputInspector.value = record.inspector || '';
        selectEstado.value = record.estado || '';

        container.querySelectorAll('input[name="tipo_inspeccion"]').forEach(function(r) {
            r.checked = r.value === record.tipo_inspeccion;
        });
        updateTipoCards();

        setEvalState(record.evaluaciones || {});
        mediasRows = Array.isArray(record.medidas) ? record.medidas.slice() : [];
        renderMedidasTable(false);
    }

    // ── Save ───────────────────────────────────────────────────────────────────
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (isReadOnly) return;

        var fecha = inputFecha.value;
        if (!fecha) { showToast('La fecha es obligatoria', 'error'); return; }

        var tipoRadio = container.querySelector('input[name="tipo_inspeccion"]:checked');
        if (!tipoRadio) { showToast('Selecciona el tipo de inspección', 'error'); return; }

        saveMedidasFromDOM();

        var payload = {
            fecha: fecha,
            inspector: inputInspector.value.trim() || null,
            tipo_inspeccion: tipoRadio.value,
            evaluaciones: Object.assign({}, evalState),
            medidas: mediasRows,
            estado: selectEstado.value || null
        };

        var btnGuardar = container.querySelector('#btn-guardar');
        btnGuardar.disabled = true;
        btnGuardar.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px;"></div> Guardando...';

        try {
            var res = currentId
                ? await updateInspeccionEslinga(currentId, payload)
                : await createInspeccionEslinga(payload);
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

    showTable();
}
