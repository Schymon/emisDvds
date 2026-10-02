import { useCallback, useEffect, useRef, useState } from 'react'
import { CameraOff, ScanLine } from 'lucide-react'
import { DrawablyButton } from 'drawably/react'
import type { ReactElement } from 'react'
import type { DecodeHintType as HintKey } from '@zxing/library'

interface DetectedBarcode {
  rawValue: string
}

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<DetectedBarcode[]>
    }
  }
}

const NATIVE_FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e']

interface BarcodeScannerProps {
  onDetected: (code: string) => void
  onError: (message: string) => void
}

export function BarcodeScanner({ onDetected, onError }: BarcodeScannerProps): ReactElement {
  const videoRef = useRef<HTMLVideoElement>(null)
  const stopRef = useRef<(() => void) | null>(null)
  const [scanning, setScanning] = useState(false)

  const stop = useCallback(() => {
    stopRef.current?.()
    stopRef.current = null
    setScanning(false)
  }, [])

  useEffect(() => stop, [stop])

  const start = async () => {
    const video = videoRef.current
    if (!video) return
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia) {
      onError('Kamera braucht HTTPS (oder localhost) – bitte Titel manuell suchen.')
      return
    }
    setScanning(true)
    try {
      if (window.BarcodeDetector) {
        const detector = new window.BarcodeDetector({ formats: NATIVE_FORMATS })
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        video.srcObject = stream
        await video.play()
        const stopStream = () => {
          stream.getTracks().forEach((track) => track.stop())
          video.srcObject = null
        }
        const interval = window.setInterval(() => {
          detector
            .detect(video)
            .then((codes) => {
              if (codes.length > 0) {
                window.clearInterval(interval)
                stopStream()
                stopRef.current = null
                setScanning(false)
                onDetected(codes[0].rawValue)
              }
            })
            .catch(() => undefined)
        }, 250)
        stopRef.current = () => {
          window.clearInterval(interval)
          stopStream()
        }
      } else {
        const [{ BrowserMultiFormatReader }, { BarcodeFormat, DecodeHintType }] = await Promise.all([
          import('@zxing/browser'),
          import('@zxing/library'),
        ])
        const hints = new Map<HintKey, unknown>([
          [
            DecodeHintType.POSSIBLE_FORMATS,
            [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E],
          ],
        ])
        const reader = new BrowserMultiFormatReader(hints)
        const controls = await reader.decodeFromVideoDevice(undefined, video, (result, _err, ctrls) => {
          if (result) {
            ctrls.stop()
            stopRef.current = null
            setScanning(false)
            onDetected(result.getText())
          }
        })
        stopRef.current = () => controls.stop()
      }
    } catch (err) {
      setScanning(false)
      stopRef.current = null
      onError(
        err instanceof Error
          ? `Kamera nicht verfügbar (${err.message}) – bitte Titel manuell suchen.`
          : 'Kamera nicht verfügbar – bitte Titel manuell suchen.',
      )
    }
  }

  return (
    <div className="mb-4">
      <video
        ref={videoRef}
        playsInline
        muted
        className={`mb-3 aspect-video w-full rounded-md bg-black object-cover ${scanning ? 'block' : 'hidden'}`}
      />
      <div className="flex flex-wrap items-center gap-2">
        <DrawablyButton
          variant={scanning ? 'outline' : 'solid'}
          tone="neutral"
          onClick={scanning ? stop : start}
          className="flex cursor-pointer items-center gap-2"
        >
          {scanning ? <CameraOff size={16} /> : <ScanLine size={16} />}
          {scanning ? 'Kamera stoppen' : 'Barcode scannen'}
        </DrawablyButton>
      </div>
    </div>
  )
}
