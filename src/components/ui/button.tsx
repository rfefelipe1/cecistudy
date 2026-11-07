import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';
<<<<<<< HEAD
=======
import { BASE_D, motion } from '@/lib/motion';
import { useMotionProfile } from '@/components/motion/MotionProfileProvider';
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-surface-default transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ceci-brand-strong focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
  {
    variants: {
      variant: {
        default: 'bg-ceci-brand-strong text-ceci-on-brand hover:bg-ceci-brand-hover',
        destructive:
          'bg-status-danger text-status-danger-on hover:bg-status-danger-strong hover:text-status-danger-on',
        outline:
          'border border-ceci-border-default bg-surface-default hover:bg-surface-rose hover:text-ceci-primary',
        secondary:
          'bg-surface-muted text-ceci-primary hover:bg-surface-rose hover:text-ceci-primary',
        ghost: 'hover:bg-surface-rose hover:text-ceci-primary',
        link: 'text-ceci-brand-strong underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
<<<<<<< HEAD
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
=======
    const { reduced } = useMotionProfile();
    const Tag = asChild ? Slot : 'button';
    const MotionTag = motion.create(Tag as any);
    // Compressão discreta ao pressionar (Spec §14.1): feedback imediato, a
    // ação funcional não depende da conclusão da animação. Sob Reduzir
    // Movimento, sem escala — o clique continua funcionando.
    return (
      <MotionTag
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        whileTap={reduced ? undefined : { scale: 0.97 }}
        transition={{ duration: BASE_D.micro }}
        {...props}
      />
>>>>>>> 581d9d1 (feat: correcoes biblioteca - SPEC-M-030)
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
