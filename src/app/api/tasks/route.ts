import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";
import { withErrorHandling, requireConfig } from "@/lib/api-handler";
import { ApiError, ApiErrorCode } from "@/lib/api-error";

interface GoogleTasksConfig {
  enabled: boolean;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  tasklist_id?: string; // Optional: specific task list ID, defaults to "@default" (My Tasks)
}

interface AccessTokenResponse {
  access_token: string;
  expires_in: number;
  token_type: string;
}

interface GoogleTaskList {
  id: string;
  title: string;
  kind: string;
}

interface GoogleTask {
  id: string;
  title: string;
  status: "needsAction" | "completed";
  due?: string;
  notes?: string;
  updated: string;
  position: string;
  parent?: string;
  links?: Array<{
    type: string;
    link: string;
  }>;
}

interface GoogleTasksResponse {
  items: GoogleTask[];
}

/**
 * Get a new access token using the refresh token
 */
async function getAccessToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const tokenUrl = "https://oauth2.googleapis.com/token";
  
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new ApiError(
      `Failed to refresh access token: ${response.status}`,
      response.status,
      ApiErrorCode.UNAUTHORIZED,
      errorText
    );
  }

  let data: AccessTokenResponse;
  try {
    data = await response.json();
  } catch (error) {
    throw new ApiError(
      "Failed to parse access token response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  return data.access_token;
}

/**
 * Fetch task lists from Google Tasks API
 */
async function fetchTaskLists(accessToken: string): Promise<GoogleTaskList[]> {
  const response = await fetch(
    "https://tasks.googleapis.com/tasks/v1/users/@me/lists",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new ApiError(
      `Failed to fetch task lists: ${response.status}`,
      response.status,
      ApiErrorCode.UPSTREAM_ERROR,
      errorText
    );
  }

  let data: { items?: GoogleTaskList[] };
  try {
    data = await response.json();
  } catch (error) {
    throw new ApiError(
      "Failed to parse task lists response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  return data.items || [];
}

/**
 * Fetch tasks from a specific task list
 */
async function fetchTasks(
  accessToken: string,
  taskListId: string,
  showCompleted: boolean = false
): Promise<GoogleTask[]> {
  const response = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks?showCompleted=${showCompleted}&maxResults=100`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new ApiError(
      `Failed to fetch tasks: ${response.status}`,
      response.status,
      ApiErrorCode.UPSTREAM_ERROR,
      errorText
    );
  }

  let data: GoogleTasksResponse;
  try {
    data = await response.json();
  } catch (error) {
    throw new ApiError(
      "Failed to parse tasks response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  return data.items || [];
}

/**
 * Create a new task
 */
interface GoogleTaskCreateBody {
  title: string;
  notes?: string;
  due?: string;
}

async function createTask(
  accessToken: string,
  taskListId: string,
  title: string,
  notes?: string,
  due?: string
): Promise<GoogleTask> {
  const taskBody: GoogleTaskCreateBody = {
    title,
  };
  if (notes) taskBody.notes = notes;
  if (due) taskBody.due = due;

  const response = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskBody),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new ApiError(
      `Failed to create task: ${response.status}`,
      response.status,
      ApiErrorCode.UPSTREAM_ERROR,
      errorText
    );
  }

  let task: GoogleTask;
  try {
    task = await response.json();
  } catch (error) {
    throw new ApiError(
      "Failed to parse task creation response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  return task;
}

/**
 * Update a task (mark as completed/uncompleted, update title, etc.)
 */
async function updateTask(
  accessToken: string,
  taskListId: string,
  taskId: string,
  updates: {
    status?: "needsAction" | "completed";
    title?: string;
    notes?: string;
    due?: string | null;
  }
): Promise<GoogleTask> {
  const response = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new ApiError(
      `Failed to update task: ${response.status}`,
      response.status,
      ApiErrorCode.UPSTREAM_ERROR,
      errorText
    );
  }

  let task: GoogleTask;
  try {
    task = await response.json();
  } catch (error) {
    throw new ApiError(
      "Failed to parse task update response",
      502,
      ApiErrorCode.UPSTREAM_ERROR,
      error instanceof Error ? error.message : "Unknown parsing error"
    );
  }

  return task;
}

/**
 * Delete a task
 */
async function deleteTask(
  accessToken: string,
  taskListId: string,
  taskId: string
): Promise<void> {
  const response = await fetch(
    `https://tasks.googleapis.com/tasks/v1/lists/${taskListId}/tasks/${taskId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "Unknown error");
    throw new ApiError(
      `Failed to delete task: ${response.status}`,
      response.status,
      ApiErrorCode.UPSTREAM_ERROR,
      errorText
    );
  }
}

/**
 * Shared function to get access token and determine task list ID
 */
async function getAuthAndTaskList(
  tasksConfig: GoogleTasksConfig
): Promise<{ accessToken: string; taskListId: string }> {
  const { client_id, client_secret, refresh_token, tasklist_id } = tasksConfig;

  if (!client_id || !client_secret || !refresh_token) {
    throw new ApiError(
      "Missing required OAuth credentials. Please configure client_id, client_secret, and refresh_token.",
      400,
      ApiErrorCode.MISSING_CONFIG
    );
  }

  // Get access token
  const accessToken = await getAccessToken(
    client_id,
    client_secret,
    refresh_token
  );

  // Determine which task list to use
  let targetTaskListId = tasklist_id || "@default"; // Default to "My Tasks"

  // If no specific task list ID is provided, fetch the default one
  if (!tasklist_id) {
    const taskLists = await fetchTaskLists(accessToken);
    const defaultList = taskLists.find((list) => list.id === "@default");
    if (defaultList) {
      targetTaskListId = defaultList.id;
    }
  }

  return { accessToken, taskListId: targetTaskListId };
}

// Cache tasks for 1 minute (tasks can change frequently)
export const revalidate = 60;

export const GET = withErrorHandling(async (_request: NextRequest) => {
  const config = loadConfig();
  const tasksConfig = requireConfig(
    getFirstEnabledWidgetConfig(config.widgets.tasks) as GoogleTasksConfig | undefined,
    "Tasks widget is not enabled"
  );

  if (!tasksConfig.enabled) {
    throw new ApiError("Tasks widget is not enabled", 400, ApiErrorCode.BAD_REQUEST);
  }

  const { accessToken, taskListId } = await getAuthAndTaskList(tasksConfig);

  // Fetch tasks from the selected task list (including completed for full list)
  const tasks = await fetchTasks(accessToken, taskListId, true);

  // Transform tasks to a simpler format
  const transformedTasks = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    status: task.status,
    due: task.due || null,
    notes: task.notes || null,
    updated: task.updated,
    completed: task.status === "completed",
  }));

  const result = {
    tasks: transformedTasks,
    taskListId,
  };

  const response = NextResponse.json(result);
  // Cache for 1 minute (tasks can change frequently)
  response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=120");
  return response;
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const config = loadConfig();
  const tasksConfig = requireConfig(
    getFirstEnabledWidgetConfig(config.widgets.tasks) as GoogleTasksConfig | undefined,
    "Tasks widget is not enabled"
  );

  if (!tasksConfig.enabled) {
    throw new ApiError("Tasks widget is not enabled", 400, ApiErrorCode.BAD_REQUEST);
  }

  const body = await request.json();
  const { action, taskId, title, notes, due, status } = body;

  const { accessToken, taskListId: targetTaskListId } = await getAuthAndTaskList(tasksConfig);

  switch (action) {
    case "create":
      if (!title) {
        throw new ApiError("Title is required", 400, ApiErrorCode.VALIDATION_ERROR);
      }
      const newTask = await createTask(
        accessToken,
        targetTaskListId,
        title,
        notes,
        due
      );
      return NextResponse.json({
        success: true,
        task: {
          id: newTask.id,
          title: newTask.title,
          status: newTask.status,
          due: newTask.due || null,
          notes: newTask.notes || null,
          updated: newTask.updated,
          completed: newTask.status === "completed",
        },
      });

    case "update":
      if (!taskId) {
        throw new ApiError("Task ID is required", 400, ApiErrorCode.VALIDATION_ERROR);
      }
      const updates: {
        status?: "needsAction" | "completed";
        title?: string;
        notes?: string;
        due?: string | null;
      } = {};
      if (status !== undefined) updates.status = status;
      if (title !== undefined) updates.title = title;
      if (notes !== undefined) updates.notes = notes;
      if (due !== undefined) updates.due = due || null;

      const updatedTask = await updateTask(
        accessToken,
        targetTaskListId,
        taskId,
        updates
      );
      return NextResponse.json({
        success: true,
        task: {
          id: updatedTask.id,
          title: updatedTask.title,
          status: updatedTask.status,
          due: updatedTask.due || null,
          notes: updatedTask.notes || null,
          updated: updatedTask.updated,
          completed: updatedTask.status === "completed",
        },
      });

    case "delete":
      if (!taskId) {
        throw new ApiError("Task ID is required", 400, ApiErrorCode.VALIDATION_ERROR);
      }
      await deleteTask(accessToken, targetTaskListId, taskId);
      return NextResponse.json({ success: true });

    default:
      throw new ApiError(
        "Invalid action. Use 'create', 'update', or 'delete'",
        400,
        ApiErrorCode.BAD_REQUEST
      );
  }
});

