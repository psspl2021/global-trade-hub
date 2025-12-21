import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import { Language } from "@/lib/i18n/translations";

interface LanguageSelectorProps {
  currentLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  availableLanguages?: Language[];
}

const languageLabels: Record<Language, { native: string; flag: string }> = {
  en: { native: "English", flag: "🇬🇧" },
  hi: { native: "हिन्दी", flag: "🇮🇳" },
  fr: { native: "Français", flag: "🇫🇷" },
  nl: { native: "Nederlands", flag: "🇳🇱" },
  ro: { native: "Română", flag: "🇷🇴" },
  es: { native: "Español", flag: "🇪🇸" },
  de: { native: "Deutsch", flag: "🇩🇪" },
  ar: { native: "العربية", flag: "🇦🇪" },
};

export const LanguageSelector = ({
  currentLanguage,
  onLanguageChange,
  availableLanguages = ['en', 'hi', 'fr', 'nl', 'ro', 'es', 'de', 'ar'],
}: LanguageSelectorProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span>{languageLabels[currentLanguage].flag}</span>
          <span className="hidden sm:inline">{languageLabels[currentLanguage].native}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {availableLanguages.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => onLanguageChange(lang)}
            className={currentLanguage === lang ? "bg-accent" : ""}
          >
            <span className="mr-2">{languageLabels[lang].flag}</span>
            {languageLabels[lang].native}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
