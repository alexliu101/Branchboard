import { G as store_get, J as head, F as escape_html, M as attr, K as attr_class, I as ensure_array_like, Q as attr_style, N as unsubscribe_stores, B as pop, z as push, P as stringify } from "../../../chunks/index2.js";
import { a as activeTasks, t as tasks, o as overdueTasks, e as completedTasks, h as scheduleAnalysis, i as isOptimizing } from "../../../chunks/stores.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let filteredTasks, tasksByPriority;
  let filter = "active";
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
  function formatDate(dateStr) {
    if (!dateStr) return "No deadline";
    return new Date(dateStr).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
  }
  function isOverdue(deadline) {
    if (!deadline) return false;
    return new Date(deadline) < /* @__PURE__ */ new Date();
  }
  filteredTasks = (() => {
    switch (filter) {
      case "active":
        return store_get($$store_subs ??= {}, "$activeTasks", activeTasks);
      case "completed":
        return store_get($$store_subs ??= {}, "$completedTasks", completedTasks);
      case "overdue":
        return store_get($$store_subs ??= {}, "$overdueTasks", overdueTasks);
      case "all":
        return store_get($$store_subs ??= {}, "$tasks", tasks);
      default:
        return store_get($$store_subs ??= {}, "$activeTasks", activeTasks);
    }
  })();
  tasksByPriority = {
    high: filteredTasks.filter((t) => t.priority === "high"),
    medium: filteredTasks.filter((t) => t.priority === "medium"),
    low: filteredTasks.filter((t) => t.priority === "low")
  };
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Tasks - Branchboard</title>`;
  });
  $$payload.out.push(`<div class="tasks-container svelte-11v8xc3"><div class="page-header svelte-11v8xc3"><div class="header-left svelte-11v8xc3"><h1 class="svelte-11v8xc3">📋 Tasks</h1> `);
  if (store_get($$store_subs ??= {}, "$scheduleAnalysis", scheduleAnalysis)) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<p class="schedule-summary svelte-11v8xc3">${escape_html(store_get($$store_subs ??= {}, "$scheduleAnalysis", scheduleAnalysis).scheduledTasks)} tasks scheduled across ${escape_html(store_get($$store_subs ??= {}, "$scheduleAnalysis", scheduleAnalysis).workingDays)} days
					(${escape_html(store_get($$store_subs ??= {}, "$scheduleAnalysis", scheduleAnalysis).totalEstimatedHours)}h total)</p>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--></div> <div class="header-actions svelte-11v8xc3"><button class="btn btn-secondary"${attr("disabled", store_get($$store_subs ??= {}, "$isOptimizing", isOptimizing) || store_get($$store_subs ??= {}, "$activeTasks", activeTasks).length === 0, true)}>`);
  if (store_get($$store_subs ??= {}, "$isOptimizing", isOptimizing)) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<span class="loading"></span> Optimizing...`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`🎯 Optimize Schedule`);
  }
  $$payload.out.push(`<!--]--></button> <button class="btn btn-primary">+ Add Task</button></div></div> <div class="filters-section svelte-11v8xc3"><div class="filter-tabs svelte-11v8xc3"><button${attr_class("filter-tab svelte-11v8xc3", void 0, { "active": filter === "active" })}>Active (${escape_html(store_get($$store_subs ??= {}, "$activeTasks", activeTasks).length)})</button> <button${attr_class("filter-tab svelte-11v8xc3", void 0, { "active": filter === "overdue" })}>Overdue (${escape_html(store_get($$store_subs ??= {}, "$overdueTasks", overdueTasks).length)})</button> <button${attr_class("filter-tab svelte-11v8xc3", void 0, { "active": filter === "completed" })}>Completed (${escape_html(store_get($$store_subs ??= {}, "$completedTasks", completedTasks).length)})</button> <button${attr_class("filter-tab svelte-11v8xc3", void 0, { "active": filter === "all" })}>All (${escape_html(store_get($$store_subs ??= {}, "$tasks", tasks).length)})</button></div></div> <div class="tasks-content">`);
  {
    $$payload.out.push("<!--[-->");
    const each_array = ensure_array_like(Object.entries(tasksByPriority));
    $$payload.out.push(`<!--[-->`);
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let [priority, priorityTasks] = each_array[$$index_1];
      if (priorityTasks.length > 0) {
        $$payload.out.push("<!--[-->");
        const each_array_1 = ensure_array_like(priorityTasks);
        $$payload.out.push(`<section class="priority-section svelte-11v8xc3"><h2 class="priority-header svelte-11v8xc3"><span class="priority-dot svelte-11v8xc3"${attr_style(`background-color: ${stringify(getPriorityColor(priority))}`)}></span> ${escape_html(priority.charAt(0).toUpperCase() + priority.slice(1))} Priority (${escape_html(priorityTasks.length)})</h2> <div class="tasks-grid svelte-11v8xc3"><!--[-->`);
        for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
          let task = each_array_1[$$index];
          $$payload.out.push(`<div${attr_class("task-card card svelte-11v8xc3", void 0, { "overdue": isOverdue(task.deadline) })}><div class="task-header svelte-11v8xc3"><h3 class="task-title svelte-11v8xc3">${escape_html(task.title)}</h3> <span class="task-hours svelte-11v8xc3">${escape_html(task.estimatedHours)}h</span></div> `);
          if (task.description) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`<p class="task-description svelte-11v8xc3">${escape_html(task.description)}</p>`);
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]--> <div class="task-meta svelte-11v8xc3">`);
          if (task.deadline) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`<span${attr_class("task-deadline svelte-11v8xc3", void 0, { "overdue": isOverdue(task.deadline) })}>📅 ${escape_html(formatDate(task.deadline))}</span>`);
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]--> `);
          if (task.sourceNodeId) {
            $$payload.out.push("<!--[-->");
            $$payload.out.push(`<span class="task-source svelte-11v8xc3">🌳 From branch node</span>`);
          } else {
            $$payload.out.push("<!--[!-->");
          }
          $$payload.out.push(`<!--]--></div> <div class="task-actions svelte-11v8xc3"><button class="btn btn-success btn-sm">✓ Complete</button> <button class="btn btn-secondary btn-sm">✏️ Edit</button></div></div>`);
        }
        $$payload.out.push(`<!--]--></div></section>`);
      } else {
        $$payload.out.push("<!--[!-->");
      }
      $$payload.out.push(`<!--]-->`);
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></div></div> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
