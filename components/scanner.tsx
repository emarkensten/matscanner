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
  const scannerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const hasScannedRef = useRef(false);

  useEffect(() => {
    if (!isActive || !scannerRef.current) return;

    hasScannedRef.current = false;

    const startScanner = async () => {
      try {
        setError(null);

        if (!navigator.mediaDevices?.getUserMedia) {
          setError('Kamera stöds inte i denna webbläsare eller anslutning. Använd HTTPS eller localhost.');
          return;
        }

        // Import Quagga dynamically
        const Quagga = (await import('quagga')).default;

        Quagga.init(
          {
            inputStream: {
              type: 'LiveStream',
              target: scannerRef.current,
              constraints: {
                width: { min: 640, ideal: 1280, max: 1920 },
                height: { min: 480, ideal: 720, max: 1080 },
                facingMode: 'environment',
              },
            },
            decoder: {
              readers: [
                'ean_reader',
                'ean_8_reader',
                'code_128_reader',
                'code_39_reader',
                'upc_reader',
                'upc_e_reader',
              ],
              debug: {
                drawBoundingBox: true,
                showFrequency: false,
                drawScanline: true,
                showPattern: false,
              },
            },
            locate: true,
            numOfWorkers: 4,
            frequency: 10,
          },
          (err: any) => {
            if (err) {
              console.error('Quagga init error:', err);
              setError('Kunde inte starta scannern. Försök igen.');
              return;
            }

            console.log('Quagga initialized');
            Quagga.start();
            setScanning(true);
          }
        );

        Quagga.onDetected((result: any) => {
          if (hasScannedRef.current) return;

          const code = result.codeResult.code;
          console.log('Barcode detected:', code);

          // Vibrate if available
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }

          hasScannedRef.current = true;
          setScanning(false);
          Quagga.stop();
          onScan(code);
        });
      } catch (err) {
        console.error('Scanner error:', err);
        setError('Kunde inte starta kameran. Kontrollera behörigheter.');
      }
    };

    startScanner();

    return () => {
      import('quagga').then((module) => {
        const Quagga = module.default;
        Quagga.stop();
        Quagga.offDetected();
      });
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
    import('quagga').then((module) => {
      const Quagga = module.default;
      Quagga.stop();
    });
  };

  if (!isActive) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <div className="relative w-full">
        <div
          ref={scannerRef}
          className="w-full rounded-lg overflow-hidden bg-black"
          style={{
            width: '100%',
            maxWidth: '100%',
          }}
        />
        {scanning && (
          <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold z-10">
            Scannar...
          </div>
        )}
      </div>

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
