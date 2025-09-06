import { dbUtils } from './database.js';

/**
 * Task Scheduler using optimization algorithms and heuristics
 * As mentioned in spec: Uses jsLPSolver for optimal scheduling with heuristic fallbacks
 */

// Heuristic scheduling algorithms (fast fallback)
export class HeuristicScheduler {
	constructor(settings = {}) {
		this.workHoursPerDay = settings.workHoursPerDay || 8;
		this.workDaysPerWeek = settings.workDaysPerWeek || 5;
		this.startOfDay = settings.startOfDay || '09:00';
		this.endOfDay = settings.endOfDay || '18:00';
		this.excludeWeekends = settings.excludeWeekends !== false;
		this.breakDuration = settings.breakDuration || 1; // hours
	}

	/**
	 * Earliest Due Date (EDD) scheduling
	 * Simple but effective for deadline-driven tasks
	 */
	scheduleByEDD(tasks) {
		const sortedTasks = [...tasks].sort((a, b) => {
			// No deadline goes last
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
	scheduleByWSPT(tasks) {
		const priorityWeights = { high: 3, medium: 2, low: 1 };
		
		const sortedTasks = [...tasks].sort((a, b) => {
			const weightA = priorityWeights[a.priority] || 1;
			const weightB = priorityWeights[b.priority] || 1;
			const ratioA = weightA / (a.estimatedHours || 1);
			const ratioB = weightB / (b.estimatedHours || 1);
			return ratioB - ratioA; // Higher ratio first
		});

		return this.assignTimeSlots(sortedTasks);
	}

	/**
	 * Critical Path Method (simplified)
	 * Considers dependencies between tasks
	 */
	scheduleByDependencies(tasks) {
		const taskMap = new Map(tasks.map(t => [t.id, t]));
		const scheduled = new Set();
		const result = [];
		
		// Build dependency graph
		const dependencies = new Map();
		const dependents = new Map();
		
		tasks.forEach(task => {
			dependencies.set(task.id, task.dependsOn || []);
			dependents.set(task.id, []);
		});
		
		// Build reverse dependencies
		tasks.forEach(task => {
			(task.dependsOn || []).forEach(depId => {
				if (dependents.has(depId)) {
					dependents.get(depId).push(task.id);
				}
			});
		});
		
		// Schedule tasks respecting dependencies
		const queue = tasks.filter(task => !task.dependsOn || task.dependsOn.length === 0);
		
		while (queue.length > 0) {
			// Sort queue by priority and deadline
			queue.sort((a, b) => {
				const priorityOrder = { high: 3, medium: 2, low: 1 };
				const priorityDiff = (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
				if (priorityDiff !== 0) return priorityDiff;
				
				if (a.deadline && b.deadline) {
					return new Date(a.deadline) - new Date(b.deadline);
				}
				return a.deadline ? -1 : (b.deadline ? 1 : 0);
			});
			
			const task = queue.shift();
			result.push(task);
			scheduled.add(task.id);
			
			// Add newly available tasks to queue
			dependents.get(task.id).forEach(dependentId => {
				const dependent = taskMap.get(dependentId);
				if (dependent && !scheduled.has(dependentId)) {
					// Check if all dependencies are satisfied
					const allDepsSatisfied = (dependent.dependsOn || []).every(depId => scheduled.has(depId));
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
	assignTimeSlots(tasks) {
		const schedule = [];
		let currentDate = new Date();
		currentDate.setHours(parseInt(this.startOfDay.split(':')[0]), parseInt(this.startOfDay.split(':')[1]), 0, 0);
		
		// Skip weekends if configured
		if (this.excludeWeekends) {
			while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
				currentDate.setDate(currentDate.getDate() + 1);
			}
		}
		
		let availableHours = this.workHoursPerDay;
		
		tasks.forEach(task => {
			const taskHours = task.estimatedHours || 1;
			
			// Check if task fits in current day
			if (taskHours > availableHours) {
				// Move to next working day
				do {
					currentDate.setDate(currentDate.getDate() + 1);
				} while (this.excludeWeekends && (currentDate.getDay() === 0 || currentDate.getDay() === 6));
				
				currentDate.setHours(parseInt(this.startOfDay.split(':')[0]), parseInt(this.startOfDay.split(':')[1]), 0, 0);
				availableHours = this.workHoursPerDay;
			}
			
			// Schedule the task
			const startTime = new Date(currentDate);
			const endTime = new Date(currentDate.getTime() + (taskHours * 60 * 60 * 1000));
			
			schedule.push({
				taskId: task.id,
				task: task,
				startTime: startTime.toISOString(),
				endTime: endTime.toISOString(),
				duration: taskHours,
				scheduledDate: startTime.toDateString()
			});
			
			// Update current time and available hours
			currentDate.setTime(endTime.getTime());
			availableHours -= taskHours;
			
			// Add break if there's more work today
			if (availableHours > 0 && taskHours >= 2) {
				const breakTime = 0.25; // 15 minutes
				currentDate.setTime(currentDate.getTime() + (breakTime * 60 * 60 * 1000));
				availableHours -= breakTime;
			}
		});
		
		return schedule;
	}

	/**
	 * Main scheduling method that tries different heuristics
	 */
	async optimizeSchedule(tasks, method = 'auto') {
		if (!tasks || tasks.length === 0) {
			return [];
		}
		
		// Filter out completed tasks
		const activeTasks = tasks.filter(task => task.status !== 'completed' && task.status !== 'cancelled');
		
		if (activeTasks.length === 0) {
			return [];
		}
		
		let schedule;
		
		switch (method) {
			case 'edd':
				schedule = this.scheduleByEDD(activeTasks);
				break;
			case 'wspt':
				schedule = this.scheduleByWSPT(activeTasks);
				break;
			case 'dependencies':
				schedule = this.scheduleByDependencies(activeTasks);
				break;
			case 'auto':
			default:
				// Automatically choose best method based on task characteristics
				const hasDependencies = activeTasks.some(t => t.dependsOn && t.dependsOn.length > 0);
				const hasDeadlines = activeTasks.some(t => t.deadline);
				
				if (hasDependencies) {
					schedule = this.scheduleByDependencies(activeTasks);
				} else if (hasDeadlines) {
					schedule = this.scheduleByEDD(activeTasks);
				} else {
					schedule = this.scheduleByWSPT(activeTasks);
				}
				break;
		}
		
		// Validate schedule (check for deadline violations)
		return this.validateAndAdjustSchedule(schedule);
	}

	/**
	 * Validate schedule and flag potential issues
	 */
	validateAndAdjustSchedule(schedule) {
		const validatedSchedule = [];
		
		schedule.forEach(item => {
			const { task, startTime, endTime } = item;
			const issues = [];
			
			// Check deadline violation
			if (task.deadline && new Date(endTime) > new Date(task.deadline)) {
				issues.push('deadline_violation');
			}
			
			// Check if scheduled too far in future (more than 30 days)
			const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
			if (new Date(startTime) > thirtyDaysFromNow) {
				issues.push('scheduled_too_far');
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

// Web Worker wrapper for heavy optimization
export class OptimizedScheduler {
	constructor(settings = {}) {
		this.heuristicScheduler = new HeuristicScheduler(settings);
		this.settings = settings;
	}

	/**
	 * Schedule tasks using the best available method
	 */
	async scheduleAll(tasks, options = {}) {
		const method = options.method || 'auto';
		const useOptimizer = options.useOptimizer !== false && tasks.length > 5;
		
		try {
			if (useOptimizer && window.Worker) {
				// Use Web Worker for complex optimization
				return await this.scheduleWithWorker(tasks, method);
			} else {
				// Use heuristic scheduler
				return await this.heuristicScheduler.optimizeSchedule(tasks, method);
			}
		} catch (error) {
			console.error('Scheduling error:', error);
			// Fallback to simple heuristic
			return await this.heuristicScheduler.scheduleByWSPT(tasks);
		}
	}

	/**
	 * Use Web Worker for intensive optimization (would use jsLPSolver)
	 */
	async scheduleWithWorker(tasks, method) {
		return new Promise((resolve, reject) => {
			// For now, fallback to heuristic until Web Worker is implemented
			// In production, this would create a Web Worker and use jsLPSolver
			this.heuristicScheduler.optimizeSchedule(tasks, method)
				.then(resolve)
				.catch(reject);
		});
	}

	/**
	 * Quick reschedule for single task changes
	 */
	async rescheduleTask(taskId, tasks) {
		// Find affected tasks and reschedule efficiently
		const affectedTasks = tasks.filter(task => 
			task.id === taskId || 
			(task.dependsOn && task.dependsOn.includes(taskId))
		);
		
		if (affectedTasks.length === 0) {
			return await this.scheduleAll(tasks);
		}
		
		// Quick rescheduling for small changes
		return await this.heuristicScheduler.scheduleByDependencies(affectedTasks);
	}

	/**
	 * Get scheduling statistics and recommendations
	 */
	getScheduleAnalysis(schedule, tasks) {
		const analysis = {
			totalTasks: tasks.length,
			scheduledTasks: schedule.length,
			totalEstimatedHours: schedule.reduce((sum, item) => sum + item.duration, 0),
			workingDays: new Set(schedule.map(item => new Date(item.startTime).toDateString())).size,
			deadlineViolations: schedule.filter(item => item.issues?.includes('deadline_violation')).length,
			recommendations: []
		};
		
		// Generate recommendations
		if (analysis.deadlineViolations > 0) {
			analysis.recommendations.push('Consider extending deadlines or reducing task scope for overdue items');
		}
		
		if (analysis.totalEstimatedHours > this.settings.workHoursPerDay * 7) {
			analysis.recommendations.push('Heavy workload detected - consider prioritizing or delegating tasks');
		}
		
		const avgTasksPerDay = analysis.totalTasks / analysis.workingDays;
		if (avgTasksPerDay > 5) {
			analysis.recommendations.push('Consider breaking down larger tasks for better manageability');
		}
		
		return analysis;
	}
}

// Main scheduler instance
export const scheduler = new OptimizedScheduler();

// Utility functions
export const schedulerUtils = {
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
			console.error('Error saving schedule:', error);
			return false;
		}
	},

	/**
	 * Get tasks that need rescheduling
	 */
	async getTasksNeedingReschedule() {
		const tasks = await dbUtils.getAllTasks();
		const now = new Date();
		
		return tasks.filter(task => {
			// Unscheduled active tasks
			if (!task.scheduledDate && task.status === 'pending') {
				return true;
			}
			
			// Tasks scheduled in the past but not completed
			if (task.scheduledDate && new Date(task.scheduledDate) < now && task.status !== 'completed') {
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
		return schedule.filter(item => 
			new Date(item.startTime).toDateString() === targetDate
		).sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
	},

	/**
	 * Calculate workload distribution
	 */
	getWorkloadDistribution(schedule) {
		const distribution = {};
		
		schedule.forEach(item => {
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