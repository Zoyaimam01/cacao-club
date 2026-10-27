# Cacao Club — chocolate storefront

A responsive, animated chocolate storefront prototype inspired by the supplied reference image. It uses a different brand name and the same general cream / cocoa / lime / cyan / raspberry palette.

## Run locally
This is a static site with ES modules. For local testing, serve this folder using a local web server (for example VS Code Live Server or `npx serve .`). Opening `index.html` directly as a `file://` URL may block module imports.

## Working interactions
- Product category filters
- Quick-view product modal
- Search
- Add-to-bag, quantity controls, remove item, subtotal and persistent cart (`localStorage`)
- Responsive mobile navigation
- Review carousel
- Newsletter forms with local demo persistence when Supabase isn't configured
- Scroll reveals, moving marquee, subtle parallax and reduced-motion support

## Supabase setup
1. Create a Supabase project.
2. In `supabase-config.js`, add your project URL and **anon/public key**.
3. Run `supabase-schema.sql` in the Supabase SQL Editor.
4. Newsletter forms will insert email addresses into `newsletter_subscribers`.

Never put a Supabase `service_role` key in client-side code. The public anon key is intended for browser use with Row Level Security and appropriate policies.

## Production notes
- Checkout is a front-end demo placeholder. Connect a commerce provider before accepting real orders/payments.
- Product catalogue and cart currently use sample data and browser storage. The optional `products` schema is included for a future database-backed catalogue.
- Replace illustrative CSS chocolate-pack artwork and social tiles with licensed product photography before launch.
- Configure email confirmation/double opt-in, spam protection, privacy policy and rate limiting as appropriate for your jurisdiction.
