import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { branches, subjects, categories, resources, foundations, flashcards, solutions, suggestions, problemReports, contributors, templates } from '../../repositories';
import type { BaseDocument } from '../../types';
import { ADMIN_ENTITIES, type AdminEntityDefinition } from '../../features/admin/managerConfig';
import { createEmptyForm, createFormFromDocument, toFirestoreValues, type AdminFormValues } from '../../features/admin/entityForm';
import { validateAdminForm } from '../../features/admin/managerValidation';

type Repository = typeof branches;
const repos: Record<string, Repository> = { branches, subjects, categories, resources, foundations, flashcards, solutions, suggestions, problemReports, contributors, templates };

export function AdminManager() {
  const { domain = 'resources' } = useParams();
  const cfg = useMemo<AdminEntityDefinition | undefined>(() => ADMIN_ENTITIES.find((item) => item.id === domain), [domain]);
  const repo = domain ? repos[domain] : undefined;
  const [items, setItems] = useState<BaseDocument[]>([]);
  const [cursor, setCursor] = useState<string>();
  const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [values, setValues] = useState<AdminFormValues>(() => cfg ? createEmptyForm(cfg.fields) : {});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (!cfg || !repo) return;
    setItems([]); setCursor(undefined); setMore(false); setEditing(null); setValues(createEmptyForm(cfg.fields)); setErrors({});
    void load(true);
  }, [domain]);

  async function load(reset = false) {
    if (!repo) return;
    setLoading(true); setError('');
    try {
      const page = await repo.list({ pageSize: 20, cursor: reset ? undefined : cursor });
      setItems((current) => reset ? page.items : [...current, ...page.items]);
      setCursor(page.nextCursor); setMore(page.hasMore);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر تحميل البيانات.');
    } finally { setLoading(false); }
  }

  function updateField(key: string, value: string | number | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: '' }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); if (!repo || !cfg) return;
    const validation = validateAdminForm(cfg.fields, values);
    if (Object.keys(validation).length) { setErrors(validation); return; }
    setSaving(true); setError('');
    try {
      const payload = toFirestoreValues(cfg.fields, values);
      if (editing) await repo.update(editing, payload);
      else await repo.create(payload as Omit<BaseDocument, 'id' | 'createdAt' | 'updatedAt'>);
      cancelEdit(); await load(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'تعذر حفظ البيانات.');
    } finally { setSaving(false); }
  }

  function startEdit(item: BaseDocument) {
    if (!cfg) return;
    setEditing(item.id); setValues(createFormFromDocument(cfg.fields, item as unknown as Record<string, unknown>)); setErrors({}); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEdit() { if (cfg) setValues(createEmptyForm(cfg.fields)); setEditing(null); setErrors({}); }

  async function remove(id: string) {
    if (!repo || !window.confirm('حذف هذا العنصر؟ لا يمكن التراجع عن العملية.')) return;
    setError('');
    try { await repo.remove(id); await load(true); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر حذف العنصر.'); }
  }

  const filtered = search.trim() ? items.filter((item) => JSON.stringify(item).toLocaleLowerCase('ar').includes(search.trim().toLocaleLowerCase('ar'))) : items;
  if (!cfg || !repo) return <section><h1>القسم غير موجود</h1></section>;

  return <section>
    <div className="page-head"><h1>{cfg.label}</h1><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في الصفحة الحالية..." aria-label={`بحث في ${cfg.label}`} /></div>
    {error && <div className="card error" role="alert">{error}</div>}
    <form className="card form" onSubmit={submit} noValidate>
      <h2>{editing ? 'تعديل' : 'إضافة'} {cfg.label}</h2>
      {cfg.fields.map((field) => <label key={field.key}>
        {field.label}{field.required ? ' *' : ''}
        {field.type === 'textarea' ? <textarea value={String(values[field.key] ?? '')} onChange={(e) => updateField(field.key, e.target.value)} maxLength={5000} aria-invalid={Boolean(errors[field.key])} /> : field.type === 'checkbox' ? <input type="checkbox" checked={Boolean(values[field.key])} onChange={(e) => updateField(field.key, e.target.checked)} /> : <input type={field.type} value={String(values[field.key] ?? '')} onChange={(e) => updateField(field.key, field.type === 'number' ? e.target.value : e.target.value)} required={field.required} maxLength={field.type === 'text' ? 500 : undefined} aria-invalid={Boolean(errors[field.key])} placeholder={field.placeholder} />}
        {errors[field.key] && <small role="alert">{errors[field.key]}</small>}
      </label>)}
      <div className="actions"><button className="button" disabled={saving || loading}>{saving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديل' : 'إضافة'}</button>{editing && <button type="button" onClick={cancelEdit}>إلغاء</button>}</div>
    </form>
    <div className="list" aria-busy={loading}>
      {filtered.map((item) => { const row = item as BaseDocument & Record<string, unknown>; return <article className="card row" key={item.id}><div><h2>{String(row.title ?? row.name ?? item.id)}</h2><p>{String(row.description ?? row.content ?? '')}</p></div><div className="actions"><button onClick={() => startEdit(item)}>تعديل</button><button className="danger" onClick={() => void remove(item.id)}>حذف</button></div></article>; })}
      {!loading && !filtered.length && <p className="empty">لا توجد بيانات.</p>}
    </div>
    {loading && <p>جارٍ التحميل...</p>}
    {more && !loading && <button className="button" onClick={() => void load()}>تحميل المزيد</button>}
  </section>;
}
