// script.js - كامل: OCR يوزع الأرقام على عمود الكود + كل الوظائف المطلوبة
const $ = id => document.getElementById(id);
const unitsList = $('unitsList');
const fileInput = $('fileInput');
const ocrMode = $('ocrMode');
const previewWrap = $('previewWrap');
const previewImg = $('previewImg');
const progressBar = $('progressBar');
const resultArea = $('resultArea');
const toast = $('toast');
const startTimeBtn = $('startTime');
const endTimeBtn = $('endTime');

const leadersPills = $('leadersPills'), officersPills = $('officersPills'), managersPills = $('managersPills'), ncosPills = $('ncosPills');

let modalIndex = null;
let managers = [];

// helper toast
function showToast(msg, t=2000){ toast.innerText=msg; toast.style.display='block'; setTimeout(()=>toast.style.display='none', t); }

// ----- managers / pills -----
function renderPills(container, arr, type){
  container.innerHTML = '';
  arr.forEach((it, i)=>{
    const d = document.createElement('div'); d.className='pill';
    d.innerHTML = `${type==='manager' ? (it.name? it.name+' ' : '') + (it.code? '| '+it.code : '') : it} <button class="btn muted del-pill" data-type="${type}" data-i="${i}">حذف</button>`;
    container.appendChild(d);
  });
}
document.getElementById('addLeader').addEventListener('click', ()=>{
  const v = $('leaderInput').value.trim(); if(!v) return showToast('أدخل كود القيادة'); leadersPillsArr = leadersPillsArr || []; leadersPillsArr.push(v); $('leaderInput').value=''; renderPills(leadersPills, leadersPillsArr, 'leader'); showToast('تم إضافة قيادة');
});
document.getElementById('addOfficer').addEventListener('click', ()=>{
  const v = $('officerInput').value.trim(); if(!v) return showToast('أدخل كود الضابط'); officersPillsArr = officersPillsArr || []; officersPillsArr.push(v); $('officerInput').value=''; renderPills(officersPills, officersPillsArr, 'officer'); showToast('تم إضافة ضابط');
});
$('addManager').addEventListener('click', ()=>{
  const n=$('managerName').value.trim(), c=$('managerCode').value.trim();
  if(!n && !c) return showToast('أدخل اسم أو كود المسؤول'); managers.push({name:n,code:c}); $('managerName').value=''; $('managerCode').value=''; renderPills(managersPills, managers, 'manager'); showToast('تم إضافة مسؤول الفترة'); updateResult();
});
$('addNco').addEventListener('click', ()=>{
  const n=$('ncoName').value.trim(), c=$('ncoCode').value.trim(); if(!n && !c) return showToast('أدخل بيانات'); ncosArr = ncosArr || []; ncosArr.push({name:n,code:c}); $('ncoName').value=''; $('ncoCode').value=''; renderPills(ncosPills, ncosArr, 'nco'); showToast('تم إضافة ضابط صف');
});
document.addEventListener('click', (e)=>{
  if(e.target.classList.contains('del-pill')){
    const idx = parseInt(e.target.dataset.i,10), type = e.target.dataset.type;
    if(type==='leader'){ leadersPillsArr.splice(idx,1); renderPills(leadersPills, leadersPillsArr,'leader'); }
    if(type==='officer'){ officersPillsArr.splice(idx,1); renderPills(officersPills, officersPillsArr,'officer'); }
    if(type==='manager'){ managers.splice(idx,1); renderPills(managersPills, managers,'manager'); updateResult(); }
    if(type==='nco'){ ncosArr.splice(idx,1); renderPills(ncosPills, ncosArr,'nco'); }
    showToast('تم الحذف');
  }
});

// ----- unit row creator -----
function createUnit(data={code:'', status:'', loc:'', dist:''}){
  const row = document.createElement('div'); row.className='unit-row';
  row.innerHTML = `
    <div class="col"><input class="code-input" value="${data.code||''}" placeholder="الكود"></div>
    <div class="col"><input class="status-input" value="${data.status||''}" placeholder="الحالة"></div>
    <div class="col"><input class="loc-input" value="${data.loc||''}" placeholder="الموقع"></div>
    <div class="col"><input class="dist-input" value="${data.dist||''}" placeholder="توزيع الوحدات"></div>
    <div class="unit-actions">
      <button class="btn edit-btn">تعديل</button>
      <button class="btn add-partner-btn">إضافة شريك</button>
      <button class="btn delete-btn">حذف</button>
    </div>
  `;
  // actions
  row.querySelector('.delete-btn').addEventListener('click', ()=>{ row.remove(); updateResult(); showToast('تم الحذف'); });
  row.querySelector('.add-partner-btn').addEventListener('click', ()=>{
    const p = prompt('أدخل كود الشريك'); if(p){ const codeInput = row.querySelector('.code-input'); codeInput.value = codeInput.value ? (codeInput.value + ' + ' + p) : p; updateResult(); showToast('تم إضافة شريك'); }
  });
  row.querySelector('.edit-btn').addEventListener('click', ()=>{
    // open modal for edit
    openModalForRow(row);
  });
  row.querySelectorAll('input').forEach(inp=> inp.addEventListener('input', ()=> updateResult()));
  unitsList.appendChild(row);
  return row;
}

// ensure initial row
createUnit();

// add unit button
$('addUnit').addEventListener('click', ()=>{ createUnit(); updateResult(); });

// clear units
$('clearUnits').addEventListener('click', ()=>{ if(confirm('مسح كل الوحدات؟')){ unitsList.innerHTML=''; updateResult(); showToast('تم المسح'); }});

