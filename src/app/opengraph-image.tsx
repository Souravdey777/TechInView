import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "TechInView — AI Mock Interview Platform";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          background: "#07080a",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle radial glow top-center */}
        <div
          style={{
            position: "absolute",
            top: "-80px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "800px",
            height: "400px",
            background:
              "radial-gradient(ellipse at center, rgba(34,211,238,0.15) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Bottom-right accent glow */}
        <div
          style={{
            position: "absolute",
            bottom: "-60px",
            right: "-60px",
            width: "400px",
            height: "300px",
            background:
              "radial-gradient(ellipse at center, rgba(52,211,153,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        {/* Brand badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(34,211,238,0.08)",
            border: "1px solid rgba(34,211,238,0.25)",
            borderRadius: "100px",
            padding: "6px 18px",
            marginBottom: "40px",
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
            Voice-powered AI interviewer
          </span>
        </div>

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: "2px",
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              fontSize: "80px",
              fontWeight: "700",
              color: "#e2e8f0",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            TechInView
          </span>
          <span
            style={{
              fontSize: "88px",
              fontWeight: "700",
              color: "#22d3ee",
              lineHeight: 1,
            }}
          >
            .
          </span>
        </div>

        {/* Subtitle */}
        <p
          style={{
            fontSize: "28px",
            fontWeight: "500",
            color: "#7a8ba3",
            margin: "0 0 24px 0",
            letterSpacing: "-0.3px",
          }}
        >
          AI Mock Interview Platform
        </p>

        {/* Tagline */}
        <p
          style={{
            fontSize: "20px",
            fontWeight: "400",
            color: "#4a5568",
            margin: 0,
            maxWidth: "700px",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Voice-powered DSA interviews with FAANG-calibrated scoring
        </p>

        {/* Bottom divider + domain */}
        <div
          style={{
            position: "absolute",
            bottom: "40px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            style={{
              width: "32px",
              height: "1px",
              background: "#1a2332",
            }}
          />
          <span
            style={{
              color: "#4a5568",
              fontSize: "15px",
              letterSpacing: "0.05em",
            }}
          >
            techinview.ai
          </span>
          <div
            style={{
              width: "32px",
              height: "1px",
              background: "#1a2332",
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
