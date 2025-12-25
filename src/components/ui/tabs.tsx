import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

const Tabs = TabsPrimitive.Root;

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground relative",
      className
    )}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

// TabsTrigger with sliding indicator animation
const TabsTriggerWithIndicator = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, children, ...props }, ref) => {
  const [isActive, setIsActive] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    const element = triggerRef.current;
    if (!element) return;

    const observer = new MutationObserver(() => {
      setIsActive(element.getAttribute("data-state") === "active");
    });

    observer.observe(element, {
      attributes: true,
      attributeFilter: ["data-state"],
    });
    setIsActive(element.getAttribute("data-state") === "active");

    return () => observer.disconnect();
  }, []);

  return (
    <TabsPrimitive.Trigger
      ref={(node) => {
        (triggerRef as any).current = node;
        if (typeof ref === "function") ref(node);
        else if (ref) ref.current = node;
      }}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors relative z-10 data-[state=active]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 focus:gradient-primary",
        className
      )}
      {...props}
    >
      {isActive && (
        <motion.span
          layoutId="tab-indicator"
          className="absolute inset-0 rounded-sm gradient-primary shadow-sm -z-10"
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 35,
          }}
        />
      )}
      {children}
    </TabsPrimitive.Trigger>
  );
});
TabsTriggerWithIndicator.displayName = "TabsTriggerWithIndicator";

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      className
    )}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTriggerWithIndicator as TabsTrigger, TabsContent };
