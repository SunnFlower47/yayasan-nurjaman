import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",
      "build/**",
      "test-results/**",
      "playwright-report/**",
      "next-env.d.ts",
      "coverage/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "max-lines": [
        "error",
        {
          max: 250,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      complexity: ["error", 10],
      "max-params": ["error", 4],
      "no-console": [
        "error",
        {
          allow: ["warn", "error"],
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "no-restricted-properties": [
        "error",
        {
          property: "$queryRawUnsafe",
          message:
            "Penggunaan $queryRawUnsafe dilarang demi keamanan SQL injection. Gunakan $queryRaw bertemplat.",
        },
        {
          property: "$executeRawUnsafe",
          message:
            "Penggunaan $executeRawUnsafe dilarang demi keamanan SQL injection. Gunakan $executeRaw bertemplat.",
        },
      ],
    },
  },
  {
    files: ["tests/**/*.{ts,tsx}", "scripts/**/*.{ts,tsx,mjs}", "prisma/**/*.{ts,tsx}"],
    rules: {
      "max-lines": "off",
      complexity: "off",
      "max-params": "off",
      "no-console": "off",
      "no-restricted-properties": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/app/**/components/**/*.{ts,tsx}",
      "src/modules/**/components/**/*.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@prisma/client",
              message:
                "Komponen UI dilarang mengimpor @prisma/client secara langsung. Gunakan alur Route/Action -> Service -> Repository.",
            },
            {
              name: "@/lib/db",
              message:
                "Komponen UI dilarang mengimpor instance basis data langsung. Gunakan alur Route/Action -> Service -> Repository.",
            },
          ],
          patterns: [
            {
              group: ["**/repositories/**", "**/repositories"],
              message: "Komponen UI dilarang mengimpor berkas repository langsung.",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
