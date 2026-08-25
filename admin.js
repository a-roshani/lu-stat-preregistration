const cfg = window.APP_CONFIG || {};
const configured = cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY && !cfg.SUPABASE_URL.includes('PASTE_') && !cfg.SUPABASE_PUBLISHABLE_KEY.includes('PASTE_');
const client = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY) : null;
const $ = (id) => document.getElementById(id);
const ENTRY_OPTIONS = ['1401','1402','1403','1404','1405','MSc_1404','MSc_1405','PhD_1404','PhD_1405'];
const els = {
  loginCard:$('loginCard'), adminApp:$('adminApp'), adminEmail:$('adminEmail'), adminPassword:$('adminPassword'), loginBtn:$('loginBtn'), loginMessage:$('loginMessage'),
  adminUser:$('adminUser'), logoutBtn:$('logoutBtn'), statStudents:$('statStudents'), statSelections:$('statSelections'), statCourses:$('statCourses'), statOverlaps:$('statOverlaps'),
  studentsTableBody:$('studentsTableBody'), demandTableBody:$('demandTableBody'), overlapTableBody:$('overlapTableBody'), studentsCountLabel:$('studentsCountLabel'), studentSearch:$('studentSearch'), refreshBtn:$('refreshBtn'),
  studentEditor:$('studentEditor'), editorStudentId:$('editorStudentId'), editFirstName:$('editFirstName'), editLastName:$('editLastName'), editStudentNumber:$('editStudentNumber'), editEntryYear:$('editEntryYear'),
  adminCourseList:$('adminCourseList'), newPin:$('newPin'), saveStudentBtn:$('saveStudentBtn'), cancelEditBtn:$('cancelEditBtn'), editorMessage:$('editorMessage'),
  coursesTableBody:$('coursesTableBody'), courseAdminSearch:$('courseAdminSearch'), newCourseBtn:$('newCourseBtn'), courseEditor:$('courseEditor'), courseEditorTitle:$('courseEditorTitle'), courseEditorId:$('courseEditorId'),
  courseName:$('courseName'), courseInstructor:$('courseInstructor'), courseCredits:$('courseCredits'), courseLevel:$('courseLevel'), courseMainEntry:$('courseMainEntry'), courseAllowedEntries:$('courseAllowedEntries'),
  courseOutOfChart:$('courseOutOfChart'), courseActive:$('courseActive'), saveCourseBtn:$('saveCourseBtn'), cancelCourseBtn:$('cancelCourseBtn'), courseEditorMessage:$('courseEditorMessage'),
  downloadSchedulerBtn:$('downloadSchedulerBtn'), downloadBackupBtn:$('downloadBackupBtn'), exportMessage:$('exportMessage'), exportStudents:$('exportStudents'), exportSelections:$('exportSelections'), exportOverlaps:$('exportOverlaps'), exportTimestamp:$('exportTimestamp')
};
let state = {students:[], demand:[], overlap:[], courses:[], editingId:null, editingCourseId:null};

