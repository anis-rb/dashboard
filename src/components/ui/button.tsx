import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const styles = cva(
  "pressable inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-sm px-4 text-sm font-medium disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-fg",
        secondary: "border border-line bg-surface text-fg",
        ghost: "bg-transparent text-fg",
        danger: "border border-line bg-surface text-danger",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof styles> & { asChild?: boolean };

export function Button({ className, variant, asChild, type = "button", ...props }: Props) {
  if (asChild) {
    return <Slot className={cn(styles({ variant }), className)} {...props} />;
  }
  return <button className={cn(styles({ variant }), className)} type={type} {...props} />;
}
