# Integrations: provider findings and setup

These findings come from provider documentation reviewed on **2026-10-03**. Provider features, fees, and eligibility change, so check each item marked **Verify** in your own account before going live.

> **How payment works right now:** card payments are switched off. Clients pay by PayPal, Venmo, or Zelle on that provider's own app or site. The booking form creates the order reference and a Netlify Forms record, then shows payment instructions. You confirm each payment by hand in the receiving account, and only then send the Google Calendar booking link. No single checkout covers all three, so each method is set up separately.

## Summary

| Need | Provider used | Status in this draft |
|---|---|---|
| Hosting, forms, contact, booking intake | Netlify (+ Netlify Forms) | Configured. Forms are detected at deploy. |
| Content editing | Decap CMS (`/admin`), GitHub backend | Configured. Needs your repo name and OAuth. |
| Session booking, video links, reminders | Google Calendar appointment schedules + Google Meet | Not connected. Needs your two booking links. |
| PayPal | PayPal.me link (amount filled in) | Enabled in test mode. Needs your PayPal.me link. |
| Venmo | Venmo business profile link | Enabled in test mode. Needs your business profile handle. |
| Zelle | Manual, through your bank | Enabled. Recipient yatinc@gmail.com, marked verified. |
| Card payments | Stripe (hosted) | **Off.** Kept for later. |
| Digital templates | Lemon Squeezy, Gumroad, or Payhip | Not connected. Shown as "Coming soon". |
| Document upload | Google Form with File upload (recommended) | **Blocked:** a shared Drive folder link is set. See below. |
| Newsletter | Any provider with a form action, e.g. Buttondown, Kit, MailerLite | Disabled. |
| Analytics | Plausible (cookieless) | Off until a domain is set. |

---

## Google Calendar (booking)

Create **two appointment schedules** in Google Calendar (Create → Appointment schedule):

1. **Free 15-minute fit call.** Public. Paste its booking page link into Settings → Site → Booking → **Free fit call booking link**.
2. **Paid sessions.** Paste its link into **Paid session booking link**. The site shows this link only on the confirmation page, and you also send it in your confirmation email after verifying payment. Anyone who has the link can book, so check new bookings against paid orders, and cancel any booking with no matching order reference.

If a service needs its own schedule (for example a 30-minute review versus a 60-minute session), create another appointment schedule and paste it into that service's **Booking page for this service** field. Blank means the shared paid-session link is used.

What Google documents for appointment schedules:

| Feature | Free Google account | Notes |
|---|---|---|
| Booking page, duration, scheduling window, minimum notice | Yes | |
| Google Meet link added to each booking | Yes | |
| Booking form (name and email) and email confirmation | Yes | |
| Email reminders to the booker | Yes | |
| Buffer time between bookings, maximum bookings per day | **Verify.** Documented as premium (Google Workspace or Google One) | Without buffers, block buffer time in your availability by hand. |
| Extra booking-form questions (e.g. "Order reference") | **Verify.** Premium | Without it, match bookings to orders by the client's email. |
| Checking more than one calendar for conflicts | **Verify.** Premium | Matters if your work calendar is separate. Never connect an employer calendar. |
| Taking payment on the booking page (Stripe) | Premium | Not used. |
| Group bookings (several people in one slot) | Not supported | Schedule the Group Career Clinic yourself and email a calendar invite to each paid participant (up to 8). |

Times on the booking page show in the client's own time zone. Test from another time zone before launch.

## PayPal

- **Link:** create a PayPal.me link (`https://paypal.me/YourName`) and paste it into Settings → Payments → PayPal → **PayPal.me link**. The pending page adds the amount automatically, e.g. `paypal.me/YourName/150USD`.
- **Account:** PayPal expects payments for services to be sent as **Goods & Services**, not Friends & Family. A PayPal **Business** account is recommended. It can only receive Goods & Services payments, which gives the buyer purchase protection and gives you a clean record. Fees apply (**Verify** the current rate).
- **Refunds:** refund from the transaction in PayPal. Seller fees may not be fully returned (**Verify**).
- **Taxes:** PayPal issues Form 1099-K for Goods & Services payments above the IRS reporting threshold. Keep your own records either way.

## Venmo

- **Account:** Venmo's user agreement doesn't allow **personal** profiles to receive payment for goods or services. Create a **Venmo business profile** (free to set up; a per-transaction fee applies, **Verify** the rate). Paste the handle (without @) into Settings → Payments → Venmo.
- **Link:** the site links to `https://venmo.com/u/HANDLE` unless you set a profile URL. Venmo doesn't document a way to prefill the amount or note through a web link, so the pending page shows the amount and order reference for the client to type.
- **Privacy:** Venmo payments can be public by default. The site tells clients to set the payment to Private and to put only the order reference in the note.
- **Taxes:** business-profile payments are reported on Form 1099-K above the threshold.

## Zelle (manual)

- **Recipient:** `yatinc@gmail.com`, name "Yatin Choubal". Confirm that the name a sender's bank shows for that email is exactly "Yatin Choubal". If it shows something else (a nickname or a joint account, for example), update **Recipient name** to match. Otherwise clients will see a name mismatch and may not pay.
- **Bank terms:** some banks restrict Zelle on personal accounts used to receive business payments, or set lower limits. Check your bank's terms, or use a business account with Zelle.
- **No buyer protection:** Zelle payments can't be reversed. Refunds are sent as a new Zelle payment to the same email or phone that paid.
- **Verification:** confirm each payment in your bank account. Never accept a screenshot.

