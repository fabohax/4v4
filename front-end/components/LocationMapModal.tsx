'use client';

import { useState, useEffect } from 'react';
import { X, ExternalLink, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface LocationMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocation?: { lat: number; lng: number };
  onLocationSelect?: (location: { lat: number; lng: number }) => void;
}

export default function LocationMapModal({
  isOpen,
  onClose,
  initialLocation,
  onLocationSelect
}: LocationMapModalProps) {
  const [mapUrl, setMapUrl] = useState<string>('');
  const [mapLoading, setMapLoading] = useState<boolean>(true);
  const [mapError, setMapError] = useState<boolean>(false);
  const [currentLat, setCurrentLat] = useState<string>('');
  const [currentLng, setCurrentLng] = useState<string>('');
  const [gettingLocation, setGettingLocation] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      // Initialize current coordinates with initial location or default values
      if (initialLocation) {
        setCurrentLat(initialLocation.lat.toString());
        setCurrentLng(initialLocation.lng.toString());
      } else {
        setCurrentLat('');
        setCurrentLng('');
      }
    }
  }, [isOpen, initialLocation]);

  useEffect(() => {
    if (isOpen && currentLat && currentLng) {
      setMapLoading(true);
      setMapError(false);
      
      // Create OpenStreetMap URL with marker
      const lat = parseFloat(currentLat);
      const lng = parseFloat(currentLng);
      
      // Validate coordinates
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        setMapError(true);
        setMapLoading(false);
        return;
      }
      
      const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;
      setMapUrl(osmUrl);
      
      // Set a timeout to handle loading states
      const loadTimeout = setTimeout(() => {
        setMapLoading(false);
      }, 3000);
      
      return () => clearTimeout(loadTimeout);
    } else if (isOpen) {
      // No coordinates provided
      setMapUrl('');
      setMapLoading(false);
      setMapError(false);
    }
  }, [isOpen, currentLat, currentLng]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLat(position.coords.latitude.toString());
        setCurrentLng(position.coords.longitude.toString());
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = 'Unable to get your location.';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location access denied. Please enable location permissions.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }
        alert(errorMessage);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }
    );
  };

  const handleSaveLocation = () => {
    const lat = parseFloat(currentLat);
    const lng = parseFloat(currentLng);
    
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      alert('Please enter valid coordinates (Latitude: -90 to 90, Longitude: -180 to 180)');
      return;
    }
    
    if (onLocationSelect) {
      onLocationSelect({ lat, lng });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#000] border border-[#333] rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#333]">
          <h2 className="text-xl font-semibold text-white">NFT Location</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Map Content */}
        <div className="p-4">
          {/* Coordinate Input Section */}
          <div className="mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label htmlFor="lat-input" className="text-sm text-gray-400 mb-2 block">
                  Latitude (-90 to 90)
                </Label>
                <Input
                  id="lat-input"
                  type="number"
                  step="any"
                  placeholder="e.g., -12.72596"
                  value={currentLat}
                  onChange={(e) => setCurrentLat(e.target.value)}
                  className="border-[#333] bg-[#111] text-white"
                />
              </div>
              <div>
                <Label htmlFor="lng-input" className="text-sm text-gray-400 mb-2 block">
                  Longitude (-180 to 180)
                </Label>
                <Input
                  id="lng-input"
                  type="number"
                  step="any"
                  placeholder="e.g., -77.89962"
                  value={currentLng}
                  onChange={(e) => setCurrentLng(e.target.value)}
                  className="border-[#333] bg-[#111] text-white"
                />
              </div>
            </div>
            
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
                variant="outline"
                className="border-[#333] text-white hover:bg-[#111]"
              >
                <Navigation className="mr-2 h-4 w-4" />
                {gettingLocation ? 'Getting Location...' : 'Use Current Location'}
              </Button>
              <Button
                type="button"
                onClick={handleSaveLocation}
                disabled={!currentLat || !currentLng}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Set This Location
              </Button>
            </div>
          </div>

          {/* Current coordinates display */}
          {currentLat && currentLng && (
            <div className="mb-4 p-3 bg-[#111] border border-[#333] rounded-lg">
              <p className="text-gray-400 text-sm mb-1">Current Coordinates:</p>
              <p className="text-white font-mono text-sm">
                Lat: {parseFloat(currentLat).toFixed(6)}, Lng: {parseFloat(currentLng).toFixed(6)}
              </p>
            </div>
          )}

          {/* Map Iframe */}
          <div className="w-full h-96 rounded-lg overflow-hidden border border-[#333]">
            {!currentLat || !currentLng ? (
              <div className="flex items-center justify-center h-full bg-[#111] text-gray-400">
                <div className="text-center">
                  <p className="mb-2">Enter coordinates above to view map</p>
                  <p className="text-sm">Or use &quot;Current Location&quot; to get GPS coordinates</p>
                </div>
              </div>
            ) : mapError ? (
              <div className="flex items-center justify-center h-full bg-[#111] text-gray-400">
                <div className="text-center">
                  <p className="mb-2">Failed to load map</p>
                  <p className="text-sm">Invalid coordinates or network error</p>
                </div>
              </div>
            ) : mapUrl ? (
              <div className="relative w-full h-full">
                {mapLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#111] text-gray-400 z-10">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                      <p>Loading map...</p>
                    </div>
                  </div>
                )}
                <iframe
                  src={mapUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="NFT Location Map"
                  onLoad={() => setMapLoading(false)}
                  onError={() => {
                    setMapLoading(false);
                    setMapError(true);
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-[#111] text-gray-400">
                Preparing map...
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 mt-4">
            {currentLat && currentLng && !isNaN(parseFloat(currentLat)) && !isNaN(parseFloat(currentLng)) && (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    const lat = parseFloat(currentLat);
                    const lng = parseFloat(currentLng);
                    const osmUrl = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`;
                    window.open(osmUrl, '_blank');
                  }}
                  className="border-[#333] text-white hover:bg-[#111]"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Open in OpenStreetMap
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const lat = parseFloat(currentLat);
                    const lng = parseFloat(currentLng);
                    const googleUrl = `https://www.google.com/maps?q=${lat},${lng}`;
                    window.open(googleUrl, '_blank');
                  }}
                  className="border-[#333] text-white hover:bg-[#111]"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Google Maps
                </Button>
              </>
            )}
            <Button
              onClick={onClose}
              variant="outline"
              className="border-[#333] text-white hover:bg-[#111]"
            >
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}