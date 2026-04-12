import locationData from "./locations.json";

const allLocations: string[] = [
  ...locationData.chennaiLocalities.map((l) => `${l}, Chennai`),
  ...locationData.tamilNaduCities.map((c) => `${c}, Tamil Nadu`),
  ...locationData.cities.map((c) => `${c}, India`),
];

// Deduplicate
const uniqueLocations = [...new Set(allLocations)];

export function searchLocations(query: string, limit = 8): string[] {
  if (!query || query.length < 2) return [];
  const lower = query.toLowerCase();
  return uniqueLocations
    .filter((loc) => loc.toLowerCase().includes(lower))
    .slice(0, limit);
}

export { uniqueLocations };
