<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed, provide, toRefs, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { $store } from '@/stores/$store';
import appLayout from '@/components/AppLayout.vue';
import Base from '@/utils/app';

interface IData {
	title: string;
	aid: number;
	videoWrapPT: number;
	videoObj: IVideoObj;
	videoList: Array<any>;
	videoListTotal: number;
	zoomLevel: number;
	hasLike: boolean;
	isShow: boolean;
	videoDuration: string | number;
	videoCurrentTime: string | number;
	videoSecDuration: number;
	videoSecCurrentTime: number;
	isShowKeyFrame: boolean;
	isShowControls: boolean;
	isPlaying: boolean;
	startX: number;
	disX: number;
	defaultX: number;
	barWidth: number;
	guidCode: string;
	page: number;
	posterHeight: number;
	isFirstLoad: boolean;
	getDefaultX: Function | null;
}
interface IVideoObj {
	Content?: string;
	Copyright: string;
	Id: number | null;
	VideoPicUrl: string | null;
	VideoUrl: string | null;
	PushPublishDate: number | null;
	Publisher: string;
	Title: string;
	ViewCount: number | null;
}

const route = useRoute();
const router = useRouter();
const store = $store();
const { state } = storeToRefs(store);
const data: IData = reactive({
	title: '健康微课堂',
	aid: 0,
	videoWrapPT: 0,
	videoObj: {
		Content: '',
		Copyright: '',
		Id: null,
		VideoPicUrl: null,
		VideoUrl: null,
		PushPublishDate: null,
		Publisher: '',
		Title: '',
		ViewCount: 0
	},
	videoList: [],
	videoListTotal: 0,
	zoomLevel: 0,
	hasLike: false,
	isShow: false,
	videoDuration: 0,
	videoCurrentTime: 0,
	videoSecDuration: 0,
	videoSecCurrentTime: 0,
	isShowKeyFrame: true,
	isShowControls: false,
	isPlaying: false,
	startX: 0,
	disX: 0,
	defaultX: 0,
	barWidth: 0,
	guidCode: '',
	page: 1,
	posterHeight: 0,
	isFirstLoad: true,
	getDefaultX: null
});
const video = ref();
const videoCont = ref();
const progressbtn = ref();
const progressbar = ref();

const formatTime = (timestamp: number) => {
	return Base.formatTime(timestamp * 1000);
};

const getUserFontSize = () => {
	const fontSize = localStorage.getItem('userFontSize');

	if (fontSize) {
		data.zoomLevel = parseInt(fontSize) || 0;
	}
};

const fullscreen = () => {
	if (video.value.requestFullscreen) {
		video.value.requestFullscreen();
	} else if (video.value.webkitRequestFullscreen) {
		video.value.webkitRequestFullscreen();
	} else if (video.value.webkitEnterFullScreen) {
		video.value.webkitEnterFullScreen(); // for ios
	}
};

const loadData = (isScroll?: boolean) => {
	Base.ajax({
		url: Base.api.art.domain + '/article/videolist',
		data: {
			catid: 0,
			aid: data.aid,
			uid: state.value.uid,
			sign: state.value.sign,
			_random_: state.value._random_,
			ownuid: sessionStorage.getItem('ownuid') || '',
			ownsign: sessionStorage.getItem('ownsign') || '',
			page: data.page,
			size: 10
		},
		success: function (res: any) {
			if (!res.Data) {
				Base.wrong({ msg: res.Msg });
				return;
			}

			data.videoObj = res.Data.Data;
			data.videoListTotal = res.Data.TotalPage;

			if (isScroll) {
				data.videoList = data.videoList.concat(res.Data.DataList);
			} else if (data.isFirstLoad) {
				data.isFirstLoad = false;
				data.videoList = res.Data.DataList;
			}

			setTimeout(() => {
				Base.initShare({
					title: data.videoObj.Title,
					imgUrl: data.videoObj.VideoPicUrl || Base.defaultShareImgUrl
				});

				video.value && initVideo();

				data.posterHeight = video.value.getBoundingClientRect().height;
				data.videoWrapPT = videoCont.value.getBoundingClientRect().height;
			}, 300);
		}
	});
};

