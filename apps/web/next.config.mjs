import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const submodulePath = path.resolve(
  __dirname,
  "../../external/integration-simple-custom-markdown-converter/simple-custom-markdown-converter"
);

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

export default nextConfig;
