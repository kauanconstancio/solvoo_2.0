import { useState, useEffect } from 'react';

const MAPBOX_TOKEN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-mapbox-token`;

export const useMapboxToken = () => {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const response = await fetch(MAPBOX_TOKEN_URL, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch Mapbox token');
        }

        const data = await response.json();
        setToken(data.token);
      } catch (err) {
        console.error('Error fetching Mapbox token:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchToken();
  }, []);

  return { token, isLoading, error };
};
