import { useEffect, useRef, useState } from 'react';
import './App.css';

const categories = [
  { id: 'housing', label: '주거', color: '#7868d8' },
  { id: 'food', label: '식비', color: '#df9250' },
  { id: 'transport', label: '교통', color: '#488db6' },
  { id: 'shopping', label: '쇼핑', color: '#cf779f' },
  { id: 'life', label: '생활', color: '#57a18a' },
  { id: 'etc', label: '기타', color: '#8590a6' },
];
const money = value => `${Math.trunc(value).toLocaleString('ko-KR')}원`;
const digits = value => Number(value.replace(/\D/g, '').slice(0, 11));
const read = (key, fallback) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const validMoney = value => Number.isSafeInteger(value) && value >= 0 && value <= 99999999999;
const initialExpenses = () => {
  const saved = read('expenses', []);
  return Array.isArray(saved) ? saved.filter(item => item && typeof item.name === 'string' && validMoney(item.amount)).map((item, index) => ({ ...item, id: String(item.id ?? index), category: categories.some(c => c.id === item.category) ? item.category : 'etc' })) : [];
};
const initialMoney = key => { const value = read(key, 0); return validMoney(value) ? value : 0; };
const emptyForm = { name: '', amount: 0, category: 'food', recurring: false };

function Icon({ name, size = 20 }) {
  const paths = {
    plus: 'M12 5v14M5 12h14',
    arrow: 'M5 12h14m-5-5 5 5-5 5',
    edit: 'm15 5 4 4M4 20l4-1L20 7a2.8 2.8 0 0 0-4-4L4 15v5Z',
    trash: 'M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7',
    wallet: 'M20 7H5a2 2 0 0 1 0-4h13v4M3 5v14a2 2 0 0 0 2 2h15V7M20 12h-5v4h5',
    check: 'm5 12 4 4L19 6',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.wallet} /></svg>;
}

function MoneyInput({ label, value, onChange, id, hint }) {
  return <label className="field" htmlFor={id}><span>{label}</span><div className="money-input"><input id={id} inputMode="numeric" autoComplete="off" value={value ? value.toLocaleString('ko-KR') : ''} onChange={event => onChange(digits(event.target.value))} placeholder="0" /><span aria-hidden="true">원</span></div>{hint && <small>{hint}</small>}</label>;
}

