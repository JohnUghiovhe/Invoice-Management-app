create table if not exists public.invoices (
  id text primary key,
  status text not null check (status in ('draft', 'pending', 'paid')),
  payload jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_invoice_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
before update on public.invoices
for each row
execute function public.set_invoice_updated_at();

create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_created_at_idx on public.invoices(created_at);