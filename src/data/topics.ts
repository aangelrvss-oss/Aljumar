/** Temas del blog, agrupados por la necesidad del lector (no por «noticias»). */
export const topics = {
  'comprar-y-vender': {
    label: 'Comprar y vender',
    intro: 'Documentación, gastos, plazos y decisiones clave al comprar o vender una vivienda.',
  },
  'mercado-y-normativa': {
    label: 'Mercado y normativa',
    intro: 'Cambios legales, hipotecas y evolución del mercado inmobiliario explicados con claridad.',
  },
  'hogar-y-reformas': {
    label: 'Hogar y reformas',
    intro: 'Ideas para reformar, decorar y mejorar la eficiencia de tu vivienda.',
  },
} as const;

export type TopicKey = keyof typeof topics;
