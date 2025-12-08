"use client";

import { useState, useRef, useEffect } from "react";
import { IPCameraWidgetProps } from "@/types";
import { Camera, Play, Pause, AlertCircle } from "lucide-react";
import { WidgetLayout } from "@/components/dashboard/widget-layout";
import { cn } from "@/lib/utils";

interface CameraFeedProps {
  url: string;
  isPlaying: boolean;
  isCompact: boolean;
}

function CameraFeed({ url, isPlaying, isCompact }: CameraFeedProps) {
  const [error, setError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Determine if URL is RTSP
  const isRTSP = url.toLowerCase().startsWith("rtsp://");

  useEffect(() => {
    if (!isPlaying) {
      // Clear any existing interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      // Reset error state using setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setError(false);
        setErrorMessage(null);
      }, 0);
      return;
    }

    if (isRTSP) {
      // For RTSP, use API endpoint to proxy/transcode
      const proxyUrl = `/api/camera/stream?url=${encodeURIComponent(url)}`;
      setTimeout(() => {
        setImageUrl(proxyUrl);
      }, 0);
    } else {
      // Check if URL is an MJPEG stream (multipart/x-mixed-replace)
      const isMJPEG =
        url.toLowerCase().includes("mjpg") ||
        url.toLowerCase().includes("mjpeg") ||
        url.toLowerCase().includes("video.cgi");

      if (isMJPEG) {
        // For MJPEG streams, use the URL directly (browser handles multipart/x-mixed-replace)
        setTimeout(() => {
          setImageUrl(url);
        }, 0);
      } else {
        // For regular HTTP/HTTPS image endpoints, use cache busting
        const updateImage = () => {
          const cacheBuster = `?t=${Date.now()}`;
          const separator = url.includes("?") ? "&" : "?";
          setImageUrl(`${url}${separator}${cacheBuster}`);
        };

        // Update immediately (wrapped in setTimeout to avoid synchronous setState in effect)
        setTimeout(() => {
          updateImage();
        }, 0);

        // Set up interval to refresh image (every 1 second for live feed)
        intervalRef.current = setInterval(updateImage, 1000);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [url, isPlaying, isRTSP]);

  const handleImageError = () => {
    setError(true);
    // Check if URL ends with common image/video extensions or paths
    const hasImagePath =
      /\.(jpg|jpeg|png|gif|bmp|webp|mjpg|mjpeg)$/i.test(url) ||
      /\/?(video|mjpeg|stream|snapshot|image|jpg|jpeg|png)/i.test(url);

    if (!hasImagePath && !isRTSP) {
      setErrorMessage(
        "URL may not be a direct image stream. Try adding /video, /mjpeg, or /snapshot to the URL"
      );
    } else {
      setErrorMessage(
        "Failed to load camera feed. Check URL and network connection."
      );
    }
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-secondary/20 rounded p-4">
        <div className="flex flex-col items-center gap-2 text-muted-foreground text-center">
          <AlertCircle className="h-6 w-6" />
          <span className="text-xs font-medium">Failed to load camera</span>
          {errorMessage && (
            <span className="text-[10px] text-muted-foreground/80 max-w-full break-words">
              {errorMessage}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground/60 mt-2 break-all">
            {url}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-black rounded overflow-hidden">
      {isPlaying && imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={imgRef}
          src={imageUrl}
          alt="Camera feed"
          className={cn(
            "w-full h-full object-contain",
            isCompact ? "object-cover" : "object-contain"
          )}
          onError={handleImageError}
          onLoad={() => {
            setError(false);
            setErrorMessage(null);
          }}
        />
      ) : (
        <div className="flex items-center justify-center h-full">
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <Pause className="h-8 w-8" />
            <span className="text-xs">Paused</span>
          </div>
        </div>
      )}
    </div>
  );
}

export function IPCameraWidget({
  cameras,
  config: _config,
  gridSize,
}: IPCameraWidgetProps) {
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false); // Default: paused
  const isCompact = gridSize ? gridSize.h <= 2 : false;
  const isStandard = !isCompact;

  const currentCamera = cameras[currentCameraIndex];

  if (!currentCamera) {
    return (
      <WidgetLayout
        gridSize={gridSize}
        title="IP Camera"
        icon={<Camera className="h-5 w-5" />}
      >
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          No cameras configured
        </div>
      </WidgetLayout>
    );
  }

  const handleClick = () => {
    setIsPlaying(!isPlaying);
  };

  const handleNextCamera = () => {
    if (cameras.length > 1) {
      setCurrentCameraIndex((prev) => (prev + 1) % cameras.length);
      setIsPlaying(false); // Pause when switching cameras
    }
  };

  const handlePrevCamera = () => {
    if (cameras.length > 1) {
      setCurrentCameraIndex(
        (prev) => (prev - 1 + cameras.length) % cameras.length
      );
      setIsPlaying(false); // Pause when switching cameras
    }
  };

  return (
    <WidgetLayout
      gridSize={gridSize}
      title={isCompact ? undefined : currentCamera.name || "IP Camera"}
      icon={isCompact ? undefined : <Camera className="h-5 w-5" />}
      contentClassName="p-0"
    >
      <div
        className="relative w-full h-full cursor-pointer group"
        onClick={handleClick}
      >
        <CameraFeed
          url={currentCamera.url}
          isPlaying={isPlaying}
          isCompact={isCompact}
        />

        {/* Play/Pause overlay indicator */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex flex-col items-center gap-2 text-white">
              <Play className="h-12 w-12" />
              <span className="text-sm font-medium">Click to play</span>
            </div>
          </div>
        )}

        {/* Camera navigation (only show if multiple cameras) */}
        {isStandard && cameras.length > 1 && (
          <>
            <button
              onClick={handlePrevCamera}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Previous camera"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              onClick={handleNextCamera}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
              aria-label="Next camera"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </>
        )}

        {/* Camera counter (only show if multiple cameras) */}
        {isStandard && cameras.length > 1 && (
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/70 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
            {currentCameraIndex + 1} / {cameras.length}
          </div>
        )}

        {/* Status indicator */}
        <div className="absolute top-2 right-2 flex items-center gap-2">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isPlaying ? "bg-green-500" : "bg-gray-500"
            )}
          />
          {isStandard && (
            <span className="text-xs text-white bg-black/70 px-2 py-0.5 rounded">
              {isPlaying ? "Live" : "Paused"}
            </span>
          )}
        </div>
      </div>
    </WidgetLayout>
  );
}
