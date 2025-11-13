// script.js - OCR auto-distribute numeric codes into units list (direct distribution + managers)
const $ = id => document.getElementById(id);
const unitsList = $('unitsList');
const fileInput = $('fileInput');
const ocrMode = $('ocrMode');
const resultArea = $('resultArea');
const toast = $('toast');
const managersList = document.getElementById('managersList');
const addManagerBtn = document.getElementById('addManager');

let managers = [];

// toast
function showToast(msg, time=2000){
  toast.innerText = msg; toast.style.display = 'block';
  setTimeout(()=> toast.style.display='none', time);
}

// managers handling
function renderManagers(){
  managersList.innerHTML = '';
  managers.forEach((m, idx)=>{
    const div = document.createElement('div'); div.className='pill';
    div.innerHTML = `${m.name || ''} ${m.code? '| '+m.code : ''} <button data-i="${idx}" class="btn muted del-manager">حذف</button>`;
    managersList.appendChild(div);
  });
}
addManagerBtn.addEventListener('click', ()=>{
  const name = document.getElementById('managerName').value.trim();
  const code = document.getElementById('managerCode').value.trim();
  if(!name && !code){ showToast('أدخل اسم أو كود المسؤول'); return; }
  managers.push({name, code});
  document.getElementById('managerName').value=''; document.getElementById('managerCode').value='';
  renderManagers(); updateResult(); showToast('تم إضافة مسؤول الفترة');
});
managersList.addEventListener('click', (e)=>{
  if(e.target.classList.contains('del-manager')){
    const i = parseInt(e.target.dataset.i,10);
    if(!isNaN(i)){ managers.splice(i,1); renderManagers(); updateResult(); showToast('تم الحذف'); }
  }
});

// units
function createUnit(data={code:'',status:'',loc:'',dist:''}){
  const row = document.createElement('div'); row.className='unit-row';
  row.innerHTML = `
    <div class="col"><input class="code-input" value="${data.code||''}" placeholder="الكود"></div>
    <div class="col"><input class="status-input" value="${data.status||''}" placeholder="الحالة"></div>
    <div class="col"><input class="loc-input" value="${data.loc||''}" placeholder="الموقع"></div>
    <div class="col"><input class="dist-input" value="${data.dist||''}" placeholder="توزيع الحالة"></div>
    <div class="unit-actions">
      <button class="btn edit-btn">تعديل</button>
      <button class="btn add-partner-btn">شريك</button>
      <button class="btn delete-btn">حذف</button>
    </div>
  `;
  // actions
  row.querySelector('.delete-btn').addEventListener('click', ()=>{ row.remove(); updateResult(); showToast('تم الحذف'); });
  row.querySelector('.add-partner-btn').addEventListener('click', ()=>{
    const p = prompt('أدخل كود الشريك'); if(p){ const codeInput = row.querySelector('.code-input'); codeInput.value = codeInput.value ? (codeInput.value + ' + ' + p) : p; updateResult(); showToast('تم إضافة شريك'); }
  });
  row.querySelector('.edit-btn').addEventListener('click', ()=> row.querySelector('.code-input').focus());
  row.querySelectorAll('input').forEach(inp => inp.addEventListener('input', ()=> updateResult()));
  unitsList.appendChild(row);
  return row;
}

// ensure one row initially
createUnit();

$('addUnit').addEventListener('click', ()=>{ createUnit(); updateResult(); });

// OCR handling (paste + file input)
document.addEventListener('paste', async (e)=>{
  if(!e.clipboardData) return;
  for(const item of e.clipboardData.items){
    if(item.type.indexOf('image') !== -1){
      const file = item.getAsFile(); if(file) await handleFile(file);
    }
  }
});
fileInput.addEventListener('change', async (e)=>{ const f = e.target.files[0]; if(!f) return; await handleFile(f); fileInput.value=''; });

async function handleFile(file){
  showToast('جاري تحليل الصورة — انتظر قليلاً...', 3000);
  try{
    const worker = Tesseract.createWorker();
    await worker.load(); await worker.loadLanguage('ara+eng'); await worker.initialize('ara+eng');
    await worker.setParameters({ tessedit_pageseg_mode: '6', tessedit_char_whitelist: '0123456789' });
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    const numbers = (text.match(/\d{2,6}/g) || []).map(s=>s.trim());
    if(numbers.length === 0){ showToast('لم يتم العثور على أكواد رقمية في الصورة', 3000); return; }
    const mode = ocrMode.value;
    if(mode === 'replace'){ unitsList.innerHTML = ''; numbers.forEach(n=> createUnit({code:n})); }
    else { numbers.forEach(n=> createUnit({code:n})); }
    updateResult(); showToast(`تم استخراج ${numbers.length} كود وتوزيعها`, 2500);
  }catch(err){
    console.error(err); showToast('حصل خطأ أثناء تحليل الصورة', 3000);
  }
}

// build final result text
function updateResult(){
  const lines = [];
  const opsName = $('opsName').value || '';
  const opsCode = $('opsCode').value || '';
  const deputy = $('opsDeputy').value || '';
  const deputyCode = $('opsDeputyCode').value || '';
  lines.push('استلام العمليات');
  lines.push(`اسم العمليات : ${opsName}${opsCode? ' | '+opsCode : ''}`);
  lines.push(`نائب مركز العمليات : ${deputy}${deputyCode? ' | '+deputyCode : ''}`);
  lines.push('');
  lines.push('القيادات'); lines.push('-');
  lines.push(''); lines.push('الضباط'); lines.push('-');
  lines.push(''); lines.push('مسؤول فترة'); 
  if(managers.length) lines.push(managers.map(m=> (m.name? m.name+' ':'') + (m.code? '| '+m.code:'')).join(' , ')); else lines.push('-');
  lines.push(''); lines.push('ضباط الصف'); lines.push('-');
  lines.push(''); lines.push('توزيع الوحدات');
  const rows = unitsList.querySelectorAll('.unit-row');
  if(rows.length === 0) lines.push('-'); else {
    rows.forEach(r=>{
      const code = r.querySelector('.code-input').value.trim();
      const loc = r.querySelector('.loc-input').value.trim();
      const status = r.querySelector('.status-input').value.trim();
      const dist = r.querySelector('.dist-input').value.trim();
      if(code) lines.push(`${code}${loc? ' | '+loc : ''}${status? ' | '+status : ''}${dist? ' | '+dist : ''}`);
    });
  }
  lines.push(''); lines.push('وحدات سبيد يونت'); lines.push('-'); lines.push(''); lines.push('وحدات دباب'); lines.push('-'); lines.push(''); lines.push('وحدات الهلي'); lines.push('-');
  lines.push(''); lines.push('وقت الاستلام: —'); lines.push('وقت التسليم: —'); lines.push(''); lines.push('تم التسليم إلى :');
  resultArea.innerText = lines.join('\n');
}

// copy result
$('copyResult').addEventListener('click', ()=>{ navigator.clipboard.writeText(resultArea.innerText).then(()=> showToast('تم نسخ النتيجة',1500)).catch(()=> showToast('فشل النسخ',1500)); });

// initial render
renderManagers();
updateResult();
