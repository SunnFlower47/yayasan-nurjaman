import React from "react";

export function SpacingRadiusSection() {
  return (
    <section className="space-y-4">
      <h2 className="font-serif text-xl font-semibold text-foreground">
        6. Spacing & Radius (Grid 4/8px & Kontrol Presisi)
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-3 rounded-md border border-border bg-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Skala Radius
          </h3>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xs border border-border bg-neutral-100 px-3 py-2 font-mono text-xs">
              xs (2px)
            </div>
            <div className="rounded-sm border border-border bg-neutral-100 px-3 py-2 font-mono text-xs">
              sm (4px)
            </div>
            <div className="rounded-md border border-border bg-neutral-100 px-3 py-2 font-mono text-xs">
              md (6px)
            </div>
            <div className="rounded-lg border border-border bg-neutral-100 px-3 py-2 font-mono text-xs">
              lg (8px)
            </div>
            <div className="rounded-full border border-border bg-neutral-100 px-3 py-2 font-mono text-xs">
              full (Pill)
            </div>
          </div>
        </div>

        <div className="space-y-3 rounded-md border border-border bg-card p-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Skala Spacing (4px / 8px Modular)
          </h3>
          <div className="flex items-end gap-2">
            <div className="h-2 w-2 bg-primary" title="2 (8px)"></div>
            <div className="h-3 w-3 bg-primary" title="3 (12px)"></div>
            <div className="h-4 w-4 bg-primary" title="4 (16px)"></div>
            <div className="h-6 w-6 bg-primary" title="6 (24px)"></div>
            <div className="h-8 w-8 bg-primary" title="8 (32px)"></div>
            <div className="h-12 w-12 bg-primary" title="12 (48px)"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
