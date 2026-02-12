import { useState, useRef, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

// Comprehensive list of major cities worldwide
const CITIES = [
  // India - All major cities
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
  'Salem, Tamil Nadu', 'Tiruppur, Tamil Nadu', 'Erode, Tamil Nadu', 'Vellore, Tamil Nadu',
  'Hubli, Karnataka', 'Belgaum, Karnataka', 'Davangere, Karnataka', 'Gulbarga, Karnataka',
  'Bellary, Karnataka', 'Shimoga, Karnataka', 'Tumkur, Karnataka',
  'Bikaner, Rajasthan', 'Ajmer, Rajasthan', 'Bhilwara, Rajasthan', 'Alwar, Rajasthan',
  'Sikar, Rajasthan', 'Pali, Rajasthan', 'Bharatpur, Rajasthan',
  'Jalandhar, Punjab', 'Patiala, Punjab', 'Bathinda, Punjab', 'Mohali, Punjab',
  'Panipat, Haryana', 'Sonipat, Haryana', 'Hisar, Haryana', 'Rohtak, Haryana', 'Karnal, Haryana',
  'Gorakhpur, Uttar Pradesh', 'Moradabad, Uttar Pradesh', 'Aligarh, Uttar Pradesh',
  'Bareilly, Uttar Pradesh', 'Saharanpur, Uttar Pradesh', 'Mathura, Uttar Pradesh',
  'Firozabad, Uttar Pradesh', 'Jhansi, Uttar Pradesh', 'Muzaffarnagar, Uttar Pradesh',
  'Kolhapur, Maharashtra', 'Solapur, Maharashtra', 'Sangli, Maharashtra', 'Nanded, Maharashtra',
  'Akola, Maharashtra', 'Latur, Maharashtra', 'Ahmednagar, Maharashtra', 'Dhule, Maharashtra',
  'Jalgaon, Maharashtra', 'Parbhani, Maharashtra', 'Satara, Maharashtra', 'Ratnagiri, Maharashtra',
  'Bhavnagar, Gujarat', 'Jamnagar, Gujarat', 'Junagadh, Gujarat', 'Gandhinagar, Gujarat',
  'Anand, Gujarat', 'Morbi, Gujarat', 'Mehsana, Gujarat', 'Navsari, Gujarat', 'Bharuch, Gujarat',
  'Cuttack, Odisha', 'Bhubaneswar, Odisha', 'Rourkela, Odisha', 'Berhampur, Odisha',
  'Sambalpur, Odisha', 'Balasore, Odisha',
  'Siliguri, West Bengal', 'Durgapur, West Bengal', 'Asansol, West Bengal', 'Bardhaman, West Bengal',
  'Bokaro, Jharkhand', 'Deoghar, Jharkhand', 'Hazaribagh, Jharkhand',
  'Bilaspur, Chhattisgarh', 'Korba, Chhattisgarh', 'Durg, Chhattisgarh',
  'Gaya, Bihar', 'Muzaffarpur, Bihar', 'Bhagalpur, Bihar', 'Darbhanga, Bihar', 'Purnia, Bihar',
  'Tirunelveli, Tamil Nadu', 'Thanjavur, Tamil Nadu', 'Dindigul, Tamil Nadu', 'Nagercoil, Tamil Nadu',
  'Thrissur, Kerala', 'Kozhikode, Kerala', 'Kannur, Kerala', 'Kollam, Kerala', 'Palakkad, Kerala',
  'Guntur, Andhra Pradesh', 'Nellore, Andhra Pradesh', 'Kurnool, Andhra Pradesh', 'Rajahmundry, Andhra Pradesh',
  'Tirupati, Andhra Pradesh', 'Kakinada, Andhra Pradesh', 'Kadapa, Andhra Pradesh',
  'Warangal, Telangana', 'Nizamabad, Telangana', 'Karimnagar, Telangana', 'Khammam, Telangana',
  'Dibrugarh, Assam', 'Jorhat, Assam', 'Silchar, Assam', 'Tezpur, Assam',
  'Imphal, Manipur', 'Shillong, Meghalaya', 'Aizawl, Mizoram', 'Kohima, Nagaland',
  'Agartala, Tripura', 'Itanagar, Arunachal Pradesh', 'Gangtok, Sikkim',
  'Jammu, Jammu & Kashmir', 'Leh, Ladakh', 'Shimla, Himachal Pradesh', 'Manali, Himachal Pradesh',
  'Dharamsala, Himachal Pradesh', 'Haridwar, Uttarakhand', 'Rishikesh, Uttarakhand',
  'Haldwani, Uttarakhand', 'Roorkee, Uttarakhand',
  'Panaji, Goa', 'Margao, Goa', 'Vasco da Gama, Goa',
  'Pondicherry, Puducherry', 'Port Blair, Andaman & Nicobar',

  // UAE
  'Dubai, UAE', 'Abu Dhabi, UAE', 'Sharjah, UAE', 'Ajman, UAE', 'Ras Al Khaimah, UAE',
  'Fujairah, UAE', 'Umm Al Quwain, UAE', 'Al Ain, UAE',

  // Saudi Arabia
  'Riyadh, Saudi Arabia', 'Jeddah, Saudi Arabia', 'Dammam, Saudi Arabia', 'Mecca, Saudi Arabia',
  'Medina, Saudi Arabia', 'Khobar, Saudi Arabia', 'Tabuk, Saudi Arabia', 'Buraidah, Saudi Arabia',
  'Abha, Saudi Arabia', 'Najran, Saudi Arabia', 'Yanbu, Saudi Arabia', 'Jubail, Saudi Arabia',

  // Other Gulf / Middle East
  'Doha, Qatar', 'Muscat, Oman', 'Salalah, Oman', 'Kuwait City, Kuwait', 'Manama, Bahrain',
  'Amman, Jordan', 'Beirut, Lebanon', 'Baghdad, Iraq', 'Erbil, Iraq', 'Tehran, Iran',
  'Isfahan, Iran', 'Shiraz, Iran', 'Tabriz, Iran', 'Mashhad, Iran',

  // Africa
  'Nairobi, Kenya', 'Mombasa, Kenya', 'Kisumu, Kenya', 'Nakuru, Kenya', 'Eldoret, Kenya',
  'Lagos, Nigeria', 'Abuja, Nigeria', 'Kano, Nigeria', 'Ibadan, Nigeria', 'Port Harcourt, Nigeria',
  'Cairo, Egypt', 'Alexandria, Egypt', 'Giza, Egypt', 'Luxor, Egypt',
  'Johannesburg, South Africa', 'Cape Town, South Africa', 'Durban, South Africa', 'Pretoria, South Africa',
  'Dar es Salaam, Tanzania', 'Dodoma, Tanzania', 'Arusha, Tanzania', 'Mwanza, Tanzania',
  'Addis Ababa, Ethiopia', 'Dire Dawa, Ethiopia',
  'Accra, Ghana', 'Kumasi, Ghana', 'Tamale, Ghana',
  'Casablanca, Morocco', 'Rabat, Morocco', 'Marrakech, Morocco', 'Fez, Morocco', 'Tangier, Morocco',
  'Tunis, Tunisia', 'Sfax, Tunisia', 'Algiers, Algeria', 'Oran, Algeria',
  'Kampala, Uganda', 'Kigali, Rwanda', 'Lusaka, Zambia', 'Harare, Zimbabwe',
  'Maputo, Mozambique', 'Windhoek, Namibia', 'Gaborone, Botswana',
  'Dakar, Senegal', 'Abidjan, Ivory Coast', 'Luanda, Angola', 'Kinshasa, DR Congo',
  'Douala, Cameroon', 'Yaoundé, Cameroon', 'Libreville, Gabon',
  'Antananarivo, Madagascar', 'Port Louis, Mauritius',

  // Southeast Asia
  'Singapore, Singapore', 'Bangkok, Thailand', 'Chiang Mai, Thailand', 'Phuket, Thailand',
  'Kuala Lumpur, Malaysia', 'Penang, Malaysia', 'Johor Bahru, Malaysia', 'Kota Kinabalu, Malaysia',
  'Jakarta, Indonesia', 'Surabaya, Indonesia', 'Bandung, Indonesia', 'Medan, Indonesia', 'Bali, Indonesia',
  'Ho Chi Minh City, Vietnam', 'Hanoi, Vietnam', 'Da Nang, Vietnam', 'Hai Phong, Vietnam',
  'Manila, Philippines', 'Cebu, Philippines', 'Davao, Philippines', 'Quezon City, Philippines',
  'Yangon, Myanmar', 'Mandalay, Myanmar',
  'Phnom Penh, Cambodia', 'Siem Reap, Cambodia',
  'Vientiane, Laos', 'Bandar Seri Begawan, Brunei',

  // East Asia
  'Shanghai, China', 'Beijing, China', 'Shenzhen, China', 'Guangzhou, China', 'Hong Kong, China',
  'Chengdu, China', 'Wuhan, China', 'Hangzhou, China', 'Nanjing, China', 'Tianjin, China',
  'Chongqing, China', 'Xian, China', 'Suzhou, China', 'Dongguan, China', 'Qingdao, China',
  'Dalian, China', 'Zhengzhou, China', 'Changsha, China', 'Fuzhou, China', 'Kunming, China',
  'Tokyo, Japan', 'Osaka, Japan', 'Yokohama, Japan', 'Nagoya, Japan', 'Fukuoka, Japan',
  'Sapporo, Japan', 'Kobe, Japan', 'Kyoto, Japan',
  'Seoul, South Korea', 'Busan, South Korea', 'Incheon, South Korea', 'Daegu, South Korea',
  'Taipei, Taiwan', 'Kaohsiung, Taiwan', 'Taichung, Taiwan',
  'Ulaanbaatar, Mongolia',

  // South Asia (non-India)
  'Dhaka, Bangladesh', 'Chittagong, Bangladesh', 'Khulna, Bangladesh', 'Sylhet, Bangladesh',
  'Karachi, Pakistan', 'Lahore, Pakistan', 'Islamabad, Pakistan', 'Faisalabad, Pakistan',
  'Rawalpindi, Pakistan', 'Peshawar, Pakistan', 'Multan, Pakistan', 'Sialkot, Pakistan',
  'Colombo, Sri Lanka', 'Kandy, Sri Lanka', 'Galle, Sri Lanka',
  'Kathmandu, Nepal', 'Pokhara, Nepal', 'Biratnagar, Nepal',
  'Thimphu, Bhutan', 'Male, Maldives', 'Kabul, Afghanistan',

  // Europe - Western
  'London, United Kingdom', 'Manchester, United Kingdom', 'Birmingham, United Kingdom',
  'Leeds, United Kingdom', 'Glasgow, United Kingdom', 'Edinburgh, United Kingdom',
  'Liverpool, United Kingdom', 'Bristol, United Kingdom', 'Cardiff, United Kingdom',
  'Belfast, United Kingdom', 'Newcastle, United Kingdom', 'Sheffield, United Kingdom',
  'Paris, France', 'Lyon, France', 'Marseille, France', 'Toulouse, France', 'Nice, France',
  'Strasbourg, France', 'Bordeaux, France', 'Lille, France', 'Nantes, France',
  'Berlin, Germany', 'Munich, Germany', 'Hamburg, Germany', 'Frankfurt, Germany',
  'Cologne, Germany', 'Stuttgart, Germany', 'Düsseldorf, Germany', 'Leipzig, Germany',
  'Dortmund, Germany', 'Dresden, Germany', 'Hanover, Germany', 'Nuremberg, Germany',
  'Amsterdam, Netherlands', 'Rotterdam, Netherlands', 'The Hague, Netherlands', 'Utrecht, Netherlands',
  'Brussels, Belgium', 'Antwerp, Belgium', 'Ghent, Belgium',
  'Luxembourg City, Luxembourg',
  'Dublin, Ireland', 'Cork, Ireland', 'Galway, Ireland',

  // Europe - Southern
  'Madrid, Spain', 'Barcelona, Spain', 'Valencia, Spain', 'Seville, Spain', 'Malaga, Spain',
  'Bilbao, Spain', 'Zaragoza, Spain',
  'Rome, Italy', 'Milan, Italy', 'Naples, Italy', 'Turin, Italy', 'Florence, Italy',
  'Bologna, Italy', 'Genoa, Italy', 'Venice, Italy', 'Palermo, Italy',
  'Lisbon, Portugal', 'Porto, Portugal', 'Braga, Portugal',
  'Athens, Greece', 'Thessaloniki, Greece',
  'Istanbul, Turkey', 'Ankara, Turkey', 'Izmir, Turkey', 'Antalya, Turkey', 'Bursa, Turkey',

  // Europe - Northern
  'Stockholm, Sweden', 'Gothenburg, Sweden', 'Malmö, Sweden',
  'Copenhagen, Denmark', 'Aarhus, Denmark',
  'Oslo, Norway', 'Bergen, Norway', 'Stavanger, Norway',
  'Helsinki, Finland', 'Tampere, Finland', 'Turku, Finland',
  'Reykjavik, Iceland',

  // Europe - Central & Eastern
  'Zurich, Switzerland', 'Geneva, Switzerland', 'Basel, Switzerland', 'Bern, Switzerland',
  'Vienna, Austria', 'Salzburg, Austria', 'Graz, Austria',
  'Prague, Czech Republic', 'Brno, Czech Republic',
  'Warsaw, Poland', 'Krakow, Poland', 'Wroclaw, Poland', 'Gdansk, Poland', 'Poznan, Poland',
  'Budapest, Hungary', 'Debrecen, Hungary',
  'Bucharest, Romania', 'Cluj-Napoca, Romania', 'Timisoara, Romania',
  'Sofia, Bulgaria', 'Plovdiv, Bulgaria',
  'Belgrade, Serbia', 'Novi Sad, Serbia',
  'Zagreb, Croatia', 'Split, Croatia', 'Dubrovnik, Croatia',
  'Ljubljana, Slovenia',
  'Bratislava, Slovakia', 'Kosice, Slovakia',
  'Tallinn, Estonia', 'Riga, Latvia', 'Vilnius, Lithuania',
  'Kyiv, Ukraine', 'Lviv, Ukraine', 'Odesa, Ukraine', 'Kharkiv, Ukraine',
  'Minsk, Belarus',
  'Moscow, Russia', 'Saint Petersburg, Russia', 'Novosibirsk, Russia', 'Yekaterinburg, Russia',
  'Kazan, Russia', 'Vladivostok, Russia', 'Nizhny Novgorod, Russia',

  // North America - USA
  'New York, USA', 'Los Angeles, USA', 'Chicago, USA', 'Houston, USA', 'Phoenix, USA',
  'Philadelphia, USA', 'San Antonio, USA', 'San Diego, USA', 'Dallas, USA', 'San Jose, USA',
  'Austin, USA', 'Jacksonville, USA', 'San Francisco, USA', 'Charlotte, USA', 'Indianapolis, USA',
  'Seattle, USA', 'Denver, USA', 'Washington DC, USA', 'Nashville, USA', 'Oklahoma City, USA',
  'El Paso, USA', 'Boston, USA', 'Portland, USA', 'Las Vegas, USA', 'Memphis, USA',
  'Louisville, USA', 'Baltimore, USA', 'Milwaukee, USA', 'Albuquerque, USA', 'Tucson, USA',
  'Fresno, USA', 'Sacramento, USA', 'Mesa, USA', 'Atlanta, USA', 'Kansas City, USA',
  'Omaha, USA', 'Colorado Springs, USA', 'Raleigh, USA', 'Miami, USA', 'Minneapolis, USA',
  'Tampa, USA', 'Cleveland, USA', 'Pittsburgh, USA', 'Cincinnati, USA', 'Orlando, USA',
  'Detroit, USA', 'St. Louis, USA', 'Salt Lake City, USA', 'Honolulu, USA',

  // North America - Canada
  'Toronto, Canada', 'Montreal, Canada', 'Vancouver, Canada', 'Calgary, Canada',
  'Edmonton, Canada', 'Ottawa, Canada', 'Winnipeg, Canada', 'Quebec City, Canada',
  'Hamilton, Canada', 'Halifax, Canada', 'Victoria, Canada', 'Saskatoon, Canada',

  // North America - Mexico
  'Mexico City, Mexico', 'Guadalajara, Mexico', 'Monterrey, Mexico', 'Puebla, Mexico',
  'Tijuana, Mexico', 'Cancun, Mexico', 'Merida, Mexico', 'Leon, Mexico', 'Queretaro, Mexico',

  // Central America & Caribbean
  'Guatemala City, Guatemala', 'San Salvador, El Salvador', 'Tegucigalpa, Honduras',
  'Managua, Nicaragua', 'San Jose, Costa Rica', 'Panama City, Panama',
  'Havana, Cuba', 'Kingston, Jamaica', 'Santo Domingo, Dominican Republic',
  'Port-au-Prince, Haiti', 'Nassau, Bahamas', 'San Juan, Puerto Rico',
  'Port of Spain, Trinidad and Tobago',

  // South America
  'São Paulo, Brazil', 'Rio de Janeiro, Brazil', 'Brasilia, Brazil', 'Salvador, Brazil',
  'Fortaleza, Brazil', 'Belo Horizonte, Brazil', 'Curitiba, Brazil', 'Recife, Brazil',
  'Porto Alegre, Brazil', 'Manaus, Brazil',
  'Buenos Aires, Argentina', 'Córdoba, Argentina', 'Rosario, Argentina', 'Mendoza, Argentina',
  'Bogota, Colombia', 'Medellin, Colombia', 'Cali, Colombia', 'Barranquilla, Colombia', 'Cartagena, Colombia',
  'Lima, Peru', 'Arequipa, Peru', 'Cusco, Peru', 'Trujillo, Peru',
  'Santiago, Chile', 'Valparaiso, Chile', 'Concepcion, Chile',
  'Caracas, Venezuela', 'Maracaibo, Venezuela', 'Valencia, Venezuela',
  'Quito, Ecuador', 'Guayaquil, Ecuador',
  'Montevideo, Uruguay', 'Asuncion, Paraguay',
  'La Paz, Bolivia', 'Santa Cruz, Bolivia', 'Sucre, Bolivia',
  'Georgetown, Guyana', 'Paramaribo, Suriname',

  // Oceania
  'Sydney, Australia', 'Melbourne, Australia', 'Brisbane, Australia', 'Perth, Australia',
  'Adelaide, Australia', 'Gold Coast, Australia', 'Canberra, Australia', 'Hobart, Australia',
  'Darwin, Australia',
  'Auckland, New Zealand', 'Wellington, New Zealand', 'Christchurch, New Zealand',
  'Suva, Fiji', 'Port Moresby, Papua New Guinea',

  // Central Asia
  'Tashkent, Uzbekistan', 'Almaty, Kazakhstan', 'Nur-Sultan, Kazakhstan',
  'Bishkek, Kyrgyzstan', 'Dushanbe, Tajikistan', 'Ashgabat, Turkmenistan',
  'Baku, Azerbaijan', 'Tbilisi, Georgia', 'Yerevan, Armenia',
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
