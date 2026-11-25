"use client";

import React, { useMemo, useState } from "react";
import Header from "@/components/layout/Header";
import {
  useAllTasks,
  useCreateTask,
  useUpdateTask,
  useDeleteTask,
  DashboardTask,
  TaskScope,
} from "@/lib/hooks/useTasks";
import { useCases } from "@/lib/hooks/useCases";
import { useTeamMembers } from "@/lib/hooks/useTeam";
import { toast } from "sonner";
import {
  Clock,
  CalendarDays,
  Briefcase,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Plus,
  Trash2,
  AlertTriangle,
  Pencil,
  Search,
  CheckCircle2,
  ListTodo,
  PlayCircle,
  User as UserIcon,
  FolderOpen,
  X,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import Link from "next/link";
import Modal from "@/components/ui/Modal";
import { useAuthStore } from "@/lib/store/authStore";
import { getErrorMessage } from "@/lib/api";

const KANBAN_COLUMNS = [
  {
    id: "pending",
    label: "To Do",
    bg: "bg-gray-50/90",
    border: "border-gray-200",
    dot: "bg-slate-400",
  },
  {
    id: "in_progress",
    label: "In Progress",
    bg: "bg-blue-50/60",
    border: "border-blue-200/80",
    dot: "bg-blue-500",
  },
  {
    id: "completed",
    label: "Completed",
    bg: "bg-emerald-50/60",
    border: "border-emerald-200/80",
    dot: "bg-emerald-500",
  },
] as const;

const TASK_TYPE_OPTIONS = [
  { value: "drafting", label: "Drafting", chipClass: "text-indigo-700 bg-indigo-50 border-indigo-200" },
  { value: "filing", label: "Filing", chipClass: "text-cyan-700 bg-cyan-50 border-cyan-200" },
  { value: "research", label: "Research", chipClass: "text-purple-700 bg-purple-50 border-purple-200" },
  { value: "evidence_collection", label: "Evidence", chipClass: "text-teal-700 bg-teal-50 border-teal-200" },
  { value: "client_meeting", label: "Client Meeting", chipClass: "text-amber-700 bg-amber-50 border-amber-200" },
  { value: "hearing_preparation", label: "Hearing Prep", chipClass: "text-rose-700 bg-rose-50 border-rose-200" },
  { value: "review", label: "Review", chipClass: "text-sky-700 bg-sky-50 border-sky-200" },
  { value: "other", label: "General / Other", chipClass: "text-slate-700 bg-slate-100 border-slate-200" },
] as const;

const SCOPE_OPTIONS: { value: TaskScope; label: string }[] = [
  { value: "mine", label: "My Tasks" },
  { value: "assigned_by_me", label: "Assigned by Me" },
  { value: "firm", label: "All Firm Tasks" },
];

type DeadlineState = "overdue" | "today" | "upcoming" | "none";

function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDeadlineState(deadline?: string | null, status?: string): DeadlineState {
  if (!deadline) return "none";
  if (status === "completed" || status === "reviewed" || status === "cancelled") {
    return "upcoming";
  }
  const isoDay = deadline.slice(0, 10);
  const todayIso = getLocalTodayIso();
  if (isoDay < todayIso) return "overdue";
  if (isoDay === todayIso) return "today";
  return "upcoming";
}

function formatDeadlineDisplay(deadline: string): string {
  const parts = deadline.slice(0, 10).split("-");
  if (parts.length !== 3) return deadline;
  const localDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  return localDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatTime(mins?: number): string {
  if (!mins || mins <= 0) return "0m";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function getPriorityColor(priority?: string): string {
  switch (priority?.toLowerCase()) {
    case "high":
      return "text-red-700 bg-red-50 ring-red-200";
    case "medium":
      return "text-amber-700 bg-amber-50 ring-amber-200";
    case "low":
      return "text-emerald-700 bg-emerald-50 ring-emerald-200";
    default:
      return "text-gray-600 bg-gray-50 ring-gray-200";
  }
}

function getTaskTypeMeta(taskType?: string) {
  return (
    TASK_TYPE_OPTIONS.find((opt) => opt.value === taskType) ||
    TASK_TYPE_OPTIONS[TASK_TYPE_OPTIONS.length - 1]
  );
}

interface TaskFormState {
  title: string;
  case_id: string;
  task_type: string;
  assignee_id: string;
  priority: string;
  deadline: string;
  description: string;
}

const EMPTY_FORM: TaskFormState = {
  title: "",
  case_id: "",
  task_type: "other",
  assignee_id: "",
  priority: "medium",
  deadline: "",
  description: "",
};

export default function TasksPage() {
  const user = useAuthStore((s) => s.user);
  const [scope, setScope] = useState<TaskScope>("mine");
  const { data: tasks, isLoading } = useAllTasks(scope);
  const { data: casesData } = useCases({ limit: 100 });
  const { data: teamData } = useTeamMembers();

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [overdueOnly, setOverdueOnly] = useState(false);

  // Create / Edit modal state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DashboardTask | null>(null);
  const [formState, setFormState] = useState<TaskFormState>(EMPTY_FORM);

  // Time modal state
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null);
  const [actualHours, setActualHours] = useState("");
  const [actualMins, setActualMins] = useState("");

  // Delete modal state
  const [taskToDelete, setTaskToDelete] = useState<DashboardTask | null>(null);

  const assigneeOptions = useMemo(() => {
    const members = teamData?.team || [];
    if (members.length > 0) {
      return members.map((m) => ({ id: m.id, name: m.name, role: m.role }));
    }
    if (user?.id) {
      return [{ id: user.id, name: user.full_name || "Me", role: user.role || "Advocate" }];
    }
    return [];
  }, [teamData, user]);

  // KPI metrics calculated across current scope (before visual filters)
  const kpis = useMemo(() => {
    const all = tasks || [];
    let todo = 0;
    let inProgress = 0;
    let overdue = 0;
    let totalMinutes = 0;

    for (const t of all) {
      if (t.status === "pending") todo += 1;
      else if (t.status === "in_progress") inProgress += 1;

      if (getDeadlineState(t.deadline, t.status) === "overdue") {
        overdue += 1;
      }
      totalMinutes += t.actual_minutes || 0;
    }

    return { todo, inProgress, overdue, totalMinutes };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    const all = tasks || [];
    const q = searchQuery.trim().toLowerCase();

    return all.filter((t) => {
      if (priorityFilter !== "all" && (t.priority || "medium").toLowerCase() !== priorityFilter) {
        return false;
      }
      if (typeFilter !== "all" && (t.task_type || "other") !== typeFilter) {
        return false;
      }
      if (overdueOnly && getDeadlineState(t.deadline, t.status) !== "overdue") {
        return false;
      }
      if (q) {
        const hay = [
          t.title,
          t.description,
          t.case_no,
          t.case_title,
          t.assignee?.full_name,
          getTaskTypeMeta(t.task_type).label,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [tasks, searchQuery, priorityFilter, typeFilter, overdueOnly]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    priorityFilter !== "all" ||
    typeFilter !== "all" ||
    overdueOnly;

  const clearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("all");
    setTypeFilter("all");
    setOverdueOnly(false);
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setFormState({
      ...EMPTY_FORM,
      assignee_id: user?.id || assigneeOptions[0]?.id || "",
    });
    setTaskModalOpen(true);
  };

  const openEditModal = (task: DashboardTask) => {
    setEditingTask(task);
    setFormState({
      title: task.title || "",
      case_id: task.case_id || "",
      task_type: task.task_type || "other",
      assignee_id: task.assignee_id || user?.id || "",
      priority: task.priority || "medium",
      deadline: task.deadline ? task.deadline.slice(0, 10) : "",
      description: task.description || "",
    });
    setTaskModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = formState.title.trim();
    if (!trimmedTitle) {
      toast.error("Please enter a task title");
      return;
    }

    try {
      if (editingTask) {
        const hadDeadline = Boolean(editingTask.deadline);
        const clearedDeadline = hadDeadline && !formState.deadline;
        await updateTask.mutateAsync({
          id: editingTask.id,
          data: {
            title: trimmedTitle,
            description: formState.description.trim() || "",
            case_id: formState.case_id || "",
            task_type: formState.task_type,
            assignee_id: formState.assignee_id || undefined,
            priority: formState.priority,
            deadline: formState.deadline || undefined,
            clear_deadline: clearedDeadline || undefined,
          },
        });
        toast.success("Task updated");
      } else {
        await createTask.mutateAsync({
          title: trimmedTitle,
          description: formState.description.trim() || undefined,
          case_id: formState.case_id || null,
          task_type: formState.task_type,
          assignee_id: formState.assignee_id || user?.id || undefined,
          priority: formState.priority,
          deadline: formState.deadline || undefined,
        });
        toast.success("Task created");
      }
      setTaskModalOpen(false);
      setEditingTask(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTask.mutate(
      { id: taskId, data: { status: newStatus } },
      {
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const openTimeModal = (task: DashboardTask) => {
    setSelectedTask(task);
    const mins = task.actual_minutes || 0;
    setActualHours(Math.floor(mins / 60).toString());
    setActualMins((mins % 60).toString());
    setTimeModalOpen(true);
  };

  const handleLogTime = () => {
    if (!selectedTask) return;
    const h = Math.max(0, parseInt(actualHours || "0", 10) || 0);
    const m = Math.max(0, parseInt(actualMins || "0", 10) || 0);
    const totalMins = h * 60 + m;
    updateTask.mutate(
      { id: selectedTask.id, data: { actual_minutes: totalMins } },
      {
        onSuccess: () => {
          setTimeModalOpen(false);
          toast.success("Time logged successfully");
        },
        onError: (err) => toast.error(getErrorMessage(err)),
      }
    );
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await deleteTask.mutateAsync({ taskId: taskToDelete.id });
      toast.success("Task deleted");
      setTaskToDelete(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const getColumnTasks = (columnId: string) =>
    filteredTasks.filter((t) => {
      if (columnId === "completed") return t.status === "completed" || t.status === "reviewed";
      if (columnId === "pending") return t.status === "pending";
      return t.status === "in_progress";
    });

  const isSavingModal = createTask.isPending || updateTask.isPending;

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header
        title="My Tasks"
        subtitle="Task Management, Delegation & Time Tracking"
        rightContent={
          <button
            onClick={openCreateModal}
            className="flex items-center gap-2 bg-sidebar text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-sidebar-dark transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Task
          </button>
        }
      />

      <div className="flex-1 flex flex-col overflow-hidden px-6 pt-5 pb-6 gap-4">
        {/* Top KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500">To Do</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{kpis.todo}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <ListTodo className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-blue-600 mt-0.5">{kpis.inProgress}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <PlayCircle className="w-5 h-5" />
            </div>
          </div>

          <button
            type="button"
            onClick={() => setOverdueOnly((prev) => !prev)}
            className={cn(
              "text-left rounded-2xl border p-4 flex items-center justify-between shadow-sm transition-all",
              overdueOnly
                ? "bg-red-50 border-red-300 ring-2 ring-red-200"
                : kpis.overdue > 0
                ? "bg-white border-red-200 hover:bg-red-50/40"
                : "bg-white border-gray-200/80 hover:bg-gray-50/60"
            )}
            title="Click to filter overdue tasks"
          >
            <div>
              <p className={cn("text-xs font-semibold", kpis.overdue > 0 ? "text-red-600" : "text-gray-500")}>
                Overdue
              </p>
              <p className={cn("text-2xl font-bold mt-0.5", kpis.overdue > 0 ? "text-red-600" : "text-gray-900")}>
                {kpis.overdue}
              </p>
            </div>
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center",
                kpis.overdue > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
              )}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
          </button>

          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className="text-xs font-semibold text-gray-500">Time Logged</p>
              <p className="text-2xl font-bold text-emerald-700 mt-0.5">
                {formatTime(kpis.totalMinutes)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Scope & Filter Toolbar */}
        <div className="bg-white rounded-2xl border border-gray-200/80 p-3 flex flex-wrap items-center gap-3 shadow-sm flex-shrink-0">
          {/* Scope Switcher */}
          <div className="inline-flex rounded-xl bg-gray-100 p-1">
            {SCOPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setScope(opt.value)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all",
                  scope === opt.value
                    ? "bg-white text-sidebar shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, cases, or team members..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-sidebar"
            />
          </div>

          {/* Task Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 outline-none focus:border-sidebar"
          >
            <option value="all">All Task Types</option>
            {TASK_TYPE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 outline-none focus:border-sidebar"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 hover:text-gray-900 px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          )}
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          {isLoading ? (
            <div className="flex gap-5 h-full animate-pulse">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex-1 min-w-[320px] bg-gray-100/70 rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="flex gap-5 h-full items-start">
              {KANBAN_COLUMNS.map((col) => {
                const colTasks = getColumnTasks(col.id);
                return (
                  <div
                    key={col.id}
                    className={cn(
                      "flex-1 min-w-[320px] flex flex-col h-full max-h-full rounded-2xl border p-4",
                      col.bg,
                      col.border
                    )}
                  >
                    <div className="flex items-center justify-between mb-3.5 px-1 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-2.5 h-2.5 rounded-full", col.dot)} />
                        <h2 className="font-bold text-gray-800 text-sm">{col.label}</h2>
                      </div>
                      <span className="text-xs font-bold bg-white px-2.5 py-0.5 rounded-full text-gray-600 border border-gray-200/70">
                        {colTasks.length}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5">
                      {colTasks.map((task) => {
                        const typeMeta = getTaskTypeMeta(task.task_type);
                        const deadlineState = getDeadlineState(task.deadline, task.status);

                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "bg-white p-4 rounded-xl border shadow-sm hover:shadow-md transition-all relative group",
                              deadlineState === "overdue" ? "border-red-300" : "border-gray-200"
                            )}
                          >
                            <div className="flex items-start justify-between gap-2 mb-1.5">
                              <h3 className="text-sm font-bold text-gray-900 group-hover:text-sidebar transition-colors line-clamp-2">
                                {task.title}
                              </h3>
                              <span
                                className={cn(
                                  "flex-shrink-0 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1",
                                  getPriorityColor(task.priority)
                                )}
                              >
                                {task.priority || "medium"}
                              </span>
                            </div>

                            {task.description && (
                              <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                                {task.description}
                              </p>
                            )}

                            {/* Metadata Chips */}
                            <div className="flex flex-wrap items-center gap-1.5 mb-3">
                              <span
                                className={cn(
                                  "text-[10px] font-semibold px-2 py-0.5 rounded-md border",
                                  typeMeta.chipClass
                                )}
                              >
                                {typeMeta.label}
                              </span>

                              {task.deadline && (
                                <div
                                  className={cn(
                                    "text-[10px] font-semibold px-2 py-0.5 rounded-md border flex items-center gap-1",
                                    deadlineState === "overdue"
                                      ? "text-red-700 bg-red-50 border-red-200"
                                      : deadlineState === "today"
                                      ? "text-amber-800 bg-amber-100 border-amber-300"
                                      : "text-amber-700 bg-amber-50 border-amber-100"
                                  )}
                                >
                                  <CalendarDays className="w-3 h-3" />
                                  {deadlineState === "overdue"
                                    ? `Overdue · ${formatDeadlineDisplay(task.deadline)}`
                                    : deadlineState === "today"
                                    ? "Due Today"
                                    : `Due ${formatDeadlineDisplay(task.deadline)}`}
                                </div>
                              )}

                              {task.case_id && (task.case_title || task.case_no) ? (
                                <Link
                                  href={`/cases/${task.case_id}`}
                                  className="text-[10px] font-semibold text-sidebar bg-sidebar/5 px-2 py-0.5 rounded-md border border-sidebar/20 flex items-center gap-1 hover:bg-sidebar/10"
                                  title={task.case_title || undefined}
                                >
                                  <Briefcase className="w-3 h-3" />
                                  {task.case_no || task.case_title}
                                </Link>
                              ) : (
                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md border border-gray-200 flex items-center gap-1">
                                  <FolderOpen className="w-3 h-3" /> General / Office
                                </span>
                              )}

                              {task.assignee?.full_name && (
                                <span
                                  className="text-[10px] font-semibold text-gray-600 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200 flex items-center gap-1"
                                  title={`Assigned to ${task.assignee.full_name}`}
                                >
                                  <span className="w-3.5 h-3.5 rounded-full bg-sidebar/15 text-sidebar text-[8px] font-bold inline-flex items-center justify-center">
                                    {getInitials(task.assignee.full_name)}
                                  </span>
                                  {task.assignee.full_name}
                                </span>
                              )}
                            </div>

                            {/* Footer Actions */}
                            <div className="flex items-center justify-between pt-2.5 border-t border-gray-100">
                              <button
                                type="button"
                                onClick={() => openTimeModal(task)}
                                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-sidebar hover:bg-gray-50 px-2 py-1 -ml-2 rounded-md transition-colors"
                              >
                                <Clock className="w-3.5 h-3.5" />
                                {task.actual_minutes ? formatTime(task.actual_minutes) : "Log Time"}
                              </button>

                              <div className="flex items-center gap-0.5">
                                <button
                                  type="button"
                                  onClick={() => openEditModal(task)}
                                  className="p-1.5 text-gray-400 hover:text-sidebar hover:bg-gray-100 rounded-md transition-colors"
                                  title="Edit Task"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setTaskToDelete(task)}
                                  className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                  title="Delete Task"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                {col.id !== "pending" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStatusChange(
                                        task.id,
                                        col.id === "completed" ? "in_progress" : "pending"
                                      )
                                    }
                                    className="p-1.5 text-gray-400 hover:text-sidebar hover:bg-gray-100 rounded-md transition-colors"
                                    title="Move Left"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                )}
                                {col.id !== "completed" && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleStatusChange(
                                        task.id,
                                        col.id === "pending" ? "in_progress" : "completed"
                                      )
                                    }
                                    className="p-1.5 text-gray-400 hover:text-sidebar hover:bg-gray-100 rounded-md transition-colors"
                                    title="Move Right"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </div>

                            {updateTask.isPending && updateTask.variables?.id === task.id && (
                              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
                                <Loader2 className="w-5 h-5 text-sidebar animate-spin" />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {colTasks.length === 0 && (
                        <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-white/60">
                          <CheckCircle2 className="w-6 h-6 text-gray-300 mx-auto mb-1.5" />
                          <p className="text-xs font-medium text-gray-400">
                            {hasActiveFilters
                              ? "No matching tasks in this stage"
                              : "No tasks in this stage"}
                          </p>
                          {col.id === "pending" && !hasActiveFilters && (
                            <button
                              type="button"
                              onClick={openCreateModal}
                              className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-sidebar hover:underline"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add your first task
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Time Logging Modal */}
      <Modal
        open={timeModalOpen}
        onClose={() => setTimeModalOpen(false)}
        title="Log Time Spent"
        size="sm"
      >
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Task</label>
              <div className="text-sm text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                {selectedTask.title}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Hours</label>
                <input
                  type="number"
                  min="0"
                  value={actualHours}
                  onChange={(e) => setActualHours(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Minutes</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={actualMins}
                  onChange={(e) => setActualMins(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar"
                  placeholder="30"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setTimeModalOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLogTime}
                disabled={updateTask.isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-sidebar rounded-lg hover:bg-sidebar-dark flex items-center gap-2"
              >
                {updateTask.isPending ? "Saving..." : "Save Time"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Create / Edit Task Modal */}
      <Modal
        open={taskModalOpen}
        onClose={() => !isSavingModal && setTaskModalOpen(false)}
        title={editingTask ? "Edit Task" : "Create New Task"}
        size="md"
      >
        <form onSubmit={handleSaveTask} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Task Title *</label>
            <input
              required
              type="text"
              value={formState.title}
              onChange={(e) => setFormState({ ...formState, title: e.target.value })}
              className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar"
              placeholder="e.g., Draft Written Statement or Follow up with new client"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                Case / Matter <span className="text-xs font-normal text-gray-400">(Optional)</span>
              </label>
              <select
                value={formState.case_id}
                onChange={(e) => setFormState({ ...formState, case_id: e.target.value })}
                className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar bg-white text-sm"
              >
                <option value="">General / Office Task (No Case)</option>
                {casesData?.cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({c.case_no})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Task Type</label>
              <select
                value={formState.task_type}
                onChange={(e) => setFormState({ ...formState, task_type: e.target.value })}
                className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar bg-white text-sm"
              >
                {TASK_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">
                <span className="inline-flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5 text-gray-400" /> Assign To
                </span>
              </label>
              <select
                value={formState.assignee_id}
                onChange={(e) => setFormState({ ...formState, assignee_id: e.target.value })}
                className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar bg-white text-sm"
              >
                {assigneeOptions.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                    {member.id === user?.id ? " (Me)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Priority</label>
              <select
                value={formState.priority}
                onChange={(e) => setFormState({ ...formState, priority: e.target.value })}
                className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar bg-white text-sm"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Deadline</label>
              <input
                type="date"
                value={formState.deadline}
                onChange={(e) => setFormState({ ...formState, deadline: e.target.value })}
                className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea
              value={formState.description}
              onChange={(e) => setFormState({ ...formState, description: e.target.value })}
              className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar min-h-[84px] text-sm"
              placeholder="Instructions, filing details, or notes..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setTaskModalOpen(false)}
              disabled={isSavingModal}
              className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSavingModal}
              className="px-4 py-2 text-sm font-bold text-white bg-sidebar rounded-lg hover:bg-sidebar-dark flex items-center gap-2 disabled:opacity-60"
            >
              {isSavingModal && <Loader2 className="w-4 h-4 animate-spin" />}
              {editingTask ? "Save Changes" : "Create Task"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        open={!!taskToDelete}
        onClose={() => !deleteTask.isPending && setTaskToDelete(null)}
        title=""
        size="sm"
      >
        {taskToDelete && (
          <div className="text-center px-2 pb-2">
            <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Task?</h3>
            <p className="text-sm text-gray-500 mb-1">You are about to permanently delete:</p>
            <p className="text-sm font-bold text-gray-800 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 mb-5">
              &ldquo;{taskToDelete.title}&rdquo;
            </p>
            <p className="text-xs text-red-500 font-medium mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTaskToDelete(null)}
                disabled={deleteTask.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleteTask.isPending}
                className="flex-1 px-4 py-2.5 text-sm font-bold text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {deleteTask.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                {deleteTask.isPending ? "Deleting..." : "Delete Task"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
