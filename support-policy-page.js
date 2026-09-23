'use strict';
(function(){
 const language=document.getElementById('policyLanguage'),question=document.getElementById('policyQuestion'),answer=document.getElementById('policyAnswer'),source=document.getElementById('policySource');
 const questions={en:['What is ZOVRO?','Do I need a license to join ZOVRO?','Why do you need my location?','Where are my account settings?','How do I contact my assigned provider?','Does verification replace a license?'],ar:['ما هو ZOVRO؟','هل الرخصة إلزامية للتسجيل؟','لماذا تحتاجون موقعي؟','أين إعدادات حسابي؟','كيف أتواصل مع مقدم الخدمة المعين؟','هل التحقق يغني عن الترخيص؟'],es:['¿Qué es ZOVRO?','¿Necesito una licencia para registrarme en ZOVRO?','¿Por qué necesitan mi ubicación?','¿Dónde están los ajustes de mi cuenta?','¿Cómo contacto a mi proveedor asignado?','¿La verificación reemplaza una licencia?']};
 function refresh(){question.replaceChildren();for(const text of questions[language.value]){const option=document.createElement('option');option.value=text;option.textContent=text;question.appendChild(option)}answer.textContent='';source.replaceChildren();}
 language.addEventListener('change',refresh);
 document.getElementById('policyAsk').addEventListener('click',()=>{const result=window.ZOVRO_SUPPORT_POLICY.respond({text:question.value,locale:language.value});answer.textContent=result.reply;source.replaceChildren();for(const item of result.sources){const a=document.createElement('a');a.href=item.path;a.textContent=item.section;source.appendChild(a)}});
 refresh();
})();
