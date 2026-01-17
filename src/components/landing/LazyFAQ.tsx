import { useState, useEffect, useRef } from 'react';
import { FAQ } from './FAQ';

export const LazyFAQ = () => {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px', // Load 200px before it comes into view
        threshold: 0
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} id="faq">
      {isVisible ? (
        <FAQ />
      ) : (
        // Placeholder with minimum height to prevent layout shift
        <section className="py-10 sm:py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
                Frequently Asked Questions
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-sm">
                Everything you need to know about ProcureSaathi.
              </p>
            </div>
            <div className="max-w-2xl mx-auto h-48" />
          </div>
        </section>
      )}
    </div>
  );
};