function msg(el,text='',kind=''){el.textContent=text;el.className='message'+(text?' show':'')+(kind?' '+kind:'');}
function fmtDate(v){if(!v)return '—';try{return new Date(v).toLocaleString('fa-IR');}catch{return v;}}
function faLevel(level){return level==='Graduate'?'کارشناسی ارشد':level==='PhD'?'دکتری':'کارشناسی';}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function selectedAdminCourses(){return [...document.querySelectorAll('.admin-course-check:checked')].map(x=>x.value);}
function selectedAllowedEntries(){return [...document.querySelectorAll('.allowed-entry-check:checked')].map(x=>x.value);}
function demandCount(courseId){const d=state.demand.find(x=>x.course_id===courseId);return d?Number(d.student_count||0):0;}
function downloadJson(filename,payload){
  const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url),500);
}
function pairKey(a,b){return [String(a),String(b)].sort().join('|||');}
function buildDetailedOverlaps(){
  const courseById=new Map(state.courses.map(c=>[String(c.id),c]));
  const pairs=new Map();
  for(const student of state.students){
    const ids=[...new Set((student.course_ids||[]).map(String))].sort();
    for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++){
      const a=ids[i],b=ids[j],key=pairKey(a,b);
      if(!pairs.has(key)) pairs.set(key,{course_1_id:a,course_2_id:b,students:[]});
      pairs.get(key).students.push({
        student_number:String(student.student_number||''), first_name:String(student.first_name||''), last_name:String(student.last_name||''), entry_year:String(student.entry_year||'')
      });
    }
  }
  return [...pairs.values()].map(r=>{
    const c1=courseById.get(r.course_1_id)||{}, c2=courseById.get(r.course_2_id)||{};
    return {...r,course_1:c1.name_fa||r.course_1_id,course_2:c2.name_fa||r.course_2_id,common_students:r.students.length};
  }).sort((a,b)=>b.common_students-a.common_students || String(a.course_1).localeCompare(String(b.course_1),'fa'));
}
function buildSchedulerExport(){
  const generatedAt=new Date().toISOString();
  const overlaps=buildDetailedOverlaps();
  const students=state.students.map(s=>({
    student_number:String(s.student_number||''), first_name:String(s.first_name||''), last_name:String(s.last_name||''), entry_year:String(s.entry_year||''),
    course_ids:(s.course_ids||[]).map(String), course_names:(s.course_names||[]).map(String), updated_at:s.updated_at||null
  }));
  const courses=state.courses.map(c=>({
    id:String(c.id||''), name_fa:String(c.name_fa||''), instructor:String(c.instructor||''), credits:Number(c.credits||0), level:String(c.level||''),
    main_entry:String(c.main_entry||''), allowed_entries:(c.allowed_entries||[]).map(String), out_of_chart:!!c.out_of_chart, active:c.active!==false
  }));
  return {
    schema_version:'lu-stat-prereg-scheduler-v1', generated_at:generatedAt, source:'LU Statistics Preregistration v0.6',
    summary:{student_count:students.length,selection_count:students.reduce((n,s)=>n+s.course_ids.length,0),course_count:courses.length,active_course_count:courses.filter(c=>c.active).length,overlap_pair_count:overlaps.length},
    courses, students, overlaps
  };
}
function refreshExportSummary(){
  if(!els.exportStudents)return;
  const overlaps=buildDetailedOverlaps(), selections=state.students.reduce((n,s)=>n+(s.course_ids||[]).length,0);
  els.exportStudents.textContent=state.students.length.toLocaleString('fa-IR'); els.exportSelections.textContent=selections.toLocaleString('fa-IR'); els.exportOverlaps.textContent=overlaps.length.toLocaleString('fa-IR'); els.exportTimestamp.textContent=new Date().toLocaleString('fa-IR');
}
function exportSchedulerFile(){
  const payload=buildSchedulerExport();
  const stamp=new Date().toISOString().replace(/[:.]/g,'-');
  downloadJson(`preregistration_scheduler_${stamp}.json`,payload);
  msg(els.exportMessage,`فایل مخصوص برنامه‌ریز با ${payload.summary.student_count.toLocaleString('fa-IR')} دانشجو و ${payload.summary.overlap_pair_count.toLocaleString('fa-IR')} جفت‌درس ساخته شد. این فایل را در University Scheduler بارگذاری کن.`,'ok');
}
function exportFullBackup(){
  const payload={backup_version:'lu-stat-prereg-backup-v1',generated_at:new Date().toISOString(),courses:state.courses,students:state.students,course_demand:state.demand,course_overlap:buildDetailedOverlaps()};
  const stamp=new Date().toISOString().replace(/[:.]/g,'-'); downloadJson(`preregistration_full_backup_${stamp}.json`,payload);
  msg(els.exportMessage,'پشتیبان کامل داده‌های فعلی دانلود شد.','ok');
}

