import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#06090E",
        }}
      >
        <div
          style={{
            width: 112,
            height: 112,
            borderRadius: 9999,
            border: "6px solid #2EE6D6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 24px rgba(46, 230, 214, 0.45)",
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 9999,
              background: "#2EE6D6",
            }}
          />
        </div>
      </div>
    ),
    size,
  );
}
