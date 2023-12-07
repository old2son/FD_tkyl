export interface IState {
    referrer: string;
    isShowExamCate: boolean;
    refData: any;
    keyword: null | string;
    examJumpValue: number;
    examTabIndex: number;
    disCateName: string;
    cache: ICache;
    uid?: string | number;
    channel?: string;
    sign?: string;
    _random_?: string;
    tkuid?: any;
}

export interface ICache { 
    art: {
        timestamp: number;
        data: any;
        [propsname: string]: any
    };
    exam: {
        timestamp: number;
        data: any;
        [propsname: string]: any
    };
    dis: {
        timestamp: number;
        data: any;
        [propsname: string]: any
    };
}