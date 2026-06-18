import Image from "next/image";
import { LOOFFICE_LOGO_PATH, LOOFFICE_NAME } from "@/lib/branding";
import { cn } from "@/lib/utils";

type LofficeLogoProps = {
  /** 로고 높이(px) */
  height?: number;
  className?: string;
  /** @deprecated 전체 로고 이미지에 텍스트가 포함되어 있습니다 */
  size?: number;
  /** @deprecated 전체 로고 이미지에 텍스트가 포함되어 있습니다 */
  showName?: boolean;
  /** @deprecated 사용하지 않음 */
  nameClassName?: string;
};

export function LofficeLogo({
  height,
  size,
  className,
}: LofficeLogoProps) {
  const logoHeight = height ?? size ?? 32;

  return (
    <Image
      src={LOOFFICE_LOGO_PATH}
      alt={`${LOOFFICE_NAME} 로고`}
      width={Math.round(logoHeight * 3.4)}
      height={logoHeight}
      className={cn("w-auto object-contain", className)}
      style={{ height: logoHeight, width: "auto" }}
      priority
    />
  );
}
