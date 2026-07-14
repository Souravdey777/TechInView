import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { consumeApiRateLimit } from "@/lib/db/queries";

export type AuthenticatedApiUser = {
  id: string;
  email?: string;
};

export async function getAuthenticatedApiUser(): Promise<AuthenticatedApiUser | null> {
  const supabase = createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return { id: user.id, email: user.email };
}

export function unauthorizedResponse() {
  return NextResponse.json(
    { success: false, error: "Unauthorized" },
    { status: 401 }
  );
}

export async function enforceApiRateLimit(params: {
  userId: string;
  action: string;
  limit: number;
  windowSeconds: number;
}): Promise<NextResponse | null> {
  const result = await consumeApiRateLimit({
    subject: `user:${params.userId}`,
    action: params.action,
    limit: params.limit,
    windowSeconds: params.windowSeconds,
  });

  if (result.allowed) {
    return null;
  }

  return NextResponse.json(
    { success: false, error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: { "Retry-After": String(result.retryAfterSeconds) },
    }
  );
}
