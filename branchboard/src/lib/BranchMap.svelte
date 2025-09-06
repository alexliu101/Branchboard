<script>
	import { onMount, createEventDispatcher } from 'svelte';
	import cytoscape from 'cytoscape';
	import { dbUtils } from './database.js';
	
	export let eventId = null;
	export let scenarioId = null;
	export let nodes = [];
	export let edges = [];
	export let readonly = false;
	
	const dispatch = createEventDispatcher();
	
	let cytoscapeContainer;
	let cy;
	let selectedNode = null;
	let showSidePanel = false;
	let sidePanelData = {};
	let isAddingNode = false;
	let isConnecting = false;
	let connectionSource = null;
	let newNodeType = 'decision';
	let newNodeDescription = '';
	
	// Node types and their colors
	const nodeTypes = {
		decision: { color: '#3b82f6', label: 'Decision' },
		chance: { color: '#f59e0b', label: 'Chance' },
		outcome: { color: '#10b981', label: 'Outcome' }
	};
	
	onMount(() => {
		initializeCytoscape();
		loadBranchMap();
	});
	
	function initializeCytoscape() {
		const cytoscapeOptions = {
			container: cytoscapeContainer,
			style: [
				{
					selector: 'node',
					style: {
						'background-color': 'data(color)',
						'color': '#ffffff',
						'label': 'data(label)',
						'text-valign': 'center',
						'text-halign': 'center',
						'font-size': '12px',
						'font-weight': 'bold',
						'width': 80,
						'height': 80,
						'border-width': 2,
						'border-color': 'data(borderColor)',
						'text-wrap': 'wrap',
						'text-max-width': '70px'
					}
				},
				{
					selector: 'node:selected',
					style: {
						'border-width': 3,
						'border-color': '#ef4444',
						'overlay-color': '#ef4444',
						'overlay-padding': 4
					}
				},
				{
					selector: 'node.current-branch',
					style: {
						'border-width': 4,
						'border-color': '#22c55e',
						'border-style': 'solid'
					}
				},
				{
					selector: 'edge',
					style: {
						'width': 3,
						'line-color': '#9ca3af',
						'target-arrow-color': '#9ca3af',
						'target-arrow-shape': 'triangle',
						'curve-style': 'bezier',
						'label': 'data(label)',
						'text-rotation': 'autorotate',
						'font-size': '10px',
						'color': '#6b7280'
					}
				},
				{
					selector: 'edge:selected',
					style: {
						'line-color': '#ef4444',
						'target-arrow-color': '#ef4444'
					}
				}
			],
			layout: {
				name: 'preset'
			},
			userZoomingEnabled: true,
			userPanningEnabled: true,
			boxSelectionEnabled: false,
			selectionType: 'single',
			minZoom: 0.5,
			maxZoom: 2
		};
		
		cy = cytoscape(cytoscapeOptions);
		
		if (!readonly) {
			setupInteractions();
		}
	}
	
	function setupInteractions() {
		// Node click
		cy.on('tap', 'node', function(evt) {
			const node = evt.target;
			selectedNode = node.id();
			openSidePanel(node.data());
		});
		
		// Edge click
		cy.on('tap', 'edge', function(evt) {
			const edge = evt.target;
			// Could open edge editing panel
		});
		
		// Canvas click (empty space)
		cy.on('tap', function(evt) {
			if (evt.target === cy) {
				if (isAddingNode) {
					const position = evt.position;
					addNodeAtPosition(position);
				} else {
					closeSidePanel();
				}
			}
		});
		
		// Right-click context menu
		cy.on('cxttap', 'node', function(evt) {
			const node = evt.target;
			showContextMenu(node, evt.position);
		});
	}
	
	async function loadBranchMap() {
		if (!eventId && !scenarioId) return;
		
		try {
			// Load nodes
			const branchNodes = eventId 
				? await dbUtils.getBranchNodesForEvent(eventId)
				: await dbUtils.getBranchNodesForScenario(scenarioId);
			
			// Load edges
			const nodeIds = branchNodes.map(n => n.id);
			const branchEdges = nodeIds.length > 0 
				? await dbUtils.getEdgesForNodes(nodeIds)
				: [];
			
			// Convert to Cytoscape format
			const elements = [
				...branchNodes.map(node => ({
					data: {
						id: node.id,
						label: truncateText(node.description, 10),
						description: node.description,
						type: node.type,
						color: nodeTypes[node.type]?.color || '#9ca3af',
						borderColor: node.isCurrentBranch ? '#22c55e' : nodeTypes[node.type]?.color || '#9ca3af'
					},
					position: { x: node.x || 100, y: node.y || 100 },
					classes: node.isCurrentBranch ? 'current-branch' : ''
				})),
				...branchEdges.map(edge => ({
					data: {
						id: edge.id,
						source: edge.sourceNodeId,
						target: edge.targetNodeId,
						label: edge.label || ''
					}
				}))
			];
			
			cy.elements().remove();
			cy.add(elements);
			
			// Auto-layout if no positions are set
			const hasPositions = branchNodes.some(n => n.x && n.y);
			if (!hasPositions && branchNodes.length > 0) {
				cy.layout({
					name: 'breadthfirst',
					directed: true,
					roots: cy.nodes().filter('[type = "decision"]'),
					padding: 30,
					spacingFactor: 1.2
				}).run();
				
				// Save the new positions
				setTimeout(() => {
					saveNodePositions();
				}, 1000);
			}
		} catch (error) {
			console.error('Error loading branch map:', error);
		}
	}
	
	function truncateText(text, maxWords) {
		const words = text.split(' ');
		return words.length > maxWords 
			? words.slice(0, maxWords).join(' ') + '...'
			: text;
	}
	
	function openSidePanel(nodeData) {
		sidePanelData = { ...nodeData };
		showSidePanel = true;
	}
	
	function closeSidePanel() {
		showSidePanel = false;
		selectedNode = null;
		sidePanelData = {};
	}
	
	function startAddingNode() {
		isAddingNode = true;
		isConnecting = false;
		connectionSource = null;
	}
	
	function cancelAddingNode() {
		isAddingNode = false;
	}
	
	async function addNodeAtPosition(position) {
		if (!newNodeDescription.trim()) {
			alert('Please enter a description for the node');
			return;
		}
		
		try {
			const nodeId = await dbUtils.createBranchNode({
				type: newNodeType,
				description: newNodeDescription,
				eventId,
				scenarioId,
				x: position.x,
				y: position.y
			});
			
			// Add to cytoscape
			cy.add({
				data: {
					id: nodeId,
					label: truncateText(newNodeDescription, 10),
					description: newNodeDescription,
					type: newNodeType,
					color: nodeTypes[newNodeType].color,
					borderColor: nodeTypes[newNodeType].color
				},
				position: position
			});
			
			// Reset
			newNodeDescription = '';
			isAddingNode = false;
			
			dispatch('nodeAdded', { nodeId, type: newNodeType, description: newNodeDescription });
		} catch (error) {
			console.error('Error adding node:', error);
		}
	}
	
	function startConnecting() {
		if (!selectedNode) {
			alert('Please select a source node first');
			return;
		}
		isConnecting = true;
		connectionSource = selectedNode;
		isAddingNode = false;
	}
	
	async function connectNodes(sourceId, targetId) {
		if (sourceId === targetId) return;
		
		// Check if connection already exists
		const existingEdge = cy.edges(`[source="${sourceId}"][target="${targetId}"]`);
		if (existingEdge.length > 0) return;
		
		try {
			const edgeId = await dbUtils.createEdge({
				sourceNodeId: parseInt(sourceId),
				targetNodeId: parseInt(targetId)
			});
			
			cy.add({
				data: {
					id: edgeId,
					source: sourceId,
					target: targetId
				}
			});
			
			dispatch('edgeAdded', { sourceId, targetId });
		} catch (error) {
			console.error('Error creating edge:', error);
		}
	}
	
	async function updateNode(nodeId, updates) {
		try {
			await dbUtils.updateBranchNode(nodeId, updates);
			
			// Update in cytoscape
			const node = cy.getElementById(nodeId);
			if (node.length > 0) {
				node.data({
					...node.data(),
					label: truncateText(updates.description || node.data('description'), 10),
					description: updates.description || node.data('description'),
					color: updates.type ? nodeTypes[updates.type].color : node.data('color')
				});
			}
			
			dispatch('nodeUpdated', { nodeId, updates });
		} catch (error) {
			console.error('Error updating node:', error);
		}
	}
	
	async function deleteNode(nodeId) {
		if (confirm('Are you sure you want to delete this node and all its connections?')) {
			try {
				// Delete from database (will cascade delete edges)
				await dbUtils.deleteBranchNode(nodeId);
				
				// Remove from cytoscape
				cy.getElementById(nodeId).remove();
				
				closeSidePanel();
				dispatch('nodeDeleted', { nodeId });
			} catch (error) {
				console.error('Error deleting node:', error);
			}
		}
	}
	
	async function setAsCurrentBranch(nodeId) {
		try {
			await dbUtils.setCurrentBranch(eventId, scenarioId, nodeId);
			
			// Update styles
			cy.nodes().removeClass('current-branch');
			cy.nodes().style('border-color', function(node) {
				return nodeTypes[node.data('type')]?.color || '#9ca3af';
			});
			
			const node = cy.getElementById(nodeId);
			node.addClass('current-branch');
			node.style('border-color', '#22c55e');
			
			dispatch('currentBranchChanged', { nodeId });
		} catch (error) {
			console.error('Error setting current branch:', error);
		}
	}
	
	async function saveNodePositions() {
		const nodes = cy.nodes();
		const updates = [];
		
		nodes.forEach(node => {
			const pos = node.position();
			updates.push({
				id: node.id(),
				x: pos.x,
				y: pos.y
			});
		});
		
		try {
			for (const update of updates) {
				await dbUtils.updateBranchNode(update.id, { x: update.x, y: update.y });
			}
		} catch (error) {
			console.error('Error saving positions:', error);
		}
	}
	
	function fitToContent() {
		cy.fit(cy.elements(), 50);
	}
	
	function resetView() {
		cy.reset();
	}
