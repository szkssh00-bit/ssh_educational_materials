/**
 * SSH Educational Materials Portal backend
 *
 * Before setupPortal(), set Script Property:
 *   ADMIN_PASSWORD = 5801
 *
 * The password is intentionally not hard-coded here because this source may
 * be stored in a public GitHub repository.
 */

const SPREADSHEET_ID='1vaYebYAsHXijZfabMmebltdSj5PbM8wd29WfzNFPqvE';
const DRIVE_FOLDER_ID='16Y0OUmmDkbL_pkXGK3wZOXhzA6B5QuK2';

const S_MATERIALS='公開資料';
const S_LOG='アクセスログ';
const S_STATS='アクセス集計';
const S_SITE='サイト集計';
const S_SETTINGS='サイト設定';

const MATERIAL_HEADERS=[
 '資料ID','公開','表示順','タイトル','種別','説明コメント','キーワード','ソース区分',
 'DriveファイルID','ファイル名','元URL','アクションURL','アクション種別','ボタン表示',
 'プレビュー有効','プレビューURL','プレビュー高さ','MIMEタイプ','更新日時'
];
const LOG_HEADERS=['日時','イベント','資料ID','資料名','ファイル名','ページURL','参照元'];
const STAT_HEADERS=['資料ID','閲覧数','プレビュー数','ダウンロード数','外部オープン数','最終更新'];
const TYPES=['PDF','Google Apps Script','Google Form','Spreadsheet','GitHub HP'];
const EVENTS=new Set(['page_view','material_view','preview_open','download','open']);
const SESSION_SECONDS=21600;

function doGet(e){
 const p=e&&e.parameter?e.parameter:{};
 if(p.page==='admin'){
   return HtmlService.createHtmlOutputFromFile('Admin')
     .setTitle('SSH Educational Materials Admin');
 }
 if(p.mode==='public_data'){
   try{
     return jsonp_({ok:true,...publicData_()},p.callback||'');
   }catch(err){
     return jsonp_({ok:false,error:String(err&&err.message?err.message:err)},p.callback||'');
   }
 }
 const ev=String(p.event||'').trim();
 if(EVENTS.has(ev)){
   log_({event:ev,id:p.material_id||'',title:p.title||'',file:p.file_name||'',
         page:p.page_url||'',ref:p.referrer||''});
   return ContentService.createTextOutput('ok').setMimeType(ContentService.MimeType.TEXT);
 }
 return ContentService.createTextOutput('SSH Educational Materials API')
   .setMimeType(ContentService.MimeType.TEXT);
}

/* ---------- one-time setup ---------- */
function setupPortal(){
 if(!PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD')){
   throw new Error('Project Settings > Script Properties に ADMIN_PASSWORD を設定してください。');
 }
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
 materialsSheet_(ss);logSheet_(ss);statsSheet_(ss);siteSheet_(ss);settingsSheet_(ss);
 seed_(ss);
 rebuildAccessStats();
 return 'Setup completed';
}

/* ---------- admin authentication ---------- */
function adminLogin(password){
 const expected=PropertiesService.getScriptProperties().getProperty('ADMIN_PASSWORD')||'';
 if(!expected) throw new Error('ADMIN_PASSWORD が設定されていません。');
 if(String(password||'')!==expected){Utilities.sleep(700);throw new Error('パスワードが正しくありません。');}
 const token=Utilities.getUuid()+Utilities.getUuid();
 CacheService.getScriptCache().put('ADMIN_'+token,'1',SESSION_SECONDS);
 return {token:token,expiresIn:SESSION_SECONDS,
   folderUrl:'https://drive.google.com/drive/folders/'+DRIVE_FOLDER_ID};
}
function adminLogout(token){if(token)CacheService.getScriptCache().remove('ADMIN_'+token);return true}
function auth_(token){
 if(!token||CacheService.getScriptCache().get('ADMIN_'+token)!=='1')
   throw new Error('管理セッションが無効または期限切れです。再ログインしてください。');
}