async function signIn(){
  if(!client) return msg(els.loginMessage,'اتصال Supabase در config.js تنظیم نشده است.','error');
  const email=els.adminEmail.value.trim(), password=els.adminPassword.value;
  if(!email||!password) return msg(els.loginMessage,'ایمیل و رمز عبور را وارد کنید.','error');
  els.loginBtn.disabled=true; msg(els.loginMessage,'در حال ورود…');
  const {data,error}=await client.auth.signInWithPassword({email,password});
  els.loginBtn.disabled=false;
  if(error) return msg(els.loginMessage,'ورود ناموفق بود: '+error.message,'error');
  await showAdmin(data.user);
}
async function signOut(){await client.auth.signOut(); location.reload();}
async function showAdmin(user){
  els.loginCard.classList.add('hidden'); els.adminApp.classList.remove('hidden'); els.logoutBtn.classList.remove('hidden');
  els.adminUser.textContent=user?.email||''; await loadDashboard();
}

async function loadDashboard(){
  msg(els.loginMessage);
  const {data,error}=await client.rpc('admin_dashboard');
  if(error){
    els.adminApp.classList.add('hidden'); els.loginCard.classList.remove('hidden'); els.logoutBtn.classList.add('hidden');
    return msg(els.loginMessage,'این حساب وارد شده است اما دسترسی مدیر برای آن تعریف نشده است. ابتدا SQL راه‌اندازی مدیر را اجرا کنید.','error');
  }
  state.courses=data?.courses||[];
  state.students=data?.students||[]; state.demand=data?.course_demand||[]; state.overlap=data?.course_overlap||[];
  const selections=state.students.reduce((a,s)=>a+(s.course_ids||[]).length,0);
  els.statStudents.textContent=state.students.length.toLocaleString('fa-IR');
  els.statSelections.textContent=selections.toLocaleString('fa-IR');
  els.statCourses.textContent=state.courses.filter(c=>c.active).length.toLocaleString('fa-IR');
  els.statOverlaps.textContent=state.overlap.length.toLocaleString('fa-IR');
  renderStudents(); renderCoursesAdmin(); renderDemand(); renderOverlap(); refreshExportSummary();
}

function renderStudents(){
  const q=els.studentSearch.value.trim().toLowerCase();
  const rows=state.students.filter(s=>`${s.first_name} ${s.last_name} ${s.student_number} ${s.entry_year} ${(s.course_names||[]).join(' ')}`.toLowerCase().includes(q));
  els.studentsCountLabel.textContent=`${rows.length.toLocaleString('fa-IR')} نفر`;
  els.studentsTableBody.innerHTML=rows.map(s=>`<tr>
    <td><strong>${esc(s.first_name)} ${esc(s.last_name)}</strong></td>
    <td>${esc(s.student_number)}</td><td>${esc(s.entry_year)}</td>
    <td><div class="student-courses"><strong>${(s.course_ids||[]).length.toLocaleString('fa-IR')} درس:</strong> ${esc((s.course_names||[]).join('، '))}</div></td>
    <td>${fmtDate(s.updated_at)}</td>
    <td><button class="mini-btn" data-edit-student="${s.id}">ویرایش</button> <button class="mini-btn danger" data-delete-student="${s.id}">حذف</button></td>
  </tr>`).join('') || '<tr><td colspan="6" class="muted">رکوردی پیدا نشد.</td></tr>';
  document.querySelectorAll('[data-edit-student]').forEach(b=>b.addEventListener('click',()=>openStudentEditor(b.dataset.editStudent)));
  document.querySelectorAll('[data-delete-student]').forEach(b=>b.addEventListener('click',()=>deleteStudent(b.dataset.deleteStudent)));
}
function renderDemand(){
  els.demandTableBody.innerHTML=state.demand.filter(r=>r.active!==false).map(r=>`<tr><td>${esc(r.name_fa)}</td><td>${esc(r.instructor)}</td><td>${faLevel(r.level)}</td><td><strong>${Number(r.student_count).toLocaleString('fa-IR')}</strong></td></tr>`).join('') || '<tr><td colspan="4" class="muted">درسی وجود ندارد.</td></tr>';
}
function renderOverlap(){
  const detailed=buildDetailedOverlaps();
  els.overlapTableBody.innerHTML=detailed.map(r=>{
    const people=(r.students||[]).map(s=>`<li>${esc(s.first_name)} ${esc(s.last_name)} · ${esc(s.student_number)} · ورودی ${esc(s.entry_year)}</li>`).join('');
    return `<tr><td>${esc(r.course_1)}</td><td>${esc(r.course_2)}</td><td><strong>${Number(r.common_students).toLocaleString('fa-IR')}</strong></td><td class="overlap-students"><details><summary>مشاهده ${Number(r.common_students).toLocaleString('fa-IR')} نفر</summary><ul class="overlap-students-list">${people}</ul></details></td></tr>`;
  }).join('') || '<tr><td colspan="4" class="muted">هنوز جفت‌درسی با دانشجوی مشترک وجود ندارد.</td></tr>';
}

