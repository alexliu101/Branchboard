<script>
	import { onMount } from 'svelte';
	import { storeActions, todayTasks, activeTasks, focusTimer, triggeredSignals, userSettings, currentSchedule, scheduleAnalysis } from '../lib/stores.js';
	
	let currentTime = new Date();
	let quickNote = '';
	let todaysSchedule = [];
	
	// Sample current branch data (in real app, this would come from active branch nodes)
	let currentBranch = {
		scenario: 'Project Deadline Dec 1',
		branch: 'On Time',
		confidence: 75,
		signals: ['Client feedback pending', 'Team velocity stable']
	};
	
	onMount(async () => {
		// Initialize data
		await storeActions.initializeData();
		await storeActions.loadSchedule();
		
		// Update time every minute
		const timeInterval = setInterval(() => {
			currentTime = new Date();
			loadTodaysSchedule();
		}, 60000);
		
		loadTodaysSchedule();
		
		return () => {
			clearInterval(timeInterval);
		};
	});
	
	async function loadTodaysSchedule() {
		todaysSchedule = await storeActions.getDailySchedule(new Date());
	}
	
	function startFocusTimer() {
		$focusTimer.start();
	}
	
	function stopFocusTimer() {
		$focusTimer.stop();
	}
	
	function formatTime(seconds) {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
	}
	
	function markTaskComplete(taskId) {
		storeActions.completeTask(taskId);
	}
	
	function addQuickNote() {
		if (quickNote.trim()) {
			storeActions.quickCapture(quickNote, 'task');
			quickNote = '';
		}
	}
	
	$: timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	$: dateString = currentTime.toLocaleDateString([], { 
		weekday: 'long', 
		year: 'numeric', 
		month: 'long', 
		day: 'numeric' 
	});
</script>

<svelte:head>
	<title>Today - Branchboard</title>
</svelte:head>

<div class="today-container">
	<!-- Header with current time and date -->
	<div class="today-header">
		<div class="time-display">
			<div class="current-time">{timeString}</div>
			<div class="current-date">{dateString}</div>
		</div>
		
		<div class="focus-timer">
			<div class="timer-display">{formatTime($focusTimer.timeRemaining)}</div>
			<div class="timer-controls">
				{#if !$focusTimer.isRunning}
					<button class="btn btn-primary btn-sm" on:click={startFocusTimer}>
						▶️ Start Focus
					</button>
				{:else}
					<button class="btn btn-secondary btn-sm" on:click={stopFocusTimer}>
						⏹️ Stop
					</button>
				{/if}
			</div>
		</div>
	</div>

	<!-- Current Branch Card -->
	<div class="current-branch-card card">
		<div class="card-title">🎯 Current Branch</div>
		<div class="branch-info">
			<div class="branch-scenario">
				<strong>{currentBranch.scenario}</strong> → {currentBranch.branch}
			</div>
			<div class="branch-confidence">
				Confidence: {currentBranch.confidence}%
			</div>
			<div class="branch-signals">
				<strong>Signals:</strong>
				{#each currentBranch.signals as signal}
					<span class="signal-tag">{signal}</span>
				{/each}
			</div>
		</div>
	</div>

	<!-- Today's Tasks - Now/Next/Later -->
	<div class="tasks-section">
		<h2>📋 Today's Focus</h2>
		
		<div class="task-columns grid grid-3">
			<div class="task-column">
				<h3>🔥 Now</h3>
				<div class="tasks-list">
					{#each todaysSchedule.slice(0, 1) as scheduleItem}
						{@const task = scheduleItem.task}
						<div class="task-card card" class:completed={task.status === 'completed'}>
							<div class="task-header">
								<span class="task-title">{task.title}</span>
								<span class="task-duration">{scheduleItem.duration}h</span>
							</div>
							<div class="task-schedule">
								<small class="task-time">
									⏰ {new Date(scheduleItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</small>
							</div>
							<div class="task-actions">
								{#if task.status !== 'completed'}
									<button class="btn btn-success btn-sm" on:click={() => markTaskComplete(task.id)}>
										✓ Complete
									</button>
								{:else}
									<span class="completed-badge">✅ Done</span>
								{/if}
							</div>
						</div>
					{:else}
						<div class="task-card card empty-state">
							<p>No scheduled tasks</p>
							<small>Try optimizing your schedule</small>
						</div>
					{/each}
				</div>
			</div>
			
			<div class="task-column">
				<h3>⏭️ Next</h3>
				<div class="tasks-list">
					{#each todaysSchedule.slice(1, 2) as scheduleItem}
						{@const task = scheduleItem.task}
						<div class="task-card card" class:completed={task.status === 'completed'}>
							<div class="task-header">
								<span class="task-title">{task.title}</span>
								<span class="task-duration">{scheduleItem.duration}h</span>
							</div>
							<div class="task-schedule">
								<small class="task-time">
									⏰ {new Date(scheduleItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</small>
							</div>
							<div class="task-actions">
								{#if task.status !== 'completed'}
									<button class="btn btn-success btn-sm" on:click={() => markTaskComplete(task.id)}>
										✓ Complete
									</button>
								{:else}
									<span class="completed-badge">✅ Done</span>
								{/if}
							</div>
						</div>
					{:else}
						<div class="task-card card empty-state">
							<p>No next tasks</p>
						</div>
					{/each}
				</div>
			</div>
			
			<div class="task-column">
				<h3>📅 Later</h3>
				<div class="tasks-list">
					{#each todaysSchedule.slice(2, 4) as scheduleItem}
						{@const task = scheduleItem.task}
						<div class="task-card card" class:completed={task.status === 'completed'}>
							<div class="task-header">
								<span class="task-title">{task.title}</span>
								<span class="task-duration">{scheduleItem.duration}h</span>
							</div>
							<div class="task-schedule">
								<small class="task-time">
									⏰ {new Date(scheduleItem.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</small>
							</div>
							<div class="task-actions">
								{#if task.status !== 'completed'}
									<button class="btn btn-success btn-sm" on:click={() => markTaskComplete(task.id)}>
										✓ Complete
									</button>
								{:else}
									<span class="completed-badge">✅ Done</span>
								{/if}
							</div>
						</div>
					{:else}
						<div class="task-card card empty-state">
							<p>No later tasks</p>
						</div>
					{/each}
				</div>
			</div>
		</div>
	</div>

	<!-- Quick Capture -->
	<div class="quick-capture card">
		<div class="card-title">💭 Quick Capture</div>
		<div class="capture-form flex gap-2">
			<input 
				type="text" 
				bind:value={quickNote}
				placeholder="Quick note or task..."
				class="w-full"
				on:keydown={(e) => e.key === 'Enter' && addQuickNote()}
			/>
			<button class="btn btn-primary" on:click={addQuickNote}>
				+ Add
			</button>
		</div>
	</div>
</div>

<style>
	.today-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	.today-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		padding: 2rem;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
	}
	
	.time-display .current-time {
		font-size: 3rem;
		font-weight: bold;
		line-height: 1;
	}
	
	.time-display .current-date {
		font-size: 1.25rem;
		opacity: 0.9;
		margin-top: 0.5rem;
	}
	
	.focus-timer {
		text-align: center;
		background: rgba(255, 255, 255, 0.1);
		padding: 1.5rem;
		border-radius: var(--radius);
		backdrop-filter: blur(10px);
	}
	
	.timer-display {
		font-size: 2rem;
		font-weight: bold;
		margin-bottom: 1rem;
	}
	
	.current-branch-card {
		background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
		color: white;
		border: none;
	}
	
	.branch-info {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.branch-scenario {
		font-size: 1.125rem;
	}
	
	.branch-confidence {
		font-size: 0.875rem;
		opacity: 0.9;
	}
	
	.branch-signals {
		font-size: 0.875rem;
	}
	
	.signal-tag {
		display: inline-block;
		background: rgba(255, 255, 255, 0.2);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius);
		margin: 0.25rem 0.25rem 0 0;
		font-size: 0.75rem;
	}
	
	.tasks-section h2 {
		color: var(--text-primary);
		margin-bottom: 1.5rem;
	}
	
	.task-column h3 {
		color: var(--gray-600);
		font-size: 1rem;
		margin-bottom: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	
	.tasks-list {
		display: flex;
		flex-direction: column;
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
	
	.task-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.75rem;
	}
	
	.task-title {
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.task-duration {
		font-size: 0.75rem;
		color: var(--gray-500);
		background: var(--gray-100);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius);
	}
	
	.completed-badge {
		color: var(--success-color);
		font-weight: 500;
		font-size: 0.875rem;
	}
	
	.empty-state {
		opacity: 0.6;
		text-align: center;
		font-style: italic;
	}
	
	.empty-state p {
		color: var(--gray-500);
		margin: 0;
	}
	
	.task-schedule {
		margin: 0.5rem 0;
	}
	
	.task-time {
		color: var(--primary-color);
		font-weight: 500;
	}
	
	.quick-capture {
		position: sticky;
		bottom: 1rem;
		background: white;
		border: 2px solid var(--primary-color);
		box-shadow: var(--shadow-lg);
	}
	
	.capture-form input {
		border: 1px solid var(--border-color);
		padding: 0.75rem;
		border-radius: var(--radius);
	}
	
	@media (max-width: 768px) {
		.today-header {
			flex-direction: column;
			gap: 1.5rem;
			text-align: center;
		}
		
		.time-display .current-time {
			font-size: 2rem;
		}
		
		.task-columns {
			grid-template-columns: 1fr;
		}
		
		.capture-form {
			flex-direction: column;
		}
	}
</style>