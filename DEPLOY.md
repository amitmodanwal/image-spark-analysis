# Deploying EvidenceLens AI

## 1. Required database setup (do this first)

History stays empty until the `analyses` table exists. In your Supabase project:

Dashboard → SQL Editor → New query → paste the contents of `supabase-setup.sql` → Run.

Verify with:

```bash
curl -s -o /dev/null -w "%{http_code}\n" \
  "$VITE_SUPABASE_URL/rest/v1/analyses?select=id&limit=1" \
  -H "apikey: $VITE_SUPABASE_PUBLISHABLE_KEY"
```

`200` = ready. `404` = the SQL has not been run yet.

## 2. Deploy on Vercel

This is a TanStack Start app built with Nitro. To target Vercel instead of the
default Cloudflare preset, set a build env var in Vercel:

- `NITRO_PRESET = vercel`

Steps:

1. Push the project to GitHub (Lovable → GitHub → Connect).
2. In Vercel: New Project → import the repo.
3. Framework preset: **Other**. Build command `npm run build`, output is handled
   by Nitro (`.vercel/output`) — leave Output Directory empty.
4. Environment variables (Project Settings → Environment Variables):
   - `NITRO_PRESET=vercel`
   - `VITE_CLOUDINARY_CLOUD_NAME`
   - `VITE_CLOUDINARY_UPLOAD_PRESET`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `LOVABLE_API_KEY` (server-only, used by `/api/analyze`)
5. Deploy.

## 3. Supabase auth redirect URLs

After the first deploy, add the Vercel URL in Supabase → Authentication → URL
Configuration → Site URL / Redirect URLs, otherwise email sign-in links point to
localhost.

## Alternative: one-click Lovable publish

Click Publish in Lovable — no config needed, env vars carry over automatically.
