import { getSupabase } from '../db/supabaseClient.js';

export async function getAllInspecciones() {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inspecciones_arneses')
            .select(`
                *,
                arneses_detalle (*)
            `)
            .order('fecha', { ascending: false });

        if (error) {
            console.error('[inspeccionArnesesService] getAll error:', error);
            return { data: null, error };
        }

        // Map data to easily access arneses count
        const mappedData = data.map(item => ({
            ...item,
            total_arneses: item.arneses_detalle ? item.arneses_detalle.length : 0
        }));

        return { data: mappedData, error: null };
    } catch (err) {
        console.error('[inspeccionArnesesService] getAll exception:', err);
        return { data: null, error: err };
    }
}

export async function getInspeccionById(id) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from('inspecciones_arneses')
            .select(`
                *,
                arneses_detalle (*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('[inspeccionArnesesService] getById error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[inspeccionArnesesService] getById exception:', err);
        return { data: null, error: err };
    }
}

let hasNoAplicaColumns = null;

async function checkNoAplicaColumns() {
    if (hasNoAplicaColumns !== null) return hasNoAplicaColumns;
    try {
        const sb = getSupabase();
        const { error } = await sb.from('arneses_detalle').select('argollas_no_aplica').limit(1);
        if (error) {
            console.warn('[inspeccionArnesesService] argollas_no_aplica is missing or query failed:', error);
            hasNoAplicaColumns = false;
        } else {
            hasNoAplicaColumns = true;
        }
    } catch (e) {
        hasNoAplicaColumns = false;
    }
    return hasNoAplicaColumns;
}

async function cleanDetalles(detalles) {
    if (!detalles || detalles.length === 0) return detalles;
    const hasNA = await checkNoAplicaColumns();
    if (!hasNA) {
        return detalles.map(d => {
            const copy = { ...d };
            delete copy.cintas_no_aplica;
            delete copy.costuras_no_aplica;
            delete copy.hebillas_no_aplica;
            delete copy.argollas_no_aplica;
            delete copy.etiquetas_no_aplica;
            delete copy.caida_no_aplica;
            delete copy.general_no_aplica;
            return copy;
        });
    }
    return detalles;
}

export async function createInspeccion(cabecera, detalles) {
    try {
        const sb = getSupabase();
        
        // 1. Create header
        const { data: header, error: headerError } = await sb
            .from('inspecciones_arneses')
            .insert(cabecera)
            .select()
            .single();
            
        if (headerError) {
            console.error('[inspeccionArnesesService] create header error:', headerError);
            return { data: null, error: headerError };
        }
        
        // 2. Insert details
        if (detalles && detalles.length > 0) {
            const cleaned = await cleanDetalles(detalles);
            const detallesWithId = cleaned.map(d => ({ ...d, inspeccion_id: header.id }));
            const { error: detallesError } = await sb
                .from('arneses_detalle')
                .insert(detallesWithId);
                
            if (detallesError) {
                console.error('[inspeccionArnesesService] create details error:', detallesError);
                // Rollback: delete header if details fail to save
                await sb.from('inspecciones_arneses').delete().eq('id', header.id);
                return { data: null, error: detallesError };
            }
        }
        
        return { data: header, error: null };
    } catch (err) {
        console.error('[inspeccionArnesesService] create exception:', err);
        return { data: null, error: err };
    }
}

export async function updateInspeccion(id, cabecera, detalles) {
    try {
        const sb = getSupabase();
        
        // 1. Update header
        const { data: header, error: headerError } = await sb
            .from('inspecciones_arneses')
            .update(cabecera)
            .eq('id', id)
            .select()
            .single();
            
        if (headerError) {
            console.error('[inspeccionArnesesService] update header error:', headerError);
            return { data: null, error: headerError };
        }
        
        // 2. Wipe existing details and recreate
        const { error: deleteError } = await sb
            .from('arneses_detalle')
            .delete()
            .eq('inspeccion_id', id);
            
        if (deleteError) {
            console.error('[inspeccionArnesesService] delete old details error:', deleteError);
            return { data: null, error: deleteError };
        }
        
        if (detalles && detalles.length > 0) {
            const cleaned = await cleanDetalles(detalles);
            const detallesWithId = cleaned.map(d => {
                // Ignore any possible client side IDs when inserting fresh
                const cleanDetail = { ...d, inspeccion_id: id };
                delete cleanDetail.id;
                delete cleanDetail.created_at;
                return cleanDetail;
            });
            const { error: detallesError } = await sb
                .from('arneses_detalle')
                .insert(detallesWithId);
                
            if (detallesError) {
                console.error('[inspeccionArnesesService] insert new details error:', detallesError);
                return { data: null, error: detallesError };
            }
        }
        
        return { data: header, error: null };
    } catch (err) {
        console.error('[inspeccionArnesesService] update exception:', err);
        return { data: null, error: err };
    }
}

export async function deleteInspeccion(id) {
    try {
        const sb = getSupabase();
        
        // 1. Delete details first to avoid foreign key violations
        const { error: deleteDetailsError } = await sb
            .from('arneses_detalle')
            .delete()
            .eq('inspeccion_id', id);
            
        if (deleteDetailsError) {
            console.error('[inspeccionArnesesService] delete details error:', deleteDetailsError);
            return { data: null, error: deleteDetailsError };
        }

        // 2. Delete header
        const { data, error } = await sb
            .from('inspecciones_arneses')
            .delete()
            .eq('id', id)
            .select()
            .single();
            
        if (error) {
            console.error('[inspeccionArnesesService] delete error:', error);
            return { data: null, error };
        }
        return { data, error: null };
    } catch (err) {
        console.error('[inspeccionArnesesService] delete exception:', err);
        return { data: null, error: err };
    }
}
