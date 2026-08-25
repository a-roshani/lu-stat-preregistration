-- ابتدا کاربر مدیر را در Supabase > Authentication > Users بسازید.
-- سپس ایمیل مدیر را در خط زیر جایگزین و این Query را اجرا کنید.

insert into public.admins(user_id)
select id
from auth.users
where email = 'roshani.amin@gmail.com'
on conflict (user_id) do nothing;

-- کنترل نتیجه
select a.user_id, u.email, a.created_at
from public.admins a
join auth.users u on u.id = a.user_id;
