"use client";

import Image from "next/image";
import { Home } from "lucide-react";
import { LOOFFICE_HOME_URL, LOOFFICE_ICON_PATH, LOOFFICE_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

type LofficeLogoProps = {
  size?: number;
  showName?: boolean;
  className?: string;
  nameClassName?: string;
};

export function LofficeLogo({
  size = 32,
  showName = true,
  className,
  nameClassName,
}: LofficeLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={LOOFFICE_ICON_PATH}
        alt={`${LOOFFICE_NAME} 아이콘`}
        width={size}
        height={size}
        className="rounded-lg object-cover shadow-sm"
        priority
      />
      {showName && (
        <span
          className={cn(
            "text-base font-bold tracking-tight text-[#0d6b02]",
            nameClassName,
          )}
        >
          {LOOFFICE_NAME}
        </span>
      )}
    </span>
  );
}

type LofficeHomeLinkProps = {
  variant?: "logo" | "button";
  className?: string;
};

export function LofficeHomeLink({ variant = "logo", className }: LofficeHomeLinkProps) {
  if (variant === "button") {
    return (
      <a
        href={LOOFFICE_HOME_URL}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#18a303]/40 bg-gradient-to-b from-[#e8f5e6] to-[#d4edd0] px-3 text-xs font-semibold text-[#0d6b02] shadow-sm transition hover:border-[#18a303] hover:from-[#d4edd0] hover:to-[#c5e6c0]",
          className,
        )}
        title="Loffice 홈으로 이동"
      >
        <Home className="size-3.5" />
        로피스홈
      </a>
    );
  }

  return (
    <a
      href={LOOFFICE_HOME_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "inline-flex items-center rounded-lg px-1 py-0.5 transition hover:bg-[#e8f5e6]/80",
        className,
      )}
      title="Loffice 홈으로 이동"
    >
      <LofficeLogo size={36} showName />
    </a>
  );
}
