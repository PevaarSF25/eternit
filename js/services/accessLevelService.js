import { getSupabase } from '../db/supabaseClient.js';

const TABLA = 'niveles_acceso';

export async function getNivelesAcceso() {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .select('*')
            .order('nombre', { ascending: true });

        if (error) return { data: null, error };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err };
    }
}

export async function getNivelAccesoById(id) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .select('*')
            .eq('id', id)
            .single();

        if (error) return { data: null, error };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err };
    }
}

export async function createNivelAcceso({ nombre, descripcion, permisos = [] }) {
    try {
        if (!nombre?.trim()) {
            return { data: null, error: new Error('El nombre del nivel de acceso es obligatorio.') };
        }

        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .insert({ nombre: nombre.trim(), descripcion: descripcion?.trim() || '', permisos })
            .select()
            .single();

        if (error) return { data: null, error };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err };
    }
}

export async function updateNivelAcceso(id, { nombre, descripcion, permisos }) {
    try {
        if (!nombre?.trim()) {
            return { data: null, error: new Error('El nombre del nivel de acceso es obligatorio.') };
        }

        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .update({ nombre: nombre.trim(), descripcion: descripcion?.trim() || '', permisos, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .single();

        if (error) return { data: null, error };
        return { data, error: null };
    } catch (err) {
        return { data: null, error: err };
    }
}

export async function deleteNivelAcceso(id) {
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
