import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { createClass, logout } from './actions'

export const dynamic = 'force-dynamic'

export default async function TeacherHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: classes } = await supabase
    .from('classes')
    .select('id, school_name, class_name')
    .eq('teacher_id', user.id)

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink">내 반 목록</h1>
        <form action={logout}>
          <button className="text-sm text-muted underline">로그아웃</button>
        </form>
      </div>

      <Link href="/" className="mb-4 inline-block text-sm text-accent underline">
        ‹ 급식 알리미로 이동
      </Link>

      {params.error && (
        <p className="mb-4 rounded-xl bg-red-100 p-2 text-sm text-red-700">
          {params.error}
        </p>
      )}

      <ul className="mb-8 flex flex-col gap-2">
        {classes && classes.length > 0 ? (
          classes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/classes/${c.id}`}
                className="block rounded-2xl border border-line bg-white/90 px-4 py-3 text-sm text-ink hover:bg-[#f7efe4]"
              >
                {c.school_name} · {c.class_name}
              </Link>
            </li>
          ))
        ) : (
          <li className="text-sm text-muted">
            아직 만든 반이 없어요. 아래에서 새 반을 만들어보세요.
          </li>
        )}
      </ul>

      <h2 className="mb-3 text-lg font-semibold text-ink">새 반 만들기</h2>
      <form action={createClass} className="flex flex-col gap-4">
        <div>
          <label htmlFor="school_name" className="mb-1 block text-sm text-ink">
            학교 이름
          </label>
          <input
            id="school_name"
            name="school_name"
            type="text"
            required
            className="w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="class_name" className="mb-1 block text-sm text-ink">
            반 이름
          </label>
          <input
            id="class_name"
            name="class_name"
            type="text"
            required
            placeholder="예: 1학년 3반"
            className="w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        <button
          type="submit"
          className="mt-2 rounded-xl bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark"
        >
          반 만들기
        </button>
      </form>
    </div>
  )
}