const formatSecTime = (sec: string | number) => {
	const minutes = parseInt(String((Number(sec) as number) / 60), 10);
	const seconds = Math.floor(Number(sec) % 60);

	return (minutes < 9 ? '0' + minutes : minutes) + ':' + (seconds < 9 ? '0' + seconds : seconds);
};

const initVideo = () => {
	video.value.addEventListener('loadeddata', function () {
		data.videoSecDuration = video.value.duration;
		data.videoDuration = formatSecTime(video.value.duration);
	});

	video.value.load();

	video.value.addEventListener('timeupdate', function () {
		data.videoSecCurrentTime = video.value.currentTime;
		data.videoCurrentTime = formatSecTime(video.value.currentTime);
	});
};

const touchstart = ($event: TouchEvent) => {
	const touch = $event.changedTouches[0];
	data.disX = touch.clientX - data.defaultX;
	pause();
};
const touchmove = ($event: TouchEvent) => {
	const touch = $event.changedTouches[0];
	const dis = touch.clientX - data.defaultX;

	data.videoSecCurrentTime = Math.floor((dis * data.videoSecDuration) / data.barWidth);
	// this.$refs.progressbtn.style.left = touch.clientX - this.defaultX + 'px';
};
const touchend = ($event: TouchEvent) => {
	const touch = $event.changedTouches[0];
	const dis = touch.clientX - data.defaultX;

	if (dis < 0) {
		data.videoSecCurrentTime = 0;
	}

	if (dis > data.barWidth) {
		data.videoSecCurrentTime = data.videoSecDuration - 1;
	}

	video.value.currentTime = data.videoSecCurrentTime;
	play();
};

const videoClick = () => {
	data.isShowControls = !data.isShowControls;

	setTimeout(() => {
		data.isShowControls = false;
	}, 5000);
};

const getDefaultX = () => {
	nextTick(() => {
		data.defaultX = progressbtn.value.getBoundingClientRect().left;
		data.barWidth = progressbar.value.clientWidth;
	});
};

const playToggle = () => {
	data.isPlaying ? pause() : play();
};

const play = () => {
	data.isPlaying = true;
	data.isShowKeyFrame = false;
	video.value.play();
	data.isShowControls = true;
	getDefaultX && getDefaultX();

	setTimeout(() => {
		data.getDefaultX = null;
	}, 30);

	setTimeout(() => {
		data.isShowControls = false;
	}, 5000);
};

const pause = () => {
	data.isPlaying = false;
	video.value.pause();
};

const videoProgress = () => {
	const p = data.videoSecCurrentTime / data.videoSecDuration;

	if (p < 0.08) {
		return '12px';
	}

	return (p * 100).toFixed(2) + '%';
};

const setSeo = () => {
	// 埋点
	Base.ajax({
		url: Base.api.art.domain + '/article/AddUserViewLog',
		data: {
			id: data.aid,
			uid: state.value.uid,
			sign: state.value.sign,
			_random_: state.value._random_,
			guidCode: data.guidCode,
			source: state.value.channel,
			pixelwidth: window.screen.width,
			pixelheight: window.screen.height
		},
		success: function (res: any) {
			console.log(res.Msg);
		}
	});
};

const guid = () => {
	return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0,
			v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
};

document.title = data.title;
data.aid = parseInt(route.params.id as string) || 0;

if (!route.query.channel && !route.query.sign && !route.query._random_) {
	state.value.uid = sessionStorage.getItem('uid') || 0;
	state.value.sign = sessionStorage.getItem('sign') || '';
	state.value._random_ = sessionStorage.getItem('_random_') || '';
} else {
	state.value.uid = (route.query.uid as string) || 0;
	state.value.sign = (route.query.sign as string) || '';
	state.value._random_ = (route.query._random_ as string) || '';
}

