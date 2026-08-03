import { CalendarDays, ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

interface DateTimePickerProps {
  value: string
  onChange: (value: string) => void
  min?: string
}

const times = Array.from({ length: 96 }, (_, index) => {
  const hour = Math.floor(index / 4)
  const minute = (index % 4) * 15
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
})

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function DateTimePicker({ value, onChange, min }: DateTimePickerProps) {
  const root = useRef<HTMLDivElement>(null)
  const selectedTimeButton = useRef<HTMLButtonElement>(null)
  const selectedDate = value.slice(0, 10)
  const selectedTime = value.slice(11, 16)
  const selected = useMemo(() => new Date(`${selectedDate}T00:00:00`), [selectedDate])
  const [open, setOpen] = useState(false)
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(selected.getFullYear(), selected.getMonth(), 1))

  useEffect(() => {
    const close = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', close)
    return () => document.removeEventListener('pointerdown', close)
  }, [])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => selectedTimeButton.current?.scrollIntoView({ block: 'center' }))
    return () => window.cancelAnimationFrame(frame)
  }, [open, selectedTime])

  const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1)
  const offset = (first.getDay() + 6) % 7
  const days = Array.from({ length: 42 }, (_, index) => new Date(first.getFullYear(), first.getMonth(), index - offset + 1))
  const label = new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(new Date(value))

  return (
    <div className="date-time-picker" ref={root}>
      <button type="button" className="date-time-trigger" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
        <CalendarDays size={17} />
        <span>{label}</span>
        <Clock3 size={16} />
      </button>
      {open && (
        <div className="date-time-popover">
          <header>
            <button type="button" className="icon-button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} aria-label="上个月"><ChevronLeft size={17} /></button>
            <strong>{visibleMonth.getFullYear()} 年 {visibleMonth.getMonth() + 1} 月</strong>
            <button type="button" className="icon-button" onClick={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} aria-label="下个月"><ChevronRight size={17} /></button>
          </header>
          <div className="date-picker-weekdays">{['一', '二', '三', '四', '五', '六', '日'].map((day) => <span key={day}>{day}</span>)}</div>
          <div className="date-picker-days">
            {days.map((day) => {
              const key = localDateKey(day)
              return <button type="button" key={key} className={`${day.getMonth() !== visibleMonth.getMonth() ? 'outside' : ''} ${key === selectedDate ? 'selected' : ''}`} onClick={() => onChange(`${key}T${selectedTime}`)}>{day.getDate()}</button>
            })}
          </div>
          <div className="time-picker-heading"><Clock3 size={15} /><span>选择时间</span><strong>{selectedTime}</strong></div>
          <div className="time-picker-grid">
            {times.map((time) => {
              const candidate = `${selectedDate}T${time}`
              return <button ref={time === selectedTime ? selectedTimeButton : undefined} type="button" key={time} className={time === selectedTime ? 'selected' : ''} disabled={Boolean(min && candidate < min)} onClick={() => { onChange(candidate); setOpen(false) }}>{time}</button>
            })}
          </div>
        </div>
      )}
    </div>
  )
}
