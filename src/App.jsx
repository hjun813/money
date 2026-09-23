import { useEffect, useRef, useState } from 'react';
import './App.css';

const categories = [
  { id: 'housing', label: '주거', icon: 'home', color: '#8171c9' },
  { id: 'food', label: '식비', icon: 'food', color: '#d58953' },
  { id: 'transport', label: '교통', icon: 'arrow', color: '#6496b7' },
  { id: 'shopping', label: '쇼핑', icon: 'bag', color: '#c479a6' },
  { id: 'life', label: '생활', icon: 'spark', color: '#62a38f' },
  { id: 'etc', label: '기타', icon: 'dots', color: '#8992a3' },
];
const number = value => Math.round(value).toLocaleString('ko-KR');
const money = value => `${number(value)}원`;
const digits = value => Number(value.replace(/\D/g, '').slice(0, 11));
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const validMoney = value => Number.isSafeInteger(value) && value >= 0 && value <= 99999999999;
const initialMoney = key => { const value = read(key, 0); return validMoney(value) ? value : 0; };
const initialExpenses = () => {
  const saved = read('expenses', []);
  return Array.isArray(saved) ? saved.filter(item => item && typeof item.name === 'string' && validMoney(item.amount))
    .map((item, index) => ({ ...item, id: String(item.id ?? index), category: categories.some(c => c.id === item.category) ? item.category : 'etc' })) : [];
};
const emptyForm = { name: '', amount: 0, category: 'food', recurring: false };

function Icon({ name, size = 20 }) {
  const paths = {
    plus: 'M12 5v14M5 12h14',
    arrow: 'M5 12h14m-5-5 5 5-5 5',
    edit: 'm15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
    home: 'm3 10 9-7 9 7M5 9v12h14V9M10 21v-7h4v7',
    food: 'M5 3v7m3-7v7M3 3v5a3 3 0 0 0 6 0V3M6 11v10M17 3c-4 4-4 9 0 9h2M19 3v18',
    bag: 'M5 7h14l2 14H3L5 7ZM8 7V5a4 4 0 0 1 8 0v2',
    spark: 'm12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z',
    dots: 'M5 12h.01M12 12h.01M19 12h.01',
    close: 'm6 6 12 12M6 18 18 6',
    check: 'm5 12 4 4L19 6',
    chart: 'M5 20V10M12 20V4M19 20v-7',
    undo: 'M9 4 4 9l5 5M4 9h10a6 6 0 0 1 0 12',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.spark} /></svg>;
}

