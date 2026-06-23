import { initSidebar, updateActiveNav } from './components/sidebar.js';
import { initHeader, updateHeader } from './components/header.js';

// Lazy loading the views to avoid circular dependencies and speed up initial load
const routes = {
  '#registro-general': {
    loadView: () => import('./views/registroView.js').then(m => c => m.renderRegistro(c, 'Directo')),
    title: 'Estadísticas (General)'
  },
  '#registro-contratistas': {
    loadView: () => import('./views/registroView.js').then(m => c => m.renderRegistro(c, 'Contratista')),
    title: 'Estadísticas (Contratistas)'
  },
  '#inspeccion-extintores': {
    loadView: () => import('./views/inspeccionExtintoresView.js').then(m => m.renderInspeccionExtintores),
    title: 'Inspección Extintores'
  },
  '#dashboard': {
    loadView: () => import('./views/dashboardView.js').then(m => m.renderDashboard),
    title: 'Dashboard HSE'
  },
  '#parametricas': {
    loadView: () => import('./views/parametricaView.js').then(m => m.renderParametricas),
    title: 'Configuración Paramétricas'
  },
  '#inventario-extintores': {
    loadView: () => import('./views/inventarioExtintoresView.js').then(m => m.renderInventarioExtintores),
    title: 'Extintores'
  },
  '#inventario-arneses': {
    loadView: () => import('./views/inventarioArnesesView.js').then(m => m.renderInventarioArneses),
    title: 'Arneses'
  },
  '#inspeccion-arneses': {
    loadView: () => import('./views/inspeccionArnesesView.js').then(m => m.renderInspeccionArneses),
    title: 'Inspección Arneses'
  },
  '#seguridad-niveles': {
    loadView: () => import('./views/nivelesAccesoView.js').then(m => m.renderNivelesAcceso),
    title: 'Niveles de acceso'
  },
  '#seguridad-usuarios': {
    loadView: () => import('./views/usuariosView.js').then(m => m.renderUsuarios),
    title: 'Usuarios'
  }
};

let currentViewDestroy = null;

async function navigateTo(hash) {
  // Default route
  if (!hash || !routes[hash]) {
    hash = '#registro-general';
    window.location.hash = hash;
    return;
  }

  const route = routes[hash];
  const mainContent = document.getElementById('main-content');
  
  // Show loading
  mainContent.innerHTML = `
    <div class="loading-screen" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:var(--color-text-secondary)">
      <div class="spinner" style="margin-bottom:1rem"></div>
      <p>Cargando vista...</p>
    </div>
  `;

  try {
    // Update layout UI
    updateActiveNav(hash);
    updateHeader(route.title);
    
    // Cleanup previous view if needed (useful for charts)
    if (currentViewDestroy && typeof currentViewDestroy === 'function') {
      currentViewDestroy();
      currentViewDestroy = null;
    }

    // Load and render view
    const renderFn = await route.loadView();
    // Render returns a cleanup function optionally
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

// Initialization
document.addEventListener('DOMContentLoaded', () => {
  initSidebar();
  initHeader();
  
  // Handle navigation events
  window.addEventListener('hashchange', () => {
    navigateTo(window.location.hash);
  });

  // Initial load
  navigateTo(window.location.hash);
});
