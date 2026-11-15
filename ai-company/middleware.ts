import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login", "/setup"];

export async function middleware(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const path = request.nextUrl.pathname;
  if (!url || !key || url.includes("YOUR-PROJECT")) {
    if (path === "/setup") return NextResponse.next();
    return NextResponse.redirect(new URL("/setup", request.url));
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data } = await supabase.auth.getUser();
  const isPublic = PUBLIC_PATHS.some((p) => path === p);
  if (!data.user && !isPublic) {
    const to = new URL("/login", request.url);
    return NextResponse.redirect(to);
  }
  if (data.user && path === "/login") return NextResponse.redirect(new URL("/", request.url));
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|ico)$).*)"],
};
