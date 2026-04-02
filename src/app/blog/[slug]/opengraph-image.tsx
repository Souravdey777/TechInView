import { ImageResponse } from "next/og";
import { getPostBySlug, getPostSlugs } from "@/lib/blog";

export const runtime = "nodejs";

export const alt = "TechInView Blog";

export const size = { width: 1200, height: 630 };

export const contentType = "image/png";

export function generateStaticParams() {
  return getPostSlugs().map((slug) => ({ slug }));
}

export default function OgImage({ params }: { params: { slug: string } }) {
  const post = getPostBySlug(params.slug);

  const title = post?.title ?? "Blog Post";
  const keyword = post?.keyword ?? "Interview Prep";
  const readingTime = post?.readingTimeMinutes ?? 5;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#07080a",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "60px 72px",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top-center glow */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "900px",
            height: "450px",
            background:
              "radial-gradient(ellipse at center, rgba(34,211,238,0.12) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Bottom-right accent */}
        <div
          style={{
            position: "absolute",
            bottom: "-80px",
            right: "-80px",
            width: "500px",
            height: "350px",
            background:
              "radial-gradient(ellipse at center, rgba(52,211,153,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Top: badge + keyword */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              background: "rgba(34,211,238,0.08)",
              border: "1px solid rgba(34,211,238,0.25)",
              borderRadius: "100px",
              padding: "6px 18px",
            }}
          >
            <div
              style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: "#22d3ee",
              }}
            />
            <span
              style={{
                color: "#22d3ee",
                fontSize: "16px",
                fontWeight: "500",
                letterSpacing: "0.05em",
              }}
            >
              {keyword}
            </span>
          </div>
          <span
            style={{
              color: "#4a5568",
              fontSize: "15px",
            }}
          >
            {readingTime} min read
          </span>
        </div>

        {/* Center: title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <h1
            style={{
              fontSize: title.length > 60 ? "44px" : "52px",
              fontWeight: "700",
              color: "#e2e8f0",
              lineHeight: 1.2,
              letterSpacing: "-1.5px",
              margin: 0,
              maxWidth: "1000px",
            }}
          >
            {title}
          </h1>
        </div>

        {/* Bottom: brand */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
            <span
              style={{
                fontSize: "28px",
                fontWeight: "700",
                color: "#e2e8f0",
                letterSpacing: "-0.5px",
              }}
            >
              TechInView
            </span>
            <span
              style={{
                fontSize: "32px",
                fontWeight: "700",
                color: "#22d3ee",
              }}
            >
              .
            </span>
          </div>
          <span
            style={{
              color: "#4a5568",
              fontSize: "15px",
              letterSpacing: "0.05em",
            }}
          >
            techinview.ai/blog
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
