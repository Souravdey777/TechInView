import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { COUNTRY_COOKIE } from "@/lib/constants";

export async function middleware(request: NextRequest) {
  const response = await updateSession(request);
  const country = request.headers.get("x-vercel-ip-country");
  if (country && request.cookies.get(COUNTRY_COOKIE)?.value !== country) {
    response.cookies.set(COUNTRY_COOKIE, country, { path: "/", sameSite: "lax", maxAge: 60 * 60 * 24 * 30 });
  }
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public folder assets (images, fonts, sounds)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|public/|fonts/|images/|sounds/).*)",
  ],
};
