import type { Operation } from './types.ts';

/** Inmuebles por página en los listados estáticos y por tanda en el buscador. */
export const PAGE_SIZE = 24;

export const LISTING_BASE: Record<Operation, string> = {
  venta: '/comprar/',
  alquiler: '/alquilar/',
  traspaso: '/traspasos/',
};

export const OPERATIONS: Operation[] = ['venta', 'alquiler', 'traspaso'];
