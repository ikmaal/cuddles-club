import type { HTMLAttributes, ReactNode } from 'react'
import { useOverscrollGuard } from '../hooks/useOverscrollGuard'

interface ScrollRegionProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  scrollable?: boolean
}

export function ScrollRegion({
  children,
  className,
  scrollable = true,
  ...rest
}: ScrollRegionProps) {
  const ref = useOverscrollGuard<HTMLDivElement>(scrollable)

  return (
    <div ref={ref} className={className} {...rest}>
      {children}
    </div>
  )
}
