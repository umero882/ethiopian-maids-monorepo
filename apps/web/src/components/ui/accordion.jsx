import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Simple accordion implementation without radix dependency
const AccordionContext = React.createContext({
  openItems: [],
  toggleItem: () => {},
  type: 'multiple'
})

const Accordion = React.forwardRef(({
  children,
  type = 'multiple',
  defaultValue = [],
  className,
  ...props
}, ref) => {
  const [openItems, setOpenItems] = React.useState(
    Array.isArray(defaultValue) ? defaultValue : [defaultValue]
  )

  const toggleItem = React.useCallback((value) => {
    setOpenItems((prev) => {
      if (type === 'single') {
        return prev.includes(value) ? [] : [value]
      }
      return prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value]
    })
  }, [type])

  return (
    <AccordionContext.Provider value={{ openItems, toggleItem, type }}>
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef(({ className, value, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      data-value={value}
      className={cn("border rounded-lg", className)}
      {...props}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { itemValue: value })
        }
        return child
      })}
    </div>
  )
})
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef(({
  className,
  children,
  itemValue,
  ...props
}, ref) => {
  const { openItems, toggleItem } = React.useContext(AccordionContext)
  const isOpen = openItems.includes(itemValue)

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => toggleItem(itemValue)}
      className={cn(
        "flex flex-1 w-full items-center justify-between py-4 px-4 font-medium transition-all hover:bg-muted/50 rounded-t-lg",
        className
      )}
      aria-expanded={isOpen}
      {...props}
    >
      {children}
      <ChevronDown
        className={cn(
          "h-4 w-4 shrink-0 transition-transform duration-200",
          isOpen && "rotate-180"
        )}
      />
    </button>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef(({
  className,
  children,
  itemValue,
  ...props
}, ref) => {
  const { openItems } = React.useContext(AccordionContext)
  const isOpen = openItems.includes(itemValue)

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden text-sm",
        className
      )}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </div>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
