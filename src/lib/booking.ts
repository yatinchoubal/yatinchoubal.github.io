// Booking form behavior: scope display, payment plan, validation, order
// reference, intake submission (Netlify Forms), and routing to payment instructions
// (PayPal, Venmo, Zelle are verified manually) or a hosted card checkout if one is enabled.
import { createOrderRef, saveOrder, money, escapeHtml, type PendingOrder } from './order';

interface ServiceInfo {
  id: string;
  title: string;
  format: string;
  formatLabel: string;
  price: number;
  priceLabel: string;
  duration: string;
  capacity: string;
  turnaround: string;
  revisions: string;
  validity: string;
  deliverables: string[];
  exclusions: string[];
  installments: { count: number; amount: number; interval: string; label: string }[];
  links: { scheduler: string; card: string; cardInstallments: string; paypal: string; digitalStore: string };
  schedulerHandlesPayment: boolean;
}

// Methods where the client pays outside the site and the owner verifies receipt by hand.
const MANUAL = ['paypal', 'venmo', 'zelle'];

const list = (items: string[]) => `<ul class="check-list">${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`;

export function initBooking() {
  const formEl = document.getElementById('order-form') as HTMLFormElement | null;
  if (!formEl) return;
  const form: HTMLFormElement = formEl;
  const services: ServiceInfo[] = JSON.parse(document.getElementById('svc-data')!.textContent!);
  const config = JSON.parse(document.getElementById('book-config')!.textContent!) as { testMode: boolean; holdHours: number };

  const select = form.querySelector<HTMLSelectElement>('#service')!;
  const scopeBody = document.getElementById('scope-body')!;
  const scopeEmpty = document.getElementById('scope-empty')!;
  const serviceSteps = document.getElementById('service-steps')!;
  const digitalStep = document.getElementById('digital-step')!;
  const digitalAction = document.getElementById('digital-action')!;
  const planStep = document.getElementById('plan-step')!;
  const planOptions = document.getElementById('plan-options')!;
  const summary = document.getElementById('summary')!;
  const instAgree = document.getElementById('installment-agree')!;
  const instCheckbox = form.querySelector<HTMLInputElement>('#agreeInstallments')!;
  const errors = document.getElementById('form-errors')!;
  const submitBtn = form.querySelector<HTMLButtonElement>('#submit-btn')!;
  const tz = form.querySelector<HTMLInputElement>('#timezone')!;

  tz.value = Intl.DateTimeFormat().resolvedOptions().timeZone ?? '';

  const current = () => services.find((s) => s.id === select.value);
  const plan = () => (form.querySelector<HTMLInputElement>('input[name="plan"]:checked')?.value ?? 'full') as 'full' | 'installments';
  const method = () => form.querySelector<HTMLInputElement>('input[name="paymentMethod"]:checked')?.value ?? '';

  function schedule(s: ServiceInfo) {
    const inst = s.installments[0];
    const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' });
    const rows = Array.from({ length: inst.count }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() + i);
      return `<tr><td>Payment ${i + 1} of ${inst.count}</td><td>${i === 0 ? 'Today' : `About ${fmt.format(d)}`}</td><td>${money(inst.amount)}</td></tr>`;
    });
    return `<table class="sched"><caption class="visually-hidden">Installment schedule</caption><tbody>${rows.join('')}<tr><th>Total</th><td></td><th>${money(inst.amount * inst.count)}</th></tr></tbody></table>`;
  }

  function renderScope(s?: ServiceInfo) {
    scopeEmpty.hidden = !!s;
    if (!s) {
      scopeBody.innerHTML = '';
      return;
    }
    const facts = [
      ['Format', s.formatLabel],
      ['Time', s.duration],
      ['Capacity', s.capacity],
      ['Turnaround', s.turnaround],
      ['Revisions', s.revisions],
      ['Use within', s.validity],
    ].filter(([, v]) => v);
    scopeBody.innerHTML = `
      <p><strong>${escapeHtml(s.title)}</strong></p>
      <p class="scope-price">${escapeHtml(s.priceLabel)} <span class="small muted">USD</span></p>
      <dl class="small">${facts.map(([k, v]) => `<dt><strong>${k}</strong></dt><dd style="margin:0 0 .4rem">${escapeHtml(v)}</dd>`).join('')}</dl>
      <h4>Included</h4>${list(s.deliverables)}
      <h4>Not included</h4><ul class="x-list">${s.exclusions.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>
      <p class="small"><a href="/services/${s.id}/" target="_blank">Full service details</a></p>`;
  }

  function renderPlan(s: ServiceInfo) {
    planStep.hidden = s.installments.length === 0;
    if (!s.installments.length) {
      planOptions.innerHTML = '';
      return;
    }
    const inst = s.installments[0];
    planOptions.innerHTML = `
      <div class="choice"><input type="radio" id="plan-full" name="plan" value="full" checked>
        <label for="plan-full"><strong>Pay in full: ${money(s.price)}</strong></label></div>
      <div class="choice"><input type="radio" id="plan-inst" name="plan" value="installments">
        <label for="plan-inst"><strong>${escapeHtml(inst.label)}</strong><br><span class="small muted">Full package price ${money(inst.amount * inst.count)}</span></label></div>`;
  }

  function renderSummary() {
    const s = current();
    if (!s) return;
    const isInst = plan() === 'installments' && s.installments.length > 0;
    instAgree.hidden = !isInst;
    instCheckbox.required = isInst;
    const due = isInst ? s.installments[0].amount : s.price;
    const m = method();
    summary.innerHTML = `
      <p><strong>${escapeHtml(s.title)}</strong><br>
      ${isInst ? `Due today: <strong>${money(due)}</strong>. Full package price: ${money(s.price)}.` : `Total: <strong>${escapeHtml(s.priceLabel)}</strong>.`}</p>
      ${isInst ? schedule(s) : ''}
      ${MANUAL.includes(m) ? `<p class="small">You'll get payment instructions and an order reference on the next screen. Your booking is confirmed only after I verify payment in the receiving account. Unpaid requests expire after ${config.holdHours} hours.</p>` : ''}
      ${MANUAL.includes(m) && isInst ? `<p class="small">For later installments, I'll email you a payment request before each due date. Nothing is charged automatically.</p>` : ''}`;
    submitBtn.textContent = MANUAL.includes(m) ? 'Submit order and get payment instructions' : 'Continue to secure payment';
  }

  function renderDigital(s: ServiceInfo) {
    if (config.testMode) {
      digitalAction.innerHTML = `<a class="btn btn-primary" href="/book/success/?service=${s.id}&test=1">Simulate purchase (test mode)</a>`;
    } else if (s.links.digitalStore) {
      digitalAction.innerHTML = `<a class="btn btn-primary" href="${escapeHtml(s.links.digitalStore)}" data-event="Checkout Start" data-event-label="${s.id}">Buy for ${escapeHtml(s.priceLabel)}</a>`;
    } else {
      digitalAction.innerHTML = `<p class="notice">This product isn't available for purchase yet. <a href="/contact/">Contact me</a> to be notified.</p>`;
    }
  }

  function onServiceChange() {
    const s = current();
    renderScope(s);
    const isDigital = s?.format === 'digital';
    digitalStep.hidden = !isDigital;
    serviceSteps.hidden = !s || isDigital;
    if (!s) return;
    if (isDigital) renderDigital(s);
    else {
      renderPlan(s);
      renderSummary();
    }
    // Number the steps so they read correctly whether or not the plan step is shown.
    const offset = s.installments.length ? 1 : 0;
    form.querySelectorAll<HTMLElement>('.step-n[data-n]').forEach((el) => {
      const n = { method: 2, details: 3, review: 4 }[el.dataset.n as 'method' | 'details' | 'review'];
      el.textContent = String(n + offset);
    });
    history.replaceState(null, '', `?service=${s.id}${location.hash}`);
  }

  function validate(): string[] {
    const problems: string[] = [];
    form.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>('[required]').forEach((el) => {
      if (el.closest('[hidden]') || el.disabled) return;
      const valid = el.checkValidity();
      el.setAttribute('aria-invalid', String(!valid));
      if (!valid) {
        const label = form.querySelector(`label[for="${el.id}"]`)?.textContent?.replace('*', '').trim() ?? el.name;
        problems.push(el.type === 'checkbox' ? `Please confirm: “${label.slice(0, 60)}…”` : `${label}: ${el.validationMessage}`);
      }
    });
    return problems;
  }

  function buildCheckoutUrl(s: ServiceInfo, p: 'full' | 'installments', m: string, ref: string, email: string) {
    let base = '';
    if (m === 'card') base = p === 'installments' ? s.links.cardInstallments : s.schedulerHandlesPayment ? s.links.scheduler : s.links.card;
    if (!base) return '';
    const url = new URL(base);
    if (url.hostname.endsWith('stripe.com')) {
      url.searchParams.set('client_reference_id', ref);
      url.searchParams.set('prefilled_email', email);
    }
    return url.toString();
  }

  select.addEventListener('change', onServiceChange);
  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t.name === 'plan' || t.name === 'paymentMethod') renderSummary();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const s = current();
    const problems = s ? validate() : ['Please choose a service.'];
    if (problems.length) {
      errors.hidden = false;
      errors.innerHTML = `<p><strong>Please fix the following:</strong></p><ul>${problems.map((p) => `<li>${escapeHtml(p)}</li>`).join('')}</ul>`;
      errors.focus();
      (form.querySelector('[aria-invalid="true"]') as HTMLElement | null)?.focus();
      return;
    }
    errors.hidden = true;
    const p = plan();
    const m = method();
    const isInst = p === 'installments' && s!.installments.length > 0;
    const amountDue = isInst ? s!.installments[0].amount : s!.price;
    const ref = createOrderRef();
    const email = (form.elements.namedItem('email') as HTMLInputElement).value.trim();

    (form.elements.namedItem('orderRef') as HTMLInputElement).value = ref;
    (form.elements.namedItem('serviceTitle') as HTMLInputElement).value = s!.title;
    (form.elements.namedItem('amountDue') as HTMLInputElement).value = money(amountDue);
    (form.elements.namedItem('status') as HTMLInputElement).value = MANUAL.includes(m) ? 'Awaiting payment verification' : 'Sent to checkout';

    const order: PendingOrder = {
      ref,
      serviceId: s!.id,
      serviceTitle: s!.title,
      plan: isInst ? 'installments' : 'full',
      method: m,
      amountDue,
      total: s!.price,
      createdAt: new Date().toISOString(),
    };

    const isManual = MANUAL.includes(m);
    const pendingUrl = `/book/pending/?ref=${ref}&service=${s!.id}&method=${m}${config.testMode ? '&test=1' : ''}`;
    const destination = config.testMode || isManual ? '' : buildCheckoutUrl(s!, order.plan, m, ref, email);
    if (!config.testMode && !isManual && !destination) {
      errors.hidden = false;
      errors.innerHTML = `<p>This payment option isn't set up for ${escapeHtml(s!.title)} yet. Please choose another method or <a href="/contact/">contact me</a>.</p>`;
      errors.focus();
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving your request…';
    try {
      const body = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
      const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body });
      if (!res.ok && !config.testMode) throw new Error(String(res.status));
    } catch {
      if (!config.testMode) {
        submitBtn.disabled = false;
        renderSummary();
        errors.hidden = false;
        errors.innerHTML = '<p>Your request couldn\'t be saved. You haven\'t been charged. Please try again, or <a href="/contact/">contact me</a>.</p>';
        errors.focus();
        return;
      }
    }
    saveOrder(order);
    (window as any).plausible?.('Checkout Start', { props: { service: s!.id, method: m, plan: order.plan } });

    if (isManual) {
      location.href = pendingUrl;
      return;
    }
    if (config.testMode) {
      const outcome = (document.getElementById('testOutcome') as HTMLSelectElement | null)?.value ?? 'success';
      location.href = `/book/${outcome}/?ref=${ref}&service=${s!.id}&test=1`;
      return;
    }
    location.href = destination;
  });

  errors.tabIndex = -1;
  const initial = new URLSearchParams(location.search).get('service');
  if (initial && services.some((s) => s.id === initial)) {
    select.value = initial;
  }
  onServiceChange();
}
