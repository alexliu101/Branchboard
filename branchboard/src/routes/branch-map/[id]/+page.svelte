<script>
	import { onMount } from 'svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { storeActions } from '../../../lib/stores.js';
	import { dbUtils } from '../../../lib/database.js';
	import BranchMap from '../../../lib/BranchMap.svelte';
	
	let item = null;
	let itemType = null;
	let loading = true;
	let error = null;
	
	$: itemId = parseInt($page.params.id);
	$: itemTypeParam = $page.url.searchParams.get('type') || 'event';
	
	onMount(async () => {
		await loadItem();
	});
	
	async function loadItem() {
		loading = true;
		error = null;
		
		try {
			if (itemTypeParam === 'event') {
				item = await dbUtils.getEvent(itemId);
				itemType = 'event';
			} else {
				item = await dbUtils.getScenario(itemId);
				itemType = 'scenario';
			}
			
			if (!item) {
				error = 'Item not found';
			}
		} catch (err) {
			error = 'Error loading item: ' + err.message;
		} finally {
			loading = false;
		}
	}
	
	function handleNodeAdded(event) {
		console.log('Node added:', event.detail);
	}
	
	function handleEdgeAdded(event) {
		console.log('Edge added:', event.detail);
	}
	
	function handleNodeUpdated(event) {
		console.log('Node updated:', event.detail);
	}
	
	function handleNodeDeleted(event) {
		console.log('Node deleted:', event.detail);
	}
	
	function handleCurrentBranchChanged(event) {
		console.log('Current branch changed:', event.detail);
		storeActions.showNotification('Current branch updated', 'success');
	}
	
	async function handleMarkAsTask(event) {
		const { nodeId, nodeData } = event.detail;
		
		try {
			await storeActions.createTask({
				title: `Task: ${nodeData.description}`,
				description: `Generated from branch node: ${nodeData.description}`,
				sourceNodeId: nodeId,
				priority: 'medium',
				estimatedHours: 1
			});
			
			storeActions.showNotification('Task created from branch node', 'success');
		} catch (error) {
			console.error('Error creating task:', error);
			storeActions.showNotification('Error creating task', 'error');
		}
	}
	
	function handleSignalTriggered(event) {
		const { signals } = event.detail;
		signals.forEach(signal => {
			storeActions.handleSignalTriggered(signal);
		});
	}
	
	function goBack() {
		goto('/upcoming');
	}
</script>

<svelte:head>
	<title>Branch Map - {item?.title || 'Loading...'} - Branchboard</title>
</svelte:head>

<div class="branch-map-page">
	<div class="page-header">
		<div class="header-left">
			<button class="btn btn-secondary" on:click={goBack}>
				← Back to Upcoming
			</button>
		</div>
		<div class="header-center">
			{#if loading}
				<h1>Loading...</h1>
			{:else if error}
				<h1>Error: {error}</h1>
			{:else}
				<h1>🌳 {item.title}</h1>
				<p class="item-type">{itemType === 'event' ? '📅 Event' : '🤔 Scenario'}</p>
			{/if}
		</div>
		<div class="header-right">
			<!-- Space for future actions -->
		</div>
	</div>
	
	{#if loading}
		<div class="loading-container">
			<div class="loading"></div>
			<p>Loading branch map...</p>
		</div>
	{:else if error}
		<div class="error-container">
			<p>{error}</p>
		</div>
	{:else}
		<div class="branch-map-wrapper">
			<BranchMap
				eventId={itemType === 'event' ? itemId : null}
				scenarioId={itemType === 'scenario' ? itemId : null}
				on:nodeAdded={handleNodeAdded}
				on:edgeAdded={handleEdgeAdded}
				on:nodeUpdated={handleNodeUpdated}
				on:nodeDeleted={handleNodeDeleted}
				on:currentBranchChanged={handleCurrentBranchChanged}
				on:markAsTask={handleMarkAsTask}
				on:signalTriggered={handleSignalTriggered}
			/>
		</div>
	{/if}
</div>

<style>
	.branch-map-page {
		max-width: 1400px;
		margin: 0 auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-height: calc(100vh - 120px);
	}
	
	.page-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		background: var(--bg-secondary);
		border-radius: var(--radius-lg);
		border: 1px solid var(--border-color);
	}
	
	.header-left,
	.header-right {
		flex: 1;
	}
	
	.header-center {
		flex: 2;
		text-align: center;
	}
	
	.header-center h1 {
		margin: 0;
		color: var(--text-primary);
		font-size: 1.5rem;
	}
	
	.item-type {
		margin: 0.25rem 0 0 0;
		color: var(--text-secondary);
		font-size: 0.875rem;
	}
	
	.branch-map-wrapper {
		flex: 1;
		min-height: 600px;
	}
	
	.loading-container,
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 400px;
		color: var(--text-secondary);
	}
	
	.loading-container .loading {
		margin-bottom: 1rem;
	}
	
	.error-container {
		color: var(--error-color);
	}
	
	@media (max-width: 768px) {
		.page-header {
			flex-direction: column;
			gap: 1rem;
			text-align: center;
		}
		
		.header-left,
		.header-center,
		.header-right {
			flex: none;
		}
		
		.branch-map-wrapper {
			min-height: 500px;
		}
	}
</style>