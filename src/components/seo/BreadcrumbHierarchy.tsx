import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbHierarchyProps {
  industrySlug: string;
  industryName: string;
  productName: string;
}

export default function BreadcrumbHierarchy({
  industrySlug,
  industryName,
  productName,
}: BreadcrumbHierarchyProps) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center flex-wrap gap-1.5 text-sm text-muted-foreground">
      <Link to="/demand" className="hover:text-primary transition-colors">
        All Procurement Categories
      </Link>
      <ChevronRight className="h-3 w-3" />
      <Link to={`/industry/${industrySlug}`} className="hover:text-primary transition-colors">
        {industryName}
      </Link>
      <ChevronRight className="h-3 w-3" />
      <span className="text-foreground font-medium">{productName}</span>
    </nav>
  );
}
