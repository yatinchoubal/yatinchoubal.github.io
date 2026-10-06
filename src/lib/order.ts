// Client-side helpers shared by the booking form and the order status pages.

export interface PendingOrder {
  ref: string;
  serviceId: string;
  serviceTitle: string;
  plan: 'full' | 'installments';
  method: string;
  amountDue: number;
  total: number;
  createdAt: string;
}

const KEY = 'yc-order';
// Unambiguous characters only (no 0/O, 1/I/L), so references are easy to read aloud or type into a payment memo.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function createOrderRef(now = new Date()) {
  const date = now.toISOString().slice(2, 10).replace(/-/g, '');
  const bytes = crypto.getRandomValues(new Uint8Array(5));
  const suffix = Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join('');
  return `YC-${date}-${suffix}`;
}

export function saveOrder(order: PendingOrder) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(order));
  } catch {
    // Storage can be unavailable in private browsing; status pages fall back to URL parameters.
  }
}

export function loadOrder(): Partial<PendingOrder> {
  const params = new URLSearchParams(location.search);
  let stored: Partial<PendingOrder> = {};
  try {
    stored = JSON.parse(sessionStorage.getItem(KEY) ?? '{}');
  } catch {
    stored = {};
  }
  const ref = params.get('ref') ?? stored.ref;
  // Only trust stored details if they belong to the same order reference.
  const base = !params.get('ref') || params.get('ref') === stored.ref ? stored : {};
  return { ...base, ref: ref && /^YC-\d{6}-[A-Z0-9]{5}$/.test(ref) ? ref : undefined, serviceId: params.get('service') ?? base.serviceId };
}

export function money(amount: number) {
  const cents = Math.round(amount * 100) % 100 !== 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: cents ? 2 : 0 }).format(amount);
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export interface StatusService { id: string; title: string; format: string; scheduler: string; schedulerHandlesPayment: boolean }

/** Order + service details for the status pages (reads the JSON embedded by OrderStatus.astro). */
export function getOrderContext() {
  const order = loadOrder();
  const el = document.getElementById('status-services');
  const services: StatusService[] = el ? JSON.parse(el.textContent ?? '[]') : [];
  return { order, service: services.find((s) => s.id === order.serviceId) };
}
