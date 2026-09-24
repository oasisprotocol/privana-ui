import { describe, expect, it } from 'vitest'
import { earnStageSteps, earnStageSummary } from './earnStages'

describe('earnStageSteps', () => {
  it('stamps the steps a withdraw has reached and marks the rest upcoming', () => {
    const steps = earnStageSteps('withdraw', 'midas-mtbill', [
      { stage: 'reclaiming', at: 100 },
      { stage: 'returning', at: 160 },
      { stage: 'finality', at: 200, detail: { confirmations: 9, required: 32 } },
    ])
    expect(steps.map(s => [s.stage, s.state, s.at])).toEqual([
      ['reclaiming', 'done', 100],
      ['returning', 'done', 160],
      ['finality', 'active', 200],
      ['paying_out', 'upcoming', undefined],
    ])
    expect(steps[2].label).toBe('Waiting for network confirmations (9 of 32)')
  })

  it('drops a step the operation skipped', () => {
    const steps = earnStageSteps('deposit', 'aave-v3', [
      { stage: 'recording', at: 100 },
      { stage: 'deploying', at: 120 },
    ])
    expect(steps.map(s => s.stage)).toEqual(['recording', 'deploying'])
  })
})

describe('earnStageSummary', () => {
  it('is null before the services report any stage', () => {
    expect(earnStageSummary('withdraw', 'midas-mtbill', [])).toBeNull()
  })

  it('moves the bar with the finality confirmations', () => {
    const early = earnStageSummary('withdraw', 'midas-mtbill', [
      { stage: 'reclaiming', at: 1 },
      { stage: 'returning', at: 2 },
      { stage: 'finality', at: 3, detail: { confirmations: 8, required: 32 } },
    ])
    const late = earnStageSummary('withdraw', 'midas-mtbill', [
      { stage: 'reclaiming', at: 1 },
      { stage: 'returning', at: 2 },
      { stage: 'finality', at: 3, detail: { confirmations: 30, required: 32 } },
    ])
    expect(early!.percent).toBeLessThan(late!.percent)
    expect(late!.percent).toBeLessThan(75)
  })
})
