import { getSupabase } from '../db/supabaseClient.js';

const TABLA = 'usuarios';

export async function getUsuarios() {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .select(`
                *,
                niveles_acceso (id, nombre)
            `)
            .order('nombre', { ascending: true });

        if (error) return { data: null, error };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err };
    }
}

export async function getUsuarioById(id) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .select(`*, niveles_acceso (id, nombre)`)
            .eq('id', id)
            .single();

        if (error) return { data: null, error };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err };
    }
}

export async function createUsuario({ nombre, documento, correo, nivel_acceso_id, estado = 'activo' }) {
    try {
        if (!nombre?.trim()) return { data: null, error: new Error('El nombre es obligatorio.') };
        if (!correo?.trim()) return { data: null, error: new Error('El correo es obligatorio.') };

        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .insert({
                nombre: nombre.trim(),
                documento: documento?.trim() || null,
                correo: correo.trim().toLowerCase(),
                nivel_acceso_id: nivel_acceso_id || null,
                estado
            })
            .select(`*, niveles_acceso (id, nombre)`)
            .single();

        if (error) return { data: null, error };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err };
    }
}

export async function updateUsuario(id, { nombre, documento, correo, nivel_acceso_id, estado }) {
    try {
        if (!nombre?.trim()) return { data: null, error: new Error('El nombre es obligatorio.') };
        if (!correo?.trim()) return { data: null, error: new Error('El correo es obligatorio.') };

        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .update({
                nombre: nombre.trim(),
                documento: documento?.trim() || null,
                correo: correo.trim().toLowerCase(),
                nivel_acceso_id: nivel_acceso_id || null,
                estado,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select(`*, niveles_acceso (id, nombre)`)
            .single();

        if (error) return { data: null, error };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err };
    }
}

export async function deleteUsuario(id) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) return { data: null, error };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err };
    }
}
