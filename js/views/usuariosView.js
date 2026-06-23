import { showToast } from '../components/toast.js';
import { showConfirmModal } from '../components/modal.js';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, changePassword } from '../services/userService.js';
import { getNivelesAcceso } from '../services/accessLevelService.js';
import { hasPermission } from '../auth.js';

let state = {
    items: [],
    niveles: [],
    editingItem: null,
    viewingItem: null,
    searchQuery: ''
};

function generarPasswordAleatoria() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$';
    return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function markError(input, msg) {
    input.style.border = '1.5px solid var(--danger, #ef4444)';
    let err = input.parentElement.querySelector('.field-error');
    if (!err) {
        err = document.createElement('span');
        err.className = 'field-error';
        err.style.cssText = 'color:var(--danger,#ef4444);font-size:12px;margin-top:4px;display:block;';
        input.parentElement.appendChild(err);
    }
    err.textContent = msg;
}

function clearError(input) {
    input.style.border = '';
    const err = input.parentElement.querySelector('.field-error');
    if (err) err.remove();
}

export async function renderUsuarios(container) {
    container.innerHTML = `
        <div class="parametricas-container">
            <div class="master-header-section">
                <h1 class="page-title-large">Usuarios</h1>
                <p class="page-subtitle-large">Gestión de usuarios del sistema y sus niveles de acceso.</p>
            </div>

            <div class="table-toolbar">
                <div class="search-wrapper">
                    <i data-lucide="search" class="search-icon"></i>
                    <input type="text" class="search-input" id="search-usuarios" placeholder="Buscar usuario...">
                </div>
                <button class="btn btn-primary btn-glow" id="btn-nuevo-usuario">
                    <i data-lucide="user-plus"></i> Nuevo usuario
                </button>
            </div>

            <div class="data-table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th style="width:20%">Nombre</th>
                            <th style="width:15%">Documento</th>
                            <th style="width:25%">Correo</th>
                            <th style="width:18%">Nivel de acceso</th>
                            <th style="width:10%">Estado</th>
                            <th style="width:12%;text-align:right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="usuarios-tbody">
                        <tr><td colspan="6" style="text-align:center;padding:3rem 0;">
                            <div class="spinner" style="margin:0 auto 12px auto;"></div>
                        </td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Modal Crear/Editar -->
        <div class="modal-overlay" id="usuario-modal">
            <div class="modal-content" style="max-width:520px;">
                <div class="modal-header">
                    <h3 class="modal-title" id="usuario-modal-title">Nuevo usuario</h3>
                    <button class="modal-close" id="btn-close-usuario-modal"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body" style="gap:0;">
                    <form id="usuario-form" novalidate>
                        <div class="form-group">
                            <label class="form-label">Nombre completo *</label>
                            <input type="text" class="form-input" id="u-nombre" placeholder="Ej: Juan Pérez">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Documento de identidad</label>
                            <input type="text" class="form-input" id="u-documento" placeholder="Ej: 1234567890">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Correo electrónico *</label>
                            <input type="email" class="form-input" id="u-correo" placeholder="correo@empresa.com">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Nivel de acceso</label>
                            <select class="form-input form-select" id="u-nivel">
                                <option value="">— Seleccionar —</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Estado</label>
                            <select class="form-input form-select" id="u-estado">
                                <option value="activo">Activo</option>
                                <option value="inactivo">Inactivo</option>
                            </select>
                        </div>
                        <!-- CREATE: default password -->
                        <div id="password-section" class="form-group" style="background:var(--bg-hover);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:var(--space-4);">
                            <label class="form-label" style="margin-bottom:var(--space-2);">Contraseña por defecto</label>
                            <div style="display:flex;gap:var(--space-2);align-items:center;">
                                <input type="text" class="form-input" id="u-password" placeholder="Contraseña generada..." readonly style="flex:1;font-family:var(--font-mono);letter-spacing:1px;">
                                <button type="button" class="btn btn-secondary" id="btn-generar-pwd" style="white-space:nowrap;flex-shrink:0;">
                                    <i data-lucide="refresh-cw" style="width:14px;height:14px;"></i> Generar
                                </button>
                                <button type="button" class="btn btn-secondary" id="btn-copiar-pwd" style="flex-shrink:0;" title="Copiar contraseña">
                                    <i data-lucide="copy" style="width:14px;height:14px;"></i>
                                </button>
                            </div>
                            <p style="font-size:var(--text-xs);color:var(--text-muted);margin-top:var(--space-2);">
                                Comparte esta contraseña con el usuario para que pueda ingresar al sistema.
                            </p>
                        </div>

                        <!-- EDIT: change password -->
                        <div id="change-pwd-section" style="display:none;">
                            <div style="border-top:1px solid var(--border-default);margin-bottom:var(--space-4);"></div>
                            <div class="form-group" style="margin-bottom:var(--space-2);">
                                <label class="form-label">Nueva contraseña (dejar en blanco para no cambiar)</label>
                                <div style="display:flex;gap:var(--space-2);align-items:center;">
                                    <input type="text" class="form-input" id="u-nueva-pwd" placeholder="Nueva contraseña..." style="flex:1;font-family:var(--font-mono);">
                                    <button type="button" class="btn btn-secondary" id="btn-generar-nueva-pwd" style="flex-shrink:0;" title="Generar contraseña">
                                        <i data-lucide="refresh-cw" style="width:14px;height:14px;"></i>
                                    </button>
                                    <button type="button" class="btn btn-secondary" id="btn-copiar-nueva-pwd" style="flex-shrink:0;" title="Copiar">
                                        <i data-lucide="copy" style="width:14px;height:14px;"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="btn-cancel-usuario-modal">Cancelar</button>
                    <button class="btn btn-primary btn-glow" id="btn-save-usuario">Crear usuario</button>
                </div>
            </div>
        </div>

        <!-- Modal Ver usuario -->
        <div class="modal-overlay" id="view-usuario-modal">
            <div class="modal-content" style="max-width:480px;">
                <div class="modal-header">
                    <h3 class="modal-title">Detalle del usuario</h3>
                    <button class="modal-close" id="btn-close-view-modal"><i data-lucide="x"></i></button>
                </div>
                <div class="modal-body" id="view-modal-body" style="gap:var(--space-3);">
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary" id="btn-close-view-modal-2">Cerrar</button>
                </div>
            </div>
        </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    const canEdit = hasPermission('MANAGE_USUARIOS');

    const tbody = container.querySelector('#usuarios-tbody');
    const searchInput = container.querySelector('#search-usuarios');
    const modal = container.querySelector('#usuario-modal');
    const modalTitle = container.querySelector('#usuario-modal-title');
    const viewModal = container.querySelector('#view-usuario-modal');
    const viewModalBody = container.querySelector('#view-modal-body');
    const form = container.querySelector('#usuario-form');
    const inputNombre = container.querySelector('#u-nombre');
    const inputDocumento = container.querySelector('#u-documento');
    const inputCorreo = container.querySelector('#u-correo');
    const selectNivel = container.querySelector('#u-nivel');
    const selectEstado = container.querySelector('#u-estado');
    const inputPassword    = container.querySelector('#u-password');
    const passwordSection  = container.querySelector('#password-section');
    const changePwdSection = container.querySelector('#change-pwd-section');
    const inputNuevaPwd    = container.querySelector('#u-nueva-pwd');
    const btnSave          = container.querySelector('#btn-save-usuario');

    // Load data in parallel
    const [usersResult, nivelesResult] = await Promise.all([getUsuarios(), getNivelesAcceso()]);

    if (usersResult.error) showToast('Error cargando usuarios: ' + usersResult.error.message, 'error');
    if (nivelesResult.error) showToast('Error cargando niveles: ' + nivelesResult.error.message, 'error');

    state.items = usersResult.data || [];
    state.niveles = nivelesResult.data || [];

    function populateNivelSelect(selectedId) {
        selectedId = selectedId || '';
        selectNivel.innerHTML = '<option value="">— Sin nivel —</option>' +
            state.niveles.map(function(n) {
                return '<option value="' + n.id + '"' + (n.id === selectedId ? ' selected' : '') + '>' + n.nombre + '</option>';
            }).join('');
    }

    // Clear error on input
    inputNombre.addEventListener('input', function() { clearError(inputNombre); });
    inputCorreo.addEventListener('input', function() { clearError(inputCorreo); });

    function renderTable() {
        var q = state.searchQuery.toLowerCase();
        var filtered = q
            ? state.items.filter(function(i) {
                return i.nombre.toLowerCase().includes(q)
                    || (i.correo || '').toLowerCase().includes(q)
                    || (i.documento || '').toLowerCase().includes(q)
                    || ((i.niveles_acceso && i.niveles_acceso.nombre) || '').toLowerCase().includes(q);
            })
            : state.items;

        if (!filtered.length) {
            tbody.innerHTML = '<tr><td colspan="6"><div class="empty-state">'
                + '<i data-lucide="users" class="empty-state-icon"></i>'
                + '<span>' + (q ? 'No se encontraron usuarios.' : 'No hay usuarios registrados. Crea el primero.') + '</span>'
                + '</div></td></tr>';
            if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
            return;
        }

        tbody.innerHTML = filtered.map(function(item) {
            var estadoBadge = item.estado === 'activo'
                ? '<span class="badge badge-success" style="gap:4px;"><i data-lucide="check-circle" style="width:12px;height:12px;"></i> Activo</span>'
                : '<span class="badge badge-warning" style="gap:4px;"><i data-lucide="clock" style="width:12px;height:12px;"></i> Inactivo</span>';

            var nivelBadge = (item.niveles_acceso && item.niveles_acceso.nombre)
                ? '<span class="td-code" style="font-size:11px;">' + item.niveles_acceso.nombre + '</span>'
                : '—';

            var editBtn = canEdit
                ? '<button class="btn-action edit" data-id="' + item.id + '" title="Editar"><i data-lucide="pencil" style="width:16px;height:16px;"></i></button>'
                : '';

            var deleteBtn = canEdit
                ? '<button class="btn-action delete" data-id="' + item.id + '" title="Eliminar"><i data-lucide="trash-2" style="width:16px;height:16px;"></i></button>'
                : '';

            return '<tr>'
                + '<td style="font-weight:600;color:var(--text-primary);">' + item.nombre + '</td>'
                + '<td style="color:var(--text-secondary);font-size:var(--text-sm);">' + (item.documento || '—') + '</td>'
                + '<td style="color:var(--text-secondary);font-size:var(--text-sm);">' + item.correo + '</td>'
                + '<td>' + nivelBadge + '</td>'
                + '<td>' + estadoBadge + '</td>'
                + '<td style="text-align:right;">'
                + '<div class="actions-wrapper">'
                + editBtn
                + '<button class="btn-action view" data-id="' + item.id + '" title="Ver detalle"><i data-lucide="eye" style="width:16px;height:16px;"></i></button>'
                + deleteBtn
                + '</div></td>'
                + '</tr>';
        }).join('');

        if (canEdit) {
            tbody.querySelectorAll('.btn-action.edit').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var item = state.items.find(function(i) { return i.id === btn.dataset.id; });
                    if (item) openModal(item);
                });
            });
        }

        tbody.querySelectorAll('.btn-action.view').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var item = state.items.find(function(i) { return i.id === btn.dataset.id; });
                if (item) openViewModal(item);
            });
        });

        if (canEdit) {
            tbody.querySelectorAll('.btn-action.delete').forEach(function(btn) {
                btn.addEventListener('click', async function() {
                    var item = state.items.find(function(i) { return i.id === btn.dataset.id; });
                    var ok = await showConfirmModal(
                        'Eliminar usuario',
                        '¿Estás seguro de eliminar a <strong>' + (item ? item.nombre : '') + '</strong>? Esta acción no se puede deshacer.'
                    );
                    if (!ok) return;
                    var result = await deleteUsuario(btn.dataset.id);
                    if (result.error) { showToast('Error: ' + result.error.message, 'error'); return; }
                    state.items = state.items.filter(function(i) { return i.id !== btn.dataset.id; });
                    renderTable();
                    showToast('Usuario eliminado correctamente', 'success');
                });
            });
        }

        if (window.lucide) window.lucide.createIcons({ nodes: [tbody] });
    }

    function validateForm() {
        var ok = true;
        var nombre = inputNombre.value.trim();
        var correo = inputCorreo.value.trim();

        if (!nombre) {
            markError(inputNombre, 'El nombre es obligatorio.');
            ok = false;
        }
        if (!correo) {
            markError(inputCorreo, 'El correo es obligatorio.');
            ok = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
            markError(inputCorreo, 'Ingresa un correo válido.');
            ok = false;
        }
        return ok;
    }

    function openModal(item) {
        item = item || null;
        state.editingItem = item;
        form.reset();
        clearError(inputNombre);
        clearError(inputCorreo);
        populateNivelSelect(item ? item.nivel_acceso_id : '');

        if (item) {
            modalTitle.textContent = 'Editar usuario';
            btnSave.textContent = 'Guardar cambios';
            inputNombre.value = item.nombre;
            inputDocumento.value = item.documento || '';
            inputCorreo.value = item.correo;
            selectNivel.value = item.nivel_acceso_id || '';
            selectEstado.value = item.estado || 'activo';
            passwordSection.style.display = 'none';
            changePwdSection.style.display = 'block';
            if (inputNuevaPwd) inputNuevaPwd.value = '';
        } else {
            modalTitle.textContent = 'Nuevo usuario';
            btnSave.textContent = 'Crear usuario';
            passwordSection.style.display = 'block';
            changePwdSection.style.display = 'none';
            inputPassword.value = generarPasswordAleatoria();
        }

        modal.classList.add('active');
        inputNombre.focus();
    }

    function closeModal() {
        modal.classList.remove('active');
        state.editingItem = null;
        form.reset();
        clearError(inputNombre);
        clearError(inputCorreo);
    }

    function openViewModal(item) {
        state.viewingItem = item;
        var nivelNombre = (item.niveles_acceso && item.niveles_acceso.nombre) ? item.niveles_acceso.nombre : '—';
        var estadoBadge = item.estado === 'activo'
            ? '<span class="badge badge-success">Activo</span>'
            : '<span class="badge badge-warning">Inactivo</span>';
        var nivelHtml = nivelNombre !== '—'
            ? '<span class="td-code">' + nivelNombre + '</span>'
            : '—';

        viewModalBody.innerHTML = ''
            + '<div class="view-field"><span class="form-label">Nombre</span><p style="font-weight:600;color:var(--text-primary);margin:0;">' + item.nombre + '</p></div>'
            + '<div class="view-field"><span class="form-label">Documento</span><p style="color:var(--text-secondary);margin:0;">' + (item.documento || '—') + '</p></div>'
            + '<div class="view-field"><span class="form-label">Correo</span><p style="color:var(--text-secondary);margin:0;">' + item.correo + '</p></div>'
            + '<div class="view-field"><span class="form-label">Nivel de acceso</span><p style="margin:0;">' + nivelHtml + '</p></div>'
            + '<div class="view-field"><span class="form-label">Estado</span><p style="margin:0;">' + estadoBadge + '</p></div>'
            + '<div class="view-field"><span class="form-label">Creado</span><p style="color:var(--text-muted);font-size:var(--text-xs);margin:0;">' + (item.created_at ? new Date(item.created_at).toLocaleDateString('es-CO') : '—') + '</p></div>';

        if (window.lucide) window.lucide.createIcons({ nodes: [viewModalBody] });
        viewModal.classList.add('active');
    }

    async function handleSave() {
        if (!validateForm()) return;

        var nombre = inputNombre.value.trim();
        var correo = inputCorreo.value.trim();

        var payload = {
            nombre: nombre,
            documento: inputDocumento.value.trim(),
            correo: correo,
            nivel_acceso_id: selectNivel.value || null,
            estado: selectEstado.value
        };

        var originalText = btnSave.textContent;
        btnSave.disabled = true;
        btnSave.innerHTML = '<div class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;vertical-align:middle;margin-right:8px"></div> Guardando...';

        try {
            if (state.editingItem) {
                var updateRes = await updateUsuario(state.editingItem.id, payload);
                if (updateRes.error) { showToast('Error: ' + updateRes.error.message, 'error'); return; }
                var idx = state.items.findIndex(function(i) { return i.id === state.editingItem.id; });
                if (idx !== -1 && updateRes.data) state.items[idx] = updateRes.data;

                var nuevaPwd = inputNuevaPwd ? inputNuevaPwd.value.trim() : '';
                if (nuevaPwd) {
                    var pwdRes = await changePassword(state.editingItem.id, nuevaPwd);
                    if (pwdRes.error) showToast('Advertencia: no se pudo cambiar la contraseña: ' + pwdRes.error.message, 'warning');
                    else showToast('Usuario y contraseña actualizados', 'success');
                } else {
                    showToast('Usuario actualizado correctamente', 'success');
                }
            } else {
                var createRes = await createUsuario(Object.assign({}, payload, { password: inputPassword.value || undefined }));
                if (createRes.error) { showToast('Error: ' + createRes.error.message, 'error'); return; }
                if (createRes.data) state.items.push(createRes.data);
                showToast('Usuario creado correctamente', 'success');
            }
            renderTable();
            closeModal();
        } finally {
            btnSave.disabled = false;
            btnSave.textContent = originalText;
        }
    }

    // Password buttons (create mode)
    container.querySelector('#btn-generar-pwd').addEventListener('click', function() {
        inputPassword.value = generarPasswordAleatoria();
    });

    container.querySelector('#btn-copiar-pwd').addEventListener('click', async function() {
        if (!inputPassword.value) return;
        try {
            await navigator.clipboard.writeText(inputPassword.value);
            showToast('Contraseña copiada al portapapeles', 'success');
        } catch (e) {
            showToast('No se pudo copiar. Cópiala manualmente.', 'warning');
        }
    });

    // Password buttons (edit mode)
    var btnGenerarNueva = container.querySelector('#btn-generar-nueva-pwd');
    if (btnGenerarNueva) {
        btnGenerarNueva.addEventListener('click', function() {
            if (inputNuevaPwd) inputNuevaPwd.value = generarPasswordAleatoria();
        });
    }

    var btnCopiarNueva = container.querySelector('#btn-copiar-nueva-pwd');
    if (btnCopiarNueva) {
        btnCopiarNueva.addEventListener('click', async function() {
            var val = inputNuevaPwd ? inputNuevaPwd.value : '';
            if (!val) return;
            try {
                await navigator.clipboard.writeText(val);
                showToast('Nueva contraseña copiada', 'success');
            } catch (e) {
                showToast('No se pudo copiar. Cópiala manualmente.', 'warning');
            }
        });
    }

    // Search
    searchInput.addEventListener('input', function() {
        state.searchQuery = searchInput.value;
        renderTable();
    });

    // Nuevo usuario button
    var btnNuevoUsuario = container.querySelector('#btn-nuevo-usuario');
    if (!canEdit) {
        btnNuevoUsuario.style.display = 'none';
    } else {
        btnNuevoUsuario.addEventListener('click', function() { openModal(); });
    }

    // Modal events — NO outside-click close
    container.querySelector('#btn-close-usuario-modal').addEventListener('click', closeModal);
    container.querySelector('#btn-cancel-usuario-modal').addEventListener('click', closeModal);
    container.querySelector('#btn-save-usuario').addEventListener('click', handleSave);

    // View modal events — outside-click IS fine here (read-only)
    container.querySelector('#btn-close-view-modal').addEventListener('click', function() { viewModal.classList.remove('active'); });
    container.querySelector('#btn-close-view-modal-2').addEventListener('click', function() { viewModal.classList.remove('active'); });
    viewModal.addEventListener('click', function(e) { if (e.target === viewModal) viewModal.classList.remove('active'); });

    renderTable();
}
