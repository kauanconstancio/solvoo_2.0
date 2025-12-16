// Brazilian state capitals coordinates
export const stateCoordinates: Record<string, { lat: number; lng: number }> = {
  'AC': { lat: -9.9754, lng: -67.8249 },
  'AL': { lat: -9.6498, lng: -35.7089 },
  'AP': { lat: 0.0349, lng: -51.0694 },
  'AM': { lat: -3.1190, lng: -60.0217 },
  'BA': { lat: -12.9714, lng: -38.5014 },
  'CE': { lat: -3.7172, lng: -38.5434 },
  'DF': { lat: -15.7942, lng: -47.8822 },
  'ES': { lat: -20.3155, lng: -40.3128 },
  'GO': { lat: -16.6864, lng: -49.2643 },
  'MA': { lat: -2.5307, lng: -44.3068 },
  'MT': { lat: -15.6014, lng: -56.0979 },
  'MS': { lat: -20.4697, lng: -54.6201 },
  'MG': { lat: -19.9167, lng: -43.9345 },
  'PA': { lat: -1.4558, lng: -48.4902 },
  'PB': { lat: -7.1195, lng: -34.8450 },
  'PR': { lat: -25.4284, lng: -49.2733 },
  'PE': { lat: -8.0476, lng: -34.8770 },
  'PI': { lat: -5.0920, lng: -42.8038 },
  'RJ': { lat: -22.9068, lng: -43.1729 },
  'RN': { lat: -5.7945, lng: -35.2110 },
  'RS': { lat: -30.0346, lng: -51.2177 },
  'RO': { lat: -8.7612, lng: -63.9039 },
  'RR': { lat: 2.8198, lng: -60.6715 },
  'SC': { lat: -27.5954, lng: -48.5480 },
  'SP': { lat: -23.5505, lng: -46.6333 },
  'SE': { lat: -10.9472, lng: -37.0731 },
  'TO': { lat: -10.1689, lng: -48.3317 },
};

// Common city coordinates (approximate based on city name patterns)
export const cityCoordinates: Record<string, { lat: number; lng: number }> = {
  // Espírito Santo
  'serra': { lat: -20.1286, lng: -40.3078 },
  'vitoria': { lat: -20.3155, lng: -40.3128 },
  'vila-velha': { lat: -20.3297, lng: -40.2925 },
  'cariacica': { lat: -20.2635, lng: -40.4165 },
  
  // São Paulo
  'sao-paulo': { lat: -23.5505, lng: -46.6333 },
  'campinas': { lat: -22.9099, lng: -47.0626 },
  'santos': { lat: -23.9608, lng: -46.3336 },
  
  // Rio de Janeiro
  'rio-de-janeiro': { lat: -22.9068, lng: -43.1729 },
  'niteroi': { lat: -22.8832, lng: -43.1034 },
  
  // Minas Gerais
  'belo-horizonte': { lat: -19.9167, lng: -43.9345 },
  
  // Paraná
  'curitiba': { lat: -25.4284, lng: -49.2733 },
  
  // Rio Grande do Sul
  'porto-alegre': { lat: -30.0346, lng: -51.2177 },
  
  // Bahia
  'salvador': { lat: -12.9714, lng: -38.5014 },
  
  // Pernambuco
  'recife': { lat: -8.0476, lng: -34.8770 },
  
  // Ceará
  'fortaleza': { lat: -3.7172, lng: -38.5434 },
  
  // Distrito Federal
  'brasilia': { lat: -15.7942, lng: -47.8822 },
  
  // Amazonas
  'manaus': { lat: -3.1190, lng: -60.0217 },
};

export const getCoordinatesForService = (state: string, city: string): { lat: number; lng: number } | null => {
  // Try to find city coordinates first
  const cityKey = city.toLowerCase();
  if (cityCoordinates[cityKey]) {
    return cityCoordinates[cityKey];
  }

  // Fall back to state capital coordinates with some random offset for distribution
  const stateKey = state.toUpperCase();
  if (stateCoordinates[stateKey]) {
    const base = stateCoordinates[stateKey];
    // Add small random offset to avoid overlapping markers
    const offset = () => (Math.random() - 0.5) * 0.5;
    return {
      lat: base.lat + offset(),
      lng: base.lng + offset(),
    };
  }

  return null;
};

// Brazil center for initial map view
export const brazilCenter = {
  lat: -14.235,
  lng: -51.9253,
};
