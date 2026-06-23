import { getAllRegistros, createRegistro, updateRegistro, deleteRegistro } from '../services/registroService.js';
import { hasPermission } from '../auth.js';
import { calcularTodosLosIndicadores } from '../services/calculoService.js';
import { getParametros } from '../services/parametricaService.js';
import { showToast } from '../components/toast.js';
import { showModal, showConfirmModal } from '../components/modal.js';
import { createDataTable } from '../components/dataTable.js';
import { initDatePicker } from '../components/datePicker.js';
import { MESES, INPUT_FIELDS, CALCULATED_FIELDS, crearRegistroVacio, getFieldDefinition } from '../models/incidente.js';
import { formatNumber, formatPercent } from '../utils/formatter.js';

let currentRecordId = null;
let dataTableInstance = null;
let currentComments = {};
let cachedRegistros = null;
let currentExportData = [];

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function downloadCSV(data) {
  if (!data || data.length === 0) {
    showToast('No hay datos para exportar', 'warning');
    return;
  }
  
  const headers = [
    'Anio', 'Mes', 'Tipo de vinculacion', 'Planta', 'Empresa', 
    'Trabajadores', 'HHT', 'DP', 'NM', 'FAI', 'MTI', 'MWD', 'LTI', 'Fatalidad',
    'Dias Inc. Elementia', 'Dias Inc. Ley', 'Dias Cargados',
    'Casos EG', 'Incapacidad EG', 'Casos EL',
    'Inc. Lesion', 'Inc. TIRF', 'Total Inc.', 'LTIF', 'TIRF', 'SR', 
    'Frec. Acc.', 'Sev. Acc.', '% Mort.'
  ];
  
  const csvRows = [];
  csvRows.push(headers.join(';'));
  
  data.forEach(r => {
    if (r.isSubtotal) return;
    
    const row = [
      r.anio ?? '',
      r.mes ?? '',
      r.tipo ?? '',
      r.planta ?? '',
      r.empresa ?? '',
      r.num_trabajadores ?? 0,
      r.hht ?? 0,
      r.dp ?? 0,
      r.nm ?? 0,
      r.fai ?? 0,
      r.mti ?? 0,
      r.mwd ?? 0,
      r.lti ?? 0,
      r.fatalidad ?? 0,
      r.dias_incapacidad_at_elementia ?? 0,
      r.dias_incapacidad_at_ley ?? 0,
      r.dias_cargados ?? 0,
      r.casos_eg ?? 0,
      r.incapacidad_eg ?? 0,
      r.casos_el ?? 0,
      r.incidentes_lesiones ?? 0,
      r.incidente_tirf ?? 0,
      r.total_incidentes ?? 0,
      r.ltif ?? 0,
      r.tirf ?? 0,
      r.sr ?? 0,
      r.frecuencia_accidentalidad ?? 0,
      r.severidad_accidentalidad ?? 0,
      r.proporcion_mortalidad ?? 0
    ];
    
    const escapedRow = row.map(v => {
      const s = String(v).replace(/"/g, '""');
      return s.includes(';') || s.includes('\n') || s.includes('"') ? `"${s}"` : s;
    });
    csvRows.push(escapedRow.join(';'));
  });
  
  const csvContent = "\ufeff" + csvRows.join("\n");
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `registro_sst_export_${new Date().toISOString().slice(0,10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function renderRegistro(container, modo = 'Directo') {
  container._currentModo = modo;
  // Build HTML
  container.innerHTML = `
    <div class="registro-container">
      <div class="registro-header" style="display:flex; flex-direction:column; align-items:stretch; gap:var(--space-4); margin-bottom:var(--space-6); width:100%;">

        <h2>Registro de Datos SST</h2>
        
        <!-- Controles de la cabecera: Buscador a la izquierda, Botones a la derecha -->
        <div style="display:flex; align-items:center; width:100%; gap: 12px; flex-wrap: wrap;">
          <div class="search-wrapper" id="table-search-wrapper" style="position:relative; flex:0 1 400px;">
            <input type="text" class="form-input" id="table-search-input" placeholder="Buscar por fecha, empresa, planta..." style="width:100%; padding-left:40px; background-color:var(--bg-surface); border:1px solid var(--border-default);">
            <i data-lucide="search" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted); width:16px; height:16px; pointer-events:none;"></i>
          </div>
          
          <!-- Filtros solo en vista General -->
          ${modo === 'Directo' ?
            '<div style="flex:0 1 150px;">' +
            '<select class="form-select" id="table-filter-anio" style="width:100%; background-color:var(--bg-surface); border:1px solid var(--border-default); padding: 8px 12px; border-radius: 6px; height: 42px;">' +
            '<option value="">Todos los a\u00f1os</option>' +
            '</select></div>' +
            '<div style="flex:0 1 150px;">' +
            '<select class="form-select" id="table-filter-tipo" style="width:100%; background-color:var(--bg-surface); border:1px solid var(--border-default); padding: 8px 12px; border-radius: 6px; height: 42px;">' +
            '<option value="">Todos los tipos</option>' +
            '<option value="Directo">Directo</option>' +
            '<option value="Contratista">Contratista</option>' +
            '</select></div>'
          : ''}

          <button class="btn btn-secondary" id="btn-exportar-csv" style="display:none; margin-left:auto; flex-shrink:0; white-space:nowrap; align-items:center; gap:6px;">
            <i data-lucide="download" style="width:16px;height:16px;"></i> Exportar CSV
          </button>
          <button class="btn btn-primary btn-glow" id="btn-nuevo-registro" style="display:none; flex-shrink:0; white-space:nowrap; align-items:center; gap:6px;">
            <i data-lucide="plus" style="width:16px;height:16px;"></i> Nuevo Registro
          </button>
        </div>
      </div>

      <!-- Tabla de Registros (Vista Principal) -->
      <div id="view-table" class="registros-table-section card active-view">
        <div class="table-header" style="margin-bottom:var(--space-4);">
          <h3 class="card-title"><i data-lucide="list"></i> Registros Guardados</h3>
        </div>
        <div id="table-container"></div>
      </div>

      <!-- Formulario de Registro (Vista Oculta Inicialmente) -->
      <div id="view-form" class="registro-form" style="display: none;">
        <div style="margin-bottom: var(--space-4);">
          <button class="btn-back" id="btn-volver-tabla" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; display:flex; align-items:center; gap:8px; font-weight:500;">
            <i data-lucide="arrow-left" style="width:18px;height:18px;"></i> Volver a la tabla
          </button>
        </div>

        <div style="display: flex; gap: var(--space-6);">
          <!-- Columna Izquierda: Formulario de entrada -->
          <div class="form-inputs-column" style="flex: 2;">
            <form id="registro-form">
              <fieldset id="form-fieldset" style="border:none; padding:0; margin:0;">
                
                <div class="card form-section" style="margin-bottom:var(--space-6)">
                  <h3 class="form-section-title">1. Información General</h3>
                  <div class="form-grid">
                    <div class="form-group">
                      <label for="tipo-select" class="form-label">Tipo de vinculación</label>
                      <select class="form-select" id="tipo-select" name="tipo_registro" disabled>
                        <option value="Directo" ${modo === 'Directo' ? 'selected' : ''}>Directo</option>
                        <option value="Contratista" ${modo === 'Contratista' ? 'selected' : ''}>Contratista</option>
                      </select>
                    </div>
                    ${renderSelect('planta', [])}
                    ${renderSelect('empresa', [])}
                    <div class="form-group">
                      <label for="input-periodo" class="form-label">Periodo (Mes y Año)</label>
                      <input type="text" class="form-input" id="input-periodo" name="periodo" required readonly placeholder="Seleccione periodo...">
                    </div>
                    ${renderInput('num_trabajadores')}
                    ${renderInput('hht')}
                  </div>
                </div>

                <div class="card form-section" style="margin-bottom:var(--space-6)">
                  <h3 class="form-section-title">2. Incidentes y Lesiones</h3>
                  <div class="form-grid">
                    ${renderInput('dp')}
                    ${renderInput('nm')}
                    ${renderInput('fai')}
                    ${renderInput('mti')}
                    ${renderInput('mwd')}
                    ${renderInput('lti')}
                    ${renderInput('fatalidad')}
                  </div>
                </div>

                <div class="card form-section">
                  <h3 class="form-section-title">3. Incapacidades y Ausentismo</h3>
                  <div class="form-grid">
                    ${renderInput('dias_incapacidad_at_elementia')}
                    ${renderInput('dias_incapacidad_at_ley')}
                    ${renderInput('dias_cargados')}
                    ${renderInput('casos_eg')}
                    ${renderInput('incapacidad_eg')}
                    ${renderInput('casos_el')}
                  </div>
                </div>

                <div class="form-actions" id="form-actions-container">
                  <button type="button" class="btn btn-secondary" id="btn-limpiar">
                    <i data-lucide="refresh-cw"></i> Limpiar
                  </button>
                  <button type="submit" class="btn btn-primary" id="btn-guardar">
                    <i data-lucide="save"></i> Guardar Registro
                  </button>
                </div>
              </fieldset>
            </form>
          </div>

          <!-- Columna Derecha: Indicadores calculados -->
          <div class="indicadores-column" style="flex: 1;">
            <div class="card indicadores-section" style="position:sticky; top:20px;">
              <h3 class="form-section-title" style="margin-bottom:0">Indicadores Calculados</h3>
              <p style="color:var(--color-text-secondary);font-size:var(--text-xs);margin-bottom:var(--space-4)">Se actualizan en tiempo real.</p>
              
              <div class="indicadores-grid">
                ${CALCULATED_FIELDS.map(f => `
                  <div class="indicador-item">
                    <span class="indicador-label">${f.label}</span>
                    <span class="indicador-value" id="calc-${f.key}">0.00</span>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Load types from parametricas
  await loadParametricas(container);

  // Initialize Date Picker
  const periodoInput = container.querySelector('#input-periodo');
  initDatePicker(periodoInput, () => {
    updateCalculatedFields(container);
  });

  // Bind events
  bindEvents(container);

  // Initial table load
  await refreshTable(container);
  
  // Set default values (e.g. current year)
  resetForm(container);
}

function renderInput(key) {
  const def = getFieldDefinition(key);
  if (!def) return '';
  return `
    <div class="form-group" style="position:relative;">
      <label for="input-${key}" class="form-label">${def.label}</label>
      <div style="display:flex; align-items:center; gap:8px;">
        <input type="number" class="form-input" id="input-${key}" name="${key}" min="0" step="any" style="flex:1;">
        <button type="button" class="btn-comment" data-key="${key}" title="Añadir comentario" style="background:none; border:none; cursor:pointer; color:var(--color-text-secondary); padding:4px;">
          <i data-lucide="message-square" style="width:18px;height:18px;"></i>
        </button>
      </div>
    </div>
  `;
}

function renderSelect(key, options) {
  const def = getFieldDefinition(key);
  if (!def) return '';
  return `
    <div class="form-group">
      <label for="input-${key}" class="form-label">${def.label}</label>
      <select class="form-select" id="input-${key}" name="${key}">
        <option value="" disabled selected>Seleccione...</option>
        ${options.map(o => `<option value="${o}">${o}</option>`).join('')}
      </select>
    </div>
  `;
}

async function loadParametricas(container) {
  const [ciudades, empresas] = await Promise.all([
    getParametros('ciudad'),
    getParametros('empresa')
  ]);

  const populateSelect = (selector, dataArray) => {
    const select = container.querySelector(selector);
    if (select && dataArray && dataArray.length > 0) {
      select.innerHTML = '<option value="" disabled selected>Seleccione...</option>' + 
                         dataArray.map(p => `<option value="${p.valor}">${p.valor}</option>`).join('');
    }
  };

  populateSelect('#input-planta', ciudades.data);
  populateSelect('#input-empresa', empresas.data);
}

function handleTabChange(container, tabValue) {
  const plantaFormGroup = container.querySelector('#input-planta')?.closest('.form-group');
  const empresaFormGroup = container.querySelector('#input-empresa')?.closest('.form-group');
  
  if (tabValue === 'Directo') {
    // Planta: show, Empresa: hide
    if (plantaFormGroup) plantaFormGroup.style.display = 'block';
    if (empresaFormGroup) empresaFormGroup.style.display = 'none';
    
    // Clear empresa value
    const inputEmpresa = container.querySelector('#input-empresa');
    if (inputEmpresa) inputEmpresa.value = '';
  } else {
    // Planta: hide, Empresa: show
    if (plantaFormGroup) plantaFormGroup.style.display = 'none';
    if (empresaFormGroup) empresaFormGroup.style.display = 'block';
    
    // Clear planta value
    const inputPlanta = container.querySelector('#input-planta');
    if (inputPlanta) inputPlanta.value = '';
  }
  
  updateCalculatedFields(container);
}function bindEvents(container) {
  const form = container.querySelector('#registro-form');
  const tipoSelect = container.querySelector('#tipo-select');
  const btnLimpiar = container.querySelector('#btn-limpiar');
  
  const btnNuevoRegistro = container.querySelector('#btn-nuevo-registro');
  const btnExportarCsv = container.querySelector('#btn-exportar-csv');
  const btnVolverTabla = container.querySelector('#btn-volver-tabla');
  const viewTable = container.querySelector('#view-table');
  const viewForm = container.querySelector('#view-form');

  const tableSearchWrapper = container.querySelector('#table-search-wrapper');
  const tableSearchInput = container.querySelector('#table-search-input');

  // Toggle views
  const showForm = () => {
    viewTable.style.display = 'none';
    btnNuevoRegistro.style.display = 'none';
    if (btnExportarCsv) btnExportarCsv.style.display = 'none';
    if (tableSearchWrapper) tableSearchWrapper.style.display = 'none';
    viewForm.style.display = 'block';
  };

  const _modo = container._currentModo || 'Directo';
  const permEdit = _modo === 'Directo' ? 'EDIT_ESTADISTICAS_GENERAL' : 'EDIT_ESTADISTICAS_CONTRATISTAS';
  const canEdit = hasPermission(permEdit);

  const showTable = () => {
    viewForm.style.display = 'none';
    viewTable.style.display = 'block';
    if (canEdit) btnNuevoRegistro.style.display = 'inline-flex';
    if (canEdit && btnExportarCsv) btnExportarCsv.style.display = 'inline-flex';
    if (tableSearchWrapper) tableSearchWrapper.style.display = 'block';
    refreshTable(container);
  };

  if (tableSearchInput) {
    tableSearchInput.addEventListener('input', debounce(() => {
      refreshTable(container);
    }, 300));
  }

  const tableFilterAnio = container.querySelector('#table-filter-anio');
  if (tableFilterAnio) {
    tableFilterAnio.addEventListener('change', () => {
      refreshTable(container);
    });
  }

  const tableFilterTipo = container.querySelector('#table-filter-tipo');
  if (tableFilterTipo) {
    tableFilterTipo.addEventListener('change', () => {
      refreshTable(container);
    });
  }

  if (btnExportarCsv) {
    btnExportarCsv.addEventListener('click', () => {
      downloadCSV(currentExportData);
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

  // Make showForm globally accessible for the edit/view buttons
  container._showForm = showForm;
  
  // Initially show table and buttons
  showTable();

  // Sincronizar select de tipo de registro
  if (tipoSelect) {
    tipoSelect.addEventListener('change', (e) => {
      const val = e.target.value;
      handleTabChange(container, val);
    });
  }
  
  // Recalculate indicators on input change
  const inputs = form.querySelectorAll('input, select');
  inputs.forEach(input => {
    input.addEventListener('input', () => updateCalculatedFields(container));
  });
  

  // Comentarios
  const btnComments = container.querySelectorAll('.btn-comment');
  btnComments.forEach(btn => {
    btn.addEventListener('click', () => {
      if(container.querySelector('#form-fieldset').disabled) return; // Prevent comments in read-only
      
      const key = btn.dataset.key;
      const currentText = currentComments[key] || '';
      
      showModal({
        title: `Comentario para ${getFieldDefinition(key).label}`,
        content: `
          <div style="margin:0;">
            <textarea id="comment-textarea" class="form-input" style="width:100%; min-height:100px; resize:vertical; background: #ffffff; border: 1px solid var(--border-default); color: var(--text-primary); padding: 12px; border-radius: 8px; font-family: inherit; font-size: 14px;" placeholder="Escribe un comentario aquí...">${currentText}</textarea>
          </div>
        `,
        confirmText: 'Guardar',
        cancelText: 'Cancelar'
      }).then((confirmed) => {
        if (confirmed) {
          const textarea = document.getElementById('comment-textarea');
          const text = textarea ? textarea.value : '';
          if (text.trim() === '') {
            delete currentComments[key];
            btn.style.color = 'var(--text-secondary)';
          } else {
            currentComments[key] = text.trim();
            btn.style.color = 'var(--danger)';
          }
          // Actualizar los campos calculados para reflejar cambios
          updateCalculatedFields(container);
        }
      });
    });
  });

  btnLimpiar.addEventListener('click', () => {
    resetForm(container);
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await saveRecord(container);
    showTable();
  });
}

function getFormData(container) {
  const data = crearRegistroVacio();
  
  const tipoSelect = container.querySelector('#tipo-select');
  const activeTabVal = tipoSelect ? tipoSelect.value : 'Directo';
  
  if (activeTabVal === 'Contratista') {
    data.tipo = 'Contratista';
    data.empresa = container.querySelector('#input-empresa').value || '';
    data.planta = ''; // No aplica en Contratista
  } else {
    data.tipo = 'Directo';
    data.planta = container.querySelector('#input-planta').value || '';
    data.empresa = ''; // No aplica en Directo
  }
  
  // Extract anio and mes from date picker
  const periodoInput = container.querySelector('#input-periodo');
  if (periodoInput && periodoInput.value) {
    const [yyyy, mm] = periodoInput.value.split('-');
    data.anio = parseInt(yyyy, 10);
    // mm is 01-12, MESES is 0-indexed
    data.mes = MESES[parseInt(mm, 10) - 1];
  } else {
    data.anio = null;
    data.mes = null;
  }
  
  data.comentarios = currentComments;
  
  INPUT_FIELDS.forEach(f => {
    if (f.key !== 'tipo' && f.key !== 'comentarios' && f.key !== 'planta' && f.key !== 'empresa' && f.key !== 'anio' && f.key !== 'mes') {
      const el = container.querySelector(`#input-${f.key}`);
      if (el) {
        if (el.value === '') {
          data[f.key] = null;
        } else {
          let val = el.value;
          if (f.type === 'integer') val = parseInt(val, 10);
          if (f.type === 'numeric') val = parseFloat(val);
          data[f.key] = isNaN(val) ? (f.type === 'select' ? el.value : null) : val;
        }
      }
    }
  });
  return data;
}

