import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, ExternalLink, Compass, Copy, Check, Layers } from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface GoogleMapViewProps {
  name: string;
  address: string;
  landmarks?: string;
  zone?: string;
  lat?: number;
  lng?: number;
  height?: string;
  zoom?: number;
  allowPicker?: boolean;
  onCoordinatesChange?: (coords: { lat: number; lng: number }) => void;
}

// Default Maputo Center (Av. 25 de Setembro / Baixa)
const DEFAULT_MAPUTO_CENTER = { lat: -25.9692, lng: 32.5732 };

export default function GoogleMapView({
  name,
  address,
  landmarks,
  zone,
  lat = DEFAULT_MAPUTO_CENTER.lat,
  lng = DEFAULT_MAPUTO_CENTER.lng,
  height = '240px',
  zoom = 15,
  allowPicker = false,
  onCoordinatesChange
}: GoogleMapViewProps) {
  const [infoOpen, setInfoOpen] = useState(true);
  const [copied, setCopied] = useState(false);
  const [currentPos, setCurrentPos] = useState({ lat, lng });

  // Maputo Search Query for Google Maps App Navigation
  const googleMapsNavUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
    currentPos.lat && currentPos.lng ? `${currentPos.lat},${currentPos.lng}` : `${name} ${address} Maputo`
  )}`;

  const handleCopyLocation = () => {
    const locText = `${name} - ${address}${landmarks ? ` (${landmarks})` : ''} - Google Maps GPS: https://www.google.com/maps/search/?api=1&query=${currentPos.lat},${currentPos.lng}`;
    navigator.clipboard.writeText(locText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const centerPosition = { lat: currentPos.lat || DEFAULT_MAPUTO_CENTER.lat, lng: currentPos.lng || DEFAULT_MAPUTO_CENTER.lng };

  return (
    <div className="space-y-2.5">
      {/* Map Container */}
      <div 
        className="rounded-2xl overflow-hidden border border-ink/12 relative shadow-md bg-slate-900 group"
        style={{ height }}
      >
        {hasValidKey ? (
          <APIProvider apiKey={API_KEY} version="weekly">
            <Map
              defaultCenter={centerPosition}
              center={centerPosition}
              defaultZoom={zoom}
              mapId="DEMO_MAP_ID"
              internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
              style={{ width: '100%', height: '100%' }}
              gestureHandling="greedy"
              onClick={(e) => {
                if (allowPicker && e.detail.latLng) {
                  const newCoords = { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng };
                  setCurrentPos(newCoords);
                  if (onCoordinatesChange) onCoordinatesChange(newCoords);
                }
              }}
            >
              <AdvancedMarker 
                position={centerPosition}
                onClick={() => setInfoOpen(!infoOpen)}
              >
                <Pin background="#D9553F" glyphColor="#FFFFFF" borderColor="#7A2218" />
              </AdvancedMarker>

              {infoOpen && (
                <InfoWindow 
                  position={centerPosition} 
                  onCloseClick={() => setInfoOpen(false)}
                >
                  <div className="p-1 max-w-[220px] space-y-1 font-sans">
                    <div className="font-bold text-xs text-indigo-950 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
                      <span className="truncate">{name}</span>
                    </div>
                    <div className="text-[11px] text-slate-600 line-clamp-2 leading-tight">{address}</div>
                    {zone && (
                      <div className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200 inline-block">
                        📍 {zone}
                      </div>
                    )}
                  </div>
                </InfoWindow>
              )}
            </Map>
          </APIProvider>
        ) : (
          /* Embed Iframe Fallback for standard browsers & missing keys */
          <div className="w-full h-full relative bg-slate-900">
            <iframe
              title={`Mapa de ${name}`}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
              allowFullScreen
              src={`https://maps.google.com/maps?q=${encodeURIComponent(
                `${lat},${lng}` || `${name} ${address} Maputo`
              )}&t=&z=16&ie=UTF8&iwloc=&output=embed`}
            />
          </div>
        )}

        {/* Top Floating Badge */}
        <div className="absolute top-2.5 left-2.5 z-10 bg-slate-950/80 backdrop-blur-md text-white text-[10.5px] font-bold py-1 px-3 rounded-full border border-white/20 shadow-md flex items-center gap-1.5">
          <Compass className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>Google Maps Localização GPS</span>
        </div>

        {/* Coordinates Overlay Badge */}
        <div className="absolute bottom-2.5 right-2.5 z-10 bg-slate-950/85 backdrop-blur-md text-amber-300 font-mono text-[10px] font-bold py-1 px-2.5 rounded-lg border border-amber-400/30 shadow-md flex items-center gap-1">
          <MapPin className="w-3 h-3 text-red-400" />
          <span>{centerPosition.lat.toFixed(4)}, {centerPosition.lng.toFixed(4)}</span>
        </div>
      </div>

      {/* Address & Navigation Buttons */}
      <div className="bg-sand-2/30 border border-ink/10 rounded-xl p-3 space-y-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 flex-1">
            <div className="text-[11px] font-bold text-indigo-deep flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-terracotta shrink-0" />
              <span>{address}</span>
            </div>
            {landmarks && (
              <p className="text-[11px] text-ink/70 leading-relaxed font-medium pl-5">
                💡 <strong>Referência:</strong> {landmarks}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleCopyLocation}
            className="py-1 px-2.5 bg-paper hover:bg-sand-2/50 border border-ink/12 text-ink text-[11px] font-bold rounded-lg transition-all cursor-pointer shrink-0 flex items-center gap-1 shadow-2xs"
            title="Copiar endereço e localização"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-ink/60" />}
            <span>{copied ? 'Copiado' : 'Copiar GPS'}</span>
          </button>
        </div>

        {/* Direct Google Maps Navigation Button */}
        <a
          href={googleMapsNavUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-2.5 px-4 bg-indigo-deep hover:bg-indigo-brand text-paper font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs text-decoration-none"
        >
          <Navigation className="w-4 h-4 text-amber-300" />
          <span>Iniciar Navegação no Google Maps (Avenidas & Ruas)</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80 ml-auto" />
        </a>
      </div>
    </div>
  );
}
