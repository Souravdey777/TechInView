import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
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
