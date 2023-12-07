<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed, provide, toRefs, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteUpdate } from 'vue-router';
import { storeToRefs } from 'pinia';
import { $store } from '@/stores/$store';
import appLayout from '@/components/AppLayout.vue';
import componentSearchArt from '@/components/art/CpnSearchArt.vue';
import Base from '@/utils/app';

interface IData {
	title: string;
	cates?: Array<any> | null;
	currTab?: number;
	currCate?:
		| {
				[x: string]: any;
		  }
		| null
		| undefined;
	loading?: {
		box: HTMLDivElement;
		close: () => void;
	} | null;
	isLoading?: boolean;
	isBtnShow?: boolean;
	routeId?: number | string;
	moreDataTips: string;
	sonHeight?: number;
	scrollListener?: {
		off: () => void;
	} | null;
	indexPage?: number; // 推荐页码,
	isScroll?: boolean;
	btnFlag?: boolean;
	pager: {
		pageIndex?: number;
		pageSize?: number;
	};
}

const route = useRoute();
const router = useRouter();
const store = $store();
const { state } = storeToRefs(store);
const data: IData = reactive({
	title: '健康资讯',
	cates: [],
	currTab: 0,
	currCate: null,
	loading: null,
	isLoading: false,
	isBtnShow: false,
	routeId: 0,
	moreDataTips: '暂无资讯',
	sonHeight: 0,
	scrollListener: null,
	indexPage: 1, // 推荐页码,
	isScroll: false,
	btnFlag: false,
	pager: {
		pageIndex: 1,
		pageSize: 10
	}
});

const scrollToTop = () => {
	let scrollTop = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;

	if (scrollTop > window.screen.height) {
		data.btnFlag = true;
	} else {
		data.btnFlag = false;
	}
};

const goTop = () => {
	if (data.isScroll) {
		return;
	}

	data.isScroll = true;
	nextTick(() => {
		let timer = setInterval(function () {
			let osTop = document.documentElement.scrollTop || document.body.scrollTop;
			let ispeed = Math.floor(-osTop / 5);
			document.documentElement.scrollTop = document.body.scrollTop = osTop + ispeed;

			if (osTop === 0) {
				data.isScroll = false;
				clearInterval(timer);
			}
		}, 30);
	});
};

const formatTime = (timestamp: number) => {
	return Base.formatTime(timestamp * 1000);
};

const changeRoute = (cateId: number) => {
	router.replace({ name: 'Articles', params: { id: cateId } }).catch(() => {});
};

const getIndexData = (cateId: number, callback: Function) => {
	let num: number = 1;

	if (!data.cates?.length) {
		return;
	}

	if (cateId === 0 && data.cates[0]) {
		data.indexPage = (data.indexPage as number) + 1;
		num = data.indexPage;
		data.isLoading = true;
	} else {
		num = 1;
		data.loading = Base.loading();
	}

	Base.ajax({
		url: Base.api.art.domain + '/home/index',
		data: {
			catid: isNaN(cateId) ? 1 : cateId,
			uid: state.value.uid,
			sign: state.value.sign,
			_random_: state.value._random_,
			tkuid: state.value.tkuid,
			page: num,
			size: data.pager.pageSize,
			ownuid: sessionStorage.getItem('ownuid') || '',
			ownsign: sessionStorage.getItem('ownsign') || ''
		},
		success: callback,
		complete: function () {
			data.isLoading = false;
		},
		error: function () {}
	});
};

