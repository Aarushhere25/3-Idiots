import Image from "next/image";
import { getInitials } from "@/lib/utils";

type AvatarProps = {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "h-10 w-10 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-24 w-24 text-2xl"
};

export function Avatar({ src, name, size = "md" }: AvatarProps) {
  const sizeClass = sizes[size];

  if (src) {
    return (
      <div className={`${sizeClass} relative overflow-hidden rounded-full border-4 border-white bg-white shadow-glow`}>
        <Image src={src} alt={name} fill className="object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeClass} grid place-items-center rounded-full border-4 border-white bg-gradient-to-br from-peach via-blush to-lilac font-bold text-ink shadow-glow`}
    >
      {getInitials(name)}
    </div>
  );
}
