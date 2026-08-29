import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { addStudent, addStudentsBulk, linkNeisSchool } from './actions'
import { searchNeisSchools } from '@/utils/neis'

export const dynamic = 'force-dynamic'

export default async function ClassDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string }>
  searchParams: Promise<{
    error?: string
    success?: string
    school_query?: string
  }>
}) {
  const { classId } = await params
  const { error, success, school_query: schoolQuery } = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: classInfo } = await supabase
    .from('classes')
    .select('id, school_name, class_name, neis_atpt_code, neis_school_code')
    .eq('id', classId)
    .single()

  if (!classInfo) {
    redirect('/teacher')
  }

  const schoolResults =
    !classInfo.neis_atpt_code && schoolQuery
      ? await searchNeisSchools(schoolQuery).catch(() => [])
      : []

  const { data: students } = await supabase
    .from('students')
    .select('id, name, student_number')
    .eq('class_id', classId)
    .order('student_number', { ascending: true })

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <Link href="/teacher" className="text-sm text-muted underline">
        ← 반 목록으로
      </Link>

      <h1 className="mb-2 mt-2 font-serif text-2xl text-ink">
        {classInfo.school_name} · {classInfo.class_name}
      </h1>

      <Link
        href={`/classes/${classId}/checklist`}
        className="mb-8 inline-block text-sm text-accent underline"
      >
        급식 체크리스트 보러가기 →
      </Link>

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

      {classInfo.neis_atpt_code ? (
        <p className="mb-8 text-sm text-muted">
          ✓ NEIS 학교 연결됨 (체크리스트에서 메뉴 선택 가능)
        </p>
      ) : (
        <div className="mb-8 rounded-2xl border border-dashed border-line bg-white/60 p-4">
          <p className="mb-2 text-sm text-muted">
            NEIS 학교를 연결하면 체크리스트에서 그날 급식 메뉴를 골라 기록할
            수 있어요.
          </p>
          <form method="get" className="flex gap-2">
            <input
              name="school_query"
              defaultValue={schoolQuery}
              placeholder="학교 이름 검색 (예: 서울초등학교)"
              className="flex-1 rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none focus:border-accent"
            />
            <button
              type="submit"
              className="rounded-xl bg-accent px-3 py-2 text-sm text-white hover:bg-accent-dark"
            >
              검색
            </button>
          </form>

          {schoolQuery && (
            <ul className="mt-3 flex flex-col gap-2">
              {schoolResults.length > 0 ? (
                schoolResults.map((school) => (
                  <li key={`${school.ATPT_OFCDC_SC_CODE}-${school.SD_SCHUL_CODE}`}>
                    <form action={linkNeisSchool}>
                      <input type="hidden" name="class_id" value={classId} />
                      <input
                        type="hidden"
                        name="atpt_code"
                        value={school.ATPT_OFCDC_SC_CODE}
                      />
                      <input
                        type="hidden"
                        name="school_code"
                        value={school.SD_SCHUL_CODE}
                      />
                      <button
                        type="submit"
                        className="w-full rounded-xl border border-line bg-white px-3 py-2 text-left text-sm hover:bg-[#f7efe4]"
                      >
                        {school.SCHUL_NM}
                        <span className="ml-2 text-xs text-muted">
                          {school.ATPT_OFCDC_SC_NM} · {school.SCHUL_KND_SC_NM}
                        </span>
                      </button>
                    </form>
                  </li>
                ))
              ) : (
                <li className="text-sm text-muted">검색 결과가 없어요.</li>
              )}
            </ul>
          )}
        </div>
      )}

      <h2 className="mb-3 text-lg font-semibold text-ink">학생 목록</h2>
      <ul className="mb-8 flex flex-col gap-2">
        {students && students.length > 0 ? (
          students.map((s) => (
            <li
              key={s.id}
              className="rounded-2xl border border-line bg-white/90 px-4 py-3 text-sm text-ink"
            >
              {s.student_number}번 {s.name}
            </li>
          ))
        ) : (
          <li className="text-sm text-muted">
            아직 등록된 학생이 없어요. 아래에서 추가해보세요.
          </li>
        )}
      </ul>

      <h2 className="mb-3 text-lg font-semibold text-ink">학생 추가</h2>
      <form action={addStudent} className="flex flex-col gap-4">
        <input type="hidden" name="class_id" value={classId} />

        <div>
          <label htmlFor="name" className="mb-1 block text-sm text-ink">
            이름
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="student_number" className="mb-1 block text-sm text-ink">
            번호
          </label>
          <input
            id="student_number"
            name="student_number"
            type="number"
            min={1}
            required
            className="w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        <button
          type="submit"
          className="mt-2 rounded-xl bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark"
        >
          학생 추가
        </button>
      </form>

      <h2 className="mb-3 mt-10 text-lg font-semibold text-ink">학생 명단 추가</h2>
      <p className="mb-3 text-sm text-muted">
        번호와 이름은 띄어쓰기로, 학생과 학생 사이는 줄바꿈이나 쉼표로
        구분해서 붙여넣으세요.
        <br />
        예) 1 홍길동, 2 김철수 또는 줄바꿈으로 구분
      </p>
      <form action={addStudentsBulk} className="flex flex-col gap-4">
        <input type="hidden" name="class_id" value={classId} />

        <textarea
          name="roster"
          required
          rows={6}
          placeholder={'1 홍길동\n2 김철수\n3 이영희'}
          className="w-full rounded-xl border border-line bg-white px-3 py-2 font-mono text-sm outline-none focus:border-accent"
        />

        <button
          type="submit"
          className="mt-2 rounded-xl bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark"
        >
          명단 추가
        </button>
      </form>
    </div>
  )
}
