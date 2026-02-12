import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Major cities worldwide for autocomplete
const CITIES = [
  // India
  'Mumbai, Maharashtra', 'Delhi, NCR', 'Bangalore, Karnataka', 'Hyderabad, Telangana',
  'Chennai, Tamil Nadu', 'Kolkata, West Bengal', 'Pune, Maharashtra', 'Ahmedabad, Gujarat',
  'Jaipur, Rajasthan', 'Lucknow, Uttar Pradesh', 'Surat, Gujarat', 'Kanpur, Uttar Pradesh',
  'Nagpur, Maharashtra', 'Indore, Madhya Pradesh', 'Thane, Maharashtra', 'Bhopal, Madhya Pradesh',
  'Visakhapatnam, Andhra Pradesh', 'Patna, Bihar', 'Vadodara, Gujarat', 'Ghaziabad, Uttar Pradesh',
  'Ludhiana, Punjab', 'Agra, Uttar Pradesh', 'Nashik, Maharashtra', 'Faridabad, Haryana',
  'Meerut, Uttar Pradesh', 'Rajkot, Gujarat', 'Varanasi, Uttar Pradesh', 'Srinagar, Jammu & Kashmir',
  'Aurangabad, Maharashtra', 'Dhanbad, Jharkhand', 'Amritsar, Punjab', 'Allahabad, Uttar Pradesh',
  'Ranchi, Jharkhand', 'Howrah, West Bengal', 'Coimbatore, Tamil Nadu', 'Jabalpur, Madhya Pradesh',
  'Gwalior, Madhya Pradesh', 'Vijayawada, Andhra Pradesh', 'Jodhpur, Rajasthan', 'Madurai, Tamil Nadu',
  'Raipur, Chhattisgarh', 'Kota, Rajasthan', 'Chandigarh, Punjab', 'Guwahati, Assam',
  'Noida, Uttar Pradesh', 'Gurgaon, Haryana', 'Dehradun, Uttarakhand', 'Mangalore, Karnataka',
  'Trivandrum, Kerala', 'Kochi, Kerala', 'Mysore, Karnataka', 'Udaipur, Rajasthan',
  'Jamshedpur, Jharkhand', 'Bhilai, Chhattisgarh', 'Tiruchirappalli, Tamil Nadu',
  // UAE
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE', 'Ajman, UAE',
  // Saudi Arabia
  'Riyadh, Saudi Arabia', 'Jeddah, Saudi Arabia', 'Dammam, Saudi Arabia', 'Mecca, Saudi Arabia',
  // Other Middle East
  'Doha, Qatar', 'Muscat, Oman', 'Kuwait City, Kuwait', 'Manama, Bahrain',
  // Africa
  'Nairobi, Kenya', 'Lagos, Nigeria', 'Cairo, Egypt', 'Johannesburg, South Africa',
  'Cape Town, South Africa', 'Dar es Salaam, Tanzania', 'Addis Ababa, Ethiopia', 'Accra, Ghana',
  // Southeast Asia
  'Singapore, Singapore', 'Bangkok, Thailand', 'Kuala Lumpur, Malaysia', 'Jakarta, Indonesia',
  'Ho Chi Minh City, Vietnam', 'Manila, Philippines', 'Yangon, Myanmar',
  // East Asia
  'Shanghai, China', 'Beijing, China', 'Shenzhen, China', 'Guangzhou, China', 'Hong Kong, China',
  'Tokyo, Japan', 'Seoul, South Korea', 'Taipei, Taiwan',
  // Europe
  'London, United Kingdom', 'Paris, France', 'Berlin, Germany', 'Amsterdam, Netherlands',
  'Madrid, Spain', 'Rome, Italy', 'Istanbul, Turkey', 'Moscow, Russia', 'Zurich, Switzerland',
  // Americas
  'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'Houston, USA', 'San Francisco, USA',
  'Toronto, Canada', 'Vancouver, Canada', 'Mexico City, Mexico', 'São Paulo, Brazil',
  'Buenos Aires, Argentina', 'Bogota, Colombia', 'Lima, Peru',
  // Oceania
  'Sydney, Australia', 'Melbourne, Australia', 'Auckland, New Zealand',
];

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export const LocationSearchInput = ({ value, onChange, error, className }: LocationSearchInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filtered = useMemo(() => {
    if (!inputValue.trim()) return CITIES.slice(0, 10);
    const q = inputValue.toLowerCase();
    return CITIES.filter(c => c.toLowerCase().includes(q)).slice(0, 8);
  }, [inputValue]);

  const handleSelect = (city: string) => {
    setInputValue(city);
    onChange(city);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        placeholder="Type city name e.g. Del, Mum..."
        value={inputValue}
        onChange={(e) => {
          setInputValue(e.target.value);
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        className={cn('min-h-[44px]', error && 'border-destructive', className)}
        autoComplete="off"
      />
      {isOpen && filtered.length > 0 && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-lg max-h-[200px] overflow-y-auto">
          {filtered.map((city) => (
            <button
              key={city}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
              onClick={() => handleSelect(city)}
            >
              {city}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
