const FIELD_META = {
  name:['اسم المادة/القسم','اكتب الاسم الذي سيظهر للمستخدمين'],
  description:['الوصف','وصف مختصر وواضح، اختياري'],
  icon:['الأيقونة','اسم أو رمز الأيقونة، اختياري'],
  order:['ترتيب العرض','رقم صحيح لتحديد ترتيب الظهور'],
  title:['عنوان المصدر','اكتب العنوان الذي سيظهر للطالب'],
  url:['رابط المصدر','الصق الرابط الكامل الذي سيصل إليه الطالب'],
  type:['النوع','حدد نوع المحتوى أو المصدر'],
  subjectId:['المادة','استخدم معرّف المادة المرتبطة بالمحتوى'],
  categoryId:['التصنيف','استخدم معرّف التصنيف المرتبط بالمحتوى'],
  branchIds:['الفروع','اكتب معرّفات الفروع المرتبطة، وافصل بينها بفواصل'],
  keywords:['الكلمات المفتاحية','اكتب الكلمات وافصل بينها بفواصل'],
  tags:['الوسوم','اكتب الوسوم وافصل بينها بفواصل'],
  author:['المؤلف','اسم المؤلف إن وجد، اختياري'],
  level:['المستوى','المستوى الدراسي أو مستوى المحتوى'],
  category:['التصنيف','اسم التصنيف'],
  categoryName:['اسم التصنيف','اكتب اسم التصنيف'],
  problem:['المشكلة','اكتب المشكلة بوضوح'],
  solution:['الحل','اكتب الحل المقترح أو المعتمد'],
  steps:['الخطوات','اكتب خطوات الحل بالتفصيل'],
  notes:['ملاحظات','ملاحظات داخلية أو إضافية، اختياري'],
  status:['الحالة','الحالة الحالية للعنصر'],
  question:['السؤال','اكتب نص السؤال'],
  answer:['الإجابة','اكتب الإجابة الصحيحة أو المتوقعة'],
  explanation:['الشرح','شرح الإجابة، اختياري'],
  target:['نوع القالب','حدد نوع البيانات التي يستخدم لها القالب'],
  fields:['الحقول','أسماء الحقول التي يتضمنها القالب، مفصولة بفواصل'],
  instructions:['التعليمات','تعليمات استخدام القالب، مفصولة بفواصل'],
  sourceTitle:['عنوان المصدر','العنوان الظاهر للمصدر'],
  kind:['نوع البلاغ','حدد نوع المشكلة أو البلاغ'],
  contentType:['نوع المحتوى','حدد نوع المحتوى'],
  email:['البريد الإلكتروني','البريد الإلكتروني للمشرف'],
  role:['الصلاحية','اختر صلاحية المشرف'],
  active:['نشط','هل يظهر العنصر ويُستخدم حاليًا؟'],
  needsReview:['بحاجة إلى مراجعة','حددها إذا كان العنصر يحتاج مراجعة']
};
const TECHNICAL_FIELDS = new Set(['stableId','sourceId','path','mimeType','provider','createdByEmail','publishedResourceId','createdBy','reviewedBy','adminUid','adminEmail','targetId','action','collection']);
const REQUIRED = new Set(['name','title','url','question','answer','email','role']);
function enhance(root=document) {
  const form=root.querySelector('#editForm');
  if(!form || form.dataset.enhanced==='1') return;
  form.dataset.enhanced='1';
  form.querySelectorAll(':scope > label, :scope > .check').forEach(label=>{
    const control=label.querySelector('[name]'); if(!control)return;
    const key=control.name; const meta=FIELD_META[key];
    if(TECHNICAL_FIELDS.has(key)) { label.style.display='none'; control.removeAttribute('name'); return; }
    if(meta){
      const text=label.firstChild;
      if(text && text.nodeType===Node.TEXT_NODE) text.textContent=meta[0]+' ';
      label.setAttribute('data-field-help',meta[1]);
      control.setAttribute('aria-label',meta[0]);
      if(meta[1] && control.tagName!=='INPUT' || meta[1] && control.tagName==='INPUT') control.setAttribute('placeholder',meta[1]);
      if(REQUIRED.has(key)) control.setAttribute('required','required');
    }
  });
}
new MutationObserver(()=>enhance()).observe(document.getElementById('adminApp')||document.body,{subtree:true,childList:true});
setTimeout(()=>enhance(),0);
