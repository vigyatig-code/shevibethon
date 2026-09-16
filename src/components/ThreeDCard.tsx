import {
  createContext,
  useState,
  useContext,
  useRef,
  useEffect,
  type ReactNode,
  type ElementType,
} from 'react'

const MouseEnterContext = createContext<
  [boolean, React.Dispatch<React.SetStateAction<boolean>>] | undefined
>(undefined)

export function CardContainer({
  children,
  className,
  containerClassName,
}: {
  children?: ReactNode
  className?: string
  containerClassName?: string
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMouseEntered, setIsMouseEntered] = useState(false)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const { left, top, width, height } = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - left - width / 2) / 25
    const y = (e.clientY - top - height / 2) / 25
    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`
  }

  const handleMouseEnter = () => {
    setIsMouseEntered(true)
  }

  const handleMouseLeave = () => {
    if (!containerRef.current) return
    setIsMouseEntered(false)
    containerRef.current.style.transform = `rotateY(0deg) rotateX(0deg)`
  }

  return (
    <MouseEnterContext.Provider value={[isMouseEntered, setIsMouseEntered]}>
      <div
        className={`civic-3d-card-container ${containerClassName ?? ''}`}
        style={{ perspective: '1000px' }}
      >
        <div
          ref={containerRef}
          onMouseEnter={handleMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className={`civic-3d-card-inner ${className ?? ''}`}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {children}
        </div>
      </div>
    </MouseEnterContext.Provider>
  )
}

export function CardBody({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div className={`civic-3d-card-body ${className ?? ''}`}>
      {children}
    </div>
  )
}

export function CardItem({
  as: Tag = 'div',
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...rest
}: {
  as?: ElementType
  children: ReactNode
  className?: string
  translateX?: number | string
  translateY?: number | string
  translateZ?: number | string
  rotateX?: number | string
  rotateY?: number | string
  rotateZ?: number | string
  [key: string]: unknown
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [isMouseEntered] = useMouseEnter()

  useEffect(() => {
    if (!ref.current) return
    if (isMouseEntered) {
      ref.current.style.transform = `translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`
    } else {
      ref.current.style.transform = `translateX(0px) translateY(0px) translateZ(0px) rotateX(0deg) rotateY(0deg) rotateZ(0deg)`
    }
  }, [isMouseEntered, translateX, translateY, translateZ, rotateX, rotateY, rotateZ])

  return (
    <Tag
      ref={ref}
      className={`civic-3d-card-item ${className ?? ''}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}

export function useMouseEnter() {
  const context = useContext(MouseEnterContext)
  if (context === undefined) {
    throw new Error('useMouseEnter must be used within a CardContainer')
  }
  return context
}

// ---- Demo card adapted to the civic theme ----

export default function ThreeDCardDemo() {
  return (
    <CardContainer>
      <CardBody>
        <CardItem translateZ={50} className="civic-3d-card-title">
          Make things float in air
        </CardItem>
        <CardItem as="p" translateZ={60} className="civic-3d-card-desc">
          Hover over this card to unleash the power of CSS perspective
        </CardItem>
        <CardItem translateZ={100} className="civic-3d-card-thumb-wrap">
          <img
            src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=2560&auto=format&fit=crop&ixlib=rb-4.0.3"
            height={1000}
            width={1000}
            className="civic-3d-card-thumb"
            alt="thumbnail"
          />
        </CardItem>
        <div className="civic-3d-card-footer">
          <CardItem
            translateZ={20}
            as="a"
            href="https://twitter.com/mannupaaji"
            target="_blank"
            rel="noopener noreferrer"
            className="civic-3d-card-link"
          >
            Try now →
          </CardItem>
          <CardItem
            translateZ={20}
            as="button"
            className="civic-3d-card-btn"
          >
            Sign up
          </CardItem>
        </div>
      </CardBody>
    </CardContainer>
  )
}
