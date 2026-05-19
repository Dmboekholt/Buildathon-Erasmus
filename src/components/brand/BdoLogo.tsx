import bdoLogoSrc from "@/assets/bdo-logo.png";

type Props = {
  className?: string;
};

export function BdoLogo({ className }: Props) {
  return (
    <img
      src={bdoLogoSrc}
      alt="BDO"
      className={`h-7 w-auto object-contain ${className ?? ""}`}
    />
  );
}
