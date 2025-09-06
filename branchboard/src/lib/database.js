import Dexie from 'dexie';

export class BranchboardDB extends Dexie {
	constructor() {
		super('BranchboardDB');
		
		this.version(1).stores({
			events: '++id, title, start, end, location, notes, hasBranchMap, createdAt, updatedAt',
			scenarios: '++id, title, description, priority, hasBranchMap, createdAt, updatedAt',
			branchNodes: '++id, type, description, parentId, eventId, scenarioId, x, y, isCurrentBranch, createdAt, updatedAt',
			tasks: '++id, title, duration, deadline, timeWindow, priority, dependsOn, sourceNodeId, status, estimatedHours, actualHours, createdAt, updatedAt, completedAt',
			signals: '++id, metricName, threshold, direction, branchNodeId, currentValue, isTriggered, createdAt, updatedAt',
			assumptions: '++id, statement, confidence, linkedNodeId, linkedScenarioId, linkedEventId, reviewDate, isActive, createdAt, updatedAt',
			risks: '++id, description, likelihood, impact, mitigation, contingency, linkedNodeId, linkedScenarioId, linkedEventId, isActive, createdAt, updatedAt',
			edges: '++id, sourceNodeId, targetNodeId, label, createdAt, updatedAt',
			userSettings: '++id, key, value, updatedAt'
		});
		
		// Define the data structure
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

// Create the database instance
export const db = new BranchboardDB();

// Database utilities and helper functions
export const dbUtils = {
	// Event operations
	async createEvent(eventData) {
		const now = new Date().toISOString();
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
			updatedAt: new Date().toISOString()
		});
	},

	async getEvent(id) {
		return await db.events.get(id);
	},

	async getAllEvents() {
		return await db.events.orderBy('start').toArray();
	},

	async deleteEvent(id) {
		// Also delete related branch nodes and tasks
		const branchNodes = await db.branchNodes.where('eventId').equals(id).toArray();
		const branchNodeIds = branchNodes.map(node => node.id);
		
		// Delete in transaction
		return await db.transaction('rw', [db.events, db.branchNodes, db.tasks, db.edges, db.signals, db.assumptions, db.risks], async () => {
			await db.events.delete(id);
			await db.branchNodes.where('eventId').equals(id).delete();
			await db.tasks.where('sourceNodeId').anyOf(branchNodeIds).delete();
			await db.edges.where('sourceNodeId').anyOf(branchNodeIds).delete();
			await db.edges.where('targetNodeId').anyOf(branchNodeIds).delete();
			await db.signals.where('branchNodeId').anyOf(branchNodeIds).delete();
			await db.assumptions.where('linkedEventId').equals(id).delete();
			await db.risks.where('linkedEventId').equals(id).delete();
		});
	},

	// Scenario operations
	async createScenario(scenarioData) {
		const now = new Date().toISOString();
		return await db.scenarios.add({
			...scenarioData,
			priority: scenarioData.priority || 'medium',
			hasBranchMap: false,
			createdAt: now,
			updatedAt: now
		});
	},

	async updateScenario(id, updates) {
		return await db.scenarios.update(id, {
			...updates,
			updatedAt: new Date().toISOString()
		});
	},

	async getScenario(id) {
		return await db.scenarios.get(id);
	},

	async getAllScenarios() {
		return await db.scenarios.orderBy('priority').reverse().toArray();
	},

	async deleteScenario(id) {
		// Also delete related branch nodes and tasks
		const branchNodes = await db.branchNodes.where('scenarioId').equals(id).toArray();
		const branchNodeIds = branchNodes.map(node => node.id);
		
		// Delete in transaction
		return await db.transaction('rw', [db.scenarios, db.branchNodes, db.tasks, db.edges, db.signals, db.assumptions, db.risks], async () => {
			await db.scenarios.delete(id);
			await db.branchNodes.where('scenarioId').equals(id).delete();
			await db.tasks.where('sourceNodeId').anyOf(branchNodeIds).delete();
			await db.edges.where('sourceNodeId').anyOf(branchNodeIds).delete();
			await db.edges.where('targetNodeId').anyOf(branchNodeIds).delete();
			await db.signals.where('branchNodeId').anyOf(branchNodeIds).delete();
			await db.assumptions.where('linkedScenarioId').equals(id).delete();
			await db.risks.where('linkedScenarioId').equals(id).delete();
		});
	},

