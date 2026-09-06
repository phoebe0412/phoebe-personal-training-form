import { useState } from 'react';
import { GOOGLE_APPS_SCRIPT_URL } from './config';

const initialForm = {
  name: '', phone: '', line: '', birthday: '', gender: '', work: '', workOther: '', sleep: '',
  condition: '', conditionNote: '', symptoms: '', injuries: [], injuryNote: '', pregnancy: '', exerciseFrequency: '', activities: [],
  coaching: '', barriers: [], barrierOther: '', focus: '', frequency: '', time: '', timeOther: '', message: '',
};

const choices = {
  gender: ['男', '女', '不願透露'],
  work: ['久坐辦公（每日坐姿超過 6 小時）', '長時間站立或走動', '重體力或高活動量工作', '其他'],
  sleep: ['未滿 5 小時', '5～6 小時', '6～8 小時', '8 小時以上'],
  condition: ['否', '是（請於下方說明）'],
  symptoms: ['否', '是'],
  injuries: ['無任何舊傷或疼痛', '頸部／肩部', '下背／腰部', '膝蓋', '腳踝', '其他關節或手術史'],
  pregnancy: ['否', '是（懷孕中）', '是（產後半年內）'],
  exerciseFrequency: ['幾乎沒有（0 天）', '1～2 天', '3～4 天', '5 天以上'],
  activities: ['肌力／重量訓練（器械或自由重量）', '跑步／單車／游泳等耐力有氧', '團體有氧課（如飛輪、Les Mills、HIIT）', '瑜伽／皮拉提斯／伸展', '球類運動／登山攀岩', '尚無固定項目'],
  coaching: ['否，這是第一次', '是，半年以內曾上過', '是，已是一年以前'],
  barriers: ['缺乏動力與自律，難以持續', '不清楚正確動作，容易受傷或代償疼痛', '自行排課／飲食效果不明顯，進入瓶頸', '時間難以安排', '其他'],
  focus: ['身體組成與動作活動度檢測評估', '完整的個人化課表訓練體驗', '長期訓練規劃諮詢'],
  frequency: ['每週 1 次', '每週 2 次', '每週 3 次以上', '先體驗看看，暫不確定'],
  time: ['平日白天（09:00－17:00）', '平日晚上（18:00－22:00）', '週末假日（全日）', '其他'],
};

