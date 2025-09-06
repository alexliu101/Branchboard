<script>
	import { onMount } from 'svelte';
	
	let message = 'Loading...';
	let debugInfo = {};
	
	onMount(() => {
		if (typeof window !== 'undefined') {
			message = 'Browser environment detected';
			debugInfo = {
				window: typeof window !== 'undefined',
				document: typeof document !== 'undefined',
				location: window.location.href
			};
		} else {
			message = 'Server environment detected';
		}
	});
</script>

<svelte:head>
	<title>Test Page - Branchboard</title>
</svelte:head>

<div style="padding: 2rem; max-width: 800px; margin: 0 auto;">
	<h1>Test Page</h1>
	<p><strong>Status:</strong> {message}</p>
	
	{#if Object.keys(debugInfo).length > 0}
		<div style="background: #f0f0f0; padding: 1rem; margin: 1rem 0; border-radius: 5px;">
			<h3>Debug Information:</h3>
			<ul>
				{#each Object.entries(debugInfo) as [key, value]}
					<li><strong>{key}:</strong> {value}</li>
				{/each}
			</ul>
		</div>
	{/if}
	
	<div style="margin-top: 2rem;">
		<a href="/" style="color: #3b82f6; text-decoration: none;">← Back to Main Page</a>
	</div>
</div>
