import { ImageResponse } from "next/og";

function Mark({ size }: { size: number }) {
  const ring = Math.round(size * 0.62);
  const inner = Math.round(size * 0.34);
  const stroke = Math.max(2, Math.round(size * 0.035));

  return (
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
          width: ring,
          height: ring,
          borderRadius: 9999,
          border: `${stroke}px solid #2EE6D6`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 0 24px rgba(46, 230, 214, 0.45)",
        }}
      >
        <div
          style={{
            width: inner,
            height: inner,
            borderRadius: 9999,
            background: "#2EE6D6",
          }}
        />
      </div>
    </div>
  );
}

export function generateImageMetadata() {
  return [
    {
      contentType: "image/png",
      size: { width: 32, height: 32 },
      id: "32",
    },
    {
      contentType: "image/png",
      size: { width: 192, height: 192 },
      id: "192",
    },
    {
      contentType: "image/png",
      size: { width: 512, height: 512 },
      id: "512",
    },
  ];
}

export default async function Icon({ id }: { id: Promise<string> }) {
  const iconId = await id;
  const dimension = iconId === "512" ? 512 : iconId === "192" ? 192 : 32;

  return new ImageResponse(<Mark size={dimension} />, {
    width: dimension,
    height: dimension,
  });
}
