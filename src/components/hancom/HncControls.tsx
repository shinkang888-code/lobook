"use client";

import type { LucideIcon } from "lucide-react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type HncRibbonIconBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: LucideIcon;
  label: string;
  active?: boolean;
  large?: boolean;
};

export function HncRibbonIconBtn({
  icon: Icon,
  label,
  active,
  large,
  className = "",
  disabled,
  ...props
}: HncRibbonIconBtnProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={`hnc-control hnc-icon-text-button hnc-ribbon-icon-btn ${active ? "hnc-ribbon-icon-btn--active" : ""} ${className}`}
      title={label}
      {...props}
    >
      <span className={`hnc-control hnc-image ${large ? "hnc-lucide-icon-lg" : "hnc-lucide-icon"}`}>
        <Icon aria-hidden />
      </span>
      <span className="hnc-control hnc-caption">{label}</span>
    </button>
  );
}

type HncCommandBtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  label: string;
};

export function HncCommandBtn({ icon: Icon, label, className = "", ...props }: HncCommandBtnProps) {
  return (
    <button type="button" className={`hnc-control hnc-command-button ${className}`} {...props}>
      {Icon && (
        <span className="hnc-control hnc-image hnc-lucide-icon">
          <Icon aria-hidden />
        </span>
      )}
      <span className="hnc-control hnc-caption">{label}</span>
    </button>
  );
}

export function HncRibbonGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="hancom-ribbon-group">
      <div className="hnc-control hnc-groupbox">
        <div className="hnc-control hnc-caption">{label}</div>
        <div className="hnc-control-container">{children}</div>
      </div>
    </div>
  );
}

export function HncIconOnlyBtn({
  icon: Icon,
  label,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { icon: LucideIcon; label: string }) {
  return (
    <button type="button" className={`hnc-control hnc-icon-only-button ${className}`} title={label} {...props}>
      <span className="hnc-control hnc-image hnc-lucide-icon">
        <Icon aria-hidden />
      </span>
      <span className="hnc-control hnc-caption">{label}</span>
    </button>
  );
}
