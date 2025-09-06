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
	
	// Signals management
	let nodeSignals = [];
	let showAddSignal = false;
	let newSignal = {
		metricName: '',
		threshold: '',
		direction: '>='
	};
	
	// Assumptions and Risks
	let nodeAssumptions = [];
	let nodeRisks = [];
	let showAddAssumption = false;
	let showAddRisk = false;
	let newAssumption = {
		statement: '',
		confidence: 80
	};
	let newRisk = {
		description: '',
		likelihood: 'medium',
		impact: 'medium',
		mitigation: '',
		contingency: ''
	};
	
	// Side panel tabs
	let activeTab = 'details';
	
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
					selector: 'node.has-signals',
					style: {
						'border-style': 'dashed'
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
			
			// Load signals for all nodes to show visual indicators
			const allSignals = await Promise.all(
				nodeIds.map(async nodeId => {
					const signals = await dbUtils.getSignalsForNode(nodeId);
					return { nodeId, signals };
				})
			);
			const signalsByNode = Object.fromEntries(allSignals.map(({ nodeId, signals }) => [nodeId, signals]));
			
			// Convert to Cytoscape format
			const elements = [
				...branchNodes.map(node => {
					const hasSignals = signalsByNode[node.id] && signalsByNode[node.id].length > 0;
					return {
						data: {
							id: node.id,
							label: truncateText(node.description, 10),
							description: node.description,
							type: node.type,
							color: nodeTypes[node.type]?.color || '#9ca3af',
							borderColor: node.isCurrentBranch ? '#22c55e' : nodeTypes[node.type]?.color || '#9ca3af'
						},
						position: { x: node.x || 100, y: node.y || 100 },
						classes: `${node.isCurrentBranch ? 'current-branch' : ''} ${hasSignals ? 'has-signals' : ''}`.trim()
					};
				}),
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
	
	async function openSidePanel(nodeData) {
		sidePanelData = { ...nodeData };
		showSidePanel = true;
		activeTab = 'details';
		
		// Load related data
		await loadNodeSignals();
		await loadNodeAssumptions();
		await loadNodeRisks();
	}
	
	async function loadNodeSignals() {
		if (!selectedNode) return;
		try {
			nodeSignals = await dbUtils.getSignalsForNode(parseInt(selectedNode));
		} catch (error) {
			console.error('Error loading node signals:', error);
			nodeSignals = [];
		}
	}
	
	async function loadNodeAssumptions() {
		if (!selectedNode) return;
		try {
			nodeAssumptions = await dbUtils.getAssumptionsForNode(parseInt(selectedNode));
		} catch (error) {
			console.error('Error loading node assumptions:', error);
			nodeAssumptions = [];
		}
	}
	
	async function loadNodeRisks() {
		if (!selectedNode) return;
		try {
			nodeRisks = await dbUtils.getRisksForNode(parseInt(selectedNode));
		} catch (error) {
			console.error('Error loading node risks:', error);
			nodeRisks = [];
		}
	}
	
	function closeSidePanel() {
		showSidePanel = false;
		selectedNode = null;
		sidePanelData = {};
		nodeSignals = [];
		nodeAssumptions = [];
		nodeRisks = [];
		showAddSignal = false;
		showAddAssumption = false;
		showAddRisk = false;
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
	
	// Signal management functions
	async function addSignal() {
		if (!newSignal.metricName.trim() || !newSignal.threshold) return;
		
		try {
			await dbUtils.createSignal({
				metricName: newSignal.metricName,
				threshold: parseFloat(newSignal.threshold),
				direction: newSignal.direction,
				branchNodeId: parseInt(selectedNode)
			});
			
			// Reset form
			newSignal = { metricName: '', threshold: '', direction: '>=' };
			showAddSignal = false;
			
			// Reload signals
			await loadNodeSignals();
			
			// Update node visual indicator
			const node = cy.getElementById(selectedNode);
			node.addClass('has-signals');
			
		} catch (error) {
			console.error('Error adding signal:', error);
		}
	}
	
	async function updateSignalValue(signalId, newValue) {
		try {
			await dbUtils.updateSignalValue(signalId, parseFloat(newValue));
			await loadNodeSignals();
			
			// Check if any signals were triggered
			const triggeredSignals = await dbUtils.getTriggeredSignals();
			if (triggeredSignals.length > 0) {
				dispatch('signalTriggered', { signals: triggeredSignals });
			}
		} catch (error) {
			console.error('Error updating signal value:', error);
		}
	}
	
	async function deleteSignal(signalId) {
		try {
			// Note: We should add a deleteSignal method to dbUtils
			// For now, we'll update to make it inactive
			await dbUtils.updateSignal(signalId, { isTriggered: false, currentValue: null });
			await loadNodeSignals();
		} catch (error) {
			console.error('Error deleting signal:', error);
		}
	}
	
	// Assumption management functions
	async function addAssumption() {
		if (!newAssumption.statement.trim()) return;
		
		try {
			await dbUtils.createAssumption({
				statement: newAssumption.statement,
				confidence: newAssumption.confidence,
				linkedNodeId: parseInt(selectedNode)
			});
			
			// Reset form
			newAssumption = { statement: '', confidence: 80 };
			showAddAssumption = false;
			
			// Reload assumptions
			await loadNodeAssumptions();
		} catch (error) {
			console.error('Error adding assumption:', error);
		}
	}
	
	async function updateAssumption(assumptionId, updates) {
		try {
			await dbUtils.updateAssumption(assumptionId, updates);
			await loadNodeAssumptions();
		} catch (error) {
			console.error('Error updating assumption:', error);
		}
	}
	
	// Risk management functions
	async function addRisk() {
		if (!newRisk.description.trim()) return;
		
		try {
			await dbUtils.createRisk({
				description: newRisk.description,
				likelihood: newRisk.likelihood,
				impact: newRisk.impact,
				mitigation: newRisk.mitigation,
				contingency: newRisk.contingency,
				linkedNodeId: parseInt(selectedNode)
			});
			
			// Reset form
			newRisk = {
				description: '',
				likelihood: 'medium',
				impact: 'medium',
				mitigation: '',
				contingency: ''
			};
			showAddRisk = false;
			
			// Reload risks
			await loadNodeRisks();
		} catch (error) {
			console.error('Error adding risk:', error);
		}
	}
	
	async function updateRisk(riskId, updates) {
		try {
			await dbUtils.updateRisk(riskId, updates);
			await loadNodeRisks();
		} catch (error) {
			console.error('Error updating risk:', error);
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
			
			<!-- Tab navigation -->
			<div class="tab-nav">
				<button 
					class="tab-btn" 
					class:active={activeTab === 'details'}
					on:click={() => activeTab = 'details'}
				>
					Details
				</button>
				<button 
					class="tab-btn" 
					class:active={activeTab === 'signals'}
					on:click={() => activeTab = 'signals'}
				>
					Signals ({nodeSignals.length})
				</button>
				<button 
					class="tab-btn" 
					class:active={activeTab === 'assumptions'}
					on:click={() => activeTab = 'assumptions'}
				>
					Assumptions ({nodeAssumptions.length})
				</button>
				<button 
					class="tab-btn" 
					class:active={activeTab === 'risks'}
					on:click={() => activeTab = 'risks'}
				>
					Risks ({nodeRisks.length})
				</button>
			</div>
			
			<div class="side-panel-content">
				<!-- Details Tab -->
				{#if activeTab === 'details'}
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
					
					{#if sidePanelData.type === 'decision'}
						<div class="form-group">
							<label>Decision Deadline (optional):</label>
							<input 
								type="date" 
								value={sidePanelData.decisionDeadline ? new Date(sidePanelData.decisionDeadline).toISOString().split('T')[0] : ''}
								on:change={(e) => updateNode(selectedNode, { decisionDeadline: e.target.value ? new Date(e.target.value).toISOString() : null })}
							/>
							<small class="form-help">When does this decision need to be made?</small>
						</div>
					{/if}
					
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
				{/if}
				
				<!-- Signals Tab -->
				{#if activeTab === 'signals'}
					<div class="tab-content">
						<div class="tab-header">
							<h4>Early Signals</h4>
							<button 
								class="btn btn-primary btn-sm"
								on:click={() => showAddSignal = true}
							>
								+ Add Signal
							</button>
						</div>
						
						{#if showAddSignal}
							<div class="add-form">
								<div class="form-group">
									<label>Metric Name:</label>
									<input 
										type="text" 
										bind:value={newSignal.metricName}
										placeholder="e.g., 'Client feedback received'"
									/>
								</div>
								<div class="form-row">
									<div class="form-group">
										<label>Threshold:</label>
										<input 
											type="number" 
											bind:value={newSignal.threshold}
											placeholder="100"
										/>
									</div>
									<div class="form-group">
										<label>Direction:</label>
										<select bind:value={newSignal.direction}>
											<option value=">=">&gt;=</option>
											<option value="<=">&lt;=</option>
											<option value=">">&gt;</option>
											<option value="<">&lt;</option>
											<option value="==">=</option>
										</select>
									</div>
								</div>
								<div class="form-actions">
									<button class="btn btn-secondary btn-sm" on:click={() => showAddSignal = false}>
										Cancel
									</button>
									<button class="btn btn-primary btn-sm" on:click={addSignal}>
										Add Signal
									</button>
								</div>
							</div>
						{/if}
						
						{#each nodeSignals as signal}
							<div class="signal-item" class:triggered={signal.isTriggered}>
								<div class="signal-header">
									<span class="signal-name">{signal.metricName}</span>
									<span class="signal-threshold">
										{signal.direction} {signal.threshold}
									</span>
								</div>
								<div class="signal-value">
									<label>Current Value:</label>
									<input 
										type="number" 
										value={signal.currentValue || ''}
										on:change={(e) => updateSignalValue(signal.id, e.target.value)}
										placeholder="Enter current value"
									/>
									{#if signal.isTriggered}
										<span class="triggered-badge">🔔 TRIGGERED</span>
									{/if}
								</div>
							</div>
						{:else}
							<div class="empty-state">
								<p>No signals defined for this node</p>
								<small>Signals help detect when this branch is becoming reality</small>
							</div>
						{/each}
					</div>
				{/if}
				
				<!-- Assumptions Tab -->
				{#if activeTab === 'assumptions'}
					<div class="tab-content">
						<div class="tab-header">
							<h4>Assumptions</h4>
							<button 
								class="btn btn-primary btn-sm"
								on:click={() => showAddAssumption = true}
							>
								+ Add Assumption
							</button>
						</div>
						
						{#if showAddAssumption}
							<div class="add-form">
								<div class="form-group">
									<label>Assumption Statement:</label>
									<textarea 
										bind:value={newAssumption.statement}
										placeholder="What are you assuming will happen?"
										rows="2"
									></textarea>
								</div>
								<div class="form-group">
									<label>Confidence: {newAssumption.confidence}%</label>
									<input 
										type="range" 
										bind:value={newAssumption.confidence}
										min="0" 
										max="100"
									/>
								</div>
								<div class="form-actions">
									<button class="btn btn-secondary btn-sm" on:click={() => showAddAssumption = false}>
										Cancel
									</button>
									<button class="btn btn-primary btn-sm" on:click={addAssumption}>
										Add Assumption
									</button>
								</div>
							</div>
						{/if}
						
						{#each nodeAssumptions as assumption}
							<div class="assumption-item">
								<div class="assumption-text">{assumption.statement}</div>
								<div class="assumption-confidence">
									Confidence: {assumption.confidence}%
									<div class="confidence-bar">
										<div 
											class="confidence-fill" 
											style="width: {assumption.confidence}%"
										></div>
									</div>
								</div>
							</div>
						{:else}
							<div class="empty-state">
								<p>No assumptions defined for this node</p>
								<small>Document what you're assuming for this scenario</small>
							</div>
						{/each}
					</div>
				{/if}
				
				<!-- Risks Tab -->
				{#if activeTab === 'risks'}
					<div class="tab-content">
						<div class="tab-header">
							<h4>Risks</h4>
							<button 
								class="btn btn-primary btn-sm"
								on:click={() => showAddRisk = true}
							>
								+ Add Risk
							</button>
						</div>
						
						{#if showAddRisk}
							<div class="add-form">
								<div class="form-group">
									<label>Risk Description:</label>
									<textarea 
										bind:value={newRisk.description}
										placeholder="What could go wrong?"
										rows="2"
									></textarea>
								</div>
								<div class="form-row">
									<div class="form-group">
										<label>Likelihood:</label>
										<select bind:value={newRisk.likelihood}>
											<option value="low">Low</option>
											<option value="medium">Medium</option>
											<option value="high">High</option>
										</select>
									</div>
									<div class="form-group">
										<label>Impact:</label>
										<select bind:value={newRisk.impact}>
											<option value="low">Low</option>
											<option value="medium">Medium</option>
											<option value="high">High</option>
										</select>
									</div>
								</div>
								<div class="form-group">
									<label>Mitigation Plan:</label>
									<textarea 
										bind:value={newRisk.mitigation}
										placeholder="How to prevent this risk..."
										rows="2"
									></textarea>
								</div>
								<div class="form-group">
									<label>Contingency Plan:</label>
									<textarea 
										bind:value={newRisk.contingency}
										placeholder="What to do if this happens..."
										rows="2"
									></textarea>
								</div>
								<div class="form-actions">
									<button class="btn btn-secondary btn-sm" on:click={() => showAddRisk = false}>
										Cancel
									</button>
									<button class="btn btn-primary btn-sm" on:click={addRisk}>
										Add Risk
									</button>
								</div>
							</div>
						{/if}
						
						{#each nodeRisks as risk}
							<div class="risk-item">
								<div class="risk-header">
									<span class="risk-description">{risk.description}</span>
									<div class="risk-badges">
										<span class="risk-badge likelihood-{risk.likelihood}">
											{risk.likelihood} likelihood
										</span>
										<span class="risk-badge impact-{risk.impact}">
											{risk.impact} impact
										</span>
									</div>
								</div>
								{#if risk.mitigation}
									<div class="risk-detail">
										<strong>Mitigation:</strong> {risk.mitigation}
									</div>
								{/if}
								{#if risk.contingency}
									<div class="risk-detail">
										<strong>Contingency:</strong> {risk.contingency}
									</div>
								{/if}
							</div>
						{:else}
							<div class="empty-state">
								<p>No risks identified for this node</p>
								<small>Identify potential risks and mitigation strategies</small>
							</div>
						{/each}
					</div>
				{/if}
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
		width: 400px;
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
	
	.tab-nav {
		display: flex;
		border-bottom: 1px solid var(--border-color);
	}
	
	.tab-btn {
		flex: 1;
		padding: 0.75rem;
		border: none;
		background: var(--gray-50);
		cursor: pointer;
		font-size: 0.75rem;
		color: var(--text-secondary);
		border-bottom: 2px solid transparent;
		transition: all 0.2s;
	}
	
	.tab-btn:hover {
		background: var(--gray-100);
	}
	
	.tab-btn.active {
		background: white;
		color: var(--primary-color);
		border-bottom-color: var(--primary-color);
	}
	
	.side-panel-content {
		padding: 1rem;
		overflow-y: auto;
		flex: 1;
	}
	
	.tab-content {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	
	.tab-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1rem;
	}
	
	.tab-header h4 {
		margin: 0;
		font-size: 1rem;
		color: var(--text-primary);
	}
	
	.add-form {
		background: var(--gray-50);
		padding: 1rem;
		border-radius: var(--radius);
		margin-bottom: 1rem;
	}
	
	.form-group {
		margin-bottom: 1rem;
	}
	
	.form-row {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}
	
	.form-group label {
		display: block;
		margin-bottom: 0.5rem;
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.875rem;
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
	
	.form-help {
		display: block;
		margin-top: 0.25rem;
		font-size: 0.75rem;
		color: var(--text-secondary);
		font-style: italic;
	}
	
	.form-actions {
		display: flex;
		gap: 0.5rem;
		justify-content: flex-end;
		margin-top: 1rem;
	}
	
	.signal-item {
		padding: 1rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		margin-bottom: 0.75rem;
	}
	
	.signal-item.triggered {
		border-color: var(--warning-color);
		background: rgba(245, 158, 11, 0.1);
	}
	
	.signal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.5rem;
	}
	
	.signal-name {
		font-weight: 500;
		color: var(--text-primary);
	}
	
	.signal-threshold {
		font-size: 0.875rem;
		color: var(--text-secondary);
		background: var(--gray-100);
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius);
	}
	
	.signal-value {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	
	.signal-value label {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.signal-value input {
		flex: 1;
		padding: 0.25rem 0.5rem;
		font-size: 0.875rem;
	}
	
	.triggered-badge {
		background: var(--warning-color);
		color: white;
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius);
		font-size: 0.75rem;
		font-weight: 500;
	}
	
	.assumption-item,
	.risk-item {
		padding: 1rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius);
		margin-bottom: 0.75rem;
	}
	
	.assumption-text,
	.risk-description {
		color: var(--text-primary);
		margin-bottom: 0.5rem;
	}
	
	.assumption-confidence {
		font-size: 0.875rem;
		color: var(--text-secondary);
	}
	
	.confidence-bar {
		width: 100%;
		height: 4px;
		background: var(--gray-200);
		border-radius: 2px;
		margin-top: 0.25rem;
		overflow: hidden;
	}
	
	.confidence-fill {
		height: 100%;
		background: var(--primary-color);
		border-radius: 2px;
		transition: width 0.3s;
	}
	
	.risk-header {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
	}
	
	.risk-badges {
		display: flex;
		gap: 0.5rem;
	}
	
	.risk-badge {
		padding: 0.25rem 0.5rem;
		border-radius: var(--radius);
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: capitalize;
	}
	
	.likelihood-low, .impact-low { background: var(--success-color); color: white; }
	.likelihood-medium, .impact-medium { background: var(--warning-color); color: white; }
	.likelihood-high, .impact-high { background: var(--error-color); color: white; }
	
	.risk-detail {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: 0.5rem;
		line-height: 1.4;
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
			height: 60%;
			top: 40%;
		}
		
		.toolbar {
			flex-direction: column;
			align-items: stretch;
		}
		
		.toolbar-group {
			justify-content: center;
		}
		
		.form-row {
			grid-template-columns: 1fr;
		}
	}
</style>