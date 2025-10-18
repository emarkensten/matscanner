declare module 'quagga' {
  export interface QuaggaJSConfigObject {
    inputStream?: {
      type?: string;
      target?: HTMLElement | null;
      constraints?: {
        width?: { min?: number; ideal?: number; max?: number };
        height?: { min?: number; ideal?: number; max?: number };
        facingMode?: string;
      };
    };
    decoder?: {
      readers?: string[];
      debug?: {
        drawBoundingBox?: boolean;
        showFrequency?: boolean;
        drawScanline?: boolean;
        showPattern?: boolean;
      };
    };
    locate?: boolean;
    numOfWorkers?: number;
    frequency?: number;
  }

  export interface QuaggaJSResultObject {
    codeResult: {
      code: string;
    };
  }

  interface QuaggaStatic {
    init(
      config: QuaggaJSConfigObject,
      callback: (err: Error | null) => void
    ): void;
    start(): void;
    stop(): void;
    onDetected(callback: (result: QuaggaJSResultObject) => void): void;
    offDetected(callback?: (result: QuaggaJSResultObject) => void): void;
  }

  const Quagga: QuaggaStatic;
  export default Quagga;
}
