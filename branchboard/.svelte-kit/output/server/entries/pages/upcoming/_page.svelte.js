import { R as fallback, S as bind_props, B as pop, z as push, G as store_get, I as ensure_array_like, J as head, Q as attr_style, F as escape_html, P as stringify, N as unsubscribe_stores, T as maybe_selected, M as attr } from "../../../chunks/index2.js";
import { u as upcomingEvents, g as scenarios, j as events, s as storeActions } from "../../../chunks/stores.js";
function Calendar_1($$payload, $$props) {
  push();
  let events2 = fallback($$props["events"], () => [], true);
  let onEventClick = fallback($$props["onEventClick"], null);
  let onDateClick = fallback($$props["onDateClick"], null);
  $$payload.out.push(`<div></div>`);
  bind_props($$props, { events: events2, onEventClick, onDateClick });
  pop();
}
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  let groupedScenarios;
  let showAddModal = false;
  let newItemType = "event";
  let newItemTitle = "";
  let newItemDate = "";
  let newItemDescription = "";
  function openAddModal() {
    showAddModal = true;
    newItemTitle = "";
    newItemDate = "";
    newItemDescription = "";
  }
  function openBranchMap(item) {
    const itemType = item.start ? "event" : "scenario";
    window.location.href = `/branch-map/${item.id}?type=${itemType}`;
  }
  async function createBranchMap(item) {
    if (item.start) {
      await storeActions.updateEvent(item.id, { hasBranchMap: true });
    } else {
      await storeActions.updateScenario(item.id, { hasBranchMap: true });
    }
    openBranchMap(item);
  }
  function handleEventClick(event) {
    if (event.hasBranchMap) {
      openBranchMap(event);
    } else {
      createBranchMap(event);
    }
  }
  function handleDateClick(date) {
    newItemType = "event";
    newItemDate = date.toISOString().split("T")[0];
    openAddModal();
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
  store_get($$store_subs ??= {}, "$upcomingEvents", upcomingEvents);
  groupedScenarios = {
    high: store_get($$store_subs ??= {}, "$scenarios", scenarios).filter((s) => s.priority === "high"),
    medium: store_get($$store_subs ??= {}, "$scenarios", scenarios).filter((s) => s.priority === "medium"),
    low: store_get($$store_subs ??= {}, "$scenarios", scenarios).filter((s) => s.priority === "low")
  };
  const each_array = ensure_array_like(Object.entries(groupedScenarios));
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Upcoming - Branchboard</title>`;
  });
  $$payload.out.push(`<div class="upcoming-container svelte-mcxpnl"><div class="page-header svelte-mcxpnl"><h1 class="svelte-mcxpnl">📅 Upcoming</h1> <button class="btn btn-primary">+ Add Event/Scenario</button></div> <div class="content-grid svelte-mcxpnl"><section class="events-section svelte-mcxpnl"><h2 class="svelte-mcxpnl">🗓️ Calendar Events</h2> <div class="calendar-container svelte-mcxpnl">`);
  Calendar_1($$payload, {
    events: store_get($$store_subs ??= {}, "$events", events),
    onEventClick: handleEventClick,
    onDateClick: handleDateClick
  });
  $$payload.out.push(`<!----></div></section> <section class="scenarios-section svelte-mcxpnl"><h2 class="svelte-mcxpnl">🤔 Scenarios &amp; What-Ifs</h2> <!--[-->`);
  for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
    let [priority, scenarioList] = each_array[$$index_1];
    if (scenarioList.length > 0) {
      $$payload.out.push("<!--[-->");
      const each_array_1 = ensure_array_like(scenarioList);
      $$payload.out.push(`<div class="priority-group svelte-mcxpnl"><h3 class="priority-header svelte-mcxpnl"><span class="priority-dot svelte-mcxpnl"${attr_style(`background-color: ${stringify(getPriorityColor(priority))}`)}></span> ${escape_html(priority.charAt(0).toUpperCase() + priority.slice(1))} Priority</h3> <div class="scenarios-list svelte-mcxpnl"><!--[-->`);
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let scenario = each_array_1[$$index];
        $$payload.out.push(`<div class="scenario-item card svelte-mcxpnl"><div class="scenario-header svelte-mcxpnl"><div class="scenario-title svelte-mcxpnl">${escape_html(scenario.title)}</div> <div class="scenario-priority svelte-mcxpnl"${attr_style(`color: ${stringify(getPriorityColor(scenario.priority))}`)}>${escape_html(scenario.priority.toUpperCase())}</div></div> <div class="scenario-description svelte-mcxpnl">${escape_html(scenario.description)}</div> <div class="scenario-actions">`);
        if (scenario.hasBranchMap) {
          $$payload.out.push("<!--[-->");
          $$payload.out.push(`<span class="branch-indicator svelte-mcxpnl">🌳 Has Branch Map</span>`);
        } else {
          $$payload.out.push("<!--[!-->");
          $$payload.out.push(`<span class="no-branch svelte-mcxpnl">➕ Add Branch Map</span>`);
        }
        $$payload.out.push(`<!--]--></div></div>`);
      }
      $$payload.out.push(`<!--]--></div></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]-->`);
  }
  $$payload.out.push(`<!--]--></section></div></div> `);
  if (showAddModal) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="modal-overlay svelte-mcxpnl"><div class="modal svelte-mcxpnl"><div class="modal-header svelte-mcxpnl"><h3 class="svelte-mcxpnl">Add New ${escape_html(newItemType === "event" ? "Event" : "Scenario")}</h3> <button class="modal-close svelte-mcxpnl">×</button></div> <form class="svelte-mcxpnl"><div class="form-group"><label class="form-label">Type:</label> <select class="w-full">`);
    $$payload.select_value = newItemType;
    $$payload.out.push(`<option value="event"${maybe_selected($$payload, "event")}>📅 Event (has specific date)</option><option value="scenario"${maybe_selected($$payload, "scenario")}>🤔 Scenario (what-if, undated)</option>`);
    $$payload.select_value = void 0;
    $$payload.out.push(`</select></div> <div class="form-group"><label class="form-label" for="title">Title:</label> <input id="title" type="text"${attr("value", newItemTitle)} placeholder="Enter title..." class="w-full" required/></div> `);
    if (newItemType === "event") {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<div class="form-group"><label class="form-label" for="date">Date:</label> <input id="date" type="date"${attr("value", newItemDate)} class="w-full" required/></div>`);
    } else {
      $$payload.out.push("<!--[!-->");
    }
    $$payload.out.push(`<!--]--> <div class="form-group"><label class="form-label" for="description">Description:</label> <textarea id="description" placeholder="Add details..." class="w-full" rows="3">`);
    const $$body = escape_html(newItemDescription);
    if ($$body) {
      $$payload.out.push(`${$$body}`);
    }
    $$payload.out.push(`</textarea></div> <div class="modal-actions svelte-mcxpnl"><button type="button" class="btn btn-secondary">Cancel</button> <button type="submit" class="btn btn-primary">Add ${escape_html(newItemType === "event" ? "Event" : "Scenario")}</button></div></form></div></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
