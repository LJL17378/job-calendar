import { describe, expect, it } from 'vitest'
import { holidayInputs } from './holidays'

describe('holidayInputs', () => {
  it('renders statutory holidays as visible all-day labels', () => {
    const holidays = holidayInputs(2026)
    const newYear = holidays.find((holiday) => holiday.start === '2026-01-01')
    const adjustedWorkday = holidays.find((holiday) => holiday.start === '2026-02-14')

    expect(newYear).toMatchObject({ title: '元旦', allDay: true, display: 'block' })
    expect(adjustedWorkday).toMatchObject({ title: '补班 · 春节', allDay: true, display: 'block' })
  })
})
