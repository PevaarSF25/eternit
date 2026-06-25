import { getSession } from '../auth.js';

const MENU_ITEMS = [
    { label: 'Dashboard', icon: 'bar-chart-2', hash: '#dashboard', permission: 'VIEW_DASHBOARD' },
    {
        label: 'Seguridad',
        icon: 'lock',
        isCollapse: true,
        children: [
            { label: 'Niveles de acceso', hash: '#seguridad-niveles', permission: 'VIEW_NIVELES_ACCESO' },
            { label: 'Usuarios', hash: '#seguridad-usuarios', permission: 'VIEW_USUARIOS' }
        ]
    },
    {
        label: 'Administración',
        icon: 'building-2',
        isCollapse: true,
        children: [
            { label: 'Paramétricas', hash: '#parametricas', permission: 'VIEW_PARAMETRICAS' }
        ]
    },
    {
        label: 'Estadísticas',
        icon: 'clipboard-list',
        isCollapse: true,
        children: [
            { label: 'General', hash: '#registro-general', permission: 'VIEW_ESTADISTICAS_GENERAL' },
            { label: 'Contratistas', hash: '#registro-contratistas', permission: 'VIEW_ESTADISTICAS_CONTRATISTAS' }
        ]
    },
    {
        label: 'Equipos',
        icon: 'package',
        isCollapse: true,
        children: [
            { label: 'Extintores', hash: '#inventario-extintores', permission: 'VIEW_INVENTARIO_EXTINTORES' },
            { label: 'Alturas', hash: '#inventario-arneses', permission: 'VIEW_INVENTARIO_ARNESES' }
        ]
    },
    {
        label: 'Inspección',
        icon: 'shield-check',
        isCollapse: true,
        children: [
            { label: 'Inspección Extintores', hash: '#inspeccion-extintores', permission: 'VIEW_INSPECCION_EXTINTORES' },
            { label: 'Inspección Arneses', hash: '#inspeccion-arneses', permission: 'VIEW_INSPECCION_ARNESES' },
            { label: 'Inspección A/O', hash: '#inspeccion-ao', permission: 'VIEW_INSPECCION_AO' },
            { label: 'Inspección Eslinga', hash: '#inspeccion-eslinga', permission: 'VIEW_INSPECCION_ESLINGA' }
        ]
    }
];

function canSee(permission) {
    const s = getSession();
    if (!s) return false;
    if (s.isSuperAdmin) return true;
    if (!permission) return true;
    return Array.isArray(s.permisos) && s.permisos.includes(permission);
}

let isCollapsed = false;

/**
 * Initializes the sidebar and renders it into the #sidebar container.
 */
export function initSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) {
        console.error('Sidebar: #sidebar container not found');
        return;
    }

    renderSidebar(sidebar);
    attachEvents(sidebar);

    // Set initial active state
    updateActiveNav(window.location.hash || '#registro-general');
}

/**
 * Renders the sidebar HTML.
 */
function renderSidebar(sidebar) {
    const menuItemsHtml = MENU_ITEMS.map(item => {
        if (item.isCollapse) {
            const visibleChildren = item.children.filter(c => canSee(c.permission));
            if (visibleChildren.length === 0) return '';

            const childrenHtml = visibleChildren.map(child => `
                <a href="${child.hash}" class="sidebar-nav-subitem" data-hash="${child.hash}">
                    <span class="sidebar-nav-label">${child.label}</span>
                </a>
            `).join('');

            return `
                <div class="sidebar-nav-group">
                    <button class="sidebar-nav-item toggle-collapse" data-tooltip="${item.label}">
                        <span class="sidebar-nav-icon">
                            <i data-lucide="${item.icon}"></i>
                        </span>
                        <span class="sidebar-nav-label">${item.label}</span>
                        <span class="sidebar-nav-chevron">
                            <i data-lucide="chevron-down"></i>
                        </span>
                    </button>
                    <div class="sidebar-subnav">
                        ${childrenHtml}
                    </div>
                </div>
            `;
        } else {
            if (!canSee(item.permission)) return '';
            return `
                <a href="${item.hash}" class="sidebar-nav-item" data-hash="${item.hash}" data-tooltip="${item.label}">
                    <span class="sidebar-nav-icon">
                        <i data-lucide="${item.icon}"></i>
                    </span>
                    <span class="sidebar-nav-label">${item.label}</span>
                </a>
            `;
        }
    }).join('');

    sidebar.innerHTML = `
        <!-- Logo Section -->
        <div class="sidebar-header">
            <div class="sidebar-logo">E</div>
            <div class="sidebar-brand">
                <span class="sidebar-brand-name">ETERNIT</span>
                <span class="sidebar-brand-sub">HSE Manager</span>
            </div>
        </div>

        <!-- Navigation -->
        <nav class="sidebar-nav">
            ${menuItemsHtml}
        </nav>

        <!-- Toggle Button -->
        <div class="sidebar-footer">
            <button id="sidebar-toggle" class="sidebar-toggle">
                <i data-lucide="chevrons-left" class="sidebar-toggle-icon" id="toggle-icon"></i>
                <span class="sidebar-toggle-label">Cerrar</span>
            </button>
        </div>
    `;

    // Render lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons({ nodes: [sidebar] });
    }
}

/**
 * Attaches event listeners to the sidebar.
 */
function attachEvents(sidebar) {
    // Expand sidebar if clicked anywhere while collapsed
    sidebar.addEventListener('click', (e) => {
        if (isCollapsed) {
            isCollapsed = false;
            document.body.classList.remove('collapsed');
            
            // Re-render to ensure correct icon state
            if (typeof lucide !== 'undefined') {
                lucide.createIcons({ nodes: [sidebar] });
            }
            return;
        }

        const toggleBtn = e.target.closest('#sidebar-toggle');
        if (toggleBtn) {
            isCollapsed = !isCollapsed;
            document.body.classList.toggle('collapsed', isCollapsed);
        }
        
        const collapseBtn = e.target.closest('.toggle-collapse');
        if (collapseBtn) {
            const group = collapseBtn.closest('.sidebar-nav-group');
            group.classList.toggle('open');
        }
    });
}

/**
 * Updates which navigation item is visually active.
 * @param {string} hash - The current route hash (e.g., '#registro')
 */
export function updateActiveNav(hash) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Reset all
    sidebar.querySelectorAll('.sidebar-nav-item, .sidebar-nav-subitem').forEach(item => {
        item.classList.remove('active');
    });

    // Find and activate the correct item
    const activeItem = sidebar.querySelector(`[data-hash="${hash}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
        
        // If it's a subitem, ensure the parent group is open
        const parentGroup = activeItem.closest('.sidebar-nav-group');
        if (parentGroup) {
            parentGroup.classList.add('open');
            parentGroup.querySelector('.sidebar-nav-item').classList.add('active-parent');
        } else {
            // Remove active-parent from all if a top level is active
            sidebar.querySelectorAll('.active-parent').forEach(p => p.classList.remove('active-parent'));
        }
    }
}
