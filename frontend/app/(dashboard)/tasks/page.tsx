"use client";

import React, { useState } from "react";
import Header from "@/components/layout/Header";
import { useAllTasks, useUpdateTask, DashboardTask } from "@/lib/hooks/useTasks";
import { useCases } from "@/lib/hooks/useCases";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Circle, AlertCircle, Clock, CalendarDays, Briefcase, FileText, ChevronRight, ChevronLeft, MoreHorizontal, Loader2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import Modal from "@/components/ui/Modal";

const KANBAN_COLUMNS = [
  { id: "pending", label: "To Do", color: "bg-gray-100", border: "border-gray-200" },
  { id: "in_progress", label: "In Progress", color: "bg-blue-50", border: "border-blue-200" },
  { id: "completed", label: "Completed", color: "bg-green-50", border: "border-green-200" }
];

export default function TasksPage() {
  const qc = useQueryClient();
  const { data: tasks, isLoading } = useAllTasks();
  const { data: casesData } = useCases({ limit: 100 });
  const updateTask = useUpdateTask();

  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  
  // Add task form state
  const [newTask, setNewTask] = useState({
    case_id: "",
    title: "",
    description: "",
    priority: "medium",
    task_type: "other",
    deadline: ""
  });
  const [isCreating, setIsCreating] = useState(false);
  const [selectedTask, setSelectedTask] = useState<DashboardTask | null>(null);
  const [actualHours, setActualHours] = useState("");
  const [actualMins, setActualMins] = useState("");

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "high": return "text-red-600 bg-red-50 ring-red-200";
      case "medium": return "text-amber-600 bg-amber-50 ring-amber-200";
      case "low": return "text-green-600 bg-green-50 ring-green-200";
      default: return "text-gray-600 bg-gray-50 ring-gray-200";
    }
  };

  const handleStatusChange = (taskId: string, newStatus: string) => {
    updateTask.mutate({ id: taskId, data: { status: newStatus } });
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
    const totalMins = (parseInt(actualHours || "0") * 60) + parseInt(actualMins || "0");
    updateTask.mutate({ id: selectedTask.id, data: { actual_minutes: totalMins } }, {
      onSuccess: () => {
        setTimeModalOpen(false);
        toast.success("Time logged successfully");
      }
    });
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.case_id || !newTask.title) {
      toast.error("Please select a case and enter a title");
      return;
    }
    try {
      setIsCreating(true);
      await api.post(`/cases/${newTask.case_id}/tasks`, newTask);
      await qc.invalidateQueries({ queryKey: ["tasks", "all"] });
      toast.success("Task created successfully");
      setAddTaskModalOpen(false);
      setNewTask({ case_id: "", title: "", description: "", priority: "medium", task_type: "other", deadline: "" });
    } catch (err: any) {
      toast.error(err.response?.data?.detail || "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  const formatTime = (mins: number) => {
    if (!mins) return "0m";
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h > 0 ? h + 'h ' : ''}${m}m`;
  };

  const renderColumn = (status: string) => {
    // Map backend statuses to our 3 columns
    const mappedTasks = (tasks || []).filter(t => {
      if (status === "completed") return t.status === "completed" || t.status === "reviewed";
      if (status === "pending") return t.status === "pending";
      return t.status === "in_progress";
    });

    return (
      <div className="flex-1 min-w-[320px] flex flex-col gap-4">
        {mappedTasks.map(task => (
          <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all relative group">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="text-sm font-bold text-gray-900 group-hover:text-sidebar transition-colors line-clamp-2">{task.title}</h3>
              <span className={cn("flex-shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ring-1", getPriorityColor(task.priority))}>
                {task.priority || "Normal"}
              </span>
            </div>
            
            <p className="text-xs text-gray-500 mb-3 line-clamp-2">{task.description}</p>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              {task.deadline && (
                <div className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded border border-amber-100 flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> Due {new Date(task.deadline).toLocaleDateString()}
                </div>
              )}
              {task.case_title && (
                <Link href={`/cases/${task.case_id}`} className="text-[10px] font-semibold text-sidebar bg-sidebar/5 px-2 py-1 rounded border border-sidebar/20 flex items-center gap-1 hover:bg-sidebar/10">
                  <Briefcase className="w-3 h-3" /> Case {task.case_no}
                </Link>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button onClick={() => openTimeModal(task)} 
                className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-sidebar hover:bg-gray-50 px-2 py-1 -ml-2 rounded-md transition-colors">
                <Clock className="w-3.5 h-3.5" /> 
                {task.actual_minutes ? formatTime(task.actual_minutes) : "Log Time"}
              </button>

              <div className="flex items-center gap-1">
                {status !== "pending" && (
                  <button onClick={() => handleStatusChange(task.id, status === "completed" ? "in_progress" : "pending")} 
                    className="p-1.5 text-gray-400 hover:text-sidebar hover:bg-gray-100 rounded-md transition-colors" title="Move Left">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {status !== "completed" && (
                  <button onClick={() => handleStatusChange(task.id, status === "pending" ? "in_progress" : "completed")} 
                    className="p-1.5 text-gray-400 hover:text-sidebar hover:bg-gray-100 rounded-md transition-colors" title="Move Right">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            {/* Loading Overlay */}
            {updateTask.isPending && updateTask.variables?.id === task.id && (
              <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10">
                <Loader2 className="w-5 h-5 text-sidebar animate-spin" />
              </div>
            )}
          </div>
        ))}
        {mappedTasks.length === 0 && (
          <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
            <span className="text-sm font-medium text-gray-400">No tasks in this stage</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#F7F8F6]">
      <Header 
        title="My Tasks" 
        subtitle="Task Management & Time Tracking Board" 
        rightContent={
          <button onClick={() => setAddTaskModalOpen(true)} className="flex items-center gap-2 bg-sidebar text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-sidebar-dark transition-colors">
            <Plus className="w-4 h-4" /> New Task
          </button>
        }
      />

      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        {isLoading ? (
          <div className="flex gap-6 h-full animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-1 min-w-[320px] bg-gray-100/50 rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="flex gap-6 h-full items-start">
            {KANBAN_COLUMNS.map(col => (
              <div key={col.id} className={cn("flex-1 min-w-[320px] flex flex-col h-full max-h-full rounded-2xl border p-4", col.color, col.border)}>
                <div className="flex items-center justify-between mb-4 px-1">
                  <h2 className="font-bold text-gray-800 text-sm">{col.label}</h2>
                  <span className="text-xs font-bold bg-white/60 px-2 py-0.5 rounded-full text-gray-500">
                    {tasks?.filter(t => {
                      if (col.id === "completed") return t.status === "completed" || t.status === "reviewed";
                      if (col.id === "pending") return t.status === "pending";
                      return t.status === "in_progress";
                    }).length || 0}
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto no-scrollbar">
                  {renderColumn(col.id)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Time Logging Modal */}
      <Modal open={timeModalOpen} onClose={() => setTimeModalOpen(false)} title="Log Time Spent" size="sm">
        {selectedTask && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Task</label>
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded-lg border border-gray-100">{selectedTask.title}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Hours</label>
                <input type="number" min="0" value={actualHours} onChange={e => setActualHours(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar" placeholder="0" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">Minutes</label>
                <input type="number" min="0" max="59" value={actualMins} onChange={e => setActualMins(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar" placeholder="30" />
              </div>
            </div>

            <div className="pt-4 flex justify-end gap-3">
              <button onClick={() => setTimeModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button onClick={handleLogTime} disabled={updateTask.isPending}
                className="px-4 py-2 text-sm font-bold text-white bg-sidebar rounded-lg hover:bg-sidebar-dark flex items-center gap-2">
                {updateTask.isPending ? "Saving..." : "Save Time"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Add Task Modal */}
      <Modal open={addTaskModalOpen} onClose={() => setAddTaskModalOpen(false)} title="Create New Task" size="md">
        <form onSubmit={handleCreateTask} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Select Case / Matter *</label>
            <select required value={newTask.case_id} onChange={e => setNewTask({...newTask, case_id: e.target.value})} className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar bg-white">
              <option value="">-- Choose a Case --</option>
              {casesData?.cases.map(c => (
                <option key={c.id} value={c.id}>{c.title} ({c.case_no})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Task Title *</label>
            <input required type="text" value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar" placeholder="e.g., Draft Written Statement" />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar min-h-[80px]" placeholder="Optional details..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Deadline</label>
              <input type="date" value={newTask.deadline} onChange={e => setNewTask({...newTask, deadline: e.target.value})} className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar" />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Priority</label>
              <select value={newTask.priority} onChange={e => setNewTask({...newTask, priority: e.target.value})} className="w-full rounded-lg border border-gray-200 p-2.5 outline-none focus:border-sidebar bg-white">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
            <button type="button" onClick={() => setAddTaskModalOpen(false)} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={isCreating} className="px-4 py-2 text-sm font-bold text-white bg-sidebar rounded-lg hover:bg-sidebar-dark flex items-center gap-2">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Task"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
