import { useQuery } from '@tanstack/react-query';

export interface LocationZone {
  id: string;
  name: string;
  coordinates: { lat: number; lng: number };
  radius: number; // in meters
  filterImage: string;
  description: string;
}


export const fetchZones = async (): Promise<LocationZone[]> => {
  const res = await fetch('/wp-json/citycollector/v1/zones');
  if (!res.ok) {
    throw new Error('Failed to fetch zones');
  }
  const data: LocationZone[] = await res.json();
  return data;
};


export const useZones = () =>
  useQuery({
  queryKey: ['zones'],
  queryFn: fetchZones,
  staleTime: 5 * 60 * 1000, // les zones ne changent pas souvent → 5 min en cache
  retry: 2,                 // réessayer 2 fois en cas d'erreur réseau temporaire
});


export const isLocationInZone = (
  userLocation: { lat: number; lng: number },
  zone: LocationZone
): boolean => {
  const distance = calculateDistance(
    userLocation.lat,
    userLocation.lng,
    zone.coordinates.lat,
    zone.coordinates.lng
  );
  
  return distance <= zone.radius;
};

const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};

export const findMatchingZone = (
  userLocation: { lat: number; lng: number },
  zones: LocationZone[] = []
): LocationZone | null => {
  if (!zones.length) return null;

  for (const zone of zones) {
    if (isLocationInZone(userLocation, zone)) {
      return zone;
    }
  }
  return null;
};
