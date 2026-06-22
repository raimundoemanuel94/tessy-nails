import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPostAuthRedirectPath } from "@/lib/auth/post-auth-redirect";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const isAuthPage = request.nextUrl.pathname.startsWith("/login") ||
                     request.nextUrl.pathname.startsWith("/cadastro");
  const isAuthCallback = request.nextUrl.pathname.startsWith("/auth/callback");
  const isPublicPage = request.nextUrl.pathname.startsWith("/agendar") ||
                       request.nextUrl.pathname.startsWith("/cliente/agendar/sucesso") ||
                       request.nextUrl.pathname.startsWith("/cliente/agendar/consultar") ||
                       request.nextUrl.pathname === "/" ||
                       isAuthCallback;
  const isApiPublic = request.nextUrl.pathname.startsWith("/api/public");
  const isApiRoute = request.nextUrl.pathname.startsWith("/api/");

  if (!user && isApiRoute && !isApiPublic) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user && !isAuthPage && !isPublicPage && !isApiPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    const pathname = request.nextUrl.pathname;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, studio_id")
      .eq("id", user.id)
      .maybeSingle();

    // Check trial expiry for studio owners
    if (profile?.role !== "superadmin" && profile?.studio_id) {
      const { data: studio } = await supabase
        .from("studios")
        .select("trial_ends_at, subscription_status, is_active")
        .eq("id", profile.studio_id)
        .maybeSingle();

      const isExpired = studio?.trial_ends_at && new Date(studio.trial_ends_at) < new Date();
      const isTrialStatus = studio?.subscription_status === "trial" || studio?.subscription_status === "trialing";
      const isDashboardOrProtected = !isPublicPage && !isAuthPage && !isAuthCallback;

      if (isExpired && isTrialStatus && isDashboardOrProtected && !pathname.startsWith("/setup")) {
        const url = request.nextUrl.clone();
        url.pathname = "/setup";
        url.searchParams.set("expired", "1");
        return NextResponse.redirect(url);
      }
    }

    const targetPath = getPostAuthRedirectPath(profile);
    const isAdminPath = pathname.startsWith("/admin");
    const isDashboardPath = pathname.startsWith("/dashboard");
    const isSetupPath = pathname.startsWith("/setup");
    const isLandingPath = isAuthPage || pathname === "/";

    const shouldRedirect =
      isLandingPath ||
      (isDashboardPath && profile?.role === "superadmin") ||
      (isSetupPath && (profile?.role === "superadmin" || Boolean(profile?.studio_id))) ||
      (isAdminPath && profile?.role !== "superadmin");

    if (shouldRedirect && targetPath !== pathname) {
      const url = request.nextUrl.clone();
      url.pathname = targetPath;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
