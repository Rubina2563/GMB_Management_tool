import React, { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedButton } from "./animated-button";
import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "font-medium rounded transition-colors focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-[#F28C38]",
  {
    variants: {
      variant: {
        default: "bg-[#F28C38] text-white",
        outline: "bg-transparent border border-[#F28C38] text-[#F28C38]",
        destructive: "bg-red-600 text-white hover:bg-red-700",
        secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
        ghost: "bg-transparent text-[#F28C38] hover:bg-[#F28C38]/10",
        link: "bg-transparent text-[#F28C38] underline-offset-4 hover:underline"
      },
      size: {
        default: "py-2 px-4",
        sm: "py-1 px-3 text-sm",
        lg: "py-3 px-6 text-lg",
        icon: "p-2"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, 
  VariantProps<typeof buttonVariants> {
  children: ReactNode;
  variant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  asLink?: boolean;
  disabled?: boolean;
}

/**
 * Enhanced button component with glow animation effect
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    variant = 'default',
    size = 'default',
    className,
    asLink = false,
    disabled = false,
    ...props
  }, ref) => {
    
    // Use the cva button variants utility for class generation
    const buttonClasses = cn(
      buttonVariants({ variant, size }),
      disabled && "opacity-50 cursor-not-allowed",
      className
    );
    
    // Use the AnimatedButton component with glow animation
    return (
      <AnimatedButton
        variant="glow"
        className={buttonClasses}
        disabled={disabled}
        ref={ref}
        {...props}
      >
        {children}
      </AnimatedButton>
    );
  }
);

Button.displayName = "Button";