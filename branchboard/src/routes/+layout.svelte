<script>
	import '../styles/app.css';
</script>

<main>
	<nav class="nav">
		<div class="nav-brand">
			<h1>🌳 Branchboard</h1>
		</div>
		<div class="nav-links">
			<a href="/" class="nav-link">Today</a>
			<a href="/upcoming" class="nav-link">Upcoming</a>
			<a href="/tasks" class="nav-link">Tasks</a>
			<a href="/dashboards" class="nav-link">Dashboards</a>
			<a href="/review" class="nav-link">Review</a>
		</div>
	</nav>
	
	<div class="content">
		<slot />
	</div>
</main>

<style>
	main {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
	}
	
	.nav {
		background: #1f2937;
		color: white;
		padding: 1rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}
	
	.nav-brand h1 {
		margin: 0;
		font-size: 1.5rem;
		font-weight: bold;
	}
	
	.nav-links {
		display: flex;
		gap: 1rem;
	}
	
	.nav-link {
		color: #d1d5db;
		text-decoration: none;
		padding: 0.5rem 1rem;
		border-radius: 0.375rem;
		transition: all 0.2s;
	}
	
	.nav-link:hover {
		background: #374151;
		color: white;
	}
	
	.content {
		flex: 1;
		padding: 1rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}
	
	@media (max-width: 768px) {
		.nav {
			flex-direction: column;
			gap: 1rem;
		}
		
		.nav-links {
			justify-content: center;
		}
	}
</style>