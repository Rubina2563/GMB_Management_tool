import React, { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedButton } from "./animated-button";

export interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'destructive' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * Glow button component that adds a nice glow animation on hover
 */
export function GlowButton({
  children,
  variant = 'primary',
  size = 'default',
  className,
  ...props
}: GlowButtonProps) {
  // Map variant to Tailwind classes
  const variantClasses = {
    primary: "bg-[#F28C38] text-white hover:bg-[#F28C38]/90",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    outline: "bg-transparent border border-[#F28C38] text-[#F28C38] hover:bg-[#F28C38]/10",
    destructive: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-[#F28C38] hover:bg-[#F28C38]/10"
  };
  
  // Map size to Tailwind classes
  const sizeClasses = {
    default: "py-2 px-4",
    sm: "py-1 px-3 text-sm",
    lg: "py-3 px-6 text-lg",
    icon: "p-2"
  };
  
  // Base button classes + variant-specific + size-specific + custom classes
  const buttonClasses = cn(
    "font-medium rounded transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-[#F28C38]",
    variantClasses[variant],
    sizeClasses[size],
    className
  );
  
  // Use the AnimatedButton component with glow animation
  return (
    <AnimatedButton
      variant="glow"
      className={buttonClasses}
      {...props}
    >
      {children}
    </AnimatedButton>
  );
}