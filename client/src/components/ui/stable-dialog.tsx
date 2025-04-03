// client/src/components/ui/stable-dialog.tsx
import * as React from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils"; // Assuming you have a utility for classNames

interface StableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function StableDialog({ open, onOpenChange, children }: StableDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children}
    </Dialog>
  );
}

interface StableDialogContentProps
  extends React.ComponentPropsWithoutRef<typeof DialogContent> {
  className?: string;
}

export const StableDialogContent = React.forwardRef<
  React.ElementRef<typeof DialogContent>,
  StableDialogContentProps
>(({ className, children, ...props }, ref) => {
  const handleInteractOutside = (e: Event) => {
    const target = e.target as HTMLElement;
    // Prevent closing if the interaction is with a form element or inside the dialog content
    const isFormElement =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.tagName === "SELECT" ||
      target.isContentEditable ||
      target.closest('input, textarea, select, [contenteditable="true"]');

    if (isFormElement) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <DialogContent
      ref={ref}
      onInteractOutside={handleInteractOutside}
      className={cn(
        "sm:max-w-[550px] bg-white p-6 rounded-lg shadow-lg",
        className
      )}
      {...props}
    >
      {children}
    </DialogContent>
  );
});
StableDialogContent.displayName = "StableDialogContent";