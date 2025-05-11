import { useCallback } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment, { months } from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import withDragAndDrop, { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop"
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"
import { useState } from 'react'
import Modal from './popup'
import EventForm from './event-form'
import { Event } from './event-form';
import { EventFormValues } from './event-form';

const localizer = momentLocalizer(moment)
const DnDCalendar = withDragAndDrop<Event>(Calendar)

const CustomEvent = ({ event }: { event: Event }) => {
  return (
    <div className="h-full w-full overflow-hidden p-1 text-base">
      <div className="font-medium">{event.title}</div>
      {event.location && (
        <div className="text-xs opacity-80">{event.location}</div>
      )}
    </div>
  );
};

const CustomToolbar = (props: any) => {
  const { onView, onNavigate, label } = props;

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <button
          onClick={() => onNavigate('PREV')}
          className="rounded-md border border-gray-200 px-3 py-1 hover:bg-gray-50"
        >
          &lt;
        </button>
        <button
          onClick={() => onNavigate('TODAY')}
          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1 text-blue-600 hover:bg-blue-100"
        >
          Hôm nay
        </button>
        <button
          onClick={() => onNavigate('NEXT')}
          className="rounded-md border border-gray-200 px-3 py-1 hover:bg-gray-50"
        >
          &gt;
        </button>
      </div>

      <span className="text-lg font-medium">{label}</span>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onView('month')}
          className="rounded-md border border-gray-200 px-3 py-1 hover:bg-gray-50"
        >
          Tháng
        </button>
        <button
          onClick={() => onView('week')}
          className="rounded-md border border-gray-200 px-3 py-1 hover:bg-gray-50"
        >
          Tuần
        </button>
        <button
          onClick={() => onView('day')}
          className="rounded-md border border-gray-200 px-3 py-1 hover:bg-gray-50"
        >
          Ngày
        </button>
      </div>
    </div>
  );
};
const getEventStyle = (event: Event) => {
  switch (event.location) {
    case 'Sân số 1':
      return { backgroundColor: '#93c5fd', borderColor: '#60a5fa' }; // blue-300
    case 'Sân số 2':
      return { backgroundColor: '#86efac', borderColor: '#4ade80' }; // green-300
    case 'Sân số 3':
      return { backgroundColor: '#c4b5fd', borderColor: '#a78bfa' }; // violet-300
    case 'Tất cả các sân':
      return { backgroundColor: '#fca5a5', borderColor: '#f87171' }; // red-300 cho bảo trì
    default:
      return { backgroundColor: '#cbd5e1', borderColor: '#94a3b8' }; // slate-300
  }
};

const EventDetails: React.FC<{ event: Event | null }> = ({ event }) => {
  if (!event) return null; 
  return (
    <div className="space-y-2">
      <p><span className="font-semibold">Bắt đầu:</span> {moment(event.start).format('DD/MM/YYYY HH:mm')}</p>
      <p><span className="font-semibold">Kết thúc:</span> {moment(event.end).format('DD/MM/YYYY HH:mm')}</p>
      <p><span className="font-semibold">Thời lượng:</span> {moment.duration(moment(event.end).diff(event.start)).asHours()} giờ</p>
      {event.description && (
        <p><span className="font-semibold">Mô tả:</span> {event.description}</p>
      )}
      {event.location && (
        <p><span className="font-semibold">Địa điểm:</span> {event.location}</p>
      )}
    </div>
  );
};

const events: Event[] = [
  {
    title: 'Đặt sân 1',
    start: moment('2025-02-25 08:00').toDate(), 
    end: moment('2025-02-25 10:00').toDate(),  
    description: 'Đặt sân đánh đơn',
    location: 'Sân số 1'
  },
  {
    title: 'Đặt sân 2',
    start: moment('2025-02-25 14:00').toDate(), 
    end: moment('2025-02-25 16:00').toDate(),  
    description: 'Đặt sân đánh đôi',
    location: 'Sân số 2'
  },
  {
    title: 'Đặt sân 3',
    start: moment('2025-02-25 14:00').toDate(), 
    end: moment('2025-02-25 16:00').toDate(),  
    description: 'Đặt sân đánh đôi',
    location: 'Sân số 3'
  },
  {
    title: 'Bảo trì sân',
    start: moment('2025-02-26 08:00').toDate(),   
    end: moment('2025-02-26 17:00').toDate(),  
    description: 'Bảo trì định kỳ',
    location: 'Tất cả các sân'
  }
]

export interface CalendarProps {
  events?: Event[];
  onSelectEvent?: (event: Event) => void;
  onSelectSlot?: ({ start, end }: { start: Date; end: Date }) => void;
  view?: string;
  date?: Date;
  onView?: (view: string) => void;
  onNavigate?: (date: Date) => void;
}

