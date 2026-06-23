import { sha256, SESSION_KEY, saveSession, getSession } from './auth.js';
import { getSupabase } from './db/supabaseClient.js';

const SUPER_ADMIN_EMAIL = 'admin@eternit.co';
const SUPER_ADMIN_PWD   = 'Eternit2025*';

async function doLogin(email, password) {
    const emailLow = email.trim().toLowerCase();

    // Super admin shortcut
    if (emailLow === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PWD) {
        saveSession({ id: 'super-admin', nombre: 'Super Admin', correo: SUPER_ADMIN_EMAIL, nivel: 'SUPER_ADMIN', isSuperAdmin: true });
        return { ok: true };
    }

    // Regular user — check against usuarios table
    const hash = await sha256(password);
    const sb = getSupabase();
    const { data, error } = await sb
        .from('usuarios')
        .select('id, nombre, correo, estado, contrasena_hash, nivel_acceso_id, niveles_acceso(nombre, permisos)')
        .eq('correo', emailLow)
        .maybeSingle();

    if (error || !data)       return { ok: false, msg: 'Credenciales incorrectas.' };
    if (data.estado !== 'activo') return { ok: false, msg: 'Tu cuenta está inactiva. Contacta al administrador.' };
    if (!data.contrasena_hash)    return { ok: false, msg: 'Esta cuenta no tiene contraseña configurada. Contacta al administrador.' };
    if (data.contrasena_hash !== hash) return { ok: false, msg: 'Credenciales incorrectas.' };

    saveSession({
        id: data.id,
        nombre: data.nombre,
        correo: data.correo,
        nivel: data.niveles_acceso?.nombre || 'USER',
        permisos: data.niveles_acceso?.permisos || [],
        isSuperAdmin: false
    });
    return { ok: true };
}

document.addEventListener('DOMContentLoaded', () => {
    // Already logged in → go straight to app
    if (getSession()) {
        window.location.href = 'index.html';
        return;
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();

    const form       = document.getElementById('login-form');
    const emailInput = document.getElementById('login-email');
    const pwdInput   = document.getElementById('login-password');
    const btnText    = document.getElementById('login-btn-text');
    const spinner    = document.getElementById('login-spinner');
    const errorDiv   = document.getElementById('login-error');
    const togglePwd  = document.getElementById('toggle-password');
    const eyeIcon    = document.getElementById('pwd-eye-icon');
    const loginBtn   = document.getElementById('login-btn');

    togglePwd.addEventListener('click', () => {
        const isHidden = pwdInput.type === 'password';
        pwdInput.type = isHidden ? 'text' : 'password';
        eyeIcon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
        if (typeof lucide !== 'undefined') lucide.createIcons({ nodes: [togglePwd] });
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorDiv.style.display = 'none';
        loginBtn.disabled = true;
        btnText.textContent = 'Verificando...';
        spinner.style.display = 'block';

        try {
            const result = await doLogin(emailInput.value, pwdInput.value);
            if (result.ok) {
                window.location.href = 'index.html';
            } else {
                errorDiv.textContent = result.msg;
                errorDiv.style.display = 'flex';
                pwdInput.value = '';
                pwdInput.focus();
            }
        } catch (err) {
            errorDiv.textContent = 'Error de conexión. Intenta nuevamente.';
            errorDiv.style.display = 'flex';
        } finally {
            loginBtn.disabled = false;
            btnText.textContent = 'Ingresar';
            spinner.style.display = 'none';
        }
    });
});
