import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Crosshair, AlertCircle } from 'lucide-react';

interface MapLocationPickerProps {
  latitude: number;
  longitude: number;
  onChangeLocation: (lat: number, lng: number) => void;
  heightClass?: string;
  storeLat?: number;
  storeLng?: number;
}

// Fix default Leaflet icon paths in bundlers
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const storeIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

export const MapLocationPicker: React.FC<MapLocationPickerProps> = ({
  latitude,
  longitude,
  onChangeLocation,
  heightClass = 'h-64',
  storeLat,
  storeLng
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isGettingGps, setIsGettingGps] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default to Indonesia (Jakarta center) if coordinates invalid
    const initialLat = latitude || -6.2088;
    const initialLng = longitude || 106.8456;

    // Initialize map
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLng],
      zoom: 14,
      zoomControl: true,
      scrollWheelZoom: true
    });
    mapInstanceRef.current = map;

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> kontributor',
      maxZoom: 19
    }).addTo(map);

    // If store coordinates provided, display store marker
    if (storeLat && storeLng) {
      const storeMarker = L.marker([storeLat, storeLng], { icon: storeIcon }).addTo(map);
      storeMarker.bindPopup('<b>Kios SAYURKU</b><br>Lokasi Asal Pengiriman Sayur');
    }

    // Add customer delivery marker
    const marker = L.marker([initialLat, initialLng], {
      icon: customIcon,
      draggable: true
    }).addTo(map);
    markerRef.current = marker;
    marker.bindPopup('<b>Titik Antar Pesanan</b><br>Geser pin atau klik peta untuk ubah').openPopup();

    // On marker drag end
    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      onChangeLocation(Number(pos.lat.toFixed(6)), Number(pos.lng.toFixed(6)));
    });

    // On map click, move marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      marker.setLatLng(e.latlng);
      onChangeLocation(Number(e.latlng.lat.toFixed(6)), Number(e.latlng.lng.toFixed(6)));
    });

    // Handle container resize
    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update marker position if external coordinates change
  useEffect(() => {
    if (markerRef.current && mapInstanceRef.current) {
      const currentPos = markerRef.current.getLatLng();
      if (
        Math.abs(currentPos.lat - latitude) > 0.0001 ||
        Math.abs(currentPos.lng - longitude) > 0.0001
      ) {
        markerRef.current.setLatLng([latitude, longitude]);
        mapInstanceRef.current.setView([latitude, longitude], mapInstanceRef.current.getZoom());
      }
    }
  }, [latitude, longitude]);

  // Handle GPS location request (with user browser permission)
  const handleGetGpsLocation = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Perangkat atau peramban Anda tidak mendukung sensor GPS.');
      return;
    }

    setIsGettingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsGettingGps(false);
        const lat = Number(pos.coords.latitude.toFixed(6));
        const lng = Number(pos.coords.longitude.toFixed(6));
        onChangeLocation(lat, lng);
        if (mapInstanceRef.current && markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
          mapInstanceRef.current.setView([lat, lng], 16);
          markerRef.current.bindPopup('<b>Lokasi GPS Anda Ditemukan!</b>').openPopup();
        }
      },
      (err) => {
        setIsGettingGps(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Izin akses lokasi ditolak. Anda dapat memilih lokasi manual di peta.');
        } else {
          setGpsError('Gagal mendeteksi lokasi GPS. Silakan tentukan titik di peta.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 font-medium flex items-center space-x-1">
          <MapPin className="w-3.5 h-3.5 text-emerald-600" />
          <span>Klik peta atau geser pin untuk menentukan titik antar</span>
        </span>
        <button
          type="button"
          onClick={handleGetGpsLocation}
          disabled={isGettingGps}
          className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 font-semibold flex items-center space-x-1 transition disabled:opacity-50"
        >
          <Navigation className={`w-3 h-3 ${isGettingGps ? 'animate-spin' : ''}`} />
          <span>{isGettingGps ? 'Mencari GPS...' : 'Gunakan GPS Saya'}</span>
        </button>
      </div>

      {gpsError && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center space-x-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{gpsError}</span>
        </div>
      )}

      {/* Map Element */}
      <div 
        ref={mapContainerRef} 
        className={`w-full ${heightClass} rounded-xl border border-gray-200 shadow-inner z-0 overflow-hidden relative`}
      />

      <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono bg-gray-50 px-2.5 py-1 rounded-lg">
        <span>Titik Koordinat: {latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
        <span className="text-emerald-700 font-sans font-semibold">📍 Siap Dipakai</span>
      </div>
    </div>
  );
};
