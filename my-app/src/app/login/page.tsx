import Link from 'next/link'
import { login } from './actions'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams

  return (
    <div className="mx-auto mt-20 max-w-sm px-4">
      <h1 className="mb-6 font-serif text-2xl text-ink">선생님 로그인</h1>

      {params.error && (
        <p className="mb-4 rounded-xl bg-red-100 p-2 text-sm text-red-700">
          {params.error}
        </p>
      )}

      <form className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm text-ink">
            이메일
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm text-ink">
            비밀번호
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        <button
          formAction={login}
          className="mt-2 rounded-xl bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark"
        >
          로그인
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-accent underline">
          회원가입
        </Link>
      </p>
    </div>
  )
}
