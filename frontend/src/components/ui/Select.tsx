import React, { forwardRef } from 'react'
import * as SelectPrimitive from '@radix-ui/react-select'
import { Check, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// --- TYPE DEFINITIONS ---
// Defines the structure for options, allowing for simple strings or complex objects.

export interface SelectOption {
    value: string
    label: string
    icon?: React.ReactNode
    description?: string
}

export interface SelectOptionGroup {
    label: string
    options: SelectOption[]
}

type SelectProps = React.ComponentPropsWithoutRef<typeof SelectPrimitive.Root> & {
    options: (SelectOption | SelectOptionGroup)[]
    placeholder?: string
    className?: string
    dropdownClassName?: string
}

// --- FORWARDED REF COMPONENT ---
// We use forwardRef to allow parent components to pass a ref to the underlying Radix trigger.

const Select = forwardRef<
    React.ElementRef<typeof SelectPrimitive.Trigger>,
    SelectProps
>(
    (
        {
            options,
            placeholder = 'Select an option...',
            className,
            dropdownClassName,
            ...props
        },
        ref
    ) => {
        // --- RENDER HELPER FUNCTIONS ---

        const renderOption = (option: SelectOption) => (
            <SelectPrimitive.Item
                key={option.value}
                value={option.value}
                className={cn(
                    'relative flex w-full cursor-pointer select-none items-center rounded-md py-2 pl-8 pr-2 text-sm outline-none',
                    'transition-colors duration-150',
                    'text-gray-200',
                    'focus:bg-red-900/50 focus:text-red-100',
                    'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
                    'data-[state=checked]:font-semibold'
                )}
            >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <SelectPrimitive.ItemIndicator>
            <Check className="h-4 w-4 text-red-400" />
          </SelectPrimitive.ItemIndicator>
        </span>

                <div className="flex items-center gap-3">
                    {option.icon && (
                        <div className="flex-shrink-0 w-5 h-5 flex items-center justify-center">
                            {option.icon}
                        </div>
                    )}
                    <div className="flex flex-col">
                        <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                        {option.description && (
                            <p className="text-xs text-gray-400">{option.description}</p>
                        )}
                    </div>
                </div>
            </SelectPrimitive.Item>
        )

        const renderGroup = (group: SelectOptionGroup) => (
            <SelectPrimitive.Group key={group.label}>
                <SelectPrimitive.Label className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    {group.label}
                </SelectPrimitive.Label>
                {group.options.map(renderOption)}
            </SelectPrimitive.Group>
        )

        // --- MAIN RENDER ---
        return (
            <SelectPrimitive.Root {...props}>
                {/* The trigger element that the user clicks to open the dropdown */}
                <SelectPrimitive.Trigger
                    ref={ref}
                    className={cn(
                        'flex h-11 w-full items-center justify-between rounded-md border border-gray-700 bg-gray-900/80 px-4 py-2 text-sm',
                        'ring-offset-black placeholder:text-gray-400',
                        'focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:ring-offset-1',
                        'disabled:cursor-not-allowed disabled:opacity-50',
                        'transition-all duration-200',
                        'hover:border-gray-600',
                        className
                    )}
                >
                    <SelectPrimitive.Value placeholder={placeholder} />
                    <SelectPrimitive.Icon asChild>
                        <ChevronDown className="h-4 w-4 opacity-70" />
                    </SelectPrimitive.Icon>
                </SelectPrimitive.Trigger>

                {/* The portal ensures the dropdown renders on top of everything else */}
                <SelectPrimitive.Portal>
                    <SelectPrimitive.Content
                        position="popper"
                        sideOffset={5}
                        className={cn(
                            'relative z-50 min-w-[8rem] overflow-hidden rounded-lg border border-gray-700 bg-gray-900 text-gray-100 shadow-2xl shadow-black/50',
                            'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
                            'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
                            'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
                            dropdownClassName
                        )}
                        // Use popper positioning to prevent the dropdown from going off-screen
                        style={{ minWidth: 'var(--radix-select-trigger-width)' }}
                    >
                        {/* Animated viewport using Framer Motion */}
                        <AnimatePresence>
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.2, ease: 'easeInOut' }}
                            >
                                <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
                                    <ChevronUp className="h-4 w-4" />
                                </SelectPrimitive.ScrollUpButton>

                                <SelectPrimitive.Viewport className="p-2">
                                    {options.map((opt) =>
                                        'options' in opt ? renderGroup(opt) : renderOption(opt)
                                    )}
                                </SelectPrimitive.Viewport>

                                <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
                                    <ChevronDown className="h-4 w-4" />
                                </SelectPrimitive.ScrollDownButton>
                            </motion.div>
                        </AnimatePresence>
                    </SelectPrimitive.Content>
                </SelectPrimitive.Portal>
            </SelectPrimitive.Root>
        )
    }
)
Select.displayName = 'Select'

export { Select }