import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "TechInView: AI mock interviews for software engineers";

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
              background: "#22D3EE",
            }}
          />
          <span
            style={{
              color: "#22D3EE",
              fontSize: "16px",
              fontWeight: "500",
              letterSpacing: "0.05em",
            }}
          >
            Voice AI interviewer
          </span>
        </div>

        {/* Logo: concept C mark + lowercase wordmark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "20px",
          }}
        >
          <svg width="88" height="88" viewBox="0 0 32 32">
            <path d="M11 4H4V28H11V25H7V7H11Z" fill="#EDEEF0" />
            <path d="M21 4H28V28H21V25H25V7H21Z" fill="#EDEEF0" />
            <circle cx="16" cy="16" r="4.5" fill="#22D3EE" />
          </svg>
          <span
            style={{
              fontSize: "80px",
              fontWeight: "700",
              color: "#EDEEF0",
              letterSpacing: "-2px",
              lineHeight: 1,
            }}
          >
            techinview
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
          AI mock interviews for software engineers
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
          Talk through DSA problems in a live editor, then get a scorecard
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
            techinview.dev
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
