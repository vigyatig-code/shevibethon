import './GlitchText.css'

interface GlitchTextProps {
  children: string
  speed?: number
  enableShadows?: boolean
  enableOnHover?: boolean
  className?: string
}

export default function GlitchText({
  children,
  speed = 0.5,
  enableShadows = true,
  enableOnHover = false,
  className = '',
}: GlitchTextProps) {
  const inlineStyles = {
    '--after-duration': `${speed * 3}s`,
    '--before-duration': `${speed * 2}s`,
    '--after-shadow': enableShadows ? '-5px 0 red' : 'none',
    '--before-shadow': enableShadows ? '5px 0 cyan' : 'none',
  } as React.CSSProperties

  const hoverClass = enableOnHover ? 'enable-on-hover' : ''

  return (
    <div
      className={`glitch ${hoverClass} ${className}`}
      style={inlineStyles}
      data-text={children}
    >
      {children}
    </div>
  )
}
