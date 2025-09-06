<script>
	import { onMount } from 'svelte';
	import { storeActions, events, scenarios, upcomingEvents } from '../lib/stores.js';
	import Calendar from '../lib/Calendar.svelte';
	
	let showAddModal = false;
	let newItemType = 'event';
	let newItemTitle = '';
	let newItemDate = '';
	let newItemDescription = '';
	
	onMount(async () => {
		// Initialize data if not already loaded
		if ($events.length === 0 || $scenarios.length === 0) {
			await storeActions.initializeData();
		}
	});
	
	function openAddModal() {
		showAddModal = true;
		newItemTitle = '';
		newItemDate = '';
		newItemDescription = '';
	}
	
	function closeAddModal() {
		showAddModal = false;
	}
	
	async function addItem() {
		if (!newItemTitle.trim()) return;
		
		if (newItemType === 'event') {
			await storeActions.createEvent({
				title: newItemTitle,
				start: newItemDate ? new Date(newItemDate + 'T09:00:00').toISOString() : new Date().toISOString(),
				end: newItemDate ? new Date(newItemDate + 'T18:00:00').toISOString() : new Date(Date.now() + 32400000).toISOString(), // +9 hours
				description: newItemDescription
			});
		} else {
			await storeActions.createScenario({
				title: newItemTitle,
				description: newItemDescription,
				priority: 'medium'
			});
		}
		
		closeAddModal();
	}
	
	function openBranchMap(item) {
		// Navigate to the branch map for this item
		const itemType = item.start ? 'event' : 'scenario';
		window.location.href = `/branch-map/${item.id}?type=${itemType}`;
	}
	
	async function createBranchMap(item) {
		// Mark the item as having a branch map
		if (item.start) { // it's an event
			await storeActions.updateEvent(item.id, { hasBranchMap: true });
		} else { // it's a scenario
			await storeActions.updateScenario(item.id, { hasBranchMap: true });
		}
		openBranchMap(item);
	}

	function handleEventClick(event) {
		if (event.hasBranchMap) {
			openBranchMap(event);
		} else {
			createBranchMap(event);
		}
	}

	function handleDateClick(date) {
		// Open add modal with the selected date
		newItemType = 'event';
		newItemDate = date.toISOString().split('T')[0];
		openAddModal();
	}
	
	function getPriorityColor(priority) {
		switch (priority) {
			case 'high': return 'var(--error-color)';
			case 'medium': return 'var(--warning-color)';
			case 'low': return 'var(--success-color)';
			default: return 'var(--gray-400)';
		}
	}
	
	// Sort events by date
	$: sortedEvents = $upcomingEvents;
	
	// Group scenarios by priority
	$: groupedScenarios = {
		high: $scenarios.filter(s => s.priority === 'high'),
		medium: $scenarios.filter(s => s.priority === 'medium'),
		low: $scenarios.filter(s => s.priority === 'low')
	};
</script>

<svelte:head>
	<title>Upcoming - Branchboard</title>
</svelte:head>

