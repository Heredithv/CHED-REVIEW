import { useState, useEffect, useCallback } from 'react';

export interface UseGoogleSheetOptions {
  sheetUrl?: string;
  autoRefreshInterval?: number; // in milliseconds, default e.g. 60000
}

export function useGoogleSheet<T = any>(
  sheetTabName: string,
  initialFallbackData: T[] = [],
  mode: string = 'default',
  options?: UseGoogleSheetOptions
) {
  const [data, setData] = useState<T[]>(initialFallbackData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchSheetData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Check if a custom Google Sheet CSV URL is set in localStorage or env
      const configuredUrl =
        options?.sheetUrl ||
        (typeof window !== 'undefined' ? localStorage.getItem('GOOGLE_SHEET_CSV_URL') : null) ||
        (import.meta.env.VITE_GOOGLE_SHEET_CSV_URL as string | undefined);

      if (configuredUrl) {
        const response = await fetch(configuredUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch sheet data: ${response.statusText}`);
        }
        const text = await response.text();
        // Parse CSV if JSON is not returned
        try {
          const parsedJson = JSON.parse(text);
          if (Array.isArray(parsedJson)) {
            setData(parsedJson);
          }
        } catch {
          // Plain text / CSV response, fallback to initial array if parse fails
        }
      } else {
        // Fall back to initial dataset
        setData((prevData) => (prevData && prevData.length > 0 ? prevData : initialFallbackData));
      }

      const now = new Date();
      setLastUpdated(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      console.warn(`useGoogleSheet error for tab "${sheetTabName}":`, err);
      setError(err?.message || 'Failed to fetch live sheet');
    } finally {
      setLoading(false);
    }
  }, [sheetTabName, initialFallbackData, options?.sheetUrl]);

  useEffect(() => {
    fetchSheetData();
  }, [fetchSheetData]);

  const refreshNow = () => {
    fetchSheetData();
  };

  return {
    data,
    loading,
    error,
    lastUpdated,
    refreshNow,
  };
}
