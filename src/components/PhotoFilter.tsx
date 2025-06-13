import React, { useRef, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { LocationZone } from './LocationZones';
import { useMyVisits } from '@/hooks/useMyVisits';
import { useQueryClient } from '@tanstack/react-query';

interface PhotoFilterProps {
  imageData: string;
  zone: LocationZone | null;
  onReset: () => void;
  matchingZone: boolean;
  locationUnavailable: boolean;
}

export const PhotoFilter: React.FC<PhotoFilterProps> = ({
  imageData,
  zone,
  onReset,
  matchingZone,
  locationUnavailable,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [filteredImageData, setFilteredImageData] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [visitCreated, setVisitCreated] = useState<boolean>(false);
  const { data: myVisits, isLoading, isFetching } = useMyVisits();
  const alreadyVisited = myVisits?.includes(zone?.id ?? '') && !visitCreated;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
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

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      if (zone) applyLocationFilter(ctx, width, height, zone);

      setFilteredImageData(canvas.toDataURL('image/jpeg', 0.7));
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
      const response = await fetch(
        window.collectorAppSettings.restUrl + 'citycollector/v1/create-visit',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-WP-Nonce': window.collectorAppSettings.restNonce,
          },
          body: new URLSearchParams({
            poi_id: zone?.id || '',
            image_data_url: filteredImageData,
          }),
        }
      );
      const data = await response.json();
      const message =
        typeof data?.message === 'string'
          ? data.message
          : '🚫 Unexpected server response.';

      if (response.ok) {
        toast.success(data.message);
        setVisitCreated(true);
        queryClient.invalidateQueries(['myVisits']);
      } else {
        toast.error(data.message || '🚫 Could not collect the stamp.');
      }
    } catch (error) {
      console.error(error);
      toast.error('🚫 Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1️⃣ Cas géoloc indisponible
  if (locationUnavailable) {
    return (
      <div className="w-full max-w-md mx-auto p-6 space-y-3">
        <p className="text-red-600 font-bold text-center break-normal">
          📍 Oops! We can’t pinpoint your location.
          <br />
          Please grant location access and give it another try!
        </p>
        <Button
          onClick={() => {
            setVisitCreated(false);
            onReset();
          }}
          variant="outline"
          className="w-full"
          size="lg"
        >
          Retake photo
        </Button>
      </div>
    );
  }

  // 2️⃣ Si pas de zone, rien
  if (!zone) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        {/* Zone de preview du canvas */}
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

        {/* Zone du bouton ou du message */}
        <div className="p-6">
          {isLoading || isFetching ? (
            <p className="text-center text-gray-500">
              Loading your visits...
            </p>
          ) : alreadyVisited ? (
            <p className="text-blue-600 font-bold text-center break-normal">
              🏅 You've already collected this stamp! <br />
              Keep exploring and collect them all!
            </p>
          ) : !matchingZone ? (
            <>
              <p className="text-red-600 font-bold text-center break-normal">
                📍 You're a bit too far from the spot. <br />
                Move closer to collect this stamp!
              </p>
              <Button
                onClick={() => {
                  setVisitCreated(false);
                  onReset();
                }}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Retry
              </Button>
            </>
          ) : visitCreated ? (
            <p className="text-green-600 font-bold text-center break-normal">
              ✅ You've collected a new stamp! <br />
              Keep exploring and collect them all!
            </p>
          ) : (
            <>
              <p className="text-green-600 font-bold text-center break-normal">
                🎯 You're at the perfect spot! <br />
                Ready to collect your stamp?
              </p>
              <Button
                onClick={handleCreateVisit}
                disabled={!filteredImageData || isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      className="w-5 h-5 animate-spin mr-2"
                    />
                    Collecting your stamp…
                  </>
                ) : (
                  <>👉 Collect my stamp</>
                )}
              </Button>
              <Button
                onClick={() => {
                  setVisitCreated(false);
                  onReset();
                }}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Retake photo
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