function renderCoursesAdmin(){
  const q=els.courseAdminSearch.value.trim().toLowerCase();
  const rows=state.courses.filter(c=>`${c.name_fa} ${c.instructor} ${c.main_entry} ${(c.allowed_entries||[]).join(' ')}`.toLowerCase().includes(q));
  els.coursesTableBody.innerHTML=rows.map(c=>`<tr class="${c.active?'':'course-inactive-row'}">
    <td><strong>${esc(c.name_fa)}</strong></td><td>${esc(c.instructor)}</td><td>${Number(c.credits).toLocaleString('fa-IR')}</td><td>${faLevel(c.level)}</td>
    <td>${esc(c.main_entry)}</td><td>${esc((c.allowed_entries||[]).join('، '))||'—'}</td><td>${c.out_of_chart?'بله':'خیر'}</td>
    <td><span class="status-badge ${c.active?'active':'inactive'}">${c.active?'فعال':'غیرفعال'}</span></td><td><strong>${demandCount(c.id).toLocaleString('fa-IR')}</strong></td>
    <td><button class="mini-btn" data-edit-course="${c.id}">ویرایش</button> <button class="mini-btn danger" data-delete-course="${c.id}">حذف کامل</button></td>
  </tr>`).join('') || '<tr><td colspan="10" class="muted">درسی پیدا نشد.</td></tr>';
  document.querySelectorAll('[data-edit-course]').forEach(b=>b.addEventListener('click',()=>openCourseEditor(b.dataset.editCourse)));
  document.querySelectorAll('[data-delete-course]').forEach(b=>b.addEventListener('click',()=>deleteCourse(b.dataset.deleteCourse)));
}

