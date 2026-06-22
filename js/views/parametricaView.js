import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { getParametros, createParametro, updateParametro, deleteParametro } from '../services/parametricaService.js';

// --- System Categories Definitions (Master View) ---
// These are fixed system-level categories. Their sub-values are stored in Supabase.
const categories = [
  { id: 'ciudad', code: 'PAR-001', name: 'Centros de trabajo (Plantas)' },
  { id: 'empresa', code: 'PAR-002', name: 'Empresa' },
  { id: 'extintor_codigo', code: 'PAR-003', name: 'Tipo Extintor' },
  { id: 'extintor_ubicacion', code: 'PAR-004', name: 'Ubicación' },
  { id: 'arnes_tipo', code: 'PAR-005', name: 'Tipo de Equipo' },
  { id: 'arnes_norma', code: 'PAR-006', name: 'Norma de Certificación' }
];

// --- State ---
let state = {
  currentCategory: null,
  values: [], // Values for the selected category (from Supabase)
  isModalOpen: false,
  editingItem: null
};

// --- View Rendering ---
export async function renderParametricas(container) {
  container.innerHTML = `
    <div class="parametricas-container">
      
      <!-- LEVEL 1: Master View (Categories) -->
      <div id="master-view" class="master-view">
        <div class="master-header-section">
          <h1 class="page-title-large">Configuración de Paramétricas</h1>
          <p class="page-subtitle-large">Gestión dinámica de las opciones para los selectores del sistema.</p>
        </div>

        <div class="table-toolbar">
          <div class="search-wrapper">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" class="search-input" id="search-categories" placeholder="Buscar categoría...">
          </div>
        </div>
        
        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 25%">Código</th>
                <th style="width: 60%">Nombre de la Categoría</th>
                <th style="width: 15%; text-align: right">Acciones</th>
              </tr>
            </thead>
            <tbody id="categories-tbody">
              <!-- Categories injected here -->
            </tbody>
          </table>
        </div>
      </div>

      <!-- LEVEL 2: Detail View (Values) -->
      <div id="detail-view" class="detail-view">
        <div class="detail-header-section">
          <button class="btn-back" id="btn-back">
            <i data-lucide="arrow-left"></i> Volver a Categorías
          </button>
          
          <div class="detail-title-row">
            <h1 class="page-title-large">Editar parámetro: <span id="detail-category-name" class="text-accent-glow"></span></h1>
            <p class="page-subtitle-large">Administre las opciones internas disponibles para este selector.</p>
          </div>
        </div>

        <div class="table-toolbar">
          <div class="search-wrapper">
            <i data-lucide="search" class="search-icon"></i>
            <input type="text" class="search-input" id="search-values" placeholder="Buscar por nombre...">
          </div>
          <button class="btn btn-primary btn-glow" id="btn-new-value">
            <i data-lucide="plus"></i> Nuevo
          </button>
        </div>

        <div class="data-table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 15%">#</th>
                <th style="width: 65%">Nombre</th>
                <th style="width: 20%; text-align: right">Acciones</th>
              </tr>
            </thead>
            <tbody id="values-tbody">
              <!-- Values injected here -->
            </tbody>
          </table>
        </div>
      </div>

    </div>

    <!-- LEVEL 3: Modal (Create/Edit) -->
    <div class="modal-overlay" id="param-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title" id="modal-title">Nuevo parámetro</h3>
          <button class="modal-close" id="btn-close-modal">
            <i data-lucide="x"></i>
          </button>
        </div>
        <div class="modal-body">
          <p class="form-label" style="margin-top:0">Ingrese el valor del parámetro.</p>
          <form id="param-form">
            <input type="hidden" id="input-id">
            <div class="form-group">
              <label class="form-label">Nombre del parámetro*</label>
              <input type="text" class="form-input" id="input-name" required placeholder="Ej: Planta Barranquilla">
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="btn-cancel-modal">Cancelar</button>
          <button class="btn btn-primary btn-glow" id="btn-save-modal">Guardar</button>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) {
    window.lucide.createIcons();
  }

  // DOM Elements
  const masterView = container.querySelector('#master-view');
  const detailView = container.querySelector('#detail-view');
  const categoriesTbody = container.querySelector('#categories-tbody');
  const valuesTbody = container.querySelector('#values-tbody');
  const detailCategoryName = container.querySelector('#detail-category-name');
  const btnBack = container.querySelector('#btn-back');
  
  // Search Inputs
  const searchCategories = container.querySelector('#search-categories');
  const searchValues = container.querySelector('#search-values');

  // Modal Elements
  const modalOverlay = container.querySelector('#param-modal');
  const modalTitle = container.querySelector('#modal-title');
  const btnCloseModal = container.querySelector('#btn-close-modal');
  const btnCancelModal = container.querySelector('#btn-cancel-modal');
  const btnSaveModal = container.querySelector('#btn-save-modal');
  const paramForm = container.querySelector('#param-form');
  const inputId = container.querySelector('#input-id');
  const inputName = container.querySelector('#input-name');

  // --- Render Functions ---

  function renderMasterView(filterQuery = '') {
    const query = filterQuery.toLowerCase().trim();
    const filteredCategories = categories.filter(cat => 
      cat.code.toLowerCase().includes(query) || 
      cat.name.toLowerCase().includes(query)
    );

    if (filteredCategories.length === 0) {
      categoriesTbody.innerHTML = `
        <tr>
          <td colspan="3">
            <div class="empty-state">
              <i data-lucide="info" class="empty-state-icon"></i>
              <span>No se encontraron categorías que coincidan con la búsqueda.</span>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons({ nodes: [categoriesTbody] });
      return;
    }

    categoriesTbody.innerHTML = filteredCategories.map(cat => `
      <tr>
        <td><span class="td-code">${cat.code}</span></td>
        <td style="font-weight: 500; color: var(--text-primary);">${cat.name}</td>
        <td style="text-align: right;">
          <div class="actions-wrapper">
            <button class="btn-action edit" data-id="${cat.id}" title="Editar valores de ${cat.name}">
              <i data-lucide="pencil" style="width:16px;height:16px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach events
    categoriesTbody.querySelectorAll('.btn-action.edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const catId = btn.dataset.id;
        openDetailView(catId);
      });
    });

    if (window.lucide) window.lucide.createIcons({ nodes: [categoriesTbody] });
  }

  function renderDetailView(filterQuery = '') {
    const query = filterQuery.toLowerCase().trim();
    const filteredValues = state.values.filter(val => 
      val.valor.toLowerCase().includes(query)
    );

    if (filteredValues.length === 0) {
      valuesTbody.innerHTML = `
        <tr>
          <td colspan="3">
            <div class="empty-state">
              <i data-lucide="alert-circle" class="empty-state-icon"></i>
              <span>No se encontraron parámetros. Haz clic en "Nuevo" para crear uno.</span>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons({ nodes: [valuesTbody] });
      return;
    }

    valuesTbody.innerHTML = filteredValues.map((val, index) => `
      <tr>
        <td><span class="td-code">${index + 1}</span></td>
        <td style="font-weight: 500; color: var(--text-primary);">${val.valor}</td>
        <td style="text-align: right;">
          <div class="actions-wrapper">
            <button class="btn-action edit" data-id="${val.id}" title="Editar">
              <i data-lucide="pencil" style="width:16px;height:16px;"></i>
            </button>
            <button class="btn-action delete" data-id="${val.id}" title="Eliminar">
              <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
            </button>
          </div>
        </td>
      </tr>
    `).join('');

    // Attach events for detail view table
    valuesTbody.querySelectorAll('.btn-action.edit').forEach(btn => {
      btn.addEventListener('click', () => {
        const valId = btn.dataset.id;
        const value = state.values.find(v => v.id === valId);
        openModal(value);
      });
    });

    valuesTbody.querySelectorAll('.btn-action.delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        const valId = btn.dataset.id;
        const confirmed = await showConfirmModal('Eliminar Parámetro', '¿Estás seguro de eliminar este parámetro? Esta acción no se puede deshacer.');
        if (confirmed) {
          const { error } = await deleteParametro(valId);
          if (error) {
            showToast(`Error al eliminar: ${error.message}`, 'error');
            return;
          }
          state.values = state.values.filter(v => v.id !== valId);
          renderDetailView(searchValues.value);
          showToast('Eliminado correctamente', 'success');
        }
      });
    });

    if (window.lucide) window.lucide.createIcons({ nodes: [valuesTbody] });
  }

  // --- Actions & Transitions ---

  async function openDetailView(categoryId) {
    const category = categories.find(c => c.id === categoryId);
    state.currentCategory = category;
    
    // Clear search values input
    searchValues.value = '';
    
    // Update UI
    detailCategoryName.textContent = category.name;
    masterView.classList.add('hidden');
    detailView.classList.add('active');
    
    // Show loading state
    valuesTbody.innerHTML = `
      <tr>
        <td colspan="3" style="text-align:center;padding:3rem 0;">
          <div class="spinner" style="margin:0 auto 12px auto;"></div>
          <span style="color:var(--text-secondary);font-size:var(--text-sm);">Cargando parámetros...</span>
        </td>
      </tr>
    `;
    if (window.lucide) window.lucide.createIcons({ nodes: [valuesTbody] });

    // Fetch real data from Supabase
    const { data, error } = await getParametros(categoryId);
    
    if (error) {
      valuesTbody.innerHTML = `
        <tr>
          <td colspan="3">
            <div class="empty-state">
              <i data-lucide="alert-triangle" class="empty-state-icon"></i>
              <span style="color:var(--danger);">Error al cargar: ${error.message}</span>
            </div>
          </td>
        </tr>
      `;
      if (window.lucide) window.lucide.createIcons({ nodes: [valuesTbody] });
      return;
    }

    state.values = data || [];
    renderDetailView();
  }

  function closeDetailView() {
    state.currentCategory = null;
    state.values = [];
    detailView.classList.remove('active');
    masterView.classList.remove('hidden');
  }

  function openModal(itemToEdit = null) {
    state.editingItem = itemToEdit;
    state.isModalOpen = true;

    if (itemToEdit) {
      modalTitle.textContent = 'Editar parámetro';
      inputId.value = itemToEdit.id;
      inputName.value = itemToEdit.valor;
    } else {
      modalTitle.textContent = 'Nuevo parámetro';
      paramForm.reset();
      inputId.value = '';
    }

    modalOverlay.classList.add('active');
    inputName.focus();
  }

  function closeModal() {
    state.isModalOpen = false;
    state.editingItem = null;
    modalOverlay.classList.remove('active');
  }

  async function handleSave() {
    if (!paramForm.checkValidity()) {
      paramForm.reportValidity();
      return;
    }

    const valor = inputName.value.trim();
    if (!valor) {
      showToast('El nombre del parámetro no puede estar vacío', 'error');
      return;
    }

    // Disable save button while processing
    btnSaveModal.disabled = true;
    btnSaveModal.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></div> Guardando...';

    try {
      if (state.editingItem) {
        // Update existing parameter
        const { data, error } = await updateParametro(state.editingItem.id, valor);
        if (error) {
          showToast(`Error al actualizar: ${error.message}`, 'error');
          return;
        }
        // Update local state
        const index = state.values.findIndex(v => v.id === state.editingItem.id);
        if (index !== -1 && data) {
          state.values[index] = data;
        }
        showToast('Actualizado correctamente', 'success');
      } else {
        // Create new parameter
        const { data, error } = await createParametro(state.currentCategory.id, valor);
        if (error) {
          showToast(`Error al guardar: ${error.message}`, 'error');
          return;
        }
        if (data) {
          state.values.push(data);
        }
        showToast('Guardado correctamente', 'success');
      }

      renderDetailView(searchValues.value);
      closeModal();
    } catch (err) {
      showToast(`Error inesperado: ${err.message}`, 'error');
    } finally {
      btnSaveModal.disabled = false;
      btnSaveModal.innerHTML = 'Guardar';
    }
  }

  // --- Event Listeners ---

  // Live searching
  searchCategories.addEventListener('input', () => {
    renderMasterView(searchCategories.value);
  });

  searchValues.addEventListener('input', () => {
    renderDetailView(searchValues.value);
  });

  btnBack.addEventListener('click', closeDetailView);
  
  container.querySelector('#btn-new-value').addEventListener('click', () => {
    openModal();
  });

  btnCloseModal.addEventListener('click', closeModal);
  btnCancelModal.addEventListener('click', closeModal);
  
  btnSaveModal.addEventListener('click', (e) => {
    e.preventDefault();
    handleSave();
  });

  // Close modal on click outside
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });

  // Initialize
  renderMasterView();
}
