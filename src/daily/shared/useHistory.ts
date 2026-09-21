import { useRef, useState } from 'react'

type Updater<T> = T | ((prev: T) => T)

/**
 * Wraps a daily game's `setState` with an undo stack. Every move that goes through `pushAndSet`
 * records the state it replaced, so a single "Undo" button can step backward one move at a time.
 */
export function useHistory<T>(state: T, setState: (updater: Updater<T>) => void) {
  const stack = useRef<T[]>([])
  const [canUndo, setCanUndo] = useState(false)

  const pushAndSet = (updater: Updater<T>) => {
    stack.current.push(state)
    setCanUndo(true)
    setState(updater)
  }

  const undo = () => {
    const prev = stack.current.pop()
    if (prev === undefined) return
    setCanUndo(stack.current.length > 0)
    setState(prev)
  }

  return { pushAndSet, undo, canUndo }
}
