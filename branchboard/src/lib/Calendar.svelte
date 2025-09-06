<script>
	import { onMount } from 'svelte';
	import { Calendar } from '@fullcalendar/core';
	import dayGridPlugin from '@fullcalendar/daygrid';
	import interactionPlugin from '@fullcalendar/interaction';
	
	export let events = [];
	export let onEventClick = null;
	export let onDateClick = null;
	
	let calendarEl;
	let calendar;
	
	onMount(() => {
		calendar = new Calendar(calendarEl, {
			plugins: [dayGridPlugin, interactionPlugin],
			initialView: 'dayGridMonth',
			headerToolbar: {
				left: 'prev,next today',
				center: 'title',
				right: 'dayGridMonth,dayGridWeek'
			},
			height: 'auto',
			events: events.map(event => ({
				id: event.id,
				title: event.title,
				start: event.start,
				end: event.end,
				backgroundColor: event.hasBranchMap ? '#3b82f6' : '#9ca3af',
				borderColor: event.hasBranchMap ? '#2563eb' : '#6b7280',
				textColor: '#ffffff',
				extendedProps: {
					description: event.description,
					hasBranchMap: event.hasBranchMap
				}
			})),
			eventClick: function(info) {
				if (onEventClick) {
					onEventClick({
						id: parseInt(info.event.id),
						title: info.event.title,
						start: info.event.start?.toISOString(),
						end: info.event.end?.toISOString(),
						description: info.event.extendedProps.description,
						hasBranchMap: info.event.extendedProps.hasBranchMap
					});
				}
			},
			dateClick: function(info) {
				if (onDateClick) {
					onDateClick(info.date);
				}
			},
			eventDidMount: function(info) {
				// Add tooltip
				info.el.title = info.event.extendedProps.description || info.event.title;
			}
		});
		
		calendar.render();
	});
	
	// Reactive updates
	$: if (calendar && events) {
		calendar.removeAllEvents();
		calendar.addEventSource(events.map(event => ({
			id: event.id,
			title: event.title,
			start: event.start,
			end: event.end,
			backgroundColor: event.hasBranchMap ? '#3b82f6' : '#9ca3af',
			borderColor: event.hasBranchMap ? '#2563eb' : '#6b7280',
			textColor: '#ffffff',
			extendedProps: {
				description: event.description,
				hasBranchMap: event.hasBranchMap
			}
		})));
	}
</script>

<div bind:this={calendarEl}></div>

<style>
	:global(.fc) {
		font-size: 0.9rem;
		border: 1px solid var(--border-color);
		border-radius: var(--radius-lg);
		overflow: hidden;
	}
	
	:global(.fc-header-toolbar) {
		background: var(--gray-50);
		padding: 1rem;
		border-bottom: 1px solid var(--border-color);
	}
	
	:global(.fc-toolbar-title) {
		color: var(--text-primary);
		font-size: 1.25rem;
		font-weight: 600;
	}
	
	:global(.fc-button) {
		background: var(--primary-color);
		border-color: var(--primary-color);
		color: white;
		border-radius: var(--radius);
		font-size: 0.875rem;
		padding: 0.25rem 0.75rem;
	}
	
	:global(.fc-button:not(:disabled):hover) {
		background: #2563eb;
		border-color: #2563eb;
	}
	
	:global(.fc-button:disabled) {
		opacity: 0.5;
	}
	
	:global(.fc-daygrid-event) {
		cursor: pointer;
		border-radius: 4px;
		margin: 1px 2px;
		font-size: 0.75rem;
	}
	
	:global(.fc-event-title) {
		font-weight: 500;
	}
	
	:global(.fc-day-today) {
		background: rgba(59, 130, 246, 0.1) !important;
	}
	
	:global(.fc-day-past) {
		opacity: 0.6;
	}
	
	:global(.fc-daygrid-day:hover) {
		background: var(--gray-50);
		cursor: pointer;
	}
	
	:global(.fc-scrollgrid) {
		border-collapse: separate;
		border-spacing: 0;
	}
	
	:global(.fc-col-header-cell) {
		background: var(--gray-100);
		font-weight: 600;
		color: var(--text-primary);
		border-color: var(--border-color);
	}
	
	:global(.fc-daygrid-day-frame) {
		min-height: 80px;
	}
</style>