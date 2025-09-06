import { E as getContext, G as store_get, J as head, N as unsubscribe_stores, B as pop, z as push, F as escape_html } from "../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "clsx";
import "../../../../chunks/state.svelte.js";
import "../../../../chunks/stores.js";
import "cytoscape";
const getStores = () => {
  const stores$1 = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores$1.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores$1.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores$1.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
function _page($$payload, $$props) {
  push();
  var $$store_subs;
  parseInt(store_get($$store_subs ??= {}, "$page", page).params.id);
  store_get($$store_subs ??= {}, "$page", page).url.searchParams.get("type") || "event";
  head($$payload, ($$payload2) => {
    $$payload2.title = `<title>Branch Map - ${escape_html("Loading...")} - Branchboard</title>`;
  });
  $$payload.out.push(`<div class="branch-map-page svelte-1gc2xz8"><div class="page-header svelte-1gc2xz8"><div class="header-left svelte-1gc2xz8"><button class="btn btn-secondary">← Back to Upcoming</button></div> <div class="header-center svelte-1gc2xz8">`);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<h1 class="svelte-1gc2xz8">Loading...</h1>`);
  }
  $$payload.out.push(`<!--]--></div> <div class="header-right svelte-1gc2xz8"></div></div> `);
  {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="loading-container svelte-1gc2xz8"><div class="loading svelte-1gc2xz8"></div> <p>Loading branch map...</p></div>`);
  }
  $$payload.out.push(`<!--]--></div>`);
  if ($$store_subs) unsubscribe_stores($$store_subs);
  pop();
}
export {
  _page as default
};
