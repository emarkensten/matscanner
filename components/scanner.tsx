'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ScannerProps {
  onScan: (barcode: string) => void;
  isActive: boolean;
}

export function Scanner({ onScan, isActive }: ScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const elementId = 'qr-reader';
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
      rememberLastUsedCamera: true,
      maxAllowedSkippedFrames: 30,
    };

    const qrScanner = new Html5QrcodeScanner(elementId, config, false);

    qrScanner.render(
      (decodedText) => {
        // Barcode successfully scanned
        setError(null);

        // Haptic feedback if available
        if (navigator.vibrate) {
          navigator.vibrate(200);
        }

        onScan(decodedText);

        // Stop scanning after successful scan
        qrScanner.clear().catch(console.error);
      },
      () => {
        // Handle scanning errors silently during continuous scanning
        // These are normal QR code detection attempts
      }
    );

    scannerRef.current = qrScanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [isActive, onScan]);

  const handleStop = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <div
        id="qr-reader"
        className="w-full mx-auto rounded-lg overflow-hidden bg-black"
        style={{
          maxWidth: '100%',
          aspectRatio: '1/1',
        }}
      />

      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-900 text-center">
          Rikta kameran mot streckkoden
        </AlertDescription>
      </Alert>

      {error && (
        <Alert className="bg-red-50 border-red-200">
          <AlertDescription className="text-red-900">{error}</AlertDescription>
        </Alert>
      )}

      <Button
        onClick={handleStop}
        variant="outline"
        className="w-full"
      >
        Stoppa scanning
      </Button>
    </div>
  );
}
