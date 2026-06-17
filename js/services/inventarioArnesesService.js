import { getSupabase } from '../db/supabaseClient.js';

export async function getAllInventario() {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inventario_arneses')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[inventarioArnesesService] getAll error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[inventarioArnesesService] getAll exception:', err);
        return { data: null, error: err };
    }
}

export async function getInventarioById(id) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inventario_arneses')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('[inventarioArnesesService] getById error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[inventarioArnesesService] getById exception:', err);
        return { data: null, error: err };
    }
}

export async function createInventario(datos) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inventario_arneses')
            .insert(datos)
            .select()
            .single();
            
        if (error) {
            console.error('[inventarioArnesesService] create error:', error);
            return { data: null, error };
        }
        
        return { data, error: null };
    } catch (err) {
        console.error('[inventarioArnesesService] create exception:', err);
        return { data: null, error: err };
    }
}

export async function updateInventario(id, datos) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inventario_arneses')
            .update(datos)
            .eq('id', id)
            .select()
            .single();
            
        if (error) {
            console.error('[inventarioArnesesService] update error:', error);
            return { data: null, error };
        }
        
        return { data, error: null };
    } catch (err) {
        console.error('[inventarioArnesesService] update exception:', err);
        return { data: null, error: err };
    }
}

export async function deleteInventario(id) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inventario_arneses')
            .delete()
            .eq('id', id)
            .select()
            .single();
            
        if (error) {
            console.error('[inventarioArnesesService] delete error:', error);
            return { data: null, error };
        }
        return { data, error: null };
    } catch (err) {
        console.error('[inventarioArnesesService] delete exception:', err);
        return { data: null, error: err };
    }
}

export async function getArnesInspectionsHistory(codigoArnes) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('arneses_detalle')
            .select(`
                *,
                inspecciones_arneses (
                    fecha,
                    lugar_trabajo,
                    inspector_nombre,
                    inspector_cargo,
                    observaciones_generales
                )
            `)
            .eq('codigo_arnes', codigoArnes);

        if (error) {
            console.error('[inventarioArnesesService] getHistory error:', error);
            return { data: null, error };
        }

        // Sort by date (descending)
        if (data) {
            data.sort((a, b) => {
                const dateA = a.inspecciones_arneses?.fecha ? new Date(a.inspecciones_arneses.fecha) : new Date(0);
                const dateB = b.inspecciones_arneses?.fecha ? new Date(b.inspecciones_arneses.fecha) : new Date(0);
                return dateB - dateA;
            });
        }

        return { data, error: null };
    } catch (err) {
        console.error('[inventarioArnesesService] getHistory exception:', err);
        return { data: null, error: err };
    }
}
