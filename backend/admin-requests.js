'use strict';
function createAdminRequests({auth,readDb,json,limited,audit,writeDb}){
 return async function adminRequests(req,res,url){
  if(!/^\/api\/admin\/requests(?:\/[^/]+)?$/.test(url.pathname))return false;
  const session=auth(req);if(!session){json(res,401,{error:'Sign in with an administrator account.'});return true}
  const db=readDb(),user=db.users.find(u=>u.id===session.uid);
  if(!user||(user.accountStatus||'active')!=='active'||user.role!=='admin'){json(res,403,{error:'Administrator access required.'});return true}
  if(req.method!=='GET'){json(res,405,{error:'Method not allowed'});return true}
  if(limited(req,'admin-requests:'+user.id,60,60000)){json(res,429,{error:'Please wait before refreshing.'});return true}
  const validLocation=l=>l&&typeof l.lat==='number'&&typeof l.lng==='number'&&Number.isFinite(l.lat)&&Number.isFinite(l.lng)&&Math.abs(l.lat)<=90&&Math.abs(l.lng)<=180;
  const summary=r=>({id:r.id,service:r.service,status:r.status,receivedAt:r.createdAt,hasCoordinates:!!validLocation(r.location)});
  const raw=url.pathname.slice('/api/admin/requests'.length);
  if(!raw){
   const query=(url.searchParams.get('id')||'').trim().slice(0,120),offset=Math.max(0,Math.min(100000,Number.parseInt(url.searchParams.get('offset'),10)||0));
   const rows=db.requests.filter(r=>!query||r.id===query).slice().sort((a,b)=>String(b.createdAt||'').localeCompare(String(a.createdAt||'')));
   json(res,200,{requests:rows.slice(offset,offset+50).map(summary),nextOffset:offset+50<rows.length?offset+50:null});return true;
  }
  let id;try{id=decodeURIComponent(raw.slice(1))}catch{json(res,400,{error:'Invalid request ID'});return true}
  const r=db.requests.find(r=>r.id===id);if(!r){json(res,404,{error:'Request not found'});return true}
  const l=r.location,customer=db.users.find(u=>u.id===r.customerId);
  const location=validLocation(l)?{lat:l.lat,lng:l.lng,accuracy:Number.isFinite(l.accuracy)&&l.accuracy>=0?l.accuracy:null,capturedAt:typeof l.capturedAt==='string'&&Number.isFinite(Date.parse(l.capturedAt))?l.capturedAt:null,source:'customer_device_report'}:null;
  audit(db,{uid:user.id},'admin.request.location.view',{requestId:r.id});writeDb(db);
  json(res,200,{request:{...summary(r),customer:{id:r.customerId,name:customer?.name||'Customer'},address:r.address||'',details:r.details||'',location,providerId:r.providerId||null},notice:'Coordinates are reported by the customer device; they are not independently verified or a live location.'});return true;
 };
}
module.exports={createAdminRequests};
