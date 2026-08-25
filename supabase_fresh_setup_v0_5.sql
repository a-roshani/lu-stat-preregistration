-- سامانه پیش‌ثبت‌نام گروه آمار - نسخه 0.5 Fresh Start
-- راه‌اندازی کاملاً تازه و پاک‌سازی داده‌های نسخه‌های قبلی
-- هشدار: اجرای این فایل تمام ثبت‌نام‌های دانشجویان و داده‌های مربوط به این سامانه را حذف می‌کند.
-- فهرست اولیه ۳۰ درس دوباره ایجاد می‌شود، اما هیچ دانشجو یا انتخاب درسی قبلی باقی نمی‌ماند.

begin;

-- حذف توابع و نماهای نسخه‌های قبلی
drop function if exists public.admin_delete_registration(uuid);
drop function if exists public.admin_update_registration(uuid,text,text,text,text,text[],text);
drop function if exists public.admin_dashboard();
drop function if exists public.is_admin();
drop function if exists public.load_registration(text,text);
drop function if exists public.save_registration(text,text,text,text,text[],text);
drop view if exists public.course_overlap;
drop view if exists public.course_demand;

-- حذف جداول برنامه (با حذف کامل ثبت‌نام‌های قبلی)
drop table if exists public.registration_courses cascade;
drop table if exists public.registrations cascade;
drop table if exists public.admins cascade;
drop table if exists public.courses cascade;

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.courses (
  id text primary key,
  name_fa text not null,
  instructor text not null,
  credits integer not null check (credits between 1 and 6),
  level text not null,
  main_entry text not null,
  allowed_entries text[] not null default '{}',
  out_of_chart boolean not null default false,
  active boolean not null default true
);

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  student_number text not null unique,
  first_name text not null,
  last_name text not null,
  entry_year text not null,
  edit_pin_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.registration_courses (
  registration_id uuid not null references public.registrations(id) on delete cascade,
  course_id text not null references public.courses(id),
  created_at timestamptz not null default now(),
  primary key (registration_id, course_id)
);

alter table public.courses enable row level security;
alter table public.registrations enable row level security;
alter table public.registration_courses enable row level security;

drop policy if exists courses_public_read on public.courses;
create policy courses_public_read on public.courses for select to anon, authenticated using (active = true);

-- هیچ policy مستقیمی برای registrations و registration_courses تعریف نمی‌شود.
-- دانشجو فقط از طریق توابع امن زیر می‌تواند رکورد خودش را ایجاد/ویرایش/بازیابی کند.

