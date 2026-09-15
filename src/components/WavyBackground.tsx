import React, { useEffect, useRef, useState } from 'react'
import { createNoise3D } from 'simplex-noise'
import './WavyBackground.css'

interface WavyBackgroundProps {
  children?: React.ReactNode
  className?: string
  containerClassName?: string
  colors?: string[]
  waveWidth?: number
  backgroundFill?: string
  blur?: number
  speed?: 'slow' | 'fast'
  waveOpacity?: number
}

export default function WavyBackground({
  children,
  className,
  containerClassName,
  colors,
  waveWidth,
  backgroundFill,
  blur = 10,
  speed = 'fast',
  waveOpacity = 0.5,
}: WavyBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const noiseRef = useRef(createNoise3D())
  const animationIdRef = useRef<number>(0)

  const getSpeed = () => (speed === 'slow' ? 0.001 : 0.002)

  const waveColors = colors ?? ['#a96545', '#c4976a', '#d4af37', '#8a6a4f', '#6f4e37']

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let w = (canvas.width = window.innerWidth)
    let h = (canvas.height = window.innerHeight)
    ctx.filter = `blur(${blur}px)`
    let nt = 0

    const handleResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
      ctx.filter = `blur(${blur}px)`
    }
    window.addEventListener('resize', handleResize)

    const drawWave = (n: number) => {
      nt += getSpeed()
      for (let i = 0; i < n; i++) {
        ctx.beginPath()
        ctx.lineWidth = waveWidth || 50
        ctx.strokeStyle = waveColors[i % waveColors.length]
        for (let x = 0; x < w; x += 5) {
          const y = noiseRef.current(x / 800, 0.3 * i, nt) * 100
          ctx.lineTo(x, y + h * 0.5)
        }
        ctx.stroke()
        ctx.closePath()
      }
    }

    const render = () => {
      ctx.fillStyle = backgroundFill || 'transparent'
      ctx.globalAlpha = waveOpacity
      ctx.fillRect(0, 0, w, h)
      drawWave(5)
      animationIdRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationIdRef.current)
      window.removeEventListener('resize', handleResize)
    }
  }, [blur, speed, waveWidth, waveOpacity, backgroundFill, waveColors])

  const [isSafari, setIsSafari] = useState(false)
  useEffect(() => {
    setIsSafari(
      typeof window !== 'undefined' &&
        navigator.userAgent.includes('Safari') &&
        !navigator.userAgent.includes('Chrome')
    )
  }, [])

  return (
    <div className={`wavy-bg-container ${containerClassName ?? ''}`}>
      <canvas
        ref={canvasRef}
        className="wavy-bg-canvas"
        style={isSafari ? { filter: `blur(${blur}px)` } : undefined}
      />
      <div className={`wavy-bg-content ${className ?? ''}`}>
        {children}
      </div>
    </div>
  )
}
