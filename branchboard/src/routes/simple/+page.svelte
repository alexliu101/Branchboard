<script>
	import { onMount } from 'svelte';
	
	let currentTime = new Date();
	let message = 'Loading...';
	
	onMount(() => {
		if (typeof window !== 'undefined') {
			message = 'Simple page loaded successfully in browser';
			
			// Update time every second for testing
			const interval = setInterval(() => {
				currentTime = new Date();
			}, 1000);
			
			return () => clearInterval(interval);
		} else {
			message = 'Simple page loaded on server';
		}
	});
</script>

<svelte:head>
	<title>Simple Test - Branchboard</title>
</svelte:head>

<div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
	<h1>🌳 Branchboard - Simple Test</h1>
	<p><strong>Status:</strong> {message}</p>
	<p><strong>Current Time:</strong> {currentTime.toLocaleTimeString()}</p>
	
	<div style="background: #e0f2fe; padding: 1rem; margin: 1rem 0; border-radius: 5px; border-left: 4px solid #0284c7;">
		<h3>✅ This page should work without 500 errors</h3>
		<p>If you can see this page, the basic SvelteKit setup is working correctly.</p>
	</div>
	
	<div style="margin-top: 2rem;">
		<a href="/" style="color: #3b82f6; text-decoration: none; margin-right: 1rem;">← Back to Main Page</a>
		<a href="/test" style="color: #3b82f6; text-decoration: none;">Go to Test Page</a>
	</div>
</div>