// Animate only this text node; the dashboard does not rerender on every frame.
function AnimatedNumber({ value }) {
  const element = useRef(null);
  const current = useRef(value);
  useEffect(() => {
    const from = current.current;
    let frame;
    if (reducedMotion() || from === value) {
      element.current.textContent = number(value);
      current.current = value;
      return;
    }
    const start = performance.now();
    const tick = time => {
      const progress = Math.min((time - start) / 420, 1);
      current.current = from + (value - from) * (1 - Math.pow(1 - progress, 3));
      element.current.textContent = number(current.current);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);
  return <><span aria-hidden="true" ref={element}>{number(value)}</span><span className="sr-only">{number(value)}</span></>;
}

function PressButton({ children, className = '', ...props }) {
  const ripple = event => {
    if (reducedMotion() || event.button !== 0) return;
    const button = event.currentTarget;
    const bounds = button.getBoundingClientRect();
    const dot = document.createElement('span');
    dot.className = 'tap-ripple';
    dot.setAttribute('aria-hidden', 'true');
    dot.style.left = `${event.clientX - bounds.left}px`;
    dot.style.top = `${event.clientY - bounds.top}px`;
    button.appendChild(dot);
    const animation = dot.animate([{ transform: 'translate(-50%, -50%) scale(0)', opacity: .18 }, { transform: 'translate(-50%, -50%) scale(15)', opacity: 0 }], { duration: 480, easing: 'ease-out' });
    animation.onfinish = () => dot.remove();
  };
  return <button {...props} className={`press ${className}`} onPointerDown={ripple}>{children}</button>;
}

function MoneyInput({ label, value, onChange, id, hint }) {
  return <label className="field" htmlFor={id}><span>{label}</span><div className="money-input"><input id={id} inputMode="numeric" autoComplete="off" value={value ? number(value) : ''} onChange={event => onChange(digits(event.target.value))} placeholder="0" /><span aria-hidden="true">원</span></div>{hint && <small>{hint}</small>}</label>;
}

function ExpenseRow({ item, fresh, onEdit, onDelete }) {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const category = categories.find(c => c.id === item.category);
  const remove = () => {
    if (leaving) return;
    setLeaving(true);
    timer.current = setTimeout(() => onDelete(item), reducedMotion() ? 0 : 220);
  };
  return <li className={`expense-row ${fresh ? 'fresh' : ''} ${leaving ? 'leaving' : ''}`}>
    <div className="row-clip"><div className="row-content">
      <span className="category-icon" style={{ '--category': category.color }}><Icon name={category.icon} /></span>
      <button className="expense-main" onClick={() => onEdit(item)} disabled={leaving} aria-label={`${item.name}, ${money(item.amount)}, 수정`}>
        <span className="expense-name">{item.name}</span><small>{category.label}{item.recurring ? ' · 고정비' : ''}</small>
      </button>
      <strong className="expense-amount">{money(item.amount)}</strong>
      <PressButton className="icon-button delete-button" aria-label={`${item.name} 삭제`} disabled={leaving} onClick={remove}><Icon name="trash" size={17} /></PressButton>
    </div></div>
  </li>;
}

export default function App() {
  const [salary, setSalary] = useState(() => initialMoney('salary'));
  const [savings, setSavings] = useState(() => initialMoney('savingsGoal'));
  const [expenses, setExpenses] = useState(initialExpenses);
  const [form, setForm] = useState(emptyForm);
  const [budget, setBudget] = useState({ salary, savings });
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [deleted, setDeleted] = useState(null);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [purchase, setPurchase] = useState(0);
  const [panel, setPanel] = useState('expense');
  const [fresh, setFresh] = useState(null);
  const dialog = useRef(null);
  const orb = useRef(null);
  const burst = useRef(null);
  const listHeading = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('salary', JSON.stringify(salary));
      localStorage.setItem('savingsGoal', JSON.stringify(savings));
      localStorage.setItem('expenses', JSON.stringify(expenses));
      // Surface the outcome of synchronizing with browser storage.
      // eslint-disable-next-line react/set-state-in-effect
      setStorageError(false);
    } catch { setStorageError(true); }
  }, [salary, savings, expenses]);

  useEffect(() => {
    if (!notice || deleted) return;
    const timer = setTimeout(() => setNotice(''), 4000);
    return () => clearTimeout(timer);
  }, [notice, deleted]);

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const available = salary - savings - total;
  const denominator = Math.max(salary, savings + total, 1);
  const filtered = expenses.filter(item => filter === 'all' || (filter === 'fixed' ? item.recurring : !item.recurring));
  const categoryTotals = categories.map(category => ({ ...category, amount: expenses.filter(item => item.category === category.id).reduce((sum, item) => sum + item.amount, 0) })).filter(item => item.amount);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const open = (next, item = null) => {
    setPanel(next);
    if (next === 'expense') { setEditing(item?.id ?? null); setForm(item ?? emptyForm); }
    if (next === 'budget') setBudget({ salary, savings });
    dialog.current.showModal();
    // Focus the new panel after React has replaced the previous content.
    requestAnimationFrame(() => (dialog.current.querySelector('input') || dialog.current.querySelector('button'))?.focus());
  };
  const celebrate = () => {
    if (reducedMotion()) return;
    orb.current?.getAnimations().forEach(animation => animation.cancel());
    orb.current?.animate([
      { transform: 'rotate(-12deg) scale(1)' },
      { transform: 'rotate(18deg) scale(1.15)', offset: .4 },
      { transform: 'rotate(-12deg) scale(1)' },
    ], { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' });
    burst.current?.getAnimations().forEach(animation => animation.cancel());
    burst.current?.animate([{ opacity: 0, transform: 'scale(.65)' }, { opacity: 1, offset: .2 }, { opacity: 0, transform: 'scale(1.3)' }], { duration: 650 });
  };
  const submit = event => {
    event.preventDefault();
    if (!form.name.trim() || form.amount <= 0) return;
    const item = { ...form, name: form.name.trim(), id: editing || crypto.randomUUID() };
    setExpenses(current => editing ? current.map(entry => entry.id === editing ? item : entry) : [item, ...current]);
    setFresh(item.id); setFilter('all');
    setNotice(editing ? '수정했어요.' : `${item.name}, 계획에 담았어요.`);
    dialog.current.close();
    celebrate();
  };
  const remove = item => {
    setDeleted({ item, index: expenses.findIndex(entry => entry.id === item.id) });
    setExpenses(current => current.filter(entry => entry.id !== item.id));
    setNotice(`${item.name} 항목을 삭제했어요.`);
    listHeading.current?.focus();
  };
  const undo = () => {
    setExpenses(current => { const next = [...current]; next.splice(deleted.index, 0, deleted.item); return next; });
    setFresh(deleted.item.id); setFilter('all'); setDeleted(null);
    setNotice('다시 가져왔어요.');
  };
  const saveBudget = event => {
    event.preventDefault(); setSalary(budget.salary); setSavings(budget.savings);
    dialog.current.close(); setNotice('예산을 업데이트했어요.'); celebrate();
  };
  const title = { expense: editing ? '계획 수정' : '새로운 지출', budget: '나의 예산', insight: '돈이 향하는 곳', purchase: '사기 전에, 잠깐.' }[panel];

  return <div className={`app-shell ${available < 0 ? 'over-budget' : ''}`}>
    <header className="app-header"><a className="brand" href="#"><span className="brand-mark"><Icon name="spark" size={18} /></span>flow<span className="brand-dot">.</span></a><span className="save-state"><i />{storageError ? '저장 실패' : '내 기기에 저장됨'}</span></header>
    <main className="canvas">
      <section className="hero" aria-labelledby="balance-title">
        <div className="hero-top"><span className="eyebrow">MY LITTLE MONEY PLAN</span><button className="budget-link" onClick={() => open('budget')}>예산 설정 <Icon name="edit" size={13} /></button></div>
        <button className="orb-button" aria-label="작은 반짝임 재생" onClick={celebrate}><span className="orb" ref={orb}><span /><span /><span /></span><span className="spark-burst" ref={burst} aria-hidden="true">✧<i>✦</i><b>✧</b></span></button>
        <h1 id="balance-title">{!salary ? '나만의 여유를 만들어 볼까요?' : available < 0 ? '조금만 가볍게 해볼까요?' : '이만큼의 여유가 있어요.'}</h1>
        <p className="hero-amount"><AnimatedNumber value={available} /><span className="currency">원</span></p>
        <p className="hero-note">{!salary ? '월급을 정하면, 내 돈의 흐름이 시작돼요.' : available < 0 ? '저축 또는 지출 계획을 조정해 주세요.' : '저축과 지출 계획을 모두 제외한 금액'}</p>
        {!salary && <PressButton className="primary start-button" onClick={() => open('budget')}>월급 입력하고 시작 <Icon name="arrow" size={16} /></PressButton>}
        <div className="allocation" role="img" aria-label={`월급 ${money(salary)}, 저축 ${money(savings)}, 지출 ${money(total)}`}><span className="allocation-saving" style={{ transform: `scaleX(${savings / denominator})` }} /><span className="allocation-expense" style={{ left: `${savings / denominator * 100}%`, transform: `scaleX(${total / denominator})` }} /></div>
        <div className="budget-summary">
          <button onClick={() => open('budget')}><span>월급</span><strong>{money(salary)}</strong></button>
          <button onClick={() => open('budget')}><span><i className="saving-dot" />저축 예정</span><strong>{money(savings)}</strong></button>
          <button onClick={() => open('insight')}><span><i className="expense-dot" />계획 지출</span><strong>{money(total)}</strong></button>
        </div>
      </section>

      <section className="plans" aria-labelledby="plans-title">
        <div className="list-heading"><h2 id="plans-title" ref={listHeading} tabIndex={-1}>나의 지출<span>{expenses.length}</span></h2><PressButton className="add-button" onClick={() => open('expense')}><Icon name="plus" size={17} />추가하기</PressButton></div>
        {expenses.length > 0 && <div className="segmented" aria-label="지출 분류"><span className="segment-track" aria-hidden="true" style={{ transform: `translateX(${['all', 'fixed', 'flexible'].indexOf(filter) * 100}%)` }} />{[['all', '전체'], ['fixed', '고정비'], ['flexible', '그 외']].map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div>}
        {filtered.length ? <ul className="expense-list">{filtered.map(item => <ExpenseRow key={item.id} item={item} fresh={fresh === item.id} onEdit={item => open('expense', item)} onDelete={remove} />)}</ul> : <div className="empty-state"><span className="empty-doodle"><Icon name="plus" size={25} /></span><h3>{expenses.length ? '여기는 아직 비어 있어요.' : '첫 계획은, 가볍게.'}</h3><p>{expenses.length ? '다른 분류를 보거나 새 지출을 더해 보세요.' : '커피 한 잔부터 월세까지. 하나씩 담아 보세요.'}</p><button className="text-button" onClick={() => open('expense')}>지출 담아보기 <Icon name="arrow" size={15} /></button></div>}
      </section>
      <nav className="little-tools" aria-label="추가 도구"><PressButton onClick={() => open('insight')}><span className="tool-symbol"><Icon name="chart" size={18} /></span><span>지출 살펴보기</span><Icon name="arrow" size={15} /></PressButton><PressButton onClick={() => open('purchase')}><span className="tool-symbol peach"><Icon name="bag" size={18} /></span><span>이거 사도 될까?</span><Icon name="arrow" size={15} /></PressButton></nav>
      <footer>Less worry. More flow.<span>항목을 누르면 수정할 수 있어요.</span></footer>
    </main>

    <dialog ref={dialog} className="sheet" aria-labelledby="sheet-title" onClick={event => { if (event.target === dialog.current) { const box = dialog.current.getBoundingClientRect(); if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.current.close(); } }}>
      <div className="sheet-handle" aria-hidden="true" />
      <div className="sheet-heading"><div><p className="eyebrow">MAKE IT YOURS</p><h2 id="sheet-title">{title}</h2></div><PressButton className="icon-button" aria-label="닫기" onClick={() => dialog.current.close()}><Icon name="close" /></PressButton></div>
      {panel === 'budget' && <form onSubmit={saveBudget} className="sheet-form"><MoneyInput id="salary" label="이번 달 실수령 월급" value={budget.salary} onChange={salary => setBudget(current => ({ ...current, salary }))} /><MoneyInput id="savings" label="먼저 떼어 둘 저축액" value={budget.savings} onChange={savings => setBudget(current => ({ ...current, savings }))} hint="저축 예정액을 제외한 금액을 여유자금으로 보여 드려요." /><PressButton className="primary submit-button">이렇게 계획할게요 <Icon name="check" size={17} /></PressButton></form>}
      {panel === 'expense' && <form onSubmit={submit} className="sheet-form"><label className="field"><span>어디에 쓸까요?</span><input value={form.name} maxLength={80} onChange={event => update('name', event.target.value)} placeholder="예: 나를 위한 커피" required /></label><MoneyInput id="expense-amount" label="얼마를 쓸까요?" value={form.amount} onChange={amount => update('amount', amount)} /><fieldset className="category-picker"><legend>카테고리</legend>{categories.map(item => <PressButton type="button" key={item.id} aria-pressed={form.category === item.id} className={form.category === item.id ? 'chosen' : ''} onClick={() => update('category', item.id)}><Icon name={item.icon} size={17} />{item.label}</PressButton>)}</fieldset><label className="switch-label"><span>고정비로 표시<small>매달 나가는 비용을 구분해요. 자동 등록은 되지 않아요.</small></span><input type="checkbox" checked={form.recurring} onChange={event => update('recurring', event.target.checked)} /><span className="switch" aria-hidden="true" /></label><PressButton className="primary submit-button" disabled={!form.name.trim() || form.amount <= 0}>{editing ? '수정 완료' : '계획에 담기'}<Icon name={editing ? 'check' : 'plus'} size={18} /></PressButton></form>}
      {panel === 'insight' && <div className="insight"><p className="insight-total">{money(total)}<span>계획한 지출</span></p>{categoryTotals.length ? <div className="category-breakdown">{[...categoryTotals].sort((a, b) => b.amount - a.amount).map(item => <div key={item.id}><div className="breakdown-label"><span><i style={{ background: item.color }} />{item.label}</span><strong>{money(item.amount)}</strong></div><div className="mini-bar"><span style={{ transform: `scaleX(${item.amount / total})`, background: item.color }} /></div></div>)}</div> : <p className="hint">지출을 담으면 돈이 어디로 향하는지 보여 드려요.</p>}<p className="hint">고정비 {money(expenses.filter(item => item.recurring).reduce((sum, item) => sum + item.amount, 0))} 포함</p></div>}
      {panel === 'purchase' && <div className="sheet-form"><p className="hint">저축 계획을 지키면서 살 수 있을지 확인해요.</p><MoneyInput id="purchase" label="사고 싶은 물건의 가격" value={purchase} onChange={setPurchase} />{purchase > 0 && <div className={`simulation-result ${available - purchase < 0 ? 'warning' : ''}`} role="status"><span>{!salary ? '월급을 먼저 입력해 주세요.' : available - purchase < 0 ? '여유자금을 넘어서요.' : '현재 계획 안에서 가능해요.'}</span>{salary > 0 && <><strong>{money(available - purchase)}</strong><small>구매 후 남는 여유자금</small></>}</div>}<PressButton className="primary submit-button" disabled={!salary || purchase <= 0} onClick={() => { setEditing(null); setForm({ ...emptyForm, amount: purchase, category: 'shopping' }); setPanel('expense'); requestAnimationFrame(() => dialog.current.querySelector('input')?.focus()); }}>지출로 이어서 작성 <Icon name="arrow" size={16} /></PressButton></div>}
    </dialog>
    <div className="feedback" role="status" aria-live="polite">{storageError ? <div>저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.</div> : notice && <div key={notice}><Icon name="check" size={16} /><span>{notice}</span>{deleted && <button onClick={undo}><Icon name="undo" size={15} />삭제 취소</button>}<button aria-label="알림 닫기" onClick={() => { setNotice(''); setDeleted(null); }}><Icon name="close" size={15} /></button></div>}</div>
  </div>;
}
