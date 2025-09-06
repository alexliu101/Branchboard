<script>
	import { onMount } from 'svelte';
	import { storeActions, scenarios, currentBranches, activeTasks, tasks } from '../../lib/stores.js';
	import { dbUtils } from '../../lib/database.js';
	
	let allAssumptions = [];
	let allRisks = [];
	let allSignals = [];
	let weeklyStats = {};
	let reviewChecklist = [];
	let expiredOptions = [];
	let loading = false;
	
	onMount(async () => {
		await loadReviewData();
	});
	
	async function loadReviewData() {
		loading = true;
		try {
			// Load all assumptions, risks, and signals
			const events = await dbUtils.getAllEvents();
			const scenarios = await dbUtils.getAllScenarios();
			
			// Collect all assumptions and risks
			allAssumptions = [];
			allRisks = [];
			allSignals = [];
			
			// From scenarios
			for (const scenario of scenarios) {
				const assumptions = await dbUtils.getAssumptionsForScenario(scenario.id);
				const risks = await dbUtils.getRisksForScenario(scenario.id);
				
				allAssumptions.push(...assumptions.map(a => ({ ...a, context: `Scenario: ${scenario.title}` })));
				allRisks.push(...risks.map(r => ({ ...r, context: `Scenario: ${scenario.title}` })));
			}
			
			// From events
			for (const event of events) {
				const assumptions = await dbUtils.getAssumptionsForEvent(event.id);
				const risks = await dbUtils.getRisksForEvent(event.id);
				
				allAssumptions.push(...assumptions.map(a => ({ ...a, context: `Event: ${event.title}` })));
				allRisks.push(...risks.map(r => ({ ...r, context: `Event: ${event.title}` })));
			}
			
			// From branch nodes
			const allBranchNodes = [];
			for (const scenario of scenarios) {
				const nodes = await dbUtils.getBranchNodesForScenario(scenario.id);
				allBranchNodes.push(...nodes);
			}
			for (const event of events) {
				const nodes = await dbUtils.getBranchNodesForEvent(event.id);
				allBranchNodes.push(...nodes);
			}
			
			for (const node of allBranchNodes) {
				const signals = await dbUtils.getSignalsForNode(node.id);
				allSignals.push(...signals.map(s => ({ ...s, context: `Node: ${node.description}` })));
			}
			
			// Generate weekly stats
			const now = new Date();
			const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
			const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
			
			const thisWeekTasks = $tasks.filter(task => {
				const createdAt = new Date(task.createdAt);
				const completedAt = task.completedAt ? new Date(task.completedAt) : null;
				return createdAt >= weekStart && createdAt <= weekEnd ||
				       (completedAt && completedAt >= weekStart && completedAt <= weekEnd);
			});
			
			weeklyStats = {
				tasksCreated: thisWeekTasks.filter(t => new Date(t.createdAt) >= weekStart).length,
				tasksCompleted: thisWeekTasks.filter(t => t.status === 'completed' && t.completedAt).length,
				branchSwitches: 0, // This would need to be tracked in the future
				signalsTriggered: allSignals.filter(s => s.isTriggered).length
			};
			
			// Build review checklist
			reviewChecklist = [
				{
					id: 'assumptions',
					title: 'Review Assumptions',
					description: `Review ${allAssumptions.length} assumptions for accuracy`,
					completed: false,
					critical: allAssumptions.some(a => a.confidence < 50)
				},
				{
					id: 'risks',
					title: 'Update Risk Status',
					description: `Check ${allRisks.length} identified risks for changes`,
					completed: false,
					critical: allRisks.some(r => r.likelihood === 'high' && r.impact === 'high')
				},
				{
					id: 'signals',
					title: 'Update Signal Values',
					description: `Update values for ${allSignals.length} monitoring signals`,
					completed: false,
					critical: allSignals.some(s => !s.currentValue)
				},
				{
					id: 'branches',
					title: 'Validate Current Branches',
					description: `Verify ${$currentBranches.length} current branch selections are still accurate`,
					completed: false,
					critical: $currentBranches.length === 0
				},
				{
					id: 'schedule',
					title: 'Optimize Next Week',
					description: 'Re-run schedule optimization with updated priorities',
					completed: false,
					critical: false
				}
			];
			
			// Find expired options (decisions with deadlines)
			expiredOptions = await dbUtils.getExpiringDecisions(30);
			
		} catch (error) {
			console.error('Error loading review data:', error);
		} finally {
			loading = false;
		}
	}
	
	function toggleChecklistItem(itemId) {
		reviewChecklist = reviewChecklist.map(item => 
			item.id === itemId ? { ...item, completed: !item.completed } : item
		);
	}
	
	async function updateAssumption(assumption, field, value) {
		try {
			await dbUtils.updateAssumption(assumption.id, { [field]: value });
			await loadReviewData();
		} catch (error) {
			console.error('Error updating assumption:', error);
		}
	}
	
	async function updateRisk(risk, field, value) {
		try {
			await dbUtils.updateRisk(risk.id, { [field]: value });
			await loadReviewData();
		} catch (error) {
			console.error('Error updating risk:', error);
		}
	}
	
	async function completeReview() {
		// Mark all checklist items as complete
		reviewChecklist = reviewChecklist.map(item => ({ ...item, completed: true }));
		
		// Re-optimize schedule for next week
		await storeActions.optimizeSchedule();
		
		// Show completion notification
		storeActions.showNotification('Weekly review completed! Schedule updated for next week', 'success', 5000);
	}
	
	function getDaysLeftColor(days) {
		if (days <= 1) return 'var(--error-color)';
		if (days <= 3) return 'var(--warning-color)';
		return 'var(--success-color)';
	}
	
	function formatDate(dateStr) {
		return new Date(dateStr).toLocaleDateString([], { 
			weekday: 'short',
			month: 'short', 
			day: 'numeric'
		});
	}
	
	$: completedItems = reviewChecklist.filter(item => item.completed).length;
	$: totalItems = reviewChecklist.length;
	$: reviewProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
