'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function addStudent(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const classId = formData.get('class_id') as string
  const name = formData.get('name') as string
  const studentNumber = Number(formData.get('student_number'))

  const { error } = await supabase.from('students').insert({
    class_id: classId,
    name,
    student_number: studentNumber,
  })

  if (error) {
    const message =
      error.code === '23505' ? '이미 등록된 번호입니다' : error.message
    redirect(`/classes/${classId}?error=${encodeURIComponent(message)}`)
  }

  redirect(
    `/classes/${classId}?success=${encodeURIComponent('등록이 완료되었습니다!')}`
  )
}

export async function linkNeisSchool(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const classId = formData.get('class_id') as string
  const atptCode = formData.get('atpt_code') as string
  const schoolCode = formData.get('school_code') as string

  const { error } = await supabase
    .from('classes')
    .update({ neis_atpt_code: atptCode, neis_school_code: schoolCode })
    .eq('id', classId)

  if (error) {
    redirect(`/classes/${classId}?error=${encodeURIComponent(error.message)}`)
  }

  redirect(
    `/classes/${classId}?success=${encodeURIComponent('학교를 연결했습니다!')}`
  )
}

export async function addStudentsBulk(formData: FormData) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const classId = formData.get('class_id') as string
  const rosterText = formData.get('roster') as string

  const rows = rosterText
    .split(/[\n,]+/)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .map((entry) => {
      const [numberPart, ...rest] = entry.split(/\s+/).filter(Boolean)
      return {
        class_id: classId,
        student_number: Number(numberPart),
        name: rest.join(' ').trim(),
      }
    })

  if (rows.length === 0) {
    redirect(
      `/classes/${classId}?error=${encodeURIComponent('붙여넣은 명단이 비어있습니다')}`
    )
  }

  const hasInvalidRow = rows.some(
    (r) => !r.name || !Number.isInteger(r.student_number) || r.student_number <= 0
  )

  if (hasInvalidRow) {
    redirect(
      `/classes/${classId}?error=${encodeURIComponent(
        '형식이 올바르지 않은 줄이 있습니다. "번호  이름" 형식으로 한 줄에 한 명씩 입력해주세요'
      )}`
    )
  }

  const { error } = await supabase.from('students').insert(rows)

  if (error) {
    const message =
      error.code === '23505'
        ? '이미 등록된 번호가 명단에 포함되어 있습니다'
        : error.message
    redirect(`/classes/${classId}?error=${encodeURIComponent(message)}`)
  }

  redirect(
    `/classes/${classId}?success=${encodeURIComponent('등록이 완료되었습니다!')}`
  )
}
