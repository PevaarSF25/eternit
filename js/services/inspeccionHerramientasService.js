import { getSupabase } from '../db/supabaseClient.js';

const TABLA = 'inspeccion_herramientas';

export async function getAllInspeccionesHerramientas() {
    const sb = getSupabase();
    const { data, error } = await sb
        .from(TABLA)
        .select('*')
        .order('fecha', { ascending: false });
    return { data, error };
}

export async function createInspeccionHerramientas(payload) {
    const sb = getSupabase();
    const { data, error } = await sb.from(TABLA).insert([payload]).select().single();
    return { data, error };
}

export async function updateInspeccionHerramientas(id, payload) {
    const sb = getSupabase();
    const { data, error } = await sb
        .from(TABLA)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    return { data, error };
}

export async function deleteInspeccionHerramientas(id) {
    const sb = getSupabase();
    const { error } = await sb.from(TABLA).delete().eq('id', id);
    return { error };
}
