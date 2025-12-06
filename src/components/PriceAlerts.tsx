import { useState, useEffect } from 'react';
import type { Translation } from '../i18n';

interface Alert {
    id: string;
    from: string;
    to: string;
    targetRate: number;
    condition: 'above' | 'below';
}


interface Currency {
    code: string;
    flag: string;
    name?: string;
}

interface PriceAlertsProps {
    isOpen: boolean;
    onClose: () => void;
    alerts: Alert[];
    setAlerts: (alerts: Alert[]) => void;
    fromCurrency: string; // This will now be the local currency
    toCurrency: string;
    onCurrencyChange: (from: string, to: string) => void;
    currentRate: number;
    onRemoveAlert: (id: string) => void;
    currencyList: Currency[];
    localCurrency: string;
    t: Translation;
}

export default function PriceAlerts({
    isOpen,
    onClose,
    alerts,
    setAlerts,
    fromCurrency,
    toCurrency,
    onCurrencyChange,
    currentRate,
    onRemoveAlert,
    currencyList,
    localCurrency,
    t
}: PriceAlertsProps) {
    const [view, setView] = useState<'list' | 'add'>('list');
    const [targetRate, setTargetRate] = useState<string>('');
    const [condition, setCondition] = useState<'above' | 'below'>('above');

    // Reset state when opening
    // Reset state when opening
    useEffect(() => {
        if (isOpen) {
            // Only reset view if we are just opening the modal
            // We can check if we need to reset by using a ref or just by checking if the currencies match
            // But a simpler way is to split this effect.
            // However, since we want to reset view ONLY when opening, we should be careful.

            // Actually, the issue is that this effect runs when dependencies change.
            // We only want to run this logic when `isOpen` becomes true.
            // But React effects run on mount and update.

            // Let's just set the view based on alerts length ONLY if we are opening.
            // But how do we know we are "just opening"?
            // We can use a previous value of isOpen? Or just trust that if isOpen is true, we might want to reset?
            // No, if isOpen is true and we change currency, we don't want to reset.

            // The fix: Split the logic.
            // 1. Force local currency when opening (or if it's wrong)
            if (fromCurrency !== localCurrency) {
                onCurrencyChange(localCurrency, toCurrency);
            }
        }
    }, [isOpen]); // Only run when isOpen changes (and on mount)

    // Separate effect for initial view state when opening
    useEffect(() => {
        if (isOpen) {
            // If we just opened, reset view. 
            // But this will still run if isOpen stays true? No, only if isOpen changes.
            // Wait, if isOpen is true, and I change currency, isOpen is still true. 
            // Does the effect run? Only if dependencies change.
            // If I remove other dependencies, it only runs when isOpen changes.
            setView(alerts.length > 0 ? 'list' : 'add');
            setTargetRate(currentRate.toFixed(4));
        }
    }, [isOpen]); // Only run when isOpen changes

    // We need to be careful about stale closures if we remove dependencies?
    // No, setView and setTargetRate are stable or state setters.
    // currentRate might be stale? 
    // If we only run on open, currentRate is the rate at that moment. That's fine.

    // But wait, if I change currency, currentRate changes. 
    // I want targetRate to update if I haven't typed anything?
    // There is another effect for that below:
    // useEffect(() => { if (view === 'add' && !targetRate) ... }, [currentRate...])

    // So splitting is the right way.
    // One effect to handle "On Open" logic (reset view).
    // One effect to handle "Ensure Local Currency" (which might need to run more often or just on open).

    // Let's refine the first effect to be purely "On Open".

    // Update target rate when current rate changes
    useEffect(() => {
        if (view === 'add' && !targetRate) {
            // setTargetRate(currentRate.toFixed(4));
        }
    }, [currentRate, view, targetRate]);

    // Clear target rate when currency changes
    useEffect(() => {
        if (view === 'add') {
            setTargetRate('');
        }
    }, [toCurrency]);

    // Auto-set condition when target rate changes
    useEffect(() => {
        const rate = parseFloat(targetRate);
        if (!isNaN(rate) && rate > 0) {
            setCondition(rate >= currentRate ? 'above' : 'below');
        }
    }, [targetRate, currentRate]);



    const handleAddAlert = () => {
        const rate = parseFloat(targetRate);
        if (isNaN(rate) || rate <= 0) return;

        const newAlert: Alert = {
            id: Date.now().toString(),
            from: localCurrency, // Always use local currency
            to: toCurrency,
            targetRate: rate,
            condition: condition
        };

        setAlerts([...alerts, newAlert]);
        setView('list');

        if (Notification.permission === 'default') {
            Notification.requestPermission();
        }
    };



    if (!isOpen) return null;

    return (
        <div className="absolute inset-0 z-30 bg-slate-900/95 backdrop-blur-xl rounded-3xl flex flex-col animate-in fade-in zoom-in duration-200 overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center p-6 pb-2">
                <h3 className="text-xl font-bold text-white">
                    {view === 'list' ? t.alerts.title : t.alerts.newAlert}
                </h3>
                <button
                    onClick={onClose}
                    className="p-2 text-gray-400 hover:text-white transition-colors bg-white/5 rounded-full hover:bg-white/10"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pt-2">

                {view === 'list' ? (
                    <div className="space-y-4">
                        {/* Add Button */}
                        <button
                            onClick={() => {
                                setView('add');
                                setTargetRate(currentRate.toFixed(4));
                                // Ensure we are using local currency
                                if (fromCurrency !== localCurrency) {
                                    onCurrencyChange(localCurrency, toCurrency);
                                }
                            }}
                            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white p-4 rounded-2xl font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            {t.alerts.addAlert} ({localCurrency})
                        </button>

                        {/* List */}
                        <div className="space-y-3 mt-6">
                            {alerts.length === 0 ? (
                                <div className="text-center text-gray-500 py-10">
                                    <p>{t.alerts.noAlerts}</p>
                                </div>
                            ) : (
                                alerts.map((alert) => (
                                    <div key={alert.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl">{currencyList.find(c => c.code === alert.to)?.flag}</span>
                                                <span className="text-white font-bold text-lg">{alert.to}</span>
                                            </div>
                                            <div className="text-purple-300 font-medium mt-1 flex items-center gap-1">
                                                <span>{alert.condition === 'above' ? '≥' : '≤'}</span>
                                                <span className="text-xl">{alert.targetRate}</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => onRemoveAlert(alert.id)}
                                            className="p-2 text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
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
                ) : (
                    <div className="space-y-6">
                        {/* Currency Selection - Simplified */}
                        <div className="flex gap-4 items-center">
                            {/* Locked From Currency */}
                            <div className="flex-1 opacity-60">
                                <label className="block text-xs text-gray-400 mb-1">{t.alerts.base}</label>
                                <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white font-bold flex items-center justify-between">
                                    <span>{localCurrency}</span>
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-gray-500">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                                    </svg>
                                </div>
                            </div>

                            {/* Arrow */}
                            <div className="text-gray-500 pt-5">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </div>

                            {/* To Currency Selector */}
                            <div className="flex-1">
                                <label className="block text-xs text-gray-400 mb-1">{t.alerts.target}</label>
                                <div className="relative">
                                    <select
                                        value={toCurrency}
                                        onChange={(e) => onCurrencyChange(localCurrency, e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-3 text-white appearance-none focus:outline-none focus:border-purple-500 font-bold"
                                    >
                                        {currencyList.map(c => (
                                            <option key={c.code} value={c.code} className="bg-slate-800 text-white">
                                                {c.flag} {c.code}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Current Rate Display */}
                        <div className="text-center">
                            <div className="text-gray-400 text-sm mb-1">{t.alerts.currentRate}</div>
                            <div className="text-4xl font-bold text-white tracking-tight">
                                {currentRate.toFixed(4)}
                                <span className="text-lg text-gray-500 ml-2 font-normal">{fromCurrency}</span>
                            </div>
                        </div>



                        {/* Condition Selector */}
                        <div className="relative mb-4">
                            <select
                                value={condition}
                                onChange={(e) => setCondition(e.target.value as 'above' | 'below')}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white appearance-none focus:outline-none focus:border-purple-500 font-bold"
                            >
                                <option value="above" className="bg-slate-800">{t.alerts.above}</option>
                                <option value="below" className="bg-slate-800">{t.alerts.below}</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-sm text-gray-400 font-medium">{t.alerts.targetRate}</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    value={targetRate}
                                    onChange={(e) => setTargetRate(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-2xl font-bold text-white focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                                    placeholder="0.0000"
                                />
                                <div className="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 font-medium">
                                    {fromCurrency}
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setView('list')}
                                className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-xl font-bold transition-colors"
                            >
                                {t.alerts.cancel}
                            </button>
                            <button
                                onClick={handleAddAlert}
                                disabled={!targetRate || parseFloat(targetRate) <= 0}
                                className="flex-[2] bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {t.alerts.setAlert}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
