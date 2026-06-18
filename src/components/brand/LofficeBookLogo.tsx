import Image from "next/image";
import { LOOFFICE_BOOK_NAME, LOOFFICE_ICON_PATH } from "@/lib/branding";
import { cn } from "@/lib/utils";

type LofficeBookLogoProps = {
  size?: number;
  showName?: boolean;
  className?: string;
  nameClassName?: string;
};

export function LofficeBookLogo({
  size = 32,
  showName = true,
  className,
  nameClassName,
}: LofficeBookLogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src={LOOFFICE_ICON_PATH}
        alt={`${LOOFFICE_BOOK_NAME} 아이콘`}
        width={size}
        height={size}
        className="rounded-lg object-cover shadow-sm"
        priority
      />
      {showName && (
        <span className={cn("inline-flex items-baseline gap-1 tracking-tight", nameClassName)}>
          <span className="text-base font-bold text-[#0d6b02]">Loffice</span>
          <span className="text-base font-semibold text-[#334155]">book</span>
        </span>
      )}
    </span>
  );
}
