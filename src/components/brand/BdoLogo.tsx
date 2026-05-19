import bdoLogoSrc from "@/assets/bdo-logo.png";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

export function BdoLogo({ className }: Props) {
  return (
    <img
      src={bdoLogoSrc}
      alt="BDO"
      className={cn("h-7 w-auto object-contain", className)}
    />
  );
}
