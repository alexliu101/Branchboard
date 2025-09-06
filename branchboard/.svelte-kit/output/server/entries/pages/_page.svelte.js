import { G as store_get, I as ensure_array_like, J as head, F as escape_html, K as attr_class, M as attr, N as unsubscribe_stores, B as pop, z as push } from "../../chunks/index2.js";
import { s as storeActions, c as currentBranches, d as dbUtils, b as branchSwitchNotifications, f as focusTimer } from "../../chunks/stores.js";
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let timeString, dateString;
  let currentTime = /* @__PURE__ */ new Date();
  let quickNote = "";
  let todaysSchedule = [];
  let currentBranchInfo = {};
  async function loadCurrentBranchInfo() {
    try {
      const branches = await storeActions.getCurrentBranches?.() || store_get($$store_subs ??= {}, "$currentBranches", currentBranches);
      if (branches.length > 0) {
        const branch = branches[0];
        let parentItem = null;
        let parentType = null;
        if (branch.eventId) {
          parentItem = await dbUtils.getEvent(branch.eventId);
          parentType = "event";
        } else if (branch.scenarioId) {
          parentItem = await dbUtils.getScenario(branch.scenarioId);
          parentType = "scenario";
        }
        const signals = await dbUtils.getSignalsForNode(branch.id);
        const triggeredSignals = signals.filter((s) => s.isTriggered);
        currentBranchInfo = {
          branch: branch.description,
          parent: parentItem?.title || "Unknown",
          parentType,
          confidence: 75,
          // This could be calculated from assumptions
          recentSignals: triggeredSignals.slice(0, 3)
          // Show up to 3 recent signals
        };
      } else {
        currentBranchInfo = {
          branch: "No active branch",
          parent: "Set up scenarios in Upcoming",
          parentType: null,
          confidence: 0,
          recentSignals: []
        };
      }
    } catch (error) {
      console.error("Error loading current branch info:", error);
      currentBranchInfo = {
        branch: "Error loading branch",
        parent: "Check your data",
        parentType: null,
        confidence: 0,
        recentSignals: []
      };
    }
  }
  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
  }
  timeString = currentTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  dateString = currentTime.toLocaleDateString([], {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  if (store_get($$store_subs ??= {}, "$currentBranches", currentBranches)) {
    loadCurrentBranchInfo();
  }
  const each_array = ensure_array_like(store_get($$store_subs ??= {}, "$branchSwitchNotifications", branchSwitchNotifications));
  const each_array_2 = ensure_array_like(todaysSchedule.slice(0, 1));
  const each_array_3 = ensure_array_like(todaysSchedule.slice(1, 2));
  const each_array_4 = ensure_array_like(todaysSchedule.slice(2, 4));
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Today - Branchboard</title>`;
  });
  $$payload.out.push(`<div class="today-container svelte-ihgp95"><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let branchNotification = each_array[$$index];
    $$payload.out.push(`<div class="branch-notification svelte-ihgp95"><div class="notification-content svelte-ihgp95"><div class="notification-header svelte-ihgp95"><span class="notification-icon svelte-ihgp95">🔔</span> <strong class="svelte-ihgp95">Signal Triggered</strong></div> <div class="notification-details svelte-ihgp95"><p class="svelte-ihgp95"><strong class="svelte-ihgp95">${escape_html(branchNotification.signalData.signalName)}</strong>: 
						${escape_html(branchNotification.signalData.value)} ${escape_html(branchNotification.signalData.direction)} ${escape_html(branchNotification.signalData.threshold)}</p> <p class="svelte-ihgp95">Consider switching to: <strong class="svelte-ihgp95">"${escape_html(branchNotification.signalData.branchDescription)}"</strong></p></div></div> <div class="notification-actions svelte-ihgp95"><button class="btn btn-primary btn-sm svelte-ihgp95">Switch Branch</button> <button class="btn btn-secondary btn-sm svelte-ihgp95">Dismiss</button></div></div>`);
  }
  $$payload.out.push(`<!--]--> <div class="today-header svelte-ihgp95"><div class="time-display svelte-ihgp95"><div class="current-time svelte-ihgp95">${escape_html(timeString)}</div> <div class="current-date svelte-ihgp95">${escape_html(dateString)}</div></div> <div class="focus-timer svelte-ihgp95"><div class="timer-display svelte-ihgp95">${escape_html(formatTime(store_get($$store_subs ??= {}, "$focusTimer", focusTimer).timeRemaining))}</div> <div class="timer-controls svelte-ihgp95">`);
  if (!store_get($$store_subs ??= {}, "$focusTimer", focusTimer).isRunning) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<button class="btn btn-primary btn-sm svelte-ihgp95">▶️ Start Focus</button>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<button class="btn btn-secondary btn-sm svelte-ihgp95">⏹️ Stop</button>`);
  }
  $$payload.out.push(`<!--]--></div></div></div> <div class="current-branch-card card svelte-ihgp95"><div class="card-title svelte-ihgp95">🎯 Current Branch</div> <div class="branch-info svelte-ihgp95"><div class="branch-scenario svelte-ihgp95"><strong class="svelte-ihgp95">${escape_html(currentBranchInfo.parent)}</strong> → ${escape_html(currentBranchInfo.branch)}</div> <div class="branch-confidence svelte-ihgp95">Confidence: ${escape_html(currentBranchInfo.confidence)}%</div> `);
  if (currentBranchInfo.recentSignals?.length > 0) {
    $$payload.out.push("<!--[-->");
    const each_array_1 = ensure_array_like(currentBranchInfo.recentSignals);
    $$payload.out.push(`<div class="branch-signals svelte-ihgp95"><strong class="svelte-ihgp95">Active Signals:</strong> <!--[-->`);
    for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
      let signal = each_array_1[$$index_1];
      $$payload.out.push(`<span class="signal-tag triggered svelte-ihgp95">${escape_html(signal.metricName)}</span>`);
    }
    $$payload.out.push(`<!--]--></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="branch-signals svelte-ihgp95"><strong class="svelte-ihgp95">Status:</strong> <span class="signal-tag svelte-ihgp95">Monitoring for changes</span></div>`);
  }
  $$payload.out.push(`<!--]--></div></div> <div class="tasks-section svelte-ihgp95"><h2 class="svelte-ihgp95">📋 Today's Focus</h2> <div class="task-columns grid grid-3 svelte-ihgp95"><div class="task-column svelte-ihgp95"><h3 class="svelte-ihgp95">🔥 Now</h3> <div class="tasks-list svelte-ihgp95">`);
  if (each_array_2.length !== 0) {
    $$payload.out.push("<!--[-->");
    for (let $$index_2 = 0, $$length = each_array_2.length; $$index_2 < $$length; $$index_2++) {
      let scheduleItem = each_array_2[$$index_2];
      const task = scheduleItem.task;
      $$payload.out.push(`<div${attr_class("task-card card svelte-ihgp95", void 0, { "completed": task.status === "completed" })}><div class="task-header svelte-ihgp95"><span class="task-title svelte-ihgp95">${escape_html(task.title)}</span> <span class="task-duration svelte-ihgp95">${escape_html(scheduleItem.duration)}h</span></div> <div class="task-schedule svelte-ihgp95"><small class="task-time svelte-ihgp95">⏰ ${escape_html(new Date(scheduleItem.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</small></div> <div class="task-actions svelte-ihgp95">`);
      if (task.status !== "completed") {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<button class="btn btn-success btn-sm svelte-ihgp95">✓ Complete</button>`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`<span class="completed-badge svelte-ihgp95">✅ Done</span>`);
      }
      $$payload.out.push(`<!--]--></div></div>`);
    }
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="task-card card empty-state svelte-ihgp95"><p class="svelte-ihgp95">No scheduled tasks</p> <small class="svelte-ihgp95">Try optimizing your schedule</small></div>`);
  }
  $$payload.out.push(`<!--]--></div></div> <div class="task-column svelte-ihgp95"><h3 class="svelte-ihgp95">⏭️ Next</h3> <div class="tasks-list svelte-ihgp95">`);
  if (each_array_3.length !== 0) {
    $$payload.out.push("<!--[-->");
    for (let $$index_3 = 0, $$length = each_array_3.length; $$index_3 < $$length; $$index_3++) {
      let scheduleItem = each_array_3[$$index_3];
      const task = scheduleItem.task;
      $$payload.out.push(`<div${attr_class("task-card card svelte-ihgp95", void 0, { "completed": task.status === "completed" })}><div class="task-header svelte-ihgp95"><span class="task-title svelte-ihgp95">${escape_html(task.title)}</span> <span class="task-duration svelte-ihgp95">${escape_html(scheduleItem.duration)}h</span></div> <div class="task-schedule svelte-ihgp95"><small class="task-time svelte-ihgp95">⏰ ${escape_html(new Date(scheduleItem.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</small></div> <div class="task-actions svelte-ihgp95">`);
      if (task.status !== "completed") {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<button class="btn btn-success btn-sm svelte-ihgp95">✓ Complete</button>`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`<span class="completed-badge svelte-ihgp95">✅ Done</span>`);
      }
      $$payload.out.push(`<!--]--></div></div>`);
    }
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="task-card card empty-state svelte-ihgp95"><p class="svelte-ihgp95">No next tasks</p></div>`);
  }
  $$payload.out.push(`<!--]--></div></div> <div class="task-column svelte-ihgp95"><h3 class="svelte-ihgp95">📅 Later</h3> <div class="tasks-list svelte-ihgp95">`);
  if (each_array_4.length !== 0) {
    $$payload.out.push("<!--[-->");
    for (let $$index_4 = 0, $$length = each_array_4.length; $$index_4 < $$length; $$index_4++) {
      let scheduleItem = each_array_4[$$index_4];
      const task = scheduleItem.task;
      $$payload.out.push(`<div${attr_class("task-card card svelte-ihgp95", void 0, { "completed": task.status === "completed" })}><div class="task-header svelte-ihgp95"><span class="task-title svelte-ihgp95">${escape_html(task.title)}</span> <span class="task-duration svelte-ihgp95">${escape_html(scheduleItem.duration)}h</span></div> <div class="task-schedule svelte-ihgp95"><small class="task-time svelte-ihgp95">⏰ ${escape_html(new Date(scheduleItem.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }))}</small></div> <div class="task-actions svelte-ihgp95">`);
      if (task.status !== "completed") {
        $$payload.out.push("<!--[-->");
        $$payload.out.push(`<button class="btn btn-success btn-sm svelte-ihgp95">✓ Complete</button>`);
      } else {
        $$payload.out.push("<!--[!-->");
        $$payload.out.push(`<span class="completed-badge svelte-ihgp95">✅ Done</span>`);
      }
      $$payload.out.push(`<!--]--></div></div>`);
    }
  } else {
    $$payload.out.push("<!--[!-->");
    $$payload.out.push(`<div class="task-card card empty-state svelte-ihgp95"><p class="svelte-ihgp95">No later tasks</p></div>`);
  }
  $$payload.out.push(`<!--]--></div></div></div></div> <div class="quick-capture card svelte-ihgp95"><div class="card-title svelte-ihgp95">💭 Quick Capture</div> <div class="capture-form flex gap-2 svelte-ihgp95"><input type="text"${attr("value", quickNote)} placeholder="Quick note or task..." class="w-full svelte-ihgp95"/> <button class="btn btn-primary svelte-ihgp95">+ Add</button></div></div></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
