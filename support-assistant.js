'use strict';
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./support-policy'));else root.ZOVRO_SUPPORT_ASSISTANT=factory(root.ZOVRO_SUPPORT_POLICY)})(typeof globalThis!=='undefined'?globalThis:this,function(policy){
 const version='2026-09-25.1';
 const entries=[
 ['greeting', ['Hello','مرحبا','Hola'], /^(hi|hello|hey|مرحبا|اهلا|السلام عليكم|hola|buenos dias|gracias|thanks|شكرا)$/i,
 'Welcome to ZOVRO. What can I help with: a service request, location, your account, or contacting support?',
 'أهلًا بك في ZOVRO. كيف أساعدك: طلب خدمة، تحديد الموقع، حسابك، أم التواصل مع خدمة العملاء؟',
 'Bienvenido a ZOVRO. ¿Necesitas ayuda con una solicitud, la ubicación, tu cuenta o atención al cliente?'],
 ['request-help',['How do I request help?','كيف أطلب خدمة؟','¿Cómo solicito ayuda?'], /^(how (do|can) i (request|get|book) (help|a service)|كيف (اطلب|احجز) (خدمه|خدمة|مساعده|مساعدة)|como (solicito|pido) (ayuda|un servicio))$/i,
 'Tap Help Now, sign in as a customer, describe what you need and share your location or complete address. Review the details before sending. A request is not a confirmed booking until a provider accepts.',
 'اضغط Help Now، وسجّل الدخول كعميل، ثم اشرح ما تحتاجه وحدّد موقعك أو اكتب عنوانك الكامل. راجع التفاصيل قبل الإرسال. إرسال الطلب لا يعني تأكيد الخدمة؛ يلزم قبول مقدم الخدمة.',
 'Pulsa Help Now, inicia sesión como cliente, describe lo que necesitas y comparte tu ubicación o dirección completa. Revisa los datos antes de enviar. El servicio no está confirmado hasta que un proveedor acepte.'],
 ['gps-help',['My GPS is not working','الموقع لا يعمل','Mi ubicación no funciona'], /^(my )?(gps|location|الموقع|تحديد الموقع|mi ubicacion|ubicacion) (is not working|does not work|not working|لا يعمل|ما يشتغل|no funciona)$/i,
 'Open zovro.work directly in Safari or Chrome. Enable device Location Services and allow location for this site, then tap Detect My Location. If it still fails, tell me the message shown. You can use your complete address and city; provider distance cannot be verified without GPS.',
 'افتح zovro.work مباشرة في Safari أو Chrome. فعّل خدمات الموقع واسمح للموقع باستخدامها، ثم اضغط Detect My Location. إذا استمرت المشكلة، أخبرني بالرسالة الظاهرة. يمكنك كتابة العنوان الكامل والمدينة؛ بدون GPS لا يمكن التحقق من بُعد مقدم الخدمة.',
 'Abre zovro.work directamente en Safari o Chrome. Activa la ubicación del dispositivo y permite el acceso para este sitio; pulsa Detect My Location. Si falla, dime qué mensaje aparece. Puedes usar tu dirección completa y ciudad; sin GPS no se verifica la distancia del proveedor.'],
 ['password-help',['I forgot my password','نسيت كلمة المرور','Olvidé mi contraseña'], /^(i )?(forgot (my )?password|نسيت كلم[ةه] (المرور|السر)|olvide mi contrasena)$/i,
 'Choose Forgot password on the sign-in screen and use the phone number previously verified on your account. If recovery is unavailable or you cannot access that number, contact customer support. Never share your password or verification code here; this chat cannot unlock accounts.',
 'اختر Forgot password من شاشة الدخول واستخدم رقم الهاتف الذي سبق التحقق منه في حسابك. إذا كانت الاستعادة غير متاحة أو تعذّر الوصول للرقم، تواصل مع خدمة العملاء. لا تكتب كلمة المرور أو رمز التحقق هنا؛ الدردشة لا تفتح الحسابات.',
 'Elige Forgot password e introduce el teléfono previamente verificado en tu cuenta. Si la recuperación no está disponible o no tienes acceso al número, contacta con atención al cliente. No compartas contraseñas ni códigos aquí; este chat no desbloquea cuentas.'],
 ['phone-help',['How do I verify my phone?','كيف أتحقق من رقم الهاتف؟','¿Cómo verifico mi teléfono?'], null,
 'When signed in, open Profile and the phone verification option. Request a code and enter it only in the verification form. If sending is unavailable, contact support; verifying a phone does not replace other account or professional checks.',
 'بعد تسجيل الدخول، افتح Profile ثم خيار التحقق من الهاتف. اطلب الرمز وأدخله في نموذج التحقق فقط. إذا تعذّر الإرسال، تواصل مع الدعم. التحقق من الهاتف لا يغني عن بقية متطلبات الحساب أو المهنة.',
 'Con la sesión iniciada, abre Profile y la opción de verificación del teléfono. Solicita el código e introdúcelo solo en ese formulario. Si no se puede enviar, contacta con soporte. Esta verificación no sustituye otras comprobaciones.'],
 ['cancel-help',['How do I cancel a request?','كيف ألغي الطلب؟','¿Cómo cancelo una solicitud?'], null,
 'Open Jobs, find the active request and choose Cancel. Review the result in Jobs. Cancellation does not automatically confirm a refund or remove a charge; support must review payment questions.',
 'افتح Jobs، واختر الطلب الجاري ثم Cancel. تأكد من النتيجة في قائمة الطلبات. الإلغاء لا يعني تلقائيًا تأكيد استرداد أو إلغاء مبلغ؛ مسائل الدفع تحتاج مراجعة الدعم.',
 'Abre Jobs, busca la solicitud activa y elige Cancel. Comprueba el resultado en Jobs. Cancelar no confirma automáticamente un reembolso ni elimina un cargo; soporte debe revisar los pagos.'],
 ['tracking-help',['How can I track my provider?','كيف أتتبع مقدم الخدمة؟','¿Cómo puedo seguir al proveedor?'],null,
 'After a provider accepts, open the job in Jobs and choose Track. Updates depend on the provider sharing location and having a connection. The chat cannot confirm an arrival time; message your assigned provider for an update.',
 'بعد قبول مقدم الخدمة، افتح الطلب في Jobs واختر Track. ظهور التحديثات يعتمد على مشاركة مقدم الخدمة للموقع واتصاله بالإنترنت. الدردشة لا تؤكد موعد الوصول؛ راسل مقدم الخدمة المعين لمعرفة آخر المستجدات.',
 'Cuando el proveedor acepte, abre el trabajo en Jobs y elige Track. Las actualizaciones dependen de su ubicación compartida y conexión. Este chat no confirma la hora de llegada; escribe al proveedor asignado.'],
 ['no-provider',['No provider accepted my request','لم يقبل أحد طلبي','Nadie aceptó mi solicitud'],null,
 'Check the request status in Jobs. Availability depends on the service and area; sending a request does not guarantee a provider. Confirm your location and details. If you need police, fire or medical help, call 911 instead of waiting for ZOVRO.',
 'راجع حالة الطلب في Jobs. التوفر يعتمد على الخدمة والمنطقة؛ إرسال الطلب لا يضمن وجود مقدم خدمة. تأكد من الموقع والتفاصيل. إذا احتجت الشرطة أو الإطفاء أو الإسعاف فاتصل بـ911 ولا تنتظر ZOVRO.',
 'Revisa el estado en Jobs. La disponibilidad depende del servicio y la zona; enviar una solicitud no garantiza un proveedor. Comprueba ubicación y detalles. Para policía, bomberos o asistencia médica, llama al 911 en lugar de esperar a ZOVRO.'],
 ['duplicate-help',['My request was sent twice','أرسلت الطلب مرتين','Envié la solicitud dos veces'],null,
 'Open Jobs first and check which requests exist. If delivery was not confirmed, Retry Same Request checks or retries the same submission. Do not create another request while unsure. Contact support if you see a duplicate or an unexpected charge.',
 'افتح Jobs أولًا وتحقق من الطلبات الموجودة. إذا لم يتأكد الإرسال، فإن Retry Same Request يعيد محاولة الطلب نفسه. لا تنشئ طلبًا جديدًا وأنت غير متأكد. تواصل مع الدعم إذا ظهر تكرار أو مبلغ غير متوقع.',
 'Revisa primero las solicitudes en Jobs. Si el envío no se confirmó, Retry Same Request vuelve a intentar la misma solicitud. No crees otra mientras tengas dudas. Contacta con soporte si ves duplicados o un cargo inesperado.'],
 ['provider-join',['How do I join as a provider?','كيف أسجل كمقدم خدمة؟','¿Cómo me registro como proveedor?'],null,
 'Choose Create account and select Service provider. Add the services you can perform and complete your profile. Follow any licensing, permit and insurance requirements for the service and location. Registration does not guarantee jobs.',
 'اختر Create account ثم Service provider، وحدد الخدمات التي تستطيع تنفيذها وأكمل ملفك. التزم بمتطلبات الترخيص والتصاريح والتأمين المنطبقة على الخدمة ومكانها. التسجيل لا يضمن الحصول على أعمال.',
 'Elige Create account y Service provider. Añade los servicios que puedes realizar y completa el perfil. Cumple los requisitos de licencias, permisos y seguros de cada servicio y lugar. Registrarte no garantiza trabajos.'],
 ['provider-skills',['Can I offer more than one service?','هل أستطيع تقديم أكثر من خدمة؟','¿Puedo ofrecer varios servicios?'],null,
 'Yes. Select the services you offer when registering, or update them in Profile and choose Save services. Only select work you can perform and are legally allowed to provide.',
 'نعم. حدد خدماتك عند التسجيل أو عدّلها من Profile ثم اضغط Save services. اختر فقط الأعمال التي تستطيع تنفيذها والمسموح لك بتقديمها قانونًا.',
 'Sí. Selecciona tus servicios al registrarte o actualízalos en Profile y pulsa Save services. Elige solo trabajos que puedas realizar y estés legalmente autorizado a ofrecer.'],
 ['ratings-help',['How do I rate a provider?','كيف أقيم مقدم الخدمة؟','¿Cómo califico a un proveedor?'],null,
 'After a job is completed, open it in Jobs and choose Rate provider. Describe your own experience respectfully. If there was a safety issue or dispute, contact support as well; a rating does not open a support case.',
 'بعد اكتمال العمل، افتحه في Jobs واختر Rate provider. صف تجربتك باحترام. إذا وُجدت مشكلة سلامة أو نزاع، تواصل مع الدعم أيضًا؛ التقييم لا يفتح بلاغ دعم.',
 'Cuando termine el trabajo, ábrelo en Jobs y elige Rate provider. Describe tu experiencia con respeto. Si hubo un problema de seguridad o disputa, contacta también con soporte; una valoración no abre un caso.'],
 ['chat-help',['How do I message a provider?','كيف أراسل مقدم الخدمة؟','¿Cómo envío un mensaje al proveedor?'],null,
 'Once a provider accepts, open Jobs and choose Chat on that request. The conversation stays inside ZOVRO. Completed or cancelled jobs have read-only chat. For a new problem, contact customer support.',
 'بعد قبول مقدم الخدمة، افتح Jobs واضغط Chat في الطلب. تبقى المحادثة داخل ZOVRO. محادثات الطلبات المكتملة أو الملغاة للقراءة فقط. لأي مشكلة جديدة، تواصل مع خدمة العملاء.',
 'Cuando el proveedor acepte, abre Jobs y pulsa Chat en la solicitud. La conversación permanece dentro de ZOVRO. En trabajos completados o cancelados, el chat es de solo lectura. Para otro problema, contacta con soporte.'],
 ['sos-help',['What does SOS do?','ما وظيفة SOS؟','¿Para qué sirve SOS?'],null,
 'SOS requests urgent roadside assistance using your current location. It is not a police, fire or medical emergency service. Check Jobs for acceptance; tapping SOS does not guarantee that help is on the way.',
 'يرسل SOS طلب مساعدة طريق عاجلة باستخدام موقعك الحالي. ليس خدمة شرطة أو إطفاء أو إسعاف. راجع Jobs للتأكد من القبول؛ الضغط على SOS لا يضمن أن المساعدة في الطريق.',
 'SOS solicita asistencia urgente en carretera con tu ubicación actual. No es un servicio de policía, bomberos ni emergencias médicas. Comprueba la aceptación en Jobs; pulsar SOS no garantiza ayuda en camino.']
 ];
 const norm=s=>String(s||'').normalize('NFKD').replace(/[\u0300-\u036f\u064b-\u065f\u0670]/g,'').replace(/[أإآ]/g,'ا').replace(/[¿?¡؟!.،,]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
 function language(text,locale){return policy.respond({text,locale}).language}
 const legacy={'marketplace':'What is ZOVRO?','license-requirement':'Do I need a license to join ZOVRO?','location':'Why do you need my location?','account-help':'Where are my account settings?','active-request':'How do I contact my assigned provider?','provider-license':'Does verification replace a license?'};
 function byId(id,lang='en'){if(legacy[id])return policy.respond({text:legacy[id],locale:lang});const row=entries.find(e=>e[0]===id);if(row)return {answerId:id,language:lang,reply:row[{en:3,ar:4,es:5}[lang]||3],humanReviewRequired:false,sources:[{path:'index.html',section:'App help'}],automated:true,policyVersion:version};return null}
 function handoff(lang,reason='human-review') {return {answerId:reason,language:lang,humanReviewRequired:true,automated:true,policyVersion:version,sources:[],reply:lang==='ar'?'أفهم أنك تحتاج مساعدة أدق. هذه المسألة تحتاج مراجعة خدمة العملاء. اضغط Contact customer support أدناه لإرسال المحادثة بعد تسجيل الدخول. لا أستطيع تأكيد إجراء على حسابك أو الوعد بنتيجة أو وقت للرد.':lang==='es'?'Entiendo que necesitas ayuda más específica. Este caso requiere atención al cliente. Pulsa Contact customer support para enviar la conversación después de iniciar sesión. No puedo confirmar acciones en tu cuenta ni prometer un resultado o plazo.':'This needs a closer look from customer support. Select Contact customer support below to submit this conversation after signing in. I cannot confirm account actions or promise an outcome or response time.'}}
 function answer({text='',locale}={}){
  const lang=language(text,locale),base=policy.respond({text,locale}),n=norm(text);
  if(['safety','payment-review'].includes(base.answerId))return base;
  if(/\b(human|agent|complaint|lawsuit|lawyer|hacked|fraud|scam|injury|compensation|guarantee|promise|ignore|override|system prompt|password is|verification code|otp|representante|queja|abogado|fraude)\b|موظف|بشري|شكوى|شكوي|قضية|محامي|اختراق|احتيال|تعويض|اضمن|تجاهل|رمز التحقق|كلمة مروري/.test(n))return handoff(lang,'sensitive-review');
  if(base.answerId!=='human-review')return base;
  const match=entries.find(e=>e[1].some(q=>norm(q)===n)||(e[2]&&e[2].test(n)));
  return match?byId(match[0],lang):handoff(lang);
 }
 function catalog(){return entries.map(e=>({id:e[0],questions:e[1],answer:e[3]})).concat(Object.entries(legacy).map(([id,q])=>({id,questions:[q],answer:policy.respond({text:q}).reply})))}
 return {version,answer,byId,handoff,catalog};
});
