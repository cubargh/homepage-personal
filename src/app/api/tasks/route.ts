import { NextRequest, NextResponse } from "next/server";
import { loadConfig } from "@/lib/config";
import { getFirstEnabledWidgetConfig } from "@/lib/widget-config-utils";

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
    const errorText = await response.text();
    throw new Error(
      `Failed to refresh access token: ${response.status} ${errorText}`
    );
  }

  const data: AccessTokenResponse = await response.json();
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
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch task lists: ${response.status} ${errorText}`
    );
  }

  const data = await response.json();
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
    const errorText = await response.text();
    throw new Error(
      `Failed to fetch tasks: ${response.status} ${errorText}`
    );
  }

  const data: GoogleTasksResponse = await response.json();
  return data.items || [];
}

/**
 * Create a new task
 */
async function createTask(
  accessToken: string,
  taskListId: string,
  title: string,
  notes?: string,
  due?: string
): Promise<GoogleTask> {
  const taskBody: any = {
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
    const errorText = await response.text();
    throw new Error(
      `Failed to create task: ${response.status} ${errorText}`
    );
  }

  return await response.json();
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
    due?: string;
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
    const errorText = await response.text();
    throw new Error(
      `Failed to update task: ${response.status} ${errorText}`
    );
  }

  return await response.json();
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
    const errorText = await response.text();
    throw new Error(
      `Failed to delete task: ${response.status} ${errorText}`
    );
  }
}

export async function GET(request: NextRequest) {
  const config = loadConfig();
  const tasksConfig = getFirstEnabledWidgetConfig(
    config.widgets.tasks
  ) as GoogleTasksConfig | undefined;

  if (!tasksConfig || !tasksConfig.enabled) {
    return NextResponse.json(
      { error: "Tasks widget is not enabled" },
      { status: 400 }
    );
  }

  const { client_id, client_secret, refresh_token, tasklist_id } = tasksConfig;

  if (!client_id || !client_secret || !refresh_token) {
    return NextResponse.json(
      {
        error:
          "Missing required OAuth credentials. Please configure client_id, client_secret, and refresh_token.",
      },
      { status: 400 }
    );
  }

  try {
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

    // Fetch tasks from the selected task list (including completed for full list)
    const tasks = await fetchTasks(accessToken, targetTaskListId, true);

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

    return NextResponse.json({
      tasks: transformedTasks,
      taskListId: targetTaskListId,
    });
  } catch (error) {
    console.error("Google Tasks API error:", error);
    return NextResponse.json(
      {
        error: `Failed to fetch tasks: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const config = loadConfig();
  const tasksConfig = getFirstEnabledWidgetConfig(
    config.widgets.tasks
  ) as GoogleTasksConfig | undefined;

  if (!tasksConfig || !tasksConfig.enabled) {
    return NextResponse.json(
      { error: "Tasks widget is not enabled" },
      { status: 400 }
    );
  }

  const { client_id, client_secret, refresh_token, tasklist_id } = tasksConfig;

  if (!client_id || !client_secret || !refresh_token) {
    return NextResponse.json(
      {
        error:
          "Missing required OAuth credentials. Please configure client_id, client_secret, and refresh_token.",
      },
      { status: 400 }
    );
  }

  try {
    const body = await request.json();
    const { action, taskId, title, notes, due, status } = body;

    // Get access token
    const accessToken = await getAccessToken(
      client_id,
      client_secret,
      refresh_token
    );

    // Determine which task list to use
    let targetTaskListId = tasklist_id || "@default";
    if (!tasklist_id) {
      const taskLists = await fetchTaskLists(accessToken);
      const defaultList = taskLists.find((list) => list.id === "@default");
      if (defaultList) {
        targetTaskListId = defaultList.id;
      }
    }

    switch (action) {
      case "create":
        if (!title) {
          return NextResponse.json(
            { error: "Title is required" },
            { status: 400 }
          );
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
          return NextResponse.json(
            { error: "Task ID is required" },
            { status: 400 }
          );
        }
        const updates: any = {};
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
          return NextResponse.json(
            { error: "Task ID is required" },
            { status: 400 }
          );
        }
        await deleteTask(accessToken, targetTaskListId, taskId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'create', 'update', or 'delete'" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Google Tasks API error:", error);
    return NextResponse.json(
      {
        error: `Failed to perform action: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      },
      { status: 500 }
    );
  }
}