	// Branch Node operations
	async createBranchNode(nodeData) {
		const now = new Date().toISOString();
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
			updatedAt: new Date().toISOString()
		});
	},

	async getBranchNode(id) {
		return await db.branchNodes.get(id);
	},

	async getBranchNodesForEvent(eventId) {
		return await db.branchNodes.where('eventId').equals(eventId).toArray();
	},

	async getBranchNodesForScenario(scenarioId) {
		return await db.branchNodes.where('scenarioId').equals(scenarioId).toArray();
	},

	async setCurrentBranch(eventId, scenarioId, nodeId) {
		// First, unset all current branches for the event/scenario
		const condition = eventId ? { eventId } : { scenarioId };
		await db.branchNodes.where(condition).modify({ isCurrentBranch: false });
		
		// Set the new current branch
		if (nodeId) {
			await db.branchNodes.update(nodeId, { isCurrentBranch: true });
		}
	},

	async getCurrentBranches() {
		return await db.branchNodes.where('isCurrentBranch').equals(true).toArray();
	},

	async deleteBranchNode(id) {
		// Delete the node and related tasks and edges
		const tasks = await db.tasks.where('sourceNodeId').equals(id).toArray();
		
		// Delete in transaction
		return await db.transaction('rw', [db.branchNodes, db.tasks, db.edges, db.signals], async () => {
			await db.branchNodes.delete(id);
			await db.tasks.where('sourceNodeId').equals(id).delete();
			await db.edges.where('sourceNodeId').equals(id).delete();
			await db.edges.where('targetNodeId').equals(id).delete();
			await db.signals.where('branchNodeId').equals(id).delete();
		});
	},

	// Task operations
	async createTask(taskData) {
		const now = new Date().toISOString();
		return await db.tasks.add({
			...taskData,
			status: taskData.status || 'pending',
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
			updatedAt: new Date().toISOString()
		};
		
		if (updates.status === 'completed' && !updates.completedAt) {
			updateData.completedAt = new Date().toISOString();
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
		// Get current branch nodes
		const currentBranchNodes = await db.branchNodes.where('isCurrentBranch').equals(true).toArray();
		const currentBranchNodeIds = currentBranchNodes.map(node => node.id);
		
		// Get tasks from current branches
		return await db.tasks
			.where('sourceNodeId').anyOf(currentBranchNodeIds)
			.and(task => task.status !== 'completed' && task.status !== 'cancelled')
			.toArray();
	},

	async getTasksForNode(nodeId) {
		return await db.tasks.where('sourceNodeId').equals(nodeId).toArray();
	},

	async completeTask(id, actualHours) {
		return await db.tasks.update(id, {
			status: 'completed',
			actualHours: actualHours || 0,
			completedAt: new Date().toISOString(),
			updatedAt: new Date().toISOString()
		});
	},

	// Signal operations
	async createSignal(signalData) {
		const now = new Date().toISOString();
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
			updatedAt: new Date().toISOString()
		});
	},

	async updateSignalValue(id, currentValue) {
		const signal = await db.signals.get(id);
		if (!signal) return null;
		
		// Check if signal should trigger
		let isTriggered = false;
		if (signal.direction === '>=' && currentValue >= signal.threshold) {
			isTriggered = true;
		} else if (signal.direction === '<=' && currentValue <= signal.threshold) {
			isTriggered = true;
		} else if (signal.direction === '>' && currentValue > signal.threshold) {
			isTriggered = true;
		} else if (signal.direction === '<' && currentValue < signal.threshold) {
			isTriggered = true;
		} else if (signal.direction === '==' && currentValue == signal.threshold) {
			isTriggered = true;
		}
		
		return await db.signals.update(id, {
			currentValue,
			isTriggered,
			updatedAt: new Date().toISOString()
		});
	},

	async getTriggeredSignals() {
		return await db.signals.where('isTriggered').equals(true).toArray();
	},

	async getSignalById(id) {
		return await db.signals.get(id);
	},

	// Edge operations (for branch map connections)
	async createEdge(edgeData) {
		const now = new Date().toISOString();
		return await db.edges.add({
			...edgeData,
			createdAt: now,
			updatedAt: now
		});
	},

	async getEdgesForNodes(nodeIds) {
		return await db.edges
			.where('sourceNodeId').anyOf(nodeIds)
			.or('targetNodeId').anyOf(nodeIds)
			.toArray();
	},

	async deleteEdge(id) {
		return await db.edges.delete(id);
	},

	// User settings
	async getSetting(key) {
		const setting = await db.userSettings.where('key').equals(key).first();
		return setting?.value;
	},

	async setSetting(key, value) {
		const existing = await db.userSettings.where('key').equals(key).first();
		if (existing) {
			return await db.userSettings.update(existing.id, {
				value,
				updatedAt: new Date().toISOString()
			});
		} else {
			return await db.userSettings.add({
				key,
				value,
				updatedAt: new Date().toISOString()
			});
		}
	},

	// Utility functions
	async seedDemoData() {
		// Create demo event
		const eventId = await dbUtils.createEvent({
			title: 'Project Deadline Dec 1',
			start: '2024-12-01T09:00:00',
			end: '2024-12-01T18:00:00',
			description: 'Final deliverable due for the major project',
		});

		// Create demo scenario
		const scenarioId = await dbUtils.createScenario({
			title: 'Considering Relocating to City X',
			description: 'Exploring potential move for better opportunities',
			priority: 'medium'
		});

		// Mark both as having branch maps
		await dbUtils.updateEvent(eventId, { hasBranchMap: true });
		await dbUtils.updateScenario(scenarioId, { hasBranchMap: true });

		// Create branch nodes for the event
		const onTimeNodeId = await dbUtils.createBranchNode({
			type: 'outcome',
			description: 'Project delivered on time',
			eventId: eventId,
			x: 100,
			y: 100,
			isCurrentBranch: true
		});

		const delayedNodeId = await dbUtils.createBranchNode({
			type: 'outcome',
			description: 'Project delayed by 1-2 weeks',
			eventId: eventId,
			x: 100,
			y: 200
		});

		// Create some demo tasks
		await dbUtils.createTask({
			title: 'Prepare feature list versions',
			duration: '4h',
			deadline: '2024-11-15',
			priority: 'high',
			sourceNodeId: onTimeNodeId,
			estimatedHours: 4
		});

		await dbUtils.createTask({
			title: 'Review project timeline',
			duration: '2h',
			deadline: '2024-11-12',
			priority: 'high',
			sourceNodeId: onTimeNodeId,
			estimatedHours: 2
		});

		// Create a demo signal
		await dbUtils.createSignal({
			metricName: 'Client feedback received',
			threshold: 1,
			direction: '>=',
			branchNodeId: onTimeNodeId
		});

		console.log('Demo data seeded successfully');
	},

	async clearAllData() {
		await db.transaction('rw', db.tables, () => {
			db.tables.forEach(table => table.clear());
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
		await db.transaction('rw', db.tables, () => {
			Object.keys(data).forEach(tableName => {
				if (db[tableName]) {
					db[tableName].bulkPut(data[tableName]);
				}
			});
		});
	}
};

// Initialize database and seed demo data if empty
db.ready(async () => {
	const eventCount = await db.events.count();
	if (eventCount === 0) {
		await dbUtils.seedDemoData();
	}
});