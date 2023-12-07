import { reactive } from 'vue';
import { defineStore } from 'pinia';
import { IState } from '@/stores/interface/state';
import Base from '@/utils/app';

export const $store = defineStore('$store', () => {
	const state: IState = reactive({
		referrer: document.referrer,
		isShowExamCate: false,
		refData: null,
		keyword: null,
		examJumpValue: 0,
		examTabIndex: 0,
		disCateName: '',
		cache: {
			art: {
				timestamp: 0,
				data: null,
				tags: []
			},
			exam: {
				timestamp: 0,
				data: null,
				tags: [],
				list: []
			},
			dis: {
				timestamp: 0,
				data: null,
				tags: [],
				types: {
					part: [],
					cate: [],
					people: [],
					pinyin: [],
					tags: {
						list: [],
						pageIndex: 1,
						totalCount: 0
					}
				},
				intro: null
			}
		}
	});

	const setReferrer = (referrer: string) => {
		state.referrer = referrer;
	};
	const setExamCateStatu = (status: boolean) => {
		state.isShowExamCate = status;
	};
	const setRefData = (data: any) => {
		state.refData = data;
	};
	const setKeyword = (keyword: string) => {
		state.keyword = keyword;
	};
	const setExamJumpValue = (value: number) => {
		state.examJumpValue = value;
	};
	const setExamTabIndex = (index: number) => {
		state.examTabIndex = index;
	};
	const setDisCateName = (name: string) => {
		state.disCateName = name;
	};
    type cacheName = 'art' | 'exam' | 'dis';
	const setCache = (obj: { [x: string]: any; name?: any; }) => {
		Base.extend(state.cache[obj.name as cacheName], obj, true);
	};

    const actions = {
        setReferrer,
        setExamCateStatu,
        setRefData,
        setKeyword,
        setExamJumpValue,
        setExamTabIndex,
        setDisCateName,
        setCache
    };

	return {
		state,
        ...actions
	};
});
