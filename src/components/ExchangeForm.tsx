import { useState, useEffect } from 'react';
import { translations, type Language } from '../i18n';
import HistoryChart from './HistoryChart';

// Default currency list (structure only, names come from i18n)
const defaultCurrencies = [
    { code: 'TWD', flag: '🇹🇼' },
    { code: 'USD', flag: '🇺🇸' },
    { code: 'JPY', flag: '🇯🇵' },
    { code: 'EUR', flag: '🇪🇺' },
    { code: 'CNY', flag: '🇨🇳' },
    { code: 'HKD', flag: '🇭🇰' },
    { code: 'KRW', flag: '🇰🇷' },
    { code: 'GBP', flag: '🇬🇧' },
    { code: 'AUD', flag: '🇦🇺' },
    { code: 'CAD', flag: '🇨🇦' },
    { code: 'SGD', flag: '🇸🇬' },
    { code: 'CHF', flag: '🇨🇭' },
    { code: 'NZD', flag: '🇳🇿' },
    { code: 'THB', flag: '🇹🇭' },
    { code: 'PHP', flag: '🇵🇭' },
    { code: 'IDR', flag: '🇮🇩' },
    { code: 'VND', flag: '🇻🇳' },
    { code: 'MYR', flag: '🇲🇾' },
    { code: 'XAU', flag: '🥇' },
];

interface Alert {
    id: string;
    from: string;
    to: string;
    targetRate: number;
    condition: 'above' | 'below';
}

interface HistoryData {
    date: string;
    rate: number;
}

