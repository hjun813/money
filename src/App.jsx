import React, { useEffect, useMemo, useState } from 'react';

const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
);

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'];
const numberFormatter = new Intl.NumberFormat('ko-KR');
const formatKRW = (value) => `${numberFormatter.format(value || 0)}원`;

export default function App() {
  const [salary, setSalary] = useState(() => {
    const saved = localStorage.getItem('salary');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  useEffect(() => {
    localStorage.setItem('salary', salary.toString());
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [salary, expenses]);

  const totalExpenses = useMemo(
    () => expenses.reduce((sum, item) => sum + item.amount, 0),
    [expenses],
  );
  const remainingBalance = salary - totalExpenses;
  const isOverspent = remainingBalance < 0;
  const spendingRate = salary > 0 ? Math.round((totalExpenses / salary) * 100) : 0;

  const handleSalaryChange = (event) => {
    setSalary(Number(event.target.value.replace(/[^0-9]/g, '')));
  };

  const handleExpenseAmountChange = (event) => {
    setNewExpenseAmount(event.target.value.replace(/[^0-9]/g, ''));
  };

  const handleAddExpense = (event) => {
    event.preventDefault();
    const amount = Number(newExpenseAmount);
    if (!newExpenseName.trim() || amount <= 0) return;

    setExpenses((currentExpenses) => [
      ...currentExpenses,
      {
        id: Date.now().toString(),
        name: newExpenseName.trim(),
        amount,
        color: COLORS[currentExpenses.length % COLORS.length],
      },
    ]);
    setNewExpenseName('');
    setNewExpenseAmount('');
  };

  const handleDeleteExpense = (id) => {
    setExpenses((currentExpenses) => currentExpenses.filter((expense) => expense.id !== id));
  };

  return (
    <div className="min-h-dvh bg-slate-50 font-sans text-slate-800">
      <main className="mx-auto w-full max-w-5xl px-4 pb-16 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6 sm:pb-20 lg:px-8">
        <header className="flex items-center gap-3 px-1 pb-6 pt-2 sm:pb-8 sm:pt-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <WalletIcon />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-xl font-extrabold tracking-tight text-slate-950 sm:text-2xl">내 월급 매니저</h1>
            <p className="mt-0.5 text-xs font-medium text-slate-500 sm:text-sm">이번 달 돈의 흐름을 한눈에 관리하세요</p>
          </div>
        </header>

        <div className="grid items-start gap-4 sm:gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.35fr)]">
          <div className="grid gap-4 sm:gap-6">
            <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
              <label htmlFor="salary" className="mb-2 block text-sm font-semibold text-slate-500">이번 달 내 월급 (수입)</label>
              <div className="relative">
                <input
                  id="salary"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  value={salary === 0 ? '' : numberFormatter.format(salary)}
                  onChange={handleSalaryChange}
                  placeholder="0"
                  className="w-full border-b-2 border-slate-200 bg-transparent py-2 pr-10 text-[clamp(1.75rem,8vw,2.25rem)] font-extrabold tracking-tight outline-none transition-colors placeholder:text-slate-300 focus:border-blue-500"
                />
                <span className="pointer-events-none absolute bottom-3 right-0 text-lg font-bold text-slate-400">원</span>
              </div>
            </section>

            <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6" aria-labelledby="balance-title">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
                <div className="min-w-0">
                  <p id="balance-title" className="mb-1 text-sm font-semibold text-slate-500">사용 가능한 잔액</p>
                  <h2 className={`break-words text-[clamp(1.55rem,7vw,2rem)] font-extrabold tracking-tight ${isOverspent ? 'text-red-500' : 'text-blue-600'}`}>
                    {isOverspent ? '-' : ''}{formatKRW(Math.abs(remainingBalance))}
                  </h2>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-xs text-slate-400">총 지출</p>
                  <p className="mt-0.5 text-sm font-bold text-slate-700">{formatKRW(totalExpenses)}</p>
                </div>
              </div>

              <div className="mb-2 flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500">지출 비율</span>
                <span className={isOverspent ? 'text-red-500' : 'text-slate-600'}>{spendingRate}%</span>
              </div>
              <div className="flex h-3 w-full overflow-hidden rounded-full bg-slate-100 shadow-inner" role="img" aria-label={`월급 중 ${spendingRate}% 지출 예정`}>
                {salary > 0 ? (
                  <>
                    {expenses.map((expense) => (
                      <div
                        key={expense.id}
                        style={{
                          width: `${Math.min((expense.amount / Math.max(salary, totalExpenses)) * 100, 100)}%`,
                          backgroundColor: expense.color,
                        }}
                        className="h-full transition-all duration-500 ease-out"
                        title={`${expense.name}: ${formatKRW(expense.amount)}`}
                      />
                    ))}
                    {!isOverspent && (
                      <div style={{ width: `${(remainingBalance / salary) * 100}%` }} className="h-full bg-slate-200 transition-all duration-500" />
                    )}
                  </>
                ) : <div className="h-full w-full bg-slate-200" />}
              </div>

              {isOverspent && (
                <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-center text-xs font-semibold leading-5 text-red-600" role="alert">
                  예산을 {formatKRW(Math.abs(remainingBalance))} 초과했어요. 지출 계획을 조정해 보세요.
                </p>
              )}
            </section>
          </div>

          <section className="rounded-3xl border border-slate-200/70 bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-slate-900 sm:text-xl">어디에 돈을 쓸까요?</h2>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-500">{expenses.length}개 항목</span>
            </div>

            <form onSubmit={handleAddExpense} className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
              <label className="sr-only" htmlFor="expense-name">지출 항목</label>
              <input
                id="expense-name"
                type="text"
                placeholder="예: 월세"
                value={newExpenseName}
                onChange={(event) => setNewExpenseName(event.target.value)}
                className="min-w-0 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
              />
              <label className="sr-only" htmlFor="expense-amount">지출 금액</label>
              <div className="relative min-w-0">
                <input
                  id="expense-amount"
                  type="text"
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="금액"
                  value={newExpenseAmount === '' ? '' : numberFormatter.format(Number(newExpenseAmount))}
                  onChange={handleExpenseAmountChange}
                  className="w-full min-w-0 rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-8 text-base outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 sm:text-sm"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm font-medium text-slate-400">원</span>
              </div>
              <button
                type="submit"
                disabled={!newExpenseName.trim() || !newExpenseAmount}
                className="col-span-2 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 font-bold text-white transition-colors hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:bg-slate-300 sm:col-span-1 sm:size-12 sm:px-0"
                aria-label="지출 추가"
              >
                <PlusIcon />
                <span className="sm:sr-only">지출 추가</span>
              </button>
            </form>

            <div className="space-y-2">
              {expenses.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-10 text-center">
                  <p className="text-sm font-semibold text-slate-500">아직 지출 계획이 없어요</p>
                  <p className="mt-1 text-xs text-slate-400">위에서 첫 항목을 추가해 보세요.</p>
                </div>
              ) : expenses.map((expense) => (
                <div key={expense.id} className="flex min-h-14 items-center gap-3 rounded-2xl border border-transparent px-2 py-2 transition-colors hover:border-slate-100 hover:bg-slate-50 sm:px-3">
                  <div className="size-3 shrink-0 rounded-full" style={{ backgroundColor: expense.color }} />
                  <span className="min-w-0 flex-1 truncate font-semibold text-slate-700" title={expense.name}>{expense.name}</span>
                  <span className="shrink-0 text-sm font-extrabold tabular-nums text-slate-900 sm:text-base">{formatKRW(expense.amount)}</span>
                  <button
                    type="button"
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="grid size-11 shrink-0 place-items-center rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-red-500"
                    aria-label={`${expense.name} 삭제`}
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
