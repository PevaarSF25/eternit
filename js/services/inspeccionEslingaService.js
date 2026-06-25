import { getSupabase } from '../db/supabaseClient.js';

const TABLA = 'inspeccion_eslinga';

export async function getAllInspeccionesEslinga() {
    const sb = getSupabase();
    const { data, error } = await sb
        .from(TABLA)
        .select('*')
        .order('fecha', { ascending: false });
    return { data, error };
}

export async function getInspeccionEslingaById(id) {
    const sb = getSupabase();
    const { data, error } = await sb.from(TABLA).select('*').eq('id', id).single();
    return { data, error };
}

export async function createInspeccionEslinga(payload) {
    const sb = getSupabase();
    const { data, error } = await sb.from(TABLA).insert([payload]).select().single();
    return { data, error };
}

export async function updateInspeccionEslinga(id, payload) {
    const sb = getSupabase();
    const { data, error } = await sb
        .from(TABLA)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    return { data, error };
}

export async function deleteInspeccionEslinga(id) {
    const sb = getSupabase();
    const { error } = await sb.from(TABLA).delete().eq('id', id);
    return { error };
}
