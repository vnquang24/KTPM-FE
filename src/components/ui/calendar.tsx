"use client";
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import {format} from 'date-fns/format';
import {parse} from 'date-fns/parse';
import {startOfWeek} from 'date-fns/startOfWeek';
import {getDay} from 'date-fns/getDay';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';

interface Event {
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
}

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

// Mock events data
const myEventsList: Event[] = [
  {
    title: 'Pickleball Training',
    start: new Date(2024, 1, 20, 10, 0),
    end: new Date(2024, 1, 20, 12, 0),
  },
  {
    title: 'Court Maintenance',
    start: new Date(2024, 1, 21, 14, 0),
    end: new Date(2024, 1, 21, 16, 0),
  },
];

interface CalendarProps {
  events?: Event[];
}

const MyCalendar: React.FC<CalendarProps> = ({ events = myEventsList }) => (
  <div className="h-[800px] p-4">
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      style={{ height: '100%' }}
      views={['month', 'week', 'day', 'agenda']}
    />
  </div>
);

export default MyCalendar;