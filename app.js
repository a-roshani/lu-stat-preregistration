
const cfg = window.APP_CONFIG || {};
const configured = cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY && !cfg.SUPABASE_URL.includes('PASTE_') && !cfg.SUPABASE_PUBLISHABLE_KEY.includes('PASTE_');
const client = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY) : null;
let allCourses = [];
let editMode = false;

const $ = (id) => document.getElementById(id);
const els = {
  dbStatus:$('dbStatus'), newModeBtn:$('newModeBtn'), editModeBtn:$('editModeBtn'), editLoader:$('editLoader'),
  lookupStudentNumber:$('lookupStudentNumber'), lookupPin:$('lookupPin'), loadBtn:$('loadBtn'), lookupMessage:$('lookupMessage'),
  form:$('registrationForm'), firstName:$('firstName'), lastName:$('lastName'), studentNumber:$('studentNumber'), entryYear:$('entryYear'),
  courseSearch:$('courseSearch'), courseList:$('courseList'), selectedCount:$('selectedCount'), editPin:$('editPin'), editPinConfirm:$('editPinConfirm'),
  submitBtn:$('submitBtn'), resetBtn:$('resetBtn'), formMessage:$('formMessage')
};

function msg(el, text='', kind='') { el.textContent=text; el.className='message'+(text?' show':'')+(kind?' '+kind:''); }
function normalizeDigits(s=''){return String(s).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d));}
function faLevel(level){return level==='Graduate'?'کارشناسی ارشد':level==='PhD'?'دکتری':'کارشناسی';}
function isRecommended(c){const e=els.entryYear.value; return e && (c.allowed_entries||[]).includes(e);}
function selectedIds(){return [...document.querySelectorAll('.course-check:checked')].map(x=>x.value);}
function updateCount(){els.selectedCount.textContent=`${selectedIds().length.toLocaleString('fa-IR')} درس انتخاب شده`;}
function renderCourses(){
  const q=els.courseSearch.value.trim().toLowerCase();
  const sorted=[...allCourses].sort((a,b)=>Number(isRecommended(b))-Number(isRecommended(a)) || a.name_fa.localeCompare(b.name_fa,'fa'));
  els.courseList.innerHTML='';
  for(const c of sorted){
    const hay=`${c.name_fa} ${c.instructor} ${c.id}`.toLowerCase(); if(q && !hay.includes(q)) continue;
    const lab=document.createElement('label'); lab.className='course-card'+(isRecommended(c)?' recommended':'');
    lab.innerHTML=`<input class="course-check" type="checkbox" value="${c.id}"><div class="course-main"><div class="course-name">${c.name_fa}</div><div class="course-meta"><span class="badge">${faLevel(c.level)}</span><span class="badge">${c.credits} واحد</span> ${c.instructor} · ورودی اصلی ${c.main_entry}</div></div>`;
    els.courseList.appendChild(lab);
  }
  document.querySelectorAll('.course-check').forEach(x=>x.addEventListener('change',updateCount)); updateCount();
}
async function loadCourses(){
  try{
    if(client){
      const {data,error}=await client.from('courses').select('*').eq('active',true).order('name_fa');
      if(error) throw error; allCourses=data||[];
    } else {
      const r=await fetch('courses_v42.json'); allCourses=await r.json();
    }
    renderCourses();
  }catch(e){msg(els.formMessage,'خطا در دریافت فهرست دروس: '+e.message,'error');}
}
function setMode(mode){editMode=mode==='edit'; els.newModeBtn.classList.toggle('active',!editMode); els.editModeBtn.classList.toggle('active',editMode); els.editLoader.classList.toggle('hidden',!editMode); els.submitBtn.textContent=editMode?'ثبت تغییرات پیش‌ثبت‌نام':'ثبت پیش‌ثبت‌نام'; msg(els.formMessage);}
function clearForm(){els.form.reset(); document.querySelectorAll('.course-check').forEach(x=>x.checked=false); updateCount(); msg(els.formMessage); renderCourses();}
async function loadExisting(){
  if(!client) return msg(els.lookupMessage,'ابتدا اتصال Supabase را در config.js تنظیم کنید.','error');
  const student=normalizeDigits(els.lookupStudentNumber.value.trim()), pin=normalizeDigits(els.lookupPin.value.trim());
  if(!student||!pin) return msg(els.lookupMessage,'شماره دانشجویی و کد ویرایش را وارد کنید.','error');
  els.loadBtn.disabled=true; msg(els.lookupMessage,'در حال بازیابی…');
  const {data,error}=await client.rpc('load_registration',{p_student_number:student,p_edit_pin:pin}); els.loadBtn.disabled=false;
  if(error || !data || !data.ok) return msg(els.lookupMessage,'اطلاعات پیدا نشد یا کد ویرایش صحیح نیست.','error');
  const r=data.registration; els.firstName.value=r.first_name; els.lastName.value=r.last_name; els.studentNumber.value=r.student_number; els.entryYear.value=r.entry_year; els.editPin.value=pin; els.editPinConfirm.value=pin; renderCourses();
  const wanted=new Set(data.course_ids||[]); document.querySelectorAll('.course-check').forEach(x=>x.checked=wanted.has(x.value)); updateCount(); msg(els.lookupMessage,'اطلاعات بازیابی شد. می‌توانید آن را اصلاح و دوباره ثبت کنید.','ok');
  window.scrollTo({top:els.form.offsetTop-12,behavior:'smooth'});
}
async function submitRegistration(ev){
  ev.preventDefault(); if(!client) return msg(els.formMessage,'اتصال پایگاه داده هنوز تنظیم نشده است. مراحل README را انجام دهید.','error');
  const pin=normalizeDigits(els.editPin.value.trim()), pin2=normalizeDigits(els.editPinConfirm.value.trim()), student=normalizeDigits(els.studentNumber.value.trim());
  if(pin!==pin2) return msg(els.formMessage,'کد ویرایش و تکرار آن یکسان نیست.','error');
  if(!/^\d{4,8}$/.test(pin)) return msg(els.formMessage,'کد ویرایش باید ۴ تا ۸ رقم باشد.','error');
  const courses=selectedIds(); if(!courses.length) return msg(els.formMessage,'حداقل یک درس را انتخاب کنید.','error');
  els.submitBtn.disabled=true; els.submitBtn.textContent='در حال ثبت…'; msg(els.formMessage);
  const {data,error}=await client.rpc('save_registration',{p_student_number:student,p_first_name:els.firstName.value.trim(),p_last_name:els.lastName.value.trim(),p_entry_year:els.entryYear.value,p_course_ids:courses,p_edit_pin:pin});
  els.submitBtn.disabled=false; els.submitBtn.textContent=editMode?'ثبت تغییرات پیش‌ثبت‌نام':'ثبت پیش‌ثبت‌نام';
  if(error || !data || !data.ok) return msg(els.formMessage,(data&&data.message)||error?.message||'ثبت اطلاعات انجام نشد.','error');
  msg(els.formMessage,`اطلاعات شما با موفقیت ثبت شد.\nزمان ثبت: ${new Date().toLocaleString('fa-IR')}\nبرای ویرایش بعدی، از بخش «ویرایش پیش‌ثبت‌نام قبلی» وارد شوید و شماره دانشجویی و کد ویرایش خود را وارد کنید.\nکد ویرایش خود را نزد خود نگه دارید.`,'ok'); editMode=true; setMode('edit'); window.scrollTo({top:els.formMessage.offsetTop-120,behavior:'smooth'});
}

els.newModeBtn.addEventListener('click',()=>{setMode('new');clearForm();}); els.editModeBtn.addEventListener('click',()=>setMode('edit')); els.loadBtn.addEventListener('click',loadExisting); els.entryYear.addEventListener('change',renderCourses); els.courseSearch.addEventListener('input',renderCourses); els.resetBtn.addEventListener('click',clearForm); els.form.addEventListener('submit',submitRegistration);
if(configured){els.dbStatus.textContent='پایگاه داده متصل';els.dbStatus.classList.add('ok');}else{els.dbStatus.textContent='نیازمند تنظیم اتصال';els.dbStatus.classList.add('bad');}
loadCourses();