export default function MyCalendar({ 
  events: initialEvents, 
  onSelectEvent: externalSelectEvent,
  onSelectSlot: externalSelectSlot,
  view: externalView,
  date: externalDate,
  onView: externalOnView,
  onNavigate: externalOnNavigate
}: CalendarProps = {}) {
  const [myEvents, setMyEvents] = useState<Event[]>(initialEvents || events)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  const handleSelectSlot = useCallback(
    ({ start, end }: { start: Date; end: Date }) => {
      if (externalSelectSlot) {
        externalSelectSlot({ start, end });
      } else {
        setSelectedEvent(null)
        setSelectedSlot({ start, end })
        setShowForm(true)
      }
    },
    [externalSelectSlot]
  )

  const handleFormSubmit = (values: EventFormValues) => {

    if (selectedEvent) {
      const updatedEvent = {
        ...selectedEvent,
        ...values,
        start: new Date(values.start),
        end: new Date(values.end)
      };

      const idx = myEvents.findIndex(e =>
        e === selectedEvent ||
        (e.title === selectedEvent.title &&
          e.start.getTime() === selectedEvent.start.getTime() &&
          e.end.getTime() === selectedEvent.end.getTime())
      );


      if (idx !== -1) {
        const nextEvents = [...myEvents];
        nextEvents.splice(idx, 1, updatedEvent);
        setMyEvents(nextEvents);
      } else {
        console.error('Could not find event to update');
      }
    } else {
      setMyEvents(prev => [...prev, {
        ...values,
        start: new Date(values.start),
        end: new Date(values.end)
      }])
    }
    setShowForm(false)
    setSelectedEvent(null)
    setSelectedSlot(null)
  }
  const onEventDrop = ({ event, start, end }: EventInteractionArgs<Event>) => {
    const idx = myEvents.indexOf(event)
    const updatedEvent = {
      ...event,
      start: new Date(start),
      end: new Date(end)
    }

    const nextEvents = [...myEvents]
    nextEvents.splice(idx, 1, updatedEvent)

    setMyEvents(nextEvents)
  }

  const onEventResize = ({ event, start, end }: EventInteractionArgs<Event>) => {
    const idx = myEvents.indexOf(event)
    const updatedEvent = {
      ...event,
      start: new Date(start),
      end: new Date(end)
    }

    const nextEvents = [...myEvents]
    nextEvents.splice(idx, 1, updatedEvent)

    setMyEvents(nextEvents)
  }
  const onSelectEvent = (event: Event) => {
    if (externalSelectEvent) {
      externalSelectEvent(event);
    } else {
      setSelectedEvent(event)
      setShowDetails(true)  
    }
  }

  const handleEditClick = () => {
    setShowDetails(false)  
    setShowForm(true)      
  }

  return (
    <>
      <DnDCalendar
        localizer={localizer}
        events={myEvents}
        defaultDate={new Date()}
        defaultView='month'
        startAccessor="start"
        endAccessor="end"
        view={externalView as any}
        date={externalDate}
        onView={externalOnView}
        onNavigate={externalOnNavigate}
        style={{
          height: "calc(100vh - 100px)",
          paddingBottom: "2rem",
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          borderRadius: '8px',
        }}
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}
        onSelectEvent={onSelectEvent}
        onSelectSlot={handleSelectSlot}
        resizable
        selectable
        components={{
          event: CustomEvent,
          toolbar: CustomToolbar
        }}
        eventPropGetter={(event) => ({
          style: getEventStyle(event)
        })}
        dayPropGetter={(date) => {
          const today = new Date();
          const isToday =
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear();

          return {
            style: isToday ? { backgroundColor: '#f0f9ff' } : {} // blue-50 cho ngày hiện tại
          };
        }}
        formats={{
          dayFormat: (date: Date, culture: any, localizer: any) =>
            localizer.format(date, 'dd', culture),
          dayRangeHeaderFormat: ({ start, end }: { start: Date, end: Date }, culture: any, localizer: any) =>
            `${localizer.format(start, 'DD/MM/YYYY', culture)} - ${localizer.format(end, 'DD/MM/YYYY', culture)}`
        }}
      />
      
      {!externalSelectEvent && !externalSelectSlot && (
        <>
          <Modal
            isOpen={showForm}
            onClose={() => {
              setShowForm(false)
              setSelectedSlot(null)
            }}
            title={selectedEvent ? "Chỉnh sửa sự kiện" : "Thêm sự kiện mới"}
            className="w-full max-w-md"
          >
            <EventForm
              event={selectedEvent}
              initialSlot={selectedSlot}
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false)
                setSelectedSlot(null)
              }}
            />
          </Modal>
          <Modal
            isOpen={showDetails}
            onClose={() => {
              setShowDetails(false)
              setSelectedEvent(null)
            }}
            title={selectedEvent?.title || "Chi tiết sự kiện"}
            className="w-full max-w-md"
          >
            <div className="space-y-4">
              <EventDetails event={selectedEvent} />
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200"
                >
                  Đóng
                </button>
                <button
                  onClick={handleEditClick}
                  className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
                >
                  Chỉnh sửa
                </button>
              </div>
            </div>
          </Modal>
        </>
      )}
    </>
  )
}

