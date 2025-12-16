import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useMapboxToken } from '@/hooks/useMapboxToken';
import { getCoordinatesForService, brazilCenter } from '@/data/brazilCoordinates';
import { getCategoryConfig } from '@/data/categoryIcons';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Service {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  price: string;
  state: string;
  city: string;
  images?: string[];
}

interface ServicesMapProps {
  services: Service[];
  isLoading?: boolean;
}

export const ServicesMap = ({ services, isLoading = false }: ServicesMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { token, isLoading: tokenLoading, error: tokenError } = useMapboxToken();
  const navigate = useNavigate();
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !token || map.current) return;

    mapboxgl.accessToken = token;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [brazilCenter.lng, brazilCenter.lat],
      zoom: 4,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    map.current.on('load', () => {
      setMapReady(true);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, [token]);

  useEffect(() => {
    if (!map.current || !mapReady || isLoading) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each service
    services.forEach((service) => {
      const coords = getCoordinatesForService(service.state, service.city);
      if (!coords) return;

      const categoryConfig = getCategoryConfig(service.category);
      const categoryColor = categoryConfig?.color || 'hsl(var(--primary))';

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'service-marker';
      el.style.cssText = `
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary)/0.8));
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        cursor: pointer;
        transition: transform 0.2s ease;
      `;

      el.addEventListener('mouseenter', () => {
        el.style.transform = 'rotate(-45deg) scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'rotate(-45deg) scale(1)';
      });

      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.innerHTML = `
        <div style="min-width: 200px; font-family: system-ui, sans-serif;">
          ${service.images?.[0] ? `
            <img src="${service.images[0]}" alt="${service.title}" style="width: 100%; height: 100px; object-fit: cover; border-radius: 8px 8px 0 0; margin: -10px -10px 10px -10px; width: calc(100% + 20px);" />
          ` : ''}
          <h3 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 600; color: hsl(var(--foreground));">${service.title}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: hsl(var(--muted-foreground));">${categoryConfig?.label || service.category}${service.subcategory ? ` • ${service.subcategory}` : ''}</p>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: hsl(var(--muted-foreground));">📍 ${service.city}, ${service.state}</p>
          <p style="margin: 0; font-size: 14px; font-weight: 600; color: hsl(var(--primary));">${service.price}</p>
          <button id="view-service-${service.id}" style="
            width: 100%;
            margin-top: 8px;
            padding: 8px 12px;
            background: hsl(var(--primary));
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
          ">Ver detalhes</button>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25 })
        .setDOMContent(popupContent);

      popup.on('open', () => {
        const btn = document.getElementById(`view-service-${service.id}`);
        if (btn) {
          btn.addEventListener('click', () => {
            navigate(`/servico/${service.id}`);
          });
        }
      });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([coords.lng, coords.lat])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit map to markers if there are any
    if (services.length > 0 && markersRef.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      services.forEach((service) => {
        const coords = getCoordinatesForService(service.state, service.city);
        if (coords) {
          bounds.extend([coords.lng, coords.lat]);
        }
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 10,
        });
      }
    }
  }, [services, mapReady, isLoading, navigate]);

  if (tokenLoading || isLoading) {
    return (
      <div className="relative w-full h-full min-h-[400px]">
        <Skeleton className="w-full h-full rounded-lg" />
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-muted-foreground">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  if (tokenError) {
    return (
      <div className="relative w-full h-full min-h-[400px] bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-destructive mx-auto" />
          <p className="text-destructive font-medium">Erro ao carregar mapa</p>
          <p className="text-sm text-muted-foreground">{tokenError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-lg" />
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md">
        <p className="text-sm font-medium">{services.length} serviços encontrados</p>
      </div>
    </div>
  );
};
