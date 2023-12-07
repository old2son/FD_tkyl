<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, computed, provide, toRefs, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { $store } from '@/stores/$store';
import appLayout from '@/components/AppLayout.vue';
import componentSearchArt from '@/components/art/CpnSearchArt.vue';
import Base from '@/utils/app';

interface IData {
	title: string;
	articleId: number;
	article: IArticle;
	articles: Array<any>;
	tags: Array<any>;
	zoomLevel: number;
	loading: null;
	hasLike: boolean;
	isShow: boolean;
	scrollListener?: {
		off: () => void;
	} | null;
	videoDuration: number;
	videoCurrentTime: number;
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
	getDefaultX: Function | null;
}

interface IArticle {
	Content: string;
	Copyright: string;
	Id: string | number;
	PicUrl: string;
	PublishDate: number | null;
	Publisher: string;
	Title: string;
	Type: number | null;
	VideoPicUrl?: string | null;
	VideoUrl?: string | null;
	ViewCount: number;
}

const route = useRoute();
const router = useRouter();
const store = $store();
const { state } = storeToRefs(store);
const data: IData = reactive({
	title: '健康资讯',
	articleId: 0,
	article: {
		Content: '',
		Copyright: '',
		Id: '',
		PicUrl: '',
		PublishDate: null,
		Publisher: '',
		Title: '',
		Type: null,
		VideoPicUrl: null,
		VideoUrl: null,
		ViewCount: 0
	},
	articles: [],
	tags: [],
	zoomLevel: 0,
	loading: null,
	hasLike: false,
	isShow: false,
	scrollListener: null,
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
	getDefaultX: null
});
const video = ref();
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

const setUserFontSize = () => {
	localStorage.setItem('userFontSize', data.zoomLevel.toString());
};

const zoom = () => {
	if (data.zoomLevel >= 2) {
		data.zoomLevel = 0;
	} else {
		data.zoomLevel = data.zoomLevel + 1;
	}

	setUserFontSize();
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

onMounted(() => {
	getUserFontSize();
});
</script>

<template>
	<app-layout>
		<div class="article-wrap">
			<div class="article-cont">
				<h1>{{ data.article.Title }}</h1>
				<div class="info">
					<!-- <i class="icon-clock">{{formatTime(article.PublishDate)}} / {{article.Publisher}}</i> -->
					<i class="icon-clock">{{ formatTime(data.article.PublishDate as number) }}</i>

					<!-- <a href="javascript:;" class="circle-play on"></a> -->
					<a
						@click="zoom()"
						class="circle-upcase on"
						:class="{ 'circle-upcase-blue': data.article.Type === 3 }"
					>
						Aa
					</a>
				</div>

				<div class="detail" :class="'zoom-' + data.zoomLevel">
					<div class="video" v-if="data.article.Type === 3">
						<!--  poster="http://vjs.zencdn.net/v/oceans.png" -->
						<video
							ref="video"
							@click="videoClick"
							:poster="data.article.VideoPicUrl || ''"
							x-webkit-airplay="true"
							webkit-playsinline="true"
							playsinline="true"
							preload="auto"
						>
							<source :src="data.article.VideoUrl || ''" type="video/mp4" />
						</video>
						<div class="key-frame" @click="play" v-if="data.isShowKeyFrame">
							<i></i>
						</div>
						<div class="info" v-if="data.isShowKeyFrame">
							<em>{{ data.article.ViewCount }} 次播放</em><span>{{ data.videoDuration }}</span>
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

					<div v-html="data.article.Content"></div>
				</div>

				<p v-if="data.article.Copyright" class="cont-mark">{{ data.article.Copyright }}</p>
			</div>

			<!-- <div class="art-btn-wrap">
                <router-link :class="[article.Type === 3 ? 'btn-blue' : 'btn-green']" :to="{name: 'Articles', params: {id: 0}}">返回列表</router-link>
            </div>  -->

			<component-search-art :articleType="data.article.Type || 0"></component-search-art>

			<div class="home-set">
				<div class="cont-list">
					<b class="list-title" :class="{ 'list-title-blue': data.article.Type === 3 }">推荐阅读</b>
					<router-link v-for="m in data.articles" :key="m.Id" :to="{ name: 'Article', params: { id: m.Id } }">
						<dl>
							<dt v-if="!m.PicUrl"></dt>
							<dt v-else :style="'background:url(' + m.PicUrl + ') center no-repeat;'"></dt>
							<dd>
								<b>{{ m.Title }}</b>
								<i class="icon-clock">{{ formatTime(m.PublishDate) }}</i>
								<i v-if="m.Type === 3" class="type-video">视频</i>
								<i v-else class="type-art">文章</i>
								<!-- <i>{{m.Publisher}}</i> -->
								<!-- <i class="icon-eye">{{m.ViewCount}}人感兴趣</i> -->
								<!-- <i>{{m.LikeCount}}人觉得有用</i> -->
							</dd>
						</dl>
					</router-link>
				</div>
			</div>
		</div>
	</app-layout>
</template>
