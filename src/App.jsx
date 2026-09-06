import { useEffect, useMemo, useState } from 'react';
import { TRAINING_SYNC_URL } from './config';

const PROGRAM = [
  ['動態評估與軟組織重置', '貓駝式', '8', '2', '下', '活化脊椎靈活度、誘發核心深層肌群'],
  ['動態評估與軟組織重置', '呼吸練習 1', '5', '2', '次', '左右腹腔吸飽氣'],
  ['動態評估與軟組織重置', '呼吸練習 2', '5', '2', '次', '後背與肋骨吸飽氣'],
  ['ATG 關節啟動與末端防護', '脛前肌上提（Tibialis Raise）', '20', '2', '次', '建立腳踝制動與膝蓋防護'],
  ['ATG 關節啟動與末端防護', '斜板深蹲啟動（Slant Board Squat）', '15', '2', '次', '誘導膝蓋過腳趾、髕骨肌腱溫熱'],
  ['ATG 關節啟動與末端防護', '大象漫步（Elephant Walk）', '20', '1', '下', '放鬆後側鏈與膕繩肌緊'],
  ['單側與結締組織補強', 'ATG 分腿蹲（ATG Split Squat）', '8', '3', '下', '每側；完全折疊後腳伸展髖屈肌'],
  ['單側與結締組織補強', '輔助式北歐挺身（Assisted Nordic Curl）', '5–6', '3', '下', '後側鏈肌腱耐受度'],
  ['單側與結締組織補強', '壺鈴單手農夫走路', '30', '2', '公尺', '每側；核心抗旋轉'],
  ['自由重量主項 — 高品質肌力', '俯身啞鈴划船', '8', '3', '下', '主訓練動作'],
  ['自由重量主項 — 高品質肌力', '滑輪下拉', '8', '3', '下', '主訓練動作'],
  ['降溫、放鬆與課堂複盤', 'Couch Stretch', '60', '1', '秒', '每側'],
];

const makePlan = () => PROGRAM.map(([section, name, reps, sets, unit, note]) => ({ id: `exercise-${crypto.randomUUID()}`, section, name, reps, sets, unit, note, weight: '' }));
const initialStudents = [
  { id: 'demo-1', name: '林安妮', goal: '改善久坐與肩頸僵硬', plan: makePlan() },
  { id: 'demo-2', name: '王子維', goal: '建立下肢力量與膝蓋耐受', plan: makePlan() },
];

function useStudents() {
  const [students, setStudents] = useState(() => {
    try { return JSON.parse(localStorage.getItem('phoebe-training-students')) || initialStudents; } catch { return initialStudents; }
  });
  useEffect(() => localStorage.setItem('phoebe-training-students', JSON.stringify(students)), [students]);
  return [students, setStudents];
}

function StudentModal({ mode, student, onClose, onSave }) {
  const [form, setForm] = useState({ name: student?.name || '', goal: student?.goal || '' });
  const submit = (event) => { event.preventDefault(); if (form.name.trim()) onSave({ name: form.name.trim(), goal: form.goal.trim() || '尚未設定訓練重點' }); };
  return <div className="modal-backdrop"><form className="student-modal" onSubmit={submit}><button className="modal-close" type="button" onClick={onClose} aria-label="關閉">×</button><p className="overline">{mode === 'new' ? '新增學員' : '編輯學員'}</p><h2>{mode === 'new' ? '建立個別課表' : '更新學員資料'}</h2><label>學員姓名<input autoFocus value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder="例如：陳小美" /></label><label>本次訓練重點<input value={form.goal} onChange={(e) => setForm((prev) => ({ ...prev, goal: e.target.value }))} placeholder="例如：肩頸放鬆、下肢穩定" /></label><button type="submit">{mode === 'new' ? '建立課表' : '儲存修改'}</button></form></div>;
}

