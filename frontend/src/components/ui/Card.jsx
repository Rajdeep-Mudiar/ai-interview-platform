import React from "react";
import { cn } from "./cn";

export function Card({ className, ...props }) {
  return (
    <div
      className={cn(
        "cb-card",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("cb-card__header", className)} {...props} />;
}

export function CardBody({ className, ...props }) {
  return <div className={cn("cb-card__body", className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
  return <div className={cn("cb-card__footer", className)} {...props} />;
}

