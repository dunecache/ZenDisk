import * as React from "react";
import { Button, type ButtonProps } from "./Button";
import { Tooltip, TooltipContent, TooltipTrigger } from "./Tooltip";

export interface IconButtonProps extends Omit<ButtonProps, "size"> {
  /** Required accessible name for the icon-only control. */
  label: string;
}

/** Compact contextual action with an accessible name and Radix tooltip. */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, title, className, children, ...props }, ref) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          ref={ref}
          size="icon"
          aria-label={label}
          className={className}
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{title ?? label}</TooltipContent>
    </Tooltip>
  ),
);
IconButton.displayName = "IconButton";
