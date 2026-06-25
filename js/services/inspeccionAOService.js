import { getSupabase } from '../db/supabaseClient.js';

const TABLA = 'inspeccion_ao';

export async function getAllInspeccionesAO() {
    const sb = getSupabase();
    const { data, error } = await sb
        .from(TABLA)
        .select('*')
        .order('fecha', { ascending: false });
    return { data, error };
}

export async function getInspeccionAOById(id) {
    const sb = getSupabase();
    const { data, error } = await sb.from(TABLA).select('*').eq('id', id).single();
    return { data, error };
}

export async function createInspeccionAO(payload) {
    const sb = getSupabase();
    const { data, error } = await sb.from(TABLA).insert([payload]).select().single();
    return { data, error };
}

export async function updateInspeccionAO(id, payload) {
    const sb = getSupabase();
    const { data, error } = await sb
        .from(TABLA)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    return { data, error };
}

export async function deleteInspeccionAO(id) {
    const sb = getSupabase();
    const { error } = await sb.from(TABLA).delete().eq('id', id);
    return { error };
}
