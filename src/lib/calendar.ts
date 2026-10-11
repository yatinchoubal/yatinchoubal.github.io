// Google Calendar appointment schedules can be embedded in an iframe when the
// full booking page URL (calendar.google.com/calendar/appointments/...) is used
// with ?gv=true. Short share links (calendar.app.google/...) only redirect, so
// those fall back to a plain "Choose a time" button.

/** Embeddable URL for a Google appointment schedule, or '' if the link can't be embedded. */
export function calendarEmbedUrl(link: string): string {
  try {
    const url = new URL(link);
    if (url.hostname !== 'calendar.google.com' || !url.pathname.includes('/appointments/')) return '';
    url.searchParams.set('gv', 'true');
    return url.toString();
  } catch {
    return '';
  }
}

/** Builds the booking iframe plus an "open in a new tab" fallback link. */
export function calendarEmbed(link: string, title: string): HTMLElement | null {
  const src = calendarEmbedUrl(link);
  if (!src) return null;
  const wrap = document.createElement('div');
  wrap.className = 'calendar-embed';
  const frame = document.createElement('iframe');
  frame.src = src;
  frame.title = title;
  frame.loading = 'lazy';
  const p = document.createElement('p');
  p.className = 'small muted';
  const a = document.createElement('a');
  a.href = link;
  a.target = '_blank';
  a.rel = 'noopener';
  a.textContent = 'Open the booking page in a new tab';
  p.append("Calendar not loading? ", a, '.');
  wrap.append(frame, p);
  return wrap;
}
