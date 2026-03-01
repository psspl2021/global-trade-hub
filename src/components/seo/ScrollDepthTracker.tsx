import { useEffect, useRef } from "react";
import { trackEvent } from "@/lib/analytics";

export default function ScrollDepthTracker() {
  const fired = useRef<Set<number>>(new Set());

  useEffect(() => {
    const handleScroll = () => {
      const scrollPercent =
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;

      [25, 50, 75, 90].forEach(threshold => {
        if (scrollPercent >= threshold && !fired.current.has(threshold)) {
          fired.current.add(threshold);
          trackEvent(`scroll_${threshold}_percent`, {
            page_path: window.location.pathname,
          });
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return null;
}