insert into public.courses (id,name_fa,instructor,credits,level,main_entry,allowed_entries,out_of_chart,active) values
('Mathematics_for_Statistics','ریاضی برای آمار','دکتر پورسعید',3,'Undergraduate','1404',ARRAY['1404']::text[],false,true),
('Stochastic_Processes','فرآیندهای تصادفی','دکتر جودکی',4,'Undergraduate','1403',ARRAY['1403']::text[],false,true),
('Reliability_Theory','نظریه قابلیت اعتماد','دکتر پورسعید',3,'Undergraduate','1401',ARRAY['1401']::text[],true,true),
('Statistical_Learning','یادگیری آماری','دکتر روشنی',4,'Undergraduate','1403',ARRAY['1403']::text[],false,true),
('Topics_in_Applied_Statistics','مباحثی در آمار کاربردی','دکتر روشنی',3,'Undergraduate','1402',ARRAY['1402','1401']::text[],false,true),
('Computational_Statistics','آمار محاسباتی','دکتر روشنی',4,'Undergraduate','1402',ARRAY['1402']::text[],false,true),
('Categorical_data','تحلیل داده‌های رسته‌ای','دکتر جودکی',4,'Undergraduate','1402',ARRAY['1402']::text[],false,true),
('probability','احتمال مقدماتی','دکتر روشنی',2,'Undergraduate','1405',ARRAY['1405']::text[],false,true),
('Probability_II','احتمال ۲','دکتر پیرمحمدی',4,'Undergraduate','1404',ARRAY['1404']::text[],false,true),
('Statistics_Methods','روشهای آماری','دکتر پیرمحمدی',4,'Undergraduate','1404',ARRAY['1404']::text[],false,true),
('Math_stat_II','نظریه آمار ۲','دکتر پیرمحمدی',4,'Undergraduate','1403',ARRAY['1403']::text[],false,true),
('Non-Parametric','ناپارامتری','دکتر پیرمحمدی',3,'Undergraduate','1402',ARRAY['1402','1401']::text[],false,true),
('Zaban','زبان تخصصی','دکتر پیرمحمدی',2,'Undergraduate','1403',ARRAY['1403','1401','1402']::text[],false,true),
('tahlil_grafiki','تحلیل گرافیکی','دکتر توسلی',3,'Undergraduate','1405',ARRAY['1405']::text[],false,true),
('paygah_data','پایگاه داده','دکتر توسلی',3,'Undergraduate','1404',ARRAY['1404']::text[],false,true),
('machine_learning','یادگیری ماشین','دکتر توسلی',4,'Undergraduate','1402',ARRAY['1402']::text[],false,true),
('peyvaste_II','پیوسته ۲','دکتر توسلی',3,'Undergraduate','1401',ARRAY['1401']::text[],true,true),
('seri','سری زمانی','دکتر توسلی',4,'Undergraduate','1401',ARRAY['1401']::text[],true,true),
('jabr_khati','جبر خطی','دکتر جودکی',3,'Undergraduate','1404',ARRAY['1404']::text[],false,true),
('amar_zisti','آمار زیستی','دکتر جودکی',3,'Undergraduate','1403',ARRAY['1403']::text[],false,true),
('Regression_II','رگرسیون ۲','دکتر جودکی',4,'Undergraduate','1403',ARRAY['1403','1401']::text[],false,true),
('Math_Stat_I','استنباط ۱','دکتر پورسعید',4,'Graduate','MSc_1405',ARRAY['MSc_1405','MSc_1404']::text[],false,true),
('Prob_and_Meas_I','نظریه اندازه و احتمال ۱','دکتر شکوری',4,'Graduate','MSc_1405',ARRAY['MSc_1405']::text[],false,true),
('Mabani_Eghtesad','مبانی اقتصاد','دکتر عباد تیموری',2,'Undergraduate','1405',ARRAY['1405']::text[],false,true),
('course_025','ریاضی عمومی ۱','گروه ریاضی',4,'Undergraduate','1405',ARRAY['1405']::text[],false,true),
('course_026','مبانی کامپیوتر و برنامه نویسی','دکتر حسنوند',3,'Undergraduate','1405',ARRAY['1405']::text[],false,true),
('course_027','نظریه آمار ۱','دکتر گودرزی',4,'Undergraduate','1403',ARRAY['1403','1402']::text[],true,true),
('course_028','چندمتغیره گسسته','دکتر راستین',4,'Undergraduate','1401',ARRAY['1401']::text[],true,true),
('course_029','احتمال ۱','خانم قاسمی نژاد',4,'Undergraduate','1404',ARRAY['1404']::text[],true,true),
('course_030','مباحث ويژه ارشد','دکتر توسلی',4,'Graduate','MSc_1404',ARRAY['MSc_1404']::text[],false,true)
on conflict (id) do update set
 name_fa=excluded.name_fa, instructor=excluded.instructor, credits=excluded.credits, level=excluded.level,
 main_entry=excluded.main_entry, allowed_entries=excluded.allowed_entries, out_of_chart=excluded.out_of_chart, active=excluded.active;

create or replace function public.save_registration(
  p_student_number text, p_first_name text, p_last_name text, p_entry_year text, p_course_ids text[], p_edit_pin text
) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare
  v_id uuid; v_hash text; v_is_new boolean := false; v_bad integer;
