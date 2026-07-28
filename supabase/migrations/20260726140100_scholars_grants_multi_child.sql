-- Allow one checkout/invoice to grant credits to multiple Scholars seats.

drop index if exists public.scholars_credit_grants_idempotent_invoice;
create unique index scholars_credit_grants_idempotent_invoice
  on public.scholars_credit_grants (child_user_id, stripe_invoice_id, kind)
  where stripe_invoice_id is not null;

drop index if exists public.scholars_credit_grants_idempotent_session;
create unique index scholars_credit_grants_idempotent_session
  on public.scholars_credit_grants (child_user_id, stripe_checkout_session_id, kind)
  where stripe_checkout_session_id is not null;
