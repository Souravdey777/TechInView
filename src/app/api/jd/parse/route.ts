import { NextResponse } from "next/server";
import { parseJdFile } from "@/lib/loops/jd-parser";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "A file is required." },
        { status: 400 }
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
