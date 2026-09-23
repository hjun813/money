import React, { useState, useEffect, useMemo } from 'react';

// --- Icon Components (SVG) ---
const WalletIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
    <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
    <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
);

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12h14" /><path d="M12 5v14" />
  </svg>
);

// 미리 정의된 예쁜 차트 색상 팔레트
const COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', 
  '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef', '#f43f5e'
];

// 숫자를 원화(₩) 포맷으로 변환하는 함수
const formatKRW = (value) => {
  return new Intl.NumberFormat('ko-KR').format(value || 0) + '원';
};

export default function App() {
  // 상태 관리 (localStorage를 활용해 데이터 유지)
  const [salary, setSalary] = useState(() => {
    const saved = localStorage.getItem('salary');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [expenses, setExpenses] = useState(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });

  // 입력 폼 상태
  const [newExpenseName, setNewExpenseName] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');

  // 데이터 변경 시 로컬 스토리지에 자동 저장
  useEffect(() => {
    localStorage.setItem('salary', salary.toString());
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [salary, expenses]);

  // 지출 총액 및 잔액 계산
  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, item) => sum + item.amount, 0);
  }, [expenses]);

  const remainingBalance = salary - totalExpenses;
  const isOverspent = remainingBalance < 0;

  // 핸들러 함수들
  const handleSalaryChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, ''); // 숫자만 추출
    setSalary(Number(rawValue));
  };

  const handleExpenseAmountChange = (e) => {
    const rawValue = e.target.value.replace(/[^0-9]/g, '');
    setNewExpenseAmount(rawValue);
  };

  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!newExpenseName.trim() || !newExpenseAmount) return;

    const amount = Number(newExpenseAmount);
    if (amount <= 0) return;

    const newExpense = {
      id: Date.now().toString(),
      name: newExpenseName,
      amount: amount,
      color: COLORS[expenses.length % COLORS.length] // 순차적으로 색상 할당
    };

    setExpenses([...expenses, newExpense]);
    setNewExpenseName('');
    setNewExpenseAmount('');
  };

  const handleDeleteExpense = (id) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-4 flex justify-center">
      <div className="w-full max-w-md space-y-6 pb-20">
        
        {/* 헤더 */}
        <header className="pt-6 pb-2 px-2 flex items-center space-x-2">
          <div className="bg-blue-600 p-2 rounded-xl text-white">
            <WalletIcon />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">내 월급 매니저</h1>
        </header>

        {/* 1. 월급 입력 섹션 */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-sm font-semibold text-slate-500 mb-2">이번 달 내 월급 (수입)</h2>
          <div className="relative">
            <input
              type="text"
              value={salary === 0 ? '' : salary.toLocaleString('ko-KR')}
              onChange={handleSalaryChange}
              placeholder="0"
              className="w-full text-3xl font-bold bg-transparent outline-none border-b-2 border-slate-200 focus:border-blue-500 transition-colors py-2 pr-8"
            />
            <span className="absolute right-0 bottom-3 text-xl font-bold text-slate-400">원</span>
          </div>
        </section>

        {}
        {/* 2. 시각적 요약 (차트 & 잔액) */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex justify-between items-end mb-4">
            <div>
              <p className="text-sm font-semibold text-slate-500 mb-1">사용 가능한 잔액</p>
              <h3 className={`text-2xl font-bold ${isOverspent ? 'text-red-500' : 'text-blue-600'}`}>
                {isOverspent ? '-' : ''}{formatKRW(Math.abs(remainingBalance))}
              </h3>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">총 지출</p>
              <p className="text-sm font-semibold text-slate-700">{formatKRW(totalExpenses)}</p>
            </div>
          </div>

          {/* 스택 바 차트 */}
          <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
            {salary > 0 ? (
              <>
                {expenses.map((expense) => {
                  const widthPercentage = Math.min((expense.amount / Math.max(salary, totalExpenses)) * 100, 100);
                  return (
                    <div
                      key={expense.id}
                      style={{ 
                        width: `${widthPercentage}%`, 
                        backgroundColor: expense.color 
                      }}
                      className="h-full transition-all duration-500 ease-out"
                      title={`${expense.name}: ${formatKRW(expense.amount)}`}
                    />
                  );
                })}
                {!isOverspent && (
                  <div
                    style={{ width: `${(remainingBalance / salary) * 100}%` }}
                    className="h-full bg-slate-200 transition-all duration-500"
                  />
                )}
              </>
            ) : (
              <div className="w-full h-full bg-slate-200" />
            )}
          </div>
          
          {/* 초과 지출 경고 */}
          {isOverspent && (
            <p className="text-xs text-red-500 mt-3 font-medium text-center">
              앗! 예산(월급)을 초과해서 지출하도록 계획되어 있어요.
            </p>
          )}
        </section>

        {}
        {/* 3. 지출 계획 입력 및 리스트 */}
        <section className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-4">어디에 돈을 쓸까요?</h2>
          
          {/* 입력 폼 */}
          <form onSubmit={handleAddExpense} className="flex gap-2 mb-6">
            <input
              type="text"
              placeholder="예: 월세"
              value={newExpenseName}
              onChange={(e) => setNewExpenseName(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <input
              type="text"
              placeholder="금액"
              value={newExpenseAmount === '' ? '' : Number(newExpenseAmount).toLocaleString('ko-KR')}
              onChange={handleExpenseAmountChange}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button 
              type="submit" 
              className="bg-slate-900 text-white rounded-xl px-4 py-3 hover:bg-slate-800 transition-colors flex items-center justify-center shrink-0"
            >
              <PlusIcon />
            </button>
          </form>

          {/* 지출 리스트 */}
          <div className="space-y-3">
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm">
                지출 내역을 추가해 보세요!
              </div>
            ) : (
              expenses.map((expense) => (
                <div 
                  key={expense.id} 
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: expense.color }} 
                    />
                    <span className="font-medium text-slate-700">{expense.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-slate-800">{formatKRW(expense.amount)}</span>
                    <button
                      onClick={() => handleDeleteExpense(expense.id)}
                      className="text-slate-300 hover:text-red-500 transition-colors p-1"
                      aria-label="삭제"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

      </div>
    </div>
  );
}