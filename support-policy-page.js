'use strict';
(function(){
 const language=document.getElementById('policyLanguage');
 const question=document.getElementById('policyQuestion');
 const answer=document.getElementById('policyAnswer');
 const source=document.getElementById('policySource');
 if(!language||!question||!answer||!source)return;
 const questions={
  en:['What is ZOVRO?','Do I need a license to join ZOVRO?','Why do you need my location?','Where are my account settings?','How do I contact my assigned provider?','Does verification replace a license?'],
  ar:['ما هو ZOVRO؟','هل الرخصة إلزامية للتسجيل؟','لماذا تحتاجون موقعي؟','أين إعدادات حسابي؟','كيف أتواصل مع مقدم الخدمة المعين؟','هل التحقق يغني عن الترخيص؟'],
  es:['¿Qué es ZOVRO?','¿Necesito una licencia para registrarme en ZOVRO?','¿Por qué necesitan mi ubicación?','¿Dónde están los ajustes de mi cuenta?','¿Cómo contacto a mi proveedor asignado?','¿La verificación reemplaza una licencia?']
 };
 const elements=[...document.querySelectorAll('[data-z-i18n]')];
 const english={};
 for(const el of elements)english[el.dataset.zI18n]=el.innerHTML;
 const dictionaries={
  en:english,
  ar:{
   title:'الدعم',
   updated:'آخر تحديث: 12 نوفمبر 2026',
   intro:'اعثر على المساعدة المتعلقة بحساب ZOVRO وطلبات الخدمات ومسائل السلامة.',
   automated:'الدعم الآلي',
   language:'اللغة',
   faq:'الأسئلة الشائعة',
   viewAnswer:'عرض الإجابة',
   accountTitle:'مساعدة الحساب',
   accountText:'افتح الملف الشخصي لمراجعة حسابك والإشعارات وتفاصيل مقدم الخدمة وخيارات حذف الحساب.',
   deleteTitle:'حذف حسابك وبياناتك',
   deleteText:'يمكنك حذف حساب ZOVRO من التطبيق مباشرة: سجّل الدخول، وافتح <strong>الملف الشخصي والأمان</strong>، واضغط <strong>حذف الحساب</strong> ثم أكّد. إذا لم تتمكن من الوصول إلى حسابك، فتواصل عبر <a href="mailto:support@zovro.work">support@zovro.work</a> واطلب الحذف باستخدام رقم الهاتف أو البريد الإلكتروني المرتبط بحسابك.',
   retentionText:'تُحذف معرّفات الحساب وبيانات الملف الشخصي النشطة أو تزال منها المعلومات المعرّفة للهوية في الاستخدام النشط. وتُحذف الطلبات المفتوحة والجلسات والإشعارات وسجلات الموقع النشطة أو يُفصل ارتباطها بالحساب حسب الحالة. وقد تُحتفظ ببعض سجلات المعاملات المكتملة أو منع الاحتيال أو النزاعات أو الأمان أو الضرائب أو المحاسبة أو المتطلبات القانونية عند الحاجة المعقولة أو إذا تطلب القانون ذلك.',
   requestTitle:'المساعدة بشأن طلبات الخدمة',
   requestText:'افتح الطلبات أو الرسائل لمراجعة العمل الجاري والتواصل مع مقدم الخدمة المكلّف ومتابعة حالة الطلب.',
   safetyTitle:'السلامة',
   safetyText:'إذا كنت في خطر فوري أو تحتاج إلى الشرطة أو الإطفاء أو المساعدة الطبية، فاتصل بالرقم 911. طلبات المساعدة على الطريق أو SOS في ZOVRO ليست بديلًا عن خدمات الطوارئ.',
   licenseTitle:'متطلبات التراخيص',
   licenseText:'لا تفرض ZOVRO ترخيصًا تجاريًا أو مهنيًا موحدًا على جميع المسجلين. ومع ذلك، يجب أن يحمل مقدمو الخدمات التراخيص أو التصاريح السارية المطلوبة قانونًا للخدمة ومكان تنفيذها، بما في ذلك المتطلبات المحلية أو التابعة للولاية أو الفيدرالية. التسجيل لا يمنح إذنًا بتنفيذ أعمال منظمة قانونًا. ولا تُمنح شارة الترخيص إلا بعد التحقق.',
   verificationTitle:'التحقق من مقدمي الخدمات',
   verificationText:'يجب على مقدمي الخدمات الحفاظ على دقة معلومات التراخيص والمؤهلات. ولا تحل حالة التحقق محل أي ترخيص أو تصريح أو تأمين مطلوب قانونًا.',
   contactTitle:'التواصل مع الدعم',
   contactText:'احصل على المساعدة داخل ZOVRO. اطرح سؤالك بالإنجليزية أو العربية أو الإسبانية. سجّل الدخول لإرسال الأسئلة المعقدة إلى فريق الدعم للمراجعة.',
   chatLink:'المحادثة مع الدعم',
   noticeText:'تخضع الردود لسياسات دعم ZOVRO. حفظ تذكرة الدعم لا يعني الاتصال بموظف مباشرة، ولا يمكن ضمان وقت الرد.',
   emailText:'البريد الرسمي للدعم: support@zovro.work',
   back:'← العودة إلى ZOVRO'
  },
  es:{
   title:'Soporte',
   updated:'Última actualización: 12 de noviembre de 2026',
   intro:'Encuentra ayuda para tu cuenta de ZOVRO, solicitudes de servicio y cuestiones de seguridad.',
   automated:'Asistencia automática',
   language:'Idioma',
   faq:'Preguntas frecuentes',
   viewAnswer:'Ver respuesta',
   accountTitle:'Ayuda con la cuenta',
   accountText:'Abre Perfil para revisar tu cuenta, notificaciones, datos del proveedor u opciones para eliminar tu cuenta.',
   deleteTitle:'Eliminar tu cuenta y tus datos',
   deleteText:'Puedes eliminar tu cuenta de ZOVRO directamente desde la aplicación: inicia sesión, abre <strong>Perfil y seguridad</strong>, pulsa <strong>Eliminar cuenta</strong> y confirma. Si no puedes acceder a tu cuenta, escribe a <a href="mailto:support@zovro.work">support@zovro.work</a> y solicita la eliminación usando el teléfono o correo electrónico vinculado a tu cuenta.',
   retentionText:'Los identificadores y datos activos del perfil se eliminan o se desidentifican del uso activo. Las solicitudes abiertas, sesiones, notificaciones y registros de ubicación activos se eliminan o desvinculan según corresponda. Algunos registros de transacciones completadas, prevención de fraude, disputas, seguridad, impuestos, contabilidad o asuntos legales pueden conservarse cuando sea razonablemente necesario o la ley lo exija.',
   requestTitle:'Ayuda con solicitudes de servicio',
   requestText:'Abre Solicitudes o Mensajes para revisar un trabajo activo, contactar al proveedor asignado y seguir el estado del servicio.',
   safetyTitle:'Seguridad',
   safetyText:'Si corres peligro inmediato o necesitas policía, bomberos o asistencia médica, llama al 911. Las solicitudes de asistencia en carretera o SOS de ZOVRO no sustituyen los servicios de emergencia.',
   licenseTitle:'Requisitos de licencias',
   licenseText:'ZOVRO no exige una licencia comercial o profesional general para registrarse. Los proveedores deben tener las licencias o permisos vigentes legalmente requeridos para cada servicio y lugar antes de realizar el trabajo, incluidos los requisitos estatales, locales o federales aplicables. Registrarse no autoriza trabajos regulados. La insignia de licencia requiere verificación.',
   verificationTitle:'Verificación de proveedores',
   verificationText:'Los proveedores deben mantener actualizada la información sobre licencias y cualificaciones. La verificación no sustituye ninguna licencia, permiso o seguro exigido legalmente.',
   contactTitle:'Contactar a soporte',
   contactText:'Obtén ayuda dentro de ZOVRO. Haz tu pregunta en inglés, árabe o español. Inicia sesión para enviar preguntas complejas al equipo de soporte para su revisión.',
   chatLink:'Chatear con soporte',
   noticeText:'Las respuestas siguen las políticas de soporte de ZOVRO. Una solicitud guardada no equivale a una conversación con un agente en vivo, y no se garantiza un tiempo de respuesta.',
   emailText:'Correo oficial de soporte: support@zovro.work',
   back:'← Volver a ZOVRO'
  }
 };
 const sourceLabels={
  ar:{'Licensing requirements':'متطلبات التراخيص','Marketplace role':'دور المنصة','Location':'الموقع','Account help':'مساعدة الحساب','Service request help':'طلبات الخدمة','Provider verification':'التحقق من مقدمي الخدمات','Safety':'السلامة'},
  es:{'Licensing requirements':'Requisitos de licencias','Marketplace role':'Función de la plataforma','Location':'Ubicación','Account help':'Ayuda con la cuenta','Service request help':'Solicitudes de servicio','Provider verification':'Verificación de proveedores','Safety':'Seguridad'}
 };
 function locale(){return Object.hasOwn(dictionaries,language.value)?language.value:'en'}
 function refresh(){
  const lang=locale(),dictionary=dictionaries[lang],rtl=lang==='ar';
  document.documentElement.lang=lang;
  document.documentElement.dir=rtl?'rtl':'ltr';
  document.title=dictionary.title+' — ZOVRO';
  for(const el of elements)el.innerHTML=dictionary[el.dataset.zI18n]??english[el.dataset.zI18n]??'';
  const back=document.querySelector('.z-doc-back');
  if(back)back.setAttribute('aria-label',lang==='ar'?'العودة إلى الصفحة الرئيسية':lang==='es'?'Volver al inicio':'Back to ZOVRO home');
  question.replaceChildren();
  for(const text of questions[lang]){
   const option=document.createElement('option');option.value=text;option.textContent=text;question.appendChild(option);
  }
  answer.textContent='';
  source.replaceChildren();
 }
 language.addEventListener('change',refresh);
 document.getElementById('policyAsk').addEventListener('click',()=>{
  const lang=locale();
  const result=window.ZOVRO_SUPPORT_POLICY.respond({text:question.value,locale:lang});
  answer.textContent=result.reply;
  source.replaceChildren();
  for(const item of result.sources){
   const a=document.createElement('a');
   a.href=item.path;
   a.textContent=(sourceLabels[lang]||{})[item.section]||item.section;
   source.appendChild(a);
  }
 });
 // English is the default; all other languages appear only when selected.
 language.value='en';
 refresh();
})();
