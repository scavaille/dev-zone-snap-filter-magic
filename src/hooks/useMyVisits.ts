import { useQuery } from '@tanstack/react-query';

export const fetchMyVisits = async (): Promise<string[]> => {
  const res = await fetch('/wp-json/citycollector/v1/my-visits', {
    credentials: 'include', // indispensable pour que WP REST API reconnaisse le user
    headers: {
      'X-WP-Nonce': (window as any).collectorAppSettings?.restNonce ?? '',
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch my visits: ${res.status}`);
  }

  return res.json();
};

export const useMyVisits = () =>
  useQuery({
    queryKey: ['myVisits'],
    queryFn: fetchMyVisits,
    staleTime: 5 * 60 * 1000, // 5 min de cache (optionnel, améliore UX)
  });
