<script>
	import { onMount } from 'svelte';
	import { storeActions, tasks, activeTasks, completedTasks, overdueTasks, currentSchedule, scheduleAnalysis, isOptimizing } from '../../lib/stores.js';
	
	let showAddModal = false;
	let newTaskTitle = '';
	let newTaskDescription = '';
	let newTaskPriority = 'medium';
	let newTaskDeadline = '';
	let newTaskEstimatedHours = 1;
	let filter = 'active';
	
	onMount(async () => {
		await storeActions.loadTasks();
		await storeActions.loadSchedule();
	});
	
	async function optimizeSchedule() {
		await storeActions.optimizeSchedule({
			method: 'auto',
			useOptimizer: $activeTasks.length > 5
		});
	}
	
	function openAddModal() {
		showAddModal = true;
		newTaskTitle = '';
		newTaskDescription = '';
		newTaskPriority = 'medium';
		newTaskDeadline = '';
		newTaskEstimatedHours = 1;
	}
	
	function closeAddModal() {
		showAddModal = false;
	}
	
	async function addTask() {
		if (!newTaskTitle.trim()) return;
		
		await storeActions.createTask({
			title: newTaskTitle,
			description: newTaskDescription,
			priority: newTaskPriority,
			deadline: newTaskDeadline || null,
			estimatedHours: newTaskEstimatedHours
		});
		
		closeAddModal();
	}
	
	async function completeTask(taskId) {
		await storeActions.completeTask(taskId);
	}
	
	async function deleteTask(taskId) {
		if (confirm('Are you sure you want to delete this task?')) {
			// We need to add a delete task function to stores
			console.log('Delete task:', taskId);
		}
	}
	
	function getPriorityColor(priority) {
		switch (priority) {
			case 'high': return 'var(--error-color)';
			case 'medium': return 'var(--warning-color)';
			case 'low': return 'var(--success-color)';
			default: return 'var(--gray-400)';
		}
	}
	
	function formatDate(dateStr) {
		if (!dateStr) return 'No deadline';
		return new Date(dateStr).toLocaleDateString([], { 
			month: 'short', 
			day: 'numeric',
			year: 'numeric'
		});
	}
	
	function isOverdue(deadline) {
		if (!deadline) return false;
		return new Date(deadline) < new Date();
	}
	
	// Filter tasks based on selected filter
	$: filteredTasks = (() => {
		switch (filter) {
			case 'active':
				return $activeTasks;
			case 'completed':
				return $completedTasks;
			case 'overdue':
				return $overdueTasks;
			case 'all':
				return $tasks;
			default:
				return $activeTasks;
		}
	})();
	
	// Group tasks by priority for active tasks
	$: tasksByPriority = {
		high: filteredTasks.filter(t => t.priority === 'high'),
		medium: filteredTasks.filter(t => t.priority === 'medium'),
		low: filteredTasks.filter(t => t.priority === 'low')
	};
</script>

<svelte:head>
	<title>Tasks - Branchboard</title>
</svelte:head>

