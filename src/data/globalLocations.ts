export interface GlobalLocation {
  city: string;
  country: string;
  region: string;
}

export const globalLocations: GlobalLocation[] = [
  // India - Major Logistics Hubs
  { city: 'Mumbai', country: 'India', region: 'South Asia' },
  { city: 'Delhi', country: 'India', region: 'South Asia' },
  { city: 'Chennai', country: 'India', region: 'South Asia' },
  { city: 'Kolkata', country: 'India', region: 'South Asia' },
  { city: 'Bangalore', country: 'India', region: 'South Asia' },
  { city: 'Hyderabad', country: 'India', region: 'South Asia' },
  { city: 'Ahmedabad', country: 'India', region: 'South Asia' },
  { city: 'Pune', country: 'India', region: 'South Asia' },
  { city: 'Surat', country: 'India', region: 'South Asia' },
  { city: 'Jaipur', country: 'India', region: 'South Asia' },
  { city: 'Lucknow', country: 'India', region: 'South Asia' },
  { city: 'Kanpur', country: 'India', region: 'South Asia' },
  { city: 'Nagpur', country: 'India', region: 'South Asia' },
  { city: 'Indore', country: 'India', region: 'South Asia' },
  { city: 'Coimbatore', country: 'India', region: 'South Asia' },
  { city: 'Kochi', country: 'India', region: 'South Asia' },
  { city: 'Visakhapatnam', country: 'India', region: 'South Asia' },
  { city: 'Vadodara', country: 'India', region: 'South Asia' },
  { city: 'Ludhiana', country: 'India', region: 'South Asia' },
  { city: 'Rajkot', country: 'India', region: 'South Asia' },
  
  // Middle East
  { city: 'Dubai', country: 'UAE', region: 'Middle East' },
  { city: 'Abu Dhabi', country: 'UAE', region: 'Middle East' },
  { city: 'Sharjah', country: 'UAE', region: 'Middle East' },
  { city: 'Jeddah', country: 'Saudi Arabia', region: 'Middle East' },
  { city: 'Riyadh', country: 'Saudi Arabia', region: 'Middle East' },
  { city: 'Dammam', country: 'Saudi Arabia', region: 'Middle East' },
  { city: 'Doha', country: 'Qatar', region: 'Middle East' },
  { city: 'Kuwait City', country: 'Kuwait', region: 'Middle East' },
  { city: 'Muscat', country: 'Oman', region: 'Middle East' },
  { city: 'Manama', country: 'Bahrain', region: 'Middle East' },
  
  // Asia Pacific
  { city: 'Singapore', country: 'Singapore', region: 'Asia Pacific' },
  { city: 'Hong Kong', country: 'Hong Kong', region: 'Asia Pacific' },
  { city: 'Shanghai', country: 'China', region: 'Asia Pacific' },
  { city: 'Shenzhen', country: 'China', region: 'Asia Pacific' },
  { city: 'Guangzhou', country: 'China', region: 'Asia Pacific' },
  { city: 'Tokyo', country: 'Japan', region: 'Asia Pacific' },
  { city: 'Osaka', country: 'Japan', region: 'Asia Pacific' },
  { city: 'Seoul', country: 'South Korea', region: 'Asia Pacific' },
  { city: 'Busan', country: 'South Korea', region: 'Asia Pacific' },
  { city: 'Bangkok', country: 'Thailand', region: 'Asia Pacific' },
  { city: 'Ho Chi Minh City', country: 'Vietnam', region: 'Asia Pacific' },
  { city: 'Hanoi', country: 'Vietnam', region: 'Asia Pacific' },
  { city: 'Jakarta', country: 'Indonesia', region: 'Asia Pacific' },
  { city: 'Surabaya', country: 'Indonesia', region: 'Asia Pacific' },
  { city: 'Kuala Lumpur', country: 'Malaysia', region: 'Asia Pacific' },
  { city: 'Port Klang', country: 'Malaysia', region: 'Asia Pacific' },
  { city: 'Manila', country: 'Philippines', region: 'Asia Pacific' },
  { city: 'Taipei', country: 'Taiwan', region: 'Asia Pacific' },
  { city: 'Sydney', country: 'Australia', region: 'Asia Pacific' },
  { city: 'Melbourne', country: 'Australia', region: 'Asia Pacific' },
  { city: 'Auckland', country: 'New Zealand', region: 'Asia Pacific' },
  
  // Europe
  { city: 'Rotterdam', country: 'Netherlands', region: 'Europe' },
  { city: 'Amsterdam', country: 'Netherlands', region: 'Europe' },
  { city: 'Hamburg', country: 'Germany', region: 'Europe' },
  { city: 'Frankfurt', country: 'Germany', region: 'Europe' },
  { city: 'Antwerp', country: 'Belgium', region: 'Europe' },
  { city: 'London', country: 'UK', region: 'Europe' },
  { city: 'Felixstowe', country: 'UK', region: 'Europe' },
  { city: 'Le Havre', country: 'France', region: 'Europe' },
  { city: 'Marseille', country: 'France', region: 'Europe' },
  { city: 'Milan', country: 'Italy', region: 'Europe' },
  { city: 'Genoa', country: 'Italy', region: 'Europe' },
  { city: 'Barcelona', country: 'Spain', region: 'Europe' },
  { city: 'Valencia', country: 'Spain', region: 'Europe' },
  { city: 'Piraeus', country: 'Greece', region: 'Europe' },
  { city: 'Gdansk', country: 'Poland', region: 'Europe' },
  { city: 'Istanbul', country: 'Turkey', region: 'Europe' },
  
  // North America
  { city: 'Los Angeles', country: 'USA', region: 'North America' },
  { city: 'Long Beach', country: 'USA', region: 'North America' },
  { city: 'New York', country: 'USA', region: 'North America' },
  { city: 'Newark', country: 'USA', region: 'North America' },
  { city: 'Miami', country: 'USA', region: 'North America' },
  { city: 'Houston', country: 'USA', region: 'North America' },
  { city: 'Chicago', country: 'USA', region: 'North America' },
  { city: 'Seattle', country: 'USA', region: 'North America' },
  { city: 'Savannah', country: 'USA', region: 'North America' },
  { city: 'Vancouver', country: 'Canada', region: 'North America' },
  { city: 'Toronto', country: 'Canada', region: 'North America' },
  { city: 'Montreal', country: 'Canada', region: 'North America' },
  { city: 'Mexico City', country: 'Mexico', region: 'North America' },
  { city: 'Manzanillo', country: 'Mexico', region: 'North America' },
  
  // Africa
  { city: 'Durban', country: 'South Africa', region: 'Africa' },
  { city: 'Cape Town', country: 'South Africa', region: 'Africa' },
  { city: 'Johannesburg', country: 'South Africa', region: 'Africa' },
  { city: 'Lagos', country: 'Nigeria', region: 'Africa' },
  { city: 'Mombasa', country: 'Kenya', region: 'Africa' },
  { city: 'Nairobi', country: 'Kenya', region: 'Africa' },
  { city: 'Casablanca', country: 'Morocco', region: 'Africa' },
  { city: 'Tangier', country: 'Morocco', region: 'Africa' },
  { city: 'Cairo', country: 'Egypt', region: 'Africa' },
  { city: 'Alexandria', country: 'Egypt', region: 'Africa' },
  { city: 'Dar es Salaam', country: 'Tanzania', region: 'Africa' },
  { city: 'Accra', country: 'Ghana', region: 'Africa' },
  
  // South America
  { city: 'Santos', country: 'Brazil', region: 'South America' },
  { city: 'São Paulo', country: 'Brazil', region: 'South America' },
  { city: 'Rio de Janeiro', country: 'Brazil', region: 'South America' },
  { city: 'Buenos Aires', country: 'Argentina', region: 'South America' },
  { city: 'Callao', country: 'Peru', region: 'South America' },
  { city: 'Lima', country: 'Peru', region: 'South America' },
  { city: 'Cartagena', country: 'Colombia', region: 'South America' },
  { city: 'Bogota', country: 'Colombia', region: 'South America' },
  { city: 'Santiago', country: 'Chile', region: 'South America' },
  { city: 'Valparaiso', country: 'Chile', region: 'South America' },
  { city: 'Guayaquil', country: 'Ecuador', region: 'South America' },
];

// Get unique regions for grouping
export const regions = [...new Set(globalLocations.map(loc => loc.region))];

// Group locations by region
export const locationsByRegion = regions.reduce((acc, region) => {
  acc[region] = globalLocations.filter(loc => loc.region === region);
  return acc;
}, {} as Record<string, GlobalLocation[]>);
