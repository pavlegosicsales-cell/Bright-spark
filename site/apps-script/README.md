# Bright Sparx enquiry backend

Google Apps Script web app behind the quote wizard on `contact.html` and the
contact section of `index.html`. It writes every submission to a Google Sheet
and sends one branded notification email.

## Deploy

1. Open the leads Google Sheet, then **Extensions > Apps Script**.
2. Replace everything in `Code.gs` with the contents of `Code.gs` from this folder.
3. Check `NOTIFY_TO` at the top. It ships pointed at **pavlegosic9@gmail.com**
   on purpose, so the first live submissions land in your own inbox.
4. Optionally paste the Sheet URL into `SHEET_URL`. It becomes a small
   "View the full leads database" link in the email footer. Leave it empty and
   the link hides itself.
5. **Deploy > New deployment > Web app.** Execute as **Me**, Access **Anyone**.
6. Copy the `/exec` URL.
7. Paste it into `ENDPOINT` at the top of `site/main.js`, then redeploy the site.

## Redeploying after an edit

Editing the script does nothing to the live URL. Every time:

**Deploy > Manage deployments > edit the existing deployment > New version.**

This is the step that catches everyone.

## Going live

One line, once you are happy with the emails:

```js
var NOTIFY_TO = 'info@brightsparxelectrical.com.au';
```

Then push a **New version** as above. Consider keeping your own address in the
Sheet's notification rules so you can still see what is coming in.

## Fields

The script reads these params, matching the `name` attributes in `contact.html`
and the payload built in `main.js`:

| Param | Source |
|---|---|
| `name` | Step 4 text field |
| `suburb` | Step 4 text field |
| `phone` | Step 4 text field |
| `email` | Step 4 text field |
| `service` | Step 1 choice |
| `property` | Step 2 choice |
| `timing` | Step 3 choice |
| `message` | Step 4 textarea, optional |
| `page` | Added by `main.js` |

Sheet columns, in order: Received, Name, Suburb, Phone, Email, Service,
Property, Timing, Message, Page. The header row is written automatically on the
first submission.

## Behaviour worth knowing

- **The sheet write and the email are independent.** A failed sheet write is
  caught and the notification still goes out. Losing a lead to a spreadsheet
  error is the worst possible failure.
- **The site fires `no-cors`,** so the browser cannot read the response. The
  success screen shows whether or not the send actually worked. Test a real
  submission after deploying rather than trusting the green tick.
- **Reply-to is the enquirer.** Hitting reply on the notification starts the
  actual reply to the customer.
- **Buttons only render when usable.** A phone needs 6+ digits before a `tel:`
  button appears and an email needs a real `user@host.tld` shape. Someone
  typing "n/a" gets plain text, not a dead button.
- **Quota:** 100 recipients/day on a free Gmail account, 1500 on Workspace.

## Preview

Rendered proofs of the email, including the awkward inputs, are in `preview/`.
Regenerate with:

```bash
node 03-form-backend-setup/scripts/preview.js site/apps-script/Code.gs site/apps-script/preview
```
