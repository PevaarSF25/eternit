import { getSupabase } from '../db/supabaseClient.js';

export async function getAllInspecciones() {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inspecciones_extintores')
            .select(`
                *,
                extintores_detalle (*)
            `)
            .order('fecha', { ascending: false });

        if (error) {
            console.error('[inspeccionService] getAll error:', error);
            return { data: null, error };
        }

        // Map data to easily access extintores count
        const mappedData = data.map(item => ({
            ...item,
            total_extintores: item.extintores_detalle ? item.extintores_detalle.length : 0
        }));

        return { data: mappedData, error: null };
    } catch (err) {
        console.error('[inspeccionService] getAll exception:', err);
        return { data: null, error: err };
    }
}

export async function getInspeccionById(id) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inspecciones_extintores')
            .select(`
                *,
                extintores_detalle (*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('[inspeccionService] getById error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[inspeccionService] getById exception:', err);
        return { data: null, error: err };
    }
}

export async function createInspeccion(cabecera, detalles) {
    try {
        const sb = getSupabase();
        
        // 1. Create header
        const { data: header, error: headerError } = await sb
            .from('inspecciones_extintores')
            .insert(cabecera)
            .select()
            .single();
            
        if (headerError) {
            console.error('[inspeccionService] create header error:', headerError);
            return { data: null, error: headerError };
        }
        
        // 2. Insert details
        if (detalles && detalles.length > 0) {
            const detallesWithId = detalles.map(d => ({ ...d, inspeccion_id: header.id }));
            const { error: detallesError } = await sb
                .from('extintores_detalle')
                .insert(detallesWithId);
                
            if (detallesError) {
                console.error('[inspeccionService] create details error:', detallesError);
                return { data: null, error: detallesError };
            }
        }
        
        return { data: header, error: null };
    } catch (err) {
        console.error('[inspeccionService] create exception:', err);
        return { data: null, error: err };
    }
}

export async function updateInspeccion(id, cabecera, detalles) {
    try {
        const sb = getSupabase();
        
        // 1. Update header
        const { data: header, error: headerError } = await sb
            .from('inspecciones_extintores')
            .update(cabecera)
            .eq('id', id)
            .select()
            .single();
            
        if (headerError) {
            console.error('[inspeccionService] update header error:', headerError);
            return { data: null, error: headerError };
        }
        
        // 2. Wipe existing details and recreate
        const { error: deleteError } = await sb
            .from('extintores_detalle')
            .delete()
            .eq('inspeccion_id', id);
            
        if (deleteError) {
            console.error('[inspeccionService] delete old details error:', deleteError);
            return { data: null, error: deleteError };
        }
        
        if (detalles && detalles.length > 0) {
            const detallesWithId = detalles.map(d => {
                // Ignore any possible client side IDs when inserting fresh
                const cleanDetail = { ...d, inspeccion_id: id };
                delete cleanDetail.id;
                delete cleanDetail.created_at;
                return cleanDetail;
            });
            const { error: detallesError } = await sb
                .from('extintores_detalle')
                .insert(detallesWithId);
                
            if (detallesError) {
                console.error('[inspeccionService] insert new details error:', detallesError);
                return { data: null, error: detallesError };
            }
        }
        
        return { data: header, error: null };
    } catch (err) {
        console.error('[inspeccionService] update exception:', err);
        return { data: null, error: err };
    }
}

export async function deleteInspeccion(id) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inspecciones_extintores')
            .delete()
            .eq('id', id)
            .select()
            .single();
            
        if (error) {
            console.error('[inspeccionService] delete error:', error);
            return { data: null, error };
        }
        return { data, error: null };
    } catch (err) {
        console.error('[inspeccionService] delete exception:', err);
        return { data: null, error: err };
    }
}
