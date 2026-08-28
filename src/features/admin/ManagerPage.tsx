import { useEffect, useMemo, useState } from 'react';
import { ADMIN_ENTITIES, type AdminEntityDefinition, type AdminFieldDefinition } from './managerConfig';

type Option = { id: string; label: string };
type RecordValue = string | number | boolean | string[];
type RecordData = Record<string, RecordValue>;

interface AdminRepository {
  list: (collection: string, limit: number) => Promise<RecordData[]>;
  create: (collection: string, data: RecordData) => Promise<void>;
  update: (collection: string, id: string, data: RecordData) => Promise<void>;
  remove: (collection: string, id: string) => Promise<void>;
}

interface ManagerPageProps {
  repository: AdminRepository;
  canManage: (permission: AdminEntityDefinition['permission']) => boolean;
  relationOptions: Record<'branches' | 'subjects' | 'categories', Option[]>;
}

const emptyValue = (field: AdminFieldDefinition): RecordValue => {
  if (field.type === 'checkbox') return false;
  if (field.type === 'number') return 0;
  return field.multiple ? [] : '';
};

export function ManagerPage({ repository, canManage, relationOptions }: ManagerPageProps) {
  const [entityId, setEntityId] = useState(ADMIN_ENTITIES[0]?.id ?? '');
  const [rows, setRows] = useState<RecordData[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<RecordData>({});
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entity = useMemo(() => ADMIN_ENTITIES.find((item) => item.id === entityId), [entityId]);
  const visibleEntities = useMemo(() => ADMIN_ENTITIES.filter((item) => canManage(item.permission)), [canManage]);
  const filteredRows = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase();
    if (!needle) return rows;
    return rows.filter((row) => Object.values(row).some((value) => String(value).toLocaleLowerCase().includes(needle)));
  }, [rows, search]);

  useEffect(() => {
    if (!entity) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    repository.list(entity.collection, 20).then((data) => { if (!cancelled) setRows(data); }).catch(() => { if (!cancelled) setError('تعذر تحميل البيانات'); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [entity, repository]);

  const startCreate = () => {
    if (!entity) return;
    setEditingId(null);
    setForm(Object.fromEntries(entity.fields.map((field) => [field.key, emptyValue(field)])) as RecordData);
  };

  const startEdit = (row: RecordData) => {
    if (!entity) return;
    setEditingId(String(row.id ?? ''));
    setForm(Object.fromEntries(entity.fields.map((field) => [field.key, row[field.key] ?? emptyValue(field)])) as RecordData);
  };

  const setField = (field: AdminFieldDefinition, value: RecordValue) => setForm((current) => ({ ...current, [field.key]: value }));

  const save = async () => {
    if (!entity) return;
    for (const field of entity.fields) {
      if (field.required && (form[field.key] === undefined || form[field.key] === '' || (Array.isArray(form[field.key]) && form[field.key].length === 0))) {
        setError(`الحقل مطلوب: ${field.label}`);
        return;
      }
      if (field.type === 'url' && form[field.key] && !/^https?:\\/\\//i.test(String(form[field.key]))) {
        setError(`الرابط غير صالح: ${field.label}`);
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      if (editingId) await repository.update(entity.collection, editingId, form);
      else await repository.create(entity.collection, form);
      setEditingId(null);
      setForm({});
      setRows(await repository.list(entity.collection, 20));
    } catch { setError('تعذر حفظ التغييرات'); }
    finally { setSaving(false); }
  };

  const remove = async (row: RecordData) => {
    if (!entity || !row.id || !window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) return;
    setError(null);
    try { await repository.remove(entity.collection, String(row.id)); setRows((current) => current.filter((item) => item.id !== row.id)); }
    catch { setError('تعذر حذف العنصر'); }
  };

  if (!entity) return <section dir="rtl">لا توجد أقسام متاحة.</section>;

  return <section dir="rtl" className="admin-manager">
    <header className="admin-manager__header">
      <h1>إدارة المحتوى</h1>
      <select value={entity.id} onChange={(event) => { setEntityId(event.target.value); setEditingId(null); setForm({}); }} aria-label="قسم الإدارة">
        {visibleEntities.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
      </select>
      <button type="button" onClick={startCreate}>إضافة جديد</button>
    </header>

    <div className="admin-manager__toolbar">
      <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="بحث في النتائج المحملة" aria-label="بحث" />
    </div>

    {error && <div role="alert">{error}</div>}
    {loading ? <div aria-live="polite">جاري التحميل...</div> : <div className="admin-manager__list">
      {filteredRows.map((row, index) => <article key={String(row.id ?? index)} className="admin-manager__row">
        <strong>{String(row.title ?? row.name ?? row.question ?? row.id ?? 'بدون عنوان')}</strong>
        <div><button type="button" onClick={() => startEdit(row)}>تعديل</button><button type="button" onClick={() => void remove(row)}>حذف</button></div>
      </article>)}
      {!filteredRows.length && <p>لا توجد بيانات.</p>}
    </div>}

    {(editingId !== null || Object.keys(form).length > 0) && <form onSubmit={(event) => { event.preventDefault(); void save(); }} className="admin-manager__form">
      {entity.fields.map((field) => {
        const value = form[field.key] ?? emptyValue(field);
        if (field.type === 'checkbox') return <label key={field.key}><input type="checkbox" checked={Boolean(value)} onChange={(event) => setField(field, event.target.checked)} />{field.label}</label>;
        if (field.type === 'select' && field.relation) {
          const options = relationOptions[field.relation];
          if (field.multiple) return <label key={field.key}>{field.label}<select multiple value={Array.isArray(value) ? value : []} onChange={(event) => setField(field, Array.from(event.target.selectedOptions, (option) => option.value))}>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>;
          return <label key={field.key}>{field.label}<select value={String(value)} onChange={(event) => setField(field, event.target.value)}><option value="">اختر...</option>{options.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}</select></label>;
        }
        const common = { value: String(value), required: field.required, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(field, field.type === 'number' ? Number(event.target.value) : event.target.value) };
        return field.type === 'textarea' ? <label key={field.key}>{field.label}<textarea {...common} /></label> : <label key={field.key}>{field.label}<input {...common} type={field.type === 'number' ? 'number' : field.type === 'url' ? 'url' : 'text'} /></label>;
      })}
      <button type="submit" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
      <button type="button" onClick={() => { setEditingId(null); setForm({}); }}>إلغاء</button>
    </form>}
  </section>;
}