function openStudentEditor(id){
  const s=state.students.find(x=>x.id===id); if(!s)return;
  state.editingId=id; els.editFirstName.value=s.first_name; els.editLastName.value=s.last_name; els.editStudentNumber.value=s.student_number; els.editEntryYear.value=s.entry_year; els.newPin.value='';
  els.editorStudentId.textContent=`شماره دانشجویی فعلی: ${s.student_number}`;
  const wanted=new Set(s.course_ids||[]);
  els.adminCourseList.innerHTML=state.courses.map(c=>`<label class="admin-course-item ${c.active?'':'inactive-choice'}"><input class="admin-course-check" type="checkbox" value="${c.id}" ${wanted.has(c.id)?'checked':''}><span>${esc(c.name_fa)} <span class="muted">· ${esc(c.instructor)}${c.active?'':' · غیرفعال'}</span></span></label>`).join('');
  msg(els.editorMessage); els.studentEditor.classList.remove('hidden'); els.studentEditor.scrollIntoView({behavior:'smooth',block:'start'});
}
function closeStudentEditor(){state.editingId=null;els.studentEditor.classList.add('hidden');msg(els.editorMessage);}
async function saveStudent(){
  const ids=selectedAdminCourses(); if(!ids.length)return msg(els.editorMessage,'حداقل یک درس باید انتخاب شده باشد.','error');
  const pin=els.newPin.value.trim(); if(pin && !/^\d{4,8}$/.test(pin))return msg(els.editorMessage,'کد ویرایش جدید باید ۴ تا ۸ رقم باشد.','error');
  els.saveStudentBtn.disabled=true; msg(els.editorMessage,'در حال ذخیره…');
  const {data,error}=await client.rpc('admin_update_registration',{p_registration_id:state.editingId,p_student_number:els.editStudentNumber.value.trim(),p_first_name:els.editFirstName.value.trim(),p_last_name:els.editLastName.value.trim(),p_entry_year:els.editEntryYear.value,p_course_ids:ids,p_new_edit_pin:pin||null});
  els.saveStudentBtn.disabled=false;
  if(error||!data?.ok)return msg(els.editorMessage,data?.message||error?.message||'ویرایش انجام نشد.','error');
  msg(els.editorMessage,'تغییرات با موفقیت ذخیره شد.','ok'); await loadDashboard(); setTimeout(closeStudentEditor,700);
}
async function deleteStudent(id){
  const s=state.students.find(x=>x.id===id); if(!s)return;
  if(!confirm(`اطلاعات ${s.first_name} ${s.last_name} با شماره دانشجویی ${s.student_number} به‌طور کامل حذف شود؟`))return;
  const {data,error}=await client.rpc('admin_delete_registration',{p_registration_id:id});
  if(error||!data?.ok)return alert(data?.message||error?.message||'حذف انجام نشد.');
  if(state.editingId===id)closeStudentEditor(); await loadDashboard();
}

