import React from "react";
import { cn } from "./cn";

const VARIANTS = {
  primary: "cb-btn--primary",
  secondary: "cb-btn--secondary",
  danger: "cb-btn--danger",
  ghost: "cb-btn--ghost",
};

const SIZES = {
  sm: "cb-btn--sm",
  md: "cb-btn--md",
  lg: "cb-btn--lg",
};

export default function Button({
  as: Comp = "button",
  variant = "primary",
  size = "md",
  className,
  ...props
}) {
  return (
    <Comp
      className={cn(
        "cb-btn",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
}

