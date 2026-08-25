const cfg = window.APP_CONFIG || {};
const configured = cfg.SUPABASE_URL && cfg.SUPABASE_PUBLISHABLE_KEY && !cfg.SUPABASE_URL.includes('PASTE_') && !cfg.SUPABASE_PUBLISHABLE_KEY.includes('PASTE_');
const client = configured ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLISHABLE_KEY) : null;
const $ = (id) => document.getElementById(id);

const els = {
  loginCard:$('loginCard'), adminApp:$('adminApp'), adminEmail:$('adminEmail'), adminPassword:$('adminPassword'), loginBtn:$('loginBtn'), loginMessage:$('loginMessage'),
  adminUser:$('adminUser'), logoutBtn:$('logoutBtn'), statStudents:$('statStudents'), statSelections:$('statSelections'), statCourses:$('statCourses'), statEntries:$('statEntries'), statOverlaps:$('statOverlaps'),
  studentsTableBody:$('studentsTableBody'), demandTableBody:$('demandTableBody'), overlapTableBody:$('overlapTableBody'), studentsCountLabel:$('studentsCountLabel'), studentSearch:$('studentSearch'), refreshBtn:$('refreshBtn'),
  studentEditor:$('studentEditor'), editorStudentId:$('editorStudentId'), editFirstName:$('editFirstName'), editLastName:$('editLastName'), editStudentNumber:$('editStudentNumber'), editEntryYear:$('editEntryYear'),
  adminCourseList:$('adminCourseList'), newPin:$('newPin'), saveStudentBtn:$('saveStudentBtn'), cancelEditBtn:$('cancelEditBtn'), editorMessage:$('editorMessage'),
  coursesTableBody:$('coursesTableBody'), courseAdminSearch:$('courseAdminSearch'), newCourseBtn:$('newCourseBtn'), courseEditor:$('courseEditor'), courseEditorTitle:$('courseEditorTitle'), courseEditorId:$('courseEditorId'), courseSyncId:$('courseSyncId'),
  courseName:$('courseName'), courseInstructor:$('courseInstructor'), courseCredits:$('courseCredits'), courseLevel:$('courseLevel'), courseMainEntry:$('courseMainEntry'), courseAllowedEntries:$('courseAllowedEntries'),
  courseOutOfChart:$('courseOutOfChart'), courseActive:$('courseActive'), saveCourseBtn:$('saveCourseBtn'), cancelCourseBtn:$('cancelCourseBtn'), courseEditorMessage:$('courseEditorMessage'),
  entriesTableBody:$('entriesTableBody'), entryAdminSearch:$('entryAdminSearch'), newEntryBtn:$('newEntryBtn'), entryEditor:$('entryEditor'), entryEditorTitle:$('entryEditorTitle'), entryEditorHint:$('entryEditorHint'), entryId:$('entryId'), entryLabel:$('entryLabel'), entryLevel:$('entryLevel'), entrySortOrder:$('entrySortOrder'), entryActive:$('entryActive'), saveEntryBtn:$('saveEntryBtn'), cancelEntryBtn:$('cancelEntryBtn'), entryEditorMessage:$('entryEditorMessage'),
  downloadSchedulerBtn:$('downloadSchedulerBtn'), downloadBackupBtn:$('downloadBackupBtn'), exportMessage:$('exportMessage'), exportStudents:$('exportStudents'), exportSelections:$('exportSelections'), exportOverlaps:$('exportOverlaps'), exportTimestamp:$('exportTimestamp'),
  clearAllStudentsBtn:$('clearAllStudentsBtn'), systemMessage:$('systemMessage')
};

let state = {students:[], demand:[], overlap:[], courses:[], entries:[], editingId:null, editingCourseId:null, editingEntryId:null};

