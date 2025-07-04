import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { openaiService } from "./services/openaiService";
import { fileService } from "./services/fileService";
import multer from "multer";
import {
  insertTaskSchema,
  insertProjectSchema,
  insertTaskCommentSchema,
  insertNotificationSchema,
} from "@shared/schema";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
});

// Helper function to get user ID from request
function getUserId(req: Request): string {
  return (req.user as any).claims.sub;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // WebSocket connections storage
  const wsConnections = new Map<string, WebSocket>();

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Dashboard routes
  app.get('/api/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  app.get('/api/dashboard/user-stats', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Project routes
  app.get('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const projects = await storage.getProjects();
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.post('/api/projects', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      
      // Broadcast to all connected clients
      const message = JSON.stringify({
        type: 'project_created',
        data: project,
      });
      wsConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });

      res.status(201).json(project);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      res.json(project);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  app.put('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const project = await storage.getProjectById(id);
      
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const validatedData = insertProjectSchema.partial().parse(req.body);
      const updatedProject = await storage.updateProject(id, validatedData);

      res.json(updatedProject);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating project:", error);
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete('/api/projects/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      const user = await storage.getUser(userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const project = await storage.getProjectById(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      await storage.deleteProject(id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      console.error("Error deleting project:", error);
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Task routes
  app.get('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const { userId, projectId } = req.query;
      let tasks;

      if (userId) {
        tasks = await storage.getTasksByUserId(userId as string);
      } else if (projectId) {
        tasks = await storage.getTasksByProjectId(parseInt(projectId as string));
      } else {
        tasks = await storage.getTasks();
      }

      res.json(tasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.post('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      console.log("Creating task with data:", req.body);
      
      // Validate and clean data before schema validation
      const cleanData = {
        ...req.body,
        createdUserId: userId,
        // Ensure status is valid
        status: req.body.status || "aberta",
        // Ensure priority is valid  
        priority: req.body.priority || "media",
      };
      
      const validatedData = insertTaskSchema.parse(cleanData);
      
      const task = await storage.createTask(validatedData);
      
      // Create notification for assigned user if different from creator
      if (validatedData.assignedUserId && validatedData.assignedUserId !== userId) {
        await storage.createNotification({
          userId: validatedData.assignedUserId,
          title: "Nova tarefa atribuída",
          message: `Você foi atribuído à tarefa: ${task.title}`,
          type: "info",
          relatedTaskId: task.id,
        });
      }

      // Broadcast to all connected clients
      const message = JSON.stringify({
        type: 'task_created',
        data: task,
      });
      wsConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });

      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating task:", error);
      res.status(500).json({ message: "Failed to create task" });
    }
  });

  app.get('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getTaskById(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.put('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = getUserId(req);
      const originalTask = await storage.getTaskById(id);
      
      if (!originalTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      const validatedData = insertTaskSchema.partial().parse(req.body);
      const updatedTask = await storage.updateTask(id, validatedData);

      // Add history entry for changes
      const changes = Object.keys(validatedData)
        .map(key => `${key} alterado`)
        .join(', ');
      await storage.addTaskHistory(id, userId, changes);

      // Create notification if status changed to completed
      if (validatedData.status === 'concluida' && originalTask.status !== 'concluida') {
        if (originalTask.assignedUserId) {
          await storage.createNotification({
            userId: originalTask.assignedUserId,
            title: "Tarefa concluída",
            message: `Parabéns! Você concluiu a tarefa: ${originalTask.title}`,
            type: "success",
            relatedTaskId: id,
          });
        }
      }

      // Broadcast to all connected clients
      const message = JSON.stringify({
        type: 'task_updated',
        data: updatedTask,
      });
      wsConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });

      res.json(updatedTask);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Task comments
  app.post('/api/tasks/:id/comments', isAuthenticated, async (req, res) => {
    try {
      const taskId = parseInt(req.params.id);
      const userId = getUserId(req);
      
      const validatedData = insertTaskCommentSchema.parse({
        taskId,
        userId,
        content: req.body.content,
      });

      const comment = await storage.addTaskComment(validatedData);

      // Broadcast to all connected clients
      const message = JSON.stringify({
        type: 'comment_added',
        data: { taskId, comment },
      });
      wsConnections.forEach((ws) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });

      res.status(201).json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  });

  // AI Chat routes
  app.post('/api/chat/search', isAuthenticated, async (req, res) => {
    try {
      const { query } = req.body;
      
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ message: "Query is required" });
      }

      // Get all tasks for AI analysis
      const tasks = await storage.getTasks();
      
      // Use OpenAI to find relevant tasks
      const results = await openaiService.findTasksWithAI(query, tasks);
      
      res.json(results);
    } catch (error) {
      console.error("Error in AI search:", error);
      res.status(500).json({ message: "Failed to search tasks" });
    }
  });

  // File upload routes
  app.post('/api/files/upload', isAuthenticated, upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = getUserId(req);
      const { taskId, projectId } = req.body;

      const savedFile = await fileService.saveFile(req.file, {
        taskId: taskId ? parseInt(taskId) : undefined,
        projectId: projectId ? parseInt(projectId) : undefined,
        uploadedUserId: userId,
      });

      res.status(201).json(savedFile);
    } catch (error) {
      console.error("Error uploading file:", error);
      res.status(500).json({ message: "Failed to upload file" });
    }
  });

  app.get('/api/files', isAuthenticated, async (req, res) => {
    try {
      const { taskId, projectId } = req.query;
      let files;

      if (taskId) {
        files = await storage.getFilesByTaskId(parseInt(taskId as string));
      } else if (projectId) {
        files = await storage.getFilesByProjectId(parseInt(projectId as string));
      } else {
        files = await storage.getFiles();
      }

      res.json(files);
    } catch (error) {
      console.error("Error fetching files:", error);
      res.status(500).json({ message: "Failed to fetch files" });
    }
  });

  app.get('/api/files/:id/download', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const file = await storage.getFiles().then(files => files.find(f => f.id === id));
      
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }

      await fileService.downloadFile(file, res);
    } catch (error) {
      console.error("Error downloading file:", error);
      res.status(500).json({ message: "Failed to download file" });
    }
  });

  // User management routes (Admin only)
  app.get('/api/users', isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(getUserId(req));
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.put('/api/users/:id/role', isAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(getUserId(req));
      if (!currentUser || currentUser.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const userId = req.params.id;
      const { role } = req.body;

      if (!['admin', 'collaborator'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(userId, role);
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // Set initial user type (for new users after login)
  app.post('/api/auth/set-initial-type', isAuthenticated, async (req, res) => {
    try {
      const { userType } = req.body;
      const userId = getUserId(req);
      
      // For now, allow setting type regardless of existing role (for demo purposes)
      if (!['admin', 'collaborator'].includes(userType)) {
        return res.status(400).json({ message: "Invalid user type" });
      }

      const user = await storage.updateUserRole(userId, userType);
      res.json(user);
    } catch (error) {
      console.error("Error setting initial user type:", error);
      res.status(500).json({ message: "Failed to set user type" });
    }
  });

  // Notification routes
  app.get('/api/notifications', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Failed to fetch notifications" });
    }
  });

  app.put('/api/notifications/:id/read', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Failed to mark notification as read" });
    }
  });

  // Time tracking routes
  app.post('/api/time/start', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const { taskId, description } = req.body;

      // End any active time entries first
      const activeEntry = await storage.getActiveTimeEntry(userId);
      if (activeEntry) {
        const duration = Math.floor((Date.now() - new Date(activeEntry.startTime).getTime()) / (1000 * 60));
        await storage.endTimeEntry(activeEntry.id, new Date(), duration);
      }

      const timeEntry = await storage.startTimeEntry({
        taskId: parseInt(taskId),
        userId,
        startTime: new Date(),
        description,
      });

      res.status(201).json(timeEntry);
    } catch (error) {
      console.error("Error starting time entry:", error);
      res.status(500).json({ message: "Failed to start time tracking" });
    }
  });

  app.post('/api/time/stop', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const activeEntry = await storage.getActiveTimeEntry(userId);
      
      if (!activeEntry) {
        return res.status(404).json({ message: "No active time entry found" });
      }

      const endTime = new Date();
      const duration = Math.floor((endTime.getTime() - new Date(activeEntry.startTime).getTime()) / (1000 * 60));
      
      const updatedEntry = await storage.endTimeEntry(activeEntry.id, endTime, duration);
      res.json(updatedEntry);
    } catch (error) {
      console.error("Error stopping time entry:", error);
      res.status(500).json({ message: "Failed to stop time tracking" });
    }
  });

  app.get('/api/time/active', isAuthenticated, async (req, res) => {
    try {
      const userId = getUserId(req);
      const activeEntry = await storage.getActiveTimeEntry(userId);
      res.json(activeEntry || null);
    } catch (error) {
      console.error("Error fetching active time entry:", error);
      res.status(500).json({ message: "Failed to fetch active time entry" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);

  // Setup WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws, req) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const userId = url.searchParams.get('userId');
    
    if (userId) {
      wsConnections.set(userId, ws);
      
      ws.on('close', () => {
        wsConnections.delete(userId);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        wsConnections.delete(userId);
      });

      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Successfully connected to FAAE Projetos real-time updates',
      }));
    } else {
      ws.close(1008, 'User ID required');
    }
  });

  return httpServer;
}
