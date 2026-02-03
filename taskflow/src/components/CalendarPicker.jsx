import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const CalendarPicker = ({ onSelectDate, closeCalendar }) => {
  // Track which month/year the user is looking at
  const [viewDate, setViewDate] = useState(new Date());

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const daysOfWeek = ["M", "T", "W", "T", "F", "S", "S"];

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Logic: Get days in month & the starting day offset
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  // Adjust offset because JS Sunday is 0, but we want Monday start
  const startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const changeMonth = (offset) => {
    setViewDate(new Date(year, month + offset, 1));
  };

  const isToday = (day) => {
    const today = new Date();
    return (
      today.getDate() === day &&
      today.getMonth() === month &&
      today.getFullYear() === year
    );
  };

  // Generate the day cells
  const renderDays = () => {
    const cells = [];

    // Empty slots for the start of the month
    for (let i = 0; i < startOffset; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Actual day buttons
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push(
        <button
          key={d}
          onClick={() => {
            onSelectDate(`${d} ${monthNames[month].slice(0, 3)}`);
            closeCalendar();
          }}
          className={`p-2 w-8 h-8 flex items-center justify-center rounded-full text-[11px] transition-all
            ${isToday(d) ? "bg-red-500 text-white" : "text-neutral-300 hover:bg-[#22d3ee] hover:text-black"}
          `}
        >
          {d}
        </button>,
      );
    }
    return cells;
  };

  return (
    <div className="absolute top-12 left-0 w-64 bg-[#181818] border border-neutral-800 rounded-2xl p-4 z-50 shadow-2xl animate-in fade-in zoom-in duration-200">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-xs font-bold text-white tracking-wide">
          {monthNames[month]} {year}
        </span>
        <div className="flex gap-2 text-neutral-500">
          <button
            onClick={() => changeMonth(-1)}
            className="hover:text-white p-1"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => changeMonth(1)}
            className="hover:text-white p-1"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday Labels */}
      <div className="grid grid-cols-7 mb-2">
        {daysOfWeek.map((day, i) => (
          <div
            key={i}
            className="text-[10px] text-neutral-600 font-bold text-center"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-y-1 text-center">{renderDays()}</div>
    </div>
  );
};

export default CalendarPicker;