<div class="tasks-container">
	<div class="page-header">
		<div class="header-left">
			<h1>📋 Tasks</h1>
			{#if $scheduleAnalysis}
				<p class="schedule-summary">
					{$scheduleAnalysis.scheduledTasks} tasks scheduled across {$scheduleAnalysis.workingDays} days
					({$scheduleAnalysis.totalEstimatedHours}h total)
				</p>
			{/if}
		</div>
		<div class="header-actions">
			<button 
				class="btn btn-secondary" 
				on:click={optimizeSchedule}
				disabled={$isOptimizing || $activeTasks.length === 0}
			>
				{#if $isOptimizing}
					<span class="loading"></span> Optimizing...
				{:else}
					🎯 Optimize Schedule
				{/if}
			</button>
			<button class="btn btn-primary" on:click={openAddModal}>
				+ Add Task
			</button>
		</div>
	</div>
	
	<!-- Task Filters -->
	<div class="filters-section">
		<div class="filter-tabs">
			<button 
				class="filter-tab"
				class:active={filter === 'active'}
				on:click={() => filter = 'active'}
			>
				Active ({$activeTasks.length})
			</button>
			<button 
				class="filter-tab"
				class:active={filter === 'overdue'}
				on:click={() => filter = 'overdue'}
			>
				Overdue ({$overdueTasks.length})
			</button>
			<button 
				class="filter-tab"
				class:active={filter === 'completed'}
				on:click={() => filter = 'completed'}
			>
				Completed ({$completedTasks.length})
			</button>
			<button 
				class="filter-tab"
				class:active={filter === 'all'}
				on:click={() => filter = 'all'}
			>
				All ({$tasks.length})
			</button>
		</div>
	</div>
	
	<!-- Tasks List -->
	<div class="tasks-content">
		{#if filter === 'active'}
			<!-- Group by priority for active tasks -->
			{#each Object.entries(tasksByPriority) as [priority, priorityTasks]}
				{#if priorityTasks.length > 0}
					<section class="priority-section">
						<h2 class="priority-header">
							<span class="priority-dot" style="background-color: {getPriorityColor(priority)}"></span>
							{priority.charAt(0).toUpperCase() + priority.slice(1)} Priority ({priorityTasks.length})
						</h2>
						
						<div class="tasks-grid">
							{#each priorityTasks as task}
								<div class="task-card card" class:overdue={isOverdue(task.deadline)}>
									<div class="task-header">
										<h3 class="task-title">{task.title}</h3>
										<span class="task-hours">{task.estimatedHours}h</span>
									</div>
									
									{#if task.description}
										<p class="task-description">{task.description}</p>
									{/if}
									
									<div class="task-meta">
										{#if task.deadline}
											<span class="task-deadline" class:overdue={isOverdue(task.deadline)}>
												📅 {formatDate(task.deadline)}
											</span>
										{/if}
										
										{#if task.sourceNodeId}
											<span class="task-source">🌳 From branch node</span>
										{/if}
									</div>
									
									<div class="task-actions">
										<button 
											class="btn btn-success btn-sm"
											on:click={() => completeTask(task.id)}
										>
											✓ Complete
										</button>
										<button 
											class="btn btn-secondary btn-sm"
											on:click={() => console.log('Edit task:', task.id)}
										>
											✏️ Edit
										</button>
									</div>
								</div>
							{/each}
						</div>
					</section>
				{/if}
			{/each}
		{:else}
			<!-- Simple list for other filters -->
			<div class="tasks-grid">
				{#each filteredTasks as task}
					<div class="task-card card" class:completed={task.status === 'completed'} class:overdue={isOverdue(task.deadline)}>
						<div class="task-header">
							<h3 class="task-title">{task.title}</h3>
							<div class="task-meta-inline">
								<span class="priority-badge" style="background-color: {getPriorityColor(task.priority)}">
									{task.priority.charAt(0).toUpperCase()}
								</span>
								<span class="task-hours">{task.estimatedHours}h</span>
							</div>
						</div>
						
						{#if task.description}
							<p class="task-description">{task.description}</p>
						{/if}
						
						<div class="task-meta">
							{#if task.deadline}
								<span class="task-deadline" class:overdue={isOverdue(task.deadline)}>
									📅 {formatDate(task.deadline)}
								</span>
							{/if}
							
							{#if task.completedAt}
								<span class="task-completed">
									✅ Completed {formatDate(task.completedAt)}
								</span>
							{/if}
							
							{#if task.sourceNodeId}
								<span class="task-source">🌳 From branch node</span>
							{/if}
						</div>
						
						{#if task.status !== 'completed'}
							<div class="task-actions">
								<button 
									class="btn btn-success btn-sm"
									on:click={() => completeTask(task.id)}
								>
									✓ Complete
								</button>
								<button 
									class="btn btn-secondary btn-sm"
									on:click={() => console.log('Edit task:', task.id)}
								>
									✏️ Edit
								</button>
							</div>
						{/if}
					</div>
				{:else}
					<div class="empty-state">
						<p>No {filter} tasks found</p>
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

<!-- Add Task Modal -->
{#if showAddModal}
	<div class="modal-overlay" on:click={closeAddModal}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Add New Task</h3>
				<button class="modal-close" on:click={closeAddModal}>×</button>
			</div>
			
			<form on:submit|preventDefault={addTask}>
				<div class="form-group">
					<label class="form-label" for="title">Title:</label>
					<input 
						id="title"
						type="text" 
						bind:value={newTaskTitle}
						placeholder="Enter task title..."
						class="w-full"
						required
					/>
				</div>
				
				<div class="form-group">
					<label class="form-label" for="description">Description:</label>
					<textarea 
						id="description"
						bind:value={newTaskDescription}
						placeholder="Add details..."
						class="w-full"
						rows="3"
					></textarea>
				</div>
				
				<div class="form-row">
					<div class="form-group">
						<label class="form-label" for="priority">Priority:</label>
						<select id="priority" bind:value={newTaskPriority} class="w-full">
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
						</select>
					</div>
					
					<div class="form-group">
						<label class="form-label" for="hours">Estimated Hours:</label>
						<input 
							id="hours"
							type="number" 
							bind:value={newTaskEstimatedHours}
							min="0.5"
							step="0.5"
							class="w-full"
						/>
					</div>
				</div>
				
				<div class="form-group">
					<label class="form-label" for="deadline">Deadline (optional):</label>
					<input 
						id="deadline"
						type="date" 
						bind:value={newTaskDeadline}
						class="w-full"
					/>
				</div>
				
				<div class="modal-actions">
					<button type="button" class="btn btn-secondary" on:click={closeAddModal}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						Add Task
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.tasks-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem;
	}
	
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color);
	}
	
	.header-left h1 {
		color: var(--text-primary);
		margin: 0 0 0.5rem 0;
	}
	
	.schedule-summary {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin: 0;
	}
	
	.header-actions {
		display: flex;
		gap: 1rem;
		align-items: center;
	}
	
	.filters-section {
		margin-bottom: 2rem;
	}
	
	.filter-tabs {
		display: flex;
		gap: 0.5rem;
		flex-wrap: wrap;
	}
	
	.filter-tab {
		background: var(--gray-100);
		border: 1px solid var(--border-color);
		color: var(--text-secondary);
		padding: 0.5rem 1rem;
		border-radius: var(--radius);
		cursor: pointer;
		transition: all 0.2s;
		font-size: 0.875rem;
	}
	
	.filter-tab:hover {
		background: var(--gray-200);
	}
	
	.filter-tab.active {
		background: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
	}
	
	.priority-section {
		margin-bottom: 2rem;
	}
	
	.priority-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	
	.priority-dot {
		width: 12px;
		height: 12px;
		border-radius: 50%;
	}
	
	.tasks-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
		gap: 1rem;
	}
	
	.task-card {
		transition: all 0.2s;
		border-left: 4px solid var(--primary-color);
	}
	
	.task-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
	
	.task-card.completed {
		opacity: 0.7;
		border-left-color: var(--success-color);
	}
	
	.task-card.overdue {
		border-left-color: var(--error-color);
		background: rgba(239, 68, 68, 0.05);
	}
	
	.task-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
	}
	
	.task-title {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--text-primary);
		flex: 1;
	}
	
	.task-hours {
		background: var(--gray-100);
		color: var(--text-secondary);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius);
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.task-meta-inline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.priority-badge {
		color: white;
		width: 24px;
		height: 24px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: bold;
	}
	
	.task-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin: 0.5rem 0;
		line-height: 1.4;
	}
	
	.task-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 0.75rem 0;
		font-size: 0.875rem;
	}
	
	.task-deadline {
		color: var(--text-secondary);
	}
	
	.task-deadline.overdue {
		color: var(--error-color);
		font-weight: 600;
	}
	
	.task-completed {
		color: var(--success-color);
	}
	
	.task-source {
		color: var(--text-secondary);
	}
	
	.task-actions {
		display: flex;
		gap: 0.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--border-color);
	}
	
	.empty-state {
		grid-column: 1 / -1;
		text-align: center;
		padding: 3rem;
		color: var(--gray-500);
		font-style: italic;
	}
	
	/* Modal styles */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	
	.modal {
		background: white;
		border-radius: var(--radius-lg);
		padding: 0;
		width: 90%;
		max-width: 500px;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: var(--shadow-lg);
	}
	
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem;
		border-bottom: 1px solid var(--border-color);
	}
	
	.modal-header h3 {
		margin: 0;
		color: var(--text-primary);
	}
	
	.modal-close {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--gray-500);
		padding: 0;
		width: 30px;
		height: 30px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.modal-close:hover {
		color: var(--text-primary);
	}
	
	.modal form {
		padding: 1.5rem;
	}
	
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1rem;
	}
	
	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}
	
	@media (max-width: 768px) {
		.tasks-grid {
			grid-template-columns: 1fr;
		}
		
		.page-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}
		
		.header-actions {
			justify-content: center;
			flex-wrap: wrap;
		}
		
		.filter-tabs {
			justify-content: center;
		}
		
		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>