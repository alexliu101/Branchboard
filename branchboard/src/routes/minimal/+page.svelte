<script>
	import { onMount } from 'svelte';
	
	let currentTime = new Date();
	let message = 'Loading...';
	
	onMount(() => {
		if (typeof window !== 'undefined') {
			message = 'Minimal page loaded successfully in browser';
		} else {
			message = 'Minimal page loaded on server';
		}
	});
</script>

<svelte:head>
	<title>Minimal Test - Branchboard</title>
</svelte:head>

<div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
	<h1>🌳 Branchboard - Minimal Test</h1>
	<p><strong>Status:</strong> {message}</p>
	<p><strong>Current Time:</strong> {currentTime.toLocaleTimeString()}</p>
	
	<div style="background: #dcfce7; padding: 1rem; margin: 1rem 0; border-radius: 5px; border-left: 4px solid #16a34a;">
		<h3>✅ No imports, no stores, no database</h3>
		<p>This page uses only basic Svelte functionality.</p>
	</div>
	
	<div style="margin-top: 2rem;">
		<a href="/" style="color: #3b82f6; text-decoration: none; margin-right: 1rem;">← Back to Main Page</a>
		<a href="/simple" style="color: #3b82f6; text-decoration: none; margin-right: 1rem;">Go to Simple Page</a>
		<a href="/test" style="color: #3b82f6; text-decoration: none;">Go to Test Page</a>
	</div>
</div>
