"use client";

import { useRef, useEffect } from "react";
import twemoji from "twemoji";

interface TwemojiTextProps {
  children: string;
  className?: string;
  as?: "span" | "div" | "p";
}

/**
 * Component that automatically renders emojis using twemoji
 * Ensures consistent emoji rendering across all platforms
 */
export default function TwemojiText({
  children,
  className = "",
  as: Component = "span",
}: TwemojiTextProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current) {
      // Parse the element with twemoji
      twemoji.parse(ref.current, {
        folder: "svg",
        ext: ".svg",
      });
    }
  }, [children]);

  return (
    <Component ref={ref as any} className={className}>
      {children}
    </Component>
  );
}
