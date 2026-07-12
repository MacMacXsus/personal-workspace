import { useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import {
  ArrowUpRight,
  BarChart2,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ChevronRight,
  Circle,
  Clock,
  FileText,
  Flame,
  MoreHorizontal,
  Plus,
  Target,
} from "lucide-react";
import {
  calendarDays,
  focusData,
  notes,
  priorityDot,
  tagColors,
  tasks,
  upcomingEvents,
} from "./dashboardData";
import type { TaskItem } from "./dashboardData";

type OverviewPanelProps = {
  firstName: string;
};

export default function OverviewPanel({ firstName }: OverviewPanelProps) {
  const [taskList, setTaskList] = useState(tasks);
  const [activeNote, setActiveNote] = useState<number | null>(null);

  const completedCount = taskList.filter((task) => task.done).length;
  const totalTasks = taskList.length;

  const toggleTask = (id: number) => {
    setTaskList((prev) => prev.map((task) => (task.id === id ? { ...task, done: !task.done } : task)));
  };

  return (
    <>
      <div className="mb-6">
        <h1 className="text-[28px] font-semibold text-foreground leading-tight tracking-tight" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
          Good afternoon, {firstName}
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">Tuesday, July 1 - You have 4 tasks due today</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon: Target, label: "Tasks done", value: `${completedCount}/${totalTasks}`, color: "text-primary" },
          { icon: Flame, label: "Focus streak", value: "7 days", color: "text-[#f5a623]" },
          { icon: Clock, label: "Hours today", value: "4.2h", color: "text-[#5ecfb0]" },
          { icon: ArrowUpRight, label: "Productivity", value: "+18%", color: "text-[#7ec8e3]" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-card border border-border rounded-lg px-4 py-3 flex items-center gap-3 hover:border-primary/20 transition-all duration-200">
            <div className={`${color} opacity-80`}>
              <Icon size={16} />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">{label}</p>
              <p className={`text-lg font-semibold leading-tight ${color}`} style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                {value}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4 mb-4">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <CheckSquare size={14} className="text-primary" />
              <span className="text-sm font-medium" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Today's tasks
              </span>
              <span className="text-[10px] font-mono bg-primary/10 text-primary px-1.5 py-0.5 rounded">{totalTasks - completedCount} left</span>
            </div>
            <button className="text-muted-foreground hover:text-foreground transition-colors duration-150">
              <MoreHorizontal size={15} />
            </button>
          </div>

          <div className="divide-y divide-border">
            {taskList.map((task: TaskItem) => (
              <div
                key={task.id}
                className="flex items-center gap-3.5 px-5 py-3 group hover:bg-secondary/40 transition-all duration-150 cursor-pointer"
                onClick={() => toggleTask(task.id)}
              >
                <div className={`shrink-0 transition-all duration-200 ${task.done ? "text-primary" : "text-muted-foreground/40 group-hover:text-muted-foreground"}`}>
                  {task.done ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm transition-all duration-200 ${task.done ? "line-through text-muted-foreground" : "text-foreground"}`}>{task.title}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${tagColors[task.tag] ?? "text-muted-foreground bg-muted"}`}>{task.tag}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[task.priority]}`} />
                </div>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 border-t border-border">
            <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
              <Plus size={12} /> Add task
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <Calendar size={14} className="text-[#5ecfb0]" />
              <span className="text-sm font-medium" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                July 2025
              </span>
            </div>
            <ChevronRight size={14} className="text-muted-foreground" />
          </div>
          <div className="px-4 py-3 border-b border-border">
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map(({ day, date, events, today }) => (
                <div key={day} className="flex flex-col items-center gap-1">
                  <span className="text-[9px] font-mono text-muted-foreground uppercase">{day}</span>
                  <button className={`w-7 h-7 rounded-md text-xs font-medium transition-all duration-150 flex items-center justify-center ${today ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-secondary"}`}>
                    {date}
                  </button>
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(events, 3) }).map((_, i) => (
                      <span key={i} className={`w-1 h-1 rounded-full ${today ? "bg-primary/60" : "bg-muted-foreground/40"}`} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 px-4 py-3 space-y-2 overflow-y-auto scrollbar-none">
            <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest mb-3">Today's schedule</p>
            {upcomingEvents.map((event) => (
              <div
                key={event.time}
                className={`flex items-start gap-3 p-2.5 rounded-md border transition-all duration-150 hover:border-primary/20 ${event.type === "focus" ? "border-primary/20 bg-primary/5" : "border-border bg-muted/30"}`}
              >
                <span className="text-[10px] font-mono text-muted-foreground shrink-0 pt-0.5">{event.time}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground leading-snug">{event.title}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{event.duration}</p>
                </div>
                {event.type === "focus" && <span className="text-[9px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">focus</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1fr] gap-4">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-[#f5a623]" />
              <span className="text-sm font-medium" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Recent notes
              </span>
            </div>
            <button className="text-xs text-muted-foreground hover:text-foreground transition-colors duration-150 flex items-center gap-1">
              All <ChevronRight size={12} />
            </button>
          </div>
          <div className="divide-y divide-border">
            {notes.map((note) => (
              <button
                key={note.id}
                onClick={() => setActiveNote(activeNote === note.id ? null : note.id)}
                className={`w-full text-left px-5 py-3.5 transition-all duration-150 hover:bg-secondary/40 ${activeNote === note.id ? "bg-secondary/40" : ""}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{note.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{note.preview}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[9px] font-mono text-muted-foreground">{note.date}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded ${tagColors[note.tag] ?? "text-muted-foreground bg-muted"}`}>{note.tag}</span>
                  </div>
                </div>
                {activeNote === note.id && <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{note.preview}</p>}
              </button>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-border">
            <button className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
              <Plus size={12} /> New note
            </button>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <div className="flex items-center gap-2">
              <BarChart2 size={14} className="text-[#7ec8e3]" />
              <span className="text-sm font-medium" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                Focus hours
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">this week</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-[#5ecfb0]">
              <ArrowUpRight size={12} />
              <span className="font-mono">+22%</span>
            </div>
          </div>
          <div className="flex-1 px-2 py-4">
            <ResponsiveContainer width="100%" height={140}>
              <AreaChart data={focusData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b7cf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#8b7cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#6b6b80", fontFamily: "DM Mono" }} />
                <Tooltip
                  contentStyle={{ background: "#18181f", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "6px", fontSize: "11px", color: "#e4e4ee", fontFamily: "DM Mono" }}
                  cursor={{ stroke: "rgba(139,124,248,0.2)", strokeWidth: 1 }}
                  formatter={(value) => [`${value}h`, "Focus"]}
                  itemStyle={{ color: "#8b7cf8" }}
                />
                <Area
                  activeDot={{ r: 5, fill: "#8b7cf8", stroke: "#0c0c11", strokeWidth: 2 }}
                  dataKey="hours"
                  dot={{ r: 3, fill: "#8b7cf8", strokeWidth: 0 }}
                  fill="url(#focusGrad)"
                  stroke="#8b7cf8"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="px-5 py-3 border-t border-border grid grid-cols-3 gap-2">
            {[
              { label: "Avg / day", value: "4.4h" },
              { label: "Best day", value: "Thu 6.8h" },
              { label: "Total", value: "31.1h" },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{label}</p>
                <p className="text-sm font-semibold text-foreground mt-0.5" style={{ fontFamily: "'Bricolage Grotesque', sans-serif" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
