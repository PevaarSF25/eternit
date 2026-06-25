import { getSupabase } from '../db/supabaseClient.js';

const TABLA = 'inspeccion_oa_operativas';

export async function getAllInspeccionesOAOperativas() {
    const sb = getSupabase();
    const { data, error } = await sb
        .from(TABLA)
        .select('*')
        .order('fecha', { ascending: false });
    return { data, error };
}

export async function createInspeccionOAOperativas(payload) {
    const sb = getSupabase();
    const { data, error } = await sb.from(TABLA).insert([payload]).select().single();
    return { data, error };
}

export async function updateInspeccionOAOperativas(id, payload) {
    const sb = getSupabase();
    const { data, error } = await sb
        .from(TABLA)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    return { data, error };
}

export async function deleteInspeccionOAOperativas(id) {
    const sb = getSupabase();
    const { error } = await sb.from(TABLA).delete().eq('id', id);
    return { error };
}
