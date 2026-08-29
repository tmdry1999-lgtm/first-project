import { type EmailOtpType } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const supabase = await createClient()

  // 최신 Supabase 프로젝트 방식: ?code=... (PKCE)
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      redirect(
        `/login?message=${encodeURIComponent(
          '이메일 인증이 완료되었습니다. 로그인해주세요'
        )}`
      )
    }
  }

  // 예전 방식: ?token_hash=...&type=...
  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) {
      redirect(
        `/login?message=${encodeURIComponent(
          '이메일 인증이 완료되었습니다. 로그인해주세요'
        )}`
      )
    }
  }

  redirect(
    `/login?error=${encodeURIComponent(
      '인증 링크가 유효하지 않거나 만료되었습니다. 회원가입을 다시 시도해주세요'
    )}`
  )
}
