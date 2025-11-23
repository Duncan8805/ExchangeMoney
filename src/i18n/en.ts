export const en = {
    title: "Currency Exchange",
    updated: "Updated: ",
    loading: "Loading rates...",
    updating: "Updating Rates...",
    amount: "Amount",
    from: "From",
    to: "To",
    settings: {
        title: "Reorder Currencies",
    },
    history: {
        show: "Show History",
        hide: "Hide History",
        loading: "Loading history...",
        title: "History",
        notAvailable: "History not available"
    },
    alerts: {
        title: "Price Alerts",
        setAlert: "Set Alert",
        noAlerts: "No active alerts",
        targetRate: "Target Rate",
        above: "Above (≥)",
        below: "Below (≤)",
        triggered: "Price Alert Triggered! 🚨",
        body: (from: string, rate: string, to: string, condition: string, target: number) =>
            `1 ${from} is now ${rate} ${to} (${condition} ${target})`
    },
    currencies: {
        TWD: "New Taiwan Dollar",
        USD: "US Dollar",
        JPY: "Japanese Yen",
        EUR: "Euro",
        CNY: "Chinese Yuan",
        HKD: "Hong Kong Dollar",
        KRW: "South Korean Won",
        GBP: "British Pound",
        AUD: "Australian Dollar",
        CAD: "Canadian Dollar",
        SGD: "Singapore Dollar",
        CHF: "Swiss Franc",
        NZD: "New Zealand Dollar",
        THB: "Thai Baht",
        PHP: "Philippine Peso",
        IDR: "Indonesian Rupiah",
        VND: "Vietnamese Dong",
        MYR: "Malaysian Ringgit",
        XAU: "Gold (troy ounce)"
    }
};
