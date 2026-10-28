import { useState } from 'react'
import { useLocation } from 'react-router'

// Open state for a menu in the persistent layout: any navigation closes it, browser back/forward included.
export const useMenuOpen = () => {
  const { key } = useLocation()
  const [open, setOpen] = useState(false)
  const [lastKey, setLastKey] = useState(key)
  if (key !== lastKey) {
    setLastKey(key)
    setOpen(false)
  }
  return [open, setOpen] as const
}
