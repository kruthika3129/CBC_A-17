
import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check if we're on the client side
    if (typeof window === 'undefined') return;
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Set initial value
    checkMobile()
    
    // Add event listener with throttling for performance
    let timeout: ReturnType<typeof setTimeout> | null = null
    
    const handleResize = () => {
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(() => {
        checkMobile()
      }, 100)
    }
    
    window.addEventListener("resize", handleResize)
    
    return () => {
      if (timeout) clearTimeout(timeout)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  return isMobile
}
