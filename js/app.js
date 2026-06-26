import { initSidebar, updateActiveNav } from './components/sidebar.js';
import { initHeader, updateHeader } from './components/header.js';
import { requireAuth, hasPermission, getSession } from './auth.js';

const routes = {
  '#registro-general': {
    loadView: () => import('./views/registroView.js').then(m => c => m.renderRegistro(c, 'Directo')),
    title: 'Estadísticas (General)',
    permission: 'VIEW_ESTADISTICAS_GENERAL'
  },
  '#registro-contratistas': {
    loadView: () => import('./views/registroView.js').then(m => c => m.renderRegistro(c, 'Contratista')),
    title: 'Estadísticas (Contratistas)',
    permission: 'VIEW_ESTADISTICAS_CONTRATISTAS'
  },
  '#inspeccion-extintores': {
    loadView: () => import('./views/inspeccionExtintoresView.js').then(m => m.renderInspeccionExtintores),
    title: 'Inspección Extintores',
    permission: 'VIEW_INSPECCION_EXTINTORES'
  },
  '#dashboard': {
    loadView: () => import('./views/dashboardView.js').then(m => m.renderDashboard),
    title: 'Dashboard HSE',
    permission: 'VIEW_DASHBOARD'
  },
  '#parametricas': {
    loadView: () => import('./views/parametricaView.js').then(m => m.renderParametricas),
    title: 'Configuración Paramétricas',
    permission: 'VIEW_PARAMETRICAS'
  },
  '#inventario-extintores': {
    loadView: () => import('./views/inventarioExtintoresView.js').then(m => m.renderInventarioExtintores),
    title: 'Extintores',
    permission: 'VIEW_INVENTARIO_EXTINTORES'
  },
  '#inventario-arneses': {
    loadView: () => import('./views/inventarioArnesesView.js').then(m => m.renderInventarioArneses),
    title: 'Arneses',
    permission: 'VIEW_INVENTARIO_ARNESES'
  },
  '#inspeccion-arneses': {
    loadView: () => import('./views/inspeccionArnesesView.js').then(m => m.renderInspeccionArneses),
    title: 'Inspección Arneses',
    permission: 'VIEW_INSPECCION_ARNESES'
  },
  '#inspeccion-ao': {
    loadView: () => import('./views/inspeccionAOView.js').then(m => m.renderInspeccionAO),
    title: 'Inspección A/O',
    permission: 'VIEW_INSPECCION_AO'
  },
  '#inspeccion-eslinga': {
    loadView: () => import('./views/inspeccionEslingaView.js').then(m => m.renderInspeccionEslinga),
    title: 'Inspección Eslinga',
    permission: 'VIEW_INSPECCION_ESLINGA'
  },
  '#inspeccion-vehiculos': {
    loadView: () => import('./views/inspeccionVehiculosView.js').then(m => m.renderInspeccionVehiculos),
    title: 'Inspección Vehículos',
    permission: 'VIEW_INSPECCION_VEHICULOS'
  },
  '#inspeccion-herramientas': {
    loadView: () => import('./views/inspeccionHerramientasView.js').then(m => m.renderInspeccionHerramientas),
    title: 'Inspección Herramientas Manuales',
    permission: 'VIEW_INSPECCION_HERRAMIENTAS'
  },
  '#inspeccion-oa-operativas': {
    loadView: () => import('./views/inspeccionOAOperativasView.js').then(m => m.renderInspeccionOAOperativas),
    title: 'Inspección Orden y Aseo Operativas',
    permission: 'VIEW_INSPECCION_OA_OPERATIVAS'
  },
  '#seguridad-niveles': {
    loadView: () => import('./views/nivelesAccesoView.js').then(m => m.renderNivelesAcceso),
    title: 'Niveles de acceso',
    permission: 'VIEW_NIVELES_ACCESO'
  },
  '#seguridad-usuarios': {
    loadView: () => import('./views/usuariosView.js').then(m => m.renderUsuarios),
    title: 'Usuarios',
    permission: 'VIEW_USUARIOS'
  }
};

