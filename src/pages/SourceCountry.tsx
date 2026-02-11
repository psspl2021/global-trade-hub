import { useParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Globe, Package, Ship, Shield, Truck } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSEO } from "@/hooks/useSEO";
import { useRegionalSEO } from "@/hooks/useRegionalSEO";
import { LanguageSelector } from "@/components/landing/LanguageSelector";
import { translations, getDefaultLanguage, isRTL, Language } from "@/lib/i18n/translations";
import { getSourceCountrySEOContent, getFallbackSourceSEOContent } from '@/data/sourceCountrySEOContent';

const countryData: Record<string, {
  name: string;
  flag: string;
  headline: string;
  description: string;
  topCategories: string[];
  tradeStats: { label: string; value: string }[];
  certifications: string[];
}> = {
  usa: {
    name: "United States",
    flag: "🇺🇸",
    headline: "Source Quality Products from India to USA",
    description: "Connect with FDA-compliant, verified Indian suppliers for seamless import to the United States. Competitive pricing, quality assurance, and integrated logistics.",
    topCategories: ["Pharmaceuticals", "Textiles & Garments", "Chemicals", "Machinery", "Gems & Jewelry", "Agricultural Products"],
    tradeStats: [
      { label: "India-USA Trade Volume", value: "$120B+" },
      { label: "Active Suppliers", value: "2,500+" },
      { label: "Avg. Savings", value: "25-40%" }
    ],
    certifications: ["FDA", "ISO 9001", "GMP", "CE Mark"]
  },
  uae: {
    name: "United Arab Emirates",
    flag: "🇦🇪",
    headline: "India to UAE Trade Made Simple",
    description: "Access HALAL-certified suppliers, competitive pricing, and direct shipping to Jebel Ali. Perfect for re-export and GCC distribution.",
    topCategories: ["Food Products", "Textiles", "Machinery", "Chemicals", "Steel", "Spices"],
    tradeStats: [
      { label: "India-UAE Trade Volume", value: "$85B+" },
      { label: "Active Suppliers", value: "3,200+" },
      { label: "Avg. Delivery Time", value: "5-7 days" }
    ],
    certifications: ["HALAL", "SASO", "ISO 22000", "FSSAI"]
  },
  dubai: {
    name: "Dubai",
    flag: "🇦🇪",
    headline: "Source from India to Dubai",
    description: "Connect with verified Indian suppliers for seamless import to Dubai. Direct shipping to Jebel Ali Free Zone with competitive pricing and HALAL-certified products.",
    topCategories: ["Food Products", "Textiles", "Gold & Jewelry", "Machinery", "Chemicals", "Spices"],
    tradeStats: [
      { label: "India-Dubai Trade", value: "$50B+" },
      { label: "Active Suppliers", value: "2,800+" },
      { label: "Avg. Delivery", value: "4-6 days" }
    ],
    certifications: ["HALAL", "ESMA", "ISO 22000", "Dubai Municipality"]
  },
  uk: {
    name: "United Kingdom",
    flag: "🇬🇧",
    headline: "Indian Suppliers for UK Importers",
    description: "UKCA-compliant suppliers ready to serve the British market. Post-Brexit customs expertise and competitive sterling pricing.",
    topCategories: ["Textiles", "Pharmaceuticals", "IT Services", "Gems & Jewelry", "Leather Goods", "Food Products"],
    tradeStats: [
      { label: "India-UK Trade Volume", value: "$35B+" },
      { label: "Active Suppliers", value: "1,800+" },
      { label: "FTA Progress", value: "In Negotiation" }
    ],
    certifications: ["UKCA", "CE Mark", "ISO", "BRC"]
  },
  africa: {
    name: "Africa",
    flag: "🌍",
    headline: "Export from India to Africa",
    description: "Reliable suppliers for African markets with experience in containerized shipping to major ports including Lagos, Mombasa, Durban, and Casablanca.",
    topCategories: ["Pharmaceuticals", "Agricultural Machinery", "Textiles", "Vehicles", "Rice & Grains", "Consumer Electronics"],
    tradeStats: [
      { label: "India-Africa Trade", value: "$98B+" },
      { label: "Countries Served", value: "54" },
      { label: "Active Trade Routes", value: "120+" }
    ],
    certifications: ["WHO-GMP", "ISO", "SONCAP", "KEBS"]
  },
  germany: {
    name: "Germany",
    flag: "🇩🇪",
    headline: "German Quality, Indian Efficiency",
    description: "CE-marked products from verified Indian manufacturers. Engineering excellence meets competitive pricing for the German market.",
    topCategories: ["Machinery", "Chemicals", "Auto Components", "Pharmaceuticals", "Textiles", "IT Services"],
    tradeStats: [
      { label: "India-Germany Trade", value: "$28B+" },
      { label: "Active Suppliers", value: "1,200+" },
      { label: "Quality Compliance", value: "99.2%" }
    ],
    certifications: ["CE Mark", "TÜV", "ISO", "REACH"]
  },
  australia: {
    name: "Australia",
    flag: "🇦🇺",
    headline: "Source from India to Australia",
    description: "Verified suppliers with experience in Australian compliance requirements. Direct shipping to Sydney, Melbourne, and other major ports.",
    topCategories: ["Textiles", "Gems & Jewelry", "Pharmaceuticals", "Machinery", "Spices", "Handicrafts"],
    tradeStats: [
      { label: "India-Australia Trade", value: "$25B+" },
      { label: "Active Suppliers", value: "950+" },
      { label: "ECTA Benefits", value: "Active" }
    ],
    certifications: ["TGA", "ACCC Approved", "ISO", "Organic Australia"]
  },
  china: {
    name: "China",
    flag: "🇨🇳",
    headline: "India-China B2B Trade Partnership",
    description: "Connect with verified Indian suppliers for seamless bilateral trade with China. Quality products, competitive pricing, and established trade routes to Shanghai, Shenzhen, and Guangzhou.",
    topCategories: ["Pharmaceuticals", "Iron Ore", "Cotton", "Organic Chemicals", "Gems & Jewelry", "Seafood"],
    tradeStats: [
      { label: "India-China Trade", value: "$136B+" },
      { label: "Active Suppliers", value: "1,500+" },
      { label: "Avg. Delivery", value: "10-15 days" }
    ],
    certifications: ["CCC", "CFDA", "ISO", "AQSIQ"]
  },
  "antigua-and-barbuda": {
    name: "Antigua and Barbuda",
    flag: "🇦🇬",
    headline: "Source from India to Antigua and Barbuda",
    description: "Connect with verified Indian suppliers for Caribbean trade. Competitive pricing and reliable shipping to St. John's port.",
    topCategories: ["Textiles", "Machinery", "Pharmaceuticals", "Food Products", "Building Materials", "Consumer Goods"],
    tradeStats: [
      { label: "Trade Potential", value: "$50M+" },
      { label: "Active Suppliers", value: "150+" },
      { label: "Avg. Delivery", value: "25-30 days" }
    ],
    certifications: ["ISO", "FDA", "CARICOM Standards"]
  },
  argentina: {
    name: "Argentina",
    flag: "🇦🇷",
    headline: "India to Argentina Trade Solutions",
    description: "Access verified Indian suppliers for the Argentine market. Quality products with competitive pricing and established shipping to Buenos Aires.",
    topCategories: ["Pharmaceuticals", "Chemicals", "Machinery", "Textiles", "Auto Components", "IT Services"],
    tradeStats: [
      { label: "India-Argentina Trade", value: "$3.5B+" },
      { label: "Active Suppliers", value: "400+" },
      { label: "Avg. Delivery", value: "30-35 days" }
    ],
    certifications: ["ANMAT", "ISO", "IRAM", "MERCOSUR"]
  },
  armenia: {
    name: "Armenia",
    flag: "🇦🇲",
    headline: "Source from India to Armenia",
    description: "Connect with verified Indian suppliers for the Armenian market. Competitive pricing and reliable logistics through established trade routes.",
    topCategories: ["Pharmaceuticals", "Textiles", "Machinery", "Tea & Spices", "Chemicals", "Electronics"],
    tradeStats: [
      { label: "Trade Potential", value: "$200M+" },
      { label: "Active Suppliers", value: "120+" },
      { label: "Avg. Delivery", value: "15-20 days" }
    ],
    certifications: ["ISO", "EAC", "GOST"]
  },
  austria: {
    name: "Austria",
    flag: "🇦🇹",
    headline: "Indian Suppliers for Austrian Market",
    description: "CE-compliant products from verified Indian manufacturers. Quality assurance meets competitive pricing for the Austrian market.",
    topCategories: ["Machinery", "Textiles", "Chemicals", "Pharmaceuticals", "IT Services", "Gems & Jewelry"],
    tradeStats: [
      { label: "India-Austria Trade", value: "$2.8B+" },
      { label: "Active Suppliers", value: "350+" },
      { label: "Quality Compliance", value: "98%" }
    ],
    certifications: ["CE Mark", "ISO", "REACH", "TÜV Austria"]
  },
  azerbaijan: {
    name: "Azerbaijan",
    flag: "🇦🇿",
    headline: "India to Azerbaijan Trade Partnership",
    description: "Connect with verified Indian suppliers for the Azerbaijani market. Established trade routes through INSTC corridor.",
    topCategories: ["Pharmaceuticals", "Tea & Spices", "Textiles", "Machinery", "Rice", "Chemicals"],
    tradeStats: [
      { label: "India-Azerbaijan Trade", value: "$1B+" },
      { label: "Active Suppliers", value: "180+" },
      { label: "INSTC Route", value: "Active" }
    ],
    certifications: ["ISO", "AZSTAND", "GOST"]
  },
  bhutan: {
    name: "Bhutan",
    flag: "🇧🇹",
    headline: "India-Bhutan Trade Excellence",
    description: "Seamless cross-border trade with Bhutan. Leveraging strong bilateral ties for efficient sourcing and logistics.",
    topCategories: ["Petroleum Products", "Machinery", "Vehicles", "Rice & Grains", "Textiles", "Pharmaceuticals"],
    tradeStats: [
      { label: "India-Bhutan Trade", value: "$1.2B+" },
      { label: "Active Suppliers", value: "500+" },
      { label: "Border Trade", value: "Seamless" }
    ],
    certifications: ["ISO", "BIS", "BAFRA Approved"]
  },
  canada: {
    name: "Canada",
    flag: "🇨🇦",
    headline: "Source from India to Canada",
    description: "Connect with verified Indian suppliers for the Canadian market. Quality products meeting Health Canada standards with competitive pricing.",
    topCategories: ["Pharmaceuticals", "Textiles", "Gems & Jewelry", "Machinery", "IT Services", "Food Products"],
    tradeStats: [
      { label: "India-Canada Trade", value: "$12B+" },
      { label: "Active Suppliers", value: "1,100+" },
      { label: "CEPA Progress", value: "In Negotiation" }
    ],
    certifications: ["Health Canada", "CSA", "ISO", "CFIA"]
  },
  denmark: {
    name: "Denmark",
    flag: "🇩🇰",
    headline: "Indian Suppliers for Danish Market",
    description: "Sustainable and quality products from verified Indian suppliers. Green solutions meeting Danish environmental standards.",
    topCategories: ["Textiles", "Pharmaceuticals", "IT Services", "Organic Products", "Machinery", "Handicrafts"],
    tradeStats: [
      { label: "India-Denmark Trade", value: "$3B+" },
      { label: "Active Suppliers", value: "280+" },
      { label: "Green Certified", value: "45%" }
    ],
    certifications: ["CE Mark", "ISO", "Nordic Swan", "REACH"]
  },
  dominica: {
    name: "Dominica",
    flag: "🇩🇲",
    headline: "Source from India to Dominica",
    description: "Connect with verified Indian suppliers for Caribbean island trade. Reliable shipping and competitive pricing.",
    topCategories: ["Textiles", "Pharmaceuticals", "Food Products", "Machinery", "Building Materials", "Consumer Goods"],
    tradeStats: [
      { label: "Trade Potential", value: "$30M+" },
      { label: "Active Suppliers", value: "100+" },
      { label: "Avg. Delivery", value: "25-30 days" }
    ],
    certifications: ["ISO", "FDA", "CARICOM Standards"]
  },
  italy: {
    name: "Italy",
    flag: "🇮🇹",
    headline: "India to Italy Trade Solutions",
    description: "Quality products from verified Indian suppliers for the Italian market. Fashion, textiles, and manufacturing excellence.",
    topCategories: ["Textiles & Garments", "Leather Goods", "Gems & Jewelry", "Machinery", "Chemicals", "Pharmaceuticals"],
    tradeStats: [
      { label: "India-Italy Trade", value: "$15B+" },
      { label: "Active Suppliers", value: "900+" },
      { label: "Fashion Exports", value: "Growing" }
    ],
    certifications: ["CE Mark", "ISO", "Made in Italy Partner", "REACH"]
  },
  japan: {
    name: "Japan",
    flag: "🇯🇵",
    headline: "India-Japan Business Partnership",
    description: "Premium quality products meeting Japanese standards. Leveraging CEPA benefits for competitive trade.",
    topCategories: ["Pharmaceuticals", "IT Services", "Seafood", "Textiles", "Gems & Jewelry", "Organic Products"],
    tradeStats: [
      { label: "India-Japan Trade", value: "$22B+" },
      { label: "Active Suppliers", value: "750+" },
      { label: "CEPA Benefits", value: "Active" }
    ],
    certifications: ["JIS", "PMDA", "ISO", "JAS"]
  },
  kuwait: {
    name: "Kuwait",
    flag: "🇰🇼",
    headline: "Source from India to Kuwait",
    description: "HALAL-certified products and quality goods for the Kuwaiti market. Strong bilateral trade relations.",
    topCategories: ["Food Products", "Textiles", "Jewelry", "Machinery", "Pharmaceuticals", "Building Materials"],
    tradeStats: [
      { label: "India-Kuwait Trade", value: "$12B+" },
      { label: "Active Suppliers", value: "650+" },
      { label: "Avg. Delivery", value: "7-10 days" }
    ],
    certifications: ["HALAL", "KUCAS", "ISO", "GSO"]
  },
  malawi: {
    name: "Malawi",
    flag: "🇲🇼",
    headline: "India to Malawi Trade Partnership",
    description: "Reliable Indian suppliers for the Malawian market. Pharmaceuticals, machinery, and consumer goods.",
    topCategories: ["Pharmaceuticals", "Machinery", "Vehicles", "Textiles", "Rice & Grains", "Consumer Electronics"],
    tradeStats: [
      { label: "India-Malawi Trade", value: "$200M+" },
      { label: "Active Suppliers", value: "120+" },
      { label: "Avg. Delivery", value: "20-25 days" }
    ],
    certifications: ["WHO-GMP", "ISO", "MBS Standards"]
  },
  malaysia: {
    name: "Malaysia",
    flag: "🇲🇾",
    headline: "India-Malaysia Trade Excellence",
    description: "HALAL-certified and quality products for the Malaysian market. Leveraging CECA benefits for competitive trade.",
    topCategories: ["Petroleum Products", "Machinery", "Pharmaceuticals", "Textiles", "Gems & Jewelry", "Food Products"],
    tradeStats: [
      { label: "India-Malaysia Trade", value: "$20B+" },
      { label: "Active Suppliers", value: "1,200+" },
      { label: "CECA Benefits", value: "Active" }
    ],
    certifications: ["HALAL JAKIM", "SIRIM", "ISO", "MeSTI"]
  },
  maldives: {
    name: "Maldives",
    flag: "🇲🇻",
    headline: "India-Maldives Neighborhood Trade",
    description: "Swift and reliable trade with Maldives. Strong diplomatic ties ensuring seamless commerce.",
    topCategories: ["Food Products", "Construction Materials", "Textiles", "Pharmaceuticals", "Vegetables", "Machinery"],
    tradeStats: [
      { label: "India-Maldives Trade", value: "$500M+" },
      { label: "Active Suppliers", value: "300+" },
      { label: "Avg. Delivery", value: "3-5 days" }
    ],
    certifications: ["ISO", "MFDA", "HALAL"]
  },
  malta: {
    name: "Malta",
    flag: "🇲🇹",
    headline: "Source from India to Malta",
    description: "Quality products from verified Indian suppliers for the Maltese market. EU-compliant goods with competitive pricing.",
    topCategories: ["Textiles", "Pharmaceuticals", "Machinery", "Food Products", "IT Services", "Consumer Goods"],
    tradeStats: [
      { label: "India-Malta Trade", value: "$150M+" },
      { label: "Active Suppliers", value: "80+" },
      { label: "EU Gateway", value: "Strategic" }
    ],
    certifications: ["CE Mark", "ISO", "MCCAA", "REACH"]
  },
  mexico: {
    name: "Mexico",
    flag: "🇲🇽",
    headline: "India to Mexico Trade Solutions",
    description: "Connect with verified Indian suppliers for the Mexican market. Growing trade relations with competitive pricing.",
    topCategories: ["Pharmaceuticals", "Chemicals", "Machinery", "Auto Components", "Textiles", "IT Services"],
    tradeStats: [
      { label: "India-Mexico Trade", value: "$10B+" },
      { label: "Active Suppliers", value: "550+" },
      { label: "Growth Rate", value: "15% YoY" }
    ],
    certifications: ["COFEPRIS", "NOM", "ISO", "USMCA Compatible"]
  },
  nepal: {
    name: "Nepal",
    flag: "🇳🇵",
    headline: "India-Nepal Seamless Trade",
    description: "Leveraging open border and strong ties for seamless trade. Trusted suppliers for the Nepali market.",
    topCategories: ["Petroleum Products", "Vehicles", "Machinery", "Pharmaceuticals", "Steel", "Consumer Goods"],
    tradeStats: [
      { label: "India-Nepal Trade", value: "$10B+" },
      { label: "Active Suppliers", value: "2,000+" },
      { label: "Border Trade", value: "Open" }
    ],
    certifications: ["ISO", "BIS", "Nepal Standards"]
  },
  "new-zealand": {
    name: "New Zealand",
    flag: "🇳🇿",
    headline: "Source from India to New Zealand",
    description: "Quality products meeting NZ standards from verified Indian suppliers. Growing bilateral trade relations.",
    topCategories: ["Pharmaceuticals", "Textiles", "Gems & Jewelry", "Machinery", "IT Services", "Spices"],
    tradeStats: [
      { label: "India-NZ Trade", value: "$2B+" },
      { label: "Active Suppliers", value: "250+" },
      { label: "FTA Progress", value: "In Negotiation" }
    ],
    certifications: ["MPI", "MEDSAFE", "ISO", "AsureQuality"]
  },
  russia: {
    name: "Russia",
    flag: "🇷🇺",
    headline: "India-Russia Strategic Trade",
    description: "Expanding trade through INSTC corridor. Pharmaceuticals, tea, and machinery exports to Russia.",
    topCategories: ["Pharmaceuticals", "Tea & Coffee", "Machinery", "Textiles", "Chemicals", "Marine Products"],
    tradeStats: [
      { label: "India-Russia Trade", value: "$65B+" },
      { label: "Active Suppliers", value: "800+" },
      { label: "INSTC Route", value: "Active" }
    ],
    certifications: ["GOST", "EAC", "ISO", "Roszdravnadzor"]
  },
  "south-africa": {
    name: "South Africa",
    flag: "🇿🇦",
    headline: "India to South Africa Trade Hub",
    description: "Gateway to African markets through South Africa. Quality products with established shipping to Durban and Cape Town.",
    topCategories: ["Vehicles", "Pharmaceuticals", "Machinery", "Textiles", "Chemicals", "Electronics"],
    tradeStats: [
      { label: "India-SA Trade", value: "$15B+" },
      { label: "Active Suppliers", value: "700+" },
      { label: "BRICS Partner", value: "Strategic" }
    ],
    certifications: ["SABS", "SAHPRA", "ISO", "NRCS"]
  },
  spain: {
    name: "Spain",
    flag: "🇪🇸",
    headline: "Indian Suppliers for Spanish Market",
    description: "Quality products from verified Indian suppliers for the Spanish and Latin American markets.",
    topCategories: ["Textiles", "Pharmaceuticals", "Chemicals", "Machinery", "Leather Goods", "Food Products"],
    tradeStats: [
      { label: "India-Spain Trade", value: "$8B+" },
      { label: "Active Suppliers", value: "450+" },
      { label: "EU Gateway", value: "Strategic" }
    ],
    certifications: ["CE Mark", "AEMPS", "ISO", "REACH"]
  },
  "sri-lanka": {
    name: "Sri Lanka",
    flag: "🇱🇰",
    headline: "India-Sri Lanka Neighborhood Trade",
    description: "Leveraging proximity and FTA benefits for seamless trade with Sri Lanka. Trusted suppliers for diverse needs.",
    topCategories: ["Petroleum Products", "Vehicles", "Pharmaceuticals", "Sugar", "Textiles", "Machinery"],
    tradeStats: [
      { label: "India-SL Trade", value: "$6B+" },
      { label: "Active Suppliers", value: "1,500+" },
      { label: "FTA Benefits", value: "Active" }
    ],
    certifications: ["SLSI", "ISO", "NMRA"]
  },
  sweden: {
    name: "Sweden",
    flag: "🇸🇪",
    headline: "Indian Suppliers for Swedish Market",
    description: "Sustainable and quality products meeting Swedish environmental standards. Green solutions focus.",
    topCategories: ["IT Services", "Textiles", "Pharmaceuticals", "Machinery", "Organic Products", "Handicrafts"],
    tradeStats: [
      { label: "India-Sweden Trade", value: "$3B+" },
      { label: "Active Suppliers", value: "300+" },
      { label: "Sustainability Focus", value: "High" }
    ],
    certifications: ["CE Mark", "ISO 14001", "Nordic Swan", "REACH"]
  },
  switzerland: {
    name: "Switzerland",
    flag: "🇨🇭",
    headline: "India-Switzerland Precision Trade",
    description: "Premium quality products for the Swiss market. Precision engineering and pharmaceutical excellence.",
    topCategories: ["Gems & Jewelry", "Pharmaceuticals", "Machinery", "Chemicals", "Textiles", "IT Services"],
    tradeStats: [
      { label: "India-Switzerland Trade", value: "$25B+" },
      { label: "Active Suppliers", value: "400+" },
      { label: "EFTA-India TEPA", value: "Active" }
    ],
    certifications: ["Swissmedic", "ISO", "Swiss Made Partner"]
  },
  taiwan: {
    name: "Taiwan",
    flag: "🇹🇼",
    headline: "India-Taiwan Technology Trade",
    description: "Technology and manufacturing partnership with Taiwan. Electronics, chemicals, and machinery focus.",
    topCategories: ["Chemicals", "Machinery", "Textiles", "Pharmaceuticals", "Iron & Steel", "Plastics"],
    tradeStats: [
      { label: "India-Taiwan Trade", value: "$8B+" },
      { label: "Active Suppliers", value: "350+" },
      { label: "Tech Partnership", value: "Growing" }
    ],
    certifications: ["BSMI", "TFDA", "ISO", "CNS"]
  },
  tajikistan: {
    name: "Tajikistan",
    flag: "🇹🇯",
    headline: "Source from India to Tajikistan",
    description: "Connect with verified Indian suppliers for the Central Asian market through established trade routes.",
    topCategories: ["Pharmaceuticals", "Tea", "Textiles", "Machinery", "Food Products", "Consumer Goods"],
    tradeStats: [
      { label: "India-Tajikistan Trade", value: "$100M+" },
      { label: "Active Suppliers", value: "80+" },
      { label: "Growth Potential", value: "High" }
    ],
    certifications: ["ISO", "GOST", "EAC"]
  },
  thailand: {
    name: "Thailand",
    flag: "🇹🇭",
    headline: "India-Thailand Trade Excellence",
    description: "ASEAN gateway through Thailand. Leveraging FTA for competitive trade in diverse products.",
    topCategories: ["Machinery", "Chemicals", "Gems & Jewelry", "Pharmaceuticals", "Iron & Steel", "Textiles"],
    tradeStats: [
      { label: "India-Thailand Trade", value: "$15B+" },
      { label: "Active Suppliers", value: "900+" },
      { label: "ASEAN-India FTA", value: "Active" }
    ],
    certifications: ["TISI", "Thai FDA", "ISO", "HALAL"]
  },
  turkey: {
    name: "Turkey",
    flag: "🇹🇷",
    headline: "India-Turkey Trade Bridge",
    description: "Strategic trade partner bridging Asia and Europe. Growing bilateral trade in diverse sectors.",
    topCategories: ["Chemicals", "Machinery", "Textiles", "Pharmaceuticals", "Iron & Steel", "Plastics"],
    tradeStats: [
      { label: "India-Turkey Trade", value: "$12B+" },
      { label: "Active Suppliers", value: "600+" },
      { label: "Growth Rate", value: "12% YoY" }
    ],
    certifications: ["TSE", "CE Mark", "ISO", "Türkak"]
  },
  uganda: {
    name: "Uganda",
    flag: "🇺🇬",
    headline: "India to Uganda Trade Partnership",
    description: "Strong ties with Uganda for pharmaceuticals, machinery, and consumer goods. Gateway to East Africa.",
    topCategories: ["Pharmaceuticals", "Machinery", "Vehicles", "Textiles", "Iron & Steel", "Consumer Goods"],
    tradeStats: [
      { label: "India-Uganda Trade", value: "$1B+" },
      { label: "Active Suppliers", value: "200+" },
      { label: "East Africa Hub", value: "Strategic" }
    ],
    certifications: ["WHO-GMP", "UNBS", "ISO", "NDA Uganda"]
  },
  ukraine: {
    name: "Ukraine",
    flag: "🇺🇦",
    headline: "India-Ukraine Trade Relations",
    description: "Building trade relations with Ukraine. Pharmaceuticals, textiles, and agricultural products.",
    topCategories: ["Pharmaceuticals", "Textiles", "Tea & Coffee", "Machinery", "Chemicals", "Food Products"],
    tradeStats: [
      { label: "India-Ukraine Trade", value: "$3B+" },
      { label: "Active Suppliers", value: "200+" },
      { label: "Trade Growth", value: "Recovering" }
    ],
    certifications: ["ISO", "UA Standards", "DSTU"]
  },
  vietnam: {
    name: "Vietnam",
    flag: "🇻🇳",
    headline: "India-Vietnam Strategic Trade",
    description: "Growing ASEAN partner for diverse trade. Competitive pricing and strategic location advantages.",
    topCategories: ["Machinery", "Iron & Steel", "Chemicals", "Pharmaceuticals", "Cotton", "Seafood"],
    tradeStats: [
      { label: "India-Vietnam Trade", value: "$15B+" },
      { label: "Active Suppliers", value: "700+" },
      { label: "ASEAN Partner", value: "Strategic" }
    ],
    certifications: ["TCVN", "Vietnam FDA", "ISO", "HALAL"]
  },
  zimbabwe: {
    name: "Zimbabwe",
    flag: "🇿🇼",
    headline: "India to Zimbabwe Trade Solutions",
    description: "Reliable Indian suppliers for the Zimbabwean market. Pharmaceuticals, machinery, and vehicles.",
    topCategories: ["Pharmaceuticals", "Machinery", "Vehicles", "Textiles", "Chemicals", "Consumer Goods"],
    tradeStats: [
      { label: "India-Zimbabwe Trade", value: "$500M+" },
      { label: "Active Suppliers", value: "150+" },
      { label: "Avg. Delivery", value: "18-22 days" }
    ],
    certifications: ["WHO-GMP", "SAZ", "ISO"]
  },
  greece: {
    name: "Greece",
    flag: "🇬🇷",
    headline: "India to Greece Trade Partnership",
    description: "Quality products from verified Indian suppliers for the Greek market. Gateway to Southeastern Europe.",
    topCategories: ["Textiles", "Pharmaceuticals", "Chemicals", "Machinery", "Food Products", "IT Services"],
    tradeStats: [
      { label: "India-Greece Trade", value: "$2B+" },
      { label: "Active Suppliers", value: "200+" },
      { label: "EU Gateway", value: "Strategic" }
    ],
    certifications: ["CE Mark", "EOF", "ISO", "REACH"]
  },
  norway: {
    name: "Norway",
    flag: "🇳🇴",
    headline: "Indian Suppliers for Norwegian Market",
    description: "Sustainable and quality products for the Norwegian market. Green solutions meeting strict environmental standards.",
    topCategories: ["IT Services", "Textiles", "Pharmaceuticals", "Machinery", "Seafood", "Organic Products"],
    tradeStats: [
      { label: "India-Norway Trade", value: "$2B+" },
      { label: "Active Suppliers", value: "180+" },
      { label: "Sustainability Focus", value: "High" }
    ],
    certifications: ["CE Mark", "ISO 14001", "Nordic Swan", "EFTA Standards"]
  },
  philippines: {
    name: "Philippines",
    flag: "🇵🇭",
    headline: "India-Philippines Trade Excellence",
    description: "Growing ASEAN partner with strong bilateral ties. Quality products for the Filipino market.",
    topCategories: ["Pharmaceuticals", "Machinery", "Iron & Steel", "Chemicals", "Textiles", "Food Products"],
    tradeStats: [
      { label: "India-Philippines Trade", value: "$3B+" },
      { label: "Active Suppliers", value: "350+" },
      { label: "ASEAN Partner", value: "Growing" }
    ],
    certifications: ["FDA Philippines", "BPS", "ISO", "HALAL"]
  },
  portugal: {
    name: "Portugal",
    flag: "🇵🇹",
    headline: "Source from India to Portugal",
    description: "Quality products from verified Indian suppliers for the Portuguese and Lusophone markets.",
    topCategories: ["Textiles", "Pharmaceuticals", "Chemicals", "Machinery", "Leather Goods", "Food Products"],
    tradeStats: [
      { label: "India-Portugal Trade", value: "$1.5B+" },
      { label: "Active Suppliers", value: "150+" },
      { label: "EU Gateway", value: "Strategic" }
    ],
    certifications: ["CE Mark", "INFARMED", "ISO", "REACH"]
  },
  "saudi-arabia": {
    name: "Saudi Arabia",
    flag: "🇸🇦",
    headline: "India-Saudi Arabia Strategic Trade",
    description: "Major trade partner with HALAL-certified products. Direct shipping to Jeddah and Dammam ports.",
    topCategories: ["Food Products", "Textiles", "Chemicals", "Machinery", "Jewelry", "Pharmaceuticals"],
    tradeStats: [
      { label: "India-Saudi Trade", value: "$52B+" },
      { label: "Active Suppliers", value: "1,800+" },
      { label: "Avg. Delivery", value: "7-10 days" }
    ],
    certifications: ["HALAL", "SASO", "SFDA", "ISO"]
  },
  togo: {
    name: "Togo",
    flag: "🇹🇬",
    headline: "India to Togo Trade Solutions",
    description: "Gateway to West Africa through Togo. Reliable suppliers for diverse product categories.",
    topCategories: ["Pharmaceuticals", "Machinery", "Vehicles", "Textiles", "Rice & Grains", "Consumer Goods"],
    tradeStats: [
      { label: "India-Togo Trade", value: "$300M+" },
      { label: "Active Suppliers", value: "80+" },
      { label: "West Africa Hub", value: "Strategic" }
    ],
    certifications: ["WHO-GMP", "ISO", "ECOWAS Standards"]
  },
  qatar: {
    name: "Qatar",
    flag: "🇶🇦",
    headline: "India-Qatar Premium Trade",
    description: "HALAL-certified products and quality goods for the Qatari market. Strong bilateral relations.",
    topCategories: ["Food Products", "Textiles", "Jewelry", "Machinery", "Chemicals", "Building Materials"],
    tradeStats: [
      { label: "India-Qatar Trade", value: "$15B+" },
      { label: "Active Suppliers", value: "700+" },
      { label: "Avg. Delivery", value: "6-8 days" }
    ],
    certifications: ["HALAL", "QS", "ISO", "GSO"]
  },
  oman: {
    name: "Oman",
    flag: "🇴🇲",
    headline: "India-Oman Trade Partnership",
    description: "Historic trade partner with HALAL-certified products. Direct shipping to Muscat and Sohar ports.",
    topCategories: ["Food Products", "Textiles", "Machinery", "Vehicles", "Chemicals", "Spices"],
    tradeStats: [
      { label: "India-Oman Trade", value: "$12B+" },
      { label: "Active Suppliers", value: "550+" },
      { label: "FTA Benefits", value: "Active" }
    ],
    certifications: ["HALAL", "MOCI Oman", "ISO", "GSO"]
  }
};

