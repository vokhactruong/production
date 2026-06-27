import React from "react";
import { cn } from "./utils";

interface AvatarProps {
  src?: string;
  alt?: string;
  initials?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-xl",
};

export function Avatar({ src, alt, initials, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full",
        "bg-gradient-to-br from-blue-400 to-indigo-600 font-semibold text-white",
        sizeClasses[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={alt ?? initials ?? "Avatar"} className="h-full w-full object-cover" />
      ) : (
        <span>{initials ?? "?"}</span>
      )}
    </div>
  );
}
