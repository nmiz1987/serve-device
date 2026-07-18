import { useEffect, useRef } from 'react'
import { useInputControl } from '../hooks/useInputControl'
import { scaleCoordinates, clampCoordinates } from '@shared/utils'

interface InputOverlayProps {
  deviceId: string
  canvasRef: React.RefObject<HTMLCanvasElement>
  canvasWidth: number
  canvasHeight: number
}

export default function InputOverlay({
  deviceId,
  canvasRef,
  canvasWidth,
  canvasHeight,
}: InputOverlayProps) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef({ startX: 0, startY: 0, isDragging: false })
  const { tap, swipe, type, key } = useInputControl(deviceId)

  useEffect(() => {
    const overlay = overlayRef.current
    if (!overlay) return

    // Get canvas position relative to viewport
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    overlay.style.position = 'absolute'
    overlay.style.left = rect.left + 'px'
    overlay.style.top = rect.top + 'px'
    overlay.style.width = rect.width + 'px'
    overlay.style.height = rect.height + 'px'

    function getCanvasCoordinates(
      clientX: number,
      clientY: number,
    ): [number, number] {
      const x = clientX - rect.left
      const y = clientY - rect.top
      return scaleCoordinates(
        x,
        y,
        rect.width,
        rect.height,
        canvasWidth,
        canvasHeight,
      )
    }

    function handleMouseDown(e: MouseEvent) {
      dragRef.current.startX = e.clientX
      dragRef.current.startY = e.clientY
      dragRef.current.isDragging = true
    }

    function handleMouseMove(e: MouseEvent) {
      // Could add visual feedback for dragging
    }

    function handleMouseUp(e: MouseEvent) {
      if (!dragRef.current.isDragging) {
        // Simple click = tap
        const [x, y] = getCanvasCoordinates(e.clientX, e.clientY)
        tap(x, y)
      } else {
        // Drag = swipe
        const [x1, y1] = getCanvasCoordinates(
          dragRef.current.startX,
          dragRef.current.startY,
        )
        const [x2, y2] = getCanvasCoordinates(e.clientX, e.clientY)
        swipe(x1, y1, x2, y2, 300)
      }
      dragRef.current.isDragging = false
    }

    function handleKeyDown(e: KeyboardEvent) {
      // Map keyboard shortcuts
      const keyMap: { [key: string]: string } = {
        Escape: 'KEYCODE_BACK',
        Home: 'KEYCODE_HOME',
        ' ': 'KEYCODE_SPACE',
        Enter: 'KEYCODE_ENTER',
        Backspace: 'KEYCODE_DEL',
        ArrowUp: 'KEYCODE_DPAD_UP',
        ArrowDown: 'KEYCODE_DPAD_DOWN',
        ArrowLeft: 'KEYCODE_DPAD_LEFT',
        ArrowRight: 'KEYCODE_DPAD_RIGHT',
      }

      if (e.key in keyMap) {
        e.preventDefault()
        key(keyMap[e.key])
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        // Regular character
        type(e.key)
      }
    }

    overlay.addEventListener('mousedown', handleMouseDown)
    overlay.addEventListener('mousemove', handleMouseMove)
    overlay.addEventListener('mouseup', handleMouseUp)
    overlay.addEventListener('mouseleave', handleMouseUp)
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      overlay.removeEventListener('mousedown', handleMouseDown)
      overlay.removeEventListener('mousemove', handleMouseMove)
      overlay.removeEventListener('mouseup', handleMouseUp)
      overlay.removeEventListener('mouseleave', handleMouseUp)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [canvasRef, canvasWidth, canvasHeight, tap, swipe, type, key])

  return <div ref={overlayRef} className="input-overlay" />
}
