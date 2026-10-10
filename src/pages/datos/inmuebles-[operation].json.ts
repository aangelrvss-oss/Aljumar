import type { APIRoute, GetStaticPaths } from 'astro';
import { byOperation } from '../../lib/inventory';
import { toSearchItem } from '../../lib/inventory/filters';
import { cardModel } from '../../lib/inventory/card';
import { OPERATIONS } from '../../lib/inventory/listing';
import type { Operation } from '../../lib/inventory/types';

/**
 * Índice del buscador: criterios de filtrado + datos de la tarjeta de cada
 * inmueble de una operación. Lo descarga el navegador solo cuando el usuario
 * filtra u ordena (ver PropertySearch.astro).
 */
export const getStaticPaths = (() => OPERATIONS.map((operation) => ({ params: { operation } }))) satisfies GetStaticPaths;

export const GET: APIRoute = ({ params }) => {
  const operation = params.operation as Operation;
  const items = byOperation(operation).map((p, i) => ({ ...toSearchItem(p, i), card: cardModel(p, operation) }));
  return new Response(JSON.stringify({ operation, count: items.length, items }), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