/* ---------- admin API ---------- */
function adminGetDashboard(token){
 auth_(token);
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
 return {
   materials:allMaterials_(ss),
   driveFiles:scanDrive_(),
   stats:statsMap_(ss),
   siteStats:siteStats_(ss),
   settings:settingsMap_(ss),
   recentLogs:recentLogs_(ss,80),
   types:TYPES,
   folderUrl:'https://drive.google.com/drive/folders/'+DRIVE_FOLDER_ID
 };
}
function adminSyncDrive(token){
 auth_(token);
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sheet=materialsSheet_(ss);
 const existing=materialRows_(sheet),byDrive={};
 existing.forEach(x=>{if(x.obj.driveFileId)byDrive[x.obj.driveFileId]=x});
 const files=scanDrive_();let added=0,updated=0;
 files.forEach(f=>{
   const hit=byDrive[f.driveFileId];
   if(hit){
     sheet.getRange(hit.row,10).setValue(f.fileName);
     sheet.getRange(hit.row,18).setValue(f.mimeType);
     sheet.getRange(hit.row,19).setValue(new Date());
     updated++;
   }else{
     sheet.appendRow(materialToRow_(inferDriveMaterial_(f)));added++;
   }
 });
 return {added:added,updated:updated,totalFiles:files.length};
}
function adminSaveMaterial(token,input){
 auth_(token);
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sheet=materialsSheet_(ss);
 const m=normalizeMaterial_(input);
 if(!m.id)m.id='ext_'+Utilities.getUuid();
 const hit=materialRows_(sheet).find(x=>x.obj.id===m.id);
 if(hit)sheet.getRange(hit.row,1,1,MATERIAL_HEADERS.length).setValues([materialToRow_(m)]);
 else sheet.appendRow(materialToRow_(m));
 return materialRows_(sheet).find(x=>x.obj.id===m.id).obj;
}
function adminDeleteMaterial(token,id){
 auth_(token);
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sheet=materialsSheet_(ss);
 const hit=materialRows_(sheet).find(x=>x.obj.id===String(id||''));
 if(!hit)return false;
 sheet.deleteRow(hit.row);return true;
}
function adminSaveSettings(token,s){
 auth_(token);
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
 ['siteTitle','siteSubtitle','introTitle','introText','footerText'].forEach(k=>{
   if(Object.prototype.hasOwnProperty.call(s||{},k))setSetting_(ss,k,String(s[k]||''));
 });
 return settingsMap_(ss);
}
function adminRebuildStats(token){auth_(token);rebuildAccessStats();return true}
function adminPreviewDefaults(token,input){
 auth_(token);const m=normalizeMaterialSoft_(input);
 return {actionUrl:m.actionUrl||inferActionUrl_(m),previewUrl:m.previewUrl||inferPreviewUrl_(m),
         actionMode:m.actionMode||inferActionMode_(m),actionLabel:m.actionLabel||inferActionLabel_(m)};
}

/* ---------- public API ---------- */
function publicData_(){
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID);
 materialsSheet_(ss);statsSheet_(ss);siteSheet_(ss);settingsSheet_(ss);
 seed_(ss);
 const ms=allMaterials_(ss).filter(x=>x.published)
   .sort((a,b)=>Number(a.order||0)-Number(b.order||0)||a.title.localeCompare(b.title,'ja'));
 const sm=statsMap_(ss),outStats={};
 ms.forEach(m=>{
   const s=sm[m.id]||{};
   outStats[m.id]={views:Number(s.views||0),previewViews:Number(s.previewViews||0),
                   downloads:Number(s.downloads||0),opens:Number(s.opens||0)};
 });
 return {materials:ms.map(publicMaterial_),stats:{siteViews:Number(siteStats_(ss).siteViews||0),materials:outStats},
         settings:settingsMap_(ss)};
}
function publicMaterial_(m){
 return {id:m.id,order:m.order,title:m.title,type:m.type,description:m.description,keywords:m.keywords,
   sourceKind:m.sourceKind,fileName:m.fileName,
   actionUrl:m.actionUrl||inferActionUrl_(m),actionMode:m.actionMode||inferActionMode_(m),
   actionLabel:m.actionLabel||inferActionLabel_(m),previewEnabled:Boolean(m.previewEnabled),
   previewUrl:m.previewEnabled?(m.previewUrl||inferPreviewUrl_(m)):'',
   previewHeight:Number(m.previewHeight||440),updatedAt:date_(m.updatedAt)};
}

