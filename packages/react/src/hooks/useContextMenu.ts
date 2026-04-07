// @zvndev/yable-react — useContextMenu hook

import { useState, useCallback, useEffect } from 'react'
import type { RowData, Table } from '@zvndev/yable-core'

export function useContextMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [targetTable, setTargetTable] = useState<Table<any> | null>(null)

  const open = useCallback(
    <TData extends RowData>(clientX: number, clientY: number, table: Table<TData>) => {
      setX(clientX)
      setY(clientY)
      setTargetTable(table as any)
      setIsOpen(true)
    },
    []
  )

  const close = useCallback(() => {
    setIsOpen(false)
    setTargetTable(null)
  }, [])

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }

    const handleClick = () => close()

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('click', handleClick)
    }
  }, [isOpen, close])

  return { isOpen, x, y, targetTable, open, close }
}
