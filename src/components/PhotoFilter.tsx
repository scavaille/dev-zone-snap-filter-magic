import React, { useRef, useEffect, useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LocationZone } from './LocationZones';
import { useMyVisits } from '@/hooks/useMyVisits'; // adapte le chemin si besoin

interface PhotoFilterProps {
  imageData: string;
  zone: LocationZone | null;
  onReset: () => void;
}

export const PhotoFilter: React.FC<PhotoFilterProps> = ({ imageData, zone, onReset }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [filteredImageData, setFilteredImageData] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const { data: myVisits, isLoading, isFetching, error } = useMyVisits();
  const alreadyVisited = myVisits?.includes(zone?.id ?? '');

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      // Dimensions originales
      let width = img.width;
      let height = img.height;

      // Taille max qu'on souhaite
      const maxSize = 1200;

      if (width > maxSize || height > maxSize) {
        const aspectRatio = width / height;
        if (width > height) {
          width = maxSize;
          height = Math.round(maxSize / aspectRatio);
        } else {
          height = maxSize;
          width = Math.round(maxSize * aspectRatio);
        }
      }

      // Redimensionnement du canvas
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Application du filtre + génération de l'image compressée
      if (zone) applyLocationFilter(ctx, width, height, zone);
      setFilteredImageData(canvas.toDataURL('image/jpeg', 0.7)); // compression 0.7
    };

    img.src = imageData;
  }, [imageData, zone]);

  const applyLocationFilter = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    zone: LocationZone
  ) => {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    switch (zone.id) {
      case 'central-park':
        gradient.addColorStop(0, 'rgba(34,197,94,0.15)');
        gradient.addColorStop(1, 'rgba(22,163,74,0.1)');
        break;
      case 'golden-gate':
        gradient.addColorStop(0, 'rgba(249,115,22,0.15)');
        gradient.addColorStop(1, 'rgba(234,88,12,0.1)');
        break;
      case 'times-square':
        gradient.addColorStop(0, 'rgba(147,51,234,0.15)');
        gradient.addColorStop(1, 'rgba(126,34,206,0.1)');
        break;
      default:
        gradient.addColorStop(0, 'rgba(99,102,241,0.15)');
        gradient.addColorStop(1, 'rgba(79,70,229,0.1)');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(zone.name, width / 2, height - 40);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '16px Arial';
    ctx.fillText(zone.description, width / 2, height - 15);
  };

  const handleCreateVisit = async () => {
    if (!filteredImageData || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const response = await fetch('/create/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          poi_id: zone?.id || '',
          image_data_url: filteredImageData,
        }),
      });

      const text = await response.text();
      const endIdx = text.search(/<|\r?\n/);
      const message = endIdx > 0 ? text.substring(0, endIdx).trim() : text.trim();

      if (response.ok) {
        toast.success(message);
      } else {
        toast.error(message || 'Erreur lors de la création de la visite.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erreur réseau lors de la création de la visite.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-auto max-h-96 object-contain"
          />
          {zone && (
            <div className="absolute top-4 left-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
              📍 {zone.name}
            </div>
          )}
        </div>

        <div className="p-6">
          {zone && (
            <div className="space-y-3">
              {isLoading || isFetching ? (
                <p className="text-center text-gray-500">Loading your visits...</p>
              ) : alreadyVisited ? (
                <p className="text-green-600 font-bold text-center">
                  ✅ You have already visited this place!
                </p>
              ) : (
                <Button
                  onClick={handleCreateVisit}
                  disabled={!filteredImageData || isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Submitting…
                    </>
                  ) : (
                    <>Confirm and save this picture</>
                  )}
                </Button>
              )}
            </div>
          )}

          <Button
            onClick={onReset}
            variant="outline"
            className="w-full mt-4"
            size="lg"
          >
            Take Another Photo
          </Button>
        </div>
      </div>
    </div>
  );
};
