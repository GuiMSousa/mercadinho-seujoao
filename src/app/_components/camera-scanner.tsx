"use client";

import { Camera, SwitchCamera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, IconButton } from "@ds/components/button";
import { Dialog } from "@ds/components/dialog";
import {
  cameraErrorMessage,
  cameraProblem,
  FALLBACK,
  readCameraEnvironment,
} from "./camera-support";

// The Shape Detection API is not in TypeScript's DOM library yet.
type Detector = {
  detect(source: HTMLVideoElement): Promise<{ rawValue: string }[]>;
};
type DetectorClass = {
  new (options: { formats: string[] }): Detector;
  getSupportedFormats(): Promise<string[]>;
};

// Product codes on Brazilian shelves: EAN/UPC, plus the common internal and logistics ones.
const FORMATS = [
  "ean_13",
  "ean_8",
  "upc_a",
  "upc_e",
  "code_128",
  "code_39",
  "itf",
];
const SCAN_INTERVAL_MS = 150;

/** Opens the rear camera and reads one barcode; with several lenses, the person can switch. */
function ScannerDialog({
  onCode,
  onClose,
}: {
  onCode: (code: string) => void;
  onClose: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [problem] = useState(() => cameraProblem(readCameraEnvironment()));
  const [error, setError] = useState<string | null>(null);
  const [cameras, setCameras] = useState<string[]>([]);
  const [camera, setCamera] = useState(0);
  // Read inside the effect without restarting the camera when they change.
  const camerasRef = useRef<string[]>([]);
  const onCodeRef = useRef(onCode);
  useEffect(() => {
    onCodeRef.current = onCode;
  });

  useEffect(() => {
    if (problem) return;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let stopped = false;
    const deviceId = camerasRef.current[camera];

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: deviceId
            ? { deviceId: { exact: deviceId } }
            : { facingMode: { ideal: "environment" } },
        });
        if (stopped) return stream.getTracks().forEach((t) => t.stop());
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();
        // Labels and the full list only come after the permission is granted.
        if (camerasRef.current.length === 0) {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const found = devices
            .filter((device) => device.kind === "videoinput")
            .map((device) => device.deviceId);
          if (found.length > 1 && !stopped) {
            camerasRef.current = found;
            setCameras(found);
            const current = stream.getVideoTracks()[0]?.getSettings().deviceId;
            setCamera(Math.max(0, found.indexOf(current ?? "")));
          }
        }
        const Barcode = (
          window as unknown as { BarcodeDetector: DetectorClass }
        ).BarcodeDetector;
        const supported = await Barcode.getSupportedFormats();
        const detector = new Barcode({
          formats: FORMATS.filter((format) => supported.includes(format)),
        });
        const scan = async () => {
          if (stopped) return;
          const [found] = await detector.detect(video).catch(() => []);
          if (found?.rawValue && !stopped) {
            stopped = true;
            onCodeRef.current(found.rawValue);
            return;
          }
          timer = setTimeout(() => void scan(), SCAN_INTERVAL_MS);
        };
        void scan();
      } catch (cause) {
        if (!stopped) setError(cameraErrorMessage(cause));
      }
    }
    void start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [camera, problem]);

  const message = problem ?? error;
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title="Ler código pela câmera"
      description={
        message ? undefined : "Aponte a câmera para o código de barras."
      }
      footer={
        <>
          {cameras.length > 1 && !message && (
            <Button
              variant="secondary"
              size="counter"
              onClick={() =>
                setCamera((current) => (current + 1) % cameras.length)
              }
            >
              <SwitchCamera aria-hidden="true" />
              Trocar câmera
            </Button>
          )}
          <Button variant="secondary" size="counter" onClick={onClose}>
            Fechar
          </Button>
        </>
      }
    >
      {message ? (
        <div role="alert" className="flex flex-col gap-2 text-body-lg">
          <p className="text-strong">{message}</p>
          <p className="text-sub">{FALLBACK}</p>
        </div>
      ) : (
        <video
          ref={videoRef}
          muted
          playsInline
          aria-label="Imagem da câmera"
          className="aspect-video w-full rounded-control bg-surface-sunken object-cover"
        />
      )}
    </Dialog>
  );
}

/** Camera button beside a code field: reads one barcode and hands it over. */
export function CameraScanButton({
  onCode,
  onOpenChange,
  size = "counter",
}: {
  onCode: (code: string) => void;
  /** Lets the screen pause its own shortcuts while the camera is open. */
  onOpenChange?: (open: boolean) => void;
  size?: "md" | "counter";
}) {
  const [open, setOpenState] = useState(false);
  function setOpen(next: boolean) {
    setOpenState(next);
    onOpenChange?.(next);
  }
  return (
    <>
      <IconButton
        size={size}
        icon={Camera}
        label="Ler código pela câmera"
        onClick={() => setOpen(true)}
      />
      {open && (
        <ScannerDialog
          onCode={(code) => {
            setOpen(false);
            onCode(code);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
