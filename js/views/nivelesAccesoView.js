import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import {
    getNivelesAcceso,
    createNivelAcceso,
    updateNivelAcceso,
    deleteNivelAcceso
} from '../services/accessLevelService.js';
import { hasPermission } from '../auth.js';

const PERMISSION_GROUPS = [
    {
        key: 'dashboard',
        label: 'Dashboard',
        permissions: [
            { key: 'VIEW_DASHBOARD', label: 'Ver Dashboard' }
        ]
    },
    {
        key: 'estadisticas',
        label: 'Estadísticas',
        permissions: [
            { key: 'VIEW_ESTADISTICAS_GENERAL', label: 'Ver — General' },
            { key: 'EDIT_ESTADISTICAS_GENERAL', label: 'Editar — General' },
            { key: 'VIEW_ESTADISTICAS_CONTRATISTAS', label: 'Ver — Contratistas' },
            { key: 'EDIT_ESTADISTICAS_CONTRATISTAS', label: 'Editar — Contratistas' }
        ]
    },
    {
        key: 'equipos',
        label: 'Equipos',
        permissions: [
            { key: 'VIEW_INVENTARIO_EXTINTORES', label: 'Ver — Inventario Extintores' },
            { key: 'EDIT_INVENTARIO_EXTINTORES', label: 'Editar — Inventario Extintores' },
            { key: 'VIEW_INVENTARIO_ARNESES', label: 'Ver — Inventario Arneses' },
            { key: 'EDIT_INVENTARIO_ARNESES', label: 'Editar — Inventario Arneses' }
        ]
    },
    {
        key: 'inspeccion',
        label: 'Inspección',
        permissions: [
            { key: 'VIEW_INSPECCION_EXTINTORES', label: 'Ver — Inspección Extintores' },
            { key: 'EDIT_INSPECCION_EXTINTORES', label: 'Editar — Inspección Extintores' },
            { key: 'VIEW_INSPECCION_ARNESES', label: 'Ver — Inspección Arneses' },
            { key: 'EDIT_INSPECCION_ARNESES', label: 'Editar — Inspección Arneses' },
            { key: 'VIEW_INSPECCION_AO', label: 'Ver — Inspección A/O' },
            { key: 'EDIT_INSPECCION_AO', label: 'Editar — Inspección A/O' },
            { key: 'VIEW_INSPECCION_ESLINGA', label: 'Ver — Inspección Eslinga' },
            { key: 'EDIT_INSPECCION_ESLINGA', label: 'Editar — Inspección Eslinga' },
            { key: 'VIEW_INSPECCION_OA_OPERATIVAS', label: 'Ver — Inspección O&A Operativas' },
            { key: 'EDIT_INSPECCION_OA_OPERATIVAS', label: 'Editar — Inspección O&A Operativas' }
        ]
    },
    {
        key: 'administracion',
        label: 'Administración',
        permissions: [
            { key: 'VIEW_PARAMETRICAS', label: 'Ver — Paramétricas' },
            { key: 'EDIT_PARAMETRICAS', label: 'Editar — Paramétricas' }
        ]
    },
    {
        key: 'seguridad',
        label: 'Seguridad',
        permissions: [
            { key: 'VIEW_NIVELES_ACCESO', label: 'Ver — Niveles de acceso' },
            { key: 'MANAGE_NIVELES_ACCESO', label: 'Gestionar — Niveles de acceso' },
            { key: 'VIEW_USUARIOS', label: 'Ver — Usuarios' },
            { key: 'MANAGE_USUARIOS', label: 'Gestionar — Usuarios' }
        ]
    }
];

let state = {
    items: [],
    editingItem: null,
    searchQuery: ''
};