export function App() {
  const [students, setStudents] = useStudents();
  const [selectedId, setSelectedId] = useState(students[0]?.id || '');
  const [modal, setModal] = useState('');
  const student = students.find((item) => item.id === selectedId) || students[0];
  const groupedPlan = useMemo(() => student?.plan.reduce((groups, item, index) => { (groups[item.section] ||= []).push({ ...item, index }); return groups; }, {}), [student]);
  const [saveState, setSaveState] = useState('');
  const updateExercise = (index, key, value) => setStudents((items) => items.map((item) => item.id === student.id ? { ...item, plan: item.plan.map((exercise, i) => i === index ? { ...exercise, [key]: value } : exercise) } : item));
  const addExercise = (section) => setStudents((items) => items.map((item) => item.id === student.id ? { ...item, plan: [...item.plan, { id: `exercise-${crypto.randomUUID()}`, section, name: '新動作', reps: '8', sets: '3', unit: '下', note: '', weight: '' }] } : item));
  const deleteExercise = (index) => setStudents((items) => items.map((item) => item.id === student.id ? { ...item, plan: item.plan.filter((_, i) => i !== index) } : item));
  const saveToSheets = async () => {
    setSaveState('儲存中…');
    if (!TRAINING_SYNC_URL) { setSaveState('已儲存於本機'); return; }
    try {
      await fetch(TRAINING_SYNC_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: 'replaceTraining', student }) });
      setSaveState('已同步至 Google Sheets');
    } catch { setSaveState('已儲存於本機；Google Sheets 同步失敗'); }
  };
  const saveStudent = (form) => {
    if (modal === 'new') { const next = { id: `student-${Date.now()}`, ...form, plan: makePlan() }; setStudents((items) => [...items, next]); setSelectedId(next.id); }
    else setStudents((items) => items.map((item) => item.id === student.id ? { ...item, ...form } : item));
    setModal('');
  };
  const deleteStudent = () => {
    if (!window.confirm(`確定刪除「${student.name}」及其所有訓練紀錄嗎？`)) return;
    const remaining = students.filter((item) => item.id !== student.id);
    setStudents(remaining); setSelectedId(remaining[0]?.id || '');
  };
  if (!student) return <main className="empty-state"><h1>先新增第一位學員</h1><button onClick={() => setModal('new')}>＋ 新增學員</button>{modal && <StudentModal mode="new" onClose={() => setModal('')} onSave={saveStudent} />}</main>;
  return <main className="training-shell">
    <header className="app-topbar"><a className="brand" href="#top">PHOEBE <span>COACHING</span></a><span className="topbar-title">學員課表</span><div className="coach-avatar">P</div></header>
    <div className="app-layout" id="top">
      <aside className="student-sidebar"><div className="sidebar-label"><span>學員名單</span><button type="button" onClick={() => setModal('new')} aria-label="新增學員">＋</button></div><div className="student-list">{students.map((item) => <button key={item.id} type="button" className={`student-item ${item.id === student.id ? 'selected' : ''}`} onClick={() => setSelectedId(item.id)}><span className="student-initial">{item.name.slice(0, 1)}</span><strong>{item.name}</strong></button>)}</div></aside>
      <section className="program-area"><div className="program-heading"><div><p className="overline">體驗課・90 分鐘</p><h1>{student.name} 的訓練課表</h1><p>{student.goal}</p></div><div className="program-actions"><button type="button" className="quiet-button" onClick={() => setModal('edit')}>編輯學員</button><button type="button" className="delete-button" onClick={deleteStudent}>刪除</button></div></div>
        <div className="session-note"><span>本次課程</span><input aria-label="本次課程日期" type="date" defaultValue={new Date().toISOString().slice(0, 10)} /><textarea placeholder="課前觀察／今天的訓練目標…" /></div>
        {Object.entries(groupedPlan).map(([section, exercises]) => <section className="program-section" key={section}><div className="section-title"><h2>{section}</h2><button type="button" onClick={() => addExercise(section)}>＋ 新增動作</button></div><div className="exercise-head"><span>動作</span><span>重量</span><span>次數</span><span>組數</span></div>{exercises.map((exercise) => <div className="exercise-row" key={exercise.id || exercise.index}><div className="exercise-title"><input className="exercise-name" value={exercise.name} onChange={(e) => updateExercise(exercise.index, 'name', e.target.value)} aria-label="動作名稱" /><small>{exercise.note}</small></div><label className="metric"><input inputMode="decimal" value={exercise.weight} onChange={(e) => updateExercise(exercise.index, 'weight', e.target.value)} placeholder="—" /><span>kg</span></label><label className="metric"><input value={exercise.reps} onChange={(e) => updateExercise(exercise.index, 'reps', e.target.value)} /><span>{exercise.unit}</span></label><label className="metric"><input inputMode="numeric" value={exercise.sets} onChange={(e) => updateExercise(exercise.index, 'sets', e.target.value)} /><span>組</span></label><button className="delete-exercise" type="button" onClick={() => deleteExercise(exercise.index)} aria-label={`刪除 ${exercise.name}`}>×</button></div>)}</section>)}
        <div className="finish-card"><div><p className="overline">手動儲存</p><h2>完成本次調整後儲存</h2><p>{saveState || '重量、次數與組數會保留在此手機，並同步至 Google Sheets。'}</p></div><button type="button" onClick={saveToSheets}>儲存課表</button></div>
      </section>
    </div>
    {modal && <StudentModal mode={modal} student={modal === 'edit' ? student : null} onClose={() => setModal('')} onSave={saveStudent} />}
  </main>;
}