const getData = () => {
	if (data.isLoading) {
		return;
	}

	if (!data.currCate) {
		return;
	}

	if (data.currCate.totalCount <= data.currCate.pageSize) {
		return;
	}

	const success = function (res: any) {
		if (!res.Bool) {
			Base.toast({ msg: res.Msg });
			return false;
		}

		if (!data.currCate) {
			return false;
		}

		data.currCate.totalCount = res.Data.TotalCount; // 重新获取列表总数， 与 index 接口 对不上

		if (data.currCate.articles.length + res.Data.DataList.length <= data.currCate.totalCount) {
			data.currCate.articles = data.currCate.articles.concat(res.Data.DataList);
		}

		if (res.Data.DataList.length === data.currCate.pageSize) {
			data.currCate.pageIndex++;
		}
	};

	data.isLoading = true;
	Base.ajax({
		url: Base.api.art.domain + '/article/list',
		data: {
			catid: data.currCate.Id,
			uid: state.value.uid,
			sign: state.value.sign,
			_random_: state.value._random_,
			page: data.currCate.pageIndex + 1,
			size: data.pager.pageSize,
			ownuid: sessionStorage.getItem('ownuid') || '',
			ownsign: sessionStorage.getItem('ownsign') || ''
		},
		success: success,
		complete: function () {
			data.isLoading = false;
		},
		error: function () {}
	});
};

const getTabIndexById = (id: number) => {
	if (!data.cates?.length) {
		return 0;
	}

	for (let i = 0, len = data.cates.length; i < len; i++) {
		if (id === data.cates[i].Id) {
			return i;
		}
	}

	return 0;
};

const fillTabData = (index: number, res: any) => {
	if (!data.cates?.length) {
		return;
	}

	if (!data.cates[index].articles.length) {
		data.cates[index].articles = res.Data.ArticleList.DataList;
	}

	data.cates[index].topArticles = res.Data.TopArticle;
	data.cates[index].totalCount = index === 0 ? res.Data.RecommendList.TotalCount : res.Data.ArticleList.TotalCount;
	data.currCate = data.cates[index];
};

const initData = (cateId: number, isNativeBack: boolean | number) => {
	data.isScroll = true;

	const success = function (res: any) {
		if (!res.Bool) {
			Base.wrong({ msg: res.Msg });
			return;
		}

		let index = 0;

		if (!data.cates?.length && res.Data.CategoryList?.length) {
			data.cates = [...res.Data.CategoryList];
			data.cates.unshift({ Id: 0, Name: '推荐' });

			data.cates.forEach((m, i) => {
				m.pageIndex = data.pager.pageIndex;
				m.pageSize = data.pager.pageSize;
				m.moreDataTips = '';

				if (i === 0) {
					m.totalCount = res.Data.RecommendList.TotalCount;
				} else {
					m.totalCount = 0;
				}
			});

			data.isScroll = false;
		}

		index = getTabIndexById(cateId) || 0;
		data.currTab = index;
		fillTabData(index, res);
	};

	!isNativeBack && changeRoute(cateId || 0);
	getIndexData(cateId, success);
};

const onTab = (index: number, cateId: number) => {
	data.isScroll = true;
	data.currTab = index;
	changeRoute(cateId);

	if (!data.cates?.length) {
		return;
	}

	if (data.cates[index].articles.length) {
		data.currCate = data.cates[index];
		data.isScroll = false;
		return;
	}

	getIndexData(cateId, function (res: any) {
		data.isScroll = false;
		fillTabData(index, res);
	});
};

const getUrlParam = (callback: Function, id: number) => {
	/*
	 *  截取国寿带的参数
	 */

	if (!route.query.channel && !route.query.sign && !route.query._random_) {
		state.value.uid = sessionStorage.getItem('uid') || '0';
		state.value.channel = sessionStorage.getItem('channel') || '';
		state.value.sign = sessionStorage.getItem('sign') || '';
		state.value._random_ = sessionStorage.getItem('_random_') || '';
		state.value.tkuid = Base.md5(state.value.uid);
	} else {
		state.value.uid = (route.query.uid as string) || '0';
		state.value.channel = (route.query.channel as string) || '';
		state.value.sign = (route.query.sign as string) || '';
		state.value._random_ = (route.query._random_ as string) || '';
		state.value.tkuid = Base.md5(state.value.uid);
	}

	Base.checkSign(state.value.uid, state.value.sign, state.value._random_, function () {
		callback(id);
	});

	// 防止刷新无参数
	sessionStorage.setItem('uid', state.value.uid);
	sessionStorage.setItem('channel', state.value.channel);
	sessionStorage.setItem('sign', state.value.sign);
	sessionStorage.setItem('_random_', state.value._random_);
	sessionStorage.setItem('tkuid', state.value.tkuid);
};

