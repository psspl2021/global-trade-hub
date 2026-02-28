import { comparisonPagesData } from "@/data/comparisonPages";
import { useCasePagesData } from "@/data/useCasePages";
import { strategicCountriesData } from "@/data/strategicCountries";

type LinkItem = {
  keyword: string;
  url: string;
};

export function buildAutoLinks(): LinkItem[] {
  const links: LinkItem[] = [];

  comparisonPagesData.forEach(p => {
    links.push({
      keyword: `${p.gradeA} vs ${p.gradeB}`.toLowerCase(),
      url: `/compare/${p.slug}`,
    });
  });

  useCasePagesData.forEach(p => {
    links.push({
      keyword: p.title.split("–")[0].trim().toLowerCase(),
      url: `/use-case/${p.slug}`,
    });
  });

  strategicCountriesData.forEach(c => {
    links.push({
      keyword: c.name.toLowerCase(),
      url: `/source/${c.slug}`,
    });
  });

  return links;
}

/**
 * Injects up to MAX_LINKS contextual <a> tags into plain text.
 * Safe for use with dangerouslySetInnerHTML.
 */
export function injectContextualLinks(text: string, maxLinks = 3): string {
  const links = buildAutoLinks();
  let output = text;
  let count = 0;

  for (const link of links) {
    if (count >= maxLinks) break;
    // Escape regex special chars in keyword
    const escaped = link.keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`\\b(${escaped})\\b`, "i");
    if (pattern.test(output)) {
      output = output.replace(pattern, `<a href="${link.url}" class="text-primary underline hover:text-primary/80">$1</a>`);
      count++;
    }
  }

  return output;
}