function ChoiceGroup({ name, label, options, value, onChange, multiple = false, required = true, otherKey, form, error }) {
  const selected = multiple ? value : [value];
  const toggle = (option) => {
    if (!multiple) return onChange(name, option);
    onChange(name, selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  };
  const hasOther = selected.some((item) => item === '其他' || item.includes('其他關節'));
  return (
    <section className={`form-section ${error ? 'has-error' : ''}`} data-field={name}>
      <fieldset>
        <legend>{label}{required && <span className="required">＊</span>}</legend>
        <div className="choice-list">
          {options.map((option) => (
            <label className="choice" key={option}>
              <input type={multiple ? 'checkbox' : 'radio'} name={name} checked={selected.includes(option)} onChange={() => toggle(option)} />
              <span>{option}</span>
            </label>
          ))}
        </div>
        {hasOther && otherKey && <input className="other-input" value={form[otherKey]} onChange={(event) => onChange(otherKey, event.target.value)} placeholder="請補充說明" />}
        {error && <p className="field-error" role="alert">{error}</p>}
      </fieldset>
    </section>
  );
}

export function App() {
  const [form, setForm] = useState(initialForm);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState({});
  const update = (key, value) => setForm((previous) => ({ ...previous, [key]: value }));
  const submit = (event) => {
    event.preventDefault();
    setSubmitError('');
    const nextErrors = {};
    const requiredFields = ['name', 'phone', 'line', 'birthday', 'gender', 'work', 'sleep', 'condition', 'symptoms', 'injuries', 'injuryNote', 'exerciseFrequency', 'activities', 'coaching', 'barriers', 'focus', 'frequency', 'time'];
    if (form.gender === '女') requiredFields.push('pregnancy');
    if (form.work === '其他') requiredFields.push('workOther');
    if (form.condition.startsWith('是')) requiredFields.push('conditionNote');
    if (form.injuries.some((item) => item.includes('其他關節'))) requiredFields.push('injuryNote');
    if (form.barriers.includes('其他')) requiredFields.push('barrierOther');
    if (form.time === '其他') requiredFields.push('timeOther');
    requiredFields.forEach((key) => {
      const value = form[key];
      if (!value || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) nextErrors[key] = '此欄位為必填，請完成後再送出。';
    });
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      setSubmitError('請完成所有必填欄位。');
      requestAnimationFrame(() => document.querySelector(`[data-field="${Object.keys(nextErrors)[0]}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
      return;
    }
    setErrors({});
    if (!GOOGLE_APPS_SCRIPT_URL) {
      setSubmitError('表單收件功能尚未完成設定，請稍後再試。');
      return;
    }
    const payload = JSON.stringify(form);
    const queued = navigator.sendBeacon?.(GOOGLE_APPS_SCRIPT_URL, new Blob([payload], { type: 'text/plain;charset=UTF-8' }));
    if (!queued) fetch(GOOGLE_APPS_SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: payload, keepalive: true }).catch(() => {});
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (submitted) return <main className="page"><div className="success-card"><p className="eyebrow">預約資料已送出</p><h1>謝謝你，{form.name || '學員'}！</h1><p>我會透過你提供的 LINE ID 與你確認體驗課時間。期待一起找回舒服、穩定的動作節奏。</p><button type="button" onClick={() => setSubmitted(false)}>返回表單</button></div></main>;

  return <main className="page">
    <header className="hero">
      <div className="hero-mark" aria-hidden="true"></div>
      <p className="eyebrow">PHOEBE PERSONAL TRAINING</p>
      <h1>一對一教學體驗課<br /><em>體驗價｜90 分鐘・NT$1,500</em></h1>
      <div className="coach-intro">
        <p>你好，我是 Phoebe。</p>
        <p>過去我曾受肩部沾黏與膝蓋積水困擾，直到透過 <strong>ATG 系統</strong> 重建關節能力，徹底擺脫疼痛限制。現代人因久坐常見髖部緊繃、背部無力，直接重訓極易代償受傷。我結合 <strong>ATG 活動度訓練</strong> 與 <strong>KAT 進階阻力力學</strong>，從呼吸評估、關節中心化到本體感覺引導，先幫你找回無痛的關節空間，再透過槓鈴、啞鈴與壺鈴扎實建構力量。</p>
      </div>
      <ul className="bio-list">
        <li><strong>專業認證</strong><span>NSCA-CPT 私人教練認證、CPR+AED 急救員</span></li>
        <li><strong>比賽經歷</strong><span>515 個人三鐵、半程馬拉松、Hyrox 單人、Hyrox 女雙 Pro</span></li>
        <li><strong>進修研習</strong><span>KAT training 進階阻力訓練</span></li>
      </ul>
      <p className="hero-copy">訓練不該是生活的負擔，而是讓生活更輕鬆的工具。歡迎預約體驗課，一起找出最適合你的動作模式！</p>
    </header>

    <form onSubmit={submit} noValidate>
      <section className="intro-card"><p className="section-kicker">開始前的小問卷</p><h2>讓第一次見面，更貼近你的需要。</h2><p>以下資料僅用於安排體驗課與調整訓練內容。標示 <span className="required">＊</span> 的欄位為必填。</p></section>
      <div className="form-grid">
        <section className={`form-section ${errors.name ? 'has-error' : ''}`} data-field="name"><label>姓名<span className="required">＊</span><input value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="請輸入姓名" /></label>{errors.name && <p className="field-error">{errors.name}</p>}</section>
        <section className={`form-section ${errors.phone ? 'has-error' : ''}`} data-field="phone"><label>聯絡電話<span className="required">＊</span><input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="例如：0912 345 678" /></label>{errors.phone && <p className="field-error">{errors.phone}</p>}</section>
        <section className={`form-section ${errors.line ? 'has-error' : ''}`} data-field="line"><label>LINE ID<span className="required">＊</span><small>方便後續傳送預約確認與提醒</small><input value={form.line} onChange={(e) => update('line', e.target.value)} placeholder="請輸入 LINE ID" /></label>{errors.line && <p className="field-error">{errors.line}</p>}</section>
        <section className={`form-section ${errors.birthday ? 'has-error' : ''}`} data-field="birthday"><label>生日<span className="required">＊</span><input type="date" value={form.birthday} onChange={(e) => update('birthday', e.target.value)} /></label>{errors.birthday && <p className="field-error">{errors.birthday}</p>}</section>
      </div>
      <ChoiceGroup name="gender" label="性別" options={choices.gender} value={form.gender} onChange={update} error={errors.gender} />
      <ChoiceGroup name="work" label="日常工作型態" options={choices.work} value={form.work} onChange={update} otherKey="workOther" form={form} error={errors.work || errors.workOther} />
      <ChoiceGroup name="sleep" label="平均每日睡眠時間" options={choices.sleep} value={form.sleep} onChange={update} error={errors.sleep} />

      <div className="section-heading"><p className="section-kicker">健康與運動背景</p><h2>先了解身體現在的狀態</h2></div>
      <ChoiceGroup name="condition" label="是否曾有醫師診斷患有心血管疾病、高血壓、氣喘或其他慢性疾病？" options={choices.condition} value={form.condition} onChange={update} error={errors.condition} />
      {form.condition.startsWith('是') && <section className={`form-section ${errors.conditionNote ? 'has-error' : ''}`} data-field="conditionNote"><label>慢性疾病說明<span className="required">＊</span><textarea value={form.conditionNote} onChange={(e) => update('conditionNote', e.target.value)} placeholder="請簡述診斷、目前感受或需注意事項" /></label>{errors.conditionNote && <p className="field-error">{errors.conditionNote}</p>}</section>}
      <ChoiceGroup name="symptoms" label="運動中或日常靜止時，是否曾出現胸悶、胸痛、呼吸困難或頭暈眩暈？" options={choices.symptoms} value={form.symptoms} onChange={update} error={errors.symptoms} />
      <ChoiceGroup name="injuries" label="過去或目前是否有骨骼肌肉舊傷、關節問題或脊椎不適？" options={choices.injuries} value={form.injuries} onChange={update} multiple otherKey="injuryNote" form={form} error={errors.injuries} />
      <section className={`form-section ${errors.injuryNote ? 'has-error' : ''}`} data-field="injuryNote"><label>受傷時間、目前感受或限制<span className="required">＊</span><textarea value={form.injuryNote} onChange={(e) => update('injuryNote', e.target.value)} placeholder="若無，請填「無」" /></label>{errors.injuryNote && <p className="field-error">{errors.injuryNote}</p>}</section>
      {form.gender === '女' && <ChoiceGroup name="pregnancy" label="目前是否懷孕或產後半年內？（女性填寫）" options={choices.pregnancy} value={form.pregnancy} onChange={update} error={errors.pregnancy} />}
      <ChoiceGroup name="exerciseFrequency" label="目前每週平均運動頻率" options={choices.exerciseFrequency} value={form.exerciseFrequency} onChange={update} error={errors.exerciseFrequency} />
      <ChoiceGroup name="activities" label="平常最常進行的運動項目？（可複選）" options={choices.activities} value={form.activities} onChange={update} multiple error={errors.activities} />
      <ChoiceGroup name="coaching" label="過去是否曾購買或上過一對一私人教練課？" options={choices.coaching} value={form.coaching} onChange={update} error={errors.coaching} />
      <ChoiceGroup name="barriers" label="過去在運動或維持體態上，遇到的最大困難是什麼？" options={choices.barriers} value={form.barriers} onChange={update} multiple otherKey="barrierOther" form={form} error={errors.barriers || errors.barrierOther} />

      <div className="section-heading"><p className="section-kicker">體驗課期待</p><h2>一起安排最適合你的開始</h2></div>
      <ChoiceGroup name="focus" label="體驗課最希望教練重點協助您的是？" options={choices.focus} value={form.focus} onChange={update} error={errors.focus} />
      <ChoiceGroup name="frequency" label="若體驗後感覺符合需求，未來每週預計可配合的上課頻率？" options={choices.frequency} value={form.frequency} onChange={update} error={errors.frequency} />
      <ChoiceGroup name="time" label="方便安排上課的常見時段" options={choices.time} value={form.time} onChange={update} otherKey="timeOther" form={form} error={errors.time || errors.timeOther} />
      <section className="form-section" data-field="message"><label>想對教練說的話<small>選填</small><textarea value={form.message} onChange={(e) => update('message', e.target.value)} placeholder="有任何期待、疑問或想先讓教練知道的事，都可以寫在這裡。" /></label></section>
      <div className="submit-area"><p>送出後，Phoebe 將以 LINE 聯繫您確認課程。</p>{submitError && <p className="submit-error" role="alert">{submitError}</p>}<button type="submit">送出體驗課申請</button></div>
    </form>
  </main>;
}

