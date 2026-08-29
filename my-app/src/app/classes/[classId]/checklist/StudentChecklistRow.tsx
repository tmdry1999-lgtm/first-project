'use client'

import { useState, useTransition } from 'react'
import { setChecklistLevel, updateChecklistMenu } from './actions'
import { LEVELS, LEVEL_ACTIVE_COLOR, type Level } from './constants'

export default function StudentChecklistRow({
  studentId,
  date,
  initialLevel,
  todayMenu,
  initialMenu,
}: {
  studentId: string
  date: string
  initialLevel: Level | undefined
  todayMenu: string[]
  initialMenu: string[]
}) {
  const [level, setLevel] = useState<Level | undefined>(initialLevel)
  const [selectedMenu, setSelectedMenu] = useState<Set<string>>(
    () => new Set(initialMenu)
  )
  const [warning, setWarning] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleLevelClick(newLevel: Level) {
    setLevel(newLevel)
    setWarning(null)
    setError(null)

    startTransition(async () => {
      const result = await setChecklistLevel({
        studentId,
        date,
        level: newLevel,
      })
      if (result.error) setError(result.error)
    })
  }

  function handleMenuToggle(dish: string) {
    if (!level) {
      setWarning('먼저 상태를 선택해주세요')
      return
    }

    setWarning(null)
    setError(null)

    const next = new Set(selectedMenu)
    if (next.has(dish)) {
      next.delete(dish)
    } else {
      next.add(dish)
    }
    setSelectedMenu(next)

    startTransition(async () => {
      const result = await updateChecklistMenu({
        studentId,
        date,
        level,
        menuItems: Array.from(next),
      })
      if (result.error) setError(result.error)
    })
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted">상태</span>
        <div className="flex flex-wrap justify-end gap-2">
          {LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              disabled={isPending}
              onClick={() => handleLevelClick(lvl)}
              className={`rounded-xl border px-3 py-1.5 text-sm ${
                level === lvl
                  ? LEVEL_ACTIVE_COLOR[lvl]
                  : 'border-line bg-white text-muted hover:bg-[#f7efe4]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {todayMenu.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">메뉴</span>
          <div className="flex flex-wrap gap-1">
            {todayMenu.map((dish) => (
              <label
                key={dish}
                className="flex items-center gap-1 rounded-lg border border-line bg-white px-2 py-1 text-xs text-muted"
              >
                <input
                  type="checkbox"
                  checked={selectedMenu.has(dish)}
                  disabled={isPending}
                  onChange={() => handleMenuToggle(dish)}
                  className="h-3 w-3"
                />
                {dish}
              </label>
            ))}
          </div>
        </div>
      )}

      {warning && <span className="text-xs text-red-700">{warning}</span>}
      {error && <span className="text-xs text-red-700">{error}</span>}
    </div>
  )
}
