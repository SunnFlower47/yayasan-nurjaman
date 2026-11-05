import { notFound } from "next/navigation";
import { ColorPaletteSection } from "./components/color-palette-section";
import { TypographySection } from "./components/typography-section";
import { SpacingRadiusSection } from "./components/spacing-radius-section";
import { ContrastMatrixSection } from "./components/contrast-matrix-section";

export default function DevTokensPage() {
  // Hanya aktif di development, return 404 di production
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-12 px-6 py-12">
      <header className="border-b border-border pb-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="rounded bg-neutral-200 px-2 py-0.5 text-xs font-semibold text-neutral-700">
              DEV ONLY
            </span>
            <h1 className="mt-2 font-serif text-3xl font-bold tracking-tight text-foreground">
              Pratinjau Design Tokens
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Yayasan Nurjaman Bongas Purwakarta — Palet Warna, Tipografi, Spacing, Radius
              & Kontras WCAG AA
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            Environment:{" "}
            <code className="font-mono font-semibold text-primary">
              {process.env.NODE_ENV}
            </code>
          </div>
        </div>
      </header>

      <ColorPaletteSection />
      <TypographySection />
      <SpacingRadiusSection />
      <ContrastMatrixSection />
    </div>
  );
}