/* ---------- Drive scan ---------- */
function scanDrive_(){
 const root=DriveApp.getFolderById(DRIVE_FOLDER_ID),out=[];
 scanFolder_(root,'',out);
 return out.sort((a,b)=>a.fileName.localeCompare(b.fileName,'ja'));
}
function scanFolder_(folder,path,out){
 const here=path?path+'/'+folder.getName():folder.getName(),files=folder.getFiles();
 while(files.hasNext()){
   const f=files.next();
   out.push({driveFileId:f.getId(),fileName:f.getName(),mimeType:f.getMimeType(),
             sourceUrl:f.getUrl(),folderPath:here,updatedAt:dateTime_(f.getLastUpdated())});
 }
 const subs=folder.getFolders();
 while(subs.hasNext())scanFolder_(subs.next(),here,out);
}
function inferType_(f){
 const mime=String(f.mimeType||''),name=String(f.fileName||'').toLowerCase();
 if(mime==='application/pdf'||name.endsWith('.pdf'))return'PDF';
 if(mime==='application/vnd.google-apps.form')return'Google Form';
 if(mime==='application/vnd.google-apps.spreadsheet')return'Spreadsheet';
 if(mime==='application/vnd.google-apps.script'||name.endsWith('.gs')||name.endsWith('.js'))return'Google Apps Script';
 return'';
}
function inferDriveMaterial_(f){
 const type=inferType_(f),m={id:'drv_'+f.driveFileId,published:false,order:999,
   title:f.fileName.replace(/\.[^.]+$/,''),type:type,description:'',keywords:'',sourceKind:'drive',
   driveFileId:f.driveFileId,fileName:f.fileName,sourceUrl:f.sourceUrl,actionUrl:'',actionMode:'',
   actionLabel:'',previewEnabled:Boolean(type),previewUrl:'',previewHeight:440,mimeType:f.mimeType,updatedAt:new Date()};
 m.actionUrl=inferActionUrl_(m);m.actionMode=inferActionMode_(m);m.actionLabel=inferActionLabel_(m);
 m.previewUrl=inferPreviewUrl_(m);return m;
}
function inferActionUrl_(m){
 if(m.actionUrl)return m.actionUrl;const id=m.driveFileId;
 if(!id)return m.sourceUrl||'';
 if(m.type==='PDF')return'https://drive.google.com/uc?export=download&id='+encodeURIComponent(id);
 if(m.type==='Spreadsheet')return'https://docs.google.com/spreadsheets/d/'+encodeURIComponent(id)+'/export?format=xlsx';
 if(m.type==='Google Form')return'https://docs.google.com/forms/d/'+encodeURIComponent(id)+'/preview';
 if(m.type==='Google Apps Script'&&/\.(gs|js)$/i.test(m.fileName||''))
   return'https://drive.google.com/uc?export=download&id='+encodeURIComponent(id);
 return m.sourceUrl||'';
}
function inferPreviewUrl_(m){
 if(m.previewUrl)return m.previewUrl;const id=m.driveFileId;
 if(m.type==='GitHub HP')return m.sourceUrl||m.actionUrl||'';
 if(m.type==='Google Form'&&id)return'https://docs.google.com/forms/d/'+encodeURIComponent(id)+'/preview';
 if(m.type==='Spreadsheet'&&id)return'https://docs.google.com/spreadsheets/d/'+encodeURIComponent(id)+'/preview';
 if(id)return'https://drive.google.com/file/d/'+encodeURIComponent(id)+'/preview';
 return m.sourceUrl||m.actionUrl||'';
}
function inferActionMode_(m){
 if(m.actionMode)return m.actionMode;
 if(m.type==='PDF'||m.type==='Spreadsheet')return'download';
 if(m.type==='Google Apps Script'&&/\.(gs|js)$/i.test(m.fileName||''))return'download';
 return'open';
}
function inferActionLabel_(m){return m.actionLabel||(inferActionMode_(m)==='download'?'ダウンロード':'開く')}

