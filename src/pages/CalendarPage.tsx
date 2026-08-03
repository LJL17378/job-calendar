import type {
  DateSelectArg,
  DatesSetArg,
  EventClickArg,
  EventDropArg,
  EventInput,
} from "@fullcalendar/core";
import zhCnLocale from "@fullcalendar/core/locales/zh-cn";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin, {
  type DateClickArg,
  type EventResizeDoneArg,
} from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import multiMonthPlugin from "@fullcalendar/multimonth";
import FullCalendar from "@fullcalendar/react";
import rrulePlugin from "@fullcalendar/rrule";
import timeGridPlugin from "@fullcalendar/timegrid";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { EventEditor, type EventDraft } from "../components/EventEditor";
import { useStore } from "../data/store";
import { createId } from "../lib/id";
import { holidayInputs } from "../lib/holidays";
import type { CalendarEvent, CalendarEventException } from "../types/domain";

type CalendarView =
  | "timeGridWeek"
  | "timeGridThreeDay"
  | "timeGridDay"
  | "dayGridMonth"
  | "multiMonthYear";

function rruleInput(
  event: CalendarEvent,
  exceptions: CalendarEventException[],
): EventInput {
  const base: EventInput = {
    id: event.id,
    title: event.title,
    allDay: event.allDay,
    extendedProps: { domainId: event.id },
    backgroundColor: event.color,
    borderColor: event.color,
  };
  if (!event.recurrenceRule)
    return { ...base, start: event.start, end: event.end };
  const start = new Date(event.start);
  const stamp = start
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
  return {
    ...base,
    rrule: `DTSTART:${stamp}\nRRULE:${event.recurrenceRule}`,
    exdate: exceptions
      .filter((exception) => exception.eventId === event.id)
      .map((exception) => exception.occurrenceStart),
    duration: new Date(event.end).getTime() - start.getTime(),
  } as EventInput;
}

function exceptionInputs(
  events: CalendarEvent[],
  exceptions: CalendarEventException[],
  colors: Map<string, string>,
): EventInput[] {
  return exceptions
    .filter((exception) => !exception.cancelled)
    .flatMap((exception) => {
      const parent = events.find((event) => event.id === exception.eventId);
      if (!parent) return [];
      return [
        {
          id: `exception-${exception.id}`,
          title: exception.override.title ?? parent.title,
          start: exception.override.start ?? exception.occurrenceStart,
          end:
            exception.override.end ??
            new Date(
              new Date(exception.occurrenceStart).getTime() +
                new Date(parent.end).getTime() -
                new Date(parent.start).getTime(),
            ).toISOString(),
          allDay: exception.override.allDay ?? parent.allDay,
          backgroundColor: colors.get(parent.calendarId),
          borderColor: colors.get(parent.calendarId),
          extendedProps: {
            domainId: parent.id,
            occurrenceStart: exception.occurrenceStart,
          },
        },
      ];
    });
}