function updateCalculatedFields(container) {
  const data = getFormData(container);
  const calculated = calcularTodosLosIndicadores(data);
  
  CALCULATED_FIELDS.forEach(f => {
    const el = container.querySelector(`#calc-${f.key}`);
    if (el) {
      let valStr = '';
      if (f.key === 'proporcion_mortalidad') {
        valStr = formatPercent(calculated[f.key]);
      } else if (f.key === 'incidentes_lesiones' || f.key === 'total_incidentes') {
        valStr = Math.round(calculated[f.key]).toString();
      } else {
        valStr = formatNumber(calculated[f.key]);
      }
      
      // Animate if changed
      if (el.innerText !== valStr) {
        el.innerText = valStr;
        el.classList.add('changed');
        setTimeout(() => el.classList.remove('changed'), 500);
      }
    }
  });
}

function resetForm(container) {
  currentRecordId = null;
  currentComments = {};
  const form = container.querySelector('#registro-form');
  form.reset();
  
  // Set all numeric to empty
  INPUT_FIELDS.forEach(f => {
    if (f.key !== 'tipo' && f.key !== 'comentarios') {
      const el = container.querySelector(`#input-${f.key}`);
      if (el) el.value = '';
    }
  });
  
  // Reset comment buttons color
  container.querySelectorAll('.btn-comment').forEach(btn => {
    btn.style.color = 'var(--color-text-secondary)';
  });
  
  // Sincronizar el formulario con el estado de la pestaña activa en la cabecera
  const tipoSelect = container.querySelector('#tipo-select');
  const activeTabVal = tipoSelect ? tipoSelect.value : 'Directo';
  
  handleTabChange(container, activeTabVal);
  
  container.querySelector('#btn-guardar').innerHTML = '<i data-lucide="save"></i> Guardar Registro';
  if (window.lucide) window.lucide.createIcons();
  
  updateCalculatedFields(container);
}

