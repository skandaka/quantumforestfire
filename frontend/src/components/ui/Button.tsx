import React, { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// --- CVA (CLASS VARIANCE AUTHORITY) DEFINITION ---
// This is the core of our variant system. It defines all the possible styles
// (variants) that our button can have. This approach keeps styling logic
// centralized and easy to manage.

const buttonVariants = cva(
    // Base classes applied to all variants
    [
        'inline-flex',
        'items-center',
        'justify-center',
        'whitespace-nowrap',
        'rounded-lg',
        'text-sm',
        'font-semibold',
        'ring-offset-black',
        'transition-all',
        'duration-300',
        'focus-visible:outline-none',
        'focus-visible:ring-2',
        'focus-visible:ring-red-500/80',
        'focus-visible:ring-offset-2',
        'disabled:pointer-events-none',
        'disabled:opacity-60',
    ],
    {
        variants: {
            // --- VISUAL STYLE VARIANTS ---
            variant: {
                default: [
                    'bg-red-600',
                    'text-white',
                    'hover:bg-red-700',
                    'active:bg-red-800',
                    // Custom "quantum-glow" effect for the default button
                    'relative',
                    'overflow-hidden',
                    'transform-gpu',
                    'will-change-transform',
                    'after:content-[""]',
                    'after:absolute',
                    'after:inset-0',
                    'after:bg-white/10',
                    'after:opacity-0',
                    'after:transition-opacity',
                    'after:duration-500',
                    'hover:after:opacity-100',
                    'focus:after:opacity-100',
                ],
                destructive: [
                    'bg-red-900/80',
                    'text-red-200',
                    'border',
                    'border-red-500/50',
                    'hover:bg-red-800/90',
                    'hover:border-red-500/80',
                ],
                outline: [
                    'border',
                    'border-gray-700',
                    'bg-transparent',
                    'text-gray-200',
                    'hover:bg-gray-800',
                    'hover:text-white',
                    'hover:border-gray-600',
                ],
                subtle: [
                    'bg-gray-800/70',
                    'text-gray-300',
                    'hover:bg-gray-700/90',
                    'hover:text-white',
                ],
                ghost: ['hover:bg-gray-800/80', 'hover:text-gray-100', 'text-gray-300'],
                link: ['text-red-400', 'underline-offset-4', 'hover:underline'],
            },
            // --- SIZE VARIANTS ---
            size: {
                default: 'h-11 px-6 py-2',
                sm: 'h-9 rounded-md px-4',
                lg: 'h-12 rounded-lg px-8 text-base',
                icon: 'h-10 w-10',
            },
        },
        // Default variants applied if none are specified.
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    }
)

// --- COMPONENT PROPS INTERFACE ---
// We extend the standard HTMLButtonElement attributes and our CVA variants.

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    /**
     * If true, the button will be rendered as a child component,
     * merging the button styles into it. Useful for wrapping components
     * like Next.js's <Link>.
     */
    asChild?: boolean

    /**
     * If true, a loading spinner will be displayed, and the button will be disabled.
     */
    loading?: boolean

    /**
     * Text to be displayed next to the spinner when loading is true.
     * If not provided, the original button children will be used.
     */
    loadingText?: string
}

// --- FORWARDED REF COMPONENT IMPLEMENTATION ---

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            className,
            variant,
            size,
            asChild = false,
            loading = false,
            loadingText,
            children,
            ...props
        },
        ref
    ) => {
        // Determine the component to render (either a <button> or the child via <Slot>).
        const Comp = asChild ? Slot : 'button'

        // --- RENDER LOGIC ---

        const renderLoadingState = () => (
            <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {loadingText || children || 'Loading...'}
            </>
        )

        const renderDefaultState = () => <>{children}</>

        return (
            <Comp
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                // Disable the button when it's in a loading state.
                disabled={loading || props.disabled}
                {...props}
            >
                {loading ? renderLoadingState() : renderDefaultState()}
            </Comp>
        )
    }
)
Button.displayName = 'Button'

export { Button, buttonVariants }