function msg(el,text='',kind=''){if(!el)return;el.textContent=text;el.className='message'+(text?' show':'')+(kind?' '+kind:'');}
function fmtDate(v){if(!v)return '—';try{return new Date(v).toLocaleString('fa-IR');}catch{return v;}}
function faLevel(level){return level==='Graduate'?'کارشناسی ارشد':level==='PhD'?'دکتری':'کارشناسی';}
function esc(s=''){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));}
function selectedAdminCourses(){return [...document.querySelectorAll('.admin-course-check:checked')].map(x=>x.value);}
function selectedAllowedEntries(){return [...document.querySelectorAll('.allowed-entry-check:checked')].map(x=>x.value);}
function demandCount(courseId){const d=state.demand.find(x=>String(x.course_id)===String(courseId));return d?Number(d.student_count||0):0;}
function entryLabel(id){const e=state.entries.find(x=>String(x.id)===String(id));return e?(e.label_fa||e.id):id;}
function activeEntries(){return state.entries.filter(e=>e.active!==false).sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.id).localeCompare(String(b.id)));}
function downloadJson(filename,payload){const blob=new Blob([JSON.stringify(payload,null,2)],{type:'application/json;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);}
function pairKey(a,b){return [String(a),String(b)].sort().join('|||');}

function buildDetailedOverlaps(){
  const courseById=new Map(state.courses.map(c=>[String(c.id),c]));
  const pairs=new Map();
  for(const student of state.students){
    const ids=[...new Set((student.course_ids||[]).map(String))].sort();
    for(let i=0;i<ids.length;i++)for(let j=i+1;j<ids.length;j++){
      const a=ids[i],b=ids[j],key=pairKey(a,b);
      if(!pairs.has(key))pairs.set(key,{course_1_id:a,course_2_id:b,students:[]});
      pairs.get(key).students.push({student_number:String(student.student_number||''),first_name:String(student.first_name||''),last_name:String(student.last_name||''),entry_year:String(student.entry_year||'')});
    }
  }
  return [...pairs.values()].map(r=>{const c1=courseById.get(r.course_1_id)||{},c2=courseById.get(r.course_2_id)||{};return {...r,course_1:c1.name_fa||r.course_1_id,course_2:c2.name_fa||r.course_2_id,common_students:r.students.length};})
    .sort((a,b)=>b.common_students-a.common_students||String(a.course_1).localeCompare(String(b.course_1),'fa'));
}

function buildSchedulerExport(){
  const generatedAt=new Date().toISOString();
  const overlaps=buildDetailedOverlaps();
  const students=state.students.map(s=>({student_number:String(s.student_number||''),first_name:String(s.first_name||''),last_name:String(s.last_name||''),entry_year:String(s.entry_year||''),course_ids:(s.course_ids||[]).map(String),course_names:(s.course_names||[]).map(String),updated_at:s.updated_at||null}));
  const entries=state.entries.map(e=>({id:String(e.id||''),label_fa:String(e.label_fa||e.id||''),level:String(e.level||''),active:e.active!==false,sort_order:Number(e.sort_order||0)}));
  const courses=state.courses.map(c=>({id:String(c.id||''),name_fa:String(c.name_fa||''),instructor:String(c.instructor||''),credits:Number(c.credits||0),level:String(c.level||''),main_entry:String(c.main_entry||''),allowed_entries:(c.allowed_entries||[]).map(String),out_of_chart:!!c.out_of_chart,active:c.active!==false}));
  return {
    schema_version:'lu-stat-prereg-scheduler-v1',
    catalog_contract:'scheduler-stable-ids-v1',
    generated_at:generatedAt,
    source:'LU Statistics Preregistration v1.0',
    summary:{student_count:students.length,selection_count:students.reduce((n,s)=>n+s.course_ids.length,0),course_count:courses.length,active_course_count:courses.filter(c=>c.active).length,entry_count:entries.length,active_entry_count:entries.filter(e=>e.active).length,overlap_pair_count:overlaps.length},
    entries,courses,students,overlaps
  };
}
function refreshExportSummary(){if(!els.exportStudents)return;const overlaps=buildDetailedOverlaps(),selections=state.students.reduce((n,s)=>n+(s.course_ids||[]).length,0);els.exportStudents.textContent=state.students.length.toLocaleString('fa-IR');els.exportSelections.textContent=selections.toLocaleString('fa-IR');els.exportOverlaps.textContent=overlaps.length.toLocaleString('fa-IR');els.exportTimestamp.textContent=new Date().toLocaleString('fa-IR');}
function exportSchedulerFile(){const payload=buildSchedulerExport();const stamp=new Date().toISOString().replace(/[:.]/g,'-');downloadJson(`preregistration_scheduler_${stamp}.json`,payload);msg(els.exportMessage,`فایل مخصوص برنامه‌ریز با ${payload.summary.student_count.toLocaleString('fa-IR')} دانشجو، ${payload.summary.course_count.toLocaleString('fa-IR')} درس و ${payload.summary.entry_count.toLocaleString('fa-IR')} ورودی ساخته شد.`,'ok');}
function exportFullBackup(){const payload={backup_version:'lu-stat-prereg-backup-v2',generated_at:new Date().toISOString(),entries:state.entries,courses:state.courses,students:state.students,course_demand:state.demand,course_overlap:buildDetailedOverlaps()};const stamp=new Date().toISOString().replace(/[:.]/g,'-');downloadJson(`preregistration_full_backup_${stamp}.json`,payload);msg(els.exportMessage,'پشتیبان کامل داده‌های فعلی دانلود شد.','ok');}

async function signIn(){
  if(!client)return msg(els.loginMessage,'اتصال Supabase در config.js تنظیم نشده است.','error');
  const email=els.adminEmail.value.trim(),password=els.adminPassword.value;if(!email||!password)return msg(els.loginMessage,'ایمیل و رمز عبور را وارد کنید.','error');
  els.loginBtn.disabled=true;msg(els.loginMessage,'در حال ورود…');const {data,error}=await client.auth.signInWithPassword({email,password});els.loginBtn.disabled=false;if(error)return msg(els.loginMessage,'ورود ناموفق بود: '+error.message,'error');await showAdmin(data.user);
}
async function signOut(){await client.auth.signOut();location.reload();}
async function showAdmin(user){els.loginCard.classList.add('hidden');els.adminApp.classList.remove('hidden');els.logoutBtn.classList.remove('hidden');els.adminUser.textContent=user?.email||'';await loadDashboard();}

async function loadDashboard(){
  const {data,error}=await client.rpc('admin_dashboard');
  if(error){els.adminApp.classList.add('hidden');els.loginCard.classList.remove('hidden');els.logoutBtn.classList.add('hidden');return msg(els.loginMessage,'این حساب وارد شده است اما دسترسی مدیر برای آن تعریف نشده است. ابتدا add_admin.sql را در Supabase اجرا کنید.','error');}
  state.entries=data?.entries||[];state.courses=data?.courses||[];state.students=data?.students||[];state.demand=data?.course_demand||[];state.overlap=data?.course_overlap||[];
  const selections=state.students.reduce((a,s)=>a+(s.course_ids||[]).length,0);
  els.statStudents.textContent=state.students.length.toLocaleString('fa-IR');els.statSelections.textContent=selections.toLocaleString('fa-IR');els.statCourses.textContent=state.courses.filter(c=>c.active).length.toLocaleString('fa-IR');els.statEntries.textContent=state.entries.filter(e=>e.active).length.toLocaleString('fa-IR');els.statOverlaps.textContent=buildDetailedOverlaps().length.toLocaleString('fa-IR');
  renderStudents();renderCoursesAdmin();renderEntriesAdmin();renderDemand();renderOverlap();refreshExportSummary();
}

function renderStudents(){
  const q=els.studentSearch.value.trim().toLowerCase();
  const rows=state.students.filter(s=>`${s.first_name} ${s.last_name} ${s.student_number} ${s.entry_year} ${(s.course_names||[]).join(' ')}`.toLowerCase().includes(q));
  els.studentsCountLabel.textContent=`${rows.length.toLocaleString('fa-IR')} نفر`;
  els.studentsTableBody.innerHTML=rows.map(s=>`<tr><td><strong>${esc(s.first_name)} ${esc(s.last_name)}</strong></td><td>${esc(s.student_number)}</td><td>${esc(entryLabel(s.entry_year))}<div class="muted tiny-id">${esc(s.entry_year)}</div></td><td><div class="student-courses"><strong>${(s.course_ids||[]).length.toLocaleString('fa-IR')} درس:</strong> ${esc((s.course_names||[]).join('، '))}</div></td><td>${fmtDate(s.updated_at)}</td><td><button class="mini-btn" data-edit-student="${s.id}">ویرایش</button> <button class="mini-btn danger" data-delete-student="${s.id}">حذف</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">دانشجویی ثبت نشده است.</td></tr>';
  document.querySelectorAll('[data-edit-student]').forEach(b=>b.addEventListener('click',()=>openStudentEditor(b.dataset.editStudent)));
  document.querySelectorAll('[data-delete-student]').forEach(b=>b.addEventListener('click',()=>deleteStudent(b.dataset.deleteStudent)));
}
function renderStudentEntrySelect(selected){const rows=[...state.entries].sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));els.editEntryYear.innerHTML=rows.map(e=>`<option value="${e.id}">${esc(e.label_fa||e.id)}${e.active?'':' (غیرفعال)'}</option>`).join('');els.editEntryYear.value=selected||'';}
function openStudentEditor(id){
  const s=state.students.find(x=>x.id===id);if(!s)return;state.editingId=id;els.editFirstName.value=s.first_name;els.editLastName.value=s.last_name;els.editStudentNumber.value=s.student_number;renderStudentEntrySelect(s.entry_year);els.newPin.value='';els.editorStudentId.textContent=`شماره دانشجویی فعلی: ${s.student_number}`;
  const wanted=new Set(s.course_ids||[]);els.adminCourseList.innerHTML=state.courses.map(c=>`<label class="admin-course-item ${c.active?'':'inactive-choice'}"><input class="admin-course-check" type="checkbox" value="${c.id}" ${wanted.has(c.id)?'checked':''}><span>${esc(c.name_fa)} <span class="muted">· ${esc(c.instructor)}${c.active?'':' · غیرفعال'}</span></span></label>`).join('');
  msg(els.editorMessage);els.studentEditor.classList.remove('hidden');els.studentEditor.scrollIntoView({behavior:'smooth',block:'start'});
}
function closeStudentEditor(){state.editingId=null;els.studentEditor.classList.add('hidden');msg(els.editorMessage);}
async function saveStudent(){const ids=selectedAdminCourses();if(!ids.length)return msg(els.editorMessage,'حداقل یک درس باید انتخاب شده باشد.','error');const pin=els.newPin.value.trim();if(pin&&!/^\d{4,8}$/.test(pin))return msg(els.editorMessage,'کد ویرایش جدید باید ۴ تا ۸ رقم باشد.','error');els.saveStudentBtn.disabled=true;msg(els.editorMessage,'در حال ثبت…');const {data,error}=await client.rpc('admin_update_registration',{p_registration_id:state.editingId,p_student_number:els.editStudentNumber.value.trim(),p_first_name:els.editFirstName.value.trim(),p_last_name:els.editLastName.value.trim(),p_entry_year:els.editEntryYear.value,p_course_ids:ids,p_new_edit_pin:pin||null});els.saveStudentBtn.disabled=false;if(error||!data?.ok)return msg(els.editorMessage,data?.message||error?.message||'ویرایش انجام نشد.','error');msg(els.editorMessage,'تغییرات با موفقیت ثبت شد.','ok');await loadDashboard();setTimeout(closeStudentEditor,600);}
async function deleteStudent(id){const s=state.students.find(x=>x.id===id);if(!s)return;if(!confirm(`اطلاعات ${s.first_name} ${s.last_name} با شماره دانشجویی ${s.student_number} به‌طور کامل حذف شود؟`))return;const {data,error}=await client.rpc('admin_delete_registration',{p_registration_id:id});if(error||!data?.ok)return alert(data?.message||error?.message||'حذف انجام نشد.');if(state.editingId===id)closeStudentEditor();await loadDashboard();}

function renderDemand(){els.demandTableBody.innerHTML=state.demand.filter(r=>r.active!==false).sort((a,b)=>Number(b.student_count||0)-Number(a.student_count||0)).map(r=>`<tr><td>${esc(r.name_fa)}</td><td>${esc(r.instructor)}</td><td>${faLevel(r.level)}</td><td><strong>${Number(r.student_count).toLocaleString('fa-IR')}</strong></td></tr>`).join('')||'<tr><td colspan="4" class="muted">درسی وجود ندارد.</td></tr>';}
function renderOverlap(){const detailed=buildDetailedOverlaps();els.overlapTableBody.innerHTML=detailed.map(r=>{const people=(r.students||[]).map(s=>`<li>${esc(s.first_name)} ${esc(s.last_name)} · ${esc(s.student_number)} · ${esc(entryLabel(s.entry_year))}</li>`).join('');return `<tr><td>${esc(r.course_1)}</td><td>${esc(r.course_2)}</td><td><strong>${Number(r.common_students).toLocaleString('fa-IR')}</strong></td><td class="overlap-students"><details><summary>مشاهده ${Number(r.common_students).toLocaleString('fa-IR')} نفر</summary><ul class="overlap-students-list">${people}</ul></details></td></tr>`;}).join('')||'<tr><td colspan="4" class="muted">هنوز جفت‌درسی با دانشجوی مشترک وجود ندارد.</td></tr>';}

function renderCoursesAdmin(){
  const q=els.courseAdminSearch.value.trim().toLowerCase();const rows=state.courses.filter(c=>`${c.id} ${c.name_fa} ${c.instructor} ${c.main_entry} ${(c.allowed_entries||[]).join(' ')}`.toLowerCase().includes(q));
  els.coursesTableBody.innerHTML=rows.map(c=>`<tr class="${c.active?'':'course-inactive-row'}"><td><code>${esc(c.id)}</code></td><td><strong>${esc(c.name_fa)}</strong></td><td>${esc(c.instructor)}</td><td>${Number(c.credits).toLocaleString('fa-IR')}</td><td>${faLevel(c.level)}</td><td>${esc(entryLabel(c.main_entry))}</td><td>${esc((c.allowed_entries||[]).map(entryLabel).join('، '))||'—'}</td><td>${c.out_of_chart?'بله':'خیر'}</td><td><span class="status-badge ${c.active?'active':'inactive'}">${c.active?'فعال':'غیرفعال'}</span></td><td><strong>${demandCount(c.id).toLocaleString('fa-IR')}</strong></td><td><button class="mini-btn" data-edit-course="${c.id}">ویرایش</button> <button class="mini-btn danger" data-delete-course="${c.id}">حذف کامل</button></td></tr>`).join('')||'<tr><td colspan="11" class="muted">درسی پیدا نشد.</td></tr>';
  document.querySelectorAll('[data-edit-course]').forEach(b=>b.addEventListener('click',()=>openCourseEditor(b.dataset.editCourse)));document.querySelectorAll('[data-delete-course]').forEach(b=>b.addEventListener('click',()=>deleteCourse(b.dataset.deleteCourse)));
}
function renderEntryControls(selected=[]){const wanted=new Set(selected||[]),rows=[...state.entries].sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0));els.courseMainEntry.innerHTML=rows.map(e=>`<option value="${e.id}">${esc(e.label_fa||e.id)}${e.active?'':' (غیرفعال)'}</option>`).join('');els.courseAllowedEntries.innerHTML=rows.map(e=>`<label class="check-line compact ${e.active?'':'inactive-choice'}"><input class="allowed-entry-check" type="checkbox" value="${e.id}" ${wanted.has(e.id)?'checked':''}/> ${esc(e.label_fa||e.id)} <span class="muted tiny-id">${esc(e.id)}</span></label>`).join('');}
function openCourseEditor(id=null){
  state.editingCourseId=id;const c=id?state.courses.find(x=>x.id===id):null;renderEntryControls(c?.allowed_entries||[]);els.courseEditorTitle.textContent=c?'ویرایش درس':'افزودن درس جدید';els.courseEditorId.textContent=c?'شناسه درس بعد از ایجاد تغییر نمی‌کند.':'شناسه باید با شناسه درس در University Scheduler یکسان باشد.';els.courseSyncId.value=c?.id||'';els.courseSyncId.readOnly=!!c;els.courseName.value=c?.name_fa||'';els.courseInstructor.value=c?.instructor||'';els.courseCredits.value=String(c?.credits||4);els.courseLevel.value=c?.level||'Undergraduate';els.courseMainEntry.value=c?.main_entry||activeEntries()[0]?.id||'';els.courseOutOfChart.checked=!!c?.out_of_chart;els.courseActive.checked=c?!!c.active:true;msg(els.courseEditorMessage);els.courseEditor.classList.remove('hidden');els.courseEditor.scrollIntoView({behavior:'smooth',block:'start'});
}
function closeCourseEditor(){state.editingCourseId=null;els.courseEditor.classList.add('hidden');msg(els.courseEditorMessage);}
async function saveCourse(){
  const syncId=els.courseSyncId.value.trim(),name=els.courseName.value.trim(),instructor=els.courseInstructor.value.trim(),allowed=selectedAllowedEntries();
  if(!syncId)return msg(els.courseEditorMessage,'شناسه هماهنگ‌سازی درس الزامی است.','error');if(!/^[A-Za-z0-9_-]+$/.test(syncId))return msg(els.courseEditorMessage,'شناسه درس فقط می‌تواند شامل حروف لاتین، عدد، خط تیره و زیرخط باشد.','error');if(!name||!instructor)return msg(els.courseEditorMessage,'نام درس و استاد درس را وارد کنید.','error');if(!els.courseMainEntry.value)return msg(els.courseEditorMessage,'ورودی اصلی را انتخاب کنید.','error');
  els.saveCourseBtn.disabled=true;msg(els.courseEditorMessage,'در حال ثبت…');const {data,error}=await client.rpc('admin_save_course',{p_course_id:syncId,p_is_existing:!!state.editingCourseId,p_name_fa:name,p_instructor:instructor,p_credits:Number(els.courseCredits.value),p_level:els.courseLevel.value,p_main_entry:els.courseMainEntry.value,p_allowed_entries:allowed,p_out_of_chart:els.courseOutOfChart.checked,p_active:els.courseActive.checked});els.saveCourseBtn.disabled=false;if(error||!data?.ok)return msg(els.courseEditorMessage,data?.message||error?.message||'ثبت درس انجام نشد.','error');msg(els.courseEditorMessage,state.editingCourseId?'تغییرات درس ثبت شد.':`درس جدید ثبت شد. شناسه Scheduler: ${data.course_id}`,'ok');await loadDashboard();setTimeout(closeCourseEditor,800);
}
async function deleteCourse(id){const c=state.courses.find(x=>x.id===id);if(!c)return;const n=demandCount(id);const text=n>0?`درس «${c.name_fa}» توسط ${n.toLocaleString('fa-IR')} دانشجو انتخاب شده است. حذف کامل، این درس را از انتخاب آنها نیز حذف می‌کند. ادامه می‌دهی؟`:`درس «${c.name_fa}» به‌طور کامل حذف شود؟`;if(!confirm(text))return;const {data,error}=await client.rpc('admin_delete_course',{p_course_id:id});if(error||!data?.ok)return alert(data?.message||error?.message||'حذف درس انجام نشد.');if(state.editingCourseId===id)closeCourseEditor();await loadDashboard();}

function renderEntriesAdmin(){
  const q=(els.entryAdminSearch?.value||'').trim().toLowerCase();const rows=[...state.entries].sort((a,b)=>Number(a.sort_order||0)-Number(b.sort_order||0)||String(a.id).localeCompare(String(b.id))).filter(e=>`${e.id} ${e.label_fa} ${e.level}`.toLowerCase().includes(q));
  els.entriesTableBody.innerHTML=rows.map(e=>`<tr class="${e.active?'':'course-inactive-row'}"><td><code>${esc(e.id)}</code></td><td><strong>${esc(e.label_fa||e.id)}</strong></td><td>${faLevel(e.level)}</td><td>${Number(e.sort_order||0).toLocaleString('fa-IR')}</td><td><span class="status-badge ${e.active?'active':'inactive'}">${e.active?'فعال':'غیرفعال'}</span></td><td><button class="mini-btn" data-edit-entry="${e.id}">ویرایش</button> <button class="mini-btn danger" data-delete-entry="${e.id}">حذف کامل</button></td></tr>`).join('')||'<tr><td colspan="6" class="muted">ورودی‌ای پیدا نشد.</td></tr>';
  document.querySelectorAll('[data-edit-entry]').forEach(b=>b.addEventListener('click',()=>openEntryEditor(b.dataset.editEntry)));document.querySelectorAll('[data-delete-entry]').forEach(b=>b.addEventListener('click',()=>deleteEntry(b.dataset.deleteEntry)));
}
function openEntryEditor(id=null){state.editingEntryId=id;const e=id?state.entries.find(x=>x.id===id):null;els.entryEditorTitle.textContent=e?'ویرایش ورودی':'افزودن ورودی جدید';els.entryEditorHint.textContent=e?'شناسه ورودی بعد از ایجاد تغییر نمی‌کند.':'شناسه را مطابق University Scheduler انتخاب کن.';els.entryId.value=e?.id||'';els.entryId.readOnly=!!e;els.entryLabel.value=e?.label_fa||'';els.entryLevel.value=e?.level||'Undergraduate';els.entrySortOrder.value=String(e?.sort_order??10);els.entryActive.checked=e?!!e.active:true;msg(els.entryEditorMessage);els.entryEditor.classList.remove('hidden');els.entryEditor.scrollIntoView({behavior:'smooth',block:'start'});}
function closeEntryEditor(){state.editingEntryId=null;els.entryEditor.classList.add('hidden');msg(els.entryEditorMessage);}
async function saveEntry(){const id=els.entryId.value.trim(),label=els.entryLabel.value.trim();if(!id)return msg(els.entryEditorMessage,'شناسه ورودی الزامی است.','error');if(!/^[A-Za-z0-9_-]+$/.test(id))return msg(els.entryEditorMessage,'شناسه ورودی فقط می‌تواند شامل حروف لاتین، عدد، خط تیره و زیرخط باشد.','error');if(!label)return msg(els.entryEditorMessage,'عنوان نمایشی ورودی را وارد کنید.','error');els.saveEntryBtn.disabled=true;msg(els.entryEditorMessage,'در حال ثبت…');const {data,error}=await client.rpc('admin_save_entry',{p_entry_id:id,p_is_existing:!!state.editingEntryId,p_label_fa:label,p_level:els.entryLevel.value,p_active:els.entryActive.checked,p_sort_order:Number(els.entrySortOrder.value||0)});els.saveEntryBtn.disabled=false;if(error||!data?.ok)return msg(els.entryEditorMessage,data?.message||error?.message||'ثبت ورودی انجام نشد.','error');msg(els.entryEditorMessage,'ورودی با موفقیت ثبت شد.','ok');await loadDashboard();setTimeout(closeEntryEditor,700);}
async function deleteEntry(id){const e=state.entries.find(x=>x.id===id);if(!e)return;if(!confirm(`ورودی «${e.label_fa||e.id}» حذف شود؟ اگر توسط دانشجو یا درس استفاده شده باشد، سیستم اجازه حذف کامل نمی‌دهد و باید ابتدا وابستگی‌ها را اصلاح کنی.`))return;const {data,error}=await client.rpc('admin_delete_entry',{p_entry_id:id});if(error||!data?.ok)return alert(data?.message||error?.message||'حذف ورودی انجام نشد.');if(state.editingEntryId===id)closeEntryEditor();await loadDashboard();}

async function clearAllStudents(){
  const phrase='حذف همه دانشجویان';
  const typed=prompt(`برای شروع دوره جدید، همه اطلاعات پیش‌ثبت‌نام دانشجویان حذف می‌شود اما دروس و ورودی‌ها باقی می‌مانند.\n\nبرای تأیید دقیقاً بنویس:\n${phrase}`,'');
  if(typed!==phrase)return msg(els.systemMessage,'عملیات لغو شد؛ عبارت تأیید صحیح وارد نشد.','error');
  exportFullBackup();
  els.clearAllStudentsBtn.disabled=true;msg(els.systemMessage,'پشتیبان دانلود شد؛ در حال پاک‌سازی اطلاعات دانشجویان…');
  const {data,error}=await client.rpc('admin_clear_all_registrations');els.clearAllStudentsBtn.disabled=false;
  if(error||!data?.ok)return msg(els.systemMessage,data?.message||error?.message||'پاک‌سازی انجام نشد.','error');
  msg(els.systemMessage,`دوره جدید آماده شد. ${Number(data.deleted_students||0).toLocaleString('fa-IR')} دانشجو و ${Number(data.deleted_selections||0).toLocaleString('fa-IR')} انتخاب درس حذف شد. دروس، ورودی‌ها و حساب مدیر حفظ شدند.`,'ok');await loadDashboard();
}

function switchTab(tab){
  document.querySelectorAll('.admin-tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));
  const panels={students:$('tabStudents'),courses:$('tabCourses'),entries:$('tabEntries'),demand:$('tabDemand'),overlap:$('tabOverlap'),scheduler:$('tabScheduler'),system:$('tabSystem')};
  Object.entries(panels).forEach(([name,panel])=>{if(panel)panel.classList.toggle('hidden',name!==tab);});
  if(tab==='scheduler')refreshExportSummary();
  if(tab!=='students')closeStudentEditor();if(tab!=='courses')closeCourseEditor();if(tab!=='entries')closeEntryEditor();
}

document.querySelectorAll('.admin-tab').forEach(b=>b.addEventListener('click',()=>switchTab(b.dataset.tab)));
els.loginBtn.addEventListener('click',signIn);els.logoutBtn.addEventListener('click',signOut);els.studentSearch.addEventListener('input',renderStudents);els.refreshBtn.addEventListener('click',loadDashboard);els.saveStudentBtn.addEventListener('click',saveStudent);els.cancelEditBtn.addEventListener('click',closeStudentEditor);
els.courseAdminSearch.addEventListener('input',renderCoursesAdmin);els.newCourseBtn.addEventListener('click',()=>openCourseEditor());els.saveCourseBtn.addEventListener('click',saveCourse);els.cancelCourseBtn.addEventListener('click',closeCourseEditor);
els.entryAdminSearch.addEventListener('input',renderEntriesAdmin);els.newEntryBtn.addEventListener('click',()=>openEntryEditor());els.saveEntryBtn.addEventListener('click',saveEntry);els.cancelEntryBtn.addEventListener('click',closeEntryEditor);
els.downloadSchedulerBtn.addEventListener('click',exportSchedulerFile);els.downloadBackupBtn.addEventListener('click',exportFullBackup);els.clearAllStudentsBtn.addEventListener('click',clearAllStudents);

(async()=>{if(!configured)return msg(els.loginMessage,'ابتدا config.js را با API URL و Publishable Key تنظیم کنید.','error');const {data:{session}}=await client.auth.getSession();if(session?.user)await showAdmin(session.user);})();
