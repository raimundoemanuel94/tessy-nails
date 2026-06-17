import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  // Project-level overrides
  {
    rules: {
      // Disabled: false positives on async data fetching patterns in useEffect
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/no-deriving-state-in-effects": "off",
      // Disabled: plugin not installed in this project
      "react-compiler/react-compiler": "off",
      // Downgraded to warning: gradual type improvement in progress
      "@typescript-eslint/no-explicit-any": "warn",
    }
  }
]);

export default eslintConfig;
