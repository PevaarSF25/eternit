import { logout } from '../auth.js';

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES_NOMBRE = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

let clockInterval = null;

export function initHeader(session = {}) {
    const header = document.getElementById('header');
    if (!header) {
        console.error('Header: #header container not found');
        return;
    }

    renderHeader(header, session);
    startClock();
}

function renderHeader(header, session = {}) {
    const nombre  = session.nombre || 'Super Admin';
    const nivel   = session.nivel  || 'HSE Manager';
    const initials = nombre.split(' ').map(w => w[0] || '').join('').substring(0, 2).toUpperCase() || 'SA';

    header.innerHTML = `
        <div class="header-inner" style="
            display: flex;
            align-items: center;
            justify-content: space-between;
            height: 100%;
            padding: 0 var(--space-6);
        ">
            <!-- Left Side: Interactive Breadcrumb -->
            <div class="header-left">
                <a href="#dashboard" class="header-home-btn" title="Ir al Inicio">
                    <i data-lucide="home"></i>
                </a>
                <span class="breadcrumb-separator">/</span>
                <div class="breadcrumb-current-wrapper">
                    <span id="header-breadcrumb" class="breadcrumb-current">Registro de Datos</span>
                </div>
            </div>

            <!-- Right Side: Status HUD, Actions & Profile -->
            <div class="header-right">
                <!-- System Status HUD -->
                <div class="hud-status">
                    <span class="status-pulse-dot"></span>
                    <span class="hud-label">SISTEMA ONLINE</span>
                </div>

                <!-- Interactive Clock Widget -->
                <div id="header-clock" class="header-clock-widget">
                    <i data-lucide="clock"></i>
                    <span id="clock-text">${formatDateTime(new Date())}</span>
                </div>

                <div class="header-divider"></div>

                <!-- Logout button -->
                <button id="header-logout-btn" class="header-action-btn" title="Cerrar sesión" style="color:var(--color-danger,#ef4444);">
                    <i data-lucide="log-out"></i>
                </button>

                <div class="header-divider"></div>

                <!-- User Profile -->
                <div class="header-user-profile">
                    <div class="avatar-wrapper">
                        <div class="avatar-ring"></div>
                        <div class="avatar-img">${initials}</div>
                        <span class="user-status-dot"></span>
                    </div>
                    <div class="user-meta">
                        <span class="user-name">${nombre}</span>
                        <span class="user-role">${nivel}</span>
                    </div>
                </div>
            </div>
        </div>
    `;

    if (typeof lucide !== 'undefined') {
        lucide.createIcons({ nodes: [header] });
    }

    header.querySelector('#header-logout-btn').addEventListener('click', () => {
        if (confirm('¿Cerrar sesión?')) logout();
    });
}

/**
 * Formats a Date object into the Spanish display format.
 * Example: "Mar 27 May 2026 — 14:30:45"
 * @param {Date} date
 * @returns {string}
 */
function formatDateTime(date) {
    const dia = DIAS_SEMANA[date.getDay()];
    const num = date.getDate();
    const mes = MESES_NOMBRE[date.getMonth()];
    const anio = date.getFullYear();
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${dia} ${num} ${mes} ${anio} — ${hh}:${mm}:${ss}`;
}

/**
 * Starts the live clock that updates every second.
 */
function startClock() {
    // Clear any existing interval
    if (clockInterval) clearInterval(clockInterval);

    clockInterval = setInterval(() => {
        const clockText = document.getElementById('clock-text');
        if (clockText) {
            clockText.textContent = formatDateTime(new Date());
        }
    }, 1000);
}

/**
 * Updates the breadcrumb/page title in the header.
 * @param {string} pageTitle - The title to display.
 */
export function updateHeader(pageTitle) {
    const breadcrumb = document.getElementById('header-breadcrumb');
    if (breadcrumb) {
        breadcrumb.textContent = pageTitle;
    }
}
