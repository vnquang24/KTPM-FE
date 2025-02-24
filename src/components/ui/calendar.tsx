import { Calendar, momentLocalizer } from 'react-big-calendar'
import moment from 'moment'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import withDragAndDrop, { EventInteractionArgs } from "react-big-calendar/lib/addons/dragAndDrop"
import "react-big-calendar/lib/addons/dragAndDrop/styles.css"
import { useState } from 'react'
import Modal from './popup'

const localizer = momentLocalizer(moment)
const DnDCalendar = withDragAndDrop<Event>(Calendar)

interface Event {
  title: string
  start: Date
  end: Date
  description?: string
  location?: string
}

const EventDetails: React.FC<{ event: Event }> = ({ event }) => {
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
    start: moment('2025-02-25 08:00').toDate(), // 25/02/2024 8:00
    end: moment('2025-02-25 10:00').toDate(),   // 25/02/2024 10:00
    description: 'Đặt sân đánh đơn',
    location: 'Sân số 1'
  },
  {
    title: 'Đặt sân 2',
    start: moment('2025-02-25 14:00').toDate(), // 25/02/2024 14:00
    end: moment('2025-02-25 16:00').toDate(),   // 25/02/2024 16:00
    description: 'Đặt sân đánh đôi',
    location: 'Sân số 2'
  },
  {
    title: 'Bảo trì sân',
    start: moment('2025-02-26 08:00').toDate(), // 26/02/2024 8:00
    end: moment('2025-02-26 17:00').toDate(),   // 26/02/2024 17:00
    description: 'Bảo trì định kỳ',
    location: 'Tất cả các sân'
  }
]

function MyCalendar() {
  const [myEvents, setMyEvents] = useState<Event[]>(events)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)

  // Xử lý kéo thả event
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

  // Thêm xử lý resize event
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
    setSelectedEvent(event)
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
        style={{ height: 500 }}
        onEventDrop={onEventDrop}
        onEventResize={onEventResize}  // Thêm handler resize
        onSelectEvent={onSelectEvent}  // Thêm handler này
        resizable
        selectable
      />
      <Modal 
        isOpen={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.title}
        className="w-full max-w-md"
      >
        {selectedEvent && <EventDetails event={selectedEvent} />}
      </Modal>
    </>
  )
}

export default MyCalendar