/* ---------- material sheet ---------- */
function materialsSheet_(ss){
 let sh=ss.getSheetByName(S_MATERIALS);if(!sh)sh=ss.insertSheet(S_MATERIALS);
 if(sh.getLastRow()===0){sh.getRange(1,1,1,MATERIAL_HEADERS.length).setValues([MATERIAL_HEADERS]);header_(sh,MATERIAL_HEADERS.length)}
 return sh;
}
function materialRows_(sh){
 if(!sh||sh.getLastRow()<2)return[];
 const v=sh.getRange(2,1,sh.getLastRow()-1,MATERIAL_HEADERS.length).getValues();
 return v.map((r,i)=>({row:i+2,obj:rowToMaterial_(r)})).filter(x=>x.obj.id);
}
function allMaterials_(ss){return materialRows_(materialsSheet_(ss)).map(x=>x.obj)}
function rowToMaterial_(r){
 return {id:String(r[0]||''),published:bool_(r[1]),order:Number(r[2]||0),title:String(r[3]||''),
   type:String(r[4]||''),description:String(r[5]||''),keywords:String(r[6]||''),sourceKind:String(r[7]||''),
   driveFileId:String(r[8]||''),fileName:String(r[9]||''),sourceUrl:String(r[10]||''),
   actionUrl:String(r[11]||''),actionMode:String(r[12]||''),actionLabel:String(r[13]||''),
   previewEnabled:bool_(r[14]),previewUrl:String(r[15]||''),previewHeight:Number(r[16]||440),
   mimeType:String(r[17]||''),updatedAt:r[18]||''};
}
function materialToRow_(m){
 return[m.id||'',Boolean(m.published),Number(m.order||0),m.title||'',m.type||'',m.description||'',m.keywords||'',
   m.sourceKind||'',m.driveFileId||'',m.fileName||'',m.sourceUrl||'',m.actionUrl||'',m.actionMode||'',
   m.actionLabel||'',Boolean(m.previewEnabled),m.previewUrl||'',Number(m.previewHeight||440),m.mimeType||'',new Date()];
}
function normalizeMaterialSoft_(x){
 const m=x||{};return{id:text_(m.id,180),published:Boolean(m.published),order:Number(m.order||0),
 title:text_(m.title,300),type:text_(m.type,80),description:text_(m.description,5000),keywords:text_(m.keywords,1000),
 sourceKind:text_(m.sourceKind||'external',40),driveFileId:text_(m.driveFileId,200),fileName:text_(m.fileName,400),
 sourceUrl:url_(m.sourceUrl),actionUrl:url_(m.actionUrl),actionMode:['download','open'].includes(m.actionMode)?m.actionMode:'',
 actionLabel:text_(m.actionLabel,80),previewEnabled:Boolean(m.previewEnabled),previewUrl:url_(m.previewUrl),
 previewHeight:Math.max(240,Math.min(900,Number(m.previewHeight||440))),mimeType:text_(m.mimeType,200),updatedAt:new Date()};
}
function normalizeMaterial_(x){
 const m=normalizeMaterialSoft_(x);
 if(!m.title)throw new Error('タイトルを入力してください。');
 if(!TYPES.includes(m.type))throw new Error('種別を選択してください。');
 if(!m.actionUrl)m.actionUrl=inferActionUrl_(m);if(!m.actionMode)m.actionMode=inferActionMode_(m);
 if(!m.actionLabel)m.actionLabel=inferActionLabel_(m);if(m.previewEnabled&&!m.previewUrl)m.previewUrl=inferPreviewUrl_(m);
 return m;
}

