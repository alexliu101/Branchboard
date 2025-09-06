<script>
	import { onMount } from 'svelte';
	import { storeActions, tasks, activeTasks, completedTasks, overdueTasks, scenarios, currentBranches } from '../../lib/stores.js';
	import { dbUtils } from '../../lib/database.js';
	
	// Task statistics
	let taskStats = {
		total: 0,
		completed: 0,
		pending: 0,
		overdue: 0
	};
	
	// Personal metrics (mock data - could be enhanced later)
	let personalMetrics = [
		{ name: 'Focus Sessions', current: 5, target: 6, trend: 'up', color: '#10b981' },
		{ name: 'Weekly Tasks', current: 8, target: 10, trend: 'stable', color: '#3b82f6' },
		{ name: 'Branch Switches', current: 2, target: 5, trend: 'down', color: '#f59e0b' }
	];
	
	let expiringDecisions = [];
	
	// All tasks for sorting and analysis
	let allTasks = [];
	let activeBranches = [];
	
	onMount(async () => {
		await storeActions.initializeData();
		await loadDashboardData();
	});
	
	async function loadDashboardData() {
		// Update task statistics
		taskStats = {
			total: $tasks.length,
			completed: $completedTasks.length,
			pending: $activeTasks.length,
			overdue: $overdueTasks.length
		};
		
		allTasks = $tasks;
		activeBranches = $currentBranches;
		
		// Load expiring decisions
		try {
			expiringDecisions = await dbUtils.getExpiringDecisions(7); // Next 7 days
		} catch (error) {
			console.error('Error loading expiring decisions:', error);
			expiringDecisions = [];
		}
	}
	
	function getUrgencyColor(priority) {
		switch (priority) {
			case 'high': return 'var(--error-color)';
			case 'medium': return 'var(--warning-color)';
			case 'low': return 'var(--success-color)';
			default: return 'var(--gray-400)';
		}
	}
	
	function getEffortSize(hours) {
		if (hours >= 4) return 'L';
		if (hours >= 2) return 'M';
		return 'S';
	}
	
	function getPriorityColor(priority) {
		switch (priority) {
			case 'high': return 'var(--error-color)';
			case 'medium': return 'var(--warning-color)';
			case 'low': return 'var(--success-color)';
			default: return 'var(--gray-400)';
		}
	}
	
	function getDaysLeftColor(days) {
		if (days <= 1) return 'var(--error-color)';
		if (days <= 3) return 'var(--warning-color)';
		return 'var(--success-color)';
	}
	
	// Reactive computations
	$: {
		loadDashboardData();
	}
	
	// Sort tasks by priority
	$: sortedByPriority = [...$activeTasks].sort((a, b) => {
		const priorityOrder = { high: 3, medium: 2, low: 1 };
		return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
	});
	
	// Sort tasks by effort (estimated hours)
	$: sortedByEffort = [...$activeTasks].sort((a, b) => {
		return (a.estimatedHours || 1) - (b.estimatedHours || 1);
	});
	
	// Branch summary
	$: branchSummary = activeBranches.length > 0 ? 
		`${activeBranches.length} active branch${activeBranches.length !== 1 ? 'es' : ''}` :
		'No active branches';
</script>

<svelte:head>
	<title>Dashboards - Branchboard</title>
</svelte:head>

