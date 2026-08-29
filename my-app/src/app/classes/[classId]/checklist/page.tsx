import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { setChecklistEntry, setChecklistEntriesBulk } from './actions'
import { fetchTodayMenu } from '@/utils/neis'
import MenuPicker from './MenuPicker'

export const dynamic = 'force-dynamic'

const LEVELS = ['다 먹었어요!', '노력했어요!', '더 노력해봐요!'] as const
type Level = (typeof LEVELS)[number]

const LEVEL_ACTIVE_COLOR: Record<Level, string> = {
  '다 먹었어요!': 'border-green-500 bg-green-100 text-green-800',
  '노력했어요!': 'border-yellow-500 bg-yellow-100 text-yellow-800',
  '더 노력해봐요!': 'border-red-500 bg-red-100 text-red-800',
}

const LEVEL_EMOJI: Record<Level, string> = {
  '다 먹었어요!': '😊',
  '노력했어요!': '💪',
  '더 노력해봐요!': '😂',
}

const WEEKDAY_LABEL = ['월', '화', '수', '목', '금']

function formatDate(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function parseDateStr(s: string) {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(d: Date, days: number) {
  const copy = new Date(d)
  copy.setDate(copy.getDate() + days)
  return copy
}

function mondayOf(d: Date) {
  const day = d.getDay() // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day
  return addDays(d, diff)
}

function todayKST() {
  const kstString = new Date().toLocaleString('en-US', {
    timeZone: 'Asia/Seoul',
  })
  return new Date(kstString)
}

export default async function ChecklistPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>
  searchParams: Promise<{
    view?: string
    date?: string
    weekStart?: string
    error?: string
    success?: string
  }>
}) {
  const { classId } = await params
  const {
    view: viewParam,
    date: dateParam,
    weekStart: weekStartParam,
    error,
    success,
  } = await searchParams
  const view = viewParam === 'week' ? 'week' : 'day'

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: classInfo } = await supabase
    .from('classes')
    .select(
      'id, school_name, class_name, neis_atpt_code, neis_school_code'
    )
    .eq('id', classId)
    .single()

  if (!classInfo) {
    redirect('/teacher')
  }

  const { data: students, error: studentsError } = await supabase
    .from('students')
    .select('id, name, student_number')
    .eq('class_id', classId)
    .order('student_number', { ascending: true })

  if (studentsError) {
    return (
      <div className="mx-auto mt-16 max-w-md px-4">
        <p className="rounded-xl bg-red-100 p-2 text-sm text-red-700">
          학생 목록을 불러오지 못했습니다: {studentsError.message}
        </p>
      </div>
    )
  }

  const studentList = students ?? []
  const studentIds = studentList.map((s) => s.id)

  // 탭 전환 시에도 보고 있던 날짜/주가 유지되도록, 현재 컨텍스트의 기준 날짜를 먼저 계산
  const referenceDate =
    view === 'week'
      ? weekStartParam
        ? parseDateStr(weekStartParam)
        : todayKST()
      : dateParam
        ? parseDateStr(dateParam)
        : todayKST()
  const referenceMonday = mondayOf(referenceDate)
  const dayTabDateStr = formatDate(referenceDate)
  const weekTabStartStr = formatDate(referenceMonday)

  const header = (
    <div className="mx-auto mt-16 max-w-3xl px-4">
      <div className="flex items-center justify-between">
        <Link
          href={`/classes/${classId}`}
          className="text-sm text-muted underline"
        >
          ← 반 상세로
        </Link>
        <Link href="/" className="text-sm text-accent underline">
          ‹ 급식 알리미로 이동
        </Link>
      </div>

      <h1 className="mb-4 mt-2 font-serif text-2xl text-ink">
        {classInfo!.school_name} · {classInfo!.class_name} 급식 체크리스트
      </h1>

      <div className="mb-6 flex gap-2">
        <Link
          href={`/classes/${classId}/checklist?view=day&date=${dayTabDateStr}`}
          className={`rounded-xl px-3 py-1.5 text-sm ${
            view === 'day'
              ? 'bg-accent text-white'
              : 'border border-line bg-white font-medium text-ink hover:bg-[#f7efe4]'
          }`}
        >
          일별 보기
        </Link>
        <Link
          href={`/classes/${classId}/checklist?view=week&weekStart=${weekTabStartStr}`}
          className={`rounded-xl px-3 py-1.5 text-sm ${
            view === 'week'
              ? 'bg-accent text-white'
              : 'border border-line bg-white font-medium text-ink hover:bg-[#f7efe4]'
          }`}
        >
          주별 보기
        </Link>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-red-100 p-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p className="mb-4 rounded-xl bg-[#e3ece4] p-2 text-sm text-sage">
          {success}
        </p>
      )}
    </div>
  )

  if (view === 'week') {
    const monday = referenceMonday
    const weekDates = [0, 1, 2, 3, 4].map((i) => addDays(monday, i))
    const weekDateStrs = weekDates.map(formatDate)

    const { data: entries, error: entriesError } =
      studentIds.length > 0
        ? await supabase
            .from('checklist_entries')
            .select('student_id, date, level, menu_item')
            .in('student_id', studentIds)
            .in('date', weekDateStrs)
        : { data: [], error: null }

    if (entriesError) {
      return (
        <>
          {header}
          <div className="mx-auto max-w-3xl px-4">
            <p className="rounded-xl bg-red-100 p-2 text-sm text-red-700">
              체크리스트 기록을 불러오지 못했습니다: {entriesError.message}
            </p>
          </div>
        </>
      )
    }

    const levelMap = new Map(
      (entries ?? []).map((e) => [`${e.student_id}_${e.date}`, e.level as Level])
    )
    const weekMenuMap = new Map(
      (entries ?? [])
        .filter((e) => e.menu_item)
        .map((e) => [`${e.student_id}_${e.date}`, e.menu_item as string])
    )

    const prevWeekStr = formatDate(addDays(monday, -7))
    const nextWeekStr = formatDate(addDays(monday, 7))

    return (
      <>
        {header}
        <div className="mx-auto max-w-3xl px-4 pb-16">
          <div className="mb-4 flex items-center justify-between text-sm">
            <Link
              href={`/classes/${classId}/checklist?view=week&weekStart=${prevWeekStr}`}
              className="text-muted underline"
            >
              ← 이전 주
            </Link>
            <span className="font-medium text-ink">
              {weekDateStrs[0]} ~ {weekDateStrs[4]}
            </span>
            <Link
              href={`/classes/${classId}/checklist?view=week&weekStart=${nextWeekStr}`}
              className="text-muted underline"
            >
              다음 주 →
            </Link>
          </div>

          {studentList.length === 0 ? (
            <p className="text-sm text-muted">등록된 학생이 없어요.</p>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-line bg-white/90 p-2">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    <th className="border-b border-line p-2 text-left text-ink">학생</th>
                    {weekDates.map((d, i) => (
                      <th key={i} className="border-b border-line p-2 text-center text-ink">
                        {WEEKDAY_LABEL[i]}
                        <br />
                        <span className="font-normal text-muted">
                          {formatDate(d).slice(5)}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {studentList.map((s) => (
                    <tr key={s.id}>
                      <td className="border-b border-line p-2 text-ink whitespace-nowrap">
                        {s.student_number}번 {s.name}
                      </td>
                      {weekDateStrs.map((ds) => {
                        const level = levelMap.get(`${s.id}_${ds}`)
                        const menu = weekMenuMap.get(`${s.id}_${ds}`)
                        return (
                          <td key={ds} className="border-b border-line p-1 text-center">
                            <Link
                              href={`/classes/${classId}/checklist?view=day&date=${ds}`}
                              title={menu ?? level ?? undefined}
                              className={`inline-block w-full rounded-xl border px-2 py-1 text-lg ${
                                level
                                  ? LEVEL_ACTIVE_COLOR[level]
                                  : 'border-line bg-[#f4efe6] text-sm text-muted'
                              }`}
                            >
                              {level ? LEVEL_EMOJI[level] : '-'}
                            </Link>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </>
    )
  }

  // 일별 보기
  const date = referenceDate
  const dateStr = formatDate(date)

  const { data: entries, error: entriesError } =
    studentIds.length > 0
      ? await supabase
          .from('checklist_entries')
          .select('student_id, level, menu_item')
          .in('student_id', studentIds)
          .eq('date', dateStr)
      : { data: [], error: null }

  if (entriesError) {
    return (
      <>
        {header}
        <div className="mx-auto max-w-3xl px-4">
          <p className="rounded-xl bg-red-100 p-2 text-sm text-red-700">
            체크리스트 기록을 불러오지 못했습니다: {entriesError.message}
          </p>
        </div>
      </>
    )
  }

  const levelByStudent = new Map(
    (entries ?? []).map((e) => [e.student_id, e.level as Level])
  )
  const menuByStudent = new Map(
    (entries ?? [])
      .filter((e) => e.menu_item)
      .map((e) => [e.student_id, e.menu_item as string])
  )

  const prevDateStr = formatDate(addDays(date, -1))
  const nextDateStr = formatDate(addDays(date, 1))

  const todayMenu =
    classInfo!.neis_atpt_code && classInfo!.neis_school_code
      ? await fetchTodayMenu(
          classInfo!.neis_atpt_code,
          classInfo!.neis_school_code,
          dateStr.replace(/-/g, '')
        ).catch(() => [])
      : []

  return (
    <>
      {header}
      <div className="mx-auto max-w-3xl px-4 pb-16">
        <div className="mb-4 flex items-center justify-between text-sm">
          <Link
            href={`/classes/${classId}/checklist?view=day&date=${prevDateStr}`}
            className="text-muted underline"
          >
            ← 이전 날짜
          </Link>
          <span className="font-medium text-ink">{dateStr}</span>
          <Link
            href={`/classes/${classId}/checklist?view=day&date=${nextDateStr}`}
            className="text-muted underline"
          >
            다음 날짜 →
          </Link>
        </div>

        {studentList.length === 0 ? (
          <p className="text-sm text-muted">등록된 학생이 없어요.</p>
        ) : (
          <>
            <form
              id="bulk-checklist-form"
              action={setChecklistEntriesBulk}
              className="mb-3 flex items-center justify-end gap-2"
            >
              <input type="hidden" name="class_id" value={classId} />
              <input type="hidden" name="date" value={dateStr} />
              <input type="hidden" name="view" value="day" />
              {LEVELS.map((level) => (
                <button
                  key={level}
                  type="submit"
                  name="level"
                  value={level}
                  className={`rounded-xl border px-3 py-1.5 text-sm ${LEVEL_ACTIVE_COLOR[level]}`}
                >
                  선택 학생 {level}
                </button>
              ))}
            </form>

            <ul key={dateStr} className="flex flex-col gap-2">
            {studentList.map((s) => {
              const currentLevel = levelByStudent.get(s.id)
              const savedMenuSet = new Set(
                (menuByStudent.get(s.id) ?? '')
                  .split(',')
                  .map((m) => m.trim())
                  .filter(Boolean)
              )
              return (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-line bg-white/90 px-4 py-3"
                >
                  <label className="flex flex-col gap-0.5 text-sm">
                    <span className="flex items-center gap-2 text-ink">
                      <input
                        type="checkbox"
                        name="student_ids"
                        value={s.id}
                        form="bulk-checklist-form"
                        className="h-4 w-4"
                      />
                      {s.student_number}번 {s.name}
                    </span>
                    {menuByStudent.get(s.id) && (
                      <span className="pl-6 text-xs text-muted">
                        {menuByStudent.get(s.id)}
                      </span>
                    )}
                  </label>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted">상태</span>
                      <form
                        action={setChecklistEntry}
                        className="flex flex-wrap justify-end gap-2"
                      >
                        <input type="hidden" name="class_id" value={classId} />
                        <input type="hidden" name="student_id" value={s.id} />
                        <input type="hidden" name="date" value={dateStr} />
                        <input type="hidden" name="view" value="day" />
                        {LEVELS.map((level) => (
                          <button
                            key={level}
                            type="submit"
                            name="level"
                            value={level}
                            className={`rounded-xl border px-3 py-1.5 text-sm ${
                              currentLevel === level
                                ? LEVEL_ACTIVE_COLOR[level]
                                : 'border-line bg-white text-muted hover:bg-[#f7efe4]'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </form>
                    </div>

                    {todayMenu.length > 0 && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted">메뉴</span>
                        <MenuPicker
                          studentId={s.id}
                          date={dateStr}
                          level={currentLevel}
                          todayMenu={todayMenu}
                          initialSelected={Array.from(savedMenuSet)}
                        />
                      </div>
                    )}
                  </div>
                </li>
              )
            })}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
