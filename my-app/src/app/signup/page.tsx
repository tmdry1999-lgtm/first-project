import Link from 'next/link'
import { signup } from '../login/actions'

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>
}) {
  const params = await searchParams

  return (
    <div className="mx-auto mt-20 max-w-sm px-4">
      <h1 className="mb-6 font-serif text-2xl text-ink">선생님 회원가입</h1>

      {params.error && (
        <p className="mb-4 rounded-xl bg-red-100 p-2 text-sm text-red-700">
          {params.error}
        </p>
      )}
      {params.message && (
        <p className="mb-4 rounded-xl bg-[#f7e9df] p-2 text-sm text-accent-dark">
          {params.message}
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
            비밀번호 (6자 이상)
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-xl border border-line bg-white px-3 py-2 outline-none focus:border-accent"
          />
        </div>

        <button
          formAction={signup}
          className="mt-2 rounded-xl bg-accent px-4 py-2 font-medium text-white hover:bg-accent-dark"
        >
          회원가입
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-accent underline">
          로그인
        </Link>
      </p>
    </div>
  )
}
