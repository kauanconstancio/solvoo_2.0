import { useRef, ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FloatingParticles, GradientParticles } from "./FloatingParticles";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionTemplate,
} from "framer-motion";

interface ParallaxHeroProps {
  children: ReactNode;
  className?: string;
  backgroundClassName?: string;
  speed?: number;
  overlay?: boolean;
  overlayOpacity?: number;
  particles?: boolean;
  particleVariant?: "dots" | "gradient";
}

export const ParallaxHero = ({
  children,
  className,
  backgroundClassName,
  speed = 0.5,
  overlay = true,
  overlayOpacity = 0.05,
  particles = true,
  particleVariant = "dots",
}: ParallaxHeroProps) => {
  const containerRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", `${speed * 50}%`]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // Mouse parallax effect
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    setMousePosition({
      x: clientX / innerWidth - 0.5,
      y: clientY / innerHeight - 0.5,
    });
  };

  const springConfig = { damping: 25, stiffness: 150 };
  const mouseX = useSpring(0, springConfig);
  const mouseY = useSpring(0, springConfig);

  useEffect(() => {
    mouseX.set(mousePosition.x);
    mouseY.set(mousePosition.y);
  }, [mousePosition, mouseX, mouseY]);

  const bgX = useTransform(mouseX, [-0.5, 0.5], ["-2%", "2%"]);
  const bgY = useTransform(mouseY, [-0.5, 0.5], ["-2%", "2%"]);

  const shape1X = useTransform(mouseX, [-0.5, 0.5], ["5%", "-5%"]);
  const shape1Y = useTransform(mouseY, [-0.5, 0.5], ["5%", "-5%"]);

  const shape2X = useTransform(mouseX, [-0.5, 0.5], ["-3%", "3%"]);
  const shape2Y = useTransform(mouseY, [-0.5, 0.5], ["-3%", "3%"]);

  return (
    <section
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={cn(
        "relative overflow-hidden min-h-[60vh] flex items-center justify-center",
        className
      )}
    >
      {/* Floating particles */}
      {particles && particleVariant === "dots" && (
        <FloatingParticles count={25} minSize={3} maxSize={8} />
      )}
      {particles && particleVariant === "gradient" && (
        <GradientParticles count={12} />
      )}

      {/* Parallax background layer */}
      <motion.div
        className={cn(
          "absolute inset-0 -top-20 -bottom-20 pointer-events-none",
          backgroundClassName
        )}
        style={{ y, opacity, x: bgX, translateY: bgY }}
      >
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-primary/5 to-transparent" />

        {/* Decorative shapes with mouse parallax */}
        <motion.div
          className="absolute top-10 left-[10%] w-64 h-64 rounded-full bg-primary/5 blur-3xl"
          style={{ x: shape1X, y: shape1Y }}
        />
        <motion.div
          className="absolute top-20 right-[15%] w-48 h-48 rounded-full bg-primary/8 blur-2xl"
          style={{ x: shape2X, y: shape2Y }}
        />
        <motion.div
          className="absolute bottom-10 left-[30%] w-32 h-32 rounded-full bg-primary/6 blur-xl"
          style={{
            x: shape1X,
            y: useTransform(mouseY, [-0.5, 0.5], ["-5%", "5%"]),
          }}
        />
      </motion.div>

      {/* Overlay */}
      {overlay && (
        <div
          className="absolute inset-0 gradient-primary pointer-events-none mix-blend-overlay"
          style={{ opacity: overlayOpacity }}
        />
      )}

      {/* Content */}
      <motion.div
        className="relative z-10 w-full"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        {children}
      </motion.div>
    </section>
  );
};
