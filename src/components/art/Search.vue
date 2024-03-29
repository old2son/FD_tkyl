<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, nextTick, computed, provide, toRefs, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { $store } from '@/stores/$store';
import appLayout from '@/components/AppLayout.vue';
import componentSearchArt from '@/components/art/CpnSearchArt.vue';
import componentLoading from '@/components/art/CpnPageLoading.vue';
import Base from '@/utils/app';

interface IData {
	title: string;
	pageIndex: number;
	pageSize: number;
	totalCount: number;
	keyword: string;
	list: any[];
	otherRelateList: any[];
	status: Array<{ type: number; name: string; className: string }>;
	loading: {
		box: HTMLDivElement;
		close: () => void;
	} | null;
	isLoading: boolean;
	moreDataTips: string;
	scrollListener: {
		off: () => void;
	} | null;
}

const route = useRoute();
const router = useRouter();
const store = $store();
const { state } = storeToRefs(store);
const data: IData = reactive({
	title: '资讯搜索',
	pageIndex: 1,
	pageSize: 10,
	totalCount: 0,
	keyword: '',
	list: [],
	otherRelateList: [],
	status: [
		{
			type: 1,
			name: '进行中',
			className: 'being'
		},
		{
			type: 2,
			name: '已结束',
			className: 'finish'
		}
	],
	loading: null,
	isLoading: false,
	moreDataTips: '暂无资讯',
	scrollListener: null
});

const formatTime = (timestamp: number) => {
	return Base.formatTime(timestamp * 1000);
};

const getData = (isSame?: boolean) => {
	if (data.isLoading) {
		return;
	}

	if (!isSame && typeof isSame === 'boolean') {
		data.pageIndex = 1;
	}

	data.isLoading = true;

	if (data.pageIndex === 1) {
		data.loading = Base.loading();
	}

	Base.ajax({
		url: Base.api.art.domain + '/article/search',
		data: {
			uid: state.value.uid,
			sign: state.value.sign,
			_random_: state.value._random_,
			page: data.pageIndex,
			size: data.pageSize,
			keyword: data.keyword,
			ownuid: sessionStorage.getItem('ownuid') || '',
			ownsign: sessionStorage.getItem('ownsign') || ''
		},
		success: function (res: any) {
			if (!res.Bool) {
				Base.toast({ msg: res.Msg });
				return false;
			}

			// 高亮摘要关键字
			res.Data.DataList.map((item: any, index: number) => {
				let replaceReg = new RegExp(data.keyword, 'g');
				let replaceString = `<em class="hightlight-word">${data.keyword}</em>`;
				item.Summary = item.Summary.replace(replaceReg, replaceString);
			});

			data.totalCount = res.Data.TotalCount;

			if (data.pageIndex === 1) {
				data.list = res.Data.DataList;

				if (data.list.length === 0) {
					data.otherRelateList = res.Data.OtherSearchList;
				}
			} else {
				if (data.list.length + res.Data.DataList.length <= data.totalCount) {
					data.list = data.list.concat(res.Data.DataList);
				}
			}

			if (res.Data.DataList.length === data.pageSize) {
				data.pageIndex++;
			}
		},
		complete: function () {
			data.isLoading = false;
			data.loading && data.loading.close();
		}
	});
};

const search = (keyword: string) => {
    let isSame = false

    if (data.keyword === keyword) {
        isSame = true;
    }

    data.keyword = keyword;

    getData(isSame);
    router.replace({name: 'ArtSearch', params: {keyword: keyword}});
}

const noMoreData = () => {
	if (!data.list.length && data.pageIndex === 1) {
		data.moreDataTips = '暂无资讯';
		return true;
	}

	if (data.totalCount === data.list.length && data.pageIndex > 1) {
		data.moreDataTips = '没有更多资讯了';
		return true;
	}
};

data.scrollListener = Base.whenScrollBottom(function () {
	if (data.list.length === 0) {
		return;
	}

	getData();
});

onMounted(() => {
	setTimeout(() => {
		Base.initShare({
			title: '泰康养老健康资讯',
			desc: '泰康养老健康资讯',
			link: Base.getShareLink(route.path)
		});
	}, 300);
});

onUnmounted(() => {
	if (!data.scrollListener) {
		return;
	}

	data.scrollListener.off();
});

const onKeyword = computed(() => {
    return state.value.keyword;
});

watch(onKeyword, (newKey, oldKey) => {
    search(newKey as string);
});
</script>

<template>
	<app-layout>
		<div class="container list-page">
			<component-search-art></component-search-art>

			<div class="search-cont" v-if="data.list.length">
				<div class="cont-result">
					为您找到 <em>{{ data.keyword }}</em> 的健康资讯 <em class="cont-counts">{{ data.totalCount }}</em> 条
				</div>

				<div class="home-set">
					<div class="set-cont-wrap">
						<div v-for="(m, i) in data.list" class="cont-list" v-bind:key="i">
							<router-link v-bind:to="{ name: 'Article', params: { id: m.Id } }">
								<dl>
									<dt v-if="!m.PicUrl"></dt>
									<dt v-else v-bind:style="'background:url(' + m.PicUrl + ') center no-repeat;'">
										<i v-if="m.Type === 3" class="icon-play"></i>
									</dt>

									<dd>
										<b>{{ m.Title }}</b>
										<i class="icon-clock">{{ formatTime(m.PushPublishDate) }}</i>
										<i v-if="m.Type === 3" class="type-video">视频</i>
										<i v-else class="type-art">文章</i>
									</dd>
								</dl>
							</router-link>
						</div>
					</div>
				</div>
                
				<component-loading
					v-bind:isLoading="data.isLoading"
					v-bind:notMore="noMoreData()"
					v-bind:tips="data.moreDataTips"
				></component-loading>
			</div>

			<div class="search-fail" v-if="!data.list?.length">
				<div class="cont">
					<dl>
						<dt>抱歉，没有找到与 <em>{{ data.keyword }}</em> 相关的结果</dt>
						<dd>建议您用疾病名称或相关症状名称重新搜索</dd>
					</dl>
					<router-link v-bind:to="{ name: 'ArtHome' }" class="more">查看更多健康资讯</router-link>
				</div>

				<div class="home-set">
					<b class="search-relate-title">相关推荐</b>

					<div class="set-cont-wrap">
						<div v-for="(m, i) in data.otherRelateList" class="cont-list" :key="i">
							<router-link v-bind:to="{ name: 'Article', params: { id: m.Id } }">
								<dl>
									<dt v-if="!m.PicUrl"></dt>
									<dt v-else v-bind:style="'background:url(' + m.PicUrl + ') center no-repeat;'">
										<i v-if="m.Type === 3" class="icon-play"></i>
									</dt>

									<dd>
										<b>{{ m.Title }}</b>
										<i class="icon-clock">{{ formatTime(m.PushPublishDate) }}</i>
										<i v-if="m.Type === 3" class="type-video">视频</i>
										<i v-else class="type-art">文章</i>
									</dd>
								</dl>
							</router-link>
						</div>
					</div>
				</div>
			</div>
		</div>
	</app-layout>
</template>
