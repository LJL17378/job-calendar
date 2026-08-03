import { describe, expect, it } from 'vitest'
import { createSeedData } from './seed'

describe('demo seed', () => {
  it('keeps every current stage inside its application pipeline', () => {
    const data = createSeedData()
    data.applications.forEach((application) => {
      expect(data.stages.some((stage) => stage.id === application.currentStageId && stage.applicationId === application.id)).toBe(true)
    })
  })
})