function renderEntryControls(selected=[]){
  const wanted=new Set(selected||[]);
  els.courseMainEntry.innerHTML=ENTRY_OPTIONS.map(e=>`<option value="${e}">${e}</option>`).join('');
  els.courseAllowedEntries.innerHTML=ENTRY_OPTIONS.map(e=>`<label class="check-line compact"><input class="allowed-entry-check" type="checkbox" value="${e}" ${wanted.has(e)?'checked':''}/> ${e}</label>`).join('');
}
function openCourseEditor(id=null){
  state.editingCourseId=id;
  const c=id?state.courses.find(x=>x.id===id):null;
  renderEntryControls(c?.allowed_entries||[]);
  els.courseEditorTitle.textContent=c?'ویرایش درس':'افزودن درس جدید';
  els.courseEditorId.textContent=c?`شناسه داخلی: ${c.id}`:'شناسه داخلی به‌صورت خودکار ساخته می‌شود';
  els.courseName.value=c?.name_fa||''; els.courseInstructor.value=c?.instructor||''; els.courseCredits.value=String(c?.credits||4); els.courseLevel.value=c?.level||'Undergraduate';
  els.courseMainEntry.value=c?.main_entry||'1405'; els.courseOutOfChart.checked=!!c?.out_of_chart; els.courseActive.checked=c?!!c.active:true;
  msg(els.courseEditorMessage); els.courseEditor.classList.remove('hidden'); els.courseEditor.scrollIntoView({behavior:'smooth',block:'start'});
}
function closeCourseEditor(){state.editingCourseId=null;els.courseEditor.classList.add('hidden');msg(els.courseEditorMessage);}
async function saveCourse(){
  const name=els.courseName.value.trim(), instructor=els.courseInstructor.value.trim(), allowed=selectedAllowedEntries();
  if(!name||!instructor)return msg(els.courseEditorMessage,'نام درس و استاد درس را وارد کنید.','error');
  els.saveCourseBtn.disabled=true; msg(els.courseEditorMessage,'در حال ثبت…');
  const {data,error}=await client.rpc('admin_save_course',{p_course_id:state.editingCourseId,p_name_fa:name,p_instructor:instructor,p_credits:Number(els.courseCredits.value),p_level:els.courseLevel.value,p_main_entry:els.courseMainEntry.value,p_allowed_entries:allowed,p_out_of_chart:els.courseOutOfChart.checked,p_active:els.courseActive.checked});
  els.saveCourseBtn.disabled=false;
  if(error||!data?.ok)return msg(els.courseEditorMessage,data?.message||error?.message||'ثبت درس انجام نشد.','error');
  msg(els.courseEditorMessage,state.editingCourseId?'تغییرات درس با موفقیت ثبت شد.':'درس جدید با موفقیت اضافه شد.','ok');
  await loadDashboard(); setTimeout(closeCourseEditor,700);
}
async function deleteCourse(id){
  const c=state.courses.find(x=>x.id===id); if(!c)return;
  const n=demandCount(id);
  const text=n>0
    ? `درس «${c.name_fa}» در حال حاضر توسط ${n.toLocaleString('fa-IR')} دانشجو انتخاب شده است. حذف کامل، این درس را از انتخاب همه این دانشجویان نیز حذف می‌کند. آیا مطمئن هستید؟`
    : `درس «${c.name_fa}» به‌طور کامل حذف شود؟ این عملیات قابل بازگشت نیست.`;
  if(!confirm(text))return;
  const {data,error}=await client.rpc('admin_delete_course',{p_course_id:id});
  if(error||!data?.ok)return alert(data?.message||error?.message||'حذف درس انجام نشد.');
  if(state.editingCourseId===id)closeCourseEditor();
  alert(`درس حذف شد.${Number(data.affected_students||0)>0?` انتخاب ${Number(data.affected_students).toLocaleString('fa-IR')} دانشجو نیز به‌روزرسانی شد.`:''}`);
  await loadDashboard();
}

function switchTab(tab){
  document.querySelectorAll('.admin-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  $('tabStudents').classList.toggle('hidden',tab!=='students'); $('tabCourses').classList.toggle('hidden',tab!=='courses'); $('tabDemand').classList.toggle('hidden',tab!=='demand'); $('tabOverlap').classList.toggle('hidden',tab!=='overlap'); $('tabScheduler').classList.toggle('hidden',tab!=='scheduler');
  if(tab==='scheduler') refreshExportSummary();
  if(tab!=='students') closeStudentEditor(); if(tab!=='courses') closeCourseEditor();
}

document.querySelectorAll('.admin-tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
els.loginBtn.addEventListener('click',signIn); els.logoutBtn.addEventListener('click',signOut); els.studentSearch.addEventListener('input',renderStudents); els.refreshBtn.addEventListener('click',loadDashboard);
els.saveStudentBtn.addEventListener('click',saveStudent); els.cancelEditBtn.addEventListener('click',closeStudentEditor);
els.courseAdminSearch.addEventListener('input',renderCoursesAdmin); els.newCourseBtn.addEventListener('click',()=>openCourseEditor()); els.saveCourseBtn.addEventListener('click',saveCourse); els.cancelCourseBtn.addEventListener('click',closeCourseEditor);
if(els.downloadSchedulerBtn)els.downloadSchedulerBtn.addEventListener('click',exportSchedulerFile); if(els.downloadBackupBtn)els.downloadBackupBtn.addEventListener('click',exportFullBackup);

(async()=>{
  if(!configured)return msg(els.loginMessage,'ابتدا config.js را با API URL و Publishable Key تنظیم کنید.','error');
  const {data:{session}}=await client.auth.getSession();
  if(session?.user)await showAdmin(session.user);
})();