<div class="dashboards-container">
	<div class="page-header">
		<h1>📊 Dashboards</h1>
		<p class="page-subtitle">Roll-up views to keep you on track</p>
	</div>

	<div class="dashboard-grid">
		<!-- Task Overview -->
		<section class="dashboard-card card">
			<div class="card-title">📋 Task Overview</div>
			<div class="stats-grid">
				<div class="stat-item">
					<div class="stat-number" style="color: var(--primary-color)">{taskStats.total}</div>
					<div class="stat-label">Total Tasks</div>
				</div>
				<div class="stat-item">
					<div class="stat-number" style="color: var(--success-color)">{taskStats.completed}</div>
					<div class="stat-label">Completed</div>
				</div>
				<div class="stat-item">
					<div class="stat-number" style="color: var(--warning-color)">{taskStats.pending}</div>
					<div class="stat-label">Pending</div>
				</div>
				<div class="stat-item">
					<div class="stat-number" style="color: var(--error-color)">{taskStats.overdue}</div>
					<div class="stat-label">Overdue</div>
				</div>
			</div>
		</section>

		<!-- Branch Status -->
		<section class="dashboard-card card">
			<div class="card-title">🌳 Branch Status</div>
			<div class="branch-overview">
				<div class="branch-stat">
					<span class="branch-count">{activeBranches.length}</span>
					<span class="branch-label">Active Branches</span>
				</div>
				<div class="branch-stat">
					<span class="branch-count">{$scenarios.length}</span>
					<span class="branch-label">Total Scenarios</span>
				</div>
				{#if activeBranches.length > 0}
					<div class="active-branches">
						<h4>Current Branches:</h4>
						{#each activeBranches as branch}
							<div class="branch-item">
								📍 {branch.description}
							</div>
						{/each}
					</div>
				{:else}
					<div class="no-branches">
						<p>No active branches set</p>
						<small>Visit Upcoming to create scenarios and set current branches</small>
					</div>
				{/if}
			</div>
		</section>

		<!-- Personal Metrics -->
		<section class="dashboard-card card">
			<div class="card-title">💪 Personal Metrics</div>
			<div class="metrics-list">
				{#each personalMetrics as metric}
					<div class="metric-item">
						<div class="metric-header">
							<span class="metric-name">{metric.name}</span>
							<span class="metric-trend trend-{metric.trend}">
								{#if metric.trend === 'up'}↗️
								{:else if metric.trend === 'down'}↘️
								{:else}→{/if}
							</span>
						</div>
						<div class="metric-progress">
							<div class="progress-bar">
								<div 
									class="progress-fill" 
									style="width: {(metric.current / metric.target) * 100}%; background-color: {metric.color}"
								></div>
							</div>
							<div class="metric-values">
								<span class="current">{metric.current}</span>
								<span class="target">/ {metric.target}</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Tasks by Priority -->
		<section class="dashboard-card card">
			<div class="card-title">🔥 Tasks by Priority</div>
			<div class="tasks-list">
				{#each sortedByPriority.slice(0, 6) as task}
					<div class="task-item">
						<div class="task-priority" style="background-color: {getPriorityColor(task.priority)}">
							{task.priority.charAt(0).toUpperCase()}
						</div>
						<div class="task-details">
							<div class="task-title">{task.title}</div>
							<div class="task-meta">
								{#if task.deadline}
									<span class="task-deadline">📅 {new Date(task.deadline).toLocaleDateString()}</span>
								{/if}
								{#if task.sourceNodeId}
									<span class="task-source">🌳 Branch task</span>
								{/if}
							</div>
						</div>
						<div class="task-effort">
							{getEffortSize(task.estimatedHours)}
						</div>
					</div>
				{:else}
					<div class="empty-state">
						<p>No active tasks</p>
						<small>Add tasks in the Tasks page or create them from branch nodes</small>
					</div>
				{/each}
			</div>
		</section>

		<!-- Tasks by Effort -->
		<section class="dashboard-card card">
			<div class="card-title">⚡ Tasks by Effort</div>
			<div class="tasks-list">
				{#each sortedByEffort.slice(0, 6) as task}
					<div class="task-item">
						<div class="task-effort-badge effort-{getEffortSize(task.estimatedHours).toLowerCase()}">
							{getEffortSize(task.estimatedHours)}
						</div>
						<div class="task-details">
							<div class="task-title">{task.title}</div>
							<div class="task-meta">
								<span class="task-hours">{task.estimatedHours}h estimated</span>
								{#if task.deadline}
									<span class="task-deadline">📅 {new Date(task.deadline).toLocaleDateString()}</span>
								{/if}
							</div>
						</div>
						<div class="task-priority-indicator" style="color: {getPriorityColor(task.priority)}">
							{task.priority}
						</div>
					</div>
				{:else}
					<div class="empty-state">
						<p>No active tasks</p>
						<small>Add tasks to see effort distribution</small>
					</div>
				{/each}
			</div>
		</section>

		<!-- Expiring Decisions -->
		<section class="dashboard-card card">
			<div class="card-title">⏰ Urgent Decisions</div>
			<div class="decisions-list">
				{#each expiringDecisions.slice(0, 4) as decision}
					<div class="decision-item" class:urgent={decision.daysLeft <= 1}>
						<div class="decision-header">
							<span class="decision-title">{decision.description}</span>
							<span class="days-left" style="color: {getDaysLeftColor(decision.daysLeft)}">
								{decision.daysLeft > 0 ? `${decision.daysLeft}d left` : 'EXPIRED'}
							</span>
						</div>
						<div class="decision-context">{decision.context}</div>
					</div>
				{:else}
					<div class="empty-state">
						<p>No urgent decisions</p>
						<small>Decision deadlines will appear here</small>
					</div>
				{/each}
			</div>
		</section>

		<!-- Quick Actions -->
		<section class="dashboard-card card">
			<div class="card-title">⚡ Quick Actions</div>
			<div class="quick-actions">
				<a href="/tasks" class="action-button">
					📋 Manage Tasks
				</a>
				<a href="/upcoming" class="action-button">
					📅 View Scenarios
				</a>
				<a href="/review" class="action-button">
					🔄 Weekly Review
				</a>
				<button 
					class="action-button" 
					on:click={() => storeActions.optimizeSchedule()}
				>
					🎯 Optimize Schedule
				</button>
			</div>
		</section>
	</div>
</div>

<style>
	.dashboards-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem;
	}
	
	.page-header {
		margin-bottom: 2rem;
		text-align: center;
	}
	
	.page-header h1 {
		margin: 0;
		color: var(--text-primary);
	}
	
	.page-subtitle {
		color: var(--text-secondary);
		margin-top: 0.5rem;
		font-size: 1.125rem;
	}
	
	.dashboard-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
		gap: 2rem;
	}
	
	.dashboard-card {
		background: var(--bg-primary);
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		padding: 1.5rem;
		box-shadow: var(--shadow-sm);
		transition: all 0.2s;
	}
	
	.dashboard-card:hover {
		box-shadow: var(--shadow-md);
	}
	
	.card-title {
		font-size: 1.25rem;
		font-weight: 600;
		color: var(--text-primary);
		margin: 0 0 1.5rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	/* Task Overview Stats */
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}
	
	.stat-item {
		text-align: center;
		padding: 1rem;
		background: var(--gray-50);
		border-radius: var(--radius);
	}
	
	.stat-number {
		font-size: 2rem;
		font-weight: bold;
		line-height: 1;
	}
	
	.stat-label {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: 0.25rem;
	}
	
	/* Branch Status */
	.branch-overview {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.branch-stat {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 0.75rem;
		background: var(--gray-50);
		border-radius: var(--radius);
	}
	
	.branch-count {
		font-size: 1.5rem;
		font-weight: bold;
		color: var(--primary-color);
	}
	
	.branch-label {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.active-branches h4 {
		margin: 0 0 0.5rem 0;
		font-size: 0.875rem;
		color: var(--text-primary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.branch-item {
		padding: 0.5rem;
		background: var(--gray-50);
		border-radius: var(--radius);
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 0.5rem;
	}
	
	.no-branches {
		text-align: center;
		padding: 1rem;
		color: var(--gray-500);
	}
	
	.no-branches p {
		margin: 0;
		font-weight: 500;
	}
	
	.no-branches small {
		font-size: 0.875rem;
		opacity: 0.8;
	}
	
	/* Personal Metrics */
	.metrics-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	
	.metric-item {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}
	
	.metric-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.metric-name {
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.metric-trend {
		font-size: 0.875rem;
	}
	
	.trend-up { color: var(--success-color); }
	.trend-down { color: var(--error-color); }
	.trend-stable { color: var(--gray-500); }
	
	.metric-progress {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.progress-bar {
		flex: 1;
		height: 8px;
		background: var(--gray-200);
		border-radius: 4px;
		overflow: hidden;
	}
	
	.progress-fill {
		height: 100%;
		border-radius: 4px;
		transition: width 0.3s;
	}
	
	.metric-values {
		font-size: 0.875rem;
		font-weight: 500;
	}
	
	.current {
		color: var(--text-primary);
	}
	
	.target {
		color: var(--text-secondary);
	}
	
	/* Tasks Lists */
	.tasks-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-height: 300px;
		overflow-y: auto;
	}
	
	.task-item {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: var(--gray-50);
		border-radius: var(--radius);
		transition: background-color 0.2s;
	}
	
	.task-item:hover {
		background: var(--gray-100);
	}
	
	.task-priority, .task-effort-badge {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: bold;
		font-size: 0.875rem;
		color: white;
	}
	
	.effort-l { background-color: var(--error-color); }
	.effort-m { background-color: var(--warning-color); }
	.effort-s { background-color: var(--success-color); }
	
	.task-details {
		flex: 1;
	}
	
	.task-title {
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.task-meta {
		font-size: 0.875rem;
		color: var(--text-secondary);
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}
	
	.task-effort {
		background: var(--gray-200);
		color: var(--text-primary);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius);
		font-weight: 600;
		font-size: 0.875rem;
	}
	
	.task-priority-indicator {
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: capitalize;
	}
	
	.empty-state {
		text-align: center;
		padding: 2rem 1rem;
		color: var(--gray-500);
	}
	
	.empty-state p {
		margin: 0 0 0.5rem 0;
		font-weight: 500;
	}
	
	.empty-state small {
		font-size: 0.875rem;
		opacity: 0.8;
	}
	
	/* Quick Actions */
	.quick-actions {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.action-button {
		padding: 1rem;
		background: var(--primary-color);
		color: white;
		text-decoration: none;
		border-radius: var(--radius);
		text-align: center;
		font-weight: 500;
		transition: all 0.2s;
		border: none;
		cursor: pointer;
		font-size: 0.875rem;
	}
	
	.action-button:hover {
		background: #2563eb;
		transform: translateY(-1px);
	}
	
	/* Decisions List */
	.decisions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		max-height: 250px;
		overflow-y: auto;
	}
	
	.decision-item {
		padding: 1rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		background: var(--gray-50);
		transition: all 0.2s;
	}
	
	.decision-item.urgent {
		border-color: var(--error-color);
		background: rgba(239, 68, 68, 0.05);
	}
	
	.decision-item:hover {
		background: var(--gray-100);
	}
	
	.decision-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	
	.decision-title {
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.days-left {
		font-size: 0.875rem;
		font-weight: 600;
	}
	
	.decision-context {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	@media (max-width: 768px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
		}
		
		.stats-grid {
			grid-template-columns: 1fr;
		}
		
		.task-item {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}
		
		.task-meta {
			flex-direction: row;
			gap: 1rem;
		}
	}
</style>