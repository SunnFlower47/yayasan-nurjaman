import React from "react";

export interface PageHeaderProps {
  title: string;
  description?: string | undefined;
  icon?: React.ReactNode | undefined;
  actions?: React.ReactNode | undefined;
}

export function PageHeader({ title, description, icon, actions }: PageHeaderProps) {
  return (
    <div className="shadow-xs flex flex-col gap-4 rounded-xl border border-stone-200 bg-white p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="shadow-xs flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-white">
            {icon}
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900 sm:text-2xl">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
