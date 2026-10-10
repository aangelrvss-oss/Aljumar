/**
 * Apariciones al hacer scroll ([data-motion]).
 *
 * Principio: nada se oculta si este script no llega a ejecutarse. Solo se
 * marcan como «pendientes» los elementos que, al cargar, están por debajo de
 * la pantalla; los que ya se ven no se tocan. Un elemento pendiente se muestra:
 *   - al entrar en pantalla (IntersectionObserver),
 *   - si el usuario pasa de largo con un desplazamiento rápido o salta a un
 *     ancla (comprobación en cada frame de scroll),
 *   - al llegar al final de la página, al imprimir o al cambiar el hash.
 * Los elementos que entran a la vez se escalonan (--motion-delay).
 * Con movimiento reducido no se hace nada.
 */
const STAGGER = 80;
const MAX_DELAY = 400;

export function initMotion(root: ParentNode = document) {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!('IntersectionObserver' in window)) return;

  const fold = window.innerHeight * 0.92;
  const pending = new Set<HTMLElement>();
  root.querySelectorAll<HTMLElement>('[data-motion]').forEach((el) => {
    if (el.classList.contains('is-in') || el.classList.contains('is-pending')) return;
    if (el.getBoundingClientRect().top > fold) {
      el.classList.add('is-pending');
      pending.add(el);
    }
  });
  if (!pending.size) return;

  const show = (els: HTMLElement[]) => {
    els
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left)
      .forEach((el, i) => {
        if (!pending.delete(el)) return;
        io.unobserve(el);
        el.style.setProperty('--motion-delay', `${Math.min(i * STAGGER, MAX_DELAY)}ms`);
        el.classList.add('is-in');
        el.classList.remove('is-pending');
      });
    if (!pending.size) detach();
  };

  const io = new IntersectionObserver(
    (entries) => show(entries.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement)),
    { rootMargin: '0px 0px -6% 0px' },
  );
  pending.forEach((el) => io.observe(el));

  // Red de seguridad: lo que ya ha quedado por encima del borde inferior se
  // muestra aunque el observador no haya llegado a notificarlo.
  let frame = 0;
  const catchUp = () => {
    frame = 0;
    const bottom = window.innerHeight;
    const atEnd = window.scrollY + bottom >= document.documentElement.scrollHeight - 4;
    show([...pending].filter((el) => atEnd || el.getBoundingClientRect().top < bottom));
  };
  const onScroll = () => {
    if (!frame) frame = requestAnimationFrame(catchUp);
  };
  const showAll = () => show([...pending]);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('beforeprint', showAll);
  window.addEventListener('hashchange', showAll);
  function detach() {
    io.disconnect();
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('beforeprint', showAll);
    window.removeEventListener('hashchange', showAll);
  }
}
