import { getSupabase } from '../db/supabaseClient.js';

const TABLA = 'inspeccion_vehiculos';

export async function getAllInspeccionesVehiculos() {
    const sb = getSupabase();
    const { data, error } = await sb
        .from(TABLA)
        .select('*')
        .order('fecha', { ascending: false });
    return { data, error };
}

export async function createInspeccionVehiculos(payload) {
    const sb = getSupabase();
    const { data, error } = await sb.from(TABLA).insert([payload]).select().single();
    return { data, error };
}

export async function updateInspeccionVehiculos(id, payload) {
    const sb = getSupabase();
    const { data, error } = await sb
        .from(TABLA)
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
    return { data, error };
}

export async function deleteInspeccionVehiculos(id) {
    const sb = getSupabase();
    const { error } = await sb.from(TABLA).delete().eq('id', id);
    return { error };
}
