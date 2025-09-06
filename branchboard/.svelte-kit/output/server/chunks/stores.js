import { d as derived, w as writable } from "./index.js";
import Dexie from "dexie";
class BranchboardDB extends Dexie {
  constructor() {
    super("BranchboardDB");
    this.version(1).stores({
      events: "++id, title, start, end, location, notes, hasBranchMap, createdAt, updatedAt",
      scenarios: "++id, title, description, priority, hasBranchMap, createdAt, updatedAt",
      branchNodes: "++id, type, description, parentId, eventId, scenarioId, x, y, isCurrentBranch, createdAt, updatedAt",
      tasks: "++id, title, duration, deadline, timeWindow, priority, dependsOn, sourceNodeId, status, estimatedHours, actualHours, scheduledDate, scheduledStartTime, scheduledEndTime, createdAt, updatedAt, completedAt",
      signals: "++id, metricName, threshold, direction, branchNodeId, currentValue, isTriggered, createdAt, updatedAt",
      assumptions: "++id, statement, confidence, linkedNodeId, linkedScenarioId, linkedEventId, reviewDate, isActive, createdAt, updatedAt",
      risks: "++id, description, likelihood, impact, mitigation, contingency, linkedNodeId, linkedScenarioId, linkedEventId, isActive, createdAt, updatedAt",
      edges: "++id, sourceNodeId, targetNodeId, label, createdAt, updatedAt",
      userSettings: "++id, key, value, updatedAt"
    });
    this.events = this.events;
    this.scenarios = this.scenarios;
    this.branchNodes = this.branchNodes;
    this.tasks = this.tasks;
    this.signals = this.signals;
    this.assumptions = this.assumptions;
    this.risks = this.risks;
    this.edges = this.edges;
    this.userSettings = this.userSettings;
  }
}
const db = new BranchboardDB();
const dbUtils = {
  // Event operations
  async createEvent(eventData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return await db.events.add({
      ...eventData,
      hasBranchMap: false,
      createdAt: now,
      updatedAt: now
    });
  },
  async updateEvent(id, updates) {
    return await db.events.update(id, {
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  },
  async getEvent(id) {
    return await db.events.get(id);
  },
  async getAllEvents() {
    return await db.events.orderBy("start").toArray();
  },
  async deleteEvent(id) {
    const branchNodes = await db.branchNodes.where("eventId").equals(id).toArray();
    const branchNodeIds = branchNodes.map((node) => node.id);
    return await db.transaction("rw", [db.events, db.branchNodes, db.tasks, db.edges, db.signals, db.assumptions, db.risks], async () => {
      await db.events.delete(id);
      await db.branchNodes.where("eventId").equals(id).delete();
      await db.tasks.where("sourceNodeId").anyOf(branchNodeIds).delete();
      await db.edges.where("sourceNodeId").anyOf(branchNodeIds).delete();
      await db.edges.where("targetNodeId").anyOf(branchNodeIds).delete();
      await db.signals.where("branchNodeId").anyOf(branchNodeIds).delete();
      await db.assumptions.where("linkedEventId").equals(id).delete();
      await db.risks.where("linkedEventId").equals(id).delete();
    });
  },
  // Scenario operations
  async createScenario(scenarioData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return await db.scenarios.add({
      ...scenarioData,
      priority: scenarioData.priority || "medium",
      hasBranchMap: false,
      createdAt: now,
      updatedAt: now
    });
  },
  async updateScenario(id, updates) {
    return await db.scenarios.update(id, {
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  },
  async getScenario(id) {
    return await db.scenarios.get(id);
  },
  async getAllScenarios() {
    return await db.scenarios.orderBy("priority").reverse().toArray();
  },
  async deleteScenario(id) {
    const branchNodes = await db.branchNodes.where("scenarioId").equals(id).toArray();
    const branchNodeIds = branchNodes.map((node) => node.id);
    return await db.transaction("rw", [db.scenarios, db.branchNodes, db.tasks, db.edges, db.signals, db.assumptions, db.risks], async () => {
      await db.scenarios.delete(id);
      await db.branchNodes.where("scenarioId").equals(id).delete();
      await db.tasks.where("sourceNodeId").anyOf(branchNodeIds).delete();
      await db.edges.where("sourceNodeId").anyOf(branchNodeIds).delete();
      await db.edges.where("targetNodeId").anyOf(branchNodeIds).delete();
      await db.signals.where("branchNodeId").anyOf(branchNodeIds).delete();
      await db.assumptions.where("linkedScenarioId").equals(id).delete();
      await db.risks.where("linkedScenarioId").equals(id).delete();
    });
  },
  // Branch Node operations
  async createBranchNode(nodeData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return await db.branchNodes.add({
      ...nodeData,
      x: nodeData.x || 0,
      y: nodeData.y || 0,
      isCurrentBranch: nodeData.isCurrentBranch || false,
      createdAt: now,
      updatedAt: now
    });
  },
  async updateBranchNode(id, updates) {
    return await db.branchNodes.update(id, {
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  },
  async getBranchNode(id) {
    return await db.branchNodes.get(id);
  },
  async getBranchNodesForEvent(eventId) {
    return await db.branchNodes.where("eventId").equals(eventId).toArray();
  },
  async getBranchNodesForScenario(scenarioId) {
    return await db.branchNodes.where("scenarioId").equals(scenarioId).toArray();
  },
  async setCurrentBranch(eventId, scenarioId, nodeId) {
    const condition = eventId ? { eventId } : { scenarioId };
    await db.branchNodes.where(condition).modify({ isCurrentBranch: false });
    if (nodeId) {
      await db.branchNodes.update(nodeId, { isCurrentBranch: true });
    }
  },
  async getCurrentBranches() {
    return await db.branchNodes.where("isCurrentBranch").equals(true).toArray();
  },
  async deleteBranchNode(id) {
    await db.tasks.where("sourceNodeId").equals(id).toArray();
    return await db.transaction("rw", [db.branchNodes, db.tasks, db.edges, db.signals], async () => {
      await db.branchNodes.delete(id);
      await db.tasks.where("sourceNodeId").equals(id).delete();
      await db.edges.where("sourceNodeId").equals(id).delete();
      await db.edges.where("targetNodeId").equals(id).delete();
      await db.signals.where("branchNodeId").equals(id).delete();
    });
  },
  // Task operations
  async createTask(taskData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return await db.tasks.add({
      ...taskData,
      status: taskData.status || "pending",
      dependsOn: taskData.dependsOn || [],
      estimatedHours: taskData.estimatedHours || 0,
      actualHours: 0,
      createdAt: now,
      updatedAt: now
    });
  },
  async updateTask(id, updates) {
    const updateData = {
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    if (updates.status === "completed" && !updates.completedAt) {
      updateData.completedAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    return await db.tasks.update(id, updateData);
  },
  async getTask(id) {
    return await db.tasks.get(id);
  },
  async getAllTasks() {
    return await db.tasks.toArray();
  },
  async getActiveTasks() {
    const currentBranchNodes = await db.branchNodes.where("isCurrentBranch").equals(true).toArray();
    const currentBranchNodeIds = currentBranchNodes.map((node) => node.id);
    return await db.tasks.where("sourceNodeId").anyOf(currentBranchNodeIds).and((task) => task.status !== "completed" && task.status !== "cancelled").toArray();
  },
  async getTasksForNode(nodeId) {
    return await db.tasks.where("sourceNodeId").equals(nodeId).toArray();
  },
  async completeTask(id, actualHours) {
    return await db.tasks.update(id, {
      status: "completed",
      actualHours: actualHours || 0,
      completedAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  },
  // Signal operations
  async createSignal(signalData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return await db.signals.add({
      ...signalData,
      currentValue: null,
      isTriggered: false,
      createdAt: now,
      updatedAt: now
    });
  },
  async updateSignal(id, updates) {
    return await db.signals.update(id, {
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  },
  async updateSignalValue(id, currentValue) {
    const signal = await db.signals.get(id);
    if (!signal) return null;
    let isTriggered = false;
    if (signal.direction === ">=" && currentValue >= signal.threshold) {
      isTriggered = true;
    } else if (signal.direction === "<=" && currentValue <= signal.threshold) {
      isTriggered = true;
    } else if (signal.direction === ">" && currentValue > signal.threshold) {
      isTriggered = true;
    } else if (signal.direction === "<" && currentValue < signal.threshold) {
      isTriggered = true;
    } else if (signal.direction === "==" && currentValue == signal.threshold) {
      isTriggered = true;
    }
    return await db.signals.update(id, {
      currentValue,
      isTriggered,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  },
  async getTriggeredSignals() {
    return await db.signals.where("isTriggered").equals(true).toArray();
  },
  async getSignalById(id) {
    return await db.signals.get(id);
  },
  async getSignalsForNode(nodeId) {
    return await db.signals.where("branchNodeId").equals(nodeId).toArray();
  },
  // Assumption operations
  async createAssumption(assumptionData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return await db.assumptions.add({
      ...assumptionData,
      isActive: assumptionData.isActive !== false,
      createdAt: now,
      updatedAt: now
    });
  },
  async updateAssumption(id, updates) {
    return await db.assumptions.update(id, {
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  },
  async getAssumptionsForNode(nodeId) {
    return await db.assumptions.where("linkedNodeId").equals(nodeId).toArray();
  },
  async getAssumptionsForScenario(scenarioId) {
    return await db.assumptions.where("linkedScenarioId").equals(scenarioId).toArray();
  },
  async getAssumptionsForEvent(eventId) {
    return await db.assumptions.where("linkedEventId").equals(eventId).toArray();
  },
  // Risk operations
  async createRisk(riskData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return await db.risks.add({
      ...riskData,
      isActive: riskData.isActive !== false,
      createdAt: now,
      updatedAt: now
    });
  },
  async updateRisk(id, updates) {
    return await db.risks.update(id, {
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
  },
  async getRisksForNode(nodeId) {
    return await db.risks.where("linkedNodeId").equals(nodeId).toArray();
  },
  async getRisksForScenario(scenarioId) {
    return await db.risks.where("linkedScenarioId").equals(scenarioId).toArray();
  },
  async getRisksForEvent(eventId) {
    return await db.risks.where("linkedEventId").equals(eventId).toArray();
  },
  // Edge operations (for branch map connections)
  async createEdge(edgeData) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    return await db.edges.add({
      ...edgeData,
      createdAt: now,
      updatedAt: now
    });
  },
  async getEdgesForNodes(nodeIds) {
    return await db.edges.where("sourceNodeId").anyOf(nodeIds).or("targetNodeId").anyOf(nodeIds).toArray();
  },
  async deleteEdge(id) {
    return await db.edges.delete(id);
  },
  // User settings
  async getSetting(key) {
    const setting = await db.userSettings.where("key").equals(key).first();
    return setting?.value;
  },
  async setSetting(key, value) {
    const existing = await db.userSettings.where("key").equals(key).first();
    if (existing) {
      return await db.userSettings.update(existing.id, {
        value,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    } else {
      return await db.userSettings.add({
        key,
        value,
        updatedAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
  },
  // Utility functions
  async seedDemoData() {
    const eventId = await dbUtils.createEvent({
      title: "Project Deadline Dec 1",
      start: "2024-12-01T09:00:00",
      end: "2024-12-01T18:00:00",
      description: "Final deliverable due for the major project"
    });
    const scenarioId = await dbUtils.createScenario({
      title: "Considering Relocating to City X",
      description: "Exploring potential move for better opportunities",
      priority: "medium"
    });
    await dbUtils.updateEvent(eventId, { hasBranchMap: true });
    await dbUtils.updateScenario(scenarioId, { hasBranchMap: true });
    const onTimeNodeId = await dbUtils.createBranchNode({
      type: "outcome",
      description: "Project delivered on time",
      eventId,
      x: 100,
      y: 100,
      isCurrentBranch: true
    });
    await dbUtils.createBranchNode({
      type: "outcome",
      description: "Project delayed by 1-2 weeks",
      eventId,
      x: 100,
      y: 200
    });
    await dbUtils.createTask({
      title: "Prepare feature list versions",
      duration: "4h",
      deadline: "2024-11-15",
      priority: "high",
      sourceNodeId: onTimeNodeId,
      estimatedHours: 4
    });
    await dbUtils.createTask({
      title: "Review project timeline",
      duration: "2h",
      deadline: "2024-11-12",
      priority: "high",
      sourceNodeId: onTimeNodeId,
      estimatedHours: 2
    });
    await dbUtils.createSignal({
      metricName: "Client feedback received",
      threshold: 1,
      direction: ">=",
      branchNodeId: onTimeNodeId
    });
    console.log("Demo data seeded successfully");
  },
  async clearAllData() {
    await db.transaction("rw", db.tables, () => {
      db.tables.forEach((table) => table.clear());
    });
  },
  async exportData() {
    const data = {};
    for (const table of db.tables) {
      data[table.name] = await table.toArray();
    }
    return data;
  },
  async importData(data) {
    await db.transaction("rw", db.tables, () => {
      Object.keys(data).forEach((tableName) => {
        if (db[tableName]) {
          db[tableName].bulkPut(data[tableName]);
        }
      });
    });
  }
};
db.ready(async () => {
  const eventCount = await db.events.count();
  if (eventCount === 0) {
    await dbUtils.seedDemoData();
  }
});
class HeuristicScheduler {
  constructor(settings = {}) {
    this.workHoursPerDay = settings.workHoursPerDay || 8;
    this.workDaysPerWeek = settings.workDaysPerWeek || 5;
    this.startOfDay = settings.startOfDay || "09:00";
    this.endOfDay = settings.endOfDay || "18:00";
    this.excludeWeekends = settings.excludeWeekends !== false;
    this.breakDuration = settings.breakDuration || 1;
  }
  /**
   * Earliest Due Date (EDD) scheduling
   * Simple but effective for deadline-driven tasks
   */
  scheduleByEDD(tasks2) {
    const sortedTasks = [...tasks2].sort((a, b) => {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline) - new Date(b.deadline);
    });
    return this.assignTimeSlots(sortedTasks);
  }
  /**
   * Weighted Shortest Processing Time (WSPT)
   * Considers both priority and duration
   */
  scheduleByWSPT(tasks2) {
    const priorityWeights = { high: 3, medium: 2, low: 1 };
    const sortedTasks = [...tasks2].sort((a, b) => {
      const weightA = priorityWeights[a.priority] || 1;
      const weightB = priorityWeights[b.priority] || 1;
      const ratioA = weightA / (a.estimatedHours || 1);
      const ratioB = weightB / (b.estimatedHours || 1);
      return ratioB - ratioA;
    });
    return this.assignTimeSlots(sortedTasks);
  }
  /**
   * Critical Path Method (simplified)
   * Considers dependencies between tasks
   */
  scheduleByDependencies(tasks2) {
    const taskMap = new Map(tasks2.map((t) => [t.id, t]));
    const scheduled = /* @__PURE__ */ new Set();
    const result = [];
    const dependencies = /* @__PURE__ */ new Map();
    const dependents = /* @__PURE__ */ new Map();
    tasks2.forEach((task) => {
      dependencies.set(task.id, task.dependsOn || []);
      dependents.set(task.id, []);
    });
    tasks2.forEach((task) => {
      (task.dependsOn || []).forEach((depId) => {
        if (dependents.has(depId)) {
          dependents.get(depId).push(task.id);
        }
      });
    });
    const queue = tasks2.filter((task) => !task.dependsOn || task.dependsOn.length === 0);
    while (queue.length > 0) {
      queue.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const priorityDiff = (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
        if (priorityDiff !== 0) return priorityDiff;
        if (a.deadline && b.deadline) {
          return new Date(a.deadline) - new Date(b.deadline);
        }
        return a.deadline ? -1 : b.deadline ? 1 : 0;
      });
      const task = queue.shift();
      result.push(task);
      scheduled.add(task.id);
      dependents.get(task.id).forEach((dependentId) => {
        const dependent = taskMap.get(dependentId);
        if (dependent && !scheduled.has(dependentId)) {
          const allDepsSatisfied = (dependent.dependsOn || []).every((depId) => scheduled.has(depId));
          if (allDepsSatisfied && !queue.includes(dependent)) {
            queue.push(dependent);
          }
        }
      });
    }
    return this.assignTimeSlots(result);
  }
  /**
   * Assign time slots to ordered tasks
   */
  assignTimeSlots(tasks2) {
    const schedule = [];
    let currentDate = /* @__PURE__ */ new Date();
    currentDate.setHours(parseInt(this.startOfDay.split(":")[0]), parseInt(this.startOfDay.split(":")[1]), 0, 0);
    if (this.excludeWeekends) {
      while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    let availableHours = this.workHoursPerDay;
    tasks2.forEach((task) => {
      const taskHours = task.estimatedHours || 1;
      if (taskHours > availableHours) {
        do {
          currentDate.setDate(currentDate.getDate() + 1);
        } while (this.excludeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6));
        currentDate.setHours(parseInt(this.startOfDay.split(":")[0]), parseInt(this.startOfDay.split(":")[1]), 0, 0);
        availableHours = this.workHoursPerDay;
      }
      const startTime = new Date(currentDate);
      const endTime = new Date(currentDate.getTime() + taskHours * 60 * 60 * 1e3);
      schedule.push({
        taskId: task.id,
        task,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: taskHours,
        scheduledDate: startTime.toDateString()
      });
      currentDate.setTime(endTime.getTime());
      availableHours -= taskHours;
      if (availableHours > 0 && taskHours >= 2) {
        const breakTime = 0.25;
        currentDate.setTime(currentDate.getTime() + breakTime * 60 * 60 * 1e3);
        availableHours -= breakTime;
      }
    });
    return schedule;
  }
  /**
   * Main scheduling method that tries different heuristics
   */
  async optimizeSchedule(tasks2, method = "auto") {
    if (!tasks2 || tasks2.length === 0) {
      return [];
    }
    const activeTasks2 = tasks2.filter((task) => task.status !== "completed" && task.status !== "cancelled");
    if (activeTasks2.length === 0) {
      return [];
    }
    let schedule;
    switch (method) {
      case "edd":
        schedule = this.scheduleByEDD(activeTasks2);
        break;
      case "wspt":
        schedule = this.scheduleByWSPT(activeTasks2);
        break;
      case "dependencies":
        schedule = this.scheduleByDependencies(activeTasks2);
        break;
      case "auto":
      default:
        const hasDependencies = activeTasks2.some((t) => t.dependsOn && t.dependsOn.length > 0);
        const hasDeadlines = activeTasks2.some((t) => t.deadline);
        if (hasDependencies) {
          schedule = this.scheduleByDependencies(activeTasks2);
        } else if (hasDeadlines) {
          schedule = this.scheduleByEDD(activeTasks2);
        } else {
          schedule = this.scheduleByWSPT(activeTasks2);
        }
        break;
    }
    return this.validateAndAdjustSchedule(schedule);
  }
  /**
   * Validate schedule and flag potential issues
   */
  validateAndAdjustSchedule(schedule) {
    const validatedSchedule = [];
    schedule.forEach((item) => {
      const { task, startTime, endTime } = item;
      const issues = [];
      if (task.deadline && new Date(endTime) > new Date(task.deadline)) {
        issues.push("deadline_violation");
      }
      const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3);
      if (new Date(startTime) > thirtyDaysFromNow) {
        issues.push("scheduled_too_far");
      }
      validatedSchedule.push({
        ...item,
        issues,
        isValid: issues.length === 0
      });
    });
    return validatedSchedule;
  }
}
class OptimizedScheduler {
  constructor(settings = {}) {
    this.heuristicScheduler = new HeuristicScheduler(settings);
    this.settings = settings;
  }
  /**
   * Schedule tasks using the best available method
   */
  async scheduleAll(tasks2, options = {}) {
    const method = options.method || "auto";
    const useOptimizer = options.useOptimizer !== false && tasks2.length > 5;
    try {
      if (useOptimizer && window.Worker) {
        return await this.scheduleWithWorker(tasks2, method);
      } else {
        return await this.heuristicScheduler.optimizeSchedule(tasks2, method);
      }
    } catch (error) {
      console.error("Scheduling error:", error);
      return await this.heuristicScheduler.scheduleByWSPT(tasks2);
    }
  }
  /**
   * Use Web Worker for intensive optimization (would use jsLPSolver)
   */
  async scheduleWithWorker(tasks2, method) {
    return new Promise((resolve, reject) => {
      this.heuristicScheduler.optimizeSchedule(tasks2, method).then(resolve).catch(reject);
    });
  }
  /**
   * Quick reschedule for single task changes
   */
  async rescheduleTask(taskId, tasks2) {
    const affectedTasks = tasks2.filter(
      (task) => task.id === taskId || task.dependsOn && task.dependsOn.includes(taskId)
    );
    if (affectedTasks.length === 0) {
      return await this.scheduleAll(tasks2);
    }
    return await this.heuristicScheduler.scheduleByDependencies(affectedTasks);
  }
  /**
   * Get scheduling statistics and recommendations
   */
  getScheduleAnalysis(schedule, tasks2) {
    const analysis = {
      totalTasks: tasks2.length,
      scheduledTasks: schedule.length,
      totalEstimatedHours: schedule.reduce((sum, item) => sum + item.duration, 0),
      workingDays: new Set(schedule.map((item) => new Date(item.startTime).toDateString())).size,
      deadlineViolations: schedule.filter((item) => item.issues?.includes("deadline_violation")).length,
      recommendations: []
    };
    if (analysis.deadlineViolations > 0) {
      analysis.recommendations.push("Consider extending deadlines or reducing task scope for overdue items");
    }
    if (analysis.totalEstimatedHours > this.settings.workHoursPerDay * 7) {
      analysis.recommendations.push("Heavy workload detected - consider prioritizing or delegating tasks");
    }
    const avgTasksPerDay = analysis.totalTasks / Math.max(analysis.workingDays, 1);
    if (avgTasksPerDay > 5) {
      analysis.recommendations.push("Consider breaking down larger tasks for better manageability");
    }
    return analysis;
  }
}
const scheduler = new OptimizedScheduler();
const schedulerUtils = {
  /**
   * Update task schedules in database
   */
  async saveSchedule(schedule) {
    try {
      for (const item of schedule) {
        await dbUtils.updateTask(item.taskId, {
          scheduledDate: item.scheduledDate,
          scheduledStartTime: item.startTime,
          scheduledEndTime: item.endTime
        });
      }
      return true;
    } catch (error) {
      console.error("Error saving schedule:", error);
      return false;
    }
  },
  /**
   * Get tasks that need rescheduling
   */
  async getTasksNeedingReschedule() {
    const tasks2 = await dbUtils.getAllTasks();
    const now = /* @__PURE__ */ new Date();
    return tasks2.filter((task) => {
      if (!task.scheduledDate && task.status === "pending") {
        return true;
      }
      if (task.scheduledDate && new Date(task.scheduledDate) < now && task.status !== "completed") {
        return true;
      }
      return false;
    });
  },
  /**
   * Get daily task schedule
   */
  getDailySchedule(schedule, date) {
    const targetDate = new Date(date).toDateString();
    return schedule.filter(
      (item) => new Date(item.startTime).toDateString() === targetDate
    ).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
  },
  /**
   * Calculate workload distribution
   */
  getWorkloadDistribution(schedule) {
    const distribution = {};
    schedule.forEach((item) => {
      const date = new Date(item.startTime).toDateString();
      if (!distribution[date]) {
        distribution[date] = { hours: 0, tasks: 0, items: [] };
      }
      distribution[date].hours += item.duration;
      distribution[date].tasks += 1;
      distribution[date].items.push(item);
    });
    return distribution;
  }
};
const events = writable([]);
const scenarios = writable([]);
const tasks = writable([]);
const signals = writable([]);
const currentView = writable("today");
const selectedEvent = writable(null);
const selectedScenario = writable(null);
const isLoading = writable(false);
const notification = writable(null);
const branchSwitchNotifications = writable([]);
const userSettings = writable({
  workHoursPerDay: 8,
  workDaysPerWeek: 5,
  focusSessionLength: 25,
  // minutes
  breakLength: 5,
  // minutes
  startOfDay: "09:00",
  endOfDay: "18:00",
  excludeWeekends: true,
  notifications: true
});
const currentSchedule = writable([]);
const scheduleAnalysis = writable(null);
const isOptimizing = writable(false);
const currentBranches = writable([]);
derived(
  [tasks, currentBranches],
  ([$tasks, $currentBranches]) => {
    const today = (/* @__PURE__ */ new Date()).toDateString();
    const currentBranchNodeIds = $currentBranches.map((b) => b.id);
    return $tasks.filter(
      (task) => task.status === "pending" && task.scheduledDate && new Date(task.scheduledDate).toDateString() === today && (!task.sourceNodeId || currentBranchNodeIds.includes(task.sourceNodeId))
    );
  }
);
const activeTasks = derived(
  [tasks, currentBranches],
  ([$tasks, $currentBranches]) => {
    const currentBranchNodeIds = $currentBranches.map((b) => b.id);
    return $tasks.filter(
      (task) => (task.status === "pending" || task.status === "in_progress") && (!task.sourceNodeId || currentBranchNodeIds.includes(task.sourceNodeId))
    );
  }
);
const completedTasks = derived(
  [tasks],
  ([$tasks]) => $tasks.filter((task) => task.status === "completed")
);
const overdueTasks = derived(
  [tasks, currentBranches],
  ([$tasks, $currentBranches]) => {
    const now = /* @__PURE__ */ new Date();
    const currentBranchNodeIds = $currentBranches.map((b) => b.id);
    return $tasks.filter(
      (task) => task.status !== "completed" && task.deadline && new Date(task.deadline) < now && (!task.sourceNodeId || currentBranchNodeIds.includes(task.sourceNodeId))
    );
  }
);
const upcomingEvents = derived(
  [events],
  ([$events]) => {
    const now = /* @__PURE__ */ new Date();
    return $events.filter((event) => new Date(event.start) >= now).sort((a, b) => new Date(a.start) - new Date(b.start));
  }
);
derived(
  [signals],
  ([$signals]) => $signals.filter((signal) => signal.isTriggered)
);
const storeActions = {
  // Loading state
  setLoading(loading) {
    isLoading.set(loading);
  },
  // Notification system
  showNotification(message, type = "info", duration = 3e3) {
    notification.set({ message, type, id: Date.now() });
    setTimeout(() => {
      notification.set(null);
    }, duration);
  },
  // Branch switching notifications
  showBranchSwitchNotification(signalData, recommendedBranchId, eventId, scenarioId) {
    const id = Date.now();
    branchSwitchNotifications.update((notifications) => [
      ...notifications,
      {
        id,
        signalData,
        recommendedBranchId,
        eventId,
        scenarioId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString()
      }
    ]);
    setTimeout(() => {
      storeActions.dismissBranchNotification(id);
    }, 3e4);
  },
  dismissBranchNotification(id) {
    branchSwitchNotifications.update(
      (notifications) => notifications.filter((n) => n.id !== id)
    );
  },
  // Branch switching logic
  async switchBranch(eventId, scenarioId, newBranchNodeId) {
    try {
      storeActions.setLoading(true);
      await dbUtils.setCurrentBranch(eventId, scenarioId, newBranchNodeId);
      await storeActions.loadCurrentBranches();
      await storeActions.loadTasks();
      await storeActions.optimizeSchedule({
        method: "auto",
        skipNotification: true
      });
      const branchNode = await dbUtils.getBranchNode(newBranchNodeId);
      storeActions.showNotification(
        `Switched to branch: "${branchNode.description}" - Tasks updated automatically`,
        "success",
        5e3
      );
    } catch (error) {
      console.error("Error switching branch:", error);
      storeActions.showNotification("Error switching branch", "error");
    } finally {
      storeActions.setLoading(false);
    }
  },
  // Load current branches
  async loadCurrentBranches() {
    try {
      const branches = await dbUtils.getCurrentBranches();
      currentBranches.set(branches);
    } catch (error) {
      console.error("Error loading current branches:", error);
      currentBranches.set([]);
    }
  },
  // Events
  async loadEvents() {
    try {
      const eventList = await dbUtils.getAllEvents();
      events.set(eventList);
    } catch (error) {
      console.error("Error loading events:", error);
      storeActions.showNotification("Error loading events", "error");
    }
  },
  async createEvent(eventData) {
    try {
      const id = await dbUtils.createEvent(eventData);
      await storeActions.loadEvents();
      storeActions.showNotification("Event created successfully", "success");
      return id;
    } catch (error) {
      console.error("Error creating event:", error);
      storeActions.showNotification("Error creating event", "error");
    }
  },
  async updateEvent(id, updates) {
    try {
      await dbUtils.updateEvent(id, updates);
      await storeActions.loadEvents();
      storeActions.showNotification("Event updated successfully", "success");
    } catch (error) {
      console.error("Error updating event:", error);
      storeActions.showNotification("Error updating event", "error");
    }
  },
  async deleteEvent(id) {
    try {
      await dbUtils.deleteEvent(id);
      await storeActions.loadEvents();
      storeActions.showNotification("Event deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting event:", error);
      storeActions.showNotification("Error deleting event", "error");
    }
  },
  // Scenarios
  async loadScenarios() {
    try {
      const scenarioList = await dbUtils.getAllScenarios();
      scenarios.set(scenarioList);
    } catch (error) {
      console.error("Error loading scenarios:", error);
      storeActions.showNotification("Error loading scenarios", "error");
    }
  },
  async createScenario(scenarioData) {
    try {
      const id = await dbUtils.createScenario(scenarioData);
      await storeActions.loadScenarios();
      storeActions.showNotification("Scenario created successfully", "success");
      return id;
    } catch (error) {
      console.error("Error creating scenario:", error);
      storeActions.showNotification("Error creating scenario", "error");
    }
  },
  async updateScenario(id, updates) {
    try {
      await dbUtils.updateScenario(id, updates);
      await storeActions.loadScenarios();
      storeActions.showNotification("Scenario updated successfully", "success");
    } catch (error) {
      console.error("Error updating scenario:", error);
      storeActions.showNotification("Error updating scenario", "error");
    }
  },
  async deleteScenario(id) {
    try {
      await dbUtils.deleteScenario(id);
      await storeActions.loadScenarios();
      storeActions.showNotification("Scenario deleted successfully", "success");
    } catch (error) {
      console.error("Error deleting scenario:", error);
      storeActions.showNotification("Error deleting scenario", "error");
    }
  },
  // Tasks
  async loadTasks() {
    try {
      const taskList = await dbUtils.getAllTasks();
      tasks.set(taskList);
    } catch (error) {
      console.error("Error loading tasks:", error);
      storeActions.showNotification("Error loading tasks", "error");
    }
  },
  async createTask(taskData) {
    try {
      const id = await dbUtils.createTask(taskData);
      await storeActions.loadTasks();
      storeActions.showNotification("Task created successfully", "success");
      return id;
    } catch (error) {
      console.error("Error creating task:", error);
      storeActions.showNotification("Error creating task", "error");
    }
  },
  async updateTask(id, updates) {
    try {
      await dbUtils.updateTask(id, updates);
      await storeActions.loadTasks();
      if (updates.status === "completed") {
        storeActions.showNotification("Task completed! 🎉", "success");
      } else {
        storeActions.showNotification("Task updated successfully", "success");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      storeActions.showNotification("Error updating task", "error");
    }
  },
  async completeTask(id, actualHours) {
    try {
      await dbUtils.completeTask(id, actualHours);
      await storeActions.loadTasks();
      storeActions.showNotification("Task completed! 🎉", "success");
    } catch (error) {
      console.error("Error completing task:", error);
      storeActions.showNotification("Error completing task", "error");
    }
  },
  // Signals
  async loadSignals() {
    try {
      const signalList = await dbUtils.getTriggeredSignals();
      signals.set(signalList);
    } catch (error) {
      console.error("Error loading signals:", error);
    }
  },
  async updateSignalValue(id, value) {
    try {
      const result = await dbUtils.updateSignalValue(id, value);
      await storeActions.loadSignals();
      const signal = await dbUtils.getSignalById(id);
      if (signal && signal.isTriggered) {
        await storeActions.handleSignalTriggered(signal);
      }
    } catch (error) {
      console.error("Error updating signal:", error);
    }
  },
  // Handle triggered signals and recommend branch switches
  async handleSignalTriggered(signal) {
    try {
      const branchNode = await dbUtils.getBranchNode(signal.branchNodeId);
      if (!branchNode) return;
      storeActions.showNotification(
        `Signal triggered: ${signal.metricName} (${signal.currentValue} ${signal.direction} ${signal.threshold})`,
        "warning",
        8e3
      );
      const currentBranches2 = await dbUtils.getCurrentBranches();
      const isCurrentlyActive = currentBranches2.some(
        (cb) => cb.eventId === branchNode.eventId || cb.scenarioId === branchNode.scenarioId
      );
      if (!branchNode.isCurrentBranch) {
        storeActions.showBranchSwitchNotification(
          {
            signalName: signal.metricName,
            value: signal.currentValue,
            threshold: signal.threshold,
            direction: signal.direction,
            branchDescription: branchNode.description
          },
          branchNode.id,
          branchNode.eventId,
          branchNode.scenarioId
        );
      }
    } catch (error) {
      console.error("Error handling triggered signal:", error);
    }
  },
  // Settings
  async loadSettings() {
    try {
      const settings = {};
      settings.workHoursPerDay = await dbUtils.getSetting("workHoursPerDay") || 8;
      settings.workDaysPerWeek = await dbUtils.getSetting("workDaysPerWeek") || 5;
      settings.focusSessionLength = await dbUtils.getSetting("focusSessionLength") || 25;
      settings.breakLength = await dbUtils.getSetting("breakLength") || 5;
      settings.startOfDay = await dbUtils.getSetting("startOfDay") || "09:00";
      settings.endOfDay = await dbUtils.getSetting("endOfDay") || "18:00";
      settings.excludeWeekends = await dbUtils.getSetting("excludeWeekends") !== false;
      settings.notifications = await dbUtils.getSetting("notifications") !== false;
      userSettings.set(settings);
    } catch (error) {
      console.error("Error loading settings:", error);
    }
  },
  async updateSettings(newSettings) {
    try {
      for (const [key, value] of Object.entries(newSettings)) {
        await dbUtils.setSetting(key, value);
      }
      await storeActions.loadSettings();
      storeActions.showNotification("Settings updated successfully", "success");
    } catch (error) {
      console.error("Error updating settings:", error);
      storeActions.showNotification("Error updating settings", "error");
    }
  },
  // Navigation
  setCurrentView(view) {
    currentView.set(view);
  },
  selectEvent(event) {
    selectedEvent.set(event);
  },
  selectScenario(scenario) {
    selectedScenario.set(scenario);
  },
  // Data management
  async initializeData() {
    storeActions.setLoading(true);
    try {
      await Promise.all([
        storeActions.loadEvents(),
        storeActions.loadScenarios(),
        storeActions.loadTasks(),
        storeActions.loadSignals(),
        storeActions.loadCurrentBranches(),
        storeActions.loadSettings()
      ]);
    } finally {
      storeActions.setLoading(false);
    }
  },
  async refreshData() {
    await storeActions.initializeData();
  },
  // Quick capture
  async quickCapture(text, type = "task") {
    if (!text.trim()) return;
    try {
      if (type === "task") {
        await storeActions.createTask({
          title: text,
          priority: "medium",
          status: "pending"
        });
      } else if (type === "event") {
        await storeActions.createEvent({
          title: text,
          start: (/* @__PURE__ */ new Date()).toISOString(),
          end: new Date(Date.now() + 36e5).toISOString()
          // +1 hour
        });
      } else if (type === "scenario") {
        await storeActions.createScenario({
          title: text,
          priority: "medium"
        });
      }
      storeActions.showNotification("Item captured successfully", "success");
    } catch (error) {
      console.error("Error in quick capture:", error);
      storeActions.showNotification("Error capturing item", "error");
    }
  },
  // Scheduling actions
  async optimizeSchedule(options = {}) {
    isOptimizing.set(true);
    try {
      const taskList = await dbUtils.getAllTasks();
      const settings = await storeActions.getCurrentSettings();
      scheduler.heuristicScheduler.workHoursPerDay = settings.workHoursPerDay;
      scheduler.heuristicScheduler.workDaysPerWeek = settings.workDaysPerWeek;
      scheduler.heuristicScheduler.startOfDay = settings.startOfDay;
      scheduler.heuristicScheduler.endOfDay = settings.endOfDay;
      scheduler.heuristicScheduler.excludeWeekends = settings.excludeWeekends;
      const currentBranchNodes = await dbUtils.getCurrentBranches();
      const currentBranchNodeIds = currentBranchNodes.map((node) => node.id);
      const activeTasks2 = taskList.filter(
        (task) => (task.status === "pending" || task.status === "in_progress") && (!task.sourceNodeId || currentBranchNodeIds.includes(task.sourceNodeId))
      );
      const schedule = await scheduler.scheduleAll(activeTasks2, options);
      currentSchedule.set(schedule);
      const analysis = scheduler.getScheduleAnalysis(schedule, activeTasks2);
      scheduleAnalysis.set(analysis);
      await schedulerUtils.saveSchedule(schedule);
      if (!options.skipNotification) {
        storeActions.showNotification(
          `Schedule optimized! ${schedule.length} tasks scheduled across ${analysis.workingDays} days`,
          "success"
        );
      }
      return schedule;
    } catch (error) {
      console.error("Error optimizing schedule:", error);
      storeActions.showNotification("Error optimizing schedule", "error");
      return [];
    } finally {
      isOptimizing.set(false);
    }
  },
  async getCurrentSettings() {
    return new Promise((resolve) => {
      userSettings.subscribe((settings) => {
        resolve(settings);
      })();
    });
  },
  async loadSchedule() {
    try {
      const taskList = await dbUtils.getAllTasks();
      const scheduledTasks = taskList.filter((task) => task.scheduledDate);
      const schedule = scheduledTasks.map((task) => ({
        taskId: task.id,
        task,
        startTime: task.scheduledStartTime || task.scheduledDate,
        endTime: task.scheduledEndTime || task.scheduledDate,
        duration: task.estimatedHours || 1,
        scheduledDate: new Date(task.scheduledDate).toDateString(),
        isValid: true,
        issues: []
      }));
      currentSchedule.set(schedule);
      if (schedule.length > 0) {
        const analysis = scheduler.getScheduleAnalysis(schedule, taskList);
        scheduleAnalysis.set(analysis);
      }
      return schedule;
    } catch (error) {
      console.error("Error loading schedule:", error);
      return [];
    }
  },
  async rescheduleTask(taskId) {
    try {
      const taskList = await dbUtils.getAllTasks();
      const newSchedule = await scheduler.rescheduleTask(taskId, taskList);
      currentSchedule.set(newSchedule);
      return newSchedule;
    } catch (error) {
      console.error("Error rescheduling task:", error);
      storeActions.showNotification("Error rescheduling task", "error");
      return [];
    }
  },
  getDailySchedule(date) {
    return new Promise((resolve) => {
      currentSchedule.subscribe((schedule) => {
        const dailySchedule = schedulerUtils.getDailySchedule(schedule, date);
        resolve(dailySchedule);
      })();
    });
  }
};
const focusTimer = (() => {
  const { subscribe, set, update } = writable({
    isRunning: false,
    timeRemaining: 25 * 60,
    // 25 minutes in seconds
    currentTask: null,
    session: 1,
    totalSessions: 0
  });
  let interval = null;
  return {
    subscribe,
    start(taskId = null) {
      update((state) => {
        if (!state.isRunning) {
          interval = setInterval(() => {
            update((current) => {
              if (current.timeRemaining <= 0) {
                storeActions.showNotification("Focus session completed! 🎉", "success");
                return {
                  ...current,
                  isRunning: false,
                  timeRemaining: 25 * 60,
                  session: current.session + 1,
                  totalSessions: current.totalSessions + 1,
                  currentTask: null
                };
              }
              return {
                ...current,
                timeRemaining: current.timeRemaining - 1
              };
            });
          }, 1e3);
          return {
            ...state,
            isRunning: true,
            currentTask: taskId
          };
        }
        return state;
      });
    },
    pause() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      update((state) => ({ ...state, isRunning: false }));
    },
    reset() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      set({
        isRunning: false,
        timeRemaining: 25 * 60,
        currentTask: null,
        session: 1,
        totalSessions: 0
      });
    },
    stop() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      update((state) => ({
        ...state,
        isRunning: false,
        timeRemaining: 25 * 60,
        currentTask: null
      }));
    }
  };
})();
export {
  activeTasks as a,
  branchSwitchNotifications as b,
  currentBranches as c,
  dbUtils as d,
  completedTasks as e,
  focusTimer as f,
  scenarios as g,
  scheduleAnalysis as h,
  isOptimizing as i,
  events as j,
  overdueTasks as o,
  storeActions as s,
  tasks as t,
  upcomingEvents as u
};
