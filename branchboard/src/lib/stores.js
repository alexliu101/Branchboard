import { writable, derived } from 'svelte/store';
import { dbUtils } from './database.js';
import { scheduler, schedulerUtils } from './scheduler.js';

// Core data stores
export const events = writable([]);
export const scenarios = writable([]);
export const tasks = writable([]);
export const signals = writable([]);
export const assumptions = writable([]);
export const risks = writable([]);

// UI state stores
export const currentView = writable('today');
export const selectedEvent = writable(null);
export const selectedScenario = writable(null);
export const isLoading = writable(false);
export const notification = writable(null);

// Settings store
export const userSettings = writable({
	workHoursPerDay: 8,
	workDaysPerWeek: 5,
	focusSessionLength: 25, // minutes
	breakLength: 5, // minutes
	startOfDay: '09:00',
	endOfDay: '18:00',
	excludeWeekends: true,
	notifications: true
});

// Scheduling stores
export const currentSchedule = writable([]);
export const scheduleAnalysis = writable(null);
export const isOptimizing = writable(false);

// Computed stores
export const todayTasks = derived(
	[tasks],
	([$tasks]) => {
		const today = new Date().toDateString();
		return $tasks.filter(task => 
			task.status === 'pending' && 
			task.scheduledDate && 
			new Date(task.scheduledDate).toDateString() === today
		);
	}
);

export const activeTasks = derived(
	[tasks],
	([$tasks]) => $tasks.filter(task => 
		task.status === 'pending' || task.status === 'in_progress'
	)
);

export const completedTasks = derived(
	[tasks],
	([$tasks]) => $tasks.filter(task => task.status === 'completed')
);

export const overdueTasks = derived(
	[tasks],
	([$tasks]) => {
		const now = new Date();
		return $tasks.filter(task => 
			task.status !== 'completed' && 
			task.deadline && 
			new Date(task.deadline) < now
		);
	}
);

export const upcomingEvents = derived(
	[events],
	([$events]) => {
		const now = new Date();
		return $events
			.filter(event => new Date(event.start) >= now)
			.sort((a, b) => new Date(a.start) - new Date(b.start));
	}
);

export const triggeredSignals = derived(
	[signals],
	([$signals]) => $signals.filter(signal => signal.isTriggered)
);