begin
  p_student_number := btrim(p_student_number); p_first_name := btrim(p_first_name); p_last_name := btrim(p_last_name); p_entry_year := btrim(p_entry_year); p_edit_pin := btrim(p_edit_pin);
  if p_student_number = '' or p_first_name = '' or p_last_name = '' or p_entry_year = '' then return jsonb_build_object('ok',false,'message','اطلاعات دانشجو کامل نیست.'); end if;
  if p_edit_pin !~ '^[0-9]{4,8}$' then return jsonb_build_object('ok',false,'message','کد ویرایش باید ۴ تا ۸ رقم باشد.'); end if;
  if coalesce(array_length(p_course_ids,1),0)=0 then return jsonb_build_object('ok',false,'message','حداقل یک درس انتخاب کنید.'); end if;
  select count(*) into v_bad from unnest(p_course_ids) x where not exists (select 1 from public.courses c where c.id=x and c.active);
  if v_bad > 0 then return jsonb_build_object('ok',false,'message','یک یا چند درس انتخاب‌شده معتبر نیست.'); end if;

  select id, edit_pin_hash into v_id, v_hash from public.registrations where student_number=p_student_number for update;
  if v_id is null then
    insert into public.registrations(student_number,first_name,last_name,entry_year,edit_pin_hash) values(p_student_number,p_first_name,p_last_name,p_entry_year,extensions.crypt(p_edit_pin,extensions.gen_salt('bf'))) returning id into v_id;
    v_is_new := true;
  else
    if extensions.crypt(p_edit_pin,v_hash) <> v_hash then return jsonb_build_object('ok',false,'message','کد ویرایش صحیح نیست.'); end if;
    update public.registrations set first_name=p_first_name,last_name=p_last_name,entry_year=p_entry_year,updated_at=now() where id=v_id;
    delete from public.registration_courses where registration_id=v_id;
  end if;
  insert into public.registration_courses(registration_id,course_id) select v_id,x from unnest(p_course_ids) x on conflict do nothing;
  return jsonb_build_object('ok',true,'new',v_is_new,'registration_id',v_id,'updated_at',now());
end; $$;

create or replace function public.load_registration(p_student_number text, p_edit_pin text) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_row public.registrations%rowtype; v_courses text[];
begin
  select * into v_row from public.registrations where student_number=btrim(p_student_number);
  if v_row.id is null or extensions.crypt(btrim(p_edit_pin),v_row.edit_pin_hash) <> v_row.edit_pin_hash then return jsonb_build_object('ok',false); end if;
  select coalesce(array_agg(course_id order by course_id),array[]::text[]) into v_courses from public.registration_courses where registration_id=v_row.id;
  return jsonb_build_object('ok',true,'registration',jsonb_build_object('student_number',v_row.student_number,'first_name',v_row.first_name,'last_name',v_row.last_name,'entry_year',v_row.entry_year,'updated_at',v_row.updated_at),'course_ids',v_courses);
end; $$;

revoke all on function public.save_registration(text,text,text,text,text[],text) from public;
revoke all on function public.load_registration(text,text) from public;
grant execute on function public.save_registration(text,text,text,text,text[],text) to anon, authenticated;
grant execute on function public.load_registration(text,text) to anon, authenticated;

grant select on public.courses to anon, authenticated;

-- گزارش تقاضای هر درس (برای مشاهده در SQL Editor/Supabase Dashboard)
create or replace view public.course_demand as
select c.id as course_id,c.name_fa,c.instructor,c.level,count(rc.registration_id)::integer as student_count
from public.courses c left join public.registration_courses rc on rc.course_id=c.id
group by c.id,c.name_fa,c.instructor,c.level;

-- تعداد دانشجوی مشترک بین هر جفت درس
create or replace view public.course_overlap as
select a.course_id as course_1_id,c1.name_fa as course_1,b.course_id as course_2_id,c2.name_fa as course_2,count(*)::integer as common_students
from public.registration_courses a join public.registration_courses b on a.registration_id=b.registration_id and a.course_id < b.course_id
join public.courses c1 on c1.id=a.course_id join public.courses c2 on c2.id=b.course_id
group by a.course_id,c1.name_fa,b.course_id,c2.name_fa;

