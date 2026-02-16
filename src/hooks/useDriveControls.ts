import { useEffect, useRef } from 'react'

export type DriveAction = 'forward' | 'backward' | 'left' | 'right' | 'brake'

export interface DriveControlsState {
  forward: boolean
  backward: boolean
  left: boolean
  right: boolean
  brake: boolean
}

const initialState: DriveControlsState = {
  forward: false,
  backward: false,
  left: false,
  right: false,
  brake: false,
}

const keyToAction: Record<string, DriveAction | undefined> = {
  KeyW: 'forward',
  ArrowUp: 'forward',
  KeyS: 'backward',
  ArrowDown: 'backward',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
  Space: 'brake',
}

export function useDriveControls() {
  const controlsRef = useRef<DriveControlsState>({ ...initialState })

  useEffect(() => {
    const updateKey = (event: KeyboardEvent, pressed: boolean) => {
      const action = keyToAction[event.code]
      if (!action) {
        return
      }

      event.preventDefault()
      controlsRef.current[action] = pressed
    }

    const onKeyDown = (event: KeyboardEvent) => updateKey(event, true)
    const onKeyUp = (event: KeyboardEvent) => updateKey(event, false)
    const onBlur = () => {
      controlsRef.current = { ...initialState }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)

    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])

  return controlsRef
}
