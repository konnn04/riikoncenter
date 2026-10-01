import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const submodulePath = path.resolve(
  __dirname,
  "../../external/integration-simple-custom-markdown-converter/simple-custom-markdown-converter"
);
import dotenv from 'dotenv';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

// Load root workspace .env
dotenv.config({ path: path.join(process.cwd(), '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: [
    "@riikoncenter/ui",
    "@riikoncenter/types",
    "simple-customize-markdown-converter",
  ],
  webpack: (config) => {
    if (fs.existsSync(submodulePath)) {
      config.resolve.alias = {
        ...config.resolve.alias,
        "simple-customize-markdown-converter/react": fs.existsSync(
          path.join(submodulePath, "dist/react.js")
        )
          ? path.join(submodulePath, "dist/react.js")
          : path.join(submodulePath, "src/react.tsx"),
        "simple-customize-markdown-converter": fs.existsSync(
          path.join(submodulePath, "dist/index.js")
        )
          ? path.join(submodulePath, "dist/index.js")
          : path.join(submodulePath, "src/index.ts"),
      };
    }
    return config;
  },
};

export default (phase) => {
  // Auto-override URLs for local development
  if (phase === PHASE_DEVELOPMENT_SERVER) {
    process.env.NEXT_PUBLIC_API_URL = `http://localhost:${process.env.PORT || 3305}`;
    process.env.FRONTEND_URL = 'http://localhost:3003';
  }
  return nextConfig;
};
