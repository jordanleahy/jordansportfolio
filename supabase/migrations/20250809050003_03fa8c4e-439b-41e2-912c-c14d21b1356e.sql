
-- 1) Fix the function to select the correct Free tier
create or replace function public.assign_free_plan_to_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  free_tier_id uuid;
begin
  -- Pick an active tier whose name starts with 'free'
  select st.id
    into free_tier_id
  from public.subscription_tiers st
  where st.is_active = true
    and lower(st.name) like 'free%'
  order by st.price_cents asc, st.max_gpt_images asc
  limit 1;

  if free_tier_id is not null then
    insert into public.user_subscriptions (
      user_id, tier_id, status, current_period_start, current_period_end
    )
    values (
      NEW.id, free_tier_id, 'active', now(), now() + interval '30 days'
    );
  end if;

  return NEW;
end;
$$;

-- 2) Ensure trigger is attached and points to this function
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.assign_free_plan_to_new_user();

-- 3) Backfill for existing users who are missing a subscription
with free_tier as (
  select id
  from public.subscription_tiers
  where is_active = true
    and lower(name) like 'free%'
  order by price_cents asc, max_gpt_images asc
  limit 1
)
insert into public.user_subscriptions (user_id, tier_id, status, current_period_start, current_period_end)
select u.id, ft.id, 'active', now(), now() + interval '30 days'
from auth.users u
cross join free_tier ft
left join public.user_subscriptions us on us.user_id = u.id
where us.user_id is null;

-- 4) Prevent duplicates going forward
create unique index if not exists user_subscriptions_user_id_uidx
  on public.user_subscriptions (user_id);
