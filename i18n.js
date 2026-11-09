(function(){
'use strict';
// UI localization: translate owned interface labels only; never send user text to a translation service.
const KEY='zovroLanguage';
const SUPPORTED=['en','ar','es','fr','zh'];
const LABELS={"es":{"Home":"Inicio","Jobs":"Trabajos","Requests":"Solicitudes","Nearby":"Cercanos","Profile":"Perfil","More":"Más","Language":"Idioma","Choose language":"Elegir idioma","Account & security":"Cuenta y seguridad","Help, support & legal":"Ayuda, soporte y asuntos legales","Find nearby providers":"Buscar proveedores cercanos","Become a service provider":"Ser proveedor de servicios","Popular services":"Servicios populares","Your ZOVRO account":"Tu cuenta ZOVRO","Get started":"Comenzar","Help Now":"Ayuda ahora","SOS Roadside":"SOS carretera","Trusted providers":"Proveedores confiables","Nearby help":"Ayuda cercana","Fast response":"Respuesta rápida","New request":"Nueva solicitud","Refresh":"Actualizar","Available":"Disponible","Share location":"Compartir ubicación","Use my location":"Usar mi ubicación","Use My Location":"Usar mi ubicación","Profile & Security":"Perfil y seguridad","Sign out":"Cerrar sesión","Delete account":"Eliminar cuenta","Legal & Support":"Legal y soporte","Privacy Policy":"Política de privacidad","Terms":"Términos","Support":"Soporte","Sign in":"Iniciar sesión","Create account":"Crear cuenta","Phone":"Teléfono","Password":"Contraseña","Continue":"Continuar","Cancel":"Cancelar","Request a service":"Solicitar un servicio","Service":"Servicio","Details":"Detalles","Address / landmark":"Dirección / punto de referencia","Urgent request":"Solicitud urgente","Submit request":"Enviar solicitud","Accepted":"Aceptado","On the way":"En camino","Arrived":"Llegó","In progress":"En progreso","Completed":"Completado","Cancelled":"Cancelado","Looking for providers":"Buscando proveedores","Send":"Enviar","Close":"Cerrar","Roadside Assistance":"Asistencia en carretera","Mobile Mechanic":"Mecánico móvil","HVAC":"Climatización","Plumbing":"Plomería","Electrical":"Electricidad","Appliance Repair":"Reparación de electrodomésticos","Roofing":"Techos","Painting":"Pintura","Flooring":"Pisos","Lawn Care":"Jardinería","Snow Removal":"Remoción de nieve","Debris Cleanup":"Retiro de escombros","Light Moving":"Mudanza ligera","Furniture Moving":"Mudanza de muebles","Vehicle Transport":"Transporte de vehículos","Moving":"Mudanza","More options":"Más opciones","Get help fast":"Obtén ayuda rápida","What do you need help with?":"¿En qué necesitas ayuda?","Describe the problem":"Describe el problema","Where are you going?":"¿Adónde vas?","From — starting / service address":"Desde — dirección de salida o servicio","Privacy":"Privacidad","Save password & use Face ID on iPhone":"Guardar contraseña y usar Face ID en iPhone","Manage your account and account access.":"Administra tu cuenta y acceso.","Account, nearby providers and support in one place.":"Cuenta, proveedores cercanos y soporte en un lugar.","Describe what you need":"Describe lo que necesitas","Optional":"Opcional","8+ characters, letters and numbers":"8+ caracteres, letras y números","Type a street address, city, state":"Escribe calle, ciudad y estado"},"ar":{"Home":"الرئيسية","Jobs":"الطلبات","Requests":"الطلبات","Nearby":"بالقرب منك","Profile":"الملف الشخصي","More":"المزيد","Language":"اللغة","Choose language":"اختر اللغة","Account & security":"الحساب والأمان","Help, support & legal":"المساعدة والدعم والمعلومات القانونية","Find nearby providers":"البحث عن مزودي الخدمات القريبين","Become a service provider":"انضم كمزود خدمة","Popular services":"الخدمات الشائعة","Your ZOVRO account":"حسابك في ZOVRO","Get started":"ابدأ الآن","Help Now":"اطلب المساعدة الآن","SOS Roadside":"مساعدة الطريق العاجلة","Trusted providers":"مزودو خدمات موثوقون","Nearby help":"مساعدة قريبة","Fast response":"استجابة سريعة","New request":"طلب جديد","Refresh":"تحديث","Available":"متاح","Share location":"مشاركة الموقع","Use my location":"استخدم موقعي","Use My Location":"استخدم موقعي","Profile & Security":"الملف الشخصي والأمان","Sign out":"تسجيل الخروج","Delete account":"حذف الحساب","Legal & Support":"الشؤون القانونية والدعم","Privacy Policy":"سياسة الخصوصية","Terms":"الشروط","Support":"الدعم","Sign in":"تسجيل الدخول","Create account":"إنشاء حساب","Phone":"الهاتف","Password":"كلمة المرور","Continue":"متابعة","Cancel":"إلغاء","Request a service":"طلب خدمة","Service":"الخدمة","Details":"التفاصيل","Address / landmark":"العنوان / معلم بارز","Urgent request":"طلب عاجل","Submit request":"إرسال الطلب","Accepted":"تم القبول","On the way":"في الطريق","Arrived":"وصل","In progress":"قيد التنفيذ","Completed":"مكتمل","Cancelled":"ملغى","Looking for providers":"جارٍ البحث عن مقدمي الخدمة","Send":"إرسال","Close":"إغلاق","Roadside Assistance":"مساعدة الطريق","Mobile Mechanic":"ميكانيكي متنقل","HVAC":"التدفئة والتبريد","Plumbing":"السباكة","Electrical":"الكهرباء","Appliance Repair":"إصلاح الأجهزة","Roofing":"الأسقف","Painting":"الطلاء","Flooring":"الأرضيات","Lawn Care":"العناية بالحدائق","Snow Removal":"إزالة الثلوج","Debris Cleanup":"إزالة المخلفات","Light Moving":"نقل الأثاث الخفيف","Furniture Moving":"نقل الأثاث","Vehicle Transport":"نقل المركبات","Moving":"خدمات النقل","More options":"خيارات إضافية","Get help fast":"احصل على مساعدة سريعة","What do you need help with?":"بماذا تحتاج إلى المساعدة؟","Describe the problem":"صف المشكلة","Where are you going?":"إلى أين تتجه؟","From — starting / service address":"من — عنوان الانطلاق أو الخدمة","Privacy":"الخصوصية","Save password & use Face ID on iPhone":"حفظ كلمة المرور واستخدام بصمة الوجه على آيفون","Manage your account and account access.":"إدارة حسابك وطرق الدخول إليه.","Account, nearby providers and support in one place.":"الحساب والخدمات القريبة والدعم في مكان واحد.","Describe what you need":"صف ما تحتاج إليه","Optional":"اختياري","8+ characters, letters and numbers":"٨ أحرف أو أكثر، حروف وأرقام","Type a street address, city, state":"اكتب عنوان الشارع والمدينة والولاية"},"fr":{"Home":"Accueil","Jobs":"Demandes","Requests":"Demandes","Nearby":"À proximité","Profile":"Profil","More":"Plus","Language":"Langue","Choose language":"Choisir la langue","Account & security":"Compte et sécurité","Help, support & legal":"Aide, assistance et mentions légales","Find nearby providers":"Trouver des prestataires à proximité","Become a service provider":"Devenir prestataire","Popular services":"Services populaires","Your ZOVRO account":"Votre compte ZOVRO","Get started":"Commencer","Help Now":"Besoin d’aide","SOS Roadside":"SOS routier","Trusted providers":"Prestataires de confiance","Nearby help":"Aide à proximité","Fast response":"Réponse rapide","New request":"Nouvelle demande","Refresh":"Actualiser","Available":"Disponible","Share location":"Partager la position","Use my location":"Utiliser ma position","Use My Location":"Utiliser ma position","Profile & Security":"Profil et sécurité","Sign out":"Se déconnecter","Delete account":"Supprimer le compte","Legal & Support":"Mentions légales et assistance","Privacy Policy":"Politique de confidentialité","Terms":"Conditions","Support":"Assistance","Sign in":"Se connecter","Create account":"Créer un compte","Phone":"Téléphone","Password":"Mot de passe","Continue":"Continuer","Cancel":"Annuler","Request a service":"Demander un service","Service":"Service","Details":"Détails","Address / landmark":"Adresse / repère","Urgent request":"Demande urgente","Submit request":"Envoyer la demande","Accepted":"Acceptée","On the way":"En route","Arrived":"Arrivé","In progress":"En cours","Completed":"Terminée","Cancelled":"Annulée","Looking for providers":"Recherche de prestataires","Send":"Envoyer","Close":"Fermer","Roadside Assistance":"Assistance routière","Mobile Mechanic":"Mécanicien mobile","HVAC":"Chauffage et climatisation","Plumbing":"Plomberie","Electrical":"Électricité","Appliance Repair":"Réparation d’appareils","Roofing":"Toiture","Painting":"Peinture","Flooring":"Revêtements de sol","Lawn Care":"Entretien de pelouse","Snow Removal":"Déneigement","Debris Cleanup":"Enlèvement des débris","Light Moving":"Petit déménagement","Furniture Moving":"Déménagement de meubles","Vehicle Transport":"Transport de véhicules","Moving":"Déménagement","More options":"Autres options","Get help fast":"Obtenez de l’aide rapidement","What do you need help with?":"De quelle aide avez-vous besoin ?","Describe the problem":"Décrivez le problème","Where are you going?":"Où allez-vous ?","From — starting / service address":"Départ — adresse de départ ou du service","Privacy":"Confidentialité","Save password & use Face ID on iPhone":"Enregistrer le mot de passe et utiliser Face ID sur iPhone","Manage your account and account access.":"Gérez votre compte et vos accès.","Account, nearby providers and support in one place.":"Compte, prestataires proches et assistance au même endroit.","Describe what you need":"Décrivez votre besoin","Optional":"Facultatif","8+ characters, letters and numbers":"8 caractères ou plus, lettres et chiffres","Type a street address, city, state":"Saisissez la rue, la ville et l’État"},"zh":{"Home":"首页","Jobs":"订单","Requests":"请求","Nearby":"附近","Profile":"个人资料","More":"更多","Language":"语言","Choose language":"选择语言","Account & security":"账户与安全","Help, support & legal":"帮助、支持与法律","Find nearby providers":"查找附近的服务人员","Become a service provider":"成为服务提供者","Popular services":"热门服务","Your ZOVRO account":"您的 ZOVRO 账户","Get started":"开始使用","Help Now":"立即求助","SOS Roadside":"道路紧急救援","Trusted providers":"值得信赖的服务人员","Nearby help":"附近的帮助","Fast response":"快速响应","New request":"新请求","Refresh":"刷新","Available":"可接单","Share location":"分享位置","Use my location":"使用我的位置","Use My Location":"使用我的位置","Profile & Security":"个人资料与安全","Sign out":"退出登录","Delete account":"删除账户","Legal & Support":"法律与支持","Privacy Policy":"隐私政策","Terms":"条款","Support":"支持","Sign in":"登录","Create account":"创建账户","Phone":"电话","Password":"密码","Continue":"继续","Cancel":"取消","Request a service":"请求服务","Service":"服务","Details":"详情","Address / landmark":"地址／地标","Urgent request":"紧急请求","Submit request":"提交请求","Accepted":"已接受","On the way":"正在路上","Arrived":"已到达","In progress":"进行中","Completed":"已完成","Cancelled":"已取消","Looking for providers":"正在寻找服务人员","Send":"发送","Close":"关闭","Roadside Assistance":"道路救援","Mobile Mechanic":"上门汽车维修","HVAC":"暖通空调","Plumbing":"管道维修","Electrical":"电工服务","Appliance Repair":"家电维修","Roofing":"屋顶维修","Painting":"油漆粉刷","Flooring":"地板铺装","Lawn Care":"草坪养护","Snow Removal":"除雪","Debris Cleanup":"垃圾清运","Light Moving":"小型搬家","Furniture Moving":"家具搬运","Vehicle Transport":"车辆运输","Moving":"搬家","More options":"更多选项","Get help fast":"快速获得帮助","What do you need help with?":"您需要什么帮助？","Describe the problem":"描述问题","Where are you going?":"您要去哪里？","From — starting / service address":"出发地／服务地址","Privacy":"隐私","Save password & use Face ID on iPhone":"在 iPhone 上保存密码并使用面容 ID","Manage your account and account access.":"管理您的账户及登录方式。","Account, nearby providers and support in one place.":"账户、附近服务人员和支持集中在一处。","Describe what you need":"描述您的需求","Optional":"可选","8+ characters, letters and numbers":"至少 8 个字符，含字母和数字","Type a street address, city, state":"输入街道、城市、州"}};
const originals=new WeakMap();
const attrs=new WeakMap();
function normalize(value){const code=String(value||'').toLowerCase().split(/[-_]/)[0];return SUPPORTED.includes(code)?code:'en'}
function getLanguage(){
  let saved='';
  try{saved=localStorage.getItem(KEY)||''}catch(_){}
  return saved?normalize(saved):normalize(navigator.language||'en');
}
function translated(en,code){return LABELS[code]?.[en]||en}
function translateText(source,code){
  const core=source.trim();
  if(!core)return source;
  const value=translated(core,code);
  return source.replace(core,value);
}
function mountPicker(){
  const profile=document.getElementById('profile');
  if(!profile)return;
  let wrap=document.getElementById('zovroLanguageSetting');
  if(!wrap){
    wrap=document.createElement('div');
    wrap.id='zovroLanguageSetting';
    wrap.className='field';
    const label=document.createElement('label');
    label.htmlFor='zovroLanguage';
    label.textContent='Language';
    const select=document.createElement('select');
    select.id='zovroLanguage';
    select.setAttribute('aria-label','Choose language');
    for(const [code,name] of [['en','English'],['ar','العربية'],['es','Español'],['fr','Français'],['zh','简体中文']]){
      const option=document.createElement('option');option.value=code;option.textContent=name;select.appendChild(option);
    }
    select.addEventListener('change',()=>setLanguage(select.value));
    wrap.append(label,select);
  }
  const account=document.getElementById('zAccountMenu');
  const target=account||profile;
  if(wrap.parentElement!==target){
    if(target===profile&&document.getElementById('moreSettings'))profile.insertBefore(wrap,document.getElementById('moreSettings'));
    else target.appendChild(wrap);
  }
  const select=document.getElementById('zovroLanguage');
  if(select&&select.value!==getLanguage())select.value=getLanguage();
}
function apply(root){
  if(!document.body)return;
  const code=getLanguage();
  document.documentElement.lang=code;
  document.documentElement.dir=code==='ar'?'rtl':'ltr';
  mountPicker();
  const scope=root||document.body;
  const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT,{
    acceptNode(node){
      const p=node.parentElement;
      if(!p||!node.nodeValue.trim()||p.closest('script,style,textarea,pre,code,svg,[translate="no"]'))return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){
    let rec=originals.get(node);
    if(!rec){rec={en:node.nodeValue,last:node.nodeValue};originals.set(node,rec)}
    else if(node.nodeValue!==rec.last){rec.en=node.nodeValue}
    const next=translateText(rec.en,code);rec.last=next;
    if(node.nodeValue!==next)node.nodeValue=next;
  }
  scope.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(el=>{
    let map=attrs.get(el);
    if(!map){map={};attrs.set(el,map)}
    for(const key of ['placeholder','aria-label','title']){
      if(!el.hasAttribute(key))continue;
      const current=el.getAttribute(key);
      let rec=map[key];
      if(!rec){rec={en:current,last:current};map[key]=rec}
      else if(current!==rec.last){rec.en=current}
      const next=translateText(rec.en,code);rec.last=next;
      if(current!==next)el.setAttribute(key,next);
    }
  });
  const select=document.getElementById('zovroLanguage');
  if(select&&select.value!==code)select.value=code;
}
function setLanguage(value){
  const code=normalize(value);
  try{localStorage.setItem(KEY,code)}catch(_){}
  apply();
  document.dispatchEvent(new CustomEvent('zovro:language-changed',{detail:{language:code}}));
}
let pending=false;
function schedule(){
  if(pending)return;
  pending=true;
  Promise.resolve().then(()=>{pending=false;apply()});
}
function init(){
  apply();
  new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title']});
}
window.ZOVRO_I18N={getLanguage,setLanguage,apply,supportedLanguages:SUPPORTED.slice()};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
else init();
})();
