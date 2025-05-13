"use client"

import { useEffect, useState } from "react"
import QRCodeReact from "react-qr-code"

interface QRCodeProps {
  value: string
  size?: number
}

export function QRCode({ value, size = 128 }: QRCodeProps) {
  const [mounted, setMounted] = useState(false)

  // This prevents hydration errors with the QR code component
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div className="bg-slate-200 animate-pulse" style={{ width: size, height: size }} />
  }

  return (
    <div className="bg-white p-2 rounded">
      <QRCodeReact value={value} size={size} level="M" fgColor="#000" bgColor="#fff" />
    </div>
  )
}
