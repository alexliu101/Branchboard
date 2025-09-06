
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/branch-map" | "/branch-map/[id]" | "/dashboards" | "/tasks" | "/upcoming";
		RouteParams(): {
			"/branch-map/[id]": { id: string }
		};
		LayoutParams(): {
			"/": { id?: string };
			"/branch-map": { id?: string };
			"/branch-map/[id]": { id: string };
			"/dashboards": Record<string, never>;
			"/tasks": Record<string, never>;
			"/upcoming": Record<string, never>
		};
		Pathname(): "/" | "/branch-map" | "/branch-map/" | `/branch-map/${string}` & {} | `/branch-map/${string}/` & {} | "/dashboards" | "/dashboards/" | "/tasks" | "/tasks/" | "/upcoming" | "/upcoming/";
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/icon.svg" | string & {};
	}
}