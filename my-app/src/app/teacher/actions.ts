'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function createClass(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const schoolName = formData.get('school_name') as string
  const className = formData.get('class_name') as string

  const { error } = await supabase.from('classes').insert({
    school_name: schoolName,
    class_name: className,
    teacher_id: user.id,
  })

  if (error) {
    const message =
      error.code === '23505' ? '이미 생성된 반입니다' : error.message
    redirect(`/teacher?error=${encodeURIComponent(message)}`)
  }

  redirect('/teacher')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
