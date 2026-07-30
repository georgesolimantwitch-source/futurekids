"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type RevealVariant = "fade-up" | "fade-in" | "scale" | "slide-left" | "slide-right";

const hidden: Record<RevealVariant, string> = {
  "fade-up": "translate-y-16 opacity-0",
  "fade-in": "opacity-0",
  scale: "scale-90 opacity-0",
  "slide-left": "-translate-x-12 opacity-0",
  "slide-right": "translate-x-12 opacity-0",
};

const visible: Record<RevealVariant, string> = {
  "fade-up": "translate-y-0 opacity-100",
  "fade-in": "opacity-100",
  scale: "scale-100 opacity-100",
  "slide-left": "translate-x-0 opacity-100",
  "slide-right": "translate-x-0 opacity-100",
};

export function StoryReveal({
  children,
  className = "",
  delay = 0,
  variant = "fade-up",
  duration = 900,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  variant?: RevealVariant;
  duration?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.unobserve(el);
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:translate-x-0 motion-reduce:translate-y-0 motion-reduce:scale-100 motion-reduce:opacity-100 ${
        show ? visible[variant] : hidden[variant]
      } ${className}`}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: show ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}

export function useScrollProgress(ref: React.RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const onScroll = () => {
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), total);
      setProgress(total > 0 ? scrolled / total : 0);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [ref]);

  return progress;
}

export function ScrollIndicator() {
  return (
    <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 lg:flex">
      <span className="text-xs font-medium uppercase tracking-widest text-neutral-400">
        Scroll
      </span>
      <div className="h-10 w-6 rounded-full border-2 border-neutral-300 p-1">
        <div className="h-2 w-full animate-bounce rounded-full bg-neutral-400" />
      </div>
    </div>
  );
}
