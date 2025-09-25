import { ref, onMounted, onUnmounted } from 'vue'

export function useKeyboardDetection() {
  const isKeyboardVisible = ref(false)
  const keyboardHeight = ref(0)
  const viewportHeight = ref(0)
  const safeAreaBottom = ref(0)

  let visualViewport = null
  let initialViewportHeight = 0

  const updateKeyboardState = () => {
    if (!visualViewport) return

    const currentHeight = visualViewport.height
    const heightDifference = initialViewportHeight - currentHeight
    
    // Consider keyboard visible if viewport height decreased by more than 150px
    // This threshold helps avoid false positives from browser UI changes
    const keyboardThreshold = 150
    
    if (heightDifference > keyboardThreshold) {
      isKeyboardVisible.value = true
      keyboardHeight.value = heightDifference
    } else {
      isKeyboardVisible.value = false
      keyboardHeight.value = 0
    }
    
    viewportHeight.value = currentHeight
    
    // Calculate safe area for iOS devices
    const computedStyle = getComputedStyle(document.documentElement)
    const safeAreaBottomValue = computedStyle.getPropertyValue('env(safe-area-inset-bottom)') || '0px'
    safeAreaBottom.value = parseInt(safeAreaBottomValue) || 0
  }

  const handleResize = () => {
    updateKeyboardState()
  }

  const handleScroll = () => {
    updateKeyboardState()
  }

  onMounted(() => {
    // Check if Visual Viewport API is supported
    if (window.visualViewport) {
      visualViewport = window.visualViewport
      initialViewportHeight = visualViewport.height
      viewportHeight.value = visualViewport.height
      
      // Listen to viewport changes
      visualViewport.addEventListener('resize', handleResize)
      visualViewport.addEventListener('scroll', handleScroll)
    } else {
      // Fallback for browsers without Visual Viewport API
      initialViewportHeight = window.innerHeight
      viewportHeight.value = window.innerHeight
      
      window.addEventListener('resize', () => {
        const currentHeight = window.innerHeight
        const heightDifference = initialViewportHeight - currentHeight
        
        if (heightDifference > 150) {
          isKeyboardVisible.value = true
          keyboardHeight.value = heightDifference
        } else {
          isKeyboardVisible.value = false
          keyboardHeight.value = 0
        }
        
        viewportHeight.value = currentHeight
      })
    }

    // Set CSS custom properties for use in components
    const setCSSProperties = () => {
      const root = document.documentElement
      root.style.setProperty('--keyboard-height', `${keyboardHeight.value}px`)
      root.style.setProperty('--viewport-height', `${viewportHeight.value}px`)
      root.style.setProperty('--safe-area-bottom', `${safeAreaBottom.value}px`)
    }

    // Initial CSS property setup
    setCSSProperties()

    // Watch for changes and update CSS properties
    const updateCSS = () => setCSSProperties()

    // Set up watchers (simplified approach)
    let previousKeyboardState = isKeyboardVisible.value
    let previousKeyboardHeight = keyboardHeight.value
    let previousViewportHeight = viewportHeight.value

    const checkForUpdates = () => {
      if (
        previousKeyboardState !== isKeyboardVisible.value ||
        previousKeyboardHeight !== keyboardHeight.value ||
        previousViewportHeight !== viewportHeight.value
      ) {
        updateCSS()
        previousKeyboardState = isKeyboardVisible.value
        previousKeyboardHeight = keyboardHeight.value
        previousViewportHeight = viewportHeight.value
      }
    }

    // Check for updates periodically
    const updateInterval = setInterval(checkForUpdates, 100)

    // Cleanup function
    return () => {
      if (updateInterval) {
        clearInterval(updateInterval)
      }
    }
  })

  onUnmounted(() => {
    if (visualViewport) {
      visualViewport.removeEventListener('resize', handleResize)
      visualViewport.removeEventListener('scroll', handleScroll)
    } else {
      window.removeEventListener('resize', handleResize)
    }
  })

  // Calculate optimal modal height considering keyboard
  const getModalMaxHeight = () => {
    if (isKeyboardVisible.value) {
      // Leave some space above the keyboard for better UX
      const spacing = 20
      return Math.max(300, viewportHeight.value - spacing)
    }
    
    // Default max height when keyboard is not visible
    return window.innerHeight * 0.9
  }

  // Calculate bottom positioning for modals
  const getModalBottomOffset = () => {
    if (isKeyboardVisible.value) {
      // Position modal just above the keyboard with some spacing
      return keyboardHeight.value + safeAreaBottom.value + 10
    }
    
    return safeAreaBottom.value
  }

  return {
    isKeyboardVisible,
    keyboardHeight,
    viewportHeight,
    safeAreaBottom,
    getModalMaxHeight,
    getModalBottomOffset
  }
}
