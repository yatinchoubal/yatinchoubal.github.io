# Editing and publishing the website

How to change the website safely: edit on your computer, check the result, then publish. Nothing you change goes live until you publish.

- **Live site:** https://yatinchoubal.github.io/
- **Code on GitHub:** https://github.com/yatinchoubal/yatinchoubal.github.io (public)
- **Project folder on this computer:** `C:\dev\MyWebsite`

## The routine at a glance

| Step | Command | What it does |
|---|---|---|
| 1. Edit | `npm run edit` | Starts the content editor and a live preview on your computer. |
| 2. Check | `npm run verify` | Builds the live version of the site, runs the checks, and lists what changed. |
| 3. Preview the live version (optional) | `npm run preview` | Shows the exact files that will be published. |
| 4. Publish | `npm run publish` | Checks again, asks you to confirm, then pushes to GitHub. The live site updates in about a minute. |
| Undo before publishing | `npm run discard` | Throws away unpublished changes, after asking you to confirm. |
| Undo after publishing | `git revert HEAD --no-edit`, then `git push` | Reverses the last published change and republishes. |

Run every command in a terminal (PowerShell is fine) from the project folder:

```powershell
cd C:\dev\MyWebsite
```

## One-time setup

You only need this on a new computer, or after deleting the `node_modules` folder.

