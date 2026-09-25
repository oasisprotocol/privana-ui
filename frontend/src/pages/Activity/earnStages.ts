import type { OperationStage } from '@/api/operations'
import { getProtocolLabel } from '@/config/protocols'

export type EarnStageStep = {
  stage: string
  label: string
  /** Unix seconds the stage was reached, or undefined while it is still ahead. */
  at?: number
  state: 'done' | 'active' | 'upcoming'
}

// The order the services report stages in. A pool without an external
// strategy skips the protocol legs and only ever reports its ledger step.
const PLAN: Record<'deposit' | 'withdraw', string[]> = {
  deposit: ['recording', 'bridging', 'deploying'],
  withdraw: ['reclaiming', 'returning', 'finality', 'paying_out'],
}

const stageLabel = (stage: string, protocol: string, detail?: OperationStage['detail']): string => {
  const venue = getProtocolLabel(protocol) || 'the protocol'
  switch (stage) {
    case 'recording':
      return 'Recording your deposit'
    case 'bridging':
      return `Moving funds to ${venue}`
    case 'deploying':
      return `Putting funds to work in ${venue}`
    case 'reclaiming':
      return `Withdrawing from ${venue}`
    case 'returning':
      return 'Sending funds back'
    case 'finality': {
      const done = detail?.confirmations
      const required = detail?.required
      return done != null && required != null
        ? `Waiting for network confirmations (${Math.min(done, required)} of ${required})`
        : 'Waiting for network confirmations'
    }
    case 'paying_out':
      return 'Returning to your available balance'
    default:
      return 'Processing'
  }
}

/** Every step of the operation with the ones reached so far stamped. */
export function earnStageSteps(
  direction: 'deposit' | 'withdraw',
  protocol: string,
  allStages: OperationStage[],
): EarnStageStep[] {
  // The services record status transitions in the same timeline; only the
  // strategy stages are steps a user follows.
  const stages = allStages.filter(s => s.stage !== 'status')
  const reached = new Map(stages.map(s => [s.stage, s]))
  const plan = PLAN[direction].filter(
    stage => reached.has(stage) || stages.length === 0 || isAhead(stage, stages, direction),
  )
  const current = stages[stages.length - 1]?.stage
  return plan.map(stage => {
    const hit = reached.get(stage)
    return {
      stage,
      label: stageLabel(stage, protocol, hit?.detail),
      at: hit?.at,
      state: stage === current ? 'active' : hit ? 'done' : 'upcoming',
    }
  })
}

// A stage still ahead of the last one reported. Stages behind it that were
// never reported were skipped, e.g. a deposit whose funds were already on the
// earn account never bridges.
function isAhead(stage: string, stages: OperationStage[], direction: 'deposit' | 'withdraw'): boolean {
  const order = PLAN[direction]
  const last = stages[stages.length - 1]?.stage
  return last == null || order.indexOf(stage) > order.indexOf(last)
}

/** One-line status for the row, and how far along the bar should be. */
export function earnStageSummary(
  direction: 'deposit' | 'withdraw',
  protocol: string,
  allStages: OperationStage[],
): { label: string; percent: number } | null {
  const stages = allStages.filter(s => s.stage !== 'status')
  const last = stages[stages.length - 1]
  if (!last) return null
  const steps = earnStageSteps(direction, protocol, stages)
  const index = steps.findIndex(s => s.stage === last.stage)
  let within = 0.5
  if (last.stage === 'finality' && last.detail?.confirmations != null && last.detail?.required) {
    within = Math.min(1, last.detail.confirmations / last.detail.required)
  }
  const percent = steps.length ? Math.round(((Math.max(index, 0) + within) / steps.length) * 100) : 50
  return { label: stageLabel(last.stage, protocol, last.detail), percent }
}
