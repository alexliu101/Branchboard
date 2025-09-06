import { G as store_get, I as ensure_array_like, J as head, F as escape_html, K as attr_class, P as stringify, Q as attr_style, N as unsubscribe_stores, B as pop, z as push } from "../../../chunks/index2.js";
import { o as overdueTasks, a as activeTasks, e as completedTasks, t as tasks, c as currentBranches, g as scenarios } from "../../../chunks/stores.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let sortedByPriority, sortedByEffort;
  let taskStats = { total: 0, completed: 0, pending: 0, overdue: 0 };
  let personalMetrics = [
    {
      name: "Focus Sessions",
      current: 5,
      target: 6,
      trend: "up",
      color: "#10b981"
    },
    {
      name: "Weekly Tasks",
      current: 8,
      target: 10,
      trend: "stable",
      color: "#3b82f6"
    },
    {
      name: "Branch Switches",
      current: 2,
      target: 5,
      trend: "down",
      color: "#f59e0b"
    }
  ];
  let activeBranches = [];
  function loadDashboardData() {
    taskStats = {
      total: store_get($$store_subs ??= {}, "$tasks", tasks).length,
      completed: store_get($$store_subs ??= {}, "$completedTasks", completedTasks).length,
      pending: store_get($$store_subs ??= {}, "$activeTasks", activeTasks).length,
      overdue: store_get($$store_subs ??= {}, "$overdueTasks", overdueTasks).length
    };
    store_get($$store_subs ??= {}, "$tasks", tasks);
    activeBranches = store_get($$store_subs ??= {}, "$currentBranches", currentBranches);
  }
  function getEffortSize(hours) {
    if (hours >= 4) return "L";
    if (hours >= 2) return "M";
    return "S";
  }
  function getPriorityColor(priority) {
    switch (priority) {
      case "high":
        return "var(--error-color)";
      case "medium":
        return "var(--warning-color)";
      case "low":
        return "var(--success-color)";
      default:
        return "var(--gray-400)";
    }
  }
  {
    loadDashboardData();
  }
  sortedByPriority = [
    ...store_get($$store_subs ??= {}, "$activeTasks", activeTasks)
  ].sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
  });
  sortedByEffort = [
    ...store_get($$store_subs ??= {}, "$activeTasks", activeTasks)
  ].sort((a, b) => {
    return (a.estimatedHours || 1) - (b.estimatedHours || 1);
  });
  activeBranches.length > 0 ? `${activeBranches.length} active branch${activeBranches.length !== 1 ? "es" : ""}` : "No active branches";
  const each_array_1 = ensure_array_like(personalMetrics);
  const each_array_2 = ensure_array_like(sortedByPriority.slice(0, 6));
  const each_array_3 = ensure_array_like(sortedByEffort.slice(0, 6));
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Dashboards - Branchboard</title>`;
  });
  $$payload.out.push(`<div class="dashboards-container svelte-1xe1tgt"><div class="page-header svelte-1xe1tgt"><h1 class="svelte-1xe1tgt">📊 Dashboards</h1> <p class="page-subtitle svelte-1xe1tgt">Roll-up views to keep you on track</p></div> <div class="dashboard-grid svelte-1xe1tgt"><section class="dashboard-card card svelte-1xe1tgt"><div class="card-title svelte-1xe1tgt">📋 Task Overview</div> <div class="stats-grid svelte-1xe1tgt"><div class="stat-item svelte-1xe1tgt"><div class="stat-number svelte-1xe1tgt" style="color: var(--primary-color)">${escape_html(taskStats.total)}</div> <div class="stat-label svelte-1xe1tgt">Total Tasks</div></div> <div class="stat-item svelte-1xe1tgt"><div class="stat-number svelte-1xe1tgt" style="color: var(--success-color)">${escape_html(taskStats.completed)}</div> <div class="stat-label svelte-1xe1tgt">Completed</div></div> <div class="stat-item svelte-1xe1tgt"><div class="stat-number svelte-1xe1tgt" style="color: var(--warning-color)">${escape_html(taskStats.pending)}</div> <div class="stat-label svelte-1xe1tgt">Pending</div></div> <div class="stat-item svelte-1xe1tgt"><div class="stat-number svelte-1xe1tgt" style="color: var(--error-color)">${escape_html(taskStats.overdue)}</div> <div class="stat-label svelte-1xe1tgt">Overdue</div></div></div></section> <section class="dashboard-card card svelte-1xe1tgt"><div class="card-title svelte-1xe1tgt">🌳 Branch Status</div> <div class="branch-overview svelte-1xe1tgt"><div class="branch-stat svelte-1xe1tgt"><span class="branch-count svelte-1xe1tgt">${escape_html(activeBranches.length)}</span> <span class="branch-label svelte-1xe1tgt">Active Branches</span></div> <div class="branch-stat svelte-1xe1tgt"><span class="branch-count svelte-1xe1tgt">${escape_html(store_get($$store_subs ??= {}, "$scenarios", scenarios).length)}</span> <span class="branch-label svelte-1xe1tgt">Total Scenarios</span></div> `);
  if (activeBranches.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(activeBranches);
    $$payload.out.push(`<div class="active-branches svelte-1xe1tgt"><h4 class="svelte-1xe1tgt">Current Branches:</h4> <!--[-->`);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let branch = each_array[$$index];
      $$payload.out.push(`<div class="branch-item svelte-1xe1tgt">📍 ${escape_html(branch.description)}</div>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="no-branches svelte-1xe1tgt"><p class="svelte-1xe1tgt">No active branches set</p> <small class="svelte-1xe1tgt">Visit Upcoming to create scenarios and set current branches</small></div>`);
  }
  $$payload.out.push(`<!--]--></div></section> <section class="dashboard-card card svelte-1xe1tgt"><div class="card-title svelte-1xe1tgt">💪 Personal Metrics</div> <div class="metrics-list svelte-1xe1tgt"><!--[-->`);
  for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
    let metric = each_array_1[$$index_1];
    $$payload.out.push(`<div class="metric-item svelte-1xe1tgt"><div class="metric-header svelte-1xe1tgt"><span class="metric-name svelte-1xe1tgt">${escape_html(metric.name)}</span> <span${attr_class(`metric-trend trend-${stringify(metric.trend)}`, "svelte-1xe1tgt")}>`);
    if (metric.trend === "up") {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`↗️`);
    } else {
      $$payload.out.push("<!--[!-->");
      if (metric.trend === "down") {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`↘️`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`→`);
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]--></span></div> <div class="metric-progress svelte-1xe1tgt"><div class="progress-bar svelte-1xe1tgt"><div class="progress-fill svelte-1xe1tgt"${attr_style(`width: ${stringify(metric.current / metric.target * 100)}%; background-color: ${stringify(metric.color)}`)}></div></div> <div class="metric-values svelte-1xe1tgt"><span class="current svelte-1xe1tgt">${escape_html(metric.current)}</span> <span class="target svelte-1xe1tgt">/ ${escape_html(metric.target)}</span></div></div></div>`);
  }
  $$payload.out.push(`<!--]--></div></section> <section class="dashboard-card card svelte-1xe1tgt"><div class="card-title svelte-1xe1tgt">🔥 Tasks by Priority</div> <div class="tasks-list svelte-1xe1tgt">`);
  if (each_array_2.length !== 0) {
    $$payload.out.push("<!--[-->");
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let task = each_array_2[$$index_2];
      $$payload.out.push(`<div class="task-item svelte-1xe1tgt"><div class="task-priority svelte-1xe1tgt"${attr_style(`background-color: ${stringify(getPriorityColor(task.priority))}`)}>${escape_html(task.priority.charAt(0).toUpperCase())}</div> <div class="task-details svelte-1xe1tgt"><div class="task-title svelte-1xe1tgt">${escape_html(task.title)}</div> <div class="task-meta svelte-1xe1tgt">`);
      if (task.deadline) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<span class="task-deadline">📅 ${escape_html(new Date(task.deadline).toLocaleDateString())}</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--> `);
      if (task.sourceNodeId) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<span class="task-source">🌳 Branch task</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div></div> <div class="task-effort svelte-1xe1tgt">${escape_html(getEffortSize(task.estimatedHours))}</div></div>`);
    }
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="empty-state svelte-1xe1tgt"><p class="svelte-1xe1tgt">No active tasks</p> <small class="svelte-1xe1tgt">Add tasks in the Tasks page or create them from branch nodes</small></div>`);
  }
  $$payload.out.push(`<!--]--></div></section> <section class="dashboard-card card svelte-1xe1tgt"><div class="card-title svelte-1xe1tgt">⚡ Tasks by Effort</div> <div class="tasks-list svelte-1xe1tgt">`);
  if (each_array_3.length !== 0) {
    $$payload.out.push("<!--[-->");
    for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
      let task = each_array_3[$$index_3];
      $$payload.out.push(`<div class="task-item svelte-1xe1tgt"><div${attr_class(`task-effort-badge effort-${stringify(getEffortSize(task.estimatedHours).toLowerCase())}`, "svelte-1xe1tgt")}>${escape_html(getEffortSize(task.estimatedHours))}</div> <div class="task-details svelte-1xe1tgt"><div class="task-title svelte-1xe1tgt">${escape_html(task.title)}</div> <div class="task-meta svelte-1xe1tgt"><span class="task-hours">${escape_html(task.estimatedHours)}h estimated</span> `);
      if (task.deadline) {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<span class="task-deadline">📅 ${escape_html(new Date(task.deadline).toLocaleDateString())}</span>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]--></div></div> <div class="task-priority-indicator svelte-1xe1tgt"${attr_style(`color: ${stringify(getPriorityColor(task.priority))}`)}>${escape_html(task.priority)}</div></div>`);
    }
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="empty-state svelte-1xe1tgt"><p class="svelte-1xe1tgt">No active tasks</p> <small class="svelte-1xe1tgt">Add tasks to see effort distribution</small></div>`);
  }
  $$payload.out.push(`<!--]--></div></section> <section class="dashboard-card card svelte-1xe1tgt"><div class="card-title svelte-1xe1tgt">⚡ Quick Actions</div> <div class="quick-actions svelte-1xe1tgt"><a href="/tasks" class="action-button svelte-1xe1tgt">📋 Manage Tasks</a> <a href="/upcoming" class="action-button svelte-1xe1tgt">📅 View Scenarios</a> <button class="action-button svelte-1xe1tgt">🎯 Optimize Schedule</button></div></section></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