1. Install [Node.js](https://nodejs.org/) 22 or newer, and [Git for Windows](https://git-scm.com/download/win).
2. Get the project, if it isn't on the computer yet:
   ```powershell
   git clone https://github.com/yatinchoubal/yatinchoubal.github.io.git C:\dev\MyWebsite
   cd C:\dev\MyWebsite
   ```
3. Install the project's packages:
   ```powershell
   npm install
   ```
4. The first time you publish, Git opens a browser window so you can sign in to GitHub. After that, it remembers you.

## Step 1: Edit

```powershell
npm run edit
```

After a few seconds you'll see:

- **Content editor:** http://localhost:4321/admin/index.html. Type the full address, including `/index.html`; `/admin/` on its own shows "not found".
- **Site preview:** http://localhost:4321/

No sign-in is needed. When you click **Save** in the editor, it changes files on this computer only. The preview updates straight away, so you can click through the real pages.

Press **Ctrl+C** in the terminal to stop the editor and preview.

### Where to find things in the editor

| To change… | Go to |
|---|---|
| Home page text (headline, photo labels, credentials row, quote, sections) | Pages → Home page |
| About page (bio, "What I bring", "How I coach", fit lists) | Pages → About page |
| Services: descriptions, prices, what's included, timelines | Services → *service* |
| FAQs | FAQs & Testimonials |
| Blog posts | Blog. Turn **Draft** off to publish a post. |
| Free resources and the Career Toolkit | Resources |
| Policy wording | Policies |
| Policy numbers (notice hours, days to use a service, and so on) | Settings → Policy numbers |
| Profile photo and its description | Settings → Site, contact & booking → Profile photo |
| Booking links, contact email, LinkedIn | Settings → Site, contact & booking |
| Payment methods and test/live mode | Settings → Payments |
| Menu | Settings → Navigation |

Tips:

- **Prices and policy numbers appear in more than one place.** If you change one, search the services and FAQs for the old value too. `npm run verify` flags installment amounts that no longer add up.
- **Photos you upload** go into `public/images/uploads/`. Anything in `public/` can be downloaded by anyone, so never upload client documents there.
- **Draft blog posts** show in the local preview but stay hidden on the live site until you turn Draft off.

### Prefer to edit the files directly?

All content is plain text in the project folder, so any text editor works:

| Content | File or folder |
|---|---|
| Home page | `src/data/home.json` |
| About page | `src/content/pages/about.md` |
| Services | `src/content/services/*.md` |
| FAQs | `src/data/faqs.json` |
| Blog posts | `src/content/blog/*.md` |
| Resources | `src/content/resources/*.md` |
| Policies | `src/content/policies/*.md` |
| Site settings | `src/data/site.json` |
| Menu | `src/data/navigation.json` |

### Or ask Claude Code

In Claude Code, from this project, describe the change, for example "change the Interview Prep price to $399" or "add an FAQ about time zones". Claude makes the change locally, checks it, and shows you the result. It only publishes when you say so.

## Step 2: Check

```powershell
npm run verify
```

This:

1. type-checks the project
2. builds the live version of the site
3. runs the content audit
4. lists every file you changed since the last publish

It ends with **✔ Verified** or **✖ Verification failed**.

- **Launch blockers are expected** while the site is a draft: test mode, placeholders, empty booking links, and so on. They don't stop you publishing a draft for feedback.
- **Real problems do stop you.** A build error, a type error, or a broken internal link fails the check. Fix it, then run `npm run verify` again.

## Step 3: Preview the live version (optional)

```powershell
npm run preview
```

Open http://localhost:4321/ to see exactly what will be published. This is the built site rather than the editing preview, so it's the closest match to the live site. Press **Ctrl+C** to stop.

The content editor isn't included in this build. It never goes on the live site.

## Step 4: Publish

```powershell
npm run publish
```

1. It runs the same checks as `npm run verify`. If they fail, nothing is published.
2. It asks for a short description, for example `Update Interview Prep price`. This becomes the entry in the site's change history.
3. It asks `Publish these changes to https://yatinchoubal.github.io/? (y/N)`. Type `y` and press Enter. Any other answer cancels, and your changes stay saved on this computer.
4. It pushes the changes to GitHub. GitHub Actions rebuilds the site, and the live site updates in about a minute.

You can watch the build at https://github.com/yatinchoubal/yatinchoubal.github.io/actions. A green check means the update is live. A red cross means the build failed and the live site is unchanged; open the run to see why.

**The code on GitHub is public.** Everything you publish, including draft blog posts and notes in the files, can be read by anyone on GitHub. Never put passwords, keys, or client information in the project.

## Undoing changes

**Before publishing**, to throw away everything you've changed since the last publish:

```powershell
npm run discard
```

It lists the changes and asks you to confirm. This can't be undone.

**After publishing**, to reverse the most recent published change:

```powershell
git revert HEAD --no-edit
git push
```

The live site goes back to how it was in about a minute. Run the pair again to undo the change before that.

To see the history of published changes:

```powershell
git log --oneline
```

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm error Missing script: "edit"` | You're in the wrong folder. Run `cd C:\dev\MyWebsite` first. |
| "Another astro dev server is already running" | A preview is already open. Use it, or close the other terminal (or press Ctrl+C there), then run `npm run edit` again. |
| http://localhost:4321/admin/ says "not found" | Use http://localhost:4321/admin/index.html |
| The editor loads but can't save, or shows a login screen | The editor backend isn't running. Stop with Ctrl+C and start again with `npm run edit`, not `npm run dev`. |
| `npm run publish` says "git push failed" | Check your internet connection. If GitHub asks you to sign in, do so in the browser window, then run `npm run publish` again. Your changes are already saved in Git, so `git push` on its own also works. |
| `npm run publish` says "Nothing to publish" | No files changed since the last publish. Check that you clicked Save in the editor. |
| Live site didn't change after publishing | Wait a minute and refresh with Ctrl+F5. Then check the Actions page for a failed build. |
| Something looks broken and you're not sure why | Run `npm run verify` and read the first error. Or ask Claude Code to look. |

## What doesn't work on the live site (GitHub Pages)

The live site is hosted on GitHub Pages, which only serves static files. These features were built for Netlify and won't work until the site moves there:

- the contact form, which shows an error on submit
- saving booking requests (the booking form still runs through to the test payment screen while the site is in test mode)
- the redirects from old service addresses, and the security headers in `netlify.toml`
- editing content online; editing works only on your computer

Before taking real bookings, move hosting to Netlify. The move keeps this GitHub repository and the same routine. See [INTEGRATIONS.md](INTEGRATIONS.md) and [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md).

## Related documents

- [OWNER-GUIDE.md](OWNER-GUIDE.md): handling bookings, privacy, and testimonials
- [INTEGRATIONS.md](INTEGRATIONS.md): payment, booking, and hosting setup
- [LAUNCH-CHECKLIST.md](LAUNCH-CHECKLIST.md): steps before going live for real