Base.checkSign(state.value.uid, state.value.sign, state.value._random_, () => {
	loadData();
});

// 防止刷新无参数
sessionStorage.setItem('uid', state.value.uid as string);
sessionStorage.setItem('channel', state.value.channel as string);
sessionStorage.setItem('sign', state.value.sign);
sessionStorage.setItem('_random_', state.value._random_);

onMounted(() => {
	getUserFontSize();

	Base.whenScrollBottom(
		50,
		() => {
			if (data.page >= data.videoListTotal) {
				data.isShow = true;
				return;
			}
			data.page += 1;
			loadData(true);
		},
		() => {
			data.isShow = false;
		}
	);
});

watch(route, (newroute, oldroute) => {
    if (newroute.path !== oldroute.path) {
        pause();
        data.isShowKeyFrame = true;
        data.aid = parseInt(newroute.params.id as string) || 0;
        loadData();
    }
})
</script>

<template>
	<app-layout>
		<div class="video-wrap" :style="{ paddingTop: data.videoWrapPT + 20 + 'px' }">
			<div class="video-cont" ref="videoCont">
				<h1>{{ data.videoObj.Title }}</h1>
				<div class="info">
					<i class="icon-clock">{{ formatTime(data.videoObj.PushPublishDate as number) }}</i>
				</div>

				<div class="detail" :class="'zoom-' + data.zoomLevel">
					<div class="video" ref="video-wrap">
						<video
							ref="video"
							@click="videoClick"
							x-webkit-airplay="true"
							webkit-playsinline="true"
							playsinline="true"
							preload="auto"
						>
							<source :src="data.videoObj.VideoUrl || ''" type="video/mp4" />
						</video>
						<!-- 视频 poster 属性无法兼容部分浏览器/机型 -->
						<img
							:src="data.videoObj.VideoPicUrl || ''"
							:style="{
								display: data.videoObj.VideoPicUrl ? 'block' : 'none',
								height: data.posterHeight + 'px'
							}"
						/>
						<div class="key-frame" @click="play" v-if="data.isShowKeyFrame">
							<i></i>
						</div>
						<div class="controls" v-if="!data.isShowKeyFrame" :class="{ visible: data.isShowControls }">
							<div
								class="icon-btn"
								@click="playToggle"
								:class="{ 'btn-play': !data.isPlaying, 'btn-pause': data.isPlaying }"
							></div>
							<div class="progress">
								<span>{{ data.videoCurrentTime }}/{{ data.videoDuration }}</span>
								<em ref="progressbar">
									<i :style="{ width: videoProgress() }">
										<b
											@touchstart="touchstart"
											@touchmove="touchmove"
											@touchend="touchend"
											ref="progressbtn"
										></b>
									</i>
								</em>
							</div>
							<div class="icon-btn btn-full" @click="fullscreen"></div>
						</div>
					</div>

					<div v-if="!data.videoObj.Content" v-html="data.videoObj.Content"></div>
				</div>
			</div>

			<div class="home-set">
				<div class="cont-list">
					<b class="list-title list-title-blue">推荐观看</b>
					<router-link
						v-for="(m, i) in data.videoList"
						:key="m.Id"
						:to="{ name: 'jkwktDetail', params: { id: m.Id } }"
						:class="{ active: m.Id === data.videoObj.Id }"
					>
						<dl>
							<dt :style="'background:url(' + m.VideoPicUrl + ') center no-repeat;'"></dt>
							<dd>
								<b>{{ m.Title }}</b>
								<i class="icon-clock">{{ formatTime(m.PushPublishDate) }}</i>
							</dd>
						</dl>
					</router-link>
				</div>
			</div>
		</div>

		<component-loading :notMore="data.isShow" :tips="'没有更多资讯了'"></component-loading>

		<div slot="footer"></div>
	</app-layout>
</template>
