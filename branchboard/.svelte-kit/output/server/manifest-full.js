export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["icon.svg"]),
	mimeTypes: {".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.HBg6gX-d.js",app:"_app/immutable/entry/app.Bs7DF36r.js",imports:["_app/immutable/entry/start.HBg6gX-d.js","_app/immutable/chunks/D_W5mvzR.js","_app/immutable/chunks/B_eIANii.js","_app/immutable/chunks/CdyQOU9H.js","_app/immutable/entry/app.Bs7DF36r.js","_app/immutable/chunks/CdyQOU9H.js","_app/immutable/chunks/B_eIANii.js","_app/immutable/chunks/DsnmJJEf.js","_app/immutable/chunks/DEBHm2Tm.js","_app/immutable/chunks/lqPv2ZKe.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js')),
			__memo(() => import('./nodes/3.js')),
			__memo(() => import('./nodes/4.js')),
			__memo(() => import('./nodes/5.js')),
			__memo(() => import('./nodes/6.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			},
			{
				id: "/branch-map/[id]",
				pattern: /^\/branch-map\/([^/]+?)\/?$/,
				params: [{"name":"id","optional":false,"rest":false,"chained":false}],
				page: { layouts: [0,], errors: [1,], leaf: 3 },
				endpoint: null
			},
			{
				id: "/dashboards",
				pattern: /^\/dashboards\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 4 },
				endpoint: null
			},
			{
				id: "/tasks",
				pattern: /^\/tasks\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 5 },
				endpoint: null
			},
			{
				id: "/upcoming",
				pattern: /^\/upcoming\/?$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 6 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
