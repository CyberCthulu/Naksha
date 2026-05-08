alter table public.journals
  drop constraint if exists journals_chart_id_fkey;

alter table public.journals
  add constraint journals_chart_id_fkey
  foreign key (chart_id)
  references public.charts(id)
  on delete set null;
