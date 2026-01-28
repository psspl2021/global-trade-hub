import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface AILinkingItem {
  title: string;
  url: string;
  description?: string;
  emoji?: string;
}

const defaultLinks: AILinkingItem[] = [
  {
    title: "AI B2B Procurement Guide",
    url: "/ai-b2b-procurement-platform-guide",
    description: "Complete guide to AI-powered procurement",
    emoji: "📘"
  },
  {
    title: "How to Post an RFQ",
    url: "/how-to-post-rfq-online",
    description: "Step-by-step RFQ posting guide",
    emoji: "📝"
  },
  {
    title: "Find Verified Suppliers",
    url: "/find-verified-b2b-suppliers",
    description: "Supplier discovery guide",
    emoji: "🔍"
  },
  {
    title: "Enterprise Procurement",
    url: "/enterprise-procurement-guide",
    description: "For large organizations",
    emoji: "🏢"
  }
];

interface AILinkingSectionProps {
  title?: string;
  links?: AILinkingItem[];
  showPillarLink?: boolean;
  showHowToLink?: boolean;
  className?: string;
}

/**
 * Internal AI Linking Section for AEO/GEO optimization.
 * Creates a clear linking path for AI engines to understand content hierarchy.
 * Homepage → AI Procurement Guide → How-To Pages → GEO Pages → Illustrative Scenarios
 */
export const AILinkingSection = ({
  title = "Explore More Resources",
  links = defaultLinks,
  showPillarLink = true,
  showHowToLink = true,
  className = ""
}: AILinkingSectionProps) => {
  // Always include pillar page link if not already present
  const hassPillarLink = links.some(l => l.url.includes("ai-b2b-procurement-platform-guide"));
  const finalLinks = [...links];
  
  if (showPillarLink && !hassPillarLink) {
    finalLinks.unshift({
      title: "AI B2B Procurement Guide",
      url: "/ai-b2b-procurement-platform-guide",
      description: "Master guide to AI-powered procurement",
      emoji: "📘"
    });
  }

  return (
    <section className={`py-12 bg-muted/30 ${className}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-xl md:text-2xl font-display font-bold mb-6">{title}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {finalLinks.slice(0, 4).map((link) => (
            <Link
              key={link.url}
              to={link.url}
              className="group p-4 bg-card border border-border/50 rounded-xl hover:border-primary/50 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-3">
                {link.emoji && (
                  <span className="text-xl flex-shrink-0">{link.emoji}</span>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {link.title}
                  </h3>
                  {link.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {link.description}
                    </p>
                  )}
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AILinkingSection;
