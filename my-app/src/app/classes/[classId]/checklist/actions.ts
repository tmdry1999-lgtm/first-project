'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function setChecklistLevel(input: {
  studentId: string
  date: string
  level: string
}): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다' }
  }

  // menu_item은 건드리지 않아서, 상태만 바꿔도 이미 골라둔 메뉴가 지워지지 않음
  const { error } = await supabase.from('checklist_entries').upsert(
    { student_id: input.studentId, date: input.date, level: input.level },
    { onConflict: 'student_id,date' }
  )

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function updateChecklistMenu(input: {
  studentId: string
  date: string
  level: string
  menuItems: string[]
}): Promise<{ error: string | null }> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: '로그인이 필요합니다' }
  }

  const menuItem = input.menuItems.length > 0 ? input.menuItems.join(', ') : null

  const { error } = await supabase.from('checklist_entries').upsert(
    {
      student_id: input.studentId,
      date: input.date,
      level: input.level,
      menu_item: menuItem,
    },
    { onConflict: 'student_id,date' }
  )

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function setChecklistEntriesBulk(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const classId = formData.get('class_id') as string
  const date = formData.get('date') as string
  const view = (formData.get('view') as string) || 'day'
  const level = formData.get('level') as string
  const studentIds = formData.getAll('student_ids') as string[]

  const redirectUrl = `/classes/${classId}/checklist?view=${view}&date=${date}`

  if (studentIds.length === 0) {
    redirect(
      `${redirectUrl}&error=${encodeURIComponent('선택된 학생이 없습니다')}`
    )
  }

  const rows = studentIds.map((studentId) => ({
    student_id: studentId,
    date,
    level,
  }))

  const { error } = await supabase
    .from('checklist_entries')
    .upsert(rows, { onConflict: 'student_id,date' })

  if (error) {
    redirect(`${redirectUrl}&error=${encodeURIComponent(error.message)}`)
  }

  redirect(
    `${redirectUrl}&success=${encodeURIComponent(
      `${studentIds.length}명을 ${level}로 표시했습니다`
    )}`
  )
}
