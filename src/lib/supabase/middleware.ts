import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  REFERRAL_COOKIE_MAX_AGE_SECONDS,
  REFERRAL_COOKIE_NAME,
} from "@/lib/constants";

const PROTECTED_PATHS = [
  "/dashboard",
  "/interview",
  "/practice/solve",
  "/results",
  "/problems",
  "/progress",
  "/settings",
  "/onboarding",
];

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.some((path) => pathname.startsWith(path));
}

function withReferralCookie(response: NextResponse, request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref")?.trim();

  if (!ref) {
    return response;
  }

  response.cookies.set(REFERRAL_COOKIE_NAME, ref, {
    httpOnly: true,
    maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // Skip Supabase auth if env vars are not configured (dev without Supabase)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    // If accessing protected route without Supabase configured, redirect to login
    if (isProtectedPath(request.nextUrl.pathname)) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return withReferralCookie(NextResponse.redirect(url), request);
    }
    return withReferralCookie(supabaseResponse, request);
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session — do not remove this call
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return withReferralCookie(NextResponse.redirect(loginUrl), request);
  }

  // Redirect authenticated users away from auth pages
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    dashboardUrl.search = "";
    return withReferralCookie(NextResponse.redirect(dashboardUrl), request);
  }

  // Onboarding redirect: check if profile is incomplete
  if (user && (isProtectedPath(pathname) || pathname === "/onboarding")) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("target_company, experience_level, preferred_language")
      .eq("id", user.id)
      .single();

    const isIncomplete =
      !profile?.target_company ||
      !profile?.experience_level ||
      !profile?.preferred_language;

    if (isIncomplete && pathname !== "/onboarding") {
      const onboardingUrl = request.nextUrl.clone();
      onboardingUrl.pathname = "/onboarding";
      onboardingUrl.search = "";
      return withReferralCookie(NextResponse.redirect(onboardingUrl), request);
    }

    if (!isIncomplete && pathname === "/onboarding") {
      const dashboardUrl = request.nextUrl.clone();
      dashboardUrl.pathname = "/dashboard";
      dashboardUrl.search = "";
      return withReferralCookie(NextResponse.redirect(dashboardUrl), request);
    }
  }

  return withReferralCookie(supabaseResponse, request);
}
