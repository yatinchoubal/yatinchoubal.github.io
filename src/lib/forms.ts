// Sends a form to the Google Apps Script web app (see google-apps-script/Code.gs), which saves it to a
// Google Sheet and emails it to the owner. GitHub Pages can't receive form posts itself.

const TIMEOUT_MS = 15000;

/** Resolves when the submission is saved; throws if the endpoint is missing, slow, or reports a failure. */
export async function sendForm(endpoint: string, fields: Record<string, string>) {
  if (!endpoint) throw new Error('No form endpoint configured');
  const res = await fetch(endpoint, {
    method: 'POST',
    // text/plain keeps this a "simple" request, so the browser skips the CORS preflight Apps Script can't answer.
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(fields),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  const result = (await res.json().catch(() => ({}))) as { ok?: boolean };
  if (!res.ok || result.ok !== true) throw new Error(`Form endpoint failed (${res.status})`);
}

/** A mailto: link carrying the submission, offered when sending fails so nothing is lost. */
export function mailtoLink(to: string, subject: string, fields: Record<string, string>) {
  const body = Object.entries(fields)
    .filter(([k, v]) => !k.startsWith('_') && k !== 'formType' && v)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n');
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
