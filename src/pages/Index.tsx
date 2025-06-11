import React, { useState } from 'react';
import { MapPin } from 'lucide-react';
import { PhotoUploader } from '@/components/PhotoUploader';
import { PhotoFilter } from '@/components/PhotoFilter';
import { findMatchingZone, LocationZone, useZones } from '@/components/LocationZones';
import { toast } from 'sonner';

const Index = () => {
  const [capturedImage, setCapturedImage] = useState<string>('');
  const [currentZone, setCurrentZone] = useState<LocationZone | null>(null);
  const [showResult, setShowResult] = useState(false);
  const { data: zones = [] } = useZones();

  const handlePhotoCapture = (imageData: string, location?: { lat: number; lng: number }) => {
    setCapturedImage(imageData);
    
    if (location) {
      const matchingZone = findMatchingZone(location, zones);
      setCurrentZone(matchingZone);
      
      if (matchingZone) {
        toast.success(`🎉 Welcome to ${matchingZone.name}!`);
      } else {
        toast.info('Photo captured! No special location filter available.');
      }
    } else {
      setCurrentZone(null);
      toast.warning('Location unavailable - we can\'t confim your visit.');
    }
    
    setShowResult(true);
  };

  const handleReset = () => {
    setCapturedImage('');
    setCurrentZone(null);
    setShowResult(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <MapPin className="w-8 h-8 text-purple-600 mr-2" />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              CityCollector
            </h1>
          </div>
          <p className="text-gray-600 max-w-md mx-auto leading-relaxed">
            Take a photo and we'll automatically detect its location. If it was taken in one of our special zones, we’ll confirm your visit!
          </p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col items-center">
          {!showResult ? (
            <>
              <PhotoUploader onPhotoCapture={handlePhotoCapture} />
            </>
          ) : (
            <PhotoFilter
              imageData={capturedImage}
              zone={currentZone}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;