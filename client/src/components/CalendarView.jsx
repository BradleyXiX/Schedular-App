import { useState } from 'react';

export const CalendarView = ({ schedules, onEdit, onAddEvent }) => {
  const [view, setView] = useState('month'); // 'month' or 'week'
  const [currentDate, setCurrentDate] = useState(new Date());

  // Date helpers
  const getStartOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
  const getEndOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const getDaysInMonth = (date) => getEndOfMonth(date).getDate();

  const getStartOfWeek = (date) => {
    const temp = new Date(date);
    const day = temp.getDay();
    const diff = temp.getDate() - day; // adjust when day is sunday
    return new Date(temp.setDate(diff));
  };

  // Navigations
  const handlePrev = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    } else {
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(nextDate);
    }
  };

  const handleNext = () => {
    if (view === 'month') {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    } else {
      const nextDate = new Date(currentDate);
      nextDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(nextDate);
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Event matching helper
  const getEventsForDate = (date) => {
    return schedules.filter((event) => {
      const eventStart = new Date(event.start_time);
      return (
        eventStart.getFullYear() === date.getFullYear() &&
        eventStart.getMonth() === date.getMonth() &&
        eventStart.getDate() === date.getDate()
      );
    });
  };

  // Rendering grids
  const renderMonthDays = () => {
    const startOfMonth = getStartOfMonth(currentDate);
    const startDayOfWeek = startOfMonth.getDay(); // 0 is Sunday, 6 is Saturday
    const daysInMonth = getDaysInMonth(currentDate);

    const cells = [];

    // Prev month padding
    const prevMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    const prevMonthDaysCount = prevMonthEnd.getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, prevMonthDaysCount - i);
      cells.push({ date: d, isCurrentMonth: false });
    }

    // Current month
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      cells.push({ date: d, isCurrentMonth: true });
    }

    // Next month padding (fill up to multiple of 7)
    const totalCells = Math.ceil(cells.length / 7) * 7;
    const remaining = totalCells - cells.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, i);
      cells.push({ date: d, isCurrentMonth: false });
    }

    return (
      <div className="grid grid-cols-7 border-t border-l border-base-200 mt-2 rounded-b-xl overflow-hidden bg-white shadow-sm">
        {cells.map(({ date, isCurrentMonth }, idx) => {
          const dailyEvents = getEventsForDate(date);
          const isToday =
            new Date().toDateString() === date.toDateString();

          return (
            <div
              key={idx}
              className={`min-h-[110px] p-2 border-r border-b border-base-200 flex flex-col group transition-all hover:bg-slate-50/50 cursor-pointer ${
                isCurrentMonth ? 'bg-white' : 'bg-slate-50/30 text-slate-400'
              }`}
              onClick={(e) => {
                // If clicking cell itself, trigger add event
                if (e.target === e.currentTarget) {
                  onAddEvent(date);
                }
              }}
            >
              <div className="flex justify-between items-center mb-1">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isToday
                      ? 'bg-primary text-white shadow-sm'
                      : 'text-slate-600'
                  }`}
                >
                  {date.getDate()}
                </span>
                <button
                  className="opacity-0 group-hover:opacity-100 text-xs text-primary font-bold hover:underline transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAddEvent(date);
                  }}
                >
                  + Add
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                {dailyEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(event);
                    }}
                    style={{
                      borderLeftColor: event.category_color || '#3b82f6',
                      backgroundColor: (event.category_color || '#3b82f6') + '15',
                      color: event.category_color || '#3b82f6',
                    }}
                    className="text-[11px] font-medium px-2 py-1 rounded border-l-4 truncate shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    title={`${event.title} (${event.category_name || 'No Category'})\nLocation: ${event.location || 'N/A'}`}
                  >
                    <span className="font-bold">
                      {new Date(event.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                    </span>{' '}
                    {event.title}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderWeekDays = () => {
    const startOfWeek = getStartOfWeek(currentDate);
    const cells = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      cells.push(d);
    }

    return (
      <div className="grid grid-cols-7 border-t border-l border-base-200 mt-2 rounded-b-xl overflow-hidden bg-white shadow-sm">
        {cells.map((date, idx) => {
          const dailyEvents = getEventsForDate(date);
          const isToday =
            new Date().toDateString() === date.toDateString();

          return (
            <div
              key={idx}
              className="min-h-[350px] p-2 border-r border-b border-base-200 flex flex-col group transition-all bg-white hover:bg-slate-50/50 cursor-pointer"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  onAddEvent(date);
                }
              }}
            >
              <div className="text-center pb-2 border-b border-base-100 flex flex-col items-center">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                  {date.toLocaleDateString([], { weekday: 'short' })}
                </span>
                <span
                  className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full mt-1 ${
                    isToday
                      ? 'bg-primary text-white shadow-md'
                      : 'text-slate-700 bg-slate-50'
                  }`}
                >
                  {date.getDate()}
                </span>
              </div>

              <div className="flex-1 overflow-y-auto space-y-1.5 mt-2 pr-1 custom-scrollbar">
                {dailyEvents.map((event) => (
                  <div
                    key={event.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit(event);
                    }}
                    style={{
                      borderLeftColor: event.category_color || '#3b82f6',
                      backgroundColor: (event.category_color || '#3b82f6') + '15',
                      color: event.category_color || '#3b82f6',
                    }}
                    className="text-[11px] font-medium p-2 rounded border-l-4 flex flex-col gap-0.5 shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <span className="font-bold text-[10px]">
                      {new Date(event.start_time).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                      })}
                      {event.location && ` @ ${event.location}`}
                    </span>
                    <span className="truncate text-slate-800 font-semibold">{event.title}</span>
                    {event.description && (
                      <span className="text-[10px] text-slate-500 line-clamp-2">
                        {event.description}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const getHeaderTitle = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString([], { month: 'long', year: 'numeric' });
    } else {
      const start = getStartOfWeek(currentDate);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${start.toLocaleDateString([], {
        month: 'short',
        day: 'numeric'
      })} - ${end.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}`;
    }
  };

  return (
    <div className="calendar-view bg-white p-4 rounded-2xl shadow-md border border-slate-100">
      {/* Calendar Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4 pb-4 border-b border-slate-100">
        {/* Navigation */}
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-800 mr-2 min-w-[150px]">
            {getHeaderTitle()}
          </h2>
          <div className="btn-group join">
            <button
              onClick={handlePrev}
              className="btn btn-sm join-item btn-outline border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600"
            >
              ◀
            </button>
            <button
              onClick={handleToday}
              className="btn btn-sm join-item btn-outline border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600 font-bold"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="btn btn-sm join-item btn-outline border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600"
            >
              ▶
            </button>
          </div>
        </div>

        {/* View Selection Toggle */}
        <div className="join bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
          <button
            onClick={() => setView('month')}
            className={`btn btn-xs rounded-md border-none px-3 font-semibold ${
              view === 'month'
                ? 'bg-white shadow-sm text-slate-800'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Month
          </button>
          <button
            onClick={() => setView('week')}
            className={`btn btn-xs rounded-md border-none px-3 font-semibold ${
              view === 'week'
                ? 'bg-white shadow-sm text-slate-800'
                : 'bg-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Week
          </button>
        </div>
      </div>

      {/* Week Day Labels */}
      <div className="grid grid-cols-7 text-center font-bold text-xs uppercase tracking-wider text-slate-400 py-1 bg-slate-50/50 rounded-lg">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Grid Cells */}
      {view === 'month' ? renderMonthDays() : renderWeekDays()}
    </div>
  );
};
