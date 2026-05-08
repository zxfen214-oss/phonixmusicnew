import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-4xl",
  } as const;

  const dotSize = {
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  } as const;

  return (
    <div className={cn("flex items-center gap-2 font-bold tracking-tight", sizeClasses[size], className)}>
      <span className="relative inline-flex items-center">
        <span className="text-foreground">Phonix</span>
        <span className="text-gradient-animated">Music</span>
      </span>
      <span className={cn("rounded-full bg-gradient-brand animate-pulse-glow", dotSize[size])} aria-hidden />
    </div>
  );
}