## Installments with manual payments

There's no automatic billing. The client pays installment 1 at booking. Before each later due date, email a payment request with the amount, the order reference plus "installment 2 of 3", and the payment method the client used. On PayPal you can send a PayPal invoice or payment request instead.

Plans are limited to 2–3 monthly payments with **no interest, finance charges, or late fees**. Keeping plans to four or fewer payments with no finance charge generally keeps them outside U.S. consumer-credit disclosure rules. Have your attorney confirm this for your state.

## Card payments (off for now)

Card payments are disabled (`payments.json` → card → `enabled: false`). The code still supports Stripe Payment Links, and `netlify/functions/stripe-installments.mjs` is an untested webhook for ending installment subscriptions. To turn cards on later, create Stripe Payment Links, paste them into each service's card fields, enable card, add card wording back to the policies, and run card test payments before going live.

## Document upload

**The Google Drive folder link you supplied can't be used safely as-is.** A shared Drive folder works in one of two ways:

- **Viewer access:** clients can see the folder but can't upload.
- **Editor access:** clients can upload, but every client can also open, download, rename, and delete every other client's resume.

The second option would expose resumes to other people, which the site's privacy commitments don't allow. The audit blocks launch while the link is a folder link.

**Recommended fix: a Google Form with a File upload question.**

1. In Google Forms, create a form with "Order reference" (short answer, required) and "Your documents" (File upload; allow PDF and Word documents; up to 5 files; 10 MB each).
2. Files go into a folder in **your** Drive that only you can open. Uploaders must sign in to a Google account, so mention this in your confirmation email and offer an alternative for clients without one.
3. In the form's settings, don't share response summaries with respondents.
4. Paste the form's link into Settings → Site → Booking → **Document upload link** and set the provider name to "Google Forms".

**Alternative:** create a separate Drive folder for each client and share it only with that client's email address. This takes more work per client, but nobody else can see their files.

**Retention:** delete files after the retention period (90 days by default). Files uploaded through Google Forms stay in Drive even after you delete the form response, so delete them in Drive too.

## Digital products ($10–$29 templates)

Use a hosted store that delivers the files. Never place paid files in `public/`.

| Provider | Fee (verify) | Notes |
|---|---|---|
| Lemon Squeezy | 5% + 50¢ | Merchant of record (handles sales tax/VAT). Supports cards and PayPal. |
| Gumroad | 10% + 50¢ | Simple. Merchant of record for many sales. |
| Payhip | 0–5% + processor fees | Lower fees on paid plans. |

Paste each product link into the service's **Digital store product link** field and the resource's **Purchase link**. Then set the resource's **Available now** on.

## Newsletter

- **Provider:** any provider with a hosted form `action` URL and built-in unsubscribe and double opt-in.
- **Settings:** set the form action URL, the email field name, and the provider name. Then turn **enabled** on.
- **Consent:** the signup checkbox is separate from booking consent. Clients are never added automatically.
- **Lead magnet:** set the provider's welcome email to deliver the worksheet link, `https://YOUR-DOMAIN/resources/worksheet/`.

## Analytics and Search Console

- **Plausible:** cookieless, so no cookie banner is needed for it. Set the domain in Settings → Analytics.
  - The site records these events through the default `script.js`, using `window.plausible`:
    - `CTA Click` (hero and header buttons)
    - `Book Click` (service cards and pages)
    - `Fit Call Click`
    - `Checkout Start` (booking form submitted, with service, method, and plan)
    - `Contact Submit`
    - `Newsletter Signup`
    - `Resource Open`
  - In Plausible, add each event as a custom-event goal. Click events send a `label` property.
- **Search Console:** paste the HTML-tag verification code into Settings, or verify by DNS. Then submit `https://YOUR-DOMAIN/sitemap-index.xml`.

## Decap CMS

1. Push this repository to GitHub, then connect it to Netlify. Build command `npm run build`, publish folder `dist`.
2. In `public/admin/config.yml`, set `repo:` to `your-username/your-repo`, and set `site_url`.
3. Set up GitHub OAuth:
   - **On GitHub:** create an OAuth App (Settings → Developer settings). Callback URL `https://api.netlify.com/auth/done`.
   - **On Netlify:** add the client ID and secret under Site configuration → Access & security → OAuth → GitHub.
   - Netlify Identity and Git Gateway are deprecated, so they aren't used.
4. For local editing, run `npm run dev` and `npm run cms` together, then open `http://localhost:4321/admin/`.

## Not verified in this draft

- **Live payment paths:** no PayPal.me link or Venmo handle is configured yet, so only the instruction screens were tested.
- **PayPal.me amount:** check that `paypal.me/YourName/150USD` opens with the amount filled in on your account.
- **Google Calendar premium features:** buffers, booking limits, extra questions, and multi-calendar checks may need Google Workspace or Google One.
- **Zelle:** your bank's terms and limits for business payments, and the display name senders see.
- **Fees:** Venmo business profile fees and PayPal Goods & Services fees at the time you sign up.
- **Netlify Forms limits:** submission caps on your plan.