<div class="upcoming-container">
	<div class="page-header">
		<h1>📅 Upcoming</h1>
		<button class="btn btn-primary" on:click={openAddModal}>
			+ Add Event/Scenario
		</button>
	</div>

	<div class="content-grid">
		<!-- Calendar Section (Events with dates) -->
		<section class="events-section">
			<h2>🗓️ Calendar Events</h2>
			
			<!-- FullCalendar integration -->
			<div class="calendar-container">
				<Calendar 
					events={$events} 
					onEventClick={handleEventClick}
					onDateClick={handleDateClick}
				/>
			</div>
		</section>

		<!-- Scenarios Section (Undated what-ifs) -->
		<section class="scenarios-section">
			<h2>🤔 Scenarios & What-Ifs</h2>
			
			{#each Object.entries(groupedScenarios) as [priority, scenarioList]}
				{#if scenarioList.length > 0}
					<div class="priority-group">
						<h3 class="priority-header">
							<span class="priority-dot" style="background-color: {getPriorityColor(priority)}"></span>
							{priority.charAt(0).toUpperCase() + priority.slice(1)} Priority
						</h3>
						
						<div class="scenarios-list">
							{#each scenarioList as scenario}
								<div class="scenario-item card" on:click={() => scenario.hasBranchMap ? openBranchMap(scenario) : createBranchMap(scenario)}>
									<div class="scenario-header">
										<div class="scenario-title">{scenario.title}</div>
										<div class="scenario-priority" style="color: {getPriorityColor(scenario.priority)}">
											{scenario.priority.toUpperCase()}
										</div>
									</div>
									<div class="scenario-description">{scenario.description}</div>
									<div class="scenario-actions">
										{#if scenario.hasBranchMap}
											<span class="branch-indicator">🌳 Has Branch Map</span>
										{:else}
											<span class="no-branch">➕ Add Branch Map</span>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/each}
		</section>
	</div>
</div>

<!-- Add Item Modal -->
{#if showAddModal}
	<div class="modal-overlay" on:click={closeAddModal}>
		<div class="modal" on:click|stopPropagation>
			<div class="modal-header">
				<h3>Add New {newItemType === 'event' ? 'Event' : 'Scenario'}</h3>
				<button class="modal-close" on:click={closeAddModal}>×</button>
			</div>
			
			<form on:submit|preventDefault={addItem}>
				<div class="form-group">
					<label class="form-label">Type:</label>
					<select bind:value={newItemType} class="w-full">
						<option value="event">📅 Event (has specific date)</option>
						<option value="scenario">🤔 Scenario (what-if, undated)</option>
					</select>
				</div>
				
				<div class="form-group">
					<label class="form-label" for="title">Title:</label>
					<input 
						id="title"
						type="text" 
						bind:value={newItemTitle}
						placeholder="Enter title..."
						class="w-full"
						required
					/>
				</div>
				
				{#if newItemType === 'event'}
					<div class="form-group">
						<label class="form-label" for="date">Date:</label>
						<input 
							id="date"
							type="date" 
							bind:value={newItemDate}
							class="w-full"
							required
						/>
					</div>
				{/if}
				
				<div class="form-group">
					<label class="form-label" for="description">Description:</label>
					<textarea 
						id="description"
						bind:value={newItemDescription}
						placeholder="Add details..."
						class="w-full"
						rows="3"
					></textarea>
				</div>
				
				<div class="modal-actions">
					<button type="button" class="btn btn-secondary" on:click={closeAddModal}>
						Cancel
					</button>
					<button type="submit" class="btn btn-primary">
						Add {newItemType === 'event' ? 'Event' : 'Scenario'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<style>
	.upcoming-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem;
	}
	
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 2px solid var(--border-color);
	}
	
	.page-header h1 {
		color: var(--text-primary);
		margin: 0;
	}
	
	.content-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}
	
	.events-section, .scenarios-section {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.events-section h2, .scenarios-section h2 {
		color: var(--text-primary);
		margin: 0;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border-color);
	}
	
	.calendar-container {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		overflow: hidden;
		box-shadow: var(--shadow-sm);
	}
	
	.scenario-item {
		cursor: pointer;
		transition: all 0.2s;
		border-left: 4px solid var(--primary-color);
	}
	
	.scenario-item:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
	
	.scenario-title {
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 0.25rem;
	}
	
	.scenario-description {
		color: var(--text-secondary);
		font-size: 0.875rem;
		margin-bottom: 0.5rem;
	}
	
	.priority-group {
		margin-bottom: 1.5rem;
	}
	
	.priority-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 1rem;
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		text-transform: capitalize;
	}
	
	.priority-dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
	}
	
	.scenarios-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}
	
	.scenario-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.25rem;
	}
	
	.scenario-priority {
		font-size: 0.75rem;
		font-weight: 600;
		background: var(--gray-100);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius);
	}
	
	.branch-indicator {
		color: var(--success-color);
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.no-branch {
		color: var(--gray-500);
		font-size: 0.75rem;
	}
	
	.empty-state {
		text-align: center;
		padding: 2rem;
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
	
	.modal-actions {
		display: flex;
		gap: 1rem;
		justify-content: flex-end;
		margin-top: 2rem;
	}
	
	@media (max-width: 1024px) {
		.content-grid {
			grid-template-columns: 1fr;
		}
	}
	
	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			gap: 1rem;
			align-items: stretch;
		}
		
		.modal {
			width: 95%;
			margin: 1rem;
		}
	}
</style>