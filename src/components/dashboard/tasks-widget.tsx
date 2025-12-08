"use client";

import { useState } from "react";
import useSWR from "swr";
import { TasksWidgetProps } from "@/types";
import {
  CheckSquare2,
  Square,
  Calendar,
  RefreshCw,
  ExternalLink,
  ListTodo,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { WidgetLayout } from "@/components/dashboard/widget-layout";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatInTimeZone } from "date-fns-tz";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
};

interface Task {
  id: string;
  title: string;
  status: "needsAction" | "completed";
  due: string | null;
  notes: string | null;
  updated: string;
  completed: boolean;
}

interface TasksData {
  tasks: Task[];
  taskListId: string;
}

async function performTaskAction(
  action: "create" | "update" | "delete",
  payload: {
    taskId?: string;
    title?: string;
    notes?: string;
    due?: string;
    status?: "needsAction" | "completed";
  }
) {
  const res = await fetch("/api/tasks", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to perform action");
  }

  return res.json();
}

export function TasksWidget({ config, gridSize }: TasksWidgetProps) {
  const isCompact = gridSize ? gridSize.h <= 2 : false;
  const isStandard = !isCompact;

  const { data, error, isLoading, mutate } = useSWR<TasksData>(
    "/api/tasks",
    fetcher,
    {
      refreshInterval: config.refreshInterval || 60000 * 5, // Default 5 minutes
    }
  );

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [isCompletedCollapsed, setIsCompletedCollapsed] = useState(true);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await mutate();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsCreating(true);
    try {
      await performTaskAction("create", { title: newTaskTitle.trim() });
      setNewTaskTitle("");
      await mutate();
    } catch (error) {
      console.error("Failed to create task:", error);
      alert(error instanceof Error ? error.message : "Failed to create task");
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    if (completingTaskId === task.id) return;

    setCompletingTaskId(task.id);
    try {
      const newStatus = task.completed ? "needsAction" : "completed";
      await performTaskAction("update", {
        taskId: task.id,
        status: newStatus,
      });
      await mutate();
    } catch (error) {
      console.error("Failed to update task:", error);
      alert(error instanceof Error ? error.message : "Failed to update task");
    } finally {
      setCompletingTaskId(null);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (deletingTaskId === taskId) return;
    if (!confirm("Are you sure you want to delete this task?")) return;

    setDeletingTaskId(taskId);
    try {
      await performTaskAction("delete", { taskId });
      await mutate();
    } catch (error) {
      console.error("Failed to delete task:", error);
      alert(error instanceof Error ? error.message : "Failed to delete task");
    } finally {
      setDeletingTaskId(null);
    }
  };

  const tasks = data?.tasks || [];
  const incompleteTasks = tasks.filter((task) => !task.completed);
  const completedTasks = tasks.filter((task) => task.completed);

  // Sort incomplete tasks by due date (earliest first), then by updated date
  const sortedIncompleteTasks = [...incompleteTasks].sort((a, b) => {
    if (a.due && b.due) {
      return new Date(a.due).getTime() - new Date(b.due).getTime();
    }
    if (a.due && !b.due) return -1;
    if (!a.due && b.due) return 1;
    return new Date(b.updated).getTime() - new Date(a.updated).getTime();
  });

  const formatDueDate = (dueDate: string | null) => {
    if (!dueDate) return null;
    try {
      // Google Tasks API only supports dates, not times
      // The API always returns dates as midnight UTC (00:00:00.000Z)
      // We need to extract just the date part and compare dates, not datetimes

      // Parse the date string - it's in RFC3339 format (e.g., "2025-12-06T00:00:00.000Z")
      // Extract just the date part (YYYY-MM-DD)
      const dateMatch = dueDate.match(/^(\d{4}-\d{2}-\d{2})/);
      if (!dateMatch) return dueDate;

      const dateOnlyStr = dateMatch[1]; // e.g., "2025-12-06"

      // Get current date in the configured timezone (date only, no time)
      const now = new Date();
      const todayStr = formatInTimeZone(now, config.timezone || "UTC", "yyyy-MM-dd");

      // Compare date strings directly
      const [todayYear, todayMonth, todayDay] = todayStr.split("-").map(Number);
      const [taskYear, taskMonth, taskDay] = dateOnlyStr.split("-").map(Number);

      const todayDate = new Date(Date.UTC(todayYear, todayMonth - 1, todayDay));
      const taskDateOnly = new Date(Date.UTC(taskYear, taskMonth - 1, taskDay));
      const diffDays = Math.floor(
        (taskDateOnly.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Google Tasks API doesn't support times, so we never show time
      // All due dates are date-only (all-day events)

      if (diffDays === 0) {
        return "Today";
      }
      if (diffDays === 1) {
        return "Tomorrow";
      }
      if (diffDays === -1) {
        return "Yesterday";
      }
      if (diffDays > 0 && diffDays <= 7) {
        return `In ${diffDays} days`;
      }
      if (diffDays < 0 && diffDays >= -7) {
        return `${Math.abs(diffDays)} days ago`;
      }

      // For dates further out, show full date
      // Parse the date-only string and format it in the configured timezone
      const taskDate = new Date(Date.UTC(taskYear, taskMonth - 1, taskDay));
      return formatInTimeZone(taskDate, config.timezone || "UTC", "MMM d, yyyy");
    } catch {
      return dueDate;
    }
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    try {
      const date = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      date.setHours(0, 0, 0, 0);
      return date < today;
    } catch {
      return false;
    }
  };

  if (isCompact) {
    // Compact mode: Show only the next few incomplete tasks
    const displayTasks = sortedIncompleteTasks.slice(0, 3);

    return (
      <WidgetLayout
        gridSize={gridSize}
        title={undefined}
        icon={undefined}
        contentClassName="p-0"
      >
        <div className="h-full flex flex-col justify-center p-4">
          {isLoading ? (
            <div className="text-center text-muted-foreground text-sm">
              Loading...
            </div>
          ) : error ? (
            <div className="text-center text-destructive text-sm">
              Failed to load
            </div>
          ) : displayTasks.length === 0 ? (
            <div className="text-center text-muted-foreground text-sm">
              No tasks
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <div className="text-xs text-muted-foreground uppercase tracking-wider">
                Tasks
              </div>
              <div className="flex flex-col gap-2">
                {displayTasks.map((task) => {
                  const dueDate = formatDueDate(task.due);
                  const overdue = isOverdue(task.due);
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-md border",
                        overdue
                          ? "border-destructive/30 bg-destructive/5"
                          : "border-border/30 bg-card/30"
                      )}
                    >
                      <button
                        onClick={() => handleToggleComplete(task)}
                        disabled={completingTaskId === task.id}
                        className="shrink-0"
                      >
                        <Square
                          className={cn(
                            "h-4 w-4 transition-colors",
                            overdue
                              ? "text-destructive"
                              : "text-muted-foreground hover:text-primary"
                          )}
                        />
                      </button>
                      {dueDate && (
                        <div className="shrink-0">
                          <div
                            className={cn(
                              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                              overdue
                                ? "bg-destructive/20 text-destructive"
                                : dueDate === "Today"
                                ? "bg-primary/20 text-primary"
                                : dueDate === "Tomorrow"
                                ? "bg-blue-500/20 text-blue-400"
                                : "bg-muted/30 text-muted-foreground"
                            )}
                          >
                            <Calendar className="h-2.5 w-2.5" />
                            {dueDate}
                          </div>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div
                          className={cn(
                            "text-sm truncate",
                            overdue && "text-destructive font-medium"
                          )}
                        >
                          {task.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {sortedIncompleteTasks.length > 3 && (
                  <div className="text-xs text-muted-foreground pt-1">
                    +{sortedIncompleteTasks.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </WidgetLayout>
    );
  }

  // Standard layout
  return (
    <WidgetLayout
      gridSize={gridSize}
      title="Tasks"
      icon={<ListTodo className="h-5 w-5" />}
      headerActions={
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 hover:bg-secondary/40 rounded transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={cn("h-4 w-4", isRefreshing && "animate-spin")}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent>Refresh tasks</TooltipContent>
        </Tooltip>
      }
      contentClassName="p-0 flex flex-col"
    >
      {isLoading ? (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
          Loading tasks...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full text-destructive text-sm">
          Failed to load tasks
        </div>
      ) : (
        <>
          {/* Create Task Form */}
          <div className="p-3 border-b border-border/50">
            <form onSubmit={handleCreateTask} className="flex gap-2">
              <Input
                type="text"
                placeholder="Add a new task..."
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                disabled={isCreating}
                className="flex-1 h-8 text-sm"
              />
              <Button
                type="submit"
                disabled={isCreating || !newTaskTitle.trim()}
                size="sm"
                className="h-8 px-3"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </form>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {sortedIncompleteTasks.length === 0 &&
              completedTasks.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 text-sm">
                  No tasks found. Create one above!
                </div>
              ) : (
                <>
                  {sortedIncompleteTasks.length > 0 && (
                    <div className="space-y-2">
                      {sortedIncompleteTasks.map((task) => {
                        const dueDate = formatDueDate(task.due);
                        const overdue = isOverdue(task.due);
                        const isCompleting = completingTaskId === task.id;
                        const isDeleting = deletingTaskId === task.id;

                        // Determine date badge style
                        const getDateBadgeStyle = () => {
                          if (overdue) {
                            return "bg-destructive/20 text-destructive border-destructive/30";
                          }
                          if (dueDate === "Today") {
                            return "bg-primary/20 text-primary border-primary/30";
                          }
                          if (dueDate === "Tomorrow") {
                            return "bg-blue-500/20 text-blue-400 border-blue-500/30";
                          }
                          return "bg-muted/30 text-muted-foreground border-border/40";
                        };

                        return (
                          <div
                            key={task.id}
                            className={cn(
                              "flex items-center gap-3 p-3 rounded-lg border transition-all group",
                              overdue
                                ? "border-destructive/40 bg-destructive/5 hover:bg-destructive/10"
                                : "border-border/40 bg-card/50 hover:bg-secondary/10 hover:border-border/60"
                            )}
                          >
                            <button
                              onClick={() => handleToggleComplete(task)}
                              disabled={isCompleting}
                              className="shrink-0"
                            >
                              {isCompleting ? (
                                <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                              ) : (
                                <Square
                                  className={cn(
                                    "h-5 w-5 transition-colors",
                                    overdue
                                      ? "text-destructive hover:text-destructive/80"
                                      : "text-muted-foreground group-hover:text-primary"
                                  )}
                                />
                              )}
                            </button>
                            {dueDate && (
                              <div className="shrink-0">
                                <div
                                  className={cn(
                                    "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium border",
                                    getDateBadgeStyle()
                                  )}
                                >
                                  <Calendar className="h-3 w-3" />
                                  <span>{dueDate}</span>
                                </div>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div
                                className={cn(
                                  "font-medium text-sm",
                                  overdue && "text-destructive"
                                )}
                              >
                                {task.title}
                              </div>
                              {task.notes && (
                                <div className="text-xs text-muted-foreground/70 mt-1 line-clamp-2">
                                  {task.notes}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <a
                                    href={`https://tasks.google.com/embed/list/${
                                      data?.taskListId || "@default"
                                    }?id=${task.id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-secondary/40 rounded transition-colors"
                                  >
                                    <ExternalLink className="h-4 w-4 text-muted-foreground hover:text-primary" />
                                  </a>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Open in Google Tasks
                                </TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleDeleteTask(task.id)}
                                    disabled={isDeleting}
                                    className="p-1.5 hover:bg-secondary/40 rounded text-muted-foreground hover:text-destructive transition-colors"
                                  >
                                    {isDeleting ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>Delete task</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {completedTasks.length > 0 && (
                    <div className="pt-4 mt-4 border-t border-border/30">
                      <button
                        onClick={() =>
                          setIsCompletedCollapsed(!isCompletedCollapsed)
                        }
                        className="flex items-center justify-between w-full mb-3 group"
                      >
                        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider group-hover:text-foreground transition-colors">
                          Completed ({completedTasks.length})
                        </div>
                        {isCompletedCollapsed ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        ) : (
                          <ChevronUp className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        )}
                      </button>
                      {!isCompletedCollapsed && (
                        <div className="space-y-1.5">
                          {completedTasks.slice(0, 5).map((task) => {
                            const isCompleting = completingTaskId === task.id;
                            const isDeleting = deletingTaskId === task.id;
                            return (
                              <div
                                key={task.id}
                                className="flex items-center gap-2 p-2 rounded-md text-sm opacity-60 hover:opacity-100 hover:bg-secondary/5 transition-all group"
                              >
                                <button
                                  onClick={() => handleToggleComplete(task)}
                                  disabled={isCompleting}
                                  className="shrink-0"
                                >
                                  {isCompleting ? (
                                    <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
                                  ) : (
                                    <CheckSquare2 className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                                  )}
                                </button>
                                <div className="flex-1 min-w-0 line-through text-muted-foreground break-words">
                                  <span className="line-clamp-2">
                                    {task.title}
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleDeleteTask(task.id)}
                                  disabled={isDeleting}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-secondary/40 rounded text-muted-foreground hover:text-destructive"
                                >
                                  {isDeleting ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </button>
                              </div>
                            );
                          })}
                          {completedTasks.length > 5 && (
                            <div className="text-xs text-muted-foreground pl-6 pt-1">
                              +{completedTasks.length - 5} more completed
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </>
      )}
    </WidgetLayout>
  );
}