// Store action creators
export const storeActions = {
	// Loading state
	setLoading(loading) {
		isLoading.set(loading);
	},

	// Notification system
	showNotification(message, type = 'info', duration = 3000) {
		notification.set({ message, type, id: Date.now() });
		setTimeout(() => {
			notification.set(null);
		}, duration);
	},

	// Events
	async loadEvents() {
		try {
			const eventList = await dbUtils.getAllEvents();
			events.set(eventList);
		} catch (error) {
			console.error('Error loading events:', error);
			storeActions.showNotification('Error loading events', 'error');
		}
	},

	async createEvent(eventData) {
		try {
			const id = await dbUtils.createEvent(eventData);
			await storeActions.loadEvents();
			storeActions.showNotification('Event created successfully', 'success');
			return id;
		} catch (error) {
			console.error('Error creating event:', error);
			storeActions.showNotification('Error creating event', 'error');
		}
	},

	async updateEvent(id, updates) {
		try {
			await dbUtils.updateEvent(id, updates);
			await storeActions.loadEvents();
			storeActions.showNotification('Event updated successfully', 'success');
		} catch (error) {
			console.error('Error updating event:', error);
			storeActions.showNotification('Error updating event', 'error');
		}
	},

	async deleteEvent(id) {
		try {
			await dbUtils.deleteEvent(id);
			await storeActions.loadEvents();
			storeActions.showNotification('Event deleted successfully', 'success');
		} catch (error) {
			console.error('Error deleting event:', error);
			storeActions.showNotification('Error deleting event', 'error');
		}
	},

	// Scenarios
	async loadScenarios() {
		try {
			const scenarioList = await dbUtils.getAllScenarios();
			scenarios.set(scenarioList);
		} catch (error) {
			console.error('Error loading scenarios:', error);
			storeActions.showNotification('Error loading scenarios', 'error');
		}
	},

	async createScenario(scenarioData) {
		try {
			const id = await dbUtils.createScenario(scenarioData);
			await storeActions.loadScenarios();
			storeActions.showNotification('Scenario created successfully', 'success');
			return id;
		} catch (error) {
			console.error('Error creating scenario:', error);
			storeActions.showNotification('Error creating scenario', 'error');
		}
	},

	async updateScenario(id, updates) {
		try {
			await dbUtils.updateScenario(id, updates);
			await storeActions.loadScenarios();
			storeActions.showNotification('Scenario updated successfully', 'success');
		} catch (error) {
			console.error('Error updating scenario:', error);
			storeActions.showNotification('Error updating scenario', 'error');
		}
	},

	async deleteScenario(id) {
		try {
			await dbUtils.deleteScenario(id);
			await storeActions.loadScenarios();
			storeActions.showNotification('Scenario deleted successfully', 'success');
		} catch (error) {
			console.error('Error deleting scenario:', error);
			storeActions.showNotification('Error deleting scenario', 'error');
		}
	},

	// Tasks
	async loadTasks() {
		try {
			const taskList = await dbUtils.getAllTasks();
			tasks.set(taskList);
		} catch (error) {
			console.error('Error loading tasks:', error);
			storeActions.showNotification('Error loading tasks', 'error');
		}
	},

	async createTask(taskData) {
		try {
			const id = await dbUtils.createTask(taskData);
			await storeActions.loadTasks();
			storeActions.showNotification('Task created successfully', 'success');
			return id;
		} catch (error) {
			console.error('Error creating task:', error);
			storeActions.showNotification('Error creating task', 'error');
		}
	},

	async updateTask(id, updates) {
		try {
			await dbUtils.updateTask(id, updates);
			await storeActions.loadTasks();
			if (updates.status === 'completed') {
				storeActions.showNotification('Task completed! 🎉', 'success');
			} else {
				storeActions.showNotification('Task updated successfully', 'success');
			}
		} catch (error) {
			console.error('Error updating task:', error);
			storeActions.showNotification('Error updating task', 'error');
		}
	},

	async completeTask(id, actualHours) {
		try {
			await dbUtils.completeTask(id, actualHours);
			await storeActions.loadTasks();
			storeActions.showNotification('Task completed! 🎉', 'success');
		} catch (error) {
			console.error('Error completing task:', error);
			storeActions.showNotification('Error completing task', 'error');
		}
	},

	// Signals
	async loadSignals() {
		try {
			const signalList = await dbUtils.getTriggeredSignals();
			signals.set(signalList);
		} catch (error) {
			console.error('Error loading signals:', error);
		}
	},

	async updateSignalValue(id, value) {
		try {
			await dbUtils.updateSignalValue(id, value);
			await storeActions.loadSignals();
			
			// Check if signal was triggered
			const signal = await dbUtils.getSignalById(id);
			if (signal && signal.isTriggered) {
				storeActions.showNotification(
					`Signal triggered: ${signal.metricName}`, 
					'warning'
				);
			}
		} catch (error) {
			console.error('Error updating signal:', error);
		}
	},

	// Settings
	async loadSettings() {
		try {
			const settings = {};
			settings.workHoursPerDay = await dbUtils.getSetting('workHoursPerDay') || 8;
			settings.workDaysPerWeek = await dbUtils.getSetting('workDaysPerWeek') || 5;
			settings.focusSessionLength = await dbUtils.getSetting('focusSessionLength') || 25;
			settings.breakLength = await dbUtils.getSetting('breakLength') || 5;
			settings.startOfDay = await dbUtils.getSetting('startOfDay') || '09:00';
			settings.endOfDay = await dbUtils.getSetting('endOfDay') || '18:00';
			settings.excludeWeekends = await dbUtils.getSetting('excludeWeekends') !== false;
			settings.notifications = await dbUtils.getSetting('notifications') !== false;
			
			userSettings.set(settings);
		} catch (error) {
			console.error('Error loading settings:', error);
		}
	},

	async updateSettings(newSettings) {
		try {
			for (const [key, value] of Object.entries(newSettings)) {
				await dbUtils.setSetting(key, value);
			}
			await storeActions.loadSettings();
			storeActions.showNotification('Settings updated successfully', 'success');
		} catch (error) {
			console.error('Error updating settings:', error);
			storeActions.showNotification('Error updating settings', 'error');
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
	async quickCapture(text, type = 'task') {
		if (!text.trim()) return;

		try {
			if (type === 'task') {
				await storeActions.createTask({
					title: text,
					priority: 'medium',
					status: 'pending'
				});
			} else if (type === 'event') {
				await storeActions.createEvent({
					title: text,
					start: new Date().toISOString(),
					end: new Date(Date.now() + 3600000).toISOString() // +1 hour
				});
			} else if (type === 'scenario') {
				await storeActions.createScenario({
					title: text,
					priority: 'medium'
				});
			}
			storeActions.showNotification('Item captured successfully', 'success');
		} catch (error) {
			console.error('Error in quick capture:', error);
			storeActions.showNotification('Error capturing item', 'error');
		}
	},

	// Scheduling actions
	async optimizeSchedule(options = {}) {
		isOptimizing.set(true);
		
		try {
			const taskList = await dbUtils.getAllTasks();
			const settings = await storeActions.getCurrentSettings();
			
			// Update scheduler settings
			scheduler.heuristicScheduler.workHoursPerDay = settings.workHoursPerDay;
			scheduler.heuristicScheduler.workDaysPerWeek = settings.workDaysPerWeek;
			scheduler.heuristicScheduler.startOfDay = settings.startOfDay;
			scheduler.heuristicScheduler.endOfDay = settings.endOfDay;
			scheduler.heuristicScheduler.excludeWeekends = settings.excludeWeekends;
			
			// Generate optimized schedule
			const schedule = await scheduler.scheduleAll(taskList, options);
			
			// Save to stores
			currentSchedule.set(schedule);
			
			// Generate analysis
			const analysis = scheduler.getScheduleAnalysis(schedule, taskList);
			scheduleAnalysis.set(analysis);
			
			// Save schedule to database
			await schedulerUtils.saveSchedule(schedule);
			
			storeActions.showNotification(
				`Schedule optimized! ${schedule.length} tasks scheduled across ${analysis.workingDays} days`,
				'success'
			);
			
			return schedule;
		} catch (error) {
			console.error('Error optimizing schedule:', error);
			storeActions.showNotification('Error optimizing schedule', 'error');
			return [];
		} finally {
			isOptimizing.set(false);
		}
	},

	async getCurrentSettings() {
		// Get current settings from store (could be cached or from database)
		return new Promise((resolve) => {
			userSettings.subscribe(settings => {
				resolve(settings);
			})();
		});
	},

	async loadSchedule() {
		try {
			const taskList = await dbUtils.getAllTasks();
			const scheduledTasks = taskList.filter(task => task.scheduledDate);
			
			// Convert to schedule format
			const schedule = scheduledTasks.map(task => ({
				taskId: task.id,
				task: task,
				startTime: task.scheduledStartTime || task.scheduledDate,
				endTime: task.scheduledEndTime || task.scheduledDate,
				duration: task.estimatedHours || 1,
				scheduledDate: new Date(task.scheduledDate).toDateString(),
				isValid: true,
				issues: []
			}));
			
			currentSchedule.set(schedule);
			
			// Generate analysis
			if (schedule.length > 0) {
				const analysis = scheduler.getScheduleAnalysis(schedule, taskList);
				scheduleAnalysis.set(analysis);
			}
			
			return schedule;
		} catch (error) {
			console.error('Error loading schedule:', error);
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
			console.error('Error rescheduling task:', error);
			storeActions.showNotification('Error rescheduling task', 'error');
			return [];
		}
	},

	getDailySchedule(date) {
		return new Promise((resolve) => {
			currentSchedule.subscribe(schedule => {
				const dailySchedule = schedulerUtils.getDailySchedule(schedule, date);
				resolve(dailySchedule);
			})();
		});
	}
};

// Focus timer store
export const focusTimer = (() => {
	const { subscribe, set, update } = writable({
		isRunning: false,
		timeRemaining: 25 * 60, // 25 minutes in seconds
		currentTask: null,
		session: 1,
		totalSessions: 0
	});

	let interval = null;

	return {
		subscribe,
		start(taskId = null) {
			update(state => {
				if (!state.isRunning) {
					interval = setInterval(() => {
						update(current => {
							if (current.timeRemaining <= 0) {
								// Session completed
								storeActions.showNotification('Focus session completed! 🎉', 'success');
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
					}, 1000);
					
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
			update(state => ({ ...state, isRunning: false }));
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
			update(state => ({
				...state,
				isRunning: false,
				timeRemaining: 25 * 60,
				currentTask: null
			}));
		}
	};
})();