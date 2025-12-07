import { useState, useEffect, useRef } from 'react';
import { Skeleton } from "@/components/ui/skeleton";
import { FAQ } from './FAQ';

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
      
      <div className="max-w-3xl mx-auto space-y-8">
        {[1, 2, 3].map((category) => (
          <div key={category}>
            <Skeleton className="h-7 w-32 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3].map((item) => (
                <Skeleton 
                  key={item} 
                  className="h-12 w-full rounded-md" 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  </section>
);

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
      { rootMargin: '200px', threshold: 0 }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={containerRef} id="faq">
      {isVisible ? (
        <div className="animate-fade-in">
          <FAQ />
        </div>
      ) : (
        <Placeholder />
      )}
    </div>
  );
};
