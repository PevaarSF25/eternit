import { getSupabase } from '../db/supabaseClient.js';

export async function getAllInventario() {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inventario_extintores')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[inventarioExtintoresService] getAll error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[inventarioExtintoresService] getAll exception:', err);
        return { data: null, error: err };
    }
}

export async function getInventarioById(id) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inventario_extintores')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('[inventarioExtintoresService] getById error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[inventarioExtintoresService] getById exception:', err);
        return { data: null, error: err };
    }
}

export async function createInventario(datos) {
    try {
        if (!datos.clase_fuego) {
            datos.clase_fuego = 'N/A';
        }
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inventario_extintores')
            .insert(datos)
            .select()
            .single();
            
        if (error) {
            console.error('[inventarioExtintoresService] create error:', error);
            return { data: null, error };
        }
        
        return { data, error: null };
    } catch (err) {
        console.error('[inventarioExtintoresService] create exception:', err);
        return { data: null, error: err };
    }
}

export async function updateInventario(id, datos) {
    try {
        if (!datos.clase_fuego) {
            datos.clase_fuego = 'N/A';
        }
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inventario_extintores')
            .update(datos)
            .eq('id', id)
            .select()
            .single();
            
        if (error) {
            console.error('[inventarioExtintoresService] update error:', error);
            return { data: null, error };
        }
        
        return { data, error: null };
    } catch (err) {
        console.error('[inventarioExtintoresService] update exception:', err);
        return { data: null, error: err };
    }
}

export async function deleteInventario(id) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inventario_extintores')
            .delete()
            .eq('id', id)
            .select()
            .single();
            
        if (error) {
            console.error('[inventarioExtintoresService] delete error:', error);
            return { data: null, error };
        }
        return { data, error: null };
    } catch (err) {
        console.error('[inventarioExtintoresService] delete exception:', err);
        return { data: null, error: err };
    }
}

export async function getExtintorInspectionsHistory(numeroSerie) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('extintores_detalle')
            .select(`
                *,
                inspecciones_extintores (
                    fecha,
                    lugar_trabajo,
                    inspector_nombre,
                    inspector_cargo,
                    observaciones_generales
                )
            `)
            .eq('codigo', numeroSerie);

        if (error) {
            console.error('[inventarioExtintoresService] getHistory error:', error);
            return { data: null, error };
        }

        // Sort by date (descending)
        if (data) {
            data.sort((a, b) => {
                const dateA = a.inspecciones_extintores?.fecha ? new Date(a.inspecciones_extintores.fecha) : new Date(0);
                const dateB = b.inspecciones_extintores?.fecha ? new Date(b.inspecciones_extintores.fecha) : new Date(0);
                return dateB - dateA;
            });
        }

        return { data, error: null };
    } catch (err) {
        console.error('[inventarioExtintoresService] getHistory exception:', err);
        return { data: null, error: err };
    }
}
