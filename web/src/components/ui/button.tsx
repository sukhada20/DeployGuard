import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap text-xs font-mono font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 border border-primary active:translate-y-px",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 border border-destructive",
        outline:
          "border border-border bg-background hover:bg-muted hover:text-foreground active:translate-y-px",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border",
        ghost:
          "hover:bg-muted hover:text-foreground",
        link:
          "text-foreground underline-offset-4 hover:underline",
        brutalist:
          "border border-foreground bg-background text-foreground hover:bg-foreground hover:text-background active:translate-y-px font-bold",
        brutalistPrimary:
          "border border-foreground bg-foreground text-background hover:bg-background hover:text-foreground active:translate-y-px font-bold",
      },
      size: {
        default: "h-8 px-3 py-1.5",
        sm: "h-7 px-2.5 text-[11px]",
        lg: "h-10 px-4 text-sm",
        icon: "h-8 w-8",
        iconSm: "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