export default function App() {
  const [salary, setSalary] = useState(() => initialMoney('salary'));
  const [savings, setSavings] = useState(() => initialMoney('savingsGoal'));
  const [expenses, setExpenses] = useState(initialExpenses);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [deleted, setDeleted] = useState(null);
  const [notice, setNotice] = useState('');
  const [storageError, setStorageError] = useState(false);
  const [purchase, setPurchase] = useState(0);
  const nameRef = useRef(null);
  const formRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('salary', JSON.stringify(salary));
      localStorage.setItem('savingsGoal', JSON.stringify(savings));
      localStorage.setItem('expenses', JSON.stringify(expenses));
      // Persistence can fail independently of form state; report its result to the user.
      // eslint-disable-next-line react/set-state-in-effect
      setStorageError(false);
    } catch { setStorageError(true); }
  }, [salary, savings, expenses]);

  const total = expenses.reduce((sum, item) => sum + item.amount, 0);
  const available = salary - savings - total;
  const fixed = expenses.filter(item => item.recurring).reduce((sum, item) => sum + item.amount, 0);
  const denominator = Math.max(salary, savings + total, 1);
  const filtered = expenses.filter(item => filter === 'all' || item.category === filter);
  const categoryTotals = categories.map(category => ({ ...category, amount: expenses.filter(item => item.category === category.id).reduce((sum, item) => sum + item.amount, 0) })).filter(item => item.amount);
  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));
  const focusForm = () => { formRef.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' }); nameRef.current?.focus({ preventScroll: true }); };
  const submit = event => {
    event.preventDefault();
    if (!form.name.trim() || form.amount <= 0) return;
    const item = { ...form, name: form.name.trim(), id: editing || crypto.randomUUID() };
    setExpenses(current => editing ? current.map(entry => entry.id === editing ? item : entry) : [...current, item]);
    setNotice(editing ? '지출 계획을 수정했어요.' : `${item.name} 항목을 추가했어요.`);
    setForm(emptyForm); setEditing(null); setFilter('all');
    nameRef.current?.focus();
  };
  const remove = item => {
    setDeleted({ item, index: expenses.findIndex(entry => entry.id === item.id) });
    setExpenses(current => current.filter(entry => entry.id !== item.id));
    if (editing === item.id) { setEditing(null); setForm(emptyForm); }
    setNotice(`${item.name} 항목을 삭제했어요.`);
  };
  const undo = () => {
    setExpenses(current => { const next = [...current]; next.splice(deleted.index, 0, deleted.item); return next; });
    setDeleted(null); setNotice('삭제한 항목을 복원했어요.');
  };

  return <div className="app-shell">
    <header className="app-header"><a className="brand" href="#"><span className="brand-mark"><Icon name="wallet" /></span>월급 플로우<span className="brand-caption">나를 위한 돈의 계획</span></a><span className="save-state"><i />{storageError ? '저장 실패' : '이 기기에 저장됨'}</span></header>
    <main className="dashboard">
      <div className="page-heading"><div><p className="eyebrow">MY MONEY PLAN</p><h1>내 월급, 쓸 곳을 정하다<span>.</span></h1><p className="intro">먼저 저축하고, 필요한 지출을 채우고, 여유를 확인하세요.</p></div><a className="button primary heading-action" href="#expense-form"><Icon name="plus" />지출 추가</a></div>

      <section className="overview" aria-labelledby="overview-title">
        <div className="balance"><span className="balance-tag"><Icon name="check" size={14} />저축 예정액을 제외한 금액</span><h2 id="overview-title">{available < 0 ? '계획을 조정할 금액' : '자유롭게 쓸 수 있는 돈'}</h2><p className={`hero-amount ${available < 0 ? 'negative' : ''}`}>{money(available)}</p><p className="balance-note">{!salary ? '아래에서 월급을 입력하면 계획이 시작돼요.' : available < 0 ? `${money(-available)}만큼 지출이나 저축 예정액을 줄여 주세요.` : '아직 사용처를 정하지 않은 여유자금이에요.'}</p></div>
        <div className="allocation"><div className="allocation-heading"><span>월급 배분 현황</span><strong>{salary > 0 ? `${Math.round((total + savings) / salary * 100)}% 배분` : '입력 대기'}</strong></div><div className="allocation-bar" aria-label={`저축 ${money(savings)}, 지출 ${money(total)}, 여유자금 ${money(Math.max(available, 0))}`} role="img"><span className="saving-segment" style={{ width: `${savings / denominator * 100}%` }} /><span className="expense-segment" style={{ width: `${total / denominator * 100}%` }} /></div><dl className="allocation-legend"><div><dt><i className="saving-dot" />저축 예정</dt><dd>{money(savings)}</dd></div><div><dt><i className="expense-dot" />계획 지출</dt><dd>{money(total)}</dd></div><div><dt><i className="free-dot" />여유자금</dt><dd>{money(Math.max(available, 0))}</dd></div></dl></div>
      </section>

      <section className="budget-settings" aria-labelledby="budget-title"><div className="section-intro"><span className="step">01</span><div><h2 id="budget-title">예산부터 설정해요</h2><p>금액을 바꾸면 계획에 바로 반영돼요.</p></div></div><MoneyInput id="salary" label="이번 달 실수령 월급" value={salary} onChange={setSalary} /><MoneyInput id="savings" label="먼저 떼어 둘 저축액" value={savings} onChange={setSavings} hint="실제 저축 완료 금액이 아닌 계획 금액이에요." /></section>

      <div className="workspace"><div className="main-column">
        <section className="panel expense-panel"><div className="section-heading"><div className="section-intro"><span className="step">02</span><div><h2>지출을 계획해요 <span className="count">{expenses.length}</span></h2><p>고정비와 생활비를 한곳에서 관리하세요.</p></div></div></div>
          <form id="expense-form" ref={formRef} onSubmit={submit} className="expense-form"><div className="form-heading"><h3>{editing ? '지출 수정' : '새 지출 추가'}</h3>{editing && <button type="button" className="text-button" onClick={() => { setEditing(null); setForm(emptyForm); }}>수정 취소</button>}</div><div className="form-grid"><label className="field"><span>어디에 쓸까요?</span><input ref={nameRef} value={form.name} maxLength={80} onChange={event => update('name', event.target.value)} placeholder="예: 점심 식비" required /></label><MoneyInput id="expense-amount" label="얼마를 쓸까요?" value={form.amount} onChange={value => update('amount', value)} /></div><div className="form-options"><label className="category-select"><span className="sr-only">카테고리</span><select value={form.category} onChange={event => update('category', event.target.value)}>{categories.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><label className="checkbox"><input type="checkbox" checked={form.recurring} onChange={event => update('recurring', event.target.checked)} />고정비로 표시</label><button className="button primary" disabled={!form.name.trim() || form.amount <= 0}><Icon name={editing ? 'check' : 'plus'} size={18} />{editing ? '수정 저장' : '지출 추가'}</button></div>{!editing && <div className="quick-add"><span>빠른 입력</span>{[['월세', 'housing'], ['식비', 'food'], ['교통비', 'transport'], ['구독료', 'life']].map(([name, category]) => <button type="button" key={name} onClick={() => { setForm({ ...emptyForm, name, category, recurring: name === '월세' || name === '구독료' }); document.getElementById('expense-amount').focus(); }}>{name}<span>＋</span></button>)}</div>}</form>
          <div className="list-toolbar"><h3>내 지출 계획</h3><strong>{money(total)}</strong></div><div className="filters" aria-label="카테고리 필터">{[{ id: 'all', label: '전체' }, ...categories].map(item => <button key={item.id} aria-pressed={filter === item.id} onClick={() => setFilter(item.id)} className={filter === item.id ? 'selected' : ''}>{item.label}</button>)}</div>
          {filtered.length ? <ul className="expense-list">{filtered.map(item => { const category = categories.find(c => c.id === item.category); return <li key={item.id}><span className="category-icon" style={{ '--category': category.color }}>{category.label.slice(0, 1)}</span><div className="expense-detail"><span className="expense-name">{item.name}</span><small>{category.label}{item.recurring && ' · 고정비'}</small></div><strong className="expense-amount">{money(item.amount)}</strong><div className="row-actions"><button aria-label={`${item.name} 수정`} onClick={() => { setEditing(item.id); setForm(item); focusForm(); }}><Icon name="edit" size={17} /></button><button aria-label={`${item.name} 삭제`} onClick={() => remove(item)}><Icon name="trash" size={17} /></button></div></li>; })}</ul> : <div className="empty-state"><span className="empty-symbol"><Icon name="wallet" size={28} /></span><h3>{expenses.length ? '이 카테고리는 아직 비어 있어요' : '첫 지출을 계획해 볼까요?'}</h3><p>{expenses.length ? '다른 카테고리를 선택하거나 새 지출을 추가하세요.' : '월세, 식비처럼 익숙한 항목부터 시작해 보세요.'}</p><button className="text-button" onClick={focusForm}>지출 입력하기 <Icon name="arrow" size={16} /></button></div>}
        </section>
      </div><aside className="side-column">
        <section className="panel insight-panel"><div className="section-intro"><span className="step">03</span><div><h2>한눈에 보는 지출</h2><p>어디에 가장 많이 쓸 예정인가요?</p></div></div>{categoryTotals.length ? <div className="category-breakdown">{[...categoryTotals].sort((a, b) => b.amount - a.amount).map(item => <div key={item.id}><div className="breakdown-label"><span><i style={{ background: item.color }} />{item.label}</span><strong>{money(item.amount)}</strong></div><div className="mini-bar"><span style={{ width: `${item.amount / total * 100}%`, background: item.color }} /></div></div>)}</div> : <p className="insight-empty">지출을 추가하면 카테고리별 비중을 보여 드려요.</p>}<div className="fixed-summary"><span>이 중 고정비</span><strong>{money(fixed)}</strong></div><p className="footnote">고정비 표시는 분류용이며 다음 달 자동 등록은 지원하지 않아요.</p></section>
        <section className="panel simulator"><span className="simulator-label">구매 전 잠깐</span><h2>이거 사도 괜찮을까?</h2><p>저축 계획을 지키면서 살 수 있는지 확인해요.</p><MoneyInput id="purchase" label="사고 싶은 물건의 가격" value={purchase} onChange={setPurchase} />{purchase > 0 && <div className={`simulation-result ${available - purchase < 0 ? 'warning' : ''}`} role="status"><span>{!salary ? '월급을 먼저 입력해 주세요.' : available - purchase < 0 ? '여유자금을 초과해요' : '현재 계획 안에서 가능해요'}</span>{salary > 0 && <><strong>{money(available - purchase)}</strong><small>구매 후 남는 여유자금</small></>}</div>}<button className="button secondary" disabled={!salary || purchase <= 0} onClick={() => { setEditing(null); setForm({ ...emptyForm, amount: purchase, category: 'shopping' }); focusForm(); }}>이 금액으로 지출 작성 <Icon name="arrow" size={16} /></button></section>
      </aside></div>
      <footer>내 돈의 흐름을, 내 속도로.<span>입력한 정보는 현재 브라우저에 저장돼요.</span></footer>
    </main><div className="feedback" role="status" aria-live="polite">{storageError ? <div>저장하지 못했어요. 브라우저 저장 공간을 확인해 주세요.</div> : notice && <div><span>{notice}</span>{deleted && <button onClick={undo}>삭제 취소</button>}<button aria-label="알림 닫기" onClick={() => { setNotice(''); setDeleted(null); }}>닫기</button></div>}</div>
  </div>;
}
