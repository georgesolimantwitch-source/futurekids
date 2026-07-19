begin;

grant all on public.subscription_provider_events to service_role;
grant all on public.user_entitlements to service_role;
grant all on public.subscription_plan_changes to service_role;
grant all on public.subscription_plan_change_children to service_role;
grant all on public.user_entitlement_children to service_role;
grant all on public.family_child_app_access to service_role;

grant execute on function public.recompute_family_child_app_access(uuid, text)
  to service_role;
grant execute on function public.set_entitlement_child_assignments(uuid, uuid[], text)
  to service_role;
grant execute on function public.apply_subscription_provider_event(
  text,text,text,text,timestamptz,uuid,text,text,text,text,text,text,text,
  integer,integer,jsonb,jsonb,text,timestamptz,timestamptz,boolean,integer,
  text,text,boolean,text
) to service_role;

commit;
