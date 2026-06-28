// @zvndev/yable-react — useContextMenu hook

import { useState, useCallback, useEffect } from 'react'
import type { RowData, Table } from '@zvndev/yable-core'

export function useContextMenu() {
  const [isOpen, setIsOpen] = useState(false)
  const [x, setX] = useState(0)
  const [y, setY] = useState(0)
  const [targetTable, setTargetTable] = useState<Table<any> | null>(null)
  const [targetColumnId, setTargetColumnId] = useState<string | undefined>(undefined)

  const open = useCallback(
    <TData extends RowData>(
      clientX: number,
      clientY: number,
      table: Table<TData>,
      columnId?: string,
    ) => {
      setX(clientX)
      setY(clientY)
      setTargetTable(table as any)
      setTargetColumnId(columnId)
      setIsOpen(true)
    },
    [],
  )

  const close = useCallback(() => {
    setIsOpen(false)
    setTargetTable(null)
    setTargetColumnId(undefined)
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

  return { isOpen, x, y, targetTable, targetColumnId, open, close }
}