/* ---------- setup / seed ---------- */
function logSheet_(ss){
 let sh=ss.getSheetByName(S_LOG);if(!sh)sh=ss.insertSheet(S_LOG);
 if(sh.getLastRow()===0){sh.getRange(1,1,1,LOG_HEADERS.length).setValues([LOG_HEADERS]);header_(sh,LOG_HEADERS.length)}
 return sh;
}
function statsSheet_(ss){
 let sh=ss.getSheetByName(S_STATS);if(!sh)sh=ss.insertSheet(S_STATS);
 if(sh.getLastRow()===0){sh.getRange(1,1,1,STAT_HEADERS.length).setValues([STAT_HEADERS]);header_(sh,STAT_HEADERS.length)}
 return sh;
}
function siteSheet_(ss){
 let sh=ss.getSheetByName(S_SITE);if(!sh)sh=ss.insertSheet(S_SITE);
 if(sh.getLastRow()===0){sh.getRange(1,1,1,3).setValues([['項目','値','最終更新']]);header_(sh,3);sh.appendRow(['siteViews',0,new Date()])}
 return sh;
}
function settingsSheet_(ss){
 let sh=ss.getSheetByName(S_SETTINGS);if(!sh)sh=ss.insertSheet(S_SETTINGS);
 if(sh.getLastRow()===0){
   sh.getRange(1,1,1,3).setValues([['項目','値','最終更新']]);header_(sh,3);
   sh.getRange(2,1,5,3).setValues([
    ['siteTitle','教育・研究支援資料',new Date()],
    ['siteSubtitle','SSHの活動を通して開発した教材・研究支援ツール・プログラムを公開します。',new Date()],
    ['introTitle','公開資料について',new Date()],
    ['introText','説明を確認し、プレビューまたはダウンロード・閲覧ができます。',new Date()],
    ['footerText','SSH Educational Materials',new Date()]
   ]);
 }
 return sh;
}
function seed_(ss){
 const sh=materialsSheet_(ss);if(sh.getLastRow()>1)return;
 const js='https://szkssh00-bit.github.io/ssh_educational_materials/assets/files/'+encodeURIComponent('実験ツール貸出管理_返却修正版.js');
 const form='https://docs.google.com/forms/d/1qW8XNY0Or272UG40cMuykOFQQ47p1hp6QgkK5pjwKEk/preview';
 const a=[
 {id:'tool-lending-return-fix-20260820',published:true,order:10,title:'実験ツール貸出管理システム（返却処理修正版）',
  type:'Google Apps Script',description:'GoogleフォームとGoogleスプレッドシートを連携し、実験ツールの貸出・返却を一元管理するスクリプトです。返却候補と貸出IDの対応を修正した版です。',
  keywords:'GAS / Google Forms / Google Sheets / 貸出管理 / 返却処理',sourceKind:'github',driveFileId:'',fileName:'実験ツール貸出管理_返却修正版.js',
  sourceUrl:js,actionUrl:js,actionMode:'download',actionLabel:'コードを開く',previewEnabled:true,previewUrl:js,previewHeight:430,mimeType:'application/javascript'},
 {id:'form-preview-example',published:false,order:20,title:'Google Form プレビュー例',type:'Google Form',
  description:'Google Formをサイト内でプレビューする設定例です。Adminで確認後に公開できます。',keywords:'Google Form / プレビュー',
  sourceKind:'external',driveFileId:'1qW8XNY0Or272UG40cMuykOFQQ47p1hp6QgkK5pjwKEk',fileName:'',sourceUrl:form,
  actionUrl:form,actionMode:'open',actionLabel:'フォームを開く',previewEnabled:true,previewUrl:form,previewHeight:520,
  mimeType:'application/vnd.google-apps.form'}];
 sh.getRange(2,1,a.length,MATERIAL_HEADERS.length).setValues(a.map(materialToRow_));
}