-- ============================================================
-- قابلیت مدیریت (نسخه 0.3)
-- ============================================================

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public, pg_temp as $$
  select exists (select 1 from public.admins a where a.user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

create or replace function public.admin_dashboard()
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_students jsonb; v_demand jsonb; v_overlap jsonb;
begin
  if not public.is_admin() then raise exception 'دسترسی مدیر تأیید نشد.' using errcode='42501'; end if;
  select coalesce(jsonb_agg(x.obj order by x.updated_at desc),'[]'::jsonb) into v_students from (
    select r.updated_at,jsonb_build_object('id',r.id,'student_number',r.student_number,'first_name',r.first_name,'last_name',r.last_name,'entry_year',r.entry_year,'created_at',r.created_at,'updated_at',r.updated_at,
      'course_ids',coalesce((select jsonb_agg(rc.course_id order by c.name_fa) from public.registration_courses rc join public.courses c on c.id=rc.course_id where rc.registration_id=r.id),'[]'::jsonb),
      'course_names',coalesce((select jsonb_agg(c.name_fa order by c.name_fa) from public.registration_courses rc join public.courses c on c.id=rc.course_id where rc.registration_id=r.id),'[]'::jsonb)) obj
    from public.registrations r) x;
  select coalesce(jsonb_agg(x.obj order by x.student_count desc,x.name_fa),'[]'::jsonb) into v_demand from (
    select c.name_fa,count(rc.registration_id)::integer student_count,jsonb_build_object('course_id',c.id,'name_fa',c.name_fa,'instructor',c.instructor,'level',c.level,'student_count',count(rc.registration_id)::integer) obj
    from public.courses c left join public.registration_courses rc on rc.course_id=c.id where c.active group by c.id,c.name_fa,c.instructor,c.level) x;
  select coalesce(jsonb_agg(x.obj order by x.common_students desc,x.course_1,x.course_2),'[]'::jsonb) into v_overlap from (
    select c1.name_fa course_1,c2.name_fa course_2,count(*)::integer common_students,jsonb_build_object('course_1_id',a.course_id,'course_1',c1.name_fa,'course_2_id',b.course_id,'course_2',c2.name_fa,'common_students',count(*)::integer) obj
    from public.registration_courses a join public.registration_courses b on a.registration_id=b.registration_id and a.course_id<b.course_id join public.courses c1 on c1.id=a.course_id join public.courses c2 on c2.id=b.course_id group by a.course_id,c1.name_fa,b.course_id,c2.name_fa) x;
  return jsonb_build_object('students',v_students,'course_demand',v_demand,'course_overlap',v_overlap);
end; $$;

create or replace function public.admin_update_registration(p_registration_id uuid,p_student_number text,p_first_name text,p_last_name text,p_entry_year text,p_course_ids text[],p_new_edit_pin text default null)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_bad integer;
begin
  if not public.is_admin() then raise exception 'دسترسی مدیر تأیید نشد.' using errcode='42501'; end if;
  p_student_number:=btrim(p_student_number); p_first_name:=btrim(p_first_name); p_last_name:=btrim(p_last_name); p_entry_year:=btrim(p_entry_year); p_new_edit_pin:=nullif(btrim(coalesce(p_new_edit_pin,'')),'');
  if p_student_number='' or p_first_name='' or p_last_name='' or p_entry_year='' then return jsonb_build_object('ok',false,'message','اطلاعات دانشجو کامل نیست.'); end if;
  if coalesce(array_length(p_course_ids,1),0)=0 then return jsonb_build_object('ok',false,'message','حداقل یک درس باید انتخاب شده باشد.'); end if;
  if p_new_edit_pin is not null and p_new_edit_pin !~ '^[0-9]{4,8}$' then return jsonb_build_object('ok',false,'message','کد ویرایش جدید باید ۴ تا ۸ رقم باشد.'); end if;
  select count(*) into v_bad from unnest(p_course_ids) x where not exists(select 1 from public.courses c where c.id=x and c.active);
  if v_bad>0 then return jsonb_build_object('ok',false,'message','یک یا چند درس انتخاب‌شده معتبر نیست.'); end if;
  begin
    update public.registrations set student_number=p_student_number,first_name=p_first_name,last_name=p_last_name,entry_year=p_entry_year,edit_pin_hash=case when p_new_edit_pin is null then edit_pin_hash else extensions.crypt(p_new_edit_pin,extensions.gen_salt('bf')) end,updated_at=now() where id=p_registration_id;
  exception when unique_violation then return jsonb_build_object('ok',false,'message','این شماره دانشجویی قبلاً برای دانشجوی دیگری ثبت شده است.'); end;
  if not found then return jsonb_build_object('ok',false,'message','رکورد دانشجو پیدا نشد.'); end if;
  delete from public.registration_courses where registration_id=p_registration_id;
  insert into public.registration_courses(registration_id,course_id) select p_registration_id,x from unnest(p_course_ids) x on conflict do nothing;
  return jsonb_build_object('ok',true,'updated_at',now());
end; $$;

create or replace function public.admin_delete_registration(p_registration_id uuid)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not public.is_admin() then raise exception 'دسترسی مدیر تأیید نشد.' using errcode='42501'; end if;
  delete from public.registrations where id=p_registration_id;
  if not found then return jsonb_build_object('ok',false,'message','رکورد دانشجو پیدا نشد.'); end if;
  return jsonb_build_object('ok',true);
end; $$;

revoke all on function public.admin_dashboard() from public;
revoke all on function public.admin_update_registration(uuid,text,text,text,text,text[],text) from public;
revoke all on function public.admin_delete_registration(uuid) from public;
grant execute on function public.admin_dashboard() to authenticated;
grant execute on function public.admin_update_registration(uuid,text,text,text,text,text[],text) to authenticated;
grant execute on function public.admin_delete_registration(uuid) to authenticated;

commit;

-- پس از پایان موفق، جدول registrations باید صفر رکورد داشته باشد.
-- سامانه پیش‌ثبت‌نام گروه آمار - ارتقا به نسخه 0.5
-- این فایل اطلاعات دانشجویان و انتخاب‌های موجود را حذف نمی‌کند.
-- قابلیت مدیریت کامل دروس را به پنل مدیر اضافه می‌کند.

begin;

create or replace function public.admin_dashboard()
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_students jsonb; v_demand jsonb; v_overlap jsonb; v_courses jsonb;
begin
  if not public.is_admin() then raise exception 'دسترسی مدیر تأیید نشد.' using errcode='42501'; end if;

  select coalesce(jsonb_agg(x.obj order by x.updated_at desc),'[]'::jsonb) into v_students from (
    select r.updated_at,jsonb_build_object(
      'id',r.id,'student_number',r.student_number,'first_name',r.first_name,'last_name',r.last_name,'entry_year',r.entry_year,
      'created_at',r.created_at,'updated_at',r.updated_at,
      'course_ids',coalesce((select jsonb_agg(rc.course_id order by c.name_fa) from public.registration_courses rc join public.courses c on c.id=rc.course_id where rc.registration_id=r.id),'[]'::jsonb),
      'course_names',coalesce((select jsonb_agg(c.name_fa order by c.name_fa) from public.registration_courses rc join public.courses c on c.id=rc.course_id where rc.registration_id=r.id),'[]'::jsonb)
    ) obj
    from public.registrations r
  ) x;

  select coalesce(jsonb_agg(x.obj order by x.name_fa),'[]'::jsonb) into v_courses from (
    select c.name_fa,jsonb_build_object(
      'id',c.id,'name_fa',c.name_fa,'instructor',c.instructor,'credits',c.credits,'level',c.level,'main_entry',c.main_entry,
      'allowed_entries',to_jsonb(c.allowed_entries),'out_of_chart',c.out_of_chart,'active',c.active,
      'student_count',(select count(*)::integer from public.registration_courses rc where rc.course_id=c.id)
    ) obj
    from public.courses c
  ) x;

  select coalesce(jsonb_agg(x.obj order by x.student_count desc,x.name_fa),'[]'::jsonb) into v_demand from (
    select c.name_fa,count(rc.registration_id)::integer student_count,jsonb_build_object(
      'course_id',c.id,'name_fa',c.name_fa,'instructor',c.instructor,'level',c.level,'active',c.active,
      'student_count',count(rc.registration_id)::integer
    ) obj
    from public.courses c left join public.registration_courses rc on rc.course_id=c.id
    group by c.id,c.name_fa,c.instructor,c.level,c.active
  ) x;

  select coalesce(jsonb_agg(x.obj order by x.common_students desc,x.course_1,x.course_2),'[]'::jsonb) into v_overlap from (
    select c1.name_fa course_1,c2.name_fa course_2,count(*)::integer common_students,jsonb_build_object(
      'course_1_id',a.course_id,'course_1',c1.name_fa,'course_2_id',b.course_id,'course_2',c2.name_fa,'common_students',count(*)::integer
    ) obj
    from public.registration_courses a
    join public.registration_courses b on a.registration_id=b.registration_id and a.course_id<b.course_id
    join public.courses c1 on c1.id=a.course_id
    join public.courses c2 on c2.id=b.course_id
    group by a.course_id,c1.name_fa,b.course_id,c2.name_fa
  ) x;

  return jsonb_build_object('students',v_students,'courses',v_courses,'course_demand',v_demand,'course_overlap',v_overlap);
end; $$;

-- مدیر می‌تواند انتخاب‌های قبلی یک درس غیرفعال را نیز برای دانشجو حفظ کند.
create or replace function public.admin_update_registration(
  p_registration_id uuid,p_student_number text,p_first_name text,p_last_name text,p_entry_year text,p_course_ids text[],p_new_edit_pin text default null
)
returns jsonb language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_bad integer;
begin
  if not public.is_admin() then raise exception 'دسترسی مدیر تأیید نشد.' using errcode='42501'; end if;
  p_student_number:=btrim(p_student_number); p_first_name:=btrim(p_first_name); p_last_name:=btrim(p_last_name); p_entry_year:=btrim(p_entry_year); p_new_edit_pin:=nullif(btrim(coalesce(p_new_edit_pin,'')),'');
  if p_student_number='' or p_first_name='' or p_last_name='' or p_entry_year='' then return jsonb_build_object('ok',false,'message','اطلاعات دانشجو کامل نیست.'); end if;
  if coalesce(array_length(p_course_ids,1),0)=0 then return jsonb_build_object('ok',false,'message','حداقل یک درس باید انتخاب شده باشد.'); end if;
  if p_new_edit_pin is not null and p_new_edit_pin !~ '^[0-9]{4,8}$' then return jsonb_build_object('ok',false,'message','کد ویرایش جدید باید ۴ تا ۸ رقم باشد.'); end if;
  select count(*) into v_bad from unnest(p_course_ids) x where not exists(select 1 from public.courses c where c.id=x);
  if v_bad>0 then return jsonb_build_object('ok',false,'message','یک یا چند درس انتخاب‌شده دیگر در سامانه وجود ندارد.'); end if;
  begin
    update public.registrations set student_number=p_student_number,first_name=p_first_name,last_name=p_last_name,entry_year=p_entry_year,
      edit_pin_hash=case when p_new_edit_pin is null then edit_pin_hash else extensions.crypt(p_new_edit_pin,extensions.gen_salt('bf')) end,updated_at=now()
    where id=p_registration_id;
  exception when unique_violation then return jsonb_build_object('ok',false,'message','این شماره دانشجویی قبلاً برای دانشجوی دیگری ثبت شده است.'); end;
  if not found then return jsonb_build_object('ok',false,'message','رکورد دانشجو پیدا نشد.'); end if;
  delete from public.registration_courses where registration_id=p_registration_id;
  insert into public.registration_courses(registration_id,course_id) select p_registration_id,x from unnest(p_course_ids) x on conflict do nothing;
  return jsonb_build_object('ok',true,'updated_at',now());
end; $$;

create or replace function public.admin_save_course(
  p_course_id text,
  p_name_fa text,
  p_instructor text,
  p_credits integer,
  p_level text,
  p_main_entry text,
  p_allowed_entries text[],
  p_out_of_chart boolean,
  p_active boolean
) returns jsonb
language plpgsql security definer set search_path = public, extensions, pg_temp as $$
declare v_id text;
begin
  if not public.is_admin() then raise exception 'دسترسی مدیر تأیید نشد.' using errcode='42501'; end if;
  p_name_fa:=btrim(coalesce(p_name_fa,'')); p_instructor:=btrim(coalesce(p_instructor,'')); p_level:=btrim(coalesce(p_level,'')); p_main_entry:=btrim(coalesce(p_main_entry,''));
  if p_name_fa='' or p_instructor='' then return jsonb_build_object('ok',false,'message','نام درس و استاد درس الزامی است.'); end if;
  if p_credits is null or p_credits<1 or p_credits>6 then return jsonb_build_object('ok',false,'message','تعداد واحد باید بین ۱ تا ۶ باشد.'); end if;
  if p_level not in ('Undergraduate','Graduate','PhD') then return jsonb_build_object('ok',false,'message','مقطع درس معتبر نیست.'); end if;
  if p_main_entry='' then return jsonb_build_object('ok',false,'message','ورودی اصلی درس را مشخص کنید.'); end if;

  if nullif(btrim(coalesce(p_course_id,'')),'') is null then
    v_id := 'course_' || substr(replace(gen_random_uuid()::text,'-',''),1,16);
    insert into public.courses(id,name_fa,instructor,credits,level,main_entry,allowed_entries,out_of_chart,active)
    values(v_id,p_name_fa,p_instructor,p_credits,p_level,p_main_entry,coalesce(p_allowed_entries,array[]::text[]),coalesce(p_out_of_chart,false),coalesce(p_active,true));
    return jsonb_build_object('ok',true,'created',true,'course_id',v_id);
  else
    v_id:=btrim(p_course_id);
    update public.courses set name_fa=p_name_fa,instructor=p_instructor,credits=p_credits,level=p_level,main_entry=p_main_entry,
      allowed_entries=coalesce(p_allowed_entries,array[]::text[]),out_of_chart=coalesce(p_out_of_chart,false),active=coalesce(p_active,true)
    where id=v_id;
    if not found then return jsonb_build_object('ok',false,'message','درس موردنظر پیدا نشد.'); end if;
    return jsonb_build_object('ok',true,'created',false,'course_id',v_id);
  end if;
end; $$;

create or replace function public.admin_delete_course(p_course_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare v_affected integer; v_name text;
begin
  if not public.is_admin() then raise exception 'دسترسی مدیر تأیید نشد.' using errcode='42501'; end if;
  select name_fa into v_name from public.courses where id=p_course_id;
  if v_name is null then return jsonb_build_object('ok',false,'message','درس موردنظر پیدا نشد.'); end if;
  select count(distinct registration_id)::integer into v_affected from public.registration_courses where course_id=p_course_id;
  delete from public.registration_courses where course_id=p_course_id;
  delete from public.courses where id=p_course_id;
  return jsonb_build_object('ok',true,'course_name',v_name,'affected_students',coalesce(v_affected,0));
end; $$;

revoke all on function public.admin_save_course(text,text,text,integer,text,text,text[],boolean,boolean) from public;
revoke all on function public.admin_delete_course(text) from public;
grant execute on function public.admin_save_course(text,text,text,integer,text,text,text[],boolean,boolean) to authenticated;
grant execute on function public.admin_delete_course(text) to authenticated;

commit;
