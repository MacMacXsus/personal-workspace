import { BarChart2, Bookmark, Calendar, CheckSquare, FileText, Inbox, LayoutDashboard } from "lucide-react";

export type DashboardSection =
  | "overview"
  | "tasks"
  | "notes"
  | "calendar"
  | "focus"
  | "bookmarks"
  | "inbox";

export const dashboardSectionPaths: Record<DashboardSection, string> = {
  overview: "/dashboard",
  tasks: "/dashboard/tasks",
  notes: "/dashboard/vault",
  calendar: "/dashboard/calendar",
  focus: "/dashboard/focus",
  bookmarks: "/dashboard/bookmarks",
  inbox: "/dashboard/inbox",
};

export const dashboardSectionLabels: Record<DashboardSection, string> = {
  overview: "Overview",
  tasks: "Tasks",
  notes: "Vault",
  calendar: "Calendar",
  focus: "Focus",
  bookmarks: "Bookmarks",
  inbox: "Inbox",
};

export function getDashboardSectionFromPath(pathname: string): DashboardSection {
  const cleanPath = pathname.replace(/\/+$/, "") || "/";

  switch (cleanPath) {
    case "/dashboard":
    case "/dashboard/":
      return "overview";
    case "/dashboard/tasks":
      return "tasks";
    case "/dashboard/bookmarks":
    case "/bookmarks":
      return "bookmarks";
    case "/dashboard/vault":
    case "/vault":
    case "/dashboard/notes":
    case "/notes":
      return "notes";
    case "/dashboard/calendar":
      return "calendar";
    case "/dashboard/focus":
      return "focus";
    case "/dashboard/inbox":
      return "inbox";
    default:
      return "overview";
  }
}

export interface TaskItem {
  id: number;
  title: string;
  tag: string;
  done: boolean;
  priority: "high" | "medium" | "low";
}

export interface NoteItem {
  id: number;
  title: string;
  preview: string;
  date: string;
  tag: string;
}

export interface CalendarDayItem {
  day: string;
  date: number;
  events: number;
  today?: boolean;
}

export interface UpcomingEventItem {
  time: string;
  title: string;
  duration: string;
  type: "meeting" | "focus";
}

export interface BookmarkItem {
  id: number;
  title: string;
  url: string;
  folder: string;
  tags: string[];
  favicon: string;
  color: string;
  pinned: boolean;
}

export const focusData = [
  { day: "Mon", hours: 3.2 },
  { day: "Tue", hours: 5.1 },
  { day: "Wed", hours: 4.4 },
  { day: "Thu", hours: 6.8 },
  { day: "Fri", hours: 5.5 },
  { day: "Sat", hours: 2.1 },
  { day: "Sun", hours: 4.0 },
];

export const tasks: TaskItem[] = [
  { id: 1, title: "Finalize Q3 design system audit", tag: "Design", done: false, priority: "high" },
  { id: 2, title: "Review pull request #248 - auth refactor", tag: "Engineering", done: false, priority: "high" },
  { id: 3, title: "Send weekly update to stakeholders", tag: "Comms", done: true, priority: "medium" },
  { id: 4, title: "Set up Figma variables for dark mode tokens", tag: "Design", done: false, priority: "medium" },
  { id: 5, title: "Draft retrospective notes from sprint 14", tag: "Product", done: true, priority: "low" },
  { id: 6, title: "Research motion design libraries for onboarding", tag: "Design", done: false, priority: "low" },
];

export const notes: NoteItem[] = [
  { id: 1, title: "System design principles", preview: "Cohesion over decoration. Every element should earn its place...", date: "Today", tag: "Design" },
  { id: 2, title: "Q4 roadmap thoughts", preview: "Focus on retention loop, not acquisition. The funnel is fine but...", date: "Yesterday", tag: "Product" },
  { id: 3, title: "Reading: Shape Up by Basecamp", preview: "Appetite vs estimate - the distinction matters enormously for scoping...", date: "Jul 2", tag: "Reading" },
];

export const calendarDays: CalendarDayItem[] = [
  { day: "Mon", date: 30, events: 2 },
  { day: "Tue", date: 1, events: 4, today: true },
  { day: "Wed", date: 2, events: 1 },
  { day: "Thu", date: 3, events: 3 },
  { day: "Fri", date: 4, events: 0 },
  { day: "Sat", date: 5, events: 1 },
  { day: "Sun", date: 6, events: 0 },
];

export const upcomingEvents: UpcomingEventItem[] = [
  { time: "10:00", title: "Design sync - mobile patterns", duration: "45m", type: "meeting" },
  { time: "13:30", title: "Focus block - auth flow prototype", duration: "2h", type: "focus" },
  { time: "16:00", title: "1:1 with Priya", duration: "30m", type: "meeting" },
];

export const navItems: Array<{ icon: typeof LayoutDashboard; label: string; id: DashboardSection }> = [
  { icon: LayoutDashboard, label: "Overview", id: "overview" },
  { icon: CheckSquare, label: "Tasks", id: "tasks" },
  { icon: FileText, label: "Vault", id: "notes" },
  { icon: Calendar, label: "Calendar", id: "calendar" },
  { icon: BarChart2, label: "Focus", id: "focus" },
  { icon: Bookmark, label: "Bookmarks", id: "bookmarks" },
  { icon: Inbox, label: "Inbox", id: "inbox" },
];

export const tagColors: Record<string, string> = {
  Design: "text-[#8b7cf8] bg-[#8b7cf8]/10",
  Engineering: "text-[#5ecfb0] bg-[#5ecfb0]/10",
  Comms: "text-[#f5a623] bg-[#f5a623]/10",
  Product: "text-[#7ec8e3] bg-[#7ec8e3]/10",
  Reading: "text-[#e05252] bg-[#e05252]/10",
};

export const priorityDot: Record<string, string> = {
  high: "bg-[#e05252]",
  medium: "bg-[#f5a623]",
  low: "bg-[#6b6b80]",
};
