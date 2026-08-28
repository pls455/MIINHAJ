import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { branches, subjects, categories } from '../../repositories';
import type { BaseDocument } from '../../types';
import { ADMIN_ENTITIES, type AdminEntityDefinition } from '../../features/admin/managerConfig';
import { createEmptyForm, createFormFromDocument, toFirestoreValues, type AdminFormValues } from '../../features/admin/entityForm';
import { validateAdminForm } from '../../features/admin/managerValidation';
import { validateRelationshipIds } from '../../features/admin/relationships';
import { adminRepositories } from '../../features/admin/adminRepositoryMap';

type RelationshipOption = { id: string; label: string; active?: boolean };
type RelationState = { branches: RelationshipOption[]; subjects: RelationshipOption[]; categories: RelationshipOption[] };
const EMPTY_RELATIONS: RelationState = { branches: [], subjects: [], categories: [] };

export function AdminManager() {
  const { domain = 'resources' } = useParams();
  const cfg = useMemo<AdminEntityDefinition | undefined>(() => ADMIN_ENTITIES.find((item) => item.id === domain), [domain]);
  const repo = domain ? adminRepositories[domain] : undefined;
  const [items, setItems] = useState<BaseDocument[]>([]); const [cursor, setCursor] = useState<string>(); const [more, setMore] = useState(false);
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [relationsLoading, setRelationsLoading] = useState(false);
  const [search, setSearch] = useState(''); const [editing, setEditing] = useState<string | null>(null); const [values, setValues] = useState<AdminFormValues>(() => cfg ? createEmptyForm(cfg.fields) : {});
  const [errors, setErrors] = useState<Record<string, string>>({}); const [error, setError] = useState(''); const [relations, setRelations] = useState<RelationState>(EMPTY_RELATIONS);

  useEffect(() => { if (!cfg || !repo) return; setItems([]); setCursor(undefined); setMore(false); setEditing(null); setSearch(''); setValues(createEmptyForm(cfg.fields)); setErrors({}); void load(true, ''); }, [domain, cfg, repo]);

  useEffect(() => {
    if (!domain || !['resources', 'subjects'].includes(domain)) return;
    let cancelled = false; setRelationsLoading(true);
    Promise.all([branches.list({ pageSize: 100 }), subjects.list({ pageSize: 100 }), categories.list({ pageSize: 100 })])
      .then(([b, s, c]) => { if (cancelled) return; const map = (page: { items: BaseDocument[] }): RelationshipOption[] => page.items.map((item) => { const r = item as BaseDocument & Record<string, unknown>; return { id: item.id, label: String(r.name ?? r.title ?? item.id), active: r.active === undefined ? true : Boolean(r.active) }; }); setRelations({ branches: map(b), subjects: map(s), categories: map(c) }); })
      .catch((e: unknown) => { if (!cancelled) setError(e instanceof Error ? e.message : 'تعذر تحميل خيارات العلاقات.'); })
      .finally(() => { if (!cancelled) setRelationsLoading(false); });
    return () => { cancelled = true; };
  }, [domain]);

  useEffect(() => {
    if (!repo || !cfg || !search.trim()) return;
    const timer = window.setTimeout(() => { void load(true, search); }, 300);
    return () => window.clearTimeout(timer);
  }, [search, domain, repo, cfg]);

  async function load(reset = false, requestedSearch = search) {
    if (!repo) return;
    setLoading(true); setError('');
    try { const page = await repo.list({ pageSize: 20, cursor: reset ? undefined : cursor, search: requestedSearch.trim() || undefined }); setItems((current) => reset ? page.items : [...current, ...page.items]); setCursor(page.nextCursor); setMore(page.hasMore); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر تحميل البيانات.'); }
    finally { setLoading(false); }
  }

  function updateField(key: string, value: string | number | boolean | string[]) { setValues((current) => ({ ...current, [key]: value })); setErrors((current) => ({ ...current, [key]: '' })); }
  function updateSelect(fieldKey: string, event: React.ChangeEvent<HTMLSelectElement>) {
    const field = cfg?.fields.find((item) => item.key === fieldKey);
    const value = field?.multiple ? Array.from(event.target.selectedOptions, (option) => option.value) : event.target.value;
    updateField(fieldKey, value);
  }
  async function submit(event: FormEvent) {
    event.preventDefault(); if (!repo || !cfg) return;
    const validation = validateAdminForm(cfg.fields, values);
    const relationshipErrors = domain === 'resources' ? validateRelationshipIds({ branchId: typeof values.branchId === 'string' ? values.branchId : undefined, branchIds: Array.isArray(values.branchIds) ? values.branchIds.filter((id): id is string => typeof id === 'string') : undefined, subjectId: typeof values.subjectId === 'string' ? values.subjectId : undefined, categoryId: typeof values.categoryId === 'string' ? values.categoryId : undefined }, relations) : {};
    const allErrors = { ...validation, ...relationshipErrors }; if (Object.keys(allErrors).length) { setErrors(allErrors); return; }
    setSaving(true); setError('');
    try { const payload = toFirestoreValues(cfg.fields, values); if (editing) await repo.update(editing, payload); else await repo.create(payload); cancelEdit(); await load(true, search); }
    catch (e) { setError(e instanceof Error ? e.message : 'تعذر حفظ البيانات.'); } finally { setSaving(false); }
  }
  function startEdit(item: BaseDocument) { if (!cfg) return; setEditing(item.id); setValues(createFormFromDocument(cfg.fields, item as unknown as Record<string, unknown>)); setErrors({}); setError(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  function cancelEdit() { if (cfg) setValues(createEmptyForm(cfg.fields)); setEditing(null); setErrors({}); }
  async function remove(id: string) { if (!repo || !window.confirm('حذف هذا العنصر؟ لا يمكن التراجع عن العملية.')) return; try { await repo.remove(id); await load(true, search); } catch (e) { setError(e instanceof Error ? e.message : 'تعذر حذف العنصر.'); } }

  if (!cfg || !repo) return <section><h1>القسم غير موجود</h1></section>;
  const relationOptions: Record<string, RelationshipOption[]> = { branchIds: relations.branches, branchId: relations.branches, subjectId: relations.subjects, categoryId: relations.categories };
  return <section>
    <div className="page-head"><h1>{cfg.label}</h1><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="بحث في البيانات..." aria-label={`بحث في ${cfg.label}`} /></div>
    {error && <div className="card error" role="alert">{error}</div>}
    <form className="card form" onSubmit={submit} noValidate><h2>{editing ? 'تعديل' : 'إضافة'} {cfg.label}</h2>
      {cfg.fields.map((field) => <label key={field.key}>{field.label}{field.required ? ' *' : ''}
        {field.type === 'select' ? <select multiple={Boolean(field.multiple)} value={field.multiple ? (Array.isArray(values[field.key]) ? values[field.key] as string[] : []) : String(values[field.key] ?? '')} onChange={(e) => updateSelect(field.key, e)} disabled={relationsLoading} aria-invalid={Boolean(errors[field.key])} aria-label={field.label}>{!field.multiple && <option value="">اختر...</option>}{(relationOptions[field.key] ?? []).filter((option) => option.active !== false).map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select> : field.type === 'textarea' ? <textarea value={String(values[field.key] ?? '')} onChange={(e) => updateField(field.key, e.target.value)} maxLength={5000} aria-invalid={Boolean(errors[field.key])} /> : field.type === 'checkbox' ? <input type="checkbox" checked={Boolean(values[field.key])} onChange={(e) => updateField(field.key, e.target.checked)} /> : <input type={field.type} value={String(values[field.key] ?? '')} onChange={(e) => updateField(field.key, e.target.value)} required={field.required} maxLength={field.type === 'text' ? 500 : undefined} aria-invalid={Boolean(errors[field.key])} placeholder={field.placeholder} />}
        {field.multiple && <small>استخدم Ctrl/⌘ لتحديد أكثر من خيار.</small>}{errors[field.key] && <small role="alert">{errors[field.key]}</small>}</label>)}
      <div className="actions"><button className="button" disabled={saving || loading || relationsLoading}>{saving ? 'جارٍ الحفظ...' : editing ? 'حفظ التعديل' : 'إضافة'}</button>{editing && <button type="button" onClick={cancelEdit}>إلغاء</button>}</div>
    </form>
    <div className="list" aria-busy={loading}>{items.map((item) => { const row = item as BaseDocument & Record<string, unknown>; return <article className="card row" key={item.id}><div><h2>{String(row.title ?? row.name ?? item.id)}</h2><p>{String(row.description ?? row.content ?? '')}</p></div><div className="actions"><button onClick={() => startEdit(item)}>تعديل</button><button className="danger" onClick={() => void remove(item.id)}>حذف</button></div></article>; })}{!loading && !items.length && <p className="empty">لا توجد بيانات.</p>}</div>
    {loading && <p>جارٍ التحميل...</p>}{more && !loading && <button className="button" onClick={() => void load(false, search)}>تحميل المزيد</button>}
  </section>;
}
