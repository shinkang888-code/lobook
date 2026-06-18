import Image from "next/image";
import { APP_ICON_PATH, APP_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

type LoBookLogoProps = {
  size?: number;
  showName?: boolean;
  className?: string;
  nameClassName?: string;
};

export function LoBookLogo({ size = 32, showName = false, className, nameClassName }: LoBookLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={APP_ICON_PATH}
        alt={`${APP_NAME} 로고`}
        width={size}
        height={size}
        className="rounded-lg object-cover shadow-sm"
        priority
      />
      {showName && (
        <span className={cn("font-semibold tracking-tight", nameClassName)}>{APP_NAME}</span>
      )}
    </span>
  );
}
