export const zh = {
    title: "匯率換算",
    updated: "最後更新：",
    loading: "載入匯率中...",
    updating: "更新匯率中...",
    amount: "金額",
    from: "從",
    to: "換成",
    settings: {
        title: "調整貨幣順序",
    },
    history: {
        show: "查看走勢",
        hide: "隱藏走勢",
        loading: "載入走勢中...",
        title: "歷史走勢",
        notAvailable: "暫無歷史資料"
    },
    alerts: {
        title: "價格提醒",
        setAlert: "設定提醒",
        noAlerts: "目前沒有提醒",
        targetRate: "目標匯率",
        above: "高於 (≥)",
        below: "低於 (≤)",
        triggered: "匯率到價通知！🚨",
        body: (from: string, rate: string, to: string, condition: string, target: number) =>
            `1 ${from} 目前為 ${rate} ${to} (${condition === 'above' ? '高於' : '低於'} ${target})`
    },
    currencies: {
        TWD: "新台幣",
        USD: "美元",
        JPY: "日圓",
        EUR: "歐元",
        CNY: "人民幣",
        HKD: "港幣",
        KRW: "韓元",
        GBP: "英鎊",
        AUD: "澳幣",
        CAD: "加幣",
        SGD: "新加坡幣",
        CHF: "瑞士法郎",
        NZD: "紐西蘭幣",
        THB: "泰銖",
        PHP: "菲律賓披索",
        IDR: "印尼盾",
        VND: "越南盾",
        MYR: "馬來西亞林吉特",
        XAU: "黃金 (盎司)"
    }
};
