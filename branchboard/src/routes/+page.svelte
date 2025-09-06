<script>
	import { onMount } from 'svelte';
	import { storeActions, todayTasks, activeTasks, focusTimer, triggeredSignals, userSettings, currentSchedule, scheduleAnalysis, currentBranches, branchSwitchNotifications, notification } from '../lib/stores.js';
	
	let currentTime = new Date();
	let quickNote = '';
	let todaysSchedule = [];
	
	// Current branch display
	let currentBranchInfo = {};
	let recentSignals = [];
	
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
		loadCurrentBranchInfo();
		
		return () => {
			clearInterval(timeInterval);
		};
	});
	
	async function loadTodaysSchedule() {
		todaysSchedule = await storeActions.getDailySchedule(new Date());
	}
	
	async function loadCurrentBranchInfo() {
		try {
			// Get current branch information
			const branches = await storeActions.getCurrentBranches?.() || $currentBranches;
			
			if (branches.length > 0) {
				// For now, focus on the first current branch
				const branch = branches[0];
				
				// Determine if this is from an event or scenario
				let parentItem = null;
				let parentType = null;
				
				if (branch.eventId) {
					parentItem = await dbUtils.getEvent(branch.eventId);
					parentType = 'event';
				} else if (branch.scenarioId) {
					parentItem = await dbUtils.getScenario(branch.scenarioId);
					parentType = 'scenario';
				}
				
				// Get recent signals for this branch
				const signals = await dbUtils.getSignalsForNode(branch.id);
				const triggeredSignals = signals.filter(s => s.isTriggered);
				
				currentBranchInfo = {
					branch: branch.description,
					parent: parentItem?.title || 'Unknown',
					parentType,
					confidence: 75, // This could be calculated from assumptions
					recentSignals: triggeredSignals.slice(0, 3) // Show up to 3 recent signals
				};
			} else {
				currentBranchInfo = {
					branch: 'No active branch',
					parent: 'Set up scenarios in Upcoming',
					parentType: null,
					confidence: 0,
					recentSignals: []
				};
			}
		} catch (error) {
			console.error('Error loading current branch info:', error);
			currentBranchInfo = {
				branch: 'Error loading branch',
				parent: 'Check your data',
				parentType: null,
				confidence: 0,
				recentSignals: []
			};
		}
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
	
	// Handle branch switch notifications
	async function acceptBranchSwitch(notification) {
		await storeActions.switchBranch(
			notification.eventId,
			notification.scenarioId,
			notification.recommendedBranchId
		);
		storeActions.dismissBranchNotification(notification.id);
		
		// Refresh current branch info
		await loadCurrentBranchInfo();
	}
	
	function dismissBranchNotification(notificationId) {
		storeActions.dismissBranchNotification(notificationId);
	}
	
	// Import dbUtils (this should be handled better)
	import { dbUtils } from '../lib/database.js';
	
	$: timeString = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	$: dateString = currentTime.toLocaleDateString([], { 
		weekday: 'long', 
		year: 'numeric', 
		month: 'long', 
		day: 'numeric' 
	});
	
	// Reactive updates for current branch info
	$: if ($currentBranches) {
		loadCurrentBranchInfo();
	}
</script>

<svelte:head>
	<title>Today - Branchboard</title>
</svelte:head>

<div class="today-container">
	<!-- Branch Switch Notifications -->
	{#each $branchSwitchNotifications as branchNotification}
		<div class="branch-notification">
			<div class="notification-content">
				<div class="notification-header">
					<span class="notification-icon">🔔</span>
					<strong>Signal Triggered</strong>
				</div>
				<div class="notification-details">
					<p>
						<strong>{branchNotification.signalData.signalName}</strong>: 
						{branchNotification.signalData.value} {branchNotification.signalData.direction} {branchNotification.signalData.threshold}
					</p>
					<p>Consider switching to: <strong>"{branchNotification.signalData.branchDescription}"</strong></p>
				</div>
			</div>
			<div class="notification-actions">
				<button 
					class="btn btn-primary btn-sm"
					on:click={() => acceptBranchSwitch(branchNotification)}
				>
					Switch Branch
				</button>
				<button 
					class="btn btn-secondary btn-sm"
					on:click={() => dismissBranchNotification(branchNotification.id)}
				>
					Dismiss
				</button>
			</div>
		</div>
	{/each}

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
				<strong>{currentBranchInfo.parent}</strong> → {currentBranchInfo.branch}
			</div>
			<div class="branch-confidence">
				Confidence: {currentBranchInfo.confidence}%
			</div>
			{#if currentBranchInfo.recentSignals?.length > 0}
				<div class="branch-signals">
					<strong>Active Signals:</strong>
					{#each currentBranchInfo.recentSignals as signal}
						<span class="signal-tag triggered">{signal.metricName}</span>
					{/each}
				</div>
			{:else}
				<div class="branch-signals">
					<strong>Status:</strong>
					<span class="signal-tag">Monitoring for changes</span>
				</div>
			{/if}
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
	
	.branch-notification {
		background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
		color: white;
		border-radius: var(--radius-lg);
		padding: 1rem;
		margin-bottom: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: var(--shadow-md);
		animation: slideIn 0.3s ease-out;
	}
	
	@keyframes slideIn {
		from {
			opacity: 0;
			transform: translateY(-20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	.notification-content {
		flex: 1;
	}
	
	.notification-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		font-size: 1rem;
	}
	
	.notification-icon {
		font-size: 1.25rem;
	}
	
	.notification-details p {
		margin: 0.25rem 0;
		font-size: 0.875rem;
	}
	
	.notification-actions {
		display: flex;
		gap: 0.5rem;
	}
	
	.notification-actions .btn {
		background: rgba(255, 255, 255, 0.2);
		border: 1px solid rgba(255, 255, 255, 0.3);
		color: white;
		backdrop-filter: blur(10px);
	}
	
	.notification-actions .btn:hover {
		background: rgba(255, 255, 255, 0.3);
	}
	
	.notification-actions .btn-primary {
		background: rgba(255, 255, 255, 0.9);
		color: var(--warning-color);
	}
	
	.notification-actions .btn-primary:hover {
		background: white;
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
	
	.signal-tag.triggered {
		background: rgba(255, 255, 255, 0.3);
		border: 1px solid rgba(255, 255, 255, 0.5);
		animation: pulse 2s infinite;
	}
	
	@keyframes pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
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
		
		.branch-notification {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}
		
		.notification-actions {
			justify-content: center;
		}
	}
</style>