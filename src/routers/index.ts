import { createRouter, createWebHashHistory } from 'vue-router';

const ArtHome = () => import('@/components/art/Home.vue');
const ArtSearch = () => import('@/components/art/Search.vue');
const ArtDetail = () => import('@/components/art/Detail.vue');
const Jkwkt = () => import('@/components/art/Jkwkt.vue');
const modules = import.meta.glob('@/views/**/*.vue');

// 路由
const routes = [
    {
        path: '/',
        name: 'Home',
        redirect: '/articles/'
    },
    {
        path: '/art/',
        name: 'ArtHome',
        component: ArtHome
    },
    {
        path: '/articles/:id',
        name: 'Articles',
        component: ArtHome
    },
    {
        path: '/articles/',
        redirect: '/Articles/0',
        strict: false,
        sensitive: false
    },
    {
        path: '/art/search/:keyword',
        name: 'ArtSearch',
        component: ArtSearch
    },
    {
        path: '/article/:id',
        name: 'Article',
        component: ArtDetail
    },
    {
        path: '/art/jkwkt/:id',
        name: 'JkwktDetail',
        component: Jkwkt
    },
]

// 动态生成路由
const modulesRoute = Object.keys(modules).map(key => {
    const name = key.replace(/.*\/(.*).vue$/, '$1')  
    const path = name === 'Home' ? '/' : `/${name.toLowerCase()}`

    return {
        path,
        name, 
        component: modules[key]
    } 
});

const router = createRouter({
	history: createWebHashHistory(),
	routes: [
        ...routes,
        ...modulesRoute
	],
	strict: false,
	sensitive: false,
	scrollBehavior(to, from, savedPosition) {
		if (savedPosition) {
			return savedPosition;
		} else {
			let position: any = {};

			if (to.hash) {
				position.selector = to.hash;
			}

			if (to.matched.some((m) => m.meta.scrollToTop)) {
				position.x = 0;
				position.y = 0;
			}

			return position;
		}
	}
});

router.beforeEach((to, from, next) => {
	if (to.matched.length === 0) {
		next({ name: '404' });
	}
	else {
		next();
	}
});

export default router;
