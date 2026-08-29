'use client'

import { useState, useTransition } from 'react'
import { updateChecklistMenu } from './actions'

export default function MenuPicker({
  studentId,
  date,
  level,
  todayMenu,
  initialSelected,
}: {
  studentId: string
  date: string
  level: string | undefined
  todayMenu: string[]
  initialSelected: string[]
}) {
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(initialSelected)
  )
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleToggle(dish: string) {
    if (!level) {
      setWarning('먼저 상태를 선택해주세요')
      return
    }

    setWarning(null)
    setError(null)

    const next = new Set(selected)
    if (next.has(dish)) {
      next.delete(dish)
    } else {
      next.add(dish)
    }
    setSelected(next)

    startTransition(async () => {
      const result = await updateChecklistMenu({
        studentId,
        date,
        level,
        menuItems: Array.from(next),
      })
      if (result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      {todayMenu.map((dish) => (
        <label
          key={dish}
          className="flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-xs text-muted"
        >
          <input
            type="checkbox"
            checked={selected.has(dish)}
            disabled={isPending}
            onChange={() => handleToggle(dish)}
            className="h-3 w-3"
          />
          {dish}
        </label>
      ))}
      {warning && <span className="text-xs text-red-700">{warning}</span>}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  )
}
