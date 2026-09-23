import React, { useEffect, useMemo, useState } from 'react';

const CATEGORIES = [
  { id: 'housing', label: '주거', icon: '⌂', color: '#8b5cf6' },
  { id: 'food', label: '식비', icon: '●', color: '#f97316' },
  { id: 'transport', label: '교통', icon: '↗', color: '#06b6d4' },
  { id: 'shopping', label: '쇼핑', icon: '◇', color: '#ec4899' },
  { id: 'life', label: '생활', icon: '✦', color: '#22c55e' },
  { id: 'etc', label: '기타', icon: '＋', color: '#64748b' },
];

const numberFormatter = new Intl.NumberFormat('ko-KR');
const formatNumber = (value) => numberFormatter.format(Math.max(0, Number(value) || 0));
const formatKRW = (value) => `${numberFormatter.format(Math.abs(Number(value) || 0))}원`;

const readStorage = (key, fallback) => {
  try {
    const value = localStorage.getItem(key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
};

const Icon = ({ name, size = 20 }) => {
  const paths = {
    wallet: <><path d="M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6"/><path d="M16 13h4"/></>,
    plus: <><path d="M12 5v14"/><path d="M5 12h14"/></>,
    trash: <><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 15H6L5 6"/></>,
    spark: <><path d="m12 3-1.7 4.3L6 9l4.3 1.7L12 15l1.7-4.3L18 9l-4.3-1.7L12 3Z"/><path d="m5 16-.8 2.2L2 19l2.2.8L5 22l.8-2.2L8 19l-2.2-.8L5 16Z"/></>,
    target: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M12 3v2M21 12h-2M12 21v-2M3 12h2"/></>,
    repeat: <><path d="m17 2 4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></>,
    chevron: <path d="m9 18 6-6-6-6"/>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
};

export default function App() {
  const [salary, setSalary] = useState(() => Number(localStorage.getItem('salary')) || 0);
  const [expenses, setExpenses] = useState(() => readStorage('expenses', []));
  const [savingsGoal, setSavingsGoal] = useState(() => Number(localStorage.getItem('savingsGoal')) || 1000000);
  const [expenseName, setExpenseName] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [category, setCategory] = useState('food');
  const [recurring, setRecurring] = useState(false);
  const [purchaseName, setPurchaseName] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  useEffect(() => {
    localStorage.setItem('salary', String(salary));
    localStorage.setItem('expenses', JSON.stringify(expenses));
    localStorage.setItem('savingsGoal', String(savingsGoal));
  }, [salary, expenses, savingsGoal]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0), [expenses]);
  const remaining = salary - totalExpenses;
  const spendingRate = salary > 0 ? Math.round((totalExpenses / salary) * 100) : 0;
  const savingsRate = savingsGoal > 0 ? Math.min(Math.round((Math.max(remaining, 0) / savingsGoal) * 100), 100) : 0;
  const today = new Date();
  const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1;
  const dailyBudget = Math.max(Math.floor(remaining / daysLeft), 0);
  const monthLabel = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(today);
  const simulatedRemaining = remaining - Number(purchaseAmount || 0);
  const canAfford = simulatedRemaining >= 0;

  const categoryTotals = useMemo(() => CATEGORIES.map((item) => ({
    ...item,
    amount: expenses.filter((expense) => (expense.category || 'etc') === item.id).reduce((sum, expense) => sum + expense.amount, 0),
  })).filter((item) => item.amount > 0), [expenses]);

  const visibleExpenses = activeCategory === 'all'
    ? expenses
    : expenses.filter((expense) => (expense.category || 'etc') === activeCategory);

  const addExpense = (event) => {
    event.preventDefault();
    const amount = Number(expenseAmount);
    if (!expenseName.trim() || amount <= 0) return;
    setExpenses((items) => [...items, {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      name: expenseName.trim(), amount, category, recurring,
    }]);
    setExpenseName('');
    setExpenseAmount('');
    setRecurring(false);
  };

  const addSimulatedPurchase = () => {
    const amount = Number(purchaseAmount);
    if (!purchaseName.trim() || amount <= 0) return;
    setExpenses((items) => [...items, {
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
      name: purchaseName.trim(), amount, category: 'shopping', recurring: false,
    }]);
    setPurchaseName('');
    setPurchaseAmount('');
  };

  const handleNumericInput = (setter) => (event) => setter(event.target.value.replace(/[^0-9]/g, ''));

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[#f5f7fb] text-slate-900">
      <div className="pointer-events-none absolute -left-40 -top-40 size-96 rounded-full bg-violet-300/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 top-72 size-96 rounded-full bg-cyan-300/20 blur-3xl" />

      <main className="relative mx-auto w-full max-w-6xl px-4 pb-20 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 py-4 sm:py-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-white shadow-lg shadow-slate-950/20">
              <Icon name="wallet" size={23} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate text-xl font-black tracking-tight sm:text-2xl">월급 플로우</h1>
              <p className="text-xs font-semibold text-slate-400 sm:text-sm">{monthLabel} 자금 대시보드</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-xs font-bold text-slate-500 shadow-sm backdrop-blur sm:flex">
            <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,.14)]" />
            자동 저장 중
          </div>
        </header>

        <section className="relative isolate mb-5 overflow-hidden rounded-[2rem] bg-slate-950 p-5 text-white shadow-2xl shadow-slate-900/15 sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-violet-500/50 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-24 left-1/3 size-64 rounded-full bg-cyan-400/25 blur-3xl" />
          <div className="relative grid items-center gap-7 md:grid-cols-[1fr_auto]">
            <div>
              <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                <Icon name="spark" size={15} /> 이번 달 남은 돈
              </div>
              <div className={`break-words text-[clamp(2.1rem,9vw,4.25rem)] font-black leading-none tracking-[-0.05em] ${remaining < 0 ? 'text-rose-400' : 'text-white'}`}>
                {remaining < 0 && '-'}{formatKRW(remaining)}
              </div>
              <p className="mt-3 text-sm font-medium text-slate-400">
                {remaining < 0 ? `계획 지출이 월급보다 ${formatKRW(remaining)} 많아요` : `오늘부터 하루 ${formatKRW(dailyBudget)}까지 사용할 수 있어요`}
              </p>

              <div className="mt-7 max-w-xl">
                <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>월급 사용량</span><span className={spendingRate > 100 ? 'text-rose-400' : 'text-white'}>{spendingRate}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                  <div className={`h-full rounded-full transition-[width] duration-500 ${spendingRate > 100 ? 'bg-gradient-to-r from-rose-400 to-orange-400' : 'bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500'}`} style={{ width: `${Math.min(spendingRate, 100)}%` }} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 md:w-[330px]">
              <label className="rounded-2xl border border-cyan-400/20 bg-white/[0.07] p-3 backdrop-blur-sm sm:p-4">
                <span className="mb-2 block text-[10px] font-bold text-slate-400 sm:text-xs">월급 · 수정</span>
                <span className="flex min-w-0 items-center gap-0.5 text-cyan-300">
                  <input inputMode="numeric" value={salary ? formatNumber(salary) : ''} onChange={(event) => setSalary(Number(event.target.value.replace(/[^0-9]/g, '')))} placeholder="0" className="min-w-0 flex-1 bg-transparent text-xs font-black tabular-nums outline-none placeholder:text-cyan-300/40 sm:text-sm" />
                  <span className="text-[10px] font-black">원</span>
                </span>
              </label>
              {[
                ['계획 지출', formatKRW(totalExpenses), 'text-violet-300'],
                ['남은 일수', `${daysLeft}일`, 'text-emerald-300'],
              ].map(([label, value, color]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.07] p-3 backdrop-blur-sm sm:p-4">
                  <p className="mb-2 text-[10px] font-bold text-slate-400 sm:text-xs">{label}</p>
                  <p className={`break-words text-xs font-black tabular-nums sm:text-sm ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,.8fr)]">
          <div className="grid gap-5">
            <section className="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-xl shadow-slate-200/45 backdrop-blur sm:p-6">
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-600">Plan it</p>
                  <h2 className="mt-1 text-xl font-black tracking-tight">지출 계획 추가</h2>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-600">{expenses.length}개 항목</span>
              </div>

              <form onSubmit={addExpense} className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1.5 text-xs font-bold text-slate-500">
                  항목
                  <input value={expenseName} onChange={(event) => setExpenseName(event.target.value)} placeholder="예: 월세" className="h-12 min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
                </label>
                <label className="grid gap-1.5 text-xs font-bold text-slate-500">
                  금액
                  <div className="relative">
                    <input inputMode="numeric" value={expenseAmount ? formatNumber(expenseAmount) : ''} onChange={handleNumericInput(setExpenseAmount)} placeholder="0" className="h-12 w-full min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-9 text-base font-semibold outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10" />
                    <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-sm font-bold text-slate-400">원</span>
                  </div>
                </label>
                <label className="grid gap-1.5 text-xs font-bold text-slate-500">
                  카테고리
                  <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-base font-semibold outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10">
                    {CATEGORIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
                  </select>
                </label>
                <div className="grid grid-cols-[1fr_auto] items-end gap-3">
                  <button type="button" onClick={() => setRecurring((value) => !value)} aria-pressed={recurring} className={`flex h-12 items-center justify-center gap-2 rounded-2xl border text-sm font-bold transition ${recurring ? 'border-violet-300 bg-violet-50 text-violet-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
                    <Icon name="repeat" size={17} /> 고정비
                  </button>
                  <button type="submit" disabled={!expenseName.trim() || !expenseAmount} className="grid size-12 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/25 transition hover:-translate-y-0.5 hover:bg-blue-700 disabled:translate-y-0 disabled:bg-slate-300 disabled:shadow-none" aria-label="지출 계획 추가">
                    <Icon name="plus" />
                  </button>
                </div>
              </form>
            </section>

            <section className="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-xl shadow-slate-200/45 backdrop-blur sm:p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black tracking-tight">지출 보드</h2>
                <span className="text-sm font-black text-slate-400">{formatKRW(totalExpenses)}</span>
              </div>

              <div className="no-scrollbar -mx-1 mb-4 flex gap-2 overflow-x-auto px-1 pb-1">
                <button onClick={() => setActiveCategory('all')} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-black transition ${activeCategory === 'all' ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-500'}`}>전체</button>
                {categoryTotals.map((item) => (
                  <button key={item.id} onClick={() => setActiveCategory(item.id)} className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-black transition ${activeCategory === item.id ? 'text-white' : 'bg-slate-100 text-slate-500'}`} style={activeCategory === item.id ? { backgroundColor: item.color } : undefined}>{item.label}</button>
                ))}
              </div>

              {visibleExpenses.length === 0 ? (
                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/70 py-12 text-center">
                  <div className="mx-auto mb-3 grid size-11 place-items-center rounded-2xl bg-white text-slate-300 shadow-sm"><Icon name="plus" /></div>
                  <p className="text-sm font-bold text-slate-500">표시할 지출 계획이 없어요</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {visibleExpenses.map((expense) => {
                    const meta = CATEGORIES.find((item) => item.id === (expense.category || 'etc')) || CATEGORIES.at(-1);
                    return (
                      <div key={expense.id} className="group flex min-h-16 items-center gap-3 rounded-2xl border border-transparent px-2 py-2 transition hover:border-slate-100 hover:bg-slate-50 sm:px-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-2xl text-lg font-black" style={{ color: meta.color, backgroundColor: `${meta.color}15` }}>{meta.icon}</div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-black text-slate-800 sm:text-base">{expense.name}</p>
                            {expense.recurring && <span className="shrink-0 rounded-md bg-violet-50 px-1.5 py-0.5 text-[9px] font-black text-violet-600">고정</span>}
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-slate-400">{meta.label}</p>
                        </div>
                        <p className="shrink-0 text-sm font-black tabular-nums sm:text-base">{formatKRW(expense.amount)}</p>
                        <button onClick={() => setExpenses((items) => items.filter((item) => item.id !== expense.id))} className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-300 transition hover:bg-rose-50 hover:text-rose-500" aria-label={`${expense.name} 삭제`}><Icon name="trash" size={17} /></button>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <aside className="grid gap-5 lg:sticky lg:top-5">
            <section className="overflow-hidden rounded-[1.75rem] border border-white bg-gradient-to-br from-violet-50 via-white to-cyan-50 p-5 shadow-xl shadow-slate-200/45 sm:p-6">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-violet-600">Goal</p>
                  <h2 className="mt-1 text-lg font-black">이번 달 저축 목표</h2>
                </div>
                <div className="grid size-11 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20"><Icon name="target" /></div>
              </div>
              <label className="relative block">
                <span className="sr-only">저축 목표 금액</span>
                <input inputMode="numeric" value={savingsGoal ? formatNumber(savingsGoal) : ''} onChange={(event) => setSavingsGoal(Number(event.target.value.replace(/[^0-9]/g, '')))} className="h-12 w-full rounded-2xl border border-violet-100 bg-white/80 px-4 pr-9 text-lg font-black outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10" />
                <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-sm font-bold text-slate-400">원</span>
              </label>
              <div className="mt-5 flex items-center gap-4">
                <div className="relative grid size-20 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(#7c3aed ${savingsRate * 3.6}deg, #ede9fe 0deg)` }}>
                  <div className="grid size-[62px] place-items-center rounded-full bg-white text-sm font-black text-violet-700">{savingsRate}%</div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-400">현재 잔액 기준</p>
                  <p className="mt-1 break-words text-lg font-black text-slate-800">{formatKRW(Math.max(remaining, 0))}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">목표까지 {formatKRW(Math.max(savingsGoal - Math.max(remaining, 0), 0))}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[1.75rem] border border-white bg-white/90 p-5 shadow-xl shadow-slate-200/45 backdrop-blur sm:p-6">
              <div className="mb-5">
                <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-600">What if?</p>
                <h2 className="mt-1 text-lg font-black">이거 사도 될까?</h2>
                <p className="mt-1 text-xs font-semibold text-slate-400">사기 전에 이번 달 잔액을 미리 확인하세요.</p>
              </div>
              <div className="grid gap-2">
                <input value={purchaseName} onChange={(event) => setPurchaseName(event.target.value)} placeholder="사고 싶은 것" className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10" />
                <div className="relative">
                  <input inputMode="numeric" value={purchaseAmount ? formatNumber(purchaseAmount) : ''} onChange={handleNumericInput(setPurchaseAmount)} placeholder="가격" className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-9 text-sm font-bold outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-500/10" />
                  <span className="pointer-events-none absolute inset-y-0 right-4 grid place-items-center text-xs font-bold text-slate-400">원</span>
                </div>
              </div>

              {purchaseAmount && (
                <div className={`mt-4 rounded-2xl p-4 ${canAfford ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs font-black">구매 후 잔액</p>
                    <p className="text-base font-black">{simulatedRemaining < 0 && '-'}{formatKRW(simulatedRemaining)}</p>
                  </div>
                  <p className="mt-1 text-xs font-semibold opacity-70">{canAfford ? `남은 기간 하루 ${formatKRW(simulatedRemaining / daysLeft)} 사용 가능` : '현재 계획으로는 예산을 초과해요'}</p>
                </div>
              )}

              <button onClick={addSimulatedPurchase} disabled={!purchaseName.trim() || !purchaseAmount} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 text-sm font-black text-white transition hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400">
                계획에 반영 <Icon name="chevron" size={16} />
              </button>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
