export const LEVELS = ['다 먹었어요!', '노력했어요!', '더 노력해봐요!'] as const
export type Level = (typeof LEVELS)[number]

export const LEVEL_ACTIVE_COLOR: Record<Level, string> = {
  '다 먹었어요!': 'border-green-500 bg-green-100 text-green-800',
  '노력했어요!': 'border-yellow-500 bg-yellow-100 text-yellow-800',
  '더 노력해봐요!': 'border-red-500 bg-red-100 text-red-800',
}

export const LEVEL_EMOJI: Record<Level, string> = {
  '다 먹었어요!': '😊',
  '노력했어요!': '💪',
  '더 노력해봐요!': '😂',
}