// modal behavior
function openModalForRow(row){
  modalIndex = row;
  $('modal').setAttribute('aria-hidden','false');
  const m_code = $('m_code'), m_status = $('m_status'), m_loc = $('m_loc'), m_dist = $('m_dist');
  m_code.value = row.querySelector('.code-input').value;
  m_status.value = row.querySelector('.status-input').value;
  m_loc.value = row.querySelector('.loc-input').value;
  m_dist.value = row.querySelector('.dist-input').value;
}
$('modalClose').addEventListener('click', ()=> closeModal());
$('modalCancel').addEventListener('click', ()=> closeModal());
$('modalSave').addEventListener('click', ()=> {
  if(!modalIndex) return closeModal();
  modalIndex.querySelector('.code-input').value = $('m_code').value.trim();
  modalIndex.querySelector('.status-input').value = $('m_status').value.trim();
  modalIndex.querySelector('.loc-input').value = $('m_loc').value.trim();
  modalIndex.querySelector('.dist-input').value = $('m_dist').value.trim();
  updateResult(); closeModal(); showToast('تم حفظ التعديلات');
});
function closeModal(){ $('modal').setAttribute('aria-hidden','true'); modalIndex = null; }

// OCR: paste + file
document.addEventListener('paste', async (e)=>{
  if(!e.clipboardData) return;
  for(const it of e.clipboardData.items){
    if(it.type.indexOf('image') !== -1){
      const f = it.getAsFile(); if(f) await handleFile(f);
    }
  }
});
fileInput.addEventListener('change', async (e)=>{ const f = e.target.files[0]; if(!f) return; await handleFile(f); fileInput.value=''; });

// progress helper
function setProgress(p){ progressBar.style.width = (Math.round(p*100)) + '%'; previewWrap.style.display='block'; }

// OCR worker and assignment
async function handleFile(file){
  try{
    previewImg.src = URL.createObjectURL(file);
    previewWrap.style.display = 'block';
    setProgress(0.02);
    const worker = Tesseract.createWorker({
      logger: m => { if(m && m.progress) setProgress(m.progress); }
    });
    await worker.load(); await worker.loadLanguage('ara+eng'); await worker.initialize('ara+eng');
    await worker.setParameters({ tessedit_pageseg_mode: '6', tessedit_char_whitelist: '0123456789' });
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    setProgress(1);
    const numbers = (text.match(/\d{2,6}/g) || []).map(s=>s.trim());
    if(numbers.length === 0){ showToast('لم يتم العثور على أكواد رقمية في الصورة', 2500); return; }
    const mode = ocrMode.value;
    if(mode === 'replace'){ unitsList.innerHTML = ''; numbers.forEach(n => createUnit({code:n})); }
    else { numbers.forEach(n => createUnit({code:n})); }
    updateResult(); showToast(`تم استخراج ${numbers.length} كود وتوزيعها`, 2500);
  }catch(err){
    console.error(err); showToast('حصل خطأ أثناء تحليل الصورة', 3000);
  } finally { setTimeout(()=>{ progressBar.style.width = '0%'; }, 500); }
}

// result builder
function updateResult(){
  const lines = [];
  const opsName = $('opsName').value.trim() || '';
  const opsCode = $('opsCode').value.trim() || '';
  const deputy = $('opsDeputy').value.trim() || '';
  const deputyCode = $('opsDeputyCode').value.trim() || '';
  lines.push('استلام العمليات');
  lines.push(`اسم العمليات : ${opsName}${opsCode? ' | '+opsCode : ''}`);
  lines.push(`نائب مركز العمليات : ${deputy}${deputyCode? ' | '+deputyCode : ''}`);
  lines.push('');
  lines.push('القيادات'); lines.push((window.leadersPillsArr && leadersPillsArr.length)? leadersPillsArr.join(' - ') : '-');
  lines.push('');
  lines.push('الضباط'); lines.push((window.officersPillsArr && officersPillsArr.length)? officersPillsArr.join(' - '): '-');
  lines.push('');
  lines.push('مسؤول فترة'); lines.push(managers.length? managers.map(m=> (m.name? m.name+' ':'') + (m.code? m.code:'')).join(' , ') : '-');
  lines.push('');
  lines.push('ضباط الصف'); lines.push((window.ncosArr && ncosArr.length)? ncosArr.map(n=> (n.name? n.name+' ':'') + (n.code? n.code:'')).join(' , ') : '-');
  lines.push('');
  lines.push('توزيع الوحدات');
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
  lines.push('');
  lines.push('وحدات سبيد يونت'); lines.push('-');
  lines.push(''); lines.push('وحدات دباب'); lines.push('-');
  lines.push(''); lines.push('وحدات الهلي'); lines.push('-');
  lines.push(''); lines.push('وقت الاستلام: —'); lines.push('وقت التسليم: —'); lines.push(''); lines.push('تم التسليم إلى :');
  resultArea.innerText = lines.join('\n');
}

// copy result
$('copyResult').addEventListener('click', ()=>{ navigator.clipboard.writeText(resultArea.innerText).then(()=> showToast('تم نسخ النتيجة',1500)).catch(()=> showToast('فشل النسخ',1500)); });

// time record
startTimeBtn.addEventListener('click', ()=>{ const t = new Date().toLocaleTimeString(); startTimeBtn.innerText = 'بداية: '+t; updateResult(); showToast('تم تسجيل وقت الاستلام'); });
endTimeBtn.addEventListener('click', ()=>{ const t = new Date().toLocaleTimeString(); endTimeBtn.innerText = 'انتهاء: '+t; updateResult(); showToast('تم تسجيل وقت التسليم'); });

// enter from intro
$('enterBtn').addEventListener('click', ()=>{ $('intro').style.display='none'; $('topbar').style.display='block'; $('main').style.display='block'; setTimeout(()=> $('main').style.opacity=1,20); });

// initial render
updateResult();
