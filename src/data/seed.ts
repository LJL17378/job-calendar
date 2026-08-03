import { isoAtDayOffset } from '../lib/date'
import type { AppData, PipelineStage } from '../types/domain'

const colors = ['#5b6ee1', '#e76f51', '#2a9d8f']
const stageNames = ['关注中', '已投递', '笔试/OA', '一面', '二面', '终面', 'Offer']

function stagesFor(applicationId: string, currentIndex: number): PipelineStage[] {
  return stageNames.map((name, position) => ({
    id: `${applicationId}-stage-${position}`,
    applicationId,
    name,
    position,
    status: position < currentIndex ? 'completed' : position === currentIndex ? 'active' : 'pending',
    plannedAt: position === currentIndex + 1 ? isoAtDayOffset(position + 1, 10) : null,
    completedAt: position < currentIndex ? isoAtDayOffset(position - currentIndex - 2, 16) : null,
    color: colors[position % colors.length],
  }))
}

export function createSeedData(): AppData {
  const applicationIds = ['app-byte', 'app-apple', 'app-notion']
  const stages = [
    ...stagesFor(applicationIds[0], 3),
    ...stagesFor(applicationIds[1], 2),
    ...stagesFor(applicationIds[2], 1),
  ]
  return {
    holidayEnabled: true,
    calendars: [
      { id: 'cal-personal', name: '个人日历', color: '#5b6ee1', kind: 'personal', readOnly: false, visible: true },
      { id: 'cal-job', name: '求职日程', color: '#e76f51', kind: 'job', readOnly: false, visible: true },
      { id: 'cal-holiday', name: '中国节假日', color: '#2a9d8f', kind: 'holiday', readOnly: true, visible: true },
    ],
    companies: [
      { id: 'company-byte', name: '字节跳动', website: 'https://www.bytedance.com', color: '#4f6bed' },
      { id: 'company-apple', name: 'Apple', website: 'https://jobs.apple.com', color: '#1f2937' },
      { id: 'company-notion', name: 'Notion', website: 'https://www.notion.so/careers', color: '#8b5cf6' },
    ],
    applications: [
      { id: applicationIds[0], companyId: 'company-byte', role: '前端工程师', jobUrl: '', location: '上海', workMode: 'hybrid', salary: '', source: '官网', appliedAt: isoAtDayOffset(-7, 12), contact: '招聘 HR', tags: ['前端', '校招'], notes: '重点准备工程化与性能优化。', status: 'active', currentStageId: `${applicationIds[0]}-stage-3`, createdAt: isoAtDayOffset(-9, 12) },
      { id: applicationIds[1], companyId: 'company-apple', role: 'Software Engineer Intern', jobUrl: '', location: '上海', workMode: 'onsite', salary: '', source: 'LinkedIn', appliedAt: isoAtDayOffset(-4, 12), contact: '', tags: ['Intern'], notes: '准备英文自我介绍。', status: 'active', currentStageId: `${applicationIds[1]}-stage-2`, createdAt: isoAtDayOffset(-6, 12) },
      { id: applicationIds[2], companyId: 'company-notion', role: 'Product Engineer', jobUrl: '', location: 'Remote', workMode: 'remote', salary: '', source: '内推', appliedAt: isoAtDayOffset(-2, 12), contact: '', tags: ['Remote'], notes: '', status: 'active', currentStageId: `${applicationIds[2]}-stage-1`, createdAt: isoAtDayOffset(-3, 12) },
    ],
    stages,
    events: [
      { id: 'event-interview', calendarId: 'cal-job', title: '字节跳动 · 一面', description: '准备项目复盘和浏览器原理。', location: '飞书会议', start: isoAtDayOffset(1, 9, 30), end: isoAtDayOffset(1, 11), allDay: false, timeZone: 'Asia/Shanghai', recurrenceRule: null, applicationId: applicationIds[0], stageId: `${applicationIds[0]}-stage-3`, importedUid: null, recurrenceId: null },
      { id: 'event-oa', calendarId: 'cal-job', title: 'Apple · Online Assessment', description: '', location: 'Online', start: isoAtDayOffset(2, 14), end: isoAtDayOffset(2, 16), allDay: false, timeZone: 'Asia/Shanghai', recurrenceRule: null, applicationId: applicationIds[1], stageId: `${applicationIds[1]}-stage-2`, importedUid: null, recurrenceId: null },
      { id: 'event-followup', calendarId: 'cal-job', title: '跟进 Notion 申请', description: '', location: '', start: isoAtDayOffset(3, 10), end: isoAtDayOffset(3, 10, 30), allDay: false, timeZone: 'Asia/Shanghai', recurrenceRule: null, applicationId: applicationIds[2], stageId: null, importedUid: null, recurrenceId: null },
      { id: 'event-review', calendarId: 'cal-personal', title: '每周求职复盘', description: '', location: '', start: isoAtDayOffset(4, 20), end: isoAtDayOffset(4, 21), allDay: false, timeZone: 'Asia/Shanghai', recurrenceRule: 'FREQ=WEEKLY', applicationId: null, stageId: null, importedUid: null, recurrenceId: null },
    ],
    exceptions: [],
    transitions: [],
  }
}