async function saveRecord(container) {
  const btn = container.querySelector('#btn-guardar');
  const originalHtml = btn.innerHTML;
  btn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></div> Guardando...';
  btn.disabled = true;

  try {
    const data = getFormData(container);
    
    let res;
    if (currentRecordId) {
      res = await updateRegistro(currentRecordId, data);
    } else {
      res = await createRegistro(data);
    }

    if (res.error) throw res.error;

    showToast(currentRecordId ? 'Registro actualizado' : 'Registro guardado', 'success');
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

async function refreshTable(container, forceFetch = false) {
  const _modo = container._currentModo || 'Directo';
  const _permEdit = _modo === 'Directo' ? 'EDIT_ESTADISTICAS_GENERAL' : 'EDIT_ESTADISTICAS_CONTRATISTAS';
  const canEdit = hasPermission(_permEdit);
  const tableContainer = container.querySelector('#table-container');
  
  // Show loading
  if (!dataTableInstance) {
    tableContainer.innerHTML = '<div class="spinner" style="margin:20px auto"></div>';
  }

  if (forceFetch || !cachedRegistros) {
    const res = await getAllRegistros();
    if (res.error) {
      tableContainer.innerHTML = `<p style="color:var(--color-danger)">Error: ${res.error.message}</p>`;
      return;
    }
    cachedRegistros = res.data || [];
  }

  // Poblar dinámicamente el filtro de años
  const filterAnioSelect = container.querySelector('#table-filter-anio');
  if (filterAnioSelect) {
    const prevValue = filterAnioSelect.value;
    const yearsInData = [...new Set(cachedRegistros.map(r => r.anio).filter(a => a != null))].sort((a, b) => b - a);
    filterAnioSelect.innerHTML = '<option value="">Todos los años</option>' +
      yearsInData.map(y => `<option value="${y}"${String(y) === prevValue ? ' selected' : ''}>${y}</option>`).join('');
  }

  const modo = container._currentModo || 'Directo';
  const MES_ORDEN = { 'Enero': 1, 'Febrero': 2, 'Marzo': 3, 'Abril': 4, 'Mayo': 5, 'Junio': 6, 'Julio': 7, 'Agosto': 8, 'Septiembre': 9, 'Octubre': 10, 'Noviembre': 11, 'Diciembre': 12 };

  // Helper functions
  const getTipoWeight = (tipo) => {
    if (tipo === 'Directo') return 1;
    return 2;
  };

  const injectYearlySubtotals = (records) => {
    const sorted = [...records].sort((a, b) => {
      // 1. Year Descending
      if (b.anio !== a.anio) return b.anio - a.anio;

      // 2. Tipo (Directo before Contratista)
      const wA = getTipoWeight(a.tipo);
      const wB = getTipoWeight(b.tipo);
      if (wA !== wB) return wA - wB;

      // 3. Month Descending
      const mesA = MES_ORDEN[a.mes] ?? 99;
      const mesB = MES_ORDEN[b.mes] ?? 99;
      return mesB - mesA;
    });

    const result = [];
    let currentYear = null;
    let currentType = null;
    let group = [];

    const addYearSubtotal = (yearGroup, year, type) => {
      if (yearGroup.length === 0) return;

      if (type === 'Contratista (Acum)' || type === 'Contratista') {
        result.push(...yearGroup);
        return;
      }

      const yearSum = {
        fai: 0, mti: 0, mwd: 0, lti: 0, dp: 0, nm: 0, hht: 0,
        num_trabajadores: 0, fatalidad: 0,
        dias_incapacidad_at_elementia: 0, dias_incapacidad_at_ley: 0,
        dias_cargados: 0, casos_eg: 0, incapacidad_eg: 0, casos_el: 0
      };

      yearGroup.forEach(r => {
        Object.keys(yearSum).forEach(key => {
          yearSum[key] += (Number(r[key]) || 0);
        });
      });

      const monthsCount = yearGroup.length;
      yearSum.num_trabajadores = monthsCount > 0 ? yearSum.num_trabajadores / monthsCount : 0;

      const indicators = calcularTodosLosIndicadores(yearSum);

      result.push(...yearGroup);
      result.push({
        isSubtotal: true,
        anio: year,
        mes: 'Acumulado',
        tipo: type,
        planta: '-',
        empresa: 'Acumulado',
        ...yearSum,
        ...indicators
      });
    };

    sorted.forEach(r => {
      if (r.anio !== currentYear || r.tipo !== currentType) {
        if (currentYear !== null && currentType !== null) {
          addYearSubtotal(group, currentYear, currentType);
        }
        group = [r];
        currentYear = r.anio;
        currentType = r.tipo;
      } else {
        group.push(r);
      }
    });

    if (group.length > 0) {
      addYearSubtotal(group, currentYear, currentType);
    }

    return result;
  };

  const calculateFooterRow = (records, title = 'Acumulado General') => {
    const sumData = {
      fai: 0, mti: 0, mwd: 0, lti: 0, dp: 0, nm: 0, hht: 0,
      num_trabajadores: 0, fatalidad: 0,
      dias_incapacidad_at_elementia: 0, dias_incapacidad_at_ley: 0,
      dias_cargados: 0, casos_eg: 0, incapacidad_eg: 0, casos_el: 0
    };

    records.forEach(r => {
      Object.keys(sumData).forEach(key => {
        sumData[key] += (Number(r[key]) || 0);
      });
    });

    const monthsCount = records.length;
    sumData.num_trabajadores = monthsCount > 0 ? sumData.num_trabajadores / monthsCount : 0;

    const sumIndicators = calcularTodosLosIndicadores(sumData);
    return {
      anio: title,
      mes: '-',
      tipo: '-',
      planta: '-',
      empresa: '-',
      num_trabajadores: sumData.num_trabajadores,
      hht: sumData.hht,
      ...sumData,
      ...sumIndicators
    };
  };

  const searchInput = container.querySelector('#table-search-input');
  const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
  
  const filterTipoSelect = container.querySelector('#table-filter-tipo');
  const selectedAnio = filterAnioSelect ? filterAnioSelect.value : '';
  const selectedTipo = filterTipoSelect ? filterTipoSelect.value : '';

  const filterByQuery = (records) => {
    return records.filter(r => {
      // Filtrar por Año (exacto)
      if (selectedAnio && String(r.anio) !== selectedAnio) return false;
      // Filtrar por Tipo (exacto)
      if (selectedTipo && String(r.tipo) !== selectedTipo) return false;

      // Filtrar por Búsqueda de texto (parcial)
      if (query) {
        const anioStr = String(r.anio || '').toLowerCase();
        const mesStr = String(r.mes || '').toLowerCase();
        const plantaStr = String(r.planta || '').toLowerCase();
        const empresaStr = String(r.empresa || '').toLowerCase();
        const tipoStr = String(r.tipo || '').toLowerCase();
        const dateCombined = `${mesStr} ${anioStr}`;
        const matchQuery = anioStr.includes(query) ||
               mesStr.includes(query) ||
               plantaStr.includes(query) ||
               empresaStr.includes(query) ||
               tipoStr.includes(query) ||
               dateCombined.includes(query);
        if (!matchQuery) return false;
      }
      
      return true;
    });
  };

  // Clear existing data table instance
  if (dataTableInstance) {
    dataTableInstance.destroy();
    dataTableInstance = null;
  }

  // Column definitions
  const columns = [];
  columns.push({ 
    key: 'mes', 
    label: 'PERIODO', 
    format: (v, r) => {
      if (r.isSubtotal) {
        if (modo === 'Directo') {
          return `<strong>Acumulado ${r.tipo} ${r.anio}</strong>`;
        } else {
          return `<strong>Acumulado ${r.mes} ${r.anio}</strong>`;
        }
      }
      return `${r.mes} ${r.anio}`;
    } 
  });

  if (modo === 'Directo') {
    columns.push({ 
      key: 'tipo', 
      label: 'TIPO', 
      width: '160px',
      format: (v, r) => {
        if (r.isSubtotal) {
          if (r.tipo === 'Contratista') {
            return `<span style="background: rgba(255, 209, 102, 0.15); color: #b08110; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; border: 1px solid rgba(255, 209, 102, 0.4); display: inline-block;">CONTR. ACUM</span>`;
          }
          return `<span style="background: rgba(0, 180, 216, 0.08); color: #00b4d8; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; border: 1px solid rgba(0, 180, 216, 0.2); display: inline-block;">DIR. ACUM</span>`;
        }
        if (r.isContratistaAcumulado || r.tipo === 'Contratista') {
          return `<span style="background: rgba(255, 209, 102, 0.2); color: #b08110; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; border: 1px solid rgba(255, 209, 102, 0.4); display: inline-block;">CONTRATISTA</span>`;
        }
        return `<span style="background: rgba(0, 180, 216, 0.1); color: #00b4d8; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; border: 1px solid rgba(0, 180, 216, 0.2); display: inline-block;">DIRECTO</span>`;
      }
    });
  }

  if (modo === 'Contratista') {
    columns.push({ key: 'empresa', label: 'EMPRESA', width: '220px', format: (v) => v || '-' });
  }

  columns.push(
    { key: 'num_trabajadores', label: '<span title="Trabajadores">TRAB.</span>' },
    { key: 'hht', label: 'HHT', format: (v) => formatNumber(v, 0) },
    { key: 'incidentes_lesiones', label: '<span title="Incidentes con Lesión">LESIÓN</span>', format: (v) => formatNumber(v, 0) },
    { key: 'incidente_tirf', label: '<span title="Incidentes TIRF">TIRF</span>', format: (v) => formatNumber(v, 0) },
    { key: 'total_incidentes', label: '<span title="Total Incidentes">INC.</span>', format: (v) => formatNumber(v, 0) },
    { key: 'ltif', label: '<span title="Lost Time Injury Frequency Rate">LTIF</span>', format: (v) => formatNumber(v) },
    { key: 'tirf', label: '<span title="Total Recordable Injury Frequency Rate">TIRF</span>', format: (v) => formatNumber(v) },
    { key: 'sr', label: '<span title="Severity Rate">SR</span>', format: (v) => formatNumber(v) },
    { key: 'frecuencia_accidentalidad', label: '<span title="Frecuencia de Accidentalidad">Frec. Acc.</span>', format: (v) => formatNumber(v) },
    { key: 'severidad_accidentalidad', label: '<span title="Severidad de Accidentalidad">Sev. Acc.</span>', format: (v) => formatNumber(v) },
    { key: 'proporcion_mortalidad', label: '<span title="Proporción de Mortalidad">% Mort.</span>', format: (v) => formatPercent(v) }
  );

  if (modo === 'Directo') {
    // ----------------------------------------------------
    // VISTA GENERAL: replica pestaña "Data Directo" del Excel
    // Estructura por año DESC:
    //   - Todos los meses de DIRECTO (ASC) + fila Acum año
    //   - Todos los meses de CONTRATISTA acum/mes (ASC) + fila Acum año
    // ----------------------------------------------------
    tableContainer.innerHTML = '';

    // --- 1. Registros DIRECTO ---
    const directoAll = cachedRegistros
      .filter(r => r.tipo === 'Directo')
      .map(r => ({ ...r, ...calcularTodosLosIndicadores(r) }));

    // --- 2. Registros CONTRATISTA: sumar por año+mes (de la pantalla Contratistas) ---
    // Mapa de meses abreviados → nombre completo (por si los datos históricos vienen abreviados)
    const MES_NORMALIZE = {
      'Ene': 'Enero',   'Jan': 'Enero',
      'Feb': 'Febrero',
      'Mar': 'Marzo',
      'Abr': 'Abril',   'Apr': 'Abril',
      'May': 'Mayo',
      'Jun': 'Junio',
      'Jul': 'Julio',
      'Ago': 'Agosto',  'Aug': 'Agosto',
      'Sep': 'Septiembre', 'Sept': 'Septiembre',
      'Oct': 'Octubre',
      'Nov': 'Noviembre',
      'Dic': 'Diciembre', 'Dec': 'Diciembre'
    };

    const normalizeMes = (mes) => MES_NORMALIZE[mes] || mes;

    // Filtrar solo registros de tipo Contratista con mes real (excluir 'Acum' o nulos)
    const MESES_VALIDOS = new Set([
      'Enero','Febrero','Marzo','Abril','Mayo','Junio',
      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre',
      // También abreviados por si acaso
      'Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Sept','Oct','Nov','Dic'
    ]);

    const contratistaAll = cachedRegistros.filter(r =>
      r.tipo === 'Contratista' &&
      r.mes &&
      MESES_VALIDOS.has(r.mes) // excluye 'Acum', null, undefined, etc.
    );

    const contratistaByYearMonth = {}; // key: "anio__mesCompleto"

    contratistaAll.forEach(r => {
      const mesNorm = normalizeMes(r.mes); // siempre nombre completo
      const key = `${r.anio}__${mesNorm}`;
      if (!contratistaByYearMonth[key]) {
        contratistaByYearMonth[key] = {
          isContratistaAcumulado: true,
          readonlyAction: true,
          anio: r.anio,
          mes: mesNorm, // guardamos el nombre completo
          tipo: 'Contratista',
          planta: '-',
          empresa: 'Acumulado',
          num_trabajadores: 0, hht: 0, dp: 0, nm: 0, fai: 0, mti: 0,
          mwd: 0, lti: 0, fatalidad: 0,
          dias_incapacidad_at_elementia: 0, dias_incapacidad_at_ley: 0,
          dias_cargados: 0, casos_eg: 0, incapacidad_eg: 0, casos_el: 0
        };
      }
      const g = contratistaByYearMonth[key];
      ['num_trabajadores','hht','dp','nm','fai','mti','mwd','lti','fatalidad',
       'dias_incapacidad_at_elementia','dias_incapacidad_at_ley','dias_cargados',
       'casos_eg','incapacidad_eg','casos_el'].forEach(f => {
        g[f] += (Number(r[f]) || 0);
      });
    });

    // Calcular indicadores de cada fila Contratista mensual acumulada
    const contratistaMonthlyRows = Object.values(contratistaByYearMonth).map(g => ({
      ...g,
      ...calcularTodosLosIndicadores(g)
    }));

    // --- 3. Obtener todos los años presentes en ambos ---
    const allYears = [...new Set([
      ...directoAll.map(r => r.anio),
      ...contratistaMonthlyRows.map(r => r.anio)
    ])].sort((a, b) => b - a); // DESC

    // Helper: suma anual de un array de filas
    const sumRowsForYear = (rows, year, tipo) => {
      const filtered = rows.filter(r => r.anio === year);
      if (filtered.length === 0) return null;
      const sum = {
        fai: 0, mti: 0, mwd: 0, lti: 0, dp: 0, nm: 0, hht: 0,
        num_trabajadores: 0, fatalidad: 0,
        dias_incapacidad_at_elementia: 0, dias_incapacidad_at_ley: 0,
        dias_cargados: 0, casos_eg: 0, incapacidad_eg: 0, casos_el: 0
      };
      filtered.forEach(r => {
        Object.keys(sum).forEach(k => { sum[k] += (Number(r[k]) || 0); });
      });
      // Promedio trabajadores
      sum.num_trabajadores = filtered.length > 0 ? sum.num_trabajadores / filtered.length : 0;
      const indicators = calcularTodosLosIndicadores(sum);
      return {
        isSubtotal: true,
        isContratistaAcumulado: tipo === 'Contratista',
        readonlyAction: true,
        anio: year,
        mes: 'Acumulado',
        tipo: tipo,
        planta: '-',
        empresa: 'Acumulado',
        ...sum,
        ...indicators
      };
    };

    // --- 4. Construir filas finales ordenadas ---
    const finalRows = [];

    allYears.forEach(year => {
      // --- Bloque DIRECTO del año ---
      const directoYear = directoAll
        .filter(r => r.anio === year)
        .sort((a, b) => (MES_ORDEN[a.mes] ?? 99) - (MES_ORDEN[b.mes] ?? 99));

      if (directoYear.length > 0) {
        finalRows.push(...directoYear);
        const acumDirecto = sumRowsForYear(directoAll, year, 'Directo');
        if (acumDirecto) finalRows.push(acumDirecto);
      }

      // --- Bloque CONTRATISTA del año (acumulado mensual) ---
      const contratistaYear = contratistaMonthlyRows
        .filter(r => r.anio === year)
        .sort((a, b) => (MES_ORDEN[a.mes] ?? 99) - (MES_ORDEN[b.mes] ?? 99));

      if (contratistaYear.length > 0) {
        finalRows.push(...contratistaYear);
        const acumContratista = sumRowsForYear(contratistaMonthlyRows, year, 'Contratista');
        if (acumContratista) finalRows.push(acumContratista);
      }
    });

    // --- 5. Aplicar filtros de búsqueda/año/tipo ---
    const baseForFilter = [
      ...directoAll,
      ...contratistaMonthlyRows
    ];
    const filteredBase = filterByQuery(baseForFilter);

    // Si hay filtros activos, reconstruir filas CON subtotales recalculados
    let displayRows = finalRows;
    if (selectedAnio || selectedTipo || query) {
      // Separar registros filtrados por tipo
      const filteredDirecto = filteredBase.filter(r => !r.isContratistaAcumulado);
      const filteredContratista = filteredBase.filter(r => r.isContratistaAcumulado);

      // Obtener años presentes en los datos filtrados
      const filteredYears = [...new Set([
        ...filteredDirecto.map(r => r.anio),
        ...filteredContratista.map(r => r.anio)
      ])].sort((a, b) => b - a);

      displayRows = [];
      filteredYears.forEach(year => {
        // Bloque DIRECTO filtrado del año
        const directoYear = filteredDirecto
          .filter(r => r.anio === year)
          .sort((a, b) => (MES_ORDEN[a.mes] ?? 99) - (MES_ORDEN[b.mes] ?? 99));

        if (directoYear.length > 0) {
          displayRows.push(...directoYear);
          const acumDirecto = sumRowsForYear(filteredDirecto, year, 'Directo');
          if (acumDirecto) displayRows.push(acumDirecto);
        }

        // Bloque CONTRATISTA filtrado del año
        const contratistaYear = filteredContratista
          .filter(r => r.anio === year)
          .sort((a, b) => (MES_ORDEN[a.mes] ?? 99) - (MES_ORDEN[b.mes] ?? 99));

        if (contratistaYear.length > 0) {
          displayRows.push(...contratistaYear);
          const acumContratista = sumRowsForYear(filteredContratista, year, 'Contratista');
          if (acumContratista) displayRows.push(acumContratista);
        }
      });
    }

    // Footer row
    const footerRow = calculateFooterRow(filteredBase, 'Acumulado General');
    currentExportData = filteredBase;

    // --- 6. Renderizar ---
    dataTableInstance = createDataTable({
      containerId: 'table-container',
      columns,
      data: displayRows,
      footerRow,
      onView: (record) => {
        if (record.isContratistaAcumulado || record.isSubtotal) return;
        loadRecordIntoForm(container, record);
        setReadOnly(container, true);
        container._showForm();
      },
      onEdit: canEdit ? (record) => {
        if (record.isContratistaAcumulado || record.isSubtotal || record.tipo !== 'Directo') {
          showToast('No se puede editar un registro de contratistas desde esta vista', 'warning');
          return;
        }
        loadRecordIntoForm(container, record);
        setReadOnly(container, false);
        container._showForm();
      } : undefined,
      onDelete: canEdit ? async (record) => {
        if (record.isContratistaAcumulado || record.isSubtotal || record.tipo !== 'Directo') {
          showToast('No se puede eliminar un registro de contratistas desde esta vista', 'warning');
          return;
        }
        const confirmed = await showConfirmModal('Eliminar', `\u00bfSeguro que desea eliminar el registro de ${record.mes} ${record.anio}?`);
        if (confirmed) {
          const delRes = await deleteRegistro(record.id);
          if (delRes.error) showToast('Error al eliminar', 'error');
          else {
            showToast('Registro eliminado', 'success');
            await refreshTable(container, true);
          }
        }
      } : undefined,
      emptyMessage: 'No hay registros guardados.'
    });

  } else {
    // ----------------------------------------------------
    // VISTA CONTRATISTAS DETALLADA
    // ----------------------------------------------------
    tableContainer.innerHTML = '';

    const contratistasBase = cachedRegistros.filter(r => r.tipo === 'Contratista').map(r => ({
      ...r,
      ...calcularTodosLosIndicadores(r)
    }));

    const contratistasFiltered = filterByQuery(contratistasBase);

    // Save for CSV export
    currentExportData = contratistasFiltered;

    // Sorting for detailed view (Year DESC, Month DESC, then Company Name)
    contratistasFiltered.sort((a, b) => {
      if (b.anio !== a.anio) return b.anio - a.anio;
      const mesA = MES_ORDEN[a.mes] ?? 99;
      const mesB = MES_ORDEN[b.mes] ?? 99;
      if (mesB !== mesA) return mesB - mesA; // Newer months first
      return (a.empresa || '').localeCompare(b.empresa || '');
    });

    // Subtotal monthly helper
    const calculateSubtotalRow = (records, anio, mes) => {
      const groupSum = {
        fai: 0, mti: 0, mwd: 0, lti: 0, dp: 0, nm: 0, hht: 0,
        num_trabajadores: 0, fatalidad: 0,
        dias_incapacidad_at_elementia: 0, dias_incapacidad_at_ley: 0,
        dias_cargados: 0, casos_eg: 0, incapacidad_eg: 0, casos_el: 0
      };

      records.forEach(r => {
        Object.keys(groupSum).forEach(key => {
          groupSum[key] += (Number(r[key]) || 0);
        });
      });

      const groupIndicators = calcularTodosLosIndicadores(groupSum);
      
      return {
        isSubtotal: true,
        anio: anio,
        mes: mes,
        tipo: '-',
        planta: '-',
        empresa: 'Acumulado',
        num_trabajadores: groupSum.num_trabajadores,
        hht: groupSum.hht,
        ...groupSum,
        ...groupIndicators
      };
    };

    const recordsWithSubtotals = [];
    let currentGroup = [];
    let currentAnio = null;
    let currentMes = null;

    contratistasFiltered.forEach((r) => {
      if (r.anio !== currentAnio || r.mes !== currentMes) {
        if (currentGroup.length > 0) {
          recordsWithSubtotals.push(...currentGroup);
          if (currentGroup.length >= 1) {
            recordsWithSubtotals.push(calculateSubtotalRow(currentGroup, currentAnio, currentMes));
          }
        }
        currentGroup = [r];
        currentAnio = r.anio;
        currentMes = r.mes;
      } else {
        currentGroup.push(r);
      }
    });

    if (currentGroup.length > 0) {
      recordsWithSubtotals.push(...currentGroup);
      if (currentGroup.length >= 1) {
        recordsWithSubtotals.push(calculateSubtotalRow(currentGroup, currentAnio, currentMes));
      }
    }

    const footerRow = calculateFooterRow(contratistasFiltered, 'Acumulado General Contratistas');

    dataTableInstance = createDataTable({
      containerId: 'table-container',
      columns,
      data: recordsWithSubtotals,
      footerRow,
      onView: (record) => {
        loadRecordIntoForm(container, record);
        setReadOnly(container, true);
        container._showForm();
      },
      onEdit: canEdit ? (record) => {
        loadRecordIntoForm(container, record);
        setReadOnly(container, false);
        container._showForm();
      } : undefined,
      onDelete: canEdit ? async (record) => {
        const confirmed = await showConfirmModal('Eliminar', `¿Seguro que desea eliminar el registro de ${record.mes} ${record.anio}?`);
        if (confirmed) {
          const delRes = await deleteRegistro(record.id);
          if (delRes.error) showToast('Error al eliminar', 'error');
          else {
            showToast('Registro eliminado', 'success');
            await refreshTable(container, true);
          }
        }
      } : undefined,
      emptyMessage: 'No hay registros guardados para contratistas.'
    });
  }
}

function setReadOnly(container, isReadOnly) {
  const fieldset = container.querySelector('#form-fieldset');
  const actionsContainer = container.querySelector('#form-actions-container');
  
  if (fieldset) {
    fieldset.disabled = isReadOnly;
  }
  
  if (actionsContainer) {
    actionsContainer.style.display = isReadOnly ? 'none' : 'flex';
  }
}

function loadRecordIntoForm(container, record) {
  currentRecordId = record.id;
  currentComments = record.comentarios || {};
  
  const isDirecto = (record.tipo === 'Directo');
  
  // Sincronizar el select
  container.querySelector('#tipo-select').value = isDirecto ? 'Directo' : 'Contratista';
  
  // Sincronizar campos de Planta/Empresa
  handleTabChange(container, isDirecto ? 'Directo' : 'Contratista');
  
  if (!isDirecto) {
    if (record.empresa) {
      container.querySelector('#input-empresa').value = record.empresa;
    }
  } else {
    if (record.planta) {
      container.querySelector('#input-planta').value = record.planta;
    }
  }
  
  // Set Date Picker from anio and mes
  if (record.anio && record.mes) {
    const monthIndex = MESES.indexOf(record.mes);
    if (monthIndex !== -1) {
      const monthNum = (monthIndex + 1).toString().padStart(2, '0');
      container.querySelector('#input-periodo').value = `${record.anio}-${monthNum}`;
    }
  } else {
    container.querySelector('#input-periodo').value = '';
  }
  
  INPUT_FIELDS.forEach(f => {
    if (f.key !== 'tipo' && f.key !== 'comentarios' && f.key !== 'planta' && f.key !== 'empresa' && f.key !== 'anio' && f.key !== 'mes') {
      const el = container.querySelector(`#input-${f.key}`);
      if (el && record[f.key] !== undefined && record[f.key] !== null) {
        el.value = record[f.key];
      } else if (el) {
        el.value = '';
      }
    }
  });
  
  // Update comment buttons visual state
  container.querySelectorAll('.btn-comment').forEach(btn => {
    const key = btn.dataset.key;
    if (currentComments[key]) {
      btn.style.color = 'var(--danger)';
    } else {
      btn.style.color = 'var(--text-secondary)';
    }
  });
  
  updateCalculatedFields(container);
  
  container.querySelector('#btn-guardar').innerHTML = '<i data-lucide="edit"></i> Actualizar Registro';
  if (window.lucide) window.lucide.createIcons();
  
  // Scroll up
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
