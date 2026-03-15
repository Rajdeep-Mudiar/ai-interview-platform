import React from "react";
import { cn } from "./cn";

export function Label({ className, ...props }) {
  return (
    <label
      className={cn("cb-label", className)}
      {...props}
    />
  );
}

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "cb-input",
        className,
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }) {
  return (
    <textarea
      className={cn(
        "cb-textarea",
        className,
      )}
      {...props}
    />
  );
}

export function HelperText({ className, ...props }) {
  return <p className={cn("cb-helper", className)} {...props} />;
}

