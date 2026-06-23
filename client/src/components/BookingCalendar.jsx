import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const sportColors = {
  CRICKET: 'bg-sport-cricket',
  FUTSAL: 'bg-sport-futsal',
  HANDBALL: 'bg-sport-handball',
  SUBSOCCER: 'bg-sport-subsoccer',
};

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function BookingCalendar({ bookings, onSelectBooking }) {
  const [viewDate, setViewDate] = useState(new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const byDate = {};
  for (const b of bookings) {
    const key = b.bookingDate?.slice(0, 10);
    if (!key) continue;
    if (!byDate[key]) byDate[key] = [];
    byDate[key].push(b);
  }

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  function dateKey(day) {
    const m = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${m}-${dd}`;
  }

  const today = new Date();
  const isToday = (day) =>
    day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  function prevMonth() {
    setViewDate(new Date(year, month - 1, 1));
  }
  function nextMonth() {
    setViewDate(new Date(year, month + 1, 1));
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-800 dark:text-gray-100">{MONTHS[month]} {year}</h2>
        <div className="flex gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" aria-label="Previous month">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => setViewDate(new Date())} className="px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-600 dark:text-gray-300">
            Today
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300" aria-label="Next month">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-xs font-medium text-gray-400 dark:text-gray-500 py-1">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} className="min-h-[90px]" />;
          const dayBookings = byDate[dateKey(day)] || [];
          return (
            <div
              key={day}
              className={`min-h-[90px] border rounded-lg p-1.5 ${
                isToday(day) ? 'border-brand bg-brand/5 dark:bg-brand/20' : 'border-gray-100 dark:border-gray-700'
              }`}
            >
              <div className={`text-xs font-medium mb-1 ${isToday(day) ? 'text-brand dark:text-brand-light' : 'text-gray-500 dark:text-gray-400'}`}>
                {day}
              </div>
              <div className="space-y-1">
                {dayBookings.slice(0, 3).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onSelectBooking && onSelectBooking(b)}
                    className={`w-full text-left text-white text-[10px] leading-tight rounded px-1.5 py-0.5 truncate ${sportColors[b.arena?.sportType] || 'bg-gray-400'} ${b.bookingStatus === 'CANCELLED' ? 'opacity-40 line-through' : ''}`}
                    title={`${b.customerName} — ${b.arena?.name} (${b.startTime?.slice(11, 16)})`}
                  >
                    {b.startTime?.slice(11, 16)} {b.customerName}
                  </button>
                ))}
                {dayBookings.length > 3 && (
                  <div className="text-[10px] text-gray-400 dark:text-gray-500 px-1">+{dayBookings.length - 3} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}