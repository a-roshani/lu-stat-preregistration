-- سامانه پیش‌ثبت‌نام گروه آمار - پایگاه داده اولیه
-- این فایل را فقط یک بار در Supabase > SQL Editor اجرا کنید.

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
