import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 font-mono text-[10px] font-semibold uppercase tracking-wider transition-colors px-2 py-0.5 border select-none",
  {
    variants: {
      variant: {
        default:
          "border-foreground bg-foreground text-background",
        secondary:
          "border-border bg-secondary text-secondary-foreground",
        destructive:
          "border-rose-500/50 bg-rose-500/10 text-rose-500 dark:text-rose-400 font-bold",
        outline:
          "border-border bg-transparent text-foreground",
        success:
          "border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold",
        warning:
          "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold",
        info:
          "border-cyan-500/50 bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-bold",
        indigo:
          "border-indigo-500/50 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold",
        brutalist:
          "border-foreground bg-background text-foreground font-bold",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
