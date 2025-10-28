/* ==== [BLOCK: useUndoStack] BEGIN ==== */
import { useRef } from "react"

export function useUndoStack<T>(initial: T) {
  const past = useRef<T[]>([])
  const present = useRef<T>(initial)
  const future = useRef<T[]>([])

  const commit = (next: T) => {
    past.current.push(structuredClone(present.current))
    present.current = next
    future.current = []
  }

  const undo = (): T | null => {
    if (past.current.length === 0) return null
    const prev = past.current.pop() as T
    future.current.push(structuredClone(present.current))
    present.current = prev
    return structuredClone(prev)
  }

  const redo = (): T | null => {
    if (future.current.length === 0) return null
    const nxt = future.current.pop() as T
    past.current.push(structuredClone(present.current))
    present.current = nxt
    return structuredClone(nxt)
  }

  const get = (): T => structuredClone(present.current)

  const set = (next: T) => {
    commit(structuredClone(next))
  }

  return { get, set, undo, redo, _dbg: { past, future, present } }
}
/* ==== [BLOCK: useUndoStack] END ==== */
