/**
 * @fileoverview Servicio CRUD para la tabla `parametros` en Supabase.
 * 
 * Gestiona valores paramétricos de tipo "ciudad" y "contratista"
 * que se usan en los select/dropdowns de la aplicación.
 * 
 * @module services/parametricaService
 */

import { getSupabase } from '../db/supabaseClient.js';

/** Nombre de la tabla en Supabase */
const TABLA = 'parametros';

/** Categorías válidas */
const CATEGORIAS_VALIDAS = ['ciudad', 'empresa', 'extintor_codigo', 'extintor_ubicacion', 'arnes_tipo', 'arnes_norma'];

// ─────────────────────────────────────────────────────────
//  Validación interna
// ─────────────────────────────────────────────────────────

/**
 * Verifica que la categoría sea una de las permitidas.
 * @param {string} categoria
 * @returns {boolean}
 */
function esCategoriaValida(categoria) {
    return CATEGORIAS_VALIDAS.includes(categoria);
}

// ─────────────────────────────────────────────────────────
//  CRUD
// ─────────────────────────────────────────────────────────

/**
 * Obtiene todos los parámetros activos de una categoría, ordenados por `orden`.
 * 
 * @param {string} categoria — 'ciudad' o 'contratista'
 * @returns {Promise<{data: Object[]|null, error: Error|null}>}
 * 
 * @example
 * const { data: ciudades } = await getParametros('ciudad');
 * // [{ id: '...', categoria: 'ciudad', valor: 'Bogotá', orden: 1, activo: true }, ...]
 */
export async function getParametros(categoria) {
    try {
        if (!esCategoriaValida(categoria)) {
            return {
                data: null,
                error: new Error(`Categoría inválida: "${categoria}". Debe ser: ${CATEGORIAS_VALIDAS.join(', ')}`)
            };
        }

        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .select('*')
            .eq('categoria', categoria)
            .eq('activo', true)
            .order('orden', { ascending: true });

        if (error) {
            console.error('[parametricaService] getParametros error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[parametricaService] getParametros excepción:', err);
        return { data: null, error: err };
    }
}

/**
 * Crea un nuevo parámetro.
 * 
 * El campo `orden` se asigna automáticamente al siguiente valor disponible
 * dentro de su categoría. El parámetro se crea como activo por defecto.
 * 
 * @param {string} categoria — 'ciudad' o 'contratista'
 * @param {string} valor     — Valor del parámetro (e.g. nombre de ciudad)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 * 
 * @example
 * const { data, error } = await createParametro('ciudad', 'Medellín');
 */
export async function createParametro(categoria, valor) {
    try {
        if (!esCategoriaValida(categoria)) {
            return {
                data: null,
                error: new Error(`Categoría inválida: "${categoria}". Debe ser: ${CATEGORIAS_VALIDAS.join(', ')}`)
            };
        }

        if (!valor || !valor.trim()) {
            return {
                data: null,
                error: new Error('El valor del parámetro no puede estar vacío.')
            };
        }

        const sb = getSupabase();

        // Determinar el siguiente orden disponible
        const { data: existentes, error: fetchError } = await sb
            .from(TABLA)
            .select('orden')
            .eq('categoria', categoria)
            .order('orden', { ascending: false })
            .limit(1);

        if (fetchError) {
            console.error('[parametricaService] createParametro fetch orden error:', fetchError);
            return { data: null, error: fetchError };
        }

        const siguienteOrden = (existentes && existentes.length > 0)
            ? (existentes[0].orden + 1)
            : 1;

        const nuevoParametro = {
            categoria,
            valor: valor.trim(),
            orden: siguienteOrden,
            activo: true
        };

        const { data, error } = await sb
            .from(TABLA)
            .insert(nuevoParametro)
            .select()
            .single();

        if (error) {
            console.error('[parametricaService] createParametro error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[parametricaService] createParametro excepción:', err);
        return { data: null, error: err };
    }
}

/**
 * Elimina un parámetro por su UUID.
 * 
 * @param {string} id — UUID del parámetro a eliminar
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export async function deleteParametro(id) {
    try {
        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[parametricaService] deleteParametro error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[parametricaService] deleteParametro excepción:', err);
        return { data: null, error: err };
    }
}

/**
 * Actualiza el valor de un parámetro existente por su UUID.
 * 
 * @param {string} id    — UUID del parámetro
 * @param {string} valor — Nuevo valor del parámetro
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 * 
 * @example
 * await updateParametro('uuid-aquí', 'Planta Cali');
 */
export async function updateParametro(id, valor) {
    try {
        if (!valor || !valor.trim()) {
            return {
                data: null,
                error: new Error('El valor del parámetro no puede estar vacío.')
            };
        }

        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .update({ valor: valor.trim() })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[parametricaService] updateParametro error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[parametricaService] updateParametro excepción:', err);
        return { data: null, error: err };
    }
}

/**
 * Actualiza el campo `orden` de un parámetro (para reordenar en la UI).
 * 
 * @param {string} id    — UUID del parámetro
 * @param {number} orden — Nuevo valor de orden
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 * 
 * @example
 * await updateOrdenParametro('uuid-aquí', 3);
 */
export async function updateOrdenParametro(id, orden) {
    try {
        if (typeof orden !== 'number' || orden < 0) {
            return {
                data: null,
                error: new Error('El orden debe ser un número no negativo.')
            };
        }

        const sb = getSupabase();
        const { data, error } = await sb
            .from(TABLA)
            .update({ orden })
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('[parametricaService] updateOrdenParametro error:', error);
            return { data: null, error };
        }

        return { data, error: null };
    } catch (err) {
        console.error('[parametricaService] updateOrdenParametro excepción:', err);
        return { data: null, error: err };
    }
}
