# Owner guide

This is a short guide to running the site day to day. Setup details are in [INTEGRATIONS.md](INTEGRATIONS.md), and the go-live steps are in [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md).

## How the site works

- **The site is static.** Every page is generated from Markdown and JSON files in this repository. You edit on your computer, check the result, then publish. Publishing pushes to GitHub, and GitHub Pages rebuilds the live site at https://yatinchoubal.github.io/ in about a minute.
- **Bookings are recorded in Netlify Forms.** When a client submits the booking form, you get a Netlify Forms record called **order-request**. It includes an order reference such as `YC-261003-7KQ2M`, along with the service, plan, payment method, and the client's intake answers. The client then sees payment instructions for the method they chose: PayPal, Venmo, or Zelle.
- **Scheduling and payment happen on other services.** Google Calendar appointment schedules handle booking, with Google Meet links. PayPal, Venmo, and Zelle handle payment. This site never sees card, bank, or login details. Card payments are off for now.
- **There is no client portal.** Each engagement runs through the booking confirmation, your calendar invite, and email.

## Editing content

Changes are made on your computer first and only go live when you publish. Run these in a terminal in the project folder.

| Step | Command | What it does |
|---|---|---|
| 1. Edit | `npm run edit` | Starts the content editor at http://localhost:4321/admin/index.html and a live preview at http://localhost:4321/. Saving changes files on this computer only. Press Ctrl+C to stop. |
| 2. Check | `npm run verify` | Type-checks, builds the live version of the site, runs the content audit, and lists what changed. Launch blockers (test mode, placeholders) are expected while the site is a draft; only build errors and broken links stop you. |
| 3. Preview the live build (optional) | `npm run preview` | Serves the exact files that will be published, at http://localhost:4321/. |
| 4. Publish | `npm run publish` | Runs the checks again, shows the changes, asks for a short description and a yes, then pushes to GitHub. The live site updates in about a minute. |
| Undo before publishing | `npm run discard` | Throws away all unpublished changes after asking you to confirm. |
| Undo after publishing | `git revert HEAD` then `git push` | Reverses the last published change and republishes. |

You can also ask Claude Code to make a change ("change the Interview Prep price to $399") and to publish it. It follows the same steps.

In the editor, pick the section you want:

| To change… | Go to |
|---|---|
| Bio, expertise, philosophy | Pages → About page |
| Hero, home sections, buying paths | Pages → Home page |
| Profile photo and alt text | Settings → Site, contact & booking → Profile photo |
| Prices, limits, deliverables, installments | Services → *service* |
| A service-specific booking page (optional) | Services → *service* → Booking & checkout links |
| Fit call link, paid session booking link, document upload link | Settings → Site, contact & booking → Booking |
| Policy numbers (60/90/120 days, 24 h notice, etc.) | Settings → Policy numbers |
| Policy wording | Policies |
| Payment methods, test or live mode, PayPal.me link, Venmo handle, Zelle details | Settings → Payments |
| FAQs and testimonials | FAQs & Testimonials |
| Blog posts | Blog. Turn **Draft** off to publish. |
| Menu | Settings → Navigation |

**Policy numbers appear in several places.** Policy pages use tokens such as `{{rescheduleNoticeHours}}`, which are filled in from the Policy numbers settings. The service pages and the FAQs contain their own wording, though. If you change a number, search those pages for the old value too.

**Prices also appear in more than one place.** Installment amounts must still add up to the full price; the audit script flags any mismatch.

## Handling a new booking

1. You get a Netlify notification for **order-request**. Set up email notifications under *Forms → Form notifications*.
2. Find the payment in the receiving account, matching the order reference in the note or memo and the amount:
   - **PayPal:** Activity. It should be a Goods & Services payment.
   - **Venmo:** your business profile's transactions.
   - **Zelle:** your bank account.
3. Confirm the payment yourself in the account. **Never accept a screenshot as proof of payment.** If the money hasn't arrived within the hold period (48 hours by default), email the client that the request has expired.
4. Once it's verified, email the client a confirmation that includes:
   - the Google Calendar booking link for their session (or, for the group clinic, the date and a calendar invite)
   - the document upload link, if the service involves documents
   - a receipt: service, amount, date, method, and order reference
5. **Installment plans:** put a reminder in your calendar a few days before each later installment is due, then email a payment request with the amount and "order reference, installment 2 of 3". Nothing is charged automatically.
6. When the client books a time, check that the booking matches a paid order. Cancel bookings that don't.

## Documents and privacy

- **Retention:** delete client documents from Google Drive after the retention period in Settings → Policy numbers (90 days by default). Put a recurring reminder on your calendar.
- **Deletion requests:** delete the client's Netlify form submissions (Forms → submission → Delete), their uploaded files in Google Drive, and any email attachments. Then reply to confirm.
- **Resumes and job descriptions** never go into this repository or into `public/`. Anything in `public/` can be downloaded by anyone.

## Testimonials

Add a testimonial only when it is a real quote and you have the client's written permission. It stays hidden until **Approved** is on *and* a **consent date** is set.

## Publishing a blog post

1. Edit the draft.
2. Remove the `<!-- OWNER REVIEW -->` note.
3. Check every first-person statement is true for you.
4. Turn **Draft** off.

To preview drafts locally, run `npm run dev:drafts`.

## Backup and export

All content is plain Markdown and JSON in Git, so the repository itself is the backup.

- **Copies:** clone it, or use GitHub → Code → Download ZIP.
- **Form data:** Netlify Forms submissions can be exported as CSV under Forms → *form* → Download.
- **Providers:** download statements from PayPal and Venmo, and keep your bank statements for Zelle. Google Takeout can export your Calendar and Drive data.

## Before you edit anything technical

Run these two commands:

```
npm run build
npm run audit:content
```

The audit lists anything that blocks a live launch: placeholders, missing links, unapproved policies, broken links, and similar.
