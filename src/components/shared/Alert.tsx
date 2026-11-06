import React from "react";
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export interface AlertProps {
  variant?: "danger" | "warning" | "success" | "info";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Alert({ variant = "info", title, children, className = "" }: AlertProps) {
  const styles = {
    danger: "bg-red-50 text-red-900 border-red-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
    success: "bg-emerald-50 text-emerald-900 border-emerald-200",
    info: "bg-sky-50 text-sky-900 border-sky-200",
  }[variant];

  const Icon = {
    danger: AlertCircle,
    warning: AlertTriangle,
    success: CheckCircle2,
    info: Info,
  }[variant];

  const iconColors = {
    danger: "text-red-600",
    warning: "text-amber-600",
    success: "text-emerald-600",
    info: "text-sky-600",
  }[variant];

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-md border p-3 text-sm ${styles} ${className}`}
    >
      <Icon className={`h-5 w-5 shrink-0 ${iconColors}`} strokeWidth={1.75} />
      <div className="flex-1 space-y-0.5">
        {title && <p className="font-medium text-stone-900">{title}</p>}
        <div className="text-xs leading-relaxed text-stone-700">{children}</div>
      </div>
    </div>
  );
}