let refData = state.value.refData;
let curCateId = refData ? refData.cateId : parseInt(route.params.id as string);

getUrlParam(initData, curCateId); // 截断参数, 验证
store.setRefData(null);
data.routeId = route.params.id as string;

data.scrollListener = Base.whenScrollBottom(function () {
	if (data.isScroll) {
		return;
	}

	if (data.routeId == 0) {
		getIndexData(0, function (res: any) {
			if (!data.currCate?.articles) {
				return;
			}

			if (data.currCate.articles.length + res.Data.RecommendList.DataList.length <= data.currCate.totalCount) {
				data.currCate.articles = data.currCate.articles.concat(res.Data.RecommendList.DataList);
			}

			if (res.Data.RecommendList.DataList.length === data.currCate.pageSize) {
				data.currCate.pageIndex++;
			}
		});

		return;
	}

	data.currCate && getData();
});
document.title = data.title;

onMounted(() => {
	setTimeout(() => {
		Base.initShare({
			title: '泰康养老健康资讯',
			desc: '泰康养老健康资讯',
			link: Base.getShareLink(route.path)
		});
	}, 300);

	window.addEventListener('scroll', scrollToTop);
});

onBeforeRouteUpdate(async (to, from, next) => {
	if (to.params.id !== from.params.id) {
		initData(parseInt(to.params.id as string), true);
	}

	next();
});

watch([route, state], ([newroute, newstate], [prevroute, prevstate]) => {
	data.routeId = newroute.params.id as string;
});
</script>

<template>
	<app-layout>
		<div class="home-set">
			<div class="set-tabs">
				<div class="tabs">
					<template :key="cate.Id" v-for="(cate, i) in data.cates">
						<a @click="onTab(i, cate.Id)" :class="{ on: data.currTab === i }">
							{{ cate.Name }}
						</a>
					</template>
				</div>
			</div>

			<component-search-art></component-search-art>

			<!-- 文章列表 -->
			<div class="set-cont-wrap">
				<template v-for="(cate, i) in data.cates" :key="cate.Id">
					<div v-show="data.currTab === i" class="cont-list js-tab-item">
						<router-link v-for="art in cate.topArticles" :key="art.Id" :to="'/Article/' + art.Id">
							<dl>
								<dt v-if="!art.PicUrl"></dt>
								<dt v-else v-bind:style="'background:url(' + art.PicUrl + ') center no-repeat;'">
									<i v-if="art.Type === 3" class="icon-play"></i>
								</dt>

								<dd>
									<b>{{ art.Title }}</b>
									<i class="icon-clock">{{ formatTime(art.PushPublishDate) }}</i>
									<i class="icon-top">置顶</i>
								</dd>
							</dl>
						</router-link>

						<router-link v-for="(art, artIndex) in cate.articles" :key="art.Id" :to="'/Article/' + art.Id">
							<dl>
								<dt v-if="!art.PicUrl"></dt>
								<dt v-else v-bind:style="'background:url(' + art.PicUrl + ') center no-repeat;'">
									<i v-if="art.Type === 3" class="icon-play"></i>
								</dt>

								<dd>
									<b>{{ art.Title }}</b>
									<i class="icon-clock">{{ formatTime(art.PushPublishDate) }}</i>
									<i v-if="art.Type === 3" class="type-video">视频</i>
									<i v-else class="type-art">文章</i>

									<!-- <i v-if="cate.Id === 0 && artIndex <= 2" class="icon-top">置顶</i> -->
								</dd>
							</dl>
						</router-link>
					</div>
				</template>
			</div>

			<transition name="fade">
				<div @click="goTop" v-show="data.btnFlag" class="btn-gotop">返回顶部</div>
			</transition>

			<div class="bottom-logo">
				<img src="@/assets/images/logo_tkyl.jpg" alt="底部logo" />
				<p class="bottom-logo-name">泰康养老保险股份有限公司</p>
				<p class="bottom-logo-msg">泰康养老自营网络平台<em>信息披露</em>，可点选泰康养老查看</p>
			</div>
		</div>
	</app-layout>
</template>
