'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  searchNeisSchools,
  fetchMealRows,
  parseDish,
  ALLERGY_MAP,
  type NeisSchool,
  type NeisMealRow,
} from '@/utils/neis'

const STORAGE_KEY = 'meal-notifier-school'
const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

function todayInSeoul() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = Number(parts.find((p) => p.type === 'year')!.value)
  const month = Number(parts.find((p) => p.type === 'month')!.value)
  const day = Number(parts.find((p) => p.type === 'day')!.value)
  return new Date(year, month - 1, day)
}

function shiftDate(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function toYmd(date: Date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}${m}${d}`
}

function isSameDay(a: Date, b: Date) {
  return toYmd(a) === toYmd(b)
}

function buildNaverImageSearchUrl(query: string) {
  return `https://search.naver.com/search.naver?where=image&sm=tab_jum&query=${encodeURIComponent(query)}`
}

export default function MealNotifierPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<NeisSchool[]>([])
  const [showResults, setShowResults] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [selectedSchool, setSelectedSchool] = useState<NeisSchool | null>(null)
  const [viewDate, setViewDate] = useState<Date>(() => todayInSeoul())
  const [rows, setRows] = useState<NeisMealRow[] | null>(null)
  const [mealError, setMealError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const school = JSON.parse(raw) as NeisSchool
        setSelectedSchool(school)
        setQuery(school.SCHUL_NM)
      }
    } catch {
      // localStorage를 못 읽으면 그냥 학교 미선택 상태로 시작
    }
  }, [])

  useEffect(() => {
    if (!selectedSchool) return

    let cancelled = false
    setLoading(true)
    setMealError(null)

    fetchMealRows(
      selectedSchool.ATPT_OFCDC_SC_CODE,
      selectedSchool.SD_SCHUL_CODE,
      toYmd(viewDate)
    )
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setMealError(
            error instanceof Error ? error.message : '급식 정보를 불러오지 못했습니다'
          )
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [selectedSchool, viewDate])

  async function handleSearch() {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setShowResults(false)
      setResults([])
      return
    }

    try {
      const schools = await searchNeisSchools(trimmed)
      setResults(schools)
      setShowResults(true)
      setSearchError(schools.length === 0 ? '검색 결과가 없습니다.' : null)
    } catch (error) {
      setResults([])
      setShowResults(true)
      setSearchError(error instanceof Error ? error.message : '검색에 실패했습니다')
    }
  }

  function handleSelectSchool(school: NeisSchool) {
    setSelectedSchool(school)
    setQuery(school.SCHUL_NM)
    setShowResults(false)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(school))
    } catch {
      // 저장 실패해도 화면 동작에는 지장 없음
    }
  }

  const today = todayInSeoul()

  return (
    <div className="mx-auto mt-10 max-w-2xl px-4 pb-16">
      <header className="mb-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent-dark">
              School Lunch Notifier
            </p>
            <h1 className="font-serif text-3xl text-ink sm:text-4xl">
              오늘 급식 알리미
            </h1>
          </div>
          <Link
            href="/teacher"
            className="whitespace-nowrap text-sm font-semibold text-accent-dark underline"
          >
            급식체크리스트로 이동 ›
          </Link>
        </div>
        <p className="mt-2 text-muted">
          학교를 고르면 해당 날짜의 조식 · 중식 · 석식을 바로 보여 줍니다.
        </p>
      </header>

      <section className="mb-5 rounded-[22px] border border-line bg-white/90 p-5 shadow-sm">
        <label
          htmlFor="school-search"
          className="mb-2 block text-sm font-semibold text-ink"
        >
          학교 검색
        </label>
        <div className="flex gap-2">
          <input
            id="school-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleSearch()
              }
            }}
            placeholder="학교 이름을 입력하세요 (예: 서울고등학교)"
            autoComplete="off"
            className="flex-1 rounded-2xl border border-line bg-white px-4 py-3 outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={handleSearch}
            className="rounded-2xl bg-accent px-5 font-semibold text-white hover:bg-accent-dark"
          >
            검색
          </button>
        </div>

        <p className="mt-3 font-semibold text-sage">
          {selectedSchool
            ? `${selectedSchool.SCHUL_NM} · ${selectedSchool.ATPT_OFCDC_SC_NM}`
            : '학교를 검색해 선택해 주세요.'}
        </p>

        {showResults && (
          <ul className="mt-3 max-h-60 overflow-auto">
            {results.length > 0 ? (
              results.map((school) => (
                <li
                  key={`${school.ATPT_OFCDC_SC_CODE}-${school.SD_SCHUL_CODE}`}
                  className="mb-1.5"
                >
                  <button
                    type="button"
                    onClick={() => handleSelectSchool(school)}
                    className="w-full rounded-xl bg-white px-3 py-2 text-left hover:bg-[#f7efe4]"
                  >
                    {school.SCHUL_NM}
                    <span className="mt-0.5 block text-xs text-muted">
                      {school.ATPT_OFCDC_SC_NM} · {school.SCHUL_KND_SC_NM} ·{' '}
                      {school.ORG_RDNMA}
                    </span>
                  </button>
                </li>
              ))
            ) : (
              <li>
                <button
                  type="button"
                  disabled
                  className="w-full rounded-xl px-3 py-2 text-left text-muted"
                >
                  {searchError ?? '검색 결과가 없습니다.'}
                </button>
              </li>
            )}
          </ul>
        )}
      </section>

      <section className="mb-5 grid grid-cols-[56px_1fr_56px] items-center gap-2 rounded-[22px] border border-line bg-white/90 p-4 shadow-sm">
        <button
          type="button"
          aria-label="이전 날"
          onClick={() => setViewDate((d) => shiftDate(d, -1))}
          className="h-14 rounded-2xl bg-[#efe4d6] text-2xl text-ink hover:bg-accent hover:text-white"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="m-0 text-sm text-muted">{WEEKDAYS[viewDate.getDay()]}</p>
          <h2 className="my-1 text-xl text-ink">
            {viewDate.getFullYear()}년 {viewDate.getMonth() + 1}월{' '}
            {viewDate.getDate()}일
          </h2>
          {!isSameDay(viewDate, today) && (
            <button
              type="button"
              onClick={() => setViewDate(todayInSeoul())}
              className="rounded-xl bg-accent px-3 py-1 text-xs font-semibold text-white hover:bg-accent-dark"
            >
              오늘로 이동
            </button>
          )}
        </div>
        <button
          type="button"
          aria-label="다음 날"
          onClick={() => setViewDate((d) => shiftDate(d, 1))}
          className="h-14 rounded-2xl bg-[#efe4d6] text-2xl text-ink hover:bg-accent hover:text-white"
        >
          ›
        </button>
      </section>

      <main className="grid gap-3.5">
        {!selectedSchool ? (
          <EmptyState
            title="학교를 먼저 선택해 주세요"
            message="검색창에 학교 이름을 입력하면 전국 초·중·고 급식을 조회할 수 있습니다."
          />
        ) : loading ? (
          <EmptyState title="급식을 불러오는 중..." message="잠시만 기다려 주세요." />
        ) : mealError ? (
          <EmptyState title="불러오기 실패" message={mealError} />
        ) : !rows || rows.length === 0 ? (
          <EmptyState
            title="급식 정보가 없습니다"
            message="주말, 공휴일, 방학이거나 아직 식단이 등록되지 않았을 수 있습니다."
          />
        ) : (
          rows.map((row, i) => {
            const dishes = row.DDISH_NM.split(/<br\s*\/?>/i)
              .map(parseDish)
              .filter((dish) => dish.name)

            return (
              <article
                key={i}
                className="rounded-[22px] border border-line bg-white/90 px-5 py-5 shadow-sm"
              >
                <div className="mb-3 flex items-baseline justify-between gap-3">
                  <h3 className="m-0 text-lg text-ink">{row.MMEAL_SC_NM}</h3>
                  <span className="text-sm font-bold text-accent-dark">
                    {row.CAL_INFO ?? ''}
                  </span>
                </div>
                <ul className="m-0 grid gap-2.5 p-0">
                  {dishes.map((dish, j) => {
                    const tags = dish.codes
                      .map((code) => ALLERGY_MAP[code])
                      .filter(Boolean)
                      .join(', ')
                    return (
                      <li
                        key={j}
                        className={`pb-2.5 ${
                          j < dishes.length - 1
                            ? 'border-b border-dashed border-line'
                            : ''
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            window.open(
                              buildNaverImageSearchUrl(`${dish.name} 음식`),
                              '_blank',
                              'noopener,noreferrer'
                            )
                          }
                          className="flex w-full items-center justify-between gap-3 text-left text-ink"
                        >
                          <span>{dish.name}</span>
                          <span className="max-w-[48%] text-right text-xs text-muted">
                            {tags}
                          </span>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </article>
            )
          })
        )}
      </main>

      <section className="mt-4 rounded-[22px] border border-line bg-white/90 px-5 py-2 shadow-sm">
        <details>
          <summary className="cursor-pointer py-2.5 font-semibold text-ink">
            알레르기 유발 식재료 번호
          </summary>
          <ol className="m-0 columns-2 gap-4 pl-5 text-muted">
            {Object.entries(ALLERGY_MAP).map(([code, name]) => (
              <li key={code}>
                {code}. {name}
              </li>
            ))}
          </ol>
        </details>
      </section>

      <footer className="mt-5 text-center text-xs text-muted">
        데이터 출처: 나이스 교육정보 개방 포털 (open.neis.go.kr)
      </footer>
    </div>
  )
}

function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <article className="rounded-[22px] border border-line bg-white/90 px-6 py-9 text-center shadow-sm">
      <strong className="mb-2 block text-lg text-ink">{title}</strong>
      <p className="m-0 text-muted">{message}</p>
    </article>
  )
}
