import { useState, useEffect, useCallback } from 'react';

interface ExchangeRate {
  compra: number;
  venta: number;
  fecha: string;
}

export const useSunatExchangeRate = () => {
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchExchangeRate = useCallback(async (isManual = false) => {
    if (isManual) {
      setIsRefreshing(true);
    } else {
      setLoading(true);
    }
    
    try {
      // SUNAT API endpoint (sin parámetro de fecha para obtener el tipo actual)
      const response = await fetch('https://corsproxy.io/?https://api.apis.net.pe/v1/tipo-cambio-sunat');
      
      if (!response.ok) {
        throw new Error('Error al obtener tipo de cambio');
      }

      const data = await response.json();
      setExchangeRate(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching exchange rate:', err);
      setError('No se pudo obtener el tipo de cambio');
      // Fallback to a default value
      setExchangeRate({
        compra: 3.70,
        venta: 3.72,
        fecha: new Date().toISOString().split('T')[0]
      });
    } finally {
      setLoading(false);
      if (isManual) {
        setIsRefreshing(false);
      }
    }
  }, []);

  const refresh = useCallback(() => {
    fetchExchangeRate(true);
  }, [fetchExchangeRate]);

  useEffect(() => {
    fetchExchangeRate();
    // Update every hour
    const interval = setInterval(() => fetchExchangeRate(), 3600000);

    return () => clearInterval(interval);
  }, [fetchExchangeRate]);

  return { exchangeRate, loading, error, isRefreshing, refresh };
};
