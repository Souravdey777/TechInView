import { NextResponse } from "next/server";
import { parseJdFile } from "@/lib/loops/jd-parser";
import {
  enforceApiRateLimit,
  getAuthenticatedApiUser,
  unauthorizedResponse,
} from "@/lib/api-security";

export async function POST(req: Request) {
  try {
    const user = await getAuthenticatedApiUser();
    if (!user) return unauthorizedResponse();
    const rateLimited = await enforceApiRateLimit({
      userId: user.id,
      action: "jd_parse",
      limit: 20,
      windowSeconds: 60 * 60,
    });
    if (rateLimited) return rateLimited;

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "A file is required." },
        { status: 400 }
      );
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "The uploaded file must be 5 MB or smaller." },
        { status: 413 }
      );
    }

    const jdText = await parseJdFile(file);

    return NextResponse.json({
      success: true,
      data: {
        fileName: file.name,
        jdText,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to parse the uploaded JD",
      },
      { status: 400 }
    );
  }
}
