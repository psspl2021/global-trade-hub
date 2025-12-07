import { useState, useEffect, useRef, Suspense, lazy, Component, ReactNode } from 'react';

// TRUE lazy import - FAQ only loads when rendered
const FAQ = lazy(() => import('./FAQ').then(module => ({ default: module.FAQ })));

// Error boundary specifically for FAQ to catch and display errors
class FAQErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  state = { hasError: false, error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('FAQ Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <section className="py-16 bg-destructive/10">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-xl font-bold text-destructive">FAQ Failed to Load</h2>
            <pre className="text-sm mt-4 text-left max-w-xl mx-auto overflow-auto bg-background p-4 rounded border">
              {this.state.error?.toString()}
              {'\n\n'}
              {this.state.error?.stack}
            </pre>
          </div>
        </section>
      );
    }
    return this.props.children;
  }
}

const Placeholder = () => (
  <section className="py-16 bg-background">
    <div className="container mx-auto px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-foreground mb-4">
          Frequently Asked Questions
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Loading...
        </p>
      </div>
      <div className="max-w-3xl mx-auto h-64" />
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
        <FAQErrorBoundary>
          <Suspense fallback={<Placeholder />}>
            <FAQ />
          </Suspense>
        </FAQErrorBoundary>
      ) : (
        <Placeholder />
      )}
    </div>
  );
};
