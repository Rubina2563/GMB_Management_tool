import React, { ButtonHTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface AnimatedButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'pulse' | 'bounce' | 'scale' | 'rotate' | 'shake' | 'glow' | 'wobble';
  className?: string;
}

export const AnimatedButton = React.forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  function AnimatedButton(props, ref) {
    const {
      children,
      variant = 'scale',
      className,
      ...restProps
    } = props;
    
    // Default animation is scale
    let hoverAnimation = { scale: 1.05 };
    let tapAnimation = { scale: 0.95 };
    let transition = { type: "spring", stiffness: 400, damping: 17 };
    let additionalClasses = "";
    
    // Specific animations based on variant
    switch (variant) {
      case 'pulse':
        hoverAnimation = { 
          scale: [1, 1.05, 1, 1.05], 
          transition: { 
            duration: 1.2, 
            repeat: Infinity 
          }
        };
        tapAnimation = { scale: 0.9 };
        additionalClasses = "relative overflow-hidden";
        break;
        
      case 'bounce':
        hoverAnimation = { y: -5 };
        tapAnimation = { y: 0 };
        transition = { type: "spring", stiffness: 400, damping: 10 };
        break;
        
      case 'rotate':
        hoverAnimation = { rotate: [0, -3, 3, -3, 0] };
        tapAnimation = { rotate: 0 };
        transition = { type: "spring", stiffness: 300 };
        break;
        
      case 'shake':
        hoverAnimation = { 
          x: [0, -5, 5, -5, 5, 0], 
          transition: { 
            duration: 0.4 
          }
        };
        tapAnimation = { x: 0 };
        break;
        
      case 'glow':
        hoverAnimation = { 
          scale: 1.03, 
          boxShadow: "0 0 15px rgba(242, 140, 56, 0.7)",
          transition: { 
            boxShadow: { duration: 0.3 }
          }
        };
        tapAnimation = { 
          scale: 0.98,
          boxShadow: "0 0 5px rgba(242, 140, 56, 0.9)"
        };
        additionalClasses = "relative";
        break;
        
      case 'wobble':
        hoverAnimation = { 
          rotate: [0, -2, 2, -2, 2, 0],
          transition: { duration: 0.5 }
        };
        tapAnimation = { scale: 0.95 };
        break;
        
      case 'scale':
      default:
        // Already set as default
        break;
    }
    
    return (
      <motion.button
        ref={ref}
        className={cn("bg-[#F28C38] hover:bg-[#F28C38]/90 text-white py-2 px-4 rounded", 
                    additionalClasses,
                    className)}
        whileHover={hoverAnimation}
        whileTap={tapAnimation}
        transition={transition}
        {...restProps}
      >
        {variant === 'pulse' && (
          <motion.span
            className="absolute inset-0 bg-white opacity-30 rounded"
            initial={{ scale: 0, opacity: 0.5 }}
            animate={{ 
              scale: 1.5, 
              opacity: 0,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
          />
        )}
        {children}
      </motion.button>
    );
  }
);

AnimatedButton.displayName = "AnimatedButton";