// src/hooks/use-mobile.tsx
import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Exportación Nombrada (Para que funcione el Sidebar de Shadcn)
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

// Exportación por Defecto (Para que funcione tu App.tsx)
export default useIsMobile