import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  /*
   * The vendored MoltenMetal component is kept byte-for-byte as published, so
   * that upstream fixes can be dropped straight in. Its house style is not this
   * project's, and rewriting it to satisfy the linter would be exactly the
   * divergence worth avoiding.
   */
  {
    files: ["src/components/animation/molten/**"],
    rules: {
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