export default function ExchangeForm() {
    const [lang, setLang] = useState<Language>(() => {
        return (localStorage.getItem('language') as Language) || 'en';
    });
    const t = translations[lang];

    const [currencyList, setCurrencyList] = useState(() => {
        const saved = localStorage.getItem('currencyOrder');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse saved currencies', e);
            }
        }
        return defaultCurrencies;
    });

    const [alerts, setAlerts] = useState<Alert[]>(() => {
        const saved = localStorage.getItem('priceAlerts');
        return saved ? JSON.parse(saved) : [];
    });

    const [amount, setAmount] = useState<string>('1');
    const [amountInFromCurrency, setAmountInFromCurrency] = useState(true);
    const [fromCurrency, setFromCurrency] = useState('USD');
    const [toCurrency, setToCurrency] = useState('TWD');
    const [rates, setRates] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<string>('');
    const [showSettings, setShowSettings] = useState(false);
    const [showAlerts, setShowAlerts] = useState(false);

    // Alert Form State
    const [alertTarget, setAlertTarget] = useState('');
    const [alertCondition, setAlertCondition] = useState<'above' | 'below'>('above');

    // History State
    const [showHistory, setShowHistory] = useState(false);
    const [historyData, setHistoryData] = useState<HistoryData[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [timeRange, setTimeRange] = useState<'14D' | '3Y' | '5Y' | '10Y' | 'Max'>('14D');

    const toggleLanguage = () => {
        const newLang = lang === 'en' ? 'zh' : 'en';
        setLang(newLang);
        localStorage.setItem('language', newLang);
    };

    useEffect(() => {
        const fetchRates = async () => {
            const CACHE_KEY = 'exchange_rates_cache';
            const CACHE_DURATION = 3600 * 1000; // 1 hour

            try {
                setLoading(true);

                // Check Cache
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const { rates, timestamp, time_last_updated } = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        console.log('Using cached rates');
                        setRates(rates);
                        const date = new Date(time_last_updated * 1000);
                        const formatted = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                        setLastUpdated(formatted);
                        setLoading(false);
                        return;
                    }
                }

                // 1. Fetch Currency Rates
                const currencyRes = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                const currencyData = await currencyRes.json();
                let newRates = { ...currencyData.rates };

                // 2. Fetch Gold Price (USD per Ounce)
                try {
                    const goldRes = await fetch('https://data-asg.goldprice.org/dbXRates/USD');
                    const goldData = await goldRes.json();
                    if (goldData.items && goldData.items.length > 0) {
                        const xauPriceInUSD = goldData.items[0].xauPrice;
                        newRates['XAU'] = 1 / xauPriceInUSD;
                    }
                } catch (goldError) {
                    console.error('Error fetching gold price:', goldError);
                }

                // Save to Cache
                const cacheData = {
                    rates: newRates,
                    timestamp: Date.now(),
                    time_last_updated: currencyData.time_last_updated
                };
                localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));

                setRates(newRates);
                const date = new Date(currencyData.time_last_updated * 1000);
                const formatted = `${date.getFullYear()}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
                setLastUpdated(formatted);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching rates:', error);
                setLoading(false);
            }
        };

        fetchRates();
    }, []);

    // Calculate values
    let toAmount, fromAmount;
    if (Object.keys(rates).length > 0) {
        const rate = rates[toCurrency] / rates[fromCurrency];
        if (amountInFromCurrency) {
            fromAmount = amount;
            toAmount = (parseFloat(amount) * rate).toString();
            if (isNaN(parseFloat(toAmount))) toAmount = '';
            else toAmount = parseFloat(toAmount).toFixed(4); // Display precision
        } else {
            toAmount = amount;
            fromAmount = (parseFloat(amount) / rate).toString();
            if (isNaN(parseFloat(fromAmount))) fromAmount = '';
            else fromAmount = parseFloat(fromAmount).toFixed(4);
        }
    } else {
        fromAmount = amount;
        toAmount = '';
    }

    const handleFromAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
        setAmountInFromCurrency(true);
    };

    const handleToAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(e.target.value);
        setAmountInFromCurrency(false);
    };

    useEffect(() => {
        if (Object.keys(rates).length === 0) return;

        // Check Alerts
        alerts.forEach(alert => {
            const currentRate = rates[alert.to] / rates[alert.from];
            let triggered = false;
            if (alert.condition === 'above' && currentRate >= alert.targetRate) triggered = true;
            if (alert.condition === 'below' && currentRate <= alert.targetRate) triggered = true;

            if (triggered) {
                // Request permission if not granted
                if (Notification.permission === 'default') {
                    Notification.requestPermission();
                }

                if (Notification.permission === 'granted') {
                    const body = t.alerts.body(
                        alert.from,
                        currentRate.toFixed(4),
                        alert.to,
                        alert.condition,
                        alert.targetRate
                    );

                    new Notification(t.alerts.triggered, {
                        body: body,
                        icon: '/vite.svg'
                    });
                }
            }
        });

    }, [amount, fromCurrency, toCurrency, rates, alerts, t]);

    // Fetch History Effect
    useEffect(() => {
        if (!showHistory) return;

        const fetchHistory = async () => {
            setLoadingHistory(true);
            setHistoryData([]);

            const CACHE_DURATION = 10 * 24 * 60 * 60 * 1000; // 10 days

            if (timeRange === '14D') {
                // Daily data from fawazahmed0
                const dates = [];
                for (let i = 13; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    dates.push(d.toISOString().split('T')[0]);
                }

                const historyPromises = dates.map(async (date) => {
                    const cacheKey = `history_usd_${date}`; // Always fetch USD base
                    const cached = localStorage.getItem(cacheKey);

                    if (cached) {
                        const { data: usdRates, timestamp } = JSON.parse(cached);
                        // Check expiration
                        if (Date.now() - timestamp < CACHE_DURATION) {
                            const fromRate = usdRates[fromCurrency.toLowerCase()];
                            const toRate = usdRates[toCurrency.toLowerCase()];

                            if (fromRate && toRate) {
                                let rate;
                                if (fromCurrency === 'USD') rate = toRate;
                                else if (toCurrency === 'USD') rate = 1 / fromRate;
                                else rate = toRate / fromRate;
                                return { date, rate };
                            }
                        }
                    }

                    try {
                        const res = await fetch(`https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/usd.json`);
                        if (!res.ok) return null;
                        const data = await res.json();
                        const usdRates = data.usd;

                        localStorage.setItem(cacheKey, JSON.stringify({
                            data: usdRates,
                            timestamp: Date.now()
                        }));

                        const fromRate = usdRates[fromCurrency.toLowerCase()];
                        const toRate = usdRates[toCurrency.toLowerCase()];

                        if (!fromRate || !toRate) return null;

                        let rate;
                        if (fromCurrency === 'USD') rate = toRate;
                        else if (toCurrency === 'USD') rate = 1 / fromRate;
                        else rate = toRate / fromRate;

                        return { date, rate };
                    } catch (e) {
                        console.error(`Failed to fetch history for ${date}`, e);
                        return null;
                    }
                });

                const results = await Promise.all(historyPromises);

                const chartData = results
                    .filter((r): r is HistoryData => r !== null && typeof r.rate === 'number' && isFinite(r.rate))
                    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

                setHistoryData(chartData);
            } else {
                // Long term data from US Treasury
                let years = 10;
                if (timeRange === '3Y') years = 3;
                if (timeRange === '5Y') years = 5;
                if (timeRange === '10Y') years = 10;
                if (timeRange === 'Max') years = 25; // Go back to 2000 roughly

                const startDate = new Date();
                startDate.setFullYear(startDate.getFullYear() - years);
                // If Max, clamp to 2000-01-01
                if (timeRange === 'Max') {
                    startDate.setFullYear(2000, 0, 1);
                }
                const startDateStr = startDate.toISOString().split('T')[0];

                const treasuryMap: Record<string, string> = {
                    'TWD': 'Taiwan-Dollar',
                    'EUR': 'Euro Zone-Euro',
                    'JPY': 'Japan-Yen',
                    'CNY': 'China-Renminbi',
                    'HKD': 'Hong Kong-Dollar',
                    'KRW': 'Korea-Won',
                    'GBP': 'United Kingdom-Pound Sterling',
                    'AUD': 'Australia-Dollar',
                    'CAD': 'Canada-Dollar',
                    'SGD': 'Singapore-Dollar',
                    'CHF': 'Switzerland-Franc',
                    'NZD': 'New Zealand-Dollar',
                    'THB': 'Thailand-Baht',
                    'PHP': 'Philippines-Peso',
                    'IDR': 'Indonesia-Rupiah',
                    'VND': 'Vietnam-Dong',
                    'MYR': 'Malaysia-Ringgit',
                    'USD': 'USD' // Special case
                };

                const fromName = treasuryMap[fromCurrency];
                const toName = treasuryMap[toCurrency];

                if (!fromName || !toName) {
                    console.warn('Currency not supported by Treasury API');
                    setLoadingHistory(false);
                    return;
                }

                // Cache key for Treasury data needs to include currencies and range
                const cacheKey = `history_treasury_${fromCurrency}_${toCurrency}_${timeRange}`;
                const cached = localStorage.getItem(cacheKey);

                if (cached) {
                    const { data: chartData, timestamp } = JSON.parse(cached);
                    if (Date.now() - timestamp < CACHE_DURATION) {
                        setHistoryData(chartData);
                        setLoadingHistory(false);
                        return;
                    }
                }

                try {
                    // We need to fetch data for both currencies relative to USD
                    // Filter for both currencies
                    const filterNames = [fromName, toName].filter(n => n !== 'USD').join(',');
                    const url = `https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/rates_of_exchange?filter=country_currency_desc:in:(${filterNames}),record_date:gte:${startDateStr}&page[size]=3000`;

                    const res = await fetch(url);
                    const json = await res.json();
                    const data = json.data;

                    // Group by date
                    const ratesByDate: Record<string, { [key: string]: number }> = {};

                    data.forEach((item: any) => {
                        const date = item.record_date;
                        if (!ratesByDate[date]) ratesByDate[date] = {};
                        ratesByDate[date][item.country_currency_desc] = parseFloat(item.exchange_rate);
                    });

                    // Process into chart data
                    const chartData = Object.keys(ratesByDate).sort().map(date => {
                        const dayRates = ratesByDate[date];

                        let fromRate = 1;
                        if (fromCurrency !== 'USD') {
                            fromRate = dayRates[fromName];
                        }

                        let toRate = 1;
                        if (toCurrency !== 'USD') {
                            toRate = dayRates[toName];
                        }

                        if (!fromRate || !toRate) return null;

                        // Treasury rates are "Foreign per 1 USD"
                        // So 1 USD = fromRate FROM
                        // 1 USD = toRate TO
                        // 1 FROM = (toRate / fromRate) TO

                        return {
                            date,
                            rate: toRate / fromRate
                        };
                    }).filter((d): d is HistoryData => d !== null);

                    localStorage.setItem(cacheKey, JSON.stringify({
                        data: chartData,
                        timestamp: Date.now()
                    }));

                    setHistoryData(chartData);

                } catch (e) {
                    console.error('Failed to fetch treasury data', e);
                }
            }

            setLoadingHistory(false);
        };

        fetchHistory();
    }, [showHistory, fromCurrency, toCurrency, timeRange]);

    const handleSwap = () => {
        setFromCurrency(toCurrency);
        setToCurrency(fromCurrency);
        // Swap amounts logic if needed, but usually keeping values as is is fine, just swapping currencies
    };

    const moveCurrency = (index: number, direction: 'up' | 'down') => {
        const newList = [...currencyList];
        if (direction === 'up' && index > 0) {
            [newList[index], newList[index - 1]] = [newList[index - 1], newList[index]];
        } else if (direction === 'down' && index < newList.length - 1) {
            [newList[index], newList[index + 1]] = [newList[index + 1], newList[index]];
        }
        setCurrencyList(newList);
        localStorage.setItem('currencyOrder', JSON.stringify(newList));
    };

    const addAlert = () => {
        const target = parseFloat(alertTarget);
        if (isNaN(target) || target <= 0) return;

        const newAlert: Alert = {
            id: Date.now().toString(),
            from: fromCurrency,
            to: toCurrency,
            targetRate: target,
            condition: alertCondition
        };

        const newAlerts = [...alerts, newAlert];
        setAlerts(newAlerts);
        localStorage.setItem('priceAlerts', JSON.stringify(newAlerts));
        setAlertTarget('');

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    };

    const removeAlert = (id: string) => {
        const newAlerts = alerts.filter(a => a.id !== id);
        setAlerts(newAlerts);
        localStorage.setItem('priceAlerts', JSON.stringify(newAlerts));
    };

    return (
        <div className="w-full max-w-md relative">
            <div className="p-8 bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 relative z-10">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowAlerts(true)}
                            className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-yellow-400 transition-colors relative"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                            </svg>
                            {alerts.length > 0 && (
                                <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-800"></span>
                            )}
                        </button>
                    </div>

                    <h2 className="text-2xl font-bold text-white text-center tracking-wide">{t.title}</h2>

                    <div className="flex gap-2">
                        <button
                            onClick={toggleLanguage}
                            className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors text-sm font-bold border border-white/20 rounded-full"
                        >
                            {lang === 'en' ? '中' : 'En'}
                        </button>
                        <button
                            onClick={() => setShowSettings(true)}
                            className="w-8 h-8 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </button>
                    </div>
                </div>
                <p className="text-center text-purple-200 text-sm mb-6">
                    {loading ? t.loading : `${t.updated}${lastUpdated}`}
                </p>

                <div className="space-y-4">
                    {/* From Row */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-400 mb-1">{t.from}</label>
                            <input
                                type="number"
                                value={amountInFromCurrency ? amount : fromAmount}
                                onChange={handleFromAmountChange}
                                className="w-full bg-transparent text-white text-2xl font-bold focus:outline-none placeholder-white/20"
                                placeholder="0"
                            />
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="w-1/3">
                            <select
                                value={fromCurrency}
                                onChange={(e) => setFromCurrency(e.target.value)}
                                className="w-full bg-transparent text-white text-lg font-medium appearance-none focus:outline-none cursor-pointer text-right"
                            >
                                {currencyList.map((c: { code: string; flag: string }) => (
                                    <option key={c.code} value={c.code} className="text-black">
                                        {c.flag} {c.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Swap Button */}
                    <div className="flex justify-center -my-3 relative z-10">
                        <button
                            onClick={handleSwap}
                            className="p-2 bg-purple-600 hover:bg-purple-500 rounded-full text-white shadow-lg transform hover:scale-110 transition-all active:scale-95 border-4 border-[#1a1a2e]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                        </button>
                    </div>

                    {/* To Row */}
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors">
                        <div className="flex-1">
                            <label className="block text-xs font-medium text-gray-400 mb-1">{t.to}</label>
                            <input
                                type="number"
                                value={amountInFromCurrency ? toAmount : amount}
                                onChange={handleToAmountChange}
                                className="w-full bg-transparent text-white text-2xl font-bold focus:outline-none placeholder-white/20"
                                placeholder="0"
                            />
                        </div>
                        <div className="w-px h-10 bg-white/10"></div>
                        <div className="w-1/3">
                            <select
                                value={toCurrency}
                                onChange={(e) => setToCurrency(e.target.value)}
                                className="w-full bg-transparent text-white text-lg font-medium appearance-none focus:outline-none cursor-pointer text-right"
                            >
                                {currencyList.map((c: { code: string; flag: string }) => (
                                    <option key={c.code} value={c.code} className="text-black">
                                        {c.flag} {c.code}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Rate Info */}
                    <div className="text-center">
                        <p className="text-sm text-gray-400">
                            1 {fromCurrency} = {(rates[toCurrency] / rates[fromCurrency]).toFixed(4)} {toCurrency}
                        </p>
                    </div>

                    {/* History Toggle */}
                    <div className="flex flex-col gap-4 mt-4">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="w-full py-2 flex items-center justify-center gap-2 text-purple-300 hover:text-purple-200 transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 transition-transform ${showHistory ? 'rotate-180' : ''}`}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                            </svg>
                            {showHistory ? t.history.hide : t.history.show}
                        </button>

                        {showHistory && (
                            <div className="flex justify-center gap-2">
                                {(['14D', '3Y', '5Y', '10Y', 'Max'] as const).map((range) => (
                                    <button
                                        key={range}
                                        onClick={() => setTimeRange(range)}
                                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${timeRange === range
                                            ? 'bg-purple-500 text-white shadow-lg'
                                            : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                            }`}
                                    >
                                        {range}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Chart */}
                    {showHistory && (
                        <div className="min-h-[250px] relative">
                            {loadingHistory && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/5 rounded-2xl z-10">
                                    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                                </div>
                            )}
                            <HistoryChart
                                data={historyData}
                                currency={toCurrency}
                                color="#a855f7"
                            />
                        </div>
                    )}
                </div>
            </div>


            {/* Settings Modal */}
            {showSettings && (
                <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 flex flex-col animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">{t.settings.title}</h3>
                        <button
                            onClick={() => setShowSettings(false)}
                            className="p-2 text-gray-400 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {currencyList.map((currency: { code: string; flag: string }, index: number) => (
                            <div key={currency.code} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">{currency.flag}</span>
                                    <div>
                                        <div className="text-white font-medium">{currency.code}</div>
                                        <div className="text-xs text-gray-400">
                                            {t.currencies[currency.code as keyof typeof t.currencies]}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <button
                                        onClick={() => moveCurrency(index, 'up')}
                                        disabled={index === 0}
                                        className="p-1 text-gray-400 hover:text-purple-400 disabled:opacity-30 disabled:hover:text-gray-400"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M14.77 12.79a.75.75 0 01-1.06-.02L10 8.832 6.29 12.77a.75.75 0 11-1.08-1.04l4.25-4.5a.75.75 0 011.08 0l4.25 4.5a.75.75 0 01-.02 1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => moveCurrency(index, 'down')}
                                        disabled={index === currencyList.length - 1}
                                        className="p-1 text-gray-400 hover:text-purple-400 disabled:opacity-30 disabled:hover:text-gray-400"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                                            <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01-.02-1.06z" clipRule="evenodd" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Alerts Modal */}
            {showAlerts && (
                <div className="absolute inset-0 z-20 bg-slate-900/95 backdrop-blur-xl rounded-3xl p-6 flex flex-col animate-in fade-in zoom-in duration-200">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold text-white">{t.alerts.title}</h3>
                        <button
                            onClick={() => setShowAlerts(false)}
                            className="p-2 text-gray-400 hover:text-white"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Add Alert Form */}
                    <div className="bg-white/5 p-4 rounded-xl mb-4 border border-white/10">
                        <div className="flex items-center justify-between text-sm text-gray-300 mb-2">
                            <span>1 {fromCurrency}</span>
                            <span className="text-purple-400 font-bold">
                                {(rates[toCurrency] / rates[fromCurrency]).toFixed(4)} {toCurrency}
                            </span>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 mb-2">
                            <select
                                value={alertCondition}
                                onChange={(e) => setAlertCondition(e.target.value as 'above' | 'below')}
                                className="w-full sm:w-auto bg-black/20 text-white rounded-lg px-2 py-2 border border-white/10 focus:outline-none focus:border-purple-500"
                            >
                                <option value="above">{t.alerts.above}</option>
                                <option value="below">{t.alerts.below}</option>
                            </select>
                            <input
                                type="number"
                                value={alertTarget}
                                onChange={(e) => setAlertTarget(e.target.value)}
                                placeholder={t.alerts.targetRate}
                                className="w-full sm:flex-1 bg-black/20 text-white rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <button
                            onClick={addAlert}
                            disabled={!alertTarget}
                            className="w-full bg-purple-600 hover:bg-purple-500 text-white py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {t.alerts.setAlert}
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                        {alerts.length === 0 ? (
                            <div className="text-center text-gray-500 mt-8">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mx-auto mb-2 opacity-50">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                                </svg>
                                <p>{t.alerts.noAlerts}</p>
                            </div>
                        ) : (
                            alerts.map((alert) => (
                                <div key={alert.id} className="bg-white/5 p-3 rounded-xl border border-white/5 flex justify-between items-center">
                                    <div>
                                        <div className="text-white text-sm">
                                            1 {alert.from} <span className="text-gray-400">{t.to}</span> {alert.to}
                                        </div>
                                        <div className="text-purple-300 font-bold">
                                            {alert.condition === 'above' ? '≥' : '≤'} {alert.targetRate}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => removeAlert(alert.id)}
                                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                                        </svg>
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* Loading Mask */}
            {loading && (
                <div className="absolute inset-0 z-50 bg-slate-900/60 backdrop-blur-sm rounded-3xl flex flex-col items-center justify-center animate-in fade-in duration-200">
                    <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-white font-medium tracking-wide animate-pulse">{t.updating}</p>
                </div>
            )}
        </div>
    );
}
