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

let currentViewDestroy = null;

async function navigateTo(hash) {
  if (!hash || !routes[hash]) {
    // Redirect to first permitted route
    const first = Object.entries(routes).find(([, r]) => !r.permission || hasPermission(r.permission));
    hash = first ? first[0] : '#acceso-denegado';
    window.location.hash = hash;
    return;
  }

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
    currentViewDestroy = await renderFn(mainContent);

  } catch (error) {
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
