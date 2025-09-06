import { D as slot } from "../../chunks/index2.js";
function _layout($$payload, $$props) {
  $$payload.out.push(`<main class="svelte-7f5ulh"><nav class="nav svelte-7f5ulh"><div class="nav-brand svelte-7f5ulh"><h1 class="svelte-7f5ulh">🌳 Branchboard</h1></div> <div class="nav-links svelte-7f5ulh"><a href="/" class="nav-link svelte-7f5ulh">Today</a> <a href="/upcoming" class="nav-link svelte-7f5ulh">Upcoming</a> <a href="/tasks" class="nav-link svelte-7f5ulh">Tasks</a> <a href="/dashboards" class="nav-link svelte-7f5ulh">Dashboards</a></div></nav> <div class="content svelte-7f5ulh"><!---->`);
  slot($$payload, $$props, "default", {});
  $$payload.out.push(`<!----></div></main>`);
}
export {
  _layout as default
};
