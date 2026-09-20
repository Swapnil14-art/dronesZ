# DronesZ Website — Setup we need from you

The custom-build enquiry form needs **two accounts** so it can (1) email every enquiry to your
inbox and (2) store large design files. Please set up both and send us the values listed at the
bottom. Takes ~15 minutes.

> Send the finished values back through a **secure channel** (a password-manager share link, or
> 1Password / Bitwarden "Send") — not plain email or WhatsApp. They are passwords.

---

## 1. Resend — sends each enquiry to your email

Every time someone submits the form, Resend emails the details (and any attached file) to
`enquiry.dronesz@gmail.com`.

1. Create a free account at **https://resend.com** (the free plan covers 3,000 emails/month —
   plenty for enquiries).
2. In the dashboard, open **API Keys → Create API Key**.
   - Name: `DronesZ Website`
   - Permission: **Sending access**
   - Click create and **copy the key that starts with `re_…`** — it is shown only once.
3. **(Recommended) Verify your domain** so emails send from your own address and land in inboxes:
   - Open **Domains → Add Domain** and enter your website domain (e.g. `dronesz.in`).
   - Resend shows a few DNS records (DKIM / SPF). Add them at wherever your domain is registered
     (GoDaddy, Namecheap, etc.), then wait for the status to turn **Verified**.
   - Once verified, your "from" address can be `enquiry@dronesz.in`.
   - *If you skip this step*, we can launch using a temporary test sender, but real inbox delivery
     is unreliable — verifying the domain is strongly recommended before going live.

**Send us:**
- The API key (`re_…`)
- The "from" address you want enquiries to appear from (e.g. `DronesZ <enquiry@dronesz.in>`)

---

## 2. Vercel Blob — stores large uploaded files

Small files attach straight to the email. Files larger than ~4 MB are stored on Vercel and the
email carries a private, unguessable download link. This needs a "Blob" storage bucket on the
Vercel account that hosts the site.

1. Go to **https://vercel.com** and open the DronesZ project.
   *(If the site isn't on Vercel yet, we can help you import it first.)*
2. Open the **Storage** tab → **Create Database** → choose **Blob**.
   - Name it `dronesz-uploads` → **Create**.
3. On the new store, click **Connect Project** → select the DronesZ project → tick all
   environments (Production, Preview, Development).
   - Vercel now stores the access token on the project automatically.
4. To share it with us for setup, open **Storage → dronesz-uploads → `.env.local`** (or the store's
   **Quickstart / tokens** panel) and copy the value labelled **`BLOB_READ_WRITE_TOKEN`**
   (starts with `vercel_blob_rw_…`).

**Send us:**
- The `BLOB_READ_WRITE_TOKEN` (`vercel_blob_rw_…`)

---

## What to send back — checklist

| Value | Looks like | From |
|-------|------------|------|
| `RESEND_API_KEY` | `re_…` | Resend → API Keys |
| `RESEND_FROM` | `DronesZ <enquiry@dronesz.in>` | your verified Resend domain |
| `BLOB_READ_WRITE_TOKEN` | `vercel_blob_rw_…` | Vercel → Storage → Blob |
| Recipient email (confirm) | `enquiry.dronesz@gmail.com` | where enquiries should land |

Once we have these, we connect them, test a real enquiry end-to-end, and the form goes live.
