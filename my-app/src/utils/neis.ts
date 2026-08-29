const NEIS_BASE = 'https://open.neis.go.kr/hub'

export type NeisSchool = {
  ATPT_OFCDC_SC_CODE: string
  SD_SCHUL_CODE: string
  SCHUL_NM: string
  ATPT_OFCDC_SC_NM: string
  SCHUL_KND_SC_NM: string
  ORG_RDNMA: string
}

export type NeisMealRow = {
  MMEAL_SC_NM: string
  CAL_INFO?: string
  DDISH_NM: string
}

export type ParsedDish = {
  name: string
  codes: number[]
}

// 나이스 급식 메뉴에 붙는 알레르기 번호 안내
export const ALLERGY_MAP: Record<number, string> = {
  1: '난류',
  2: '우유',
  3: '메밀',
  4: '땅콩',
  5: '대두',
  6: '밀',
  7: '고등어',
  8: '게',
  9: '새우',
  10: '돼지고기',
  11: '복숭아',
  12: '토마토',
  13: '아황산류',
  14: '호두',
  15: '닭고기',
  16: '쇠고기',
  17: '오징어',
  18: '조개류',
  19: '잣',
}

async function fetchNeis(endpoint: string, params: Record<string, string>) {
  const url = new URL(`${NEIS_BASE}/${endpoint}`)
  url.searchParams.set('Type', 'json')
  url.searchParams.set('pIndex', '1')
  url.searchParams.set('pSize', '20')

  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  const response = await fetch(url, { cache: 'no-store' })
  if (!response.ok) {
    throw new Error('NEIS 응답을 받지 못했습니다')
  }
  return response.json()
}

export async function searchNeisSchools(name: string): Promise<NeisSchool[]> {
  const data = await fetchNeis('schoolInfo', { SCHUL_NM: name })
  return data.schoolInfo?.[1]?.row ?? []
}

export function parseDish(raw: string): ParsedDish {
  const text = raw.replace(/<br\s*\/?>/gi, '\n').trim()
  const match = text.match(/^(.*?)(?:\s*\(([0-9.]+)\))?$/)
  const name = (match?.[1] || text).replace(/\s+/g, ' ').trim()
  const codes = (match?.[2] || '')
    .split('.')
    .map((code) => Number(code))
    .filter((code) => ALLERGY_MAP[code])

  return { name, codes }
}

export async function fetchMealRows(
  atptCode: string,
  schoolCode: string,
  ymd: string
): Promise<NeisMealRow[]> {
  const data = await fetchNeis('mealServiceDietInfo', {
    ATPT_OFCDC_SC_CODE: atptCode,
    SD_SCHUL_CODE: schoolCode,
    MLSV_YMD: ymd,
  })

  if (data.RESULT?.CODE === 'INFO-200' || !data.mealServiceDietInfo) {
    return []
  }

  return data.mealServiceDietInfo[1]?.row ?? []
}

export async function fetchTodayMenu(
  atptCode: string,
  schoolCode: string,
  ymd: string
): Promise<string[]> {
  const rows = await fetchMealRows(atptCode, schoolCode, ymd)

  const dishes = rows.flatMap((row) =>
    row.DDISH_NM.split(/<br\s*\/?>/i)
      .map((raw) => parseDish(raw).name)
      .filter((name) => name.length > 0)
  )

  return Array.from(new Set(dishes))
}
