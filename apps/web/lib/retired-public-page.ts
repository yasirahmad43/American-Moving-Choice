/** Explicit retired routes bypass the framework's JavaScript-dependent error shell. */
const RECOVERY_HTML = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Page not found | American Moving Choice</title>
<style>
*{box-sizing:border-box}body{margin:0;background:#f5f7fa;color:#102136;font-family:Arial,Helvetica,sans-serif;line-height:1.6}a{color:#103e70;text-underline-offset:4px}header,footer{background:#fff;border-block:1px solid #dce3eb}.wrap{width:min(100% - 2rem,72rem);margin-inline:auto}header .wrap{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:1rem;padding-block:1rem}header img{display:block;width:clamp(10rem,24vw,15rem);height:auto}header a:last-child{padding-block:.75rem;font-weight:700}main{padding-block:clamp(2rem,6vw,5rem)}.card{background:#fff;border:1px solid #dce3eb;border-radius:1.25rem;padding:clamp(1.25rem,4vw,3rem)}.eyebrow{color:#52667f;font-size:.75rem;font-weight:700;letter-spacing:.15em;text-transform:uppercase}h1{font-size:clamp(2rem,5vw,3.75rem);line-height:1.12;letter-spacing:-.035em;margin:.75rem 0 1rem}p{max-width:60ch;margin:0 0 1.25rem}.actions{display:flex;flex-wrap:wrap;gap:.75rem}.button{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:.75rem 1.25rem;border:1px solid #0b3566;border-radius:.65rem;font-weight:700;text-decoration:none}.primary{background:#0b3566;color:white}.secondary{background:#fff;color:#0b3566}.next{display:flex;flex-wrap:wrap;gap:.75rem;margin-top:1rem}.next a{flex:1 1 12rem;border:1px solid #dce3eb;border-radius:.8rem;padding:1rem;background:#fff;font-weight:700;overflow-wrap:anywhere}footer nav{display:flex;flex-wrap:wrap;gap:1rem 1.5rem;padding-block:1rem}footer a{display:inline-flex;align-items:center;min-height:44px}a:focus-visible{outline:3px solid #d91c32;outline-offset:4px}
</style></head><body>
<header><div class="wrap"><a href="/" aria-label="American Moving Choice home"><img src="/brand/american-moving-choice-logo.png" width="1774" height="887" alt="American Moving Choice"></a><a href="/explore/">Browse moving guides</a></div></header>
<main id="main" class="wrap"><section class="card" aria-labelledby="page-title"><p class="eyebrow">Error 404</p><h1 id="page-title">We can't find that page</h1><p>The address may have changed, or this page is no longer available. Find moving guidance or start your moving request below.</p><div class="actions"><a class="button primary" href="/">Go to the home page</a><a class="button secondary" href="/get-quotes/">Get moving quotes</a></div></section><nav class="next" aria-label="Moving resources"><a href="/moving-costs/">Understand moving costs</a><a href="/planning/">Plan your next steps</a><a href="/contact/">Contact us</a></nav></main>
<footer><nav class="wrap" aria-label="Recovery navigation"><a href="/explore/">All moving guides</a><a href="/privacy/">Privacy policy</a><a href="/terms/">Terms of use</a></nav></footer>
</body></html>`;

export function retiredPublicPage(): Response {
  return new Response(RECOVERY_HTML, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, must-revalidate",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
}
