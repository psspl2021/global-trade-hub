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
        rootMargin: '200px',
        threshold: 0
      }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const Placeholder = () => (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about sourcing, supplying, and logistics on ProcureSaathi.
          </p>
        </div>
        <div className="max-w-3xl mx-auto h-64" />
      </div>
    </section>
  );

  return (
    <div ref={containerRef} id="faq">
      {isVisible ? (
        <FAQ />
      ) : (
        <Placeholder />
      )}
    </div>
  );
};