</script>

<div class="branch-map-container">
	<!-- Toolbar -->
	{#if !readonly}
		<div class="toolbar">
			<div class="toolbar-group">
				<button 
					class="btn btn-primary btn-sm" 
					class:active={isAddingNode}
					on:click={isAddingNode ? cancelAddingNode : startAddingNode}
				>
					{isAddingNode ? 'Cancel' : '+ Add Node'}
				</button>
				
				{#if isAddingNode}
					<select bind:value={newNodeType} class="node-type-select">
						{#each Object.entries(nodeTypes) as [type, config]}
							<option value={type}>{config.label}</option>
						{/each}
					</select>
					
					<input 
						type="text" 
						bind:value={newNodeDescription}
						placeholder="Node description..."
						class="node-description-input"
					/>
				{/if}
			</div>
			
			<div class="toolbar-group">
				<button 
					class="btn btn-secondary btn-sm"
					class:active={isConnecting}
					on:click={startConnecting}
					disabled={!selectedNode}
				>
					🔗 Connect
				</button>
				
				<button class="btn btn-secondary btn-sm" on:click={fitToContent}>
					🎯 Fit
				</button>
				
				<button class="btn btn-secondary btn-sm" on:click={resetView}>
					↻ Reset
				</button>
			</div>
		</div>
	{/if}
	
	<!-- Main canvas area -->
	<div class="canvas-area">
		<div bind:this={cytoscapeContainer} class="cytoscape-container"></div>
		
		<!-- Instructions overlay -->
		{#if isAddingNode}
			<div class="instructions">
				Click anywhere on the canvas to add a node
			</div>
		{:else if isConnecting}
			<div class="instructions">
				Click on a target node to create connection from "{cy?.getElementById(connectionSource)?.data('label') || ''}"
			</div>
		{/if}
	</div>
	
	<!-- Side panel for node details -->
	{#if showSidePanel && sidePanelData}
		<div class="side-panel">
			<div class="side-panel-header">
				<h3>Node Details</h3>
				<button class="close-btn" on:click={closeSidePanel}>×</button>
			</div>
			
			<div class="side-panel-content">
				<div class="form-group">
					<label>Type:</label>
					<select 
						value={sidePanelData.type} 
						on:change={(e) => updateNode(selectedNode, { type: e.target.value })}
					>
						{#each Object.entries(nodeTypes) as [type, config]}
							<option value={type}>{config.label}</option>
						{/each}
					</select>
				</div>
				
				<div class="form-group">
					<label>Description:</label>
					<textarea 
						value={sidePanelData.description}
						on:blur={(e) => updateNode(selectedNode, { description: e.target.value })}
						rows="3"
					></textarea>
				</div>
				
				<div class="form-group">
					<button 
						class="btn btn-success btn-sm w-full"
						on:click={() => setAsCurrentBranch(selectedNode)}
					>
						🎯 Set as Current Branch
					</button>
				</div>
				
				<div class="form-group">
					<button 
						class="btn btn-primary btn-sm w-full"
						on:click={() => dispatch('markAsTask', { nodeId: selectedNode, nodeData: sidePanelData })}
					>
						📋 Mark as Task
					</button>
				</div>
				
				<div class="form-group">
					<button 
						class="btn btn-error btn-sm w-full"
						on:click={() => deleteNode(selectedNode)}
					>
						🗑️ Delete Node
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	.branch-map-container {
		display: flex;
		flex-direction: column;
		height: 600px;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		overflow: hidden;
		position: relative;
	}
	
	.toolbar {
		background: var(--gray-50);
		border-bottom: 1px solid var(--border-color);
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
	}
	
	.toolbar-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.btn.active {
		background: var(--primary-color);
		color: white;
	}
	
	.node-type-select {
		padding: 0.375rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		font-size: 0.875rem;
	}
	
	.node-description-input {
		padding: 0.375rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		font-size: 0.875rem;
		min-width: 150px;
	}
	
	.canvas-area {
		flex: 1;
		position: relative;
	}
	
	.cytoscape-container {
		width: 100%;
		height: 100%;
		background: #fafafa;
	}
	
	.instructions {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		background: rgba(59, 130, 246, 0.9);
		color: white;
		padding: 1rem 2rem;
		border-radius: var(--radius);
		font-weight: 500;
		pointer-events: none;
		z-index: 10;
	}
	
	.side-panel {
		position: absolute;
		right: 0;
		top: 0;
		width: 300px;
		height: 100%;
		background: white;
		border-left: 1px solid var(--border-color);
		display: flex;
		flex-direction: column;
		z-index: 20;
	}
	
	.side-panel-header {
		padding: 1rem;
		border-bottom: 1px solid var(--border-color);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.side-panel-header h3 {
		margin: 0;
		font-size: 1.125rem;
	}
	
	.close-btn {
		background: none;
		border: none;
		font-size: 1.5rem;
		cursor: pointer;
		color: var(--gray-500);
		padding: 0;
		width: 30px;
		height: 30px;
	}
	
	.close-btn:hover {
		color: var(--text-primary);
	}
	
	.side-panel-content {
		padding: 1rem;
		overflow-y: auto;
		flex: 1;
	}
	
	.form-group {
		margin-bottom: 1rem;
	}
	
	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.form-group input,
	.form-group select,
	.form-group textarea {
		width: 100%;
		padding: 0.5rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		font-size: 0.875rem;
	}
	
	.btn-error {
		background: var(--error-color);
		color: white;
	}
	
	.btn-error:hover {
		background: #dc2626;
	}
	
	@media (max-width: 768px) {
		.branch-map-container {
			height: 500px;
		}
		
		.side-panel {
			width: 100%;
			height: 50%;
			top: 50%;
		}
		
		.toolbar {
			flex-direction: column;
			align-items: stretch;
		}
		
		.toolbar-group {
			justify-content: center;
		}
	}
</style>