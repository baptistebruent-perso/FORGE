/** Epley formula for estimated 1RM */
export function epley1RM(weight: number, reps: number): number {
  if (reps <= 0) return 0
  if (reps === 1) return weight
  return Math.round(weight * (1 + reps / 30) * 10) / 10
}

/** Volume for a single set */
export function setVolume(weight: number, reps: number): number {
  return Math.round(weight * reps * 10) / 10
}

export interface PRCheckResult {
  isMaxWeight: boolean
  isMaxReps: boolean
  is1RMRecord: boolean
  new1RM: number
  newVolume: number
}

export interface CurrentRecords {
  maxWeight: number
  maxReps: number
  max1RM: number
}

/**
 * Check if a set beats existing records.
 * All values default to 0 if no prior records exist.
 */
export function checkPR(
  weight: number,
  reps: number,
  current: CurrentRecords
): PRCheckResult {
  const new1RM = epley1RM(weight, reps)
  const newVolume = setVolume(weight, reps)
  return {
    isMaxWeight: weight > current.maxWeight,
    isMaxReps: reps > current.maxReps,
    is1RMRecord: new1RM > current.max1RM,
    new1RM,
    newVolume,
  }
}

export function hasAnyPR(result: PRCheckResult): boolean {
  return result.isMaxWeight || result.isMaxReps || result.is1RMRecord
}
