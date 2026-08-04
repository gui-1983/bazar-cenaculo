import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieToSet = { name: string; value: string; options: CookieOptions };

const MAINTENANCE_HTML = `<!doctype html>
<html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Bazar Beneficente — em breve</title>
<style>
  *{box-sizing:border-box;margin:0}
  body{min-height:100vh;display:grid;place-items:center;background:#eef4fa;
    font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#16211c;padding:24px}
  .card{max-width:440px;text-align:center;background:#fff;border:1px solid #e2eaf0;
    border-radius:22px;padding:40px 28px;box-shadow:0 12px 40px rgba(18,63,102,.08)}
  .logo{width:72px;height:72px;border-radius:50%;margin:0 auto 20px;
    background:linear-gradient(135deg,#368FD9,#2c78bd);display:grid;place-items:center}
  h1{font-size:24px;margin-bottom:10px;letter-spacing:-.02em}
  p{color:#5b6b64;font-size:15.5px;line-height:1.5}
  .inst{margin-top:18px;font-size:13px;color:#8a978f}
</style></head>
<body><div class="card">
  <div class="logo">
    <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff"><path d="M22 5.5c-1.2.5-2 .6-3 .7 1-.6 1.6-1.5 2-2.6-1 .6-2 1-3.1 1.2A4.9 4.9 0 0 0 7.7 9c0 .4 0 .8.1 1.1A13.9 13.9 0 0 1 2 5.1a4.9 4.9 0 0 0 1.5 6.5c-.8 0-1.5-.2-2.1-.5v.1c0 2.4 1.7 4.4 3.9 4.8-.7.2-1.4.2-2.1.1.6 1.9 2.4 3.3 4.5 3.4A9.9 9.9 0 0 1 1 21.5a14 14 0 0 0 7.5 2.2c9 0 14-7.6 14-14v-.6c1-.7 1.8-1.6 2.5-2.6l-3 .5z"/></svg>
  </div>
  <h1>Voltamos já 💙</h1>
  <p>O catálogo do nosso bazar está em preparação e ficará disponível em breve. Obrigado pela paciência!</p>
  <div class="inst">Bazar Beneficente · Cenáculo Espírita Thiago Maior</div>
</div></body></html>`;

export async function middleware(request: NextRequest) {
  if (process.env.SITE_LOCKED === "true") {
    return new NextResponse(MAINTENANCE_HTML, {
      status: 503,
      headers: { "content-type": "text/html; charset=utf-8", "retry-after": "3600" },
    });
  }

  const path = request.nextUrl.pathname;
  if (!path.startsWith("/admin")) return NextResponse.next();

  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  if (!path.startsWith("/admin/login") && !user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }
  if (path.startsWith("/admin/login") && user) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