export default function SourceCountry() {
  const { country } = useParams<{ country: string }>();
  const countryKey = country?.toLowerCase() || "usa";
  const data = countryData[countryKey] || countryData.usa;
  
  // Language support
  const [currentLanguage, setCurrentLanguage] = useState<Language>(() => 
    getDefaultLanguage(countryKey)
  );
  const t = translations[currentLanguage];
  const rtl = isRTL(currentLanguage);
  
  // Update language when country changes
  useEffect(() => {
    setCurrentLanguage(getDefaultLanguage(countryKey));
  }, [countryKey]);
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    categories: [] as string[],
    volume: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SEO hooks
  useSEO({
    title: `${data.headline} | ProcureSaathi`,
    description: data.description,
    canonical: `https://procuresaathi.com/source/${countryKey}`,
    keywords: `${data.name} import, India export, B2B sourcing, ${data.topCategories.join(", ")}`
  });
  
  // Regional LocalBusiness schema
  useRegionalSEO(countryKey, data.name);

  // CRITICAL: Track page view for demand intelligence heatmap
  // This ensures /source/:country SEO traffic feeds into Global Demand Signals
  useEffect(() => {
    const trackCountryPageView = async () => {
      const signalSlug = `source-${countryKey}`;
      
      try {
        // Check if admin_signal_pages entry exists for this country source page
        const { data: existingPage } = await supabase
          .from('admin_signal_pages')
          .select('id')
          .eq('slug', signalSlug)
          .maybeSingle();

        if (!existingPage) {
          // Create entry for country source page (one per country)
          await supabase
            .from('admin_signal_pages')
            .insert({
              slug: signalSlug,
              category: 'International Trade',
              subcategory: `${data.name} Import`,
              headline: data.headline,
              subheadline: data.description,
              target_country: countryKey,
              target_industries: data.topCategories.slice(0, 5),
              primary_cta: 'Get Quotes',
              views: 0,
              intent_score: 0,
              is_active: true
            })
            .select('id')
            .maybeSingle();
        }

        // Call RPC to track view and increment intent score (throttled)
        await supabase.rpc('promote_signal_on_visit', {
          p_slug: signalSlug,
          p_country: countryKey,
        });
      } catch (error) {
        console.warn('[SourceCountry] Signal tracking failed:', error);
      }
    };

    trackCountryPageView();
  }, [countryKey, data.name, data.headline, data.description, data.topCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("international_leads").insert({
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
        company_name: formData.company || null,
        country: data.name,
        interested_categories: formData.categories,
        trade_interest: "import_from_india",
        monthly_volume: formData.volume || null,
        source: `/source/${country}`,
        utm_source: new URLSearchParams(window.location.search).get("utm_source") || null,
        utm_medium: new URLSearchParams(window.location.search).get("utm_medium") || null,
        utm_campaign: new URLSearchParams(window.location.search).get("utm_campaign") || null
      });

      if (error) throw error;

      toast.success("Thank you! Our team will contact you shortly.");
      setFormData({ name: "", email: "", phone: "", company: "", categories: [], volume: "", message: "" });
    } catch (error) {
      console.error("Error submitting lead:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-background ${rtl ? 'rtl' : 'ltr'}`} dir={rtl ? 'rtl' : 'ltr'}>
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="container mx-auto px-4">
          {/* Language Selector */}
          <div className={`flex justify-end mb-4 ${rtl ? 'flex-row-reverse' : ''}`}>
            <LanguageSelector
              currentLanguage={currentLanguage}
              onLanguageChange={setCurrentLanguage}
              availableLanguages={countryKey === 'uae' ? ['en', 'ar'] : countryKey === 'germany' ? ['en', 'de'] : ['en']}
            />
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className={`flex items-center gap-3 mb-6 ${rtl ? 'flex-row-reverse' : ''}`}>
                <span className="text-5xl">{data.flag}</span>
                <Badge variant="secondary" className="text-sm">
                  <Globe className="h-3 w-3 mr-1" />
                  International Trade
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {data.headline}
              </h1>
              <p className="text-xl text-muted-foreground mb-8">
                {data.description}
              </p>
              
              <div className="grid grid-cols-3 gap-4 mb-8">
                {data.tradeStats.map((stat, index) => (
                  <div key={index} className="text-center p-4 bg-card rounded-lg">
                    <p className="text-2xl font-bold text-primary">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2">
                {data.certifications.map((cert, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-green-500" />
                    {cert}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Lead Capture Form */}
            <Card className="shadow-xl">
              <CardContent className="p-6">
                <h2 className="text-2xl font-bold mb-2">{t.hero.getStarted}</h2>
                <p className="text-muted-foreground mb-6">
                  {currentLanguage === 'en' 
                    ? "Tell us about your sourcing needs and we'll connect you with verified suppliers"
                    : currentLanguage === 'ar'
                    ? "أخبرنا عن احتياجات التوريد الخاصة بك وسنربطك بموردين معتمدين"
                    : "Teilen Sie uns Ihre Beschaffungsbedürfnisse mit und wir verbinden Sie mit verifizierten Lieferanten"}
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">{t.form.fullName} *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder={currentLanguage === 'ar' ? "محمد أحمد" : currentLanguage === 'de' ? "Max Mustermann" : "John Smith"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">{t.form.businessEmail} *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="john@company.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">{t.form.phone}</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder={countryKey === 'uae' ? "+971 50 123 4567" : countryKey === 'germany' ? "+49 30 1234567" : "+1 555 123 4567"}
                      />
                    </div>
                    <div>
                      <Label htmlFor="company">{t.form.companyName}</Label>
                      <Input
                        id="company"
                        value={formData.company}
                        onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                        placeholder={currentLanguage === 'ar' ? "شركة ABC للاستيراد" : currentLanguage === 'de' ? "ABC Import GmbH" : "ABC Imports Ltd"}
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="volume">{t.form.monthlyVolume}</Label>
                    <Select
                      value={formData.volume}
                      onValueChange={(value) => setFormData({ ...formData, volume: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={t.form.selectVolume} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="under_10k">{t.form.under10k}</SelectItem>
                        <SelectItem value="10k_50k">{t.form.range10k50k}</SelectItem>
                        <SelectItem value="50k_100k">{t.form.range50k100k}</SelectItem>
                        <SelectItem value="100k_500k">{t.form.range100k500k}</SelectItem>
                        <SelectItem value="over_500k">{t.form.over500k}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>{t.form.interestedCategories}</Label>
                    <div className={`flex flex-wrap gap-2 mt-2 ${rtl ? 'flex-row-reverse' : ''}`}>
                      {data.topCategories.map((cat) => (
                        <Badge
                          key={cat}
                          variant={formData.categories.includes(cat) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => {
                            if (formData.categories.includes(cat)) {
                              setFormData({
                                ...formData,
                                categories: formData.categories.filter(c => c !== cat)
                              });
                            } else {
                              setFormData({
                                ...formData,
                                categories: [...formData.categories, cat]
                              });
                            }
                          }}
                        >
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                    {isSubmitting 
                      ? (currentLanguage === 'ar' ? "جاري الإرسال..." : currentLanguage === 'de' ? "Wird gesendet..." : "Submitting...")
                      : t.hero.connectWithSuppliers}
                    <ArrowRight className={`h-4 w-4 ${rtl ? 'mr-2 rotate-180' : 'ml-2'}`} />
                  </Button>

                  <p className="text-xs text-muted-foreground text-center">
                    {t.hero.bySubmitting}
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      {(() => {
        const seoContent = getSourceCountrySEOContent(countryKey) || getFallbackSourceSEOContent(data.name);
        return (
          <section className="py-12 bg-card border-b">
            <div className="container mx-auto px-4 max-w-4xl">
              <h2 className="text-xl md:text-2xl font-bold mb-4">{seoContent.heading}</h2>
              <p className="text-muted-foreground leading-relaxed text-sm mb-6">{seoContent.content}</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {seoContent.tradeCategories.map((cat) => (
                  <Badge key={cat} variant="outline" className="text-xs">{cat}</Badge>
                ))}
              </div>
              <div className="pt-4 border-t border-border/50">
                <Link to="/post-rfq" className="text-sm text-primary font-medium hover:underline">
                  Raise an RFQ on ProcureSaathi for {data.name} trade →
                </Link>
              </div>
            </div>
          </section>
        );
      })()}

      {/* Top Categories Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t.sections.topCategories} {data.name}
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {data.topCategories.map((category, index) => (
              <Card key={index} className="text-center hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <Package className="h-8 w-8 mx-auto mb-3 text-primary" />
                  <p className="font-medium text-sm">{category}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            {t.sections.whySource}
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="p-6 text-center">
                <Shield className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">{t.sections.verifiedSuppliers}</h3>
                <p className="text-muted-foreground">
                  {t.sections.verifiedSuppliersDesc}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Ship className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">{t.sections.integratedLogistics}</h3>
                <p className="text-muted-foreground">
                  {t.sections.integratedLogisticsDesc}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <Truck className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2">{t.sections.realTimeTracking}</h3>
                <p className="text-muted-foreground">
                  {t.sections.realTimeTrackingDesc}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t.sections.readyToStart}
          </h2>
          <p className="text-xl mb-8 opacity-90">
            {t.sections.joinThousands}
          </p>
          <div className={`flex flex-wrap gap-4 justify-center ${rtl ? 'flex-row-reverse' : ''}`}>
            <Link to="/signup">
              <Button size="lg" variant="secondary">
                {t.sections.createFreeAccount}
                <ArrowRight className={`h-4 w-4 ${rtl ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Button>
            </Link>
            <Link to="/categories">
              <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                {t.sections.browseCategories}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