/* ---------- logging / counters ---------- */
function log_(d){
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
   const ss=SpreadsheetApp.openById(SPREADSHEET_ID),sh=logSheet_(ss);statsSheet_(ss);siteSheet_(ss);
   sh.appendRow([new Date(),text_(d.event,40),text_(d.id,180),text_(d.title,300),text_(d.file,400),text_(d.page,1200),text_(d.ref,1200)]);
   increment_(ss,d.event,d.id);
 }finally{lock.releaseLock()}
}
function increment_(ss,ev,id){
 if(ev==='page_view'){
   const sh=siteSheet_(ss),v=sh.getDataRange().getValues();let row=-1;
   for(let i=1;i<v.length;i++)if(String(v[i][0])==='siteViews'){row=i+1;break}
   if(row<0)sh.appendRow(['siteViews',1,new Date()]);
   else{sh.getRange(row,2).setValue(Number(v[row-1][1]||0)+1);sh.getRange(row,3).setValue(new Date())}
   return;
 }
 if(!id)return;
 const sh=statsSheet_(ss),v=sh.getDataRange().getValues();let row=-1;
 for(let i=1;i<v.length;i++)if(String(v[i][0])===String(id)){row=i+1;break}
 if(row<0){sh.appendRow([id,0,0,0,0,new Date()]);row=sh.getLastRow()}
 const col={material_view:2,preview_open:3,download:4,open:5}[ev];if(!col)return;
 sh.getRange(row,col).setValue(Number(sh.getRange(row,col).getValue()||0)+1);sh.getRange(row,6).setValue(new Date());
}
function rebuildAccessStats(){
 const ss=SpreadsheetApp.openById(SPREADSHEET_ID),log=logSheet_(ss),st=statsSheet_(ss),site=siteSheet_(ss);
 const v=log.getDataRange().getValues(),map={};let views=0;
 for(let i=1;i<v.length;i++){
   const ev=String(v[i][1]||''),id=String(v[i][2]||'');
   if(ev==='page_view'){views++;continue}if(!id)continue;
   if(!map[id])map[id]={views:0,preview:0,downloads:0,opens:0};
   if(ev==='material_view')map[id].views++;if(ev==='preview_open')map[id].preview++;
   if(ev==='download')map[id].downloads++;if(ev==='open')map[id].opens++;
 }
 st.clearContents();st.getRange(1,1,1,STAT_HEADERS.length).setValues([STAT_HEADERS]);header_(st,STAT_HEADERS.length);
 const rows=Object.keys(map).sort().map(id=>[id,map[id].views,map[id].preview,map[id].downloads,map[id].opens,new Date()]);
 if(rows.length)st.getRange(2,1,rows.length,STAT_HEADERS.length).setValues(rows);
 site.clearContents();site.getRange(1,1,1,3).setValues([['項目','値','最終更新']]);header_(site,3);site.appendRow(['siteViews',views,new Date()]);
}
function statsMap_(ss){
 const v=statsSheet_(ss).getDataRange().getValues(),o={};
 for(let i=1;i<v.length;i++){const id=String(v[i][0]||'');if(id)o[id]={views:Number(v[i][1]||0),previewViews:Number(v[i][2]||0),downloads:Number(v[i][3]||0),opens:Number(v[i][4]||0)}}
 return o;
}
function siteStats_(ss){
 const v=siteSheet_(ss).getDataRange().getValues(),o={};for(let i=1;i<v.length;i++)if(v[i][0])o[String(v[i][0])]=v[i][1];return o;
}
function recentLogs_(ss,limit){
 const sh=logSheet_(ss),last=sh.getLastRow();if(last<2)return[];
 const n=Math.min(Number(limit||50),last-1),start=Math.max(2,last-n+1),v=sh.getRange(start,1,n,LOG_HEADERS.length).getValues();
 return v.reverse().map(r=>({timestamp:dateTime_(r[0]),event:String(r[1]||''),materialId:String(r[2]||''),title:String(r[3]||''),fileName:String(r[4]||''),pageUrl:String(r[5]||''),referrer:String(r[6]||'')}));
}

/* ---------- site settings ---------- */
function settingsMap_(ss){
 const v=settingsSheet_(ss).getDataRange().getValues(),o={};
 for(let i=1;i<v.length;i++)if(v[i][0])o[String(v[i][0])]=String(v[i][1]||'');
 return o;
}
function setSetting_(ss,key,val){
 const sh=settingsSheet_(ss),v=sh.getDataRange().getValues();
 for(let i=1;i<v.length;i++)if(String(v[i][0])===key){sh.getRange(i+1,2).setValue(val);sh.getRange(i+1,3).setValue(new Date());return}
 sh.appendRow([key,val,new Date()]);
}

/* ---------- helpers ---------- */
function jsonp_(obj,cb){
 const json=JSON.stringify(obj),name=/^[A-Za-z_$][0-9A-Za-z_$]{0,100}$/.test(String(cb||''))?String(cb):'';
 return ContentService.createTextOutput(name?name+'('+json+');':json)
   .setMimeType(name?ContentService.MimeType.JAVASCRIPT:ContentService.MimeType.JSON);
}
function header_(sh,n){sh.getRange(1,1,1,n).setFontWeight('bold').setBackground('#d9ead3');sh.setFrozenRows(1)}
function text_(v,n){let s=String(v==null?'':v);if(s.length>n)s=s.slice(0,n);if(/^[=+\-@]/.test(s))s="'"+s;return s}
function url_(v){
 const s=String(v||'').trim();if(!s)return'';
 if(/^https:\/\/[^\s]+$/i.test(s)||/^(assets\/|\.\/|\/)[^\s]+$/i.test(s))return s.slice(0,2000);
 throw new Error('URLは https:// で始まるURLを入力してください。');
}
function bool_(v){return v===true||['true','1','yes','公開','有効'].includes(String(v||'').toLowerCase())}
function date_(v){return v instanceof Date?Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd'):String(v||'')}
function dateTime_(v){return v instanceof Date?Utilities.formatDate(v,Session.getScriptTimeZone(),'yyyy-MM-dd HH:mm:ss'):String(v||'')}