</script>

<svelte:head>
	<title>Weekly Review - Branchboard</title>
</svelte:head>

<div class="review-container">
	<div class="page-header">
		<div class="header-content">
			<h1>🔄 Weekly Review</h1>
			<p class="page-subtitle">Keep your plans aligned with reality</p>
		</div>
		<div class="progress-indicator">
			<div class="progress-circle">
				<div class="progress-text">{completedItems}/{totalItems}</div>
			</div>
			<span class="progress-label">Review Progress</span>
		</div>
	</div>
	
	{#if loading}
		<div class="loading-container">
			<div class="loading"></div>
			<p>Loading review data...</p>
		</div>
	{:else}
		<div class="review-content">
			<!-- Weekly Stats Overview -->
			<section class="review-section card">
				<h2>📊 This Week's Summary</h2>
				<div class="stats-grid">
					<div class="stat-card">
						<div class="stat-number">{weeklyStats.tasksCreated}</div>
						<div class="stat-label">Tasks Created</div>
					</div>
					<div class="stat-card">
						<div class="stat-number">{weeklyStats.tasksCompleted}</div>
						<div class="stat-label">Tasks Completed</div>
					</div>
					<div class="stat-card">
						<div class="stat-number">{weeklyStats.branchSwitches}</div>
						<div class="stat-label">Branch Switches</div>
					</div>
					<div class="stat-card">
						<div class="stat-number">{weeklyStats.signalsTriggered}</div>
						<div class="stat-label">Signals Triggered</div>
					</div>
				</div>
			</section>
			
			<!-- Review Checklist -->
			<section class="review-section card">
				<h2>✅ Review Checklist</h2>
				<div class="checklist">
					{#each reviewChecklist as item}
						<div class="checklist-item" class:completed={item.completed} class:critical={item.critical}>
							<div class="item-header" on:click={() => toggleChecklistItem(item.id)}>
								<div class="checkbox-wrapper">
									<input 
										type="checkbox" 
										checked={item.completed}
										on:change={() => toggleChecklistItem(item.id)}
									/>
									<div class="item-content">
										<h4 class="item-title">{item.title}</h4>
										<p class="item-description">{item.description}</p>
									</div>
								</div>
								{#if item.critical}
									<span class="critical-badge">❗ Critical</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</section>
			
			<!-- Option Expiry Tracking -->
			<section class="review-section card">
				<h2>⏰ Option Expiry</h2>
				<p class="section-subtitle">Decisions with approaching deadlines</p>
				<div class="expiry-list">
					{#each expiredOptions as option}
						<div class="expiry-item" class:urgent={option.daysLeft <= 3}>
							<div class="expiry-header">
								<div class="option-title">{option.description}</div>
								<div class="days-left" style="color: {getDaysLeftColor(option.daysLeft)}">
									{option.daysLeft > 0 ? `${option.daysLeft}d left` : 'EXPIRED'}
								</div>
							</div>
							<div class="expiry-details">
								<span class="scenario-tag">📍 {option.context}</span>
								<span class="deadline-tag">🗓️ {formatDate(option.decisionDeadline)}</span>
							</div>
						</div>
					{:else}
						<div class="empty-state">
							<p>No upcoming decision deadlines</p>
							<small>Decision nodes with deadlines will appear here</small>
						</div>
					{/each}
				</div>
			</section>
			
			<!-- Assumptions Review -->
			<section class="review-section card">
				<h2>💭 Assumptions Review</h2>
				<div class="assumptions-list">
					{#each allAssumptions as assumption}
						<div class="assumption-review-item">
							<div class="assumption-content">
								<div class="assumption-statement">{assumption.statement}</div>
								<div class="assumption-context">{assumption.context}</div>
							</div>
							<div class="assumption-controls">
								<label>Confidence:</label>
								<input 
									type="range" 
									min="0" 
									max="100" 
									value={assumption.confidence}
									on:change={(e) => updateAssumption(assumption, 'confidence', parseInt(e.target.value))}
								/>
								<span class="confidence-value">{assumption.confidence}%</span>
							</div>
						</div>
					{:else}
						<div class="empty-state">
							<p>No assumptions to review</p>
							<small>Assumptions defined in branch maps will appear here</small>
						</div>
					{/each}
				</div>
			</section>
			
			<!-- Risks Review -->
			<section class="review-section card">
				<h2>⚠️ Risks Review</h2>
				<div class="risks-list">
					{#each allRisks as risk}
						<div class="risk-review-item">
							<div class="risk-header">
								<div class="risk-description">{risk.description}</div>
								<div class="risk-badges">
									<select 
										value={risk.likelihood} 
										on:change={(e) => updateRisk(risk, 'likelihood', e.target.value)}
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
									</select>
									<select 
										value={risk.impact} 
										on:change={(e) => updateRisk(risk, 'impact', e.target.value)}
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
									</select>
								</div>
							</div>
							<div class="risk-context">{risk.context}</div>
							{#if risk.mitigation}
								<div class="risk-detail">
									<strong>Mitigation:</strong> {risk.mitigation}
								</div>
							{/if}
						</div>
					{:else}
						<div class="empty-state">
							<p>No risks to review</p>
							<small>Risks identified in branch maps will appear here</small>
						</div>
					{/each}
				</div>
			</section>
			
			<!-- Complete Review -->
			<section class="review-actions">
				<div class="completion-status">
					<div class="progress-bar-large">
						<div class="progress-fill" style="width: {reviewProgress}%"></div>
					</div>
					<p class="progress-text">
						{completedItems} of {totalItems} review items completed 
						{#if reviewProgress === 100}
							<span class="completion-badge">🎉 Ready to complete!</span>
						{/if}
					</p>
				</div>
				
				<div class="action-buttons">
					<button 
						class="btn btn-secondary" 
						on:click={loadReviewData}
					>
						🔄 Refresh Data
					</button>
					
					<button 
						class="btn btn-primary btn-lg" 
						on:click={completeReview}
						disabled={reviewProgress < 100}
					>
						✅ Complete Review & Optimize Next Week
					</button>
				</div>
			</section>
		</div>
	{/if}
</div>

<style>
	.review-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1rem;
	}
	
	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding: 2rem;
		background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
		color: white;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-lg);
	}
	
	.header-content h1 {
		margin: 0 0 0.5rem 0;
		font-size: 2rem;
	}
	
	.page-subtitle {
		margin: 0;
		opacity: 0.9;
		font-size: 1.125rem;
	}
	
	.progress-indicator {
		text-align: center;
	}
	
	.progress-circle {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		margin: 0 auto 0.5rem;
		border: 3px solid rgba(255, 255, 255, 0.3);
	}
	
	.progress-text {
		font-size: 1.25rem;
		font-weight: bold;
	}
	
	.progress-label {
		font-size: 0.875rem;
		opacity: 0.8;
	}
	
	.review-content {
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}
	
	.review-section {
		background: var(--bg-primary);
		border-radius: var(--radius-lg);
		padding: 2rem;
	}
	
	.review-section h2 {
		margin: 0 0 1.5rem 0;
		color: var(--text-primary);
		font-size: 1.5rem;
	}
	
	.section-subtitle {
		color: var(--text-secondary);
		margin: 0 0 1rem 0;
		font-size: 0.875rem;
	}
	
	.stats-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 1rem;
	}
	
	.stat-card {
		background: var(--gray-50);
		padding: 1.5rem;
		border-radius: var(--radius);
		text-align: center;
	}
	
	.stat-number {
		font-size: 2rem;
		font-weight: bold;
		color: var(--primary-color);
		margin-bottom: 0.25rem;
	}
	
	.stat-label {
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.checklist {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.checklist-item {
		border: 2px solid var(--border-color);
		border-radius: var(--radius);
		transition: all 0.2s;
	}
	
	.checklist-item.critical {
		border-color: var(--warning-color);
		background: rgba(245, 158, 11, 0.05);
	}
	
	.checklist-item.completed {
		border-color: var(--success-color);
		background: rgba(16, 185, 129, 0.05);
	}
	
	.item-header {
		padding: 1rem;
		cursor: pointer;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.checkbox-wrapper {
		display: flex;
		align-items: flex-start;
		gap: 1rem;
		flex: 1;
	}
	
	.checkbox-wrapper input[type="checkbox"] {
		margin-top: 0.25rem;
		transform: scale(1.2);
	}
	
	.item-content {
		flex: 1;
	}
	
	.item-title {
		margin: 0 0 0.25rem 0;
		font-size: 1.125rem;
		color: var(--text-primary);
	}
	
	.item-description {
		margin: 0;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.critical-badge {
		background: var(--warning-color);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius);
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.expiry-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.expiry-item {
		padding: 1rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		transition: all 0.2s;
	}
	
	.expiry-item.urgent {
		border-color: var(--error-color);
		background: rgba(239, 68, 68, 0.05);
	}
	
	.expiry-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	
	.option-title {
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.days-left {
		font-weight: 600;
		font-size: 0.875rem;
	}
	
	.expiry-details {
		display: flex;
		gap: 1rem;
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.scenario-tag, .deadline-tag {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	
	.assumptions-list, .risks-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		max-height: 400px;
		overflow-y: auto;
	}
	
	.assumption-review-item, .risk-review-item {
		padding: 1rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		background: var(--gray-50);
	}
	
	.assumption-statement, .risk-description {
		font-weight: 500;
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.assumption-context, .risk-context {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
	}
	
	.assumption-controls {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.assumption-controls label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.assumption-controls input[type="range"] {
		flex: 1;
	}
	
	.confidence-value {
		font-weight: 500;
		color: var(--primary-color);
	}
	
	.risk-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 0.5rem;
	}
	
	.risk-badges {
		display: flex;
		gap: 0.5rem;
	}
	
	.risk-badges select {
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		border-radius: var(--radius);
	}
	
	.risk-detail {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid var(--border-color);
	}
	
	.review-actions {
		background: var(--bg-primary);
		padding: 2rem;
		border-radius: var(--radius-lg);
		box-shadow: var(--shadow-sm);
		text-align: center;
	}
	
	.completion-status {
		margin-bottom: 2rem;
	}
	
	.progress-bar-large {
		height: 12px;
		background: var(--gray-200);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 1rem;
	}
	
	.progress-fill {
		height: 100%;
		background: var(--primary-color);
		border-radius: 6px;
		transition: width 0.3s ease;
	}
	
	.progress-text {
		font-size: 1.125rem;
		color: var(--text-secondary);
		margin: 0;
	}
	
	.completion-badge {
		color: var(--success-color);
		font-weight: 500;
		margin-left: 0.5rem;
	}
	
	.action-buttons {
		display: flex;
		gap: 1rem;
		justify-content: center;
	}
	
	.empty-state {
		text-align: center;
		padding: 2rem;
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
	
	.loading-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 300px;
		color: var(--text-secondary);
	}
	
	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			gap: 1.5rem;
			text-align: center;
		}
		
		.stats-grid {
			grid-template-columns: repeat(2, 1fr);
		}
		
		.action-buttons {
			flex-direction: column;
			align-items: center;
		}
		
		.assumption-controls {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}
		
		.expiry-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.5rem;
		}
		
		.risk-header {
			flex-direction: column;
			align-items: stretch;
			gap: 0.5rem;
		}
	}
</style>