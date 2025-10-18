'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

interface ScannerProps {
  onScan: (barcode: string) => void;
  isActive: boolean;
}

export function Scanner({ onScan, isActive }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const scanningRef = useRef(false);

  useEffect(() => {
    if (!isActive) {
      // Stop video stream
      scanningRef.current = false;
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
      return;
    }

    const startCamera = async () => {
      try {
        setError(null);

        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Kamera stöds inte i denna webbläsare eller anslutning. Använd HTTPS eller localhost.');
          return;
        }

        const constraints = {
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setScanning(true);
          scanningRef.current = true;

          // Start scanning loop
          scanBarcode();
        }
      } catch (err) {
        setError('Kunde inte få åtkomst till kameran. Kontrollera behörigheter.');
        console.error('Camera error:', err);
      }
    };

    const scanBarcode = async () => {
      if (!scanningRef.current || !videoRef.current || !canvasRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(scanBarcode);
        return;
      }

      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw video frame to canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        // Import ZXing dynamically
        const { BrowserMultiFormatReader } = await import('@zxing/library');
        const codeReader = new BrowserMultiFormatReader();

        try {
          const result = await codeReader.decodeFromImageData(imageData);

          if (result && result.getText()) {
            // Found a barcode!
            scanningRef.current = false;
            setScanning(false);

            // Haptic feedback
            if (navigator.vibrate) {
              navigator.vibrate(200);
            }

            onScan(result.getText());
            return;
          }
        } catch (err) {
          // No barcode found in this frame, continue scanning
        }
      } catch (err) {
        console.error('Scan error:', err);
      }

      // Continue scanning
      if (scanningRef.current) {
        requestAnimationFrame(scanBarcode);
      }
    };

    startCamera();

    return () => {
      scanningRef.current = false;
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isActive, onScan]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      onScan(manualInput.trim());
      setManualInput('');
    }
  };

  const handleStop = () => {
    scanningRef.current = false;
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <video
          ref={videoRef}
          className="w-full mx-auto rounded-lg overflow-hidden bg-black"
          style={{
            width: '100%',
            height: 'auto',
            maxWidth: '100%',
            aspectRatio: '16/9',
            objectFit: 'cover',
          }}
        />
        {scanning && (
          <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
            Scannar...
          </div>
        )}
        {/* Scan guide box */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-4 border-green-500 rounded-lg" style={{ width: '80%', height: '50%' }} />
        </div>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-900 text-center">
          Rikta kameran mot streckkoden eller ange den manuellt
        </AlertDescription>
      </Alert>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-900">{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleManualSubmit} className="flex gap-2">
        <Input
          type="text"
          placeholder="Ange streckkod manuellt..."
          value={manualInput}
          onChange={(e) => setManualInput(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={!manualInput.trim()}>
          Sök
        </Button>
      </form>

      <Button
        onClick={handleStop}
        variant="outline"
        className="w-full"
      >
        Stoppa
      </Button>
    </div>
  );
}
