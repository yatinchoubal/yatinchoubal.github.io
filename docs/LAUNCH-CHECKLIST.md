# Launch checklist

Work through this list in order. Run `npm run build && npm run audit:content` at the start and again at the end. The audit must report **0 blockers** before you switch payments to live.

## 1. Content and approvals (owner)

- [ ] **Photo:** profile photo uploaded, with alt text.
- [ ] **About:** bio reviewed. Past titles are accurate. The OWNER REVIEW note is removed from `src/content/pages/about.md`.
- [ ] **Home and services:** home page and all 12 service pages read and approved, including prices, limits, deliverables, and exclusions.
- [ ] **Employer policy:** checked your employment agreement and your employer's outside-activity, IP-assignment, conflict-of-interest, and social media policies. The site doesn't name employers; keep it that way. This is your responsibility; the site states that it is independent and not endorsed.
- [ ] **Policy wording:**
  - Read every policy page. Ideally have a lawyer licensed in your state review the terms, the refund and cancellation terms, the installment terms, and the privacy policy.
  - Remove the OWNER REVIEW notes from the policy files.
- [ ] **Policy settings:** "governing state" and "last updated" are set. **I have approved the policy pages** is on.
- [ ] **Blog:** each draft you want published has been reviewed for accuracy, especially first-person statements. Its OWNER REVIEW note is removed and **Draft** is off.
- [ ] **Testimonials:** none, or only real ones with written consent. Approved is on and a consent date is set.

## 2. Settings

- [ ] **URL:** `site.url` is your real domain, and `site_url` in `public/admin/config.yml` matches.
- [ ] **Contact:** contact email (a business address, not a personal one) and LinkedIn URL.
- [ ] **Links:** the fit call link, the paid session booking link, and the document upload link (a Google Form with File upload, not a shared Drive folder) with its provider name.
- [ ] **Newsletter:** provider connected, double opt-in on, unsubscribe link in every email, and the welcome email delivers the worksheet.
- [ ] **Analytics:** Plausible domain set and goals added.
- [ ] **Social image:** replace `public/images/og-default.png` if you want a custom one.

## 3. Scheduling (Google Calendar)

- [ ] **Appointment schedules:** one for the free fit call and one for paid sessions, with availability, time zone, minimum notice, and Google Meet set. Add buffers if your plan supports them; otherwise leave gaps in your availability.
- [ ] **Group clinic:** you'll schedule it yourself and email invites (appointment schedules don't support group slots).
- [ ] **Double booking:** book a slot, then try the same slot from another browser. It must be unavailable.
- [ ] **Timezone:** book as a client in a different timezone and check that the time is correct on both calendars.
- [ ] **Meeting link and reminders:** check that the meeting link is created and the reminder emails arrive.

## 4. Payments

Card payments are off. Each method below is paid on the provider's own app, so test each one with a small real payment from a friend or a second account, then refund it.

- [ ] **Accounts:** PayPal Business account (or Goods & Services payments enabled) and a Venmo **business** profile. Venmo personal profiles can't take payment for services.
- [ ] **Settings:** PayPal.me link and Venmo handle entered in Settings → Payments.
- [ ] **Booking form:** submit it for one single service and one installment package with each method. Check that:
  1. You land on `/book/pending/` with the order reference, the right amount, and only the chosen method's instructions.
  2. The Netlify **order-request** submission exists with status "Awaiting payment verification".
- [ ] **PayPal:** the "Pay with PayPal" button opens PayPal with the amount filled in. A $1 payment arrives as Goods & Services with the note intact. Refund it.
- [ ] **Venmo:** the profile link opens your business profile. A $1 payment arrives with the note intact. Refund it.
- [ ] **Zelle:** a $1 transfer to yatinc@gmail.com shows the recipient name exactly as on the site, and arrives with the memo intact. Send it back as a new payment.
- [ ] **Confirmation email:** write a template for your verified-payment email (booking link, upload link, receipt).
- [ ] **Installment request email:** write a template for later installments.
- [ ] **Digital products:** a test purchase in the store delivers the file.


## 5. Go live

- [ ] **Payment methods:** enable only the methods you have tested in Settings → Payments.
- [ ] **Mode:** set `payments.json` mode to **live**.
- [ ] **Indexing:** set `site.indexing` to **true**.
- [ ] **Audit:** run `npm run build && npm run audit:content`, which must show 0 blockers.
- [ ] **Deploy and check:**
  - **Domain:** connect the custom domain in Netlify. HTTPS is on.
  - **Search:** `robots.txt` allows crawling, and the sitemap loads at `/sitemap-index.xml`.
  - **Pages and previews:** pages have no `noindex`, except `/admin`, the worksheet, and the confirmation pages. A social preview check, such as the LinkedIn Post Inspector, shows the title and image.
  - **Forms:** submit the contact form once, and check that the Netlify notification email arrives.
- [ ] **Search Console:** verify the site and submit the sitemap.
- [ ] **Live purchase:** make one real low-price booking, such as the $49 clinic, pay it, verify it, and refund it.

## 6. Quality checks

- [ ] **Mobile:** check the home, services, and booking pages at phone width.
- [ ] **Keyboard:** the menu, the service filters, the booking form, and the FAQ all work with Tab, Enter, Space, and Escape. Focus is always visible.
- [ ] **Speed and accessibility:** run Lighthouse or PageSpeed Insights on the home and services pages. Target 90+ for Performance and Accessibility.
- [ ] **Screen reader:** run a quick NVDA or VoiceOver check of the booking form. The error messages are announced.