let currentNavigationToken = 0;
let currentViewDestroy = null;

async function navigateTo(hash) {
  if (!hash || !routes[hash]) {
    // Redirect to first permitted route
    const first = Object.entries(routes).find(([, r]) => !r.permission || hasPermission(r.permission));
    hash = first ? first[0] : '#acceso-denegado';
    window.location.hash = hash;
    return;
  }

  currentNavigationToken++;
  const thisToken = currentNavigationToken;

  const route = routes[hash];
  const mainContent = document.getElementById('main-content');

  // ── Permission check ──────────────────────────────────────
  const session = getSession();
  if (route.permission && !session?.isSuperAdmin && !hasPermission(route.permission)) {
    updateActiveNav(hash);
    updateHeader(route.title);
    mainContent.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:60%;gap:var(--space-4);color:var(--color-text-secondary);">
        <i data-lucide="shield-off" style="width:64px;height:64px;opacity:0.3;"></i>
        <h2 style="font-size:var(--text-xl);color:var(--color-text-primary);margin:0;">Acceso denegado</h2>
        <p style="font-size:var(--text-sm);margin:0;">No tienes permiso para ver esta sección.</p>
        <p style="font-size:var(--text-xs);color:var(--color-text-secondary);margin:0;">Contacta al administrador para solicitar acceso.</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons({ nodes: [mainContent] });
    return;
  }

  mainContent.innerHTML = `
    <div class="loading-screen" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--color-text-secondary)">
      <div class="spinner" style="margin-bottom:1rem"></div>
      <p>Cargando vista...</p>
    </div>
  `;

  try {
    updateActiveNav(hash);
    updateHeader(route.title);

    if (currentViewDestroy && typeof currentViewDestroy === 'function') {
      currentViewDestroy();
      currentViewDestroy = null;
    }

    const renderFn = await route.loadView();

    // Check if navigation has changed during import
    if (thisToken !== currentNavigationToken) {
      return;
    }

    // Create a dedicated container for this view
    const viewContainer = document.createElement('div');
    viewContainer.style.width = '100%';
    viewContainer.style.height = '100%';

    // Wrap the container in a Proxy to detect and abort obsolete rendering
    const proxyContainer = new Proxy(viewContainer, {
      get(target, prop) {
        if (thisToken !== currentNavigationToken) {
          throw new Error('NavigationAborted');
        }
        const val = target[prop];
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      },
      set(target, prop, value) {
        if (thisToken !== currentNavigationToken) {
          throw new Error('NavigationAborted');
        }
        target[prop] = value;
        return true;
      }
    });

    // Successfully loaded layout container, attach it to mainContent before rendering so document.getElementById queries succeed
    mainContent.innerHTML = '';
    mainContent.appendChild(viewContainer);

    const destroyFn = await renderFn(proxyContainer);

    // If navigation changed while rendering, clean up and exit
    if (thisToken !== currentNavigationToken) {
      if (destroyFn && typeof destroyFn === 'function') {
        destroyFn();
      }
      return;
    }

    // Scan for icons in the newly appended view container
    if (window.lucide) {
      window.lucide.createIcons({ nodes: [viewContainer] });
    }

    currentViewDestroy = destroyFn;

  } catch (error) {
    if (error.message === 'NavigationAborted') {
      // Ignored silently as this navigation is obsolete
      return;
    }
    console.error('Error loading view:', error);
    mainContent.innerHTML = `
      <div class="card" style="border-color:var(--color-danger)">
        <h3 style="color:var(--color-danger)">Error cargando la vista</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const session = requireAuth();
  if (!session) return;

  initSidebar();
  initHeader(session);

  window.addEventListener('hashchange', () => {
    navigateTo(window.location.hash);
  });

  navigateTo(window.location.hash);
});