export async function renderNivelesAcceso(container) {
    container.innerHTML = `
        <div class="parametricas-container">
            <div class="master-header-section">
                <h1 class="page-title-large">Niveles de acceso</h1>
                <p class="page-subtitle-large">Define los roles y permisos disponibles para los usuarios del sistema.</p>
            </div>

            <div class="table-toolbar">
                <div class="search-wrapper">
                    <i data-lucide="search" class="search-icon"></i>
                    <input type="text" class="search-input" id="search-niveles" placeholder="Buscar nivel de acceso...">
                </div>
                <button class="btn btn-primary btn-glow" id="btn-nuevo-nivel">
                    <i data-lucide="plus"></i> Nuevo nivel de acceso
                </button>
            </div>

            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width: 25%">Nivel de acceso</th>
                            <th style="width: 55%">Descripción</th>
                            <th style="width: 20%; text-align: right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="niveles-tbody">
                        <tr><td colspan="3" style="text-align:center;padding:3rem 0;">
                            <div class="spinner" style="margin:0 auto 12px auto;"></div>
                        </td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal -->
        <div class="modal-overlay" id="nivel-modal">
            <div class="modal-content" style="max-width:560px;">
                <div class="modal-header">
                    <h3 class="modal-title" id="modal-title">Nuevo nivel de acceso</h3>
                    <button class="modal-close" id="btn-close-modal"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body" style="max-height:65vh;overflow-y:auto;gap:var(--space-4);">
                    <form id="nivel-form">
                        <div class="form-group">
                            <label class="form-label">Nombre del nivel de acceso *</label>
                            <input type="text" class="form-input" id="input-nombre" required placeholder="Ej: Supervisor">
                        </div>
                        <div class="form-group" style="margin-bottom:var(--space-2);">
                            <label class="form-label">Descripción del nivel de acceso *</label>
                            <textarea class="form-input" id="input-descripcion" rows="2" placeholder="Descripción del rol..." style="resize:vertical;"></textarea>
                        </div>

                        <fieldset class="permisos-fieldset">
                            <legend class="permisos-legend">Permisos</legend>
                            <div id="permisos-grupos">
                                ${PERMISSION_GROUPS.map(group => `
                                    <div class="permiso-grupo">
                                        <label class="permiso-grupo-header">
                                            <input type="checkbox" class="grupo-checkbox" data-group="${group.key}" style="accent-color:var(--accent);">
                                            <span class="permiso-grupo-label">${group.label}</span>
                                        </label>
                                        <div class="permiso-items">
                                            ${group.permissions.map(p => `
                                                <label class="permiso-item">
                                                    <input type="checkbox" class="perm-checkbox" data-group="${group.key}" data-key="${p.key}" style="accent-color:var(--accent);">
                                                    <span class="permiso-item-label">${p.label}</span>
                                                    <span class="permiso-item-key">(${p.key})</span>
                                                </label>
                                            `).join('')}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </fieldset>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="btn-cancel-modal">Cancelar</button>
                    <button class="btn btn-primary btn-glow" id="btn-save-modal" disabled>Crear nivel de acceso</button>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const canEdit = hasPermission('MANAGE_NIVELES_ACCESO');

    const tbody = container.querySelector('#niveles-tbody');
    const searchInput = container.querySelector('#search-niveles');
    const modal = container.querySelector('#nivel-modal');
    const modalTitle = container.querySelector('#modal-title');
    const form = container.querySelector('#nivel-form');
    const inputNombre = container.querySelector('#input-nombre');
    const inputDescripcion = container.querySelector('#input-descripcion');
    const btnSave = container.querySelector('#btn-save-modal');

    // Load data
    const { data, error } = await getNivelesAcceso();
    if (error) {
        showToast(`Error al cargar niveles: ${error.message}`, 'error');
        tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state"><i data-lucide="alert-triangle" class="empty-state-icon"></i><span>Error al cargar datos</span></div></td></tr>`;
        if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
        return;
    }
    state.items = data || [];

    // Enable save button when nombre is filled
    inputNombre.addEventListener('input', () => {
        btnSave.disabled = !inputNombre.value.trim();
    });

    function renderTable() {
        const q = state.searchQuery.toLowerCase();
        const filtered = q
            ? state.items.filter(i => i.nombre.toLowerCase().includes(q) || (i.descripcion || '').toLowerCase().includes(q))
            : state.items;

        if (!filtered.length) {
            tbody.innerHTML = `<tr><td colspan="3"><div class="empty-state">
                <i data-lucide="shield-off" class="empty-state-icon"></i>
                <span>${q ? 'No se encontraron resultados.' : 'No hay niveles de acceso. Crea el primero.'}</span>
            </div></td></tr>`;
            if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
            return;
        }

        tbody.innerHTML = filtered.map(item => `
            <tr>
                <td style="font-weight:600;color:var(--text-primary);">${item.nombre}</td>
                <td style="color:var(--text-secondary);font-size:var(--text-sm);">${item.descripcion || '—'}</td>
                <td style="text-align:right;">
                    <div class="actions-wrapper">
                        ${canEdit ? `
                        <button class="btn-action edit" data-id="${item.id}" title="Editar">
                            <i data-lucide="pencil" style="width:16px;height:16px;"></i>
                        </button>
                        <button class="btn-action delete" data-id="${item.id}" title="Eliminar">
                            <i data-lucide="trash-2" style="width:16px;height:16px;"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');

        if (canEdit) {
            tbody.querySelectorAll('.btn-action.edit').forEach(btn => {
                btn.addEventListener('click', () => {
                    const item = state.items.find(i => i.id === btn.dataset.id);
                    if (item) openModal(item);
                });
            });

            tbody.querySelectorAll('.btn-action.delete').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const item = state.items.find(i => i.id === btn.dataset.id);
                    const ok = await showConfirmModal(
                        'Eliminar nivel de acceso',
                        `¿Estás seguro de eliminar el nivel "<strong>${item?.nombre}</strong>"? Esta acción no se puede deshacer.`
                    );
                    if (!ok) return;
                    const { error } = await deleteNivelAcceso(btn.dataset.id);
                    if (error) { showToast(`Error: ${error.message}`, 'error'); return; }
                    state.items = state.items.filter(i => i.id !== btn.dataset.id);
                    renderTable();
                    showToast('Nivel de acceso eliminado', 'success');
                });
            });
        }

        if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
    }

    // Permissions checkbox logic
    function getSelectedPermisos() {
        return [...container.querySelectorAll('.perm-checkbox:checked')].map(cb => cb.dataset.key);
    }

    function setSelectedPermisos(keys = []) {
        container.querySelectorAll('.perm-checkbox').forEach(cb => {
            cb.checked = keys.includes(cb.dataset.key);
        });
        updateGroupCheckboxes();
    }

    function updateGroupCheckboxes() {
        PERMISSION_GROUPS.forEach(group => {
            const childBoxes = container.querySelectorAll(`.perm-checkbox[data-group="${group.key}"]`);
            const groupBox = container.querySelector(`.grupo-checkbox[data-group="${group.key}"]`);
            if (!groupBox) return;
            const checkedCount = [...childBoxes].filter(c => c.checked).length;
            groupBox.checked = checkedCount === childBoxes.length;
            groupBox.indeterminate = checkedCount > 0 && checkedCount < childBoxes.length;
        });
    }

    container.querySelectorAll('.grupo-checkbox').forEach(groupCb => {
        groupCb.addEventListener('change', () => {
            const group = groupCb.dataset.group;
            container.querySelectorAll(`.perm-checkbox[data-group="${group}"]`).forEach(cb => {
                cb.checked = groupCb.checked;
            });
        });
    });

    container.querySelectorAll('.perm-checkbox').forEach(cb => {
        cb.addEventListener('change', updateGroupCheckboxes);
    });

    function openModal(item = null) {
        state.editingItem = item;
        form.reset();
        btnSave.disabled = true;

        if (item) {
            modalTitle.textContent = 'Editar nivel de acceso';
            btnSave.textContent = 'Guardar cambios';
            inputNombre.value = item.nombre;
            inputDescripcion.value = item.descripcion || '';
            setSelectedPermisos(item.permisos || []);
            btnSave.disabled = false;
        } else {
            modalTitle.textContent = 'Nuevo nivel de acceso';
            btnSave.textContent = 'Crear nivel de acceso';
            setSelectedPermisos([]);
        }

        modal.classList.add('active');
        inputNombre.focus();
    }

    function closeModal() {
        modal.classList.remove('active');
        state.editingItem = null;
        form.reset();
        setSelectedPermisos([]);
    }

    async function handleSave() {
        const nombre = inputNombre.value.trim();
        if (!nombre) { showToast('El nombre es obligatorio', 'error'); return; }

        const payload = {
            nombre,
            descripcion: inputDescripcion.value.trim(),
            permisos: getSelectedPermisos()
        };

        btnSave.disabled = true;
        btnSave.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></div> Guardando...';

        try {
            if (state.editingItem) {
                const { data, error } = await updateNivelAcceso(state.editingItem.id, payload);
                if (error) { showToast(`Error: ${error.message}`, 'error'); return; }
                const idx = state.items.findIndex(i => i.id === state.editingItem.id);
                if (idx !== -1 && data) state.items[idx] = data;
                showToast('Nivel actualizado correctamente', 'success');
            } else {
                const { data, error } = await createNivelAcceso(payload);
                if (error) { showToast(`Error: ${error.message}`, 'error'); return; }
                if (data) state.items.push(data);
                showToast('Nivel creado correctamente', 'success');
            }
            renderTable();
            closeModal();
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = state.editingItem ? 'Guardar cambios' : 'Crear nivel de acceso';
        }
    }

    // Events
    searchInput.addEventListener('input', () => {
        state.searchQuery = searchInput.value;
        renderTable();
    });

    const btnNuevoNivel = container.querySelector('#btn-nuevo-nivel');
    if (!canEdit) {
        btnNuevoNivel.style.display = 'none';
    } else {
        btnNuevoNivel.addEventListener('click', () => openModal());
    }
    container.querySelector('#btn-close-modal').addEventListener('click', closeModal);
    container.querySelector('#btn-cancel-modal').addEventListener('click', closeModal);
    container.querySelector('#btn-save-modal').addEventListener('click', handleSave);
    modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

    renderTable();
}
