<script>
	import { onMount } from 'svelte';
	
	// Mock data for dashboards
	let taskStats = {
		total: 24,
		completed: 8,
		pending: 12,
		overdue: 4
	};
	
	let personalMetrics = [
		{ name: 'Sleep Hours', current: 7.2, target: 8, trend: 'down', color: '#3b82f6' },
		{ name: 'Focus Sessions', current: 5, target: 6, trend: 'up', color: '#10b981' },
		{ name: 'Weekly Budget', current: 450, target: 600, trend: 'stable', color: '#f59e0b' }
	];
	
	let tasksBurnUp = [
		{ week: 'W43', completed: 3, added: 5 },
		{ week: 'W44', completed: 8, added: 4 },
		{ week: 'W45', completed: 5, added: 7 },
		{ week: 'W46', completed: 8, added: 6 },
		{ week: 'W47', completed: 6, added: 3 }
	];
	
	let optionExpiryList = [
		{
			id: 1,
			decision: 'Decide on conference venue',
			deadline: '2024-11-20',
			daysLeft: 5,
			priority: 'high',
			scenario: 'Q1 Team Conference'
		},
		{
			id: 2,
			decision: 'Accept job offer A vs B',
			deadline: '2024-11-25',
			daysLeft: 10,
			priority: 'high',
			scenario: 'Career Change'
		},
		{
			id: 3,
			decision: 'Choose apartment lease',
			deadline: '2024-12-01',
			daysLeft: 16,
			priority: 'medium',
			scenario: 'Relocation to City X'
		}
	];
	
	let allTasks = [
		{
			id: 1,
			title: 'Prepare feature list versions',
			scenario: 'Project Deadline Dec 1',
			branch: 'On Time',
			urgency: 'high',
			effort: 'high',
			deadline: '2024-11-15',
			status: 'active'
		},
		{
			id: 2,
			title: 'Research relocation costs',
			scenario: 'Relocation to City X',
			branch: 'Accept Offer',
			urgency: 'medium',
			effort: 'medium',
			deadline: '2024-11-30',
			status: 'parked'
		},
		{
			id: 3,
			title: 'Update portfolio website',
			scenario: 'Career Change',
			branch: 'Apply to Tech Companies',
			urgency: 'medium',
			effort: 'high',
			deadline: '2024-11-22',
			status: 'active'
		},
		{
			id: 4,
			title: 'Book team dinner venue',
			scenario: 'Q1 Team Conference',
			branch: 'In-Person Event',
			urgency: 'high',
			effort: 'low',
			deadline: '2024-11-18',
			status: 'active'
		}
	];
	
	let chartContainer;
	
	onMount(() => {
		// In real app, this would initialize Chart.js
		drawSimpleChart();
	});
	
	function drawSimpleChart() {
		if (!chartContainer) return;
		
		// Simple SVG chart for the burn-up
		const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
		svg.setAttribute('width', '100%');
		svg.setAttribute('height', '200');
		svg.setAttribute('viewBox', '0 0 400 200');
		svg.style.background = '#f9fafb';
		svg.style.borderRadius = '0.5rem';
		
		// Draw axes
		const axisGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		axisGroup.setAttribute('stroke', '#d1d5db');
		axisGroup.setAttribute('stroke-width', '1');
		
		// Y axis
		const yAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		yAxis.setAttribute('x1', '40');
		yAxis.setAttribute('y1', '20');
		yAxis.setAttribute('x2', '40');
		yAxis.setAttribute('y2', '180');
		axisGroup.appendChild(yAxis);
		
		// X axis
		const xAxis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
		xAxis.setAttribute('x1', '40');
		xAxis.setAttribute('y1', '180');
		xAxis.setAttribute('x2', '380');
		xAxis.setAttribute('y2', '180');
		axisGroup.appendChild(xAxis);
		
		svg.appendChild(axisGroup);
		
		// Draw data lines
		const dataGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
		dataGroup.setAttribute('fill', 'none');
		dataGroup.setAttribute('stroke-width', '2');
		
		// Completed tasks line (green)
		const completedPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		let completedD = `M 60 ${180 - tasksBurnUp[0].completed * 15}`;
		tasksBurnUp.forEach((point, i) => {
			if (i > 0) {
				completedD += ` L ${60 + i * 80} ${180 - point.completed * 15}`;
			}
		});
		completedPath.setAttribute('d', completedD);
		completedPath.setAttribute('stroke', '#10b981');
		dataGroup.appendChild(completedPath);
		
		// Added tasks line (blue)
		const addedPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
		let addedD = `M 60 ${180 - tasksBurnUp[0].added * 15}`;
		tasksBurnUp.forEach((point, i) => {
			if (i > 0) {
				addedD += ` L ${60 + i * 80} ${180 - point.added * 15}`;
			}
		});
		addedPath.setAttribute('d', addedD);
		addedPath.setAttribute('stroke', '#3b82f6');
		dataGroup.appendChild(addedPath);
		
		svg.appendChild(dataGroup);
		
		chartContainer.appendChild(svg);
	}
	
	function getUrgencyColor(urgency) {
		switch (urgency) {
			case 'high': return 'var(--error-color)';
			case 'medium': return 'var(--warning-color)';
			case 'low': return 'var(--success-color)';
			default: return 'var(--gray-400)';
		}
	}
	
	function getEffortSize(effort) {
		switch (effort) {
			case 'high': return 'L';
			case 'medium': return 'M';
			case 'low': return 'S';
			default: return 'M';
		}
	}
	
	function getDaysLeftColor(days) {
		if (days <= 3) return 'var(--error-color)';
		if (days <= 7) return 'var(--warning-color)';
		return 'var(--success-color)';
	}
	
	// Filter and sort tasks
	$: activeTasks = allTasks.filter(task => task.status === 'active');
	$: parkedTasks = allTasks.filter(task => task.status === 'parked');
	
	// Sort by urgency and effort
	$: sortedByUrgency = [...activeTasks].sort((a, b) => {
		const urgencyOrder = { high: 3, medium: 2, low: 1 };
		return urgencyOrder[b.urgency] - urgencyOrder[a.urgency];
	});
	
	$: sortedByEffort = [...activeTasks].sort((a, b) => {
		const effortOrder = { low: 3, medium: 2, high: 1 };
		return effortOrder[b.effort] - effortOrder[a.effort];
	});
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

		<!-- Tasks Burn-Up Chart -->
		<section class="dashboard-card card chart-card">
			<div class="card-title">📈 Tasks Burn-Up Chart</div>
			<div class="chart-container" bind:this={chartContainer}>
				<!-- Chart will be inserted here -->
			</div>
			<div class="chart-legend">
				<div class="legend-item">
					<span class="legend-color" style="background-color: #10b981"></span>
					Completed Tasks
				</div>
				<div class="legend-item">
					<span class="legend-color" style="background-color: #3b82f6"></span>
					Added Tasks
				</div>
			</div>
		</section>

		<!-- Option Expiry List -->
		<section class="dashboard-card card">
			<div class="card-title">⏰ Option Expiry</div>
			<div class="expiry-list">
				{#each optionExpiryList as option}
					<div class="expiry-item">
						<div class="expiry-header">
							<span class="decision-title">{option.decision}</span>
							<span class="days-left" style="color: {getDaysLeftColor(option.daysLeft)}">
								{option.daysLeft}d left
							</span>
						</div>
						<div class="expiry-details">
							<span class="scenario-name">📍 {option.scenario}</span>
							<span class="deadline">🗓️ {new Date(option.deadline).toLocaleDateString()}</span>
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- All Tasks by Urgency -->
		<section class="dashboard-card card">
			<div class="card-title">🔥 Tasks by Urgency</div>
			<div class="tasks-list">
				{#each sortedByUrgency as task}
					<div class="task-item">
						<div class="task-priority" style="background-color: {getUrgencyColor(task.urgency)}">
							{task.urgency.charAt(0).toUpperCase()}
						</div>
						<div class="task-details">
							<div class="task-title">{task.title}</div>
							<div class="task-meta">
								<span class="task-scenario">{task.scenario}</span>
								<span class="task-branch">→ {task.branch}</span>
							</div>
						</div>
						<div class="task-effort">
							{getEffortSize(task.effort)}
						</div>
					</div>
				{/each}
			</div>
		</section>

		<!-- Tasks by Effort -->
		<section class="dashboard-card card">
			<div class="card-title">⚡ Tasks by Effort</div>
			<div class="tasks-list">
				{#each sortedByEffort as task}
					<div class="task-item">
						<div class="task-effort-badge effort-{task.effort}">
							{getEffortSize(task.effort)}
						</div>
						<div class="task-details">
							<div class="task-title">{task.title}</div>
							<div class="task-meta">
								<span class="task-scenario">{task.scenario}</span>
								<span class="task-deadline">📅 {new Date(task.deadline).toLocaleDateString()}</span>
							</div>
						</div>
						<div class="task-urgency" style="color: {getUrgencyColor(task.urgency)}">
							{task.urgency}
						</div>
					</div>
				{/each}
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
	
	/* Chart */
	.chart-card {
		grid-column: span 2;
		min-height: 300px;
	}
	
	.chart-container {
		width: 100%;
		height: 200px;
		margin-bottom: 1rem;
	}
	
	.chart-legend {
		display: flex;
		justify-content: center;
		gap: 2rem;
	}
	
	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}
	
	.legend-color {
		width: 12px;
		height: 12px;
		border-radius: 2px;
	}
	
	/* Option Expiry */
	.expiry-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.expiry-item {
		padding: 1rem;
		background: var(--gray-50);
		border-radius: var(--radius);
		border-left: 4px solid var(--warning-color);
	}
	
	.expiry-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
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
	
	.expiry-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	/* Tasks Lists */
	.tasks-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
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
	
	.effort-high { background-color: var(--error-color); }
	.effort-medium { background-color: var(--warning-color); }
	.effort-low { background-color: var(--success-color); }
	
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
		flex-direction: column;
		gap: 0.125rem;
	}
	
	.task-effort {
		background: var(--gray-200);
		color: var(--text-primary);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius);
		font-weight: 600;
		font-size: 0.875rem;
	}
	
	.task-urgency {
		font-size: 0.875rem;
		font-weight: 500;
		text-transform: capitalize;
	}
	
	@media (max-width: 768px) {
		.dashboard-grid {
			grid-template-columns: 1fr;
		}
		
		.chart-card {
			grid-column: span 1;
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