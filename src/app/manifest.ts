import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Shadow Telemetry: A Cognitive Workload & Unscripted Exception Logger",
    short_name: "Shadow",
    description:
      "Zero-knowledge logger for undocumented triage, exception handling, and unscripted field work.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#06090E",
    theme_color: "#06090E",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
