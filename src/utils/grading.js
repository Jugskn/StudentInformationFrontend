export const PASSING_THRESHOLD = 75

/**
 * Final rating = avg(midterm, final) when both set; else final alone; else null (pending).
 */
export function computeFinalRating(midtermGrade, finalGrade) {
  const mid = toNullableNumber(midtermGrade)
  const fin = toNullableNumber(finalGrade)

  if (mid != null && fin != null) {
    return round2((mid + fin) / 2)
  }
  if (fin != null) {
    return round2(fin)
  }
  return null
}

/**
 * Passed if rating >= 75, Failed if set and below, empty string when pending.
 */
export function computeRemarks(finalRating) {
  if (finalRating == null || finalRating === '') return ''
  const rating = Number(finalRating)
  if (Number.isNaN(rating)) return ''
  return rating >= PASSING_THRESHOLD ? 'Passed' : 'Failed'
}

function toNullableNumber(value) {
  if (value == null || value === '') return null
  const num = Number(value)
  return Number.isNaN(num) ? null : num
}

function round2(value) {
  return Math.round(value * 100) / 100
}