export default function CalendarPage() {
  const calendarRef = useRef<FullCalendar>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);
  const store = useStore();
  const [view, setView] = useState<CalendarView>(() =>
    window.innerWidth < 680 ? "timeGridThreeDay" : "timeGridWeek",
  );
  const [title, setTitle] = useState("");
  const [selected, setSelected] = useState<CalendarEvent | null>(null);
  const [selectedOccurrence, setSelectedOccurrence] =
    useState<EventDraft | null>(null);
  const [draft, setDraft] = useState<EventDraft | null>(null);
  const visibleCalendarIds = useMemo(
    () =>
      new Set(
        store.calendars
          .filter((calendar) => calendar.visible)
          .map((calendar) => calendar.id),
      ),
    [store.calendars],
  );
  const events = useMemo(() => {
    const colors = new Map(
      store.calendars.map((calendar) => [calendar.id, calendar.color]),
    );
    const visibleEvents = store.events.filter((event) =>
      visibleCalendarIds.has(event.calendarId),
    );
    const domain = visibleEvents.map((event) =>
      rruleInput(
        { ...event, color: colors.get(event.calendarId) },
        store.exceptions,
      ),
    );
    domain.push(...exceptionInputs(visibleEvents, store.exceptions, colors));
    const holidayCalendar = store.calendars.find(
      (calendar) => calendar.kind === "holiday",
    );
    return store.holidayEnabled &&
      holidayCalendar &&
      visibleCalendarIds.has(holidayCalendar.id)
      ? [
          ...domain,
          ...holidayInputs(new Date().getFullYear() - 1),
          ...holidayInputs(new Date().getFullYear()),
          ...holidayInputs(new Date().getFullYear() + 1),
        ]
      : domain;
  }, [
    store.events,
    store.exceptions,
    store.calendars,
    store.holidayEnabled,
    visibleCalendarIds,
  ]);

  function changeView(next: CalendarView) {
    calendarRef.current?.getApi().changeView(next);
    setView(next);
  }
  function updateEvent(arg: EventDropArg | EventResizeDoneArg) {
    const domain = store.events.find((event) => event.id === arg.event.id);
    if (!domain || !arg.event.start) return;
    const duration =
      new Date(domain.end).getTime() - new Date(domain.start).getTime();
    const nextEnd = (
      arg.event.end ?? new Date(arg.event.start.getTime() + duration)
    ).toISOString();
    if (domain.recurrenceRule) {
      const oldStart =
        "oldEvent" in arg && arg.oldEvent.start
          ? arg.oldEvent.start.toISOString()
          : arg.event.start.toISOString();
      store.saveException({
        id: createId("exception"),
        eventId: domain.id,
        occurrenceStart: oldStart,
        cancelled: false,
        override: {
          start: arg.event.start.toISOString(),
          end: nextEnd,
          allDay: arg.event.allDay,
        },
      });
    } else
      store.saveEvent({
        ...domain,
        start: arg.event.start.toISOString(),
        end: nextEnd,
        allDay: arg.event.allDay,
      });
  }
  function openEvent(arg: EventClickArg) {
    if (arg.event.id.startsWith("holiday-")) return;
    const domain = store.events.find(
      (event) =>
        event.id ===
        ((arg.event.extendedProps.domainId as string) ?? arg.event.id),
    );
    if (domain) {
      setSelected(domain);
      setSelectedOccurrence(
        domain.recurrenceRule && arg.event.start
          ? {
              start:
                (arg.event.extendedProps.occurrenceStart as
                  | string
                  | undefined) ?? arg.event.start.toISOString(),
              end: (
                arg.event.end ??
                new Date(
                  arg.event.start.getTime() +
                    new Date(domain.end).getTime() -
                    new Date(domain.start).getTime(),
                )
              ).toISOString(),
              allDay: arg.event.allDay,
            }
          : null,
      );
    }
  }
  const closeEditor = () => {
    setSelected(null);
    setSelectedOccurrence(null);
    setDraft(null);
  };

  useEffect(() => {
    const workspace = workspaceRef.current;
    if (!workspace) return;
    const openAtPointer = (event: MouseEvent) => {
      const target = event.target as Element;
      if (target.closest(".fc-event, button, a, input, select")) return;
      const datedCell =
        target.closest<HTMLElement>("[data-date]") ??
        [
          ...workspace.querySelectorAll<HTMLElement>(
            ".fc-timegrid-col[data-date]",
          ),
        ].find((cell) => {
          const rect = cell.getBoundingClientRect();
          return event.clientX >= rect.left && event.clientX <= rect.right;
        });
      const date = datedCell?.dataset.date;
      if (!date) return;
      event.preventDefault();
      if (!target.closest(".fc-timegrid-slots")) {
        const start = new Date(`${date}T00:00:00`);
        const end = new Date(start);
        end.setDate(end.getDate() + 1);
        setDraft({ start: start.toISOString(), end: end.toISOString(), allDay: true });
        return;
      }
      const slots = workspace.querySelector<HTMLElement>(".fc-timegrid-slots");
      if (!slots) return;
      const rect = slots.getBoundingClientRect();
      const minute = Math.min(
        23 * 60 + 45,
        Math.max(
          0,
          Math.round(
            (((event.clientY - rect.top) / rect.height) * 24 * 60) / 15,
          ) * 15,
        ),
      );
      const start = new Date(`${date}T00:00:00`);
      start.setMinutes(minute);
      setDraft({
        start: start.toISOString(),
        end: new Date(start.getTime() + 3_600_000).toISOString(),
        allDay: false,
      });
    };
    workspace.addEventListener("contextmenu", openAtPointer);
    return () => workspace.removeEventListener("contextmenu", openAtPointer);
  }, []);

  function createOnTouch(arg: DateClickArg) {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const end = new Date(arg.date.getTime() + (arg.allDay ? 86_400_000 : 3_600_000));
    setDraft({
      start: arg.date.toISOString(),
      end: end.toISOString(),
      allDay: arg.allDay,
    });
  }

  return (
    <section className="page calendar-page">
      <div className="calendar-workspace" ref={workspaceRef}>
        <aside className="calendar-sidebar">
          <div className="mini-date">
            <strong>{new Date().getDate()}</strong>
            <span>
              {new Intl.DateTimeFormat("zh-CN", {
                month: "long",
                weekday: "long",
              }).format(new Date())}
            </span>
          </div>
          <h3>我的日历</h3>
          {store.calendars.map((calendar) => (
            <label className="calendar-toggle" key={calendar.id}>
              <input
                type="checkbox"
                checked={calendar.visible}
                onChange={() => store.toggleCalendar(calendar.id)}
              />
              <span style={{ background: calendar.color }} />
              <span>{calendar.name}</span>
              {calendar.readOnly && <small>只读</small>}
            </label>
          ))}
          <div className="upcoming-card">
            <CalendarRange size={18} />
            <div>
              <strong>接下来 7 天</strong>
              <span>
                {
                  store.events.filter(
                    (event) =>
                      new Date(event.start) > new Date() &&
                      new Date(event.start).getTime() <
                        Date.now() + 7 * 86400000,
                  ).length
                }{" "}
                个安排
              </span>
            </div>
          </div>
        </aside>
        <div className="calendar-panel">
          <div className="calendar-toolbar">
            <div className="date-controls">
              <button
                className="secondary-button compact"
                onClick={() => calendarRef.current?.getApi().today()}
              >
                今天
              </button>
              <button
                className="icon-button"
                onClick={() => calendarRef.current?.getApi().prev()}
              >
                <ChevronLeft size={19} />
              </button>
              <button
                className="icon-button"
                onClick={() => calendarRef.current?.getApi().next()}
              >
                <ChevronRight size={19} />
              </button>
              <h2>{title}</h2>
            </div>
            <div className="view-switcher">
              {(
                [
                  ["timeGridDay", "日"],
                  ["timeGridThreeDay", "3 日"],
                  ["timeGridWeek", "周"],
                  ["dayGridMonth", "月"],
                  ["multiMonthYear", "年"],
                ] as [CalendarView, string][]
              ).map(([key, label]) => (
                <button
                  className={view === key ? "active" : ""}
                  key={key}
                  onClick={() => changeView(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <FullCalendar
            ref={calendarRef}
            plugins={[
              dayGridPlugin,
              timeGridPlugin,
              multiMonthPlugin,
              listPlugin,
              interactionPlugin,
              rrulePlugin,
            ]}
            locales={[zhCnLocale]}
            locale="zh-cn"
            initialView={view}
            firstDay={1}
            headerToolbar={false}
            height="100%"
            allDayText="全天"
            slotMinTime="00:00:00"
            slotMaxTime="24:00:00"
            scrollTime="08:00:00"
            slotDuration="00:30:00"
            snapDuration="00:15:00"
            slotLabelInterval="01:00"
            slotLabelFormat={{
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }}
            nowIndicator
            selectable
            selectMirror
            editable
            eventResizableFromStart
            eventStartEditable
            eventDurationEditable
            eventMinHeight={24}
            eventShortHeight={30}
            dayMaxEvents
            events={events}
            views={{
              timeGridThreeDay: {
                type: "timeGrid",
                duration: { days: 3 },
                buttonText: "3 日",
              },
              multiMonthYear: { multiMonthMaxColumns: 4 },
            }}
            datesSet={(arg: DatesSetArg) => setTitle(arg.view.title)}
            dateClick={createOnTouch}
            select={(arg: DateSelectArg) =>
              setDraft({
                start: arg.start.toISOString(),
                end: arg.end.toISOString(),
                allDay: arg.allDay,
              })
            }
            eventClick={openEvent}
            eventDrop={updateEvent}
            eventResize={updateEvent}
          />
        </div>
      </div>
      {(selected || draft) && (
        <EventEditor
          event={selected}
          draft={draft}
          occurrence={selectedOccurrence}
          onClose={closeEditor}
        />
      )}
    </section>
  );
}
