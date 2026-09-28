import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdfkit reads its built-in font metrics (.afm) files from disk at
  // runtime relative to its own module location; bundling it would break
  // that path resolution in the serverless function, so keep it external.
  serverExternalPackages: ["pdfkit"],
};

export default nextConfig;
