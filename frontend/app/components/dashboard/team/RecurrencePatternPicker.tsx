"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, X } from "lucide-react";

interface RecurrencePatternPickerProps {
  value?: string; // pattern: "daily", "weekly", "monthly", "yearly"
  startDate?: Date;
  onChange: (pattern: string, endDate?: Date, maxOccurrences?: number) => void;
  onRemove?: () => void;
}

export default function RecurrencePatternPicker({
  value,
  startDate = new Date(),
  onChange,
  onRemove,
}: RecurrencePatternPickerProps) {
  const [pattern, setPattern] = useState(value || "daily");
  const [hasEndDate, setHasEndDate] = useState(false);
  const [endDate, setEndDate] = useState<string>("");
  const [hasMaxOccurrences, setHasMaxOccurrences] = useState(false);
  const [maxOccurrences, setMaxOccurrences] = useState<number>(10);
  const [interval, setInterval] = useState(1);
  const [selectedDays, setSelectedDays] = useState<number[]>([1]); // Monday by default

  useEffect(() => {
    // Notify parent of changes
    onChange(
      pattern,
      hasEndDate && endDate ? new Date(endDate) : undefined,
      hasMaxOccurrences ? maxOccurrences : undefined,
    );
  }, [pattern, endDate, hasEndDate, maxOccurrences, hasMaxOccurrences]);

  const daysOfWeek = [
    { value: 1, label: "Mon" },
    { value: 2, label: "Tue" },
    { value: 3, label: "Wed" },
    { value: 4, label: "Thu" },
    { value: 5, label: "Fri" },
    { value: 6, label: "Sat" },
    { value: 0, label: "Sun" },
  ];

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day]);
    }
  };

  return (
    <div className="space-y-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">
            Repeat Task
          </span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Pattern Selection */}
      <div className="space-y-2">
        <label className="text-xs text-slate-600 font-medium">
          Recurrence Pattern
        </label>
        <select
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {/* Weekly - Day Selection */}
      {pattern === "weekly" && (
        <div className="space-y-2">
          <label className="text-xs text-slate-600 font-medium">
            Repeat on
          </label>
          <div className="flex gap-2">
            {daysOfWeek.map((day) => (
              <button
                key={day.value}
                onClick={() => toggleDay(day.value)}
                className={`flex-1 py-2 px-1 rounded-md text-xs font-medium transition-colors ${
                  selectedDays.includes(day.value)
                    ? "bg-blue-500 text-white"
                    : "bg-white text-slate-600 border border-slate-300 hover:bg-slate-50"
                }`}>
                {day.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interval */}
      <div className="space-y-2">
        <label className="text-xs text-slate-600 font-medium">
          Every{" "}
          {pattern === "daily"
            ? "N days"
            : pattern === "weekly"
              ? "N weeks"
              : pattern === "monthly"
                ? "N months"
                : "N years"}
        </label>
        <input
          type="number"
          min={1}
          max={30}
          value={interval}
          onChange={(e) => setInterval(parseInt(e.target.value) || 1)}
          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* End Condition */}
      <div className="space-y-3">
        <label className="text-xs text-slate-600 font-medium">Ends</label>

        {/* Never */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={!hasEndDate && !hasMaxOccurrences}
            onChange={() => {
              setHasEndDate(false);
              setHasMaxOccurrences(false);
            }}
            className="text-blue-500"
          />
          <span className="text-sm text-slate-700">Never</span>
        </label>

        {/* On Date */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={hasEndDate}
            onChange={() => {
              setHasEndDate(true);
              setHasMaxOccurrences(false);
            }}
            className="text-blue-500"
          />
          <span className="text-sm text-slate-700">On</span>
          {hasEndDate && (
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="flex-1 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          )}
        </label>

        {/* After N Occurrences */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            checked={hasMaxOccurrences}
            onChange={() => {
              setHasEndDate(false);
              setHasMaxOccurrences(true);
            }}
            className="text-blue-500"
          />
          <span className="text-sm text-slate-700">After</span>
          {hasMaxOccurrences && (
            <>
              <input
                type="number"
                min={1}
                max={100}
                value={maxOccurrences}
                onChange={(e) =>
                  setMaxOccurrences(parseInt(e.target.value) || 1)
                }
                className="w-20 px-2 py-1 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">occurrences</span>
            </>
          )}
        </label>
      </div>

      {/* Preview */}
      <div className="pt-3 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          This task will repeat every {interval}{" "}
          {pattern === "daily"
            ? interval > 1
              ? "days"
              : "day"
            : pattern === "weekly"
              ? interval > 1
                ? "weeks"
                : "week"
              : pattern === "monthly"
                ? interval > 1
                  ? "months"
                  : "month"
                : interval > 1
                  ? "years"
                  : "year"}
          {hasEndDate &&
            endDate &&
            ` until ${new Date(endDate).toLocaleDateString()}`}
          {hasMaxOccurrences && ` for ${maxOccurrences} occurrences`}
          {!hasEndDate && !hasMaxOccurrences && " indefinitely"}
        </p>
      </div>
    </div>
  );
}
