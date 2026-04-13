import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

type AdminErrorLike = {
  message?: string;
  code?: string;
  status?: number;
};

function getAdminErrorPayload(error: AdminErrorLike | null | undefined) {
  return {
    error: error?.message || "Failed to delete account",
    code: error?.code ?? null,
  };
}

export async function POST() {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Server is missing Supabase admin configuration",
        },
        { status: 500 }
      );
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    const { data: authUserData, error: lookupError } =
      await admin.auth.admin.getUserById(user.id);

    if (lookupError) {
      console.error("Failed to load auth user before delete:", lookupError);
      return NextResponse.json(
        { success: false, ...getAdminErrorPayload(lookupError) },
        { status: lookupError.status ?? 500 }
      );
    }

    if (!authUserData.user) {
      const { error: profileError } = await admin
        .from("profiles")
        .delete()
        .eq("id", user.id);

      if (profileError) {
        console.error(
          "Auth user missing during delete and profile cleanup failed:",
          profileError
        );
        return NextResponse.json(
          {
            success: false,
            error:
              "Account auth record is already missing and profile cleanup failed",
          },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true });
    }

    // Delete the auth.users record first so Postgres can cascade profile-owned
    // data in a single direction: auth.users -> profiles -> dependent tables.
    const { error: authError } = await admin.auth.admin.deleteUser(user.id);

    if (authError) {
      console.error("Failed to delete auth user:", authError);
      return NextResponse.json(
        { success: false, ...getAdminErrorPayload(authError) },
        { status: authError.status ?? 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
