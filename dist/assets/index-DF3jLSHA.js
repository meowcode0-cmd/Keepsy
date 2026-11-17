(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))n(i);new MutationObserver(i=>{for(const s of i)if(s.type==="childList")for(const r of s.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&n(r)}).observe(document,{childList:!0,subtree:!0});function a(i){const s={};return i.integrity&&(s.integrity=i.integrity),i.referrerPolicy&&(s.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?s.credentials="include":i.crossOrigin==="anonymous"?s.credentials="omit":s.credentials="same-origin",s}function n(i){if(i.ep)return;i.ep=!0;const s=a(i);fetch(i.href,s)}})();const Pe="keepsy:v1",de=`${Pe}:profiles`,Le=`${Pe}:active`,fe=e=>`${Pe}:p:${e}`,Q=()=>crypto.randomUUID?crypto.randomUUID():`id-${Date.now()}-${Math.random().toString(36).slice(2,9)}`,O=()=>new Date().toISOString(),ne=()=>({records:[],reminders:[],notifications:[],settings:{weekStart:1,sensitivePreviews:!0,motion:"system",pinHash:"",pinSalt:"",alertsEnabled:!1,lastAlertScan:""},meta:{createdAt:O(),version:1}});function ze(e,t){try{const a=localStorage.getItem(e);return a?JSON.parse(a)??t:t}catch{return t}}function pe(e,t){try{return localStorage.setItem(e,JSON.stringify(t)),!0}catch(a){return console.warn("Keepsy storage write failed",a),!1}}const qe=new Set,h={profiles:[],activeId:null,data:ne(),ready:!1,init(){if(this.profiles=ze(de,null)||[],!this.profiles.length){const e={id:Q(),name:"Me",createdAt:O()};this.profiles=[e],pe(de,this.profiles)}return this.activeId=localStorage.getItem(Le),(!this.activeId||!this.profiles.some(e=>e.id===this.activeId))&&(this.activeId=this.profiles[0].id,localStorage.setItem(Le,this.activeId)),this.load(),this.ready=!0,this},load(){const e=ze(fe(this.activeId),null);this.data=e&&e.records?{...ne(),...e,settings:{...ne().settings,...e.settings||{}}}:ne(),e||this.save()},save(){const e=pe(fe(this.activeId),this.data);return this.emit(),e},emit(){qe.forEach(e=>{try{e(this.data)}catch(t){console.warn(t)}})},subscribe(e){return qe.add(e),()=>qe.delete(e)},get profile(){return this.profiles.find(e=>e.id===this.activeId)},setProfile(e){return this.profiles.some(t=>t.id===e)?(this.activeId=e,localStorage.setItem(Le,e),this.load(),this.emit(),!0):!1},addProfile(e){const t={id:Q(),name:String(e||"Someone").trim().slice(0,40)||"Someone",createdAt:O()};return this.profiles.push(t),pe(de,this.profiles),this.setProfile(t.id),t},renameProfile(e,t){const a=this.profiles.find(n=>n.id===e);return a?(a.name=String(t).trim().slice(0,40)||a.name,pe(de,this.profiles),this.emit(),!0):!1},deleteProfile(e){return this.profiles.length<=1?{ok:!1,reason:"Keepsy needs at least one profile."}:(this.profiles=this.profiles.filter(t=>t.id!==e),localStorage.removeItem(fe(e)),pe(de,this.profiles),this.activeId===e?this.setProfile(this.profiles[0].id):this.emit(),{ok:!0})},get records(){return this.data.records.filter(e=>!e.deletedAt)},get live(){return this.records.filter(e=>!e.archivedAt)},get archived(){return this.records.filter(e=>e.archivedAt)},get trashed(){return this.data.records.filter(e=>e.deletedAt)},record(e){return this.data.records.find(t=>t.id===e)||null},addRecord(e){const t={id:Q(),area:"other",kind:"item",title:"Untitled",note:"",date:new Date().toISOString().slice(0,10),time:"",amount:null,quantity:null,unit:"",mileage:null,expiry:null,warrantyUntil:null,documentName:"",tags:[],links:[],pinned:!1,createdAt:O(),updatedAt:O(),archivedAt:null,deletedAt:null,history:[],...e};return t.history=[{at:t.createdAt,text:"Keepsy remembered this"},...e.history||[]],this.data.records.unshift(t),this.save(),t},updateRecord(e,t,a){const n=this.record(e);return n?(Object.assign(n,t,{updatedAt:O()}),a&&n.history.unshift({at:O(),text:a}),this.save(),n):null},archiveRecord(e){const t=this.record(e);return t?(t.archivedAt=O(),t.history.unshift({at:O(),text:"Archived"}),this.data.reminders.forEach(a=>{a.recordId===e&&a.status==="open"&&(a.archivedAt=O())}),this.save(),t):null},unarchiveRecord(e){const t=this.record(e);return t?(t.archivedAt=null,t.history.unshift({at:O(),text:"Restored from archive"}),this.save(),t):null},trashRecord(e){const t=this.record(e);return t?(t.deletedAt=O(),t.history.unshift({at:O(),text:"Moved to recently deleted"}),this.save(),t):null},restoreRecord(e){const t=this.record(e);return t?(t.deletedAt=null,t.history.unshift({at:O(),text:"Restored"}),this.save(),t):null},purgeRecord(e){this.data.records=this.data.records.filter(t=>t.id!==e),this.data.reminders=this.data.reminders.filter(t=>t.recordId!==e),this.data.notifications=this.data.notifications.filter(t=>t.recordId!==e),this.data.records.forEach(t=>{t.links=(t.links||[]).filter(a=>a.id!==e)}),this.save()},togglePin(e){const t=this.record(e);return t?(t.pinned=!t.pinned,this.save(),t):null},linkRecords(e,t,a="related to"){const n=this.record(e),i=this.record(t);return!n||!i||n.id===i.id?!1:(n.links=n.links||[],i.links=i.links||[],n.links.some(s=>s.id===i.id)||n.links.push({id:i.id,rel:a}),i.links.some(s=>s.id===n.id)||i.links.push({id:n.id,rel:a}),n.history.unshift({at:O(),text:`Connected to “${i.title}”`}),i.history.unshift({at:O(),text:`Connected to “${n.title}”`}),this.save(),!0)},unlinkRecords(e,t){const a=this.record(e),n=this.record(t);return!a||!n?!1:(a.links=(a.links||[]).filter(i=>i.id!==t),n.links=(n.links||[]).filter(i=>i.id!==e),a.history.unshift({at:O(),text:`Disconnected from “${n.title}”`}),this.save(),!0)},get reminders(){return this.data.reminders.filter(e=>!e.archivedAt)},reminder(e){return this.data.reminders.find(t=>t.id===e)||null},addReminder(e){const t={id:Q(),recordId:null,title:"Reminder",due:new Date().toISOString().slice(0,10),time:"",type:"personal",repeat:"none",status:"open",snoozeUntil:null,lastAlerted:null,createdAt:O(),updatedAt:O(),private:!1,...e};return this.data.reminders.push(t),this.save(),t},updateReminder(e,t,a){const n=this.reminder(e);if(!n)return null;if(Object.assign(n,t,{updatedAt:O()}),n.recordId&&a){const i=this.record(n.recordId);i&&i.history.unshift({at:O(),text:a})}return this.save(),n},completeReminder(e){const t=this.reminder(e);if(!t)return null;if(t.status="done",t.completedAt=O(),t.updatedAt=O(),this.data.notifications=this.data.notifications.map(a=>a.reminderId===e?{...a,read:!0,resolved:!0}:a),t.recordId){const a=this.record(t.recordId);a&&a.history.unshift({at:O(),text:`Reminder completed — ${t.title}`})}return this.save(),t},reopenReminder(e){const t=this.reminder(e);return t?(t.status="open",t.completedAt=null,t.snoozeUntil=null,t.updatedAt=O(),this.save(),t):null},snoozeReminder(e,t=1){const a=this.reminder(e);if(!a)return null;const n=new Date;return n.setDate(n.getDate()+t),a.status="open",a.snoozeUntil=n.toISOString().slice(0,10),a.updatedAt=O(),this.data.notifications=this.data.notifications.map(i=>i.reminderId===e?{...i,read:!0,resolved:!0}:i),this.save(),a},archiveReminder(e){const t=this.reminder(e);return t?(t.archivedAt=O(),this.data.notifications=this.data.notifications.map(a=>a.reminderId===e?{...a,read:!0,resolved:!0}:a),this.save(),t):null},deleteReminder(e){this.data.reminders=this.data.reminders.filter(t=>t.id!==e),this.data.notifications=this.data.notifications.filter(t=>t.reminderId!==e),this.save()},syncNotifications(){const e=new Date().toISOString().slice(0,10),t=this.data.settings,a=new Map(this.data.notifications.map(r=>[r.key,r])),n=[];for(const r of this.reminders){if(r.status!=="open")continue;const p=r.snoozeUntil||r.due,c=Math.round((new Date(p+"T00:00:00")-new Date(e+"T00:00:00"))/864e5);if(c>14)continue;const v=`rem:${r.id}:${p}`,g=r.private&&!t.sensitivePreviews,d=a.get(v);n.push(d?{...d,title:g?"Private reminder":r.title,body:g?"Open Keepsy to see this.":Ye(r,c),days:c}:{id:Q(),key:v,reminderId:r.id,recordId:r.recordId,kind:"reminder",title:g?"Private reminder":r.title,body:g?"Open Keepsy to see this.":Ye(r,c),createdAt:O(),read:!1,days:c,private:!!r.private})}const i=new Set(n.map(r=>r.key)),s=this.data.notifications.filter(r=>!i.has(r.key)&&r.read).slice(0,30);this.data.notifications=[...n,...s],this.save()},markNotificationRead(e){const t=this.data.notifications.find(a=>a.id===e);t&&(t.read=!0,this.save())},markAllNotificationsRead(){this.data.notifications.forEach(e=>{e.read=!0}),this.save()},unreadCount(){return this.data.notifications.filter(e=>!e.read).length},setSetting(e,t){this.data.settings[e]=t,this.save()},exportData(){return{app:"Keepsy",schema:1,exportedAt:O(),profile:{name:this.profile?.name||"Me"},records:this.data.records,reminders:this.data.reminders,notifications:this.data.notifications,settings:{...this.data.settings,pinHash:"",pinSalt:""}}},importData(e,t="merge"){const a=[];if(!e||typeof e!="object")return{ok:!1,errors:["That file is not readable JSON."]};if(!Array.isArray(e.records))return{ok:!1,errors:["This file has no “records” list, so it does not look like a Keepsy export."]};const n=[];e.records.forEach((s,r)=>{if(!s||typeof s!="object"){a.push(`Record ${r+1} is not an object.`);return}if(typeof s.title!="string"||!s.title.trim()){a.push(`Record ${r+1} has no title.`);return}if(typeof s.area!="string"){a.push(`Record ${r+1} has no life area.`);return}n.push({...ne().records[0],...s,id:s.id||Q(),links:Array.isArray(s.links)?s.links:[],history:Array.isArray(s.history)?s.history:[],tags:Array.isArray(s.tags)?s.tags:[]})});const i=(Array.isArray(e.reminders)?e.reminders:[]).filter(s=>s&&s.title&&s.due).map(s=>({...s,id:s.id||Q()}));if(t==="replace")this.data.records=n,this.data.reminders=i,this.data.notifications=Array.isArray(e.notifications)?e.notifications:[];else{const s=new Set(this.data.records.map(p=>p.id)),r=new Set(this.data.reminders.map(p=>p.id));n.forEach(p=>{s.has(p.id)&&(p.id=Q()),this.data.records.push(p)}),i.forEach(p=>{r.has(p.id)||this.data.reminders.push(p)})}return this.save(),{ok:!0,errors:a,imported:n.length,reminders:i.length}},wipe(){localStorage.removeItem(fe(this.activeId)),this.data=ne(),this.save()},allStats(){return{records:this.records.length,reminders:this.reminders.filter(e=>e.status==="open").length,archived:this.archived.length,trashed:this.trashed.length}}};function Ye(e,t){return t<0?`Was due ${Math.abs(t)} day${Math.abs(t)===1?"":"s"} ago`:t===0?e.time?`Today at ${e.time}`:"Due today":t===1?"Due tomorrow":`Due in ${t} days`}let Re=null;const it=new Map;function Y(e,{replace:t=!1}={}){const a=e.startsWith("#")?e:`#${e}`;if(location.hash===a){De();return}t?history.replaceState(null,"",a):location.hash=a,t&&De()}function rt(){return location.hash&&location.hash!=="#"?location.hash:"#/"}function Oe(){const e=rt(),[t,a]=e.slice(1).split("?"),n=t.split("/").filter(Boolean),i=new URLSearchParams(a||"");return{raw:e,segs:n,params:i,path:t}}function ft(e){return e.segs[0]==="r"}function yt(e,t){it.set(e,t)}function gt(e){return it.get(e)||0}function De(){const e=Oe();ft(e)||(e.raw,Re&&Re()),window.dispatchEvent(new CustomEvent("keepsy:route",{detail:e}))}function bt(e){window.addEventListener("hashchange",De),(!location.hash||location.hash==="#")&&history.replaceState(null,"","#/"),e(Oe())}function $t(e){Re=e}const we=["January","February","March","April","May","June","July","August","September","October","November","December"],he=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],Me=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],wt=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],B=()=>ke(new Date);function ke(e){const t=new Date(e);return`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}-${String(t.getDate()).padStart(2,"0")}`}function Te(e){if(!e)return null;const[t,a,n]=e.split("-").map(Number);return!t||!a||!n?null:new Date(t,a-1,n)}function T(e,t=B()){const a=Te(e),n=Te(t);return!a||!n?0:Math.round((a-n)/864e5)}function D(e,t="medium"){const a=Te(e);if(!a)return"";const n=T(e);if(t==="relative"){if(n===0)return"Today";if(n===1)return"Tomorrow";if(n===-1)return"Yesterday";if(n>1&&n<=6)return Me[a.getDay()];if(n<-1&&n>=-6)return`Last ${Me[a.getDay()]}`}return t==="long"?`${Me[a.getDay()]}, ${a.getDate()} ${we[a.getMonth()]} ${a.getFullYear()}`:t==="short"?`${a.getDate()} ${he[a.getMonth()]}`:`${a.getDate()} ${he[a.getMonth()]} ${a.getFullYear()}`}function kt(e,t){const a=D(e,"relative");return t?`${a} · ${Ke(t)}`:a}function Ke(e){if(!e)return"";const[t,a]=e.split(":").map(Number),n=t>=12?"pm":"am";return`${t%12===0?12:t%12}${a?`:${String(a).padStart(2,"0")}`:""} ${n}`}function j(e,t="₹"){if(e==null||Number.isNaN(Number(e)))return"";const a=Number(e),n=Math.round(a*100)%100!==0;return`${t}${a.toLocaleString("en-IN",{minimumFractionDigits:n?2:0,maximumFractionDigits:2})}`}function Ae(e){if(!e)return"";const t=new Date(e).getTime(),a=Math.round((Date.now()-t)/6e4);if(a<1)return"just now";if(a<60)return`${a}m ago`;const n=Math.round(a/60);if(n<24)return`${n}h ago`;const i=Math.round(n/24);return i===1?"yesterday":i<30?`${i}d ago`:D(e.slice(0,10),"short")}function xt(e=new Date){const t=e.getHours();return t<5?"Still awake":t<12?"Good morning":t<17?"Good afternoon":t<21?"Good evening":"Good night"}function o(e){return String(e??"").replace(/[&<>"']/g,t=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[t])}function xe(e,t){const a=o(e);if(!t||t.length<2)return a;try{const n=new RegExp(`(${t.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`,"gi");return a.replace(n,"<mark>$1</mark>")}catch{return a}}function z(e){return e?e.slice(0,7):""}function te(e){if(!e)return"";const[t,a]=e.split("-").map(Number);return`${we[a-1]} ${t}`}function Ee(e,t){const[a,n]=e.split("-").map(Number),i=new Date(a,n-1+t,1);return`${i.getFullYear()}-${String(i.getMonth()+1).padStart(2,"0")}`}function ot(e){return String(e||"?").trim().split(/\s+/).slice(0,2).map(t=>t[0]).join("").toUpperCase()}function C(e,t,a){return`${e} ${e===1?t:a||`${t}s`}`}const u=(e,t="")=>`<svg class="ic ${t}" aria-hidden="true"><use href="#${e}"/></svg>`,He='a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';function je(e){const t=document.activeElement,a=e.querySelector(He);a&&requestAnimationFrame(()=>a.focus({preventScroll:!0}));function n(i){if(i.key!=="Tab")return;const s=[...e.querySelectorAll(He)].filter(c=>c.offsetParent!==null);if(!s.length)return;const r=s[0],p=s[s.length-1];i.shiftKey&&document.activeElement===r?(i.preventDefault(),p.focus()):!i.shiftKey&&document.activeElement===p&&(i.preventDefault(),r.focus())}return e.addEventListener("keydown",n),()=>{e.removeEventListener("keydown",n),t&&t.focus&&t.focus({preventScroll:!0})}}function N(e,t="i-check",a=3200){const n=document.getElementById("toasts");if(!n)return;const i=document.createElement("div");i.className="toast",i.setAttribute("role","status"),i.innerHTML=`${u(t)}<span>${o(e)}</span>`,n.appendChild(i),setTimeout(()=>{i.classList.add("leaving"),setTimeout(()=>i.remove(),260)},a);const s=document.getElementById("live");s&&(s.textContent=e)}const J=[];function U({title:e,subtitle:t="",body:a,foot:n="",onMount:i,dismissible:s=!0,grab:r=!0}){const p=document.getElementById("sheets"),c=document.createElement("div");c.className="sheet-backdrop";const v=document.createElement("div");v.className=`sheet ${r?"":"grab-off"}`,v.setAttribute("role","dialog"),v.setAttribute("aria-modal","true"),v.setAttribute("aria-label",e||"Keepsy"),v.innerHTML=`
    ${r?'<div class="sheet-grab"><span></span><small>Drag ↓ to close</small></div>':""}
    <div class="sheet-head">
      <div class="sh-titles">${e?`<h2>${o(e)}</h2>`:""}${t?`<p class="lede">${o(t)}</p>`:""}</div>
      <button class="icon-btn" data-sheet-close aria-label="Close">${u("i-close")}</button>
    </div>
    <div class="sheet-body">${a}</div>
    ${n?`<div class="sheet-foot">${n}</div>`:""}
  `,p.append(c,v);const g=je(v);requestAnimationFrame(()=>{c.classList.add("in"),v.classList.add("in")});let d=!1;const f=(y="dismiss")=>{if(d)return;d=!0,g(),c.classList.remove("in"),v.classList.remove("in"),setTimeout(()=>{c.remove(),v.remove(),!J.length&&!G.length&&(document.body.style.overflow="")},340);const E=J.findIndex(x=>x.sheet===v);E>=0&&J.splice(E,1),typeof y=="function"&&y()};if(v.querySelectorAll("[data-sheet-close]").forEach(y=>y.addEventListener("click",()=>f())),s&&c.addEventListener("click",()=>f()),document.body.style.overflow="hidden",r&&s){const y=v.querySelector(".sheet-grab");let E=0,x=0,I=!1;const S=w=>{I=!0,E=w.touches?w.touches[0].clientY:w.clientY,x=0,v.style.transition="none"},L=w=>{if(!I)return;const P=w.touches?w.touches[0].clientY:w.clientY;x=Math.max(0,P-E),v.style.transform=`translateY(${x}px)`},k=()=>{I&&(I=!1,v.style.transition="",v.style.transform="",x>96&&f(),x=0)};y.addEventListener("touchstart",S,{passive:!0}),y.addEventListener("touchmove",L,{passive:!0}),y.addEventListener("touchend",k),y.addEventListener("mousedown",S),window.addEventListener("mousemove",L),window.addEventListener("mouseup",k)}const l={sheet:v,close:f};return J.push(l),i&&i(v,f),f}function Et(){const e=J[J.length-1];return e?(e.close(),!0):!1}function lt(){for(;J.length;)J[J.length-1].close()}const G=[];function St({label:e="",render:t,onMount:a,onClose:n,kind:i="record"}){const s=document.createElement("div");s.className="layer-wrap",s.innerHTML=`
    <div class="layer-backdrop"></div>
    <div class="layer" role="dialog" aria-modal="true" aria-label="${o(e||"Detail")}">
      <div class="layer-head">
        <button class="icon-btn" data-layer-back aria-label="Back">${u("i-chevron-left")}</button>
        <div class="lh-label">${o(e)}</div>
        <div class="layer-head-actions" style="display:flex;gap:2px"></div>
      </div>
      <div class="layer-motion-cue" aria-hidden="true">Swipe ← to close</div>
      <div class="layer-body"><div class="layer-inner"></div></div>
    </div>
  `,document.body.appendChild(s);const r=s.querySelector(".layer"),p=s.querySelector(".layer-body"),c=s.querySelector(".layer-inner"),v=s.querySelector(".layer-backdrop");c.innerHTML=t();const g=je(r);requestAnimationFrame(()=>{v.classList.add("in"),r.classList.add("in")}),document.body.style.overflow="hidden";let d=!1;const f=({silent:S=!1}={})=>{if(d)return;d=!0,g(),v.classList.remove("in"),r.classList.remove("in"),setTimeout(()=>s.remove(),380);const L=G.findIndex(k=>k.el===s);L>=0&&G.splice(L,1),G.length||(document.body.style.overflow=""),!S&&n&&n()};s.querySelector("[data-layer-back]").addEventListener("click",()=>{G.length>1&&f({silent:!0}),history.back()}),v.addEventListener("click",()=>history.back()),n&&s.querySelector("[data-layer-back]").setAttribute("data-has-close","1");let l=0,y=0,E=!1,x=!1;r.addEventListener("touchstart",S=>{l=S.touches[0].clientX,y=S.touches[0].clientY,E=!0,x=!1,r.style.transition="none"},{passive:!0}),r.addEventListener("touchmove",S=>{if(!E)return;const L=S.touches[0].clientX-l,k=Math.abs(S.touches[0].clientY-y);Math.abs(L)>12&&Math.abs(L)>k&&(x=!0,L<0&&(r.style.transform=`translateX(${L}px)`))},{passive:!0}),r.addEventListener("touchend",S=>{if(!E)return;E=!1,r.style.transition="",r.style.transform="";const L=(S.changedTouches[0]?.clientX||l)-l;x&&L<-70&&history.back()});const I={el:s,close:f,body:p,inner:c,layerEl:r,kind:i};return G.push(I),a&&a({inner:c,body:p,close:f,layerEl:r,headActions:s.querySelector(".layer-head-actions")}),I}function ct(){for(;G.length;)G[G.length-1].close({silent:!0})}document.addEventListener("keydown",e=>{if(e.key==="Escape"){if(J.length){Et();return}G.length&&history.back()}});let be=null;function dt(){const e=document.getElementById("drawer"),t=document.getElementById("scrim");t.hidden=!1,requestAnimationFrame(()=>{t.classList.add("in"),e.classList.add("open")}),e.setAttribute("aria-hidden","false"),document.body.style.overflow="hidden",be=je(e)}function le(){const e=document.getElementById("drawer"),t=document.getElementById("scrim");e.classList.contains("open")&&(e.classList.remove("open"),t.classList.remove("in"),e.setAttribute("aria-hidden","true"),document.body.style.overflow=J.length||G.length?"hidden":"",setTimeout(()=>{t.hidden=!0},300),be&&(be(),be=null))}function At(){document.getElementById("drawer").classList.contains("open")?le():dt()}document.getElementById("scrim")?.addEventListener("click",le);document.getElementById("drawer-close")?.addEventListener("click",le);function oe({title:e,message:t,confirmText:a="Delete",danger:n=!0,onConfirm:i}){return U({title:e,subtitle:t,body:`<div class="notice ${n?"danger":"quiet"}">${u("i-info")}<span>${n?"This cannot be undone.":"You can change this later."}</span></div>`,foot:`<button class="btn btn-ghost" data-sheet-close>Cancel</button>
           <button class="btn ${n?"btn-danger":"btn-accent"}" data-confirm>${o(a)}</button>`,onMount:(s,r)=>{s.querySelector("[data-confirm]").addEventListener("click",()=>{r(),i()})}})}const F=[{slug:"health",name:"Health",icon:"i-heart",palette:["#46364F","#F6EFE8","#C69B91","#A4A58C"],kicker:"Body & mind",blurb:"Symptoms, medicines, appointments and the things you want to keep an eye on.",unit:"entries",empty:"No health notes yet. Add a symptom, a medicine or an appointment — Keepsy will remember the date for you.",kinds:[{id:"symptom",label:"Symptom",icon:"i-heart",fields:["date","time"]},{id:"appointment",label:"Appointment",icon:"i-calendar",fields:["date","time","reminder"]},{id:"medicine",label:"Medicine",icon:"i-doc",fields:["date","expiry","quantity","reminder"]},{id:"measurement",label:"Measurement",icon:"i-target",fields:["date","quantity","unit"]},{id:"report",label:"Report",icon:"i-doc",fields:["date","document"]},{id:"routine",label:"Routine",icon:"i-repeat",fields:["reminder"]}],stats:["records","upcoming","expiring"]},{slug:"beauty",name:"Beauty & Grooming",icon:"i-sparkle",palette:["#49342F","#FAF4EC","#C69B91","#E8D8BD"],kicker:"Rituals & care",blurb:"Products, appointments and the quiet upkeep of feeling like yourself.",unit:"entries",empty:"Nothing here yet. Log a haircut, a product you love, or when it will need replacing.",kinds:[{id:"product",label:"Product",icon:"i-sparkle",fields:["date","amount","expiry","replacement"]},{id:"appointment",label:"Appointment",icon:"i-calendar",fields:["date","time","amount","reminder"]},{id:"routine",label:"Routine",icon:"i-repeat",fields:["reminder"]},{id:"purchase",label:"Purchase",icon:"i-receipt",fields:["date","amount","quantity","amountOnly"]}],stats:["records","spent","upcoming"]},{slug:"home",name:"Home",icon:"i-home",palette:["#35241F","#F8F2E8","#B58A62","#E9DDCD"],kicker:"The place you keep",blurb:"Appliances, warranties, servicing and the small repairs that keep a home humming.",unit:"things",empty:"No home records yet. Add an appliance, a warranty, or the last time something was serviced.",kinds:[{id:"appliance",label:"Appliance",icon:"i-home",fields:["date","amount","warranty","quantity"]},{id:"maintenance",label:"Maintenance",icon:"i-repeat",fields:["date","amount","reminder"]},{id:"repair",label:"Repair",icon:"i-edit",fields:["date","amount","document"]},{id:"purchase",label:"Purchase",icon:"i-receipt",fields:["date","amount","warranty"]}],stats:["records","spent","upcoming","warranties"]},{slug:"food",name:"Food & Groceries",icon:"i-leaf",palette:["#344338","#F8F2E8","#A4A58C","#B58A62"],kicker:"What you bring home",blurb:"Groceries, quantities, the things you buy again and again, and what expires soon.",unit:"entries",empty:"No groceries yet. Tell Keepsy what you bought and it will remember the quantity.",kinds:[{id:"grocery",label:"Grocery",icon:"i-leaf",fields:["date","amount","quantity","unit","expiry"]},{id:"pantry",label:"Pantry item",icon:"i-grid",fields:["date","quantity","unit","expiry"]},{id:"meal",label:"Meal",icon:"i-heart",fields:["date","noteOnly"]}],stats:["records","spent","expiring"]},{slug:"education",name:"Education",icon:"i-book",palette:["#26384E","#EEE8DD","#B5C7D2","#B58A62"],kicker:"Still learning",blurb:"Courses, subjects, assignments, exams and certificates worth keeping.",unit:"entries",empty:"Nothing saved yet. Add a course, an assignment or an exam date to begin.",kinds:[{id:"course",label:"Course",icon:"i-book",fields:["date","amount","document"]},{id:"assignment",label:"Assignment",icon:"i-edit",fields:["date","time","reminder"]},{id:"exam",label:"Exam",icon:"i-target",fields:["date","time","reminder"]},{id:"certificate",label:"Certificate",icon:"i-doc",fields:["date","document"]},{id:"note",label:"Note",icon:"i-list",fields:["date","noteOnly"]}],stats:["records","upcoming","due"]},{slug:"work",name:"Work",icon:"i-briefcase",palette:["#284A48","#EEE8DD","#A4A58C","#A88763"],kicker:"The work you do",blurb:"Milestones, notes and records from your working life. Personal, not corporate.",unit:"entries",empty:"No work records yet. Save a milestone, a note or a document you will want later.",kinds:[{id:"milestone",label:"Milestone",icon:"i-target",fields:["date","noteOnly"]},{id:"note",label:"Note",icon:"i-list",fields:["date","noteOnly"]},{id:"document",label:"Document",icon:"i-doc",fields:["date","document"]},{id:"meeting",label:"Meeting",icon:"i-users",fields:["date","time"]}],stats:["records","upcoming"]},{slug:"vehicles",name:"Vehicles",icon:"i-car",palette:["#283B46","#E9DDCD","#B58A62","#AEBFC7"],kicker:"Miles & maintenance",blurb:"Fuel, servicing, insurance and the paperwork that lives in the glovebox.",unit:"entries",empty:"No vehicle records yet. Start with a fill-up, a service or your insurance renewal date.",kinds:[{id:"fuel",label:"Fuel",icon:"i-car",fields:["date","amount","quantity","unit","mileage"]},{id:"service",label:"Service",icon:"i-repeat",fields:["date","amount","mileage","reminder","document"]},{id:"repair",label:"Repair",icon:"i-edit",fields:["date","amount","document"]},{id:"insurance",label:"Insurance",icon:"i-shield",fields:["date","expiry","amount","reminder"]},{id:"document",label:"Document",icon:"i-doc",fields:["date","expiry","document"]}],stats:["records","spent","upcoming","expiring"]},{slug:"finance",name:"Finance",icon:"i-wallet",palette:["#332823","#F8F2E8","#B58A62","#E9DDCD"],kicker:"Money, quietly",blurb:"Expenses attached to real events, recurring costs and a calm monthly picture.",unit:"entries",empty:"Nothing recorded yet. Add an expense, or let Quick Add do it when you buy something.",kinds:[{id:"expense",label:"Expense",icon:"i-receipt",fields:["date","amount","noteOnly"]},{id:"recurring",label:"Recurring",icon:"i-repeat",fields:["date","amount","reminder"]}],stats:["records","spent","month","upcoming"]},{slug:"documents",name:"Documents",icon:"i-doc",palette:["#414B4F","#F4EFE6","#713D43","#B5C7D2"],kicker:"Paper, remembered",blurb:"Receipts, warranties, IDs and reports — with the date they matter.",unit:"documents",empty:"No documents saved yet. Note what you have and when it expires; the file stays where it is.",kinds:[{id:"receipt",label:"Receipt",icon:"i-receipt",fields:["date","amount"]},{id:"warranty",label:"Warranty",icon:"i-shield",fields:["date","expiry","amount"]},{id:"id",label:"Identity",icon:"i-doc",fields:["date","expiry","reminder"]},{id:"certificate",label:"Certificate",icon:"i-doc",fields:["date","expiry"]},{id:"report",label:"Report",icon:"i-list",fields:["date"]}],stats:["records","expiring","expired"]},{slug:"family",name:"Family",icon:"i-users",palette:["#713D43","#F8F2E8","#C69B91","#E9DDCD"],kicker:"The people close",blurb:"Birthdays, small memories and the dates you never want to miss.",unit:"entries",empty:"Nothing yet. Add a birthday, an anniversary or a memory worth keeping.",kinds:[{id:"date",label:"Important date",icon:"i-calendar",fields:["date","repeatYearly"]},{id:"memory",label:"Memory",icon:"i-heart",fields:["date","noteOnly"]},{id:"note",label:"Note",icon:"i-list",fields:["date","noteOnly"]}],stats:["records","upcoming"]},{slug:"pets",name:"Pets",icon:"i-paw",palette:["#304B3F","#E9DDCD","#B58A62","#A4A58C"],kicker:"Small companions",blurb:"Vet visits, vaccinations, food and the little routines that matter.",unit:"entries",empty:"No pet records yet. Add a vaccination date or the food you last bought.",kinds:[{id:"appointment",label:"Vet visit",icon:"i-calendar",fields:["date","time","amount","reminder"]},{id:"vaccination",label:"Vaccination",icon:"i-shield",fields:["date","expiry","reminder"]},{id:"purchase",label:"Purchase",icon:"i-receipt",fields:["date","amount","quantity"]},{id:"routine",label:"Routine",icon:"i-repeat",fields:["reminder"]}],stats:["records","spent","upcoming"]},{slug:"personal",name:"Personal",icon:"i-moon",palette:["#46364F","#F6EFE8","#B9A995","#E8D8BD"],kicker:"Just for you",blurb:"Notes, routines and milestones that belong to you alone.",unit:"entries",empty:"A blank page. Write a note, a routine, or something you want to remember about now.",kinds:[{id:"note",label:"Note",icon:"i-list",fields:["date","noteOnly"]},{id:"routine",label:"Routine",icon:"i-repeat",fields:["reminder"]},{id:"milestone",label:"Milestone",icon:"i-target",fields:["date","noteOnly"]},{id:"memory",label:"Memory",icon:"i-heart",fields:["date","noteOnly"]}],stats:["records","upcoming"]},{slug:"travel",name:"Travel & Places",icon:"i-plane",palette:["#254F53","#E9DDCD","#B7C9D6","#B58A62"],kicker:"Places you have been",blurb:"Trips, dates, tickets and the memories attached to somewhere else.",unit:"entries",empty:"No trips yet. Save a place you went, or one you are planning.",kinds:[{id:"trip",label:"Trip",icon:"i-plane",fields:["date","amount"]},{id:"place",label:"Place",icon:"i-pin",fields:["date","noteOnly"]},{id:"document",label:"Booking / ticket",icon:"i-doc",fields:["date","amount","document"]},{id:"memory",label:"Memory",icon:"i-heart",fields:["date","noteOnly"]}],stats:["records","spent","upcoming"]},{slug:"hobbies",name:"Hobbies & Projects",icon:"i-palette",palette:["#713D43","#F8F2E8","#C69B91","#E9DDCD"],kicker:"Made for the joy of it",blurb:"Projects, materials, milestones — the things you do because you want to.",unit:"projects",empty:"Nothing yet. Start a project or note the materials you bought for one.",kinds:[{id:"project",label:"Project",icon:"i-palette",fields:["date","noteOnly"]},{id:"purchase",label:"Materials",icon:"i-receipt",fields:["date","amount","quantity"]},{id:"milestone",label:"Milestone",icon:"i-target",fields:["date","noteOnly"]}],stats:["records","spent"]},{slug:"goals",name:"Goals & Milestones",icon:"i-target",palette:["#26384E","#F4EBDD","#C9A777","#A4A58C"],kicker:"Where you are going",blurb:"Quiet intentions with a date attached. No scores, no streaks.",unit:"goals",empty:"No goals yet. Write one down with a gentle target date.",kinds:[{id:"goal",label:"Goal",icon:"i-target",fields:["date","reminder"]},{id:"milestone",label:"Milestone",icon:"i-star",fields:["date","noteOnly"]}],stats:["records","upcoming"]},{slug:"other",name:"Other",icon:"i-grid",palette:["#485051","#F4EBDD","#969780","#B7C9D6"],kicker:"Everything else",blurb:"A flexible place for what does not fit neatly anywhere.",unit:"entries",empty:"Nothing here yet. Keepsy is happy to hold the odds and ends.",kinds:[{id:"item",label:"Item",icon:"i-grid",fields:["date","amount","quantity"]},{id:"note",label:"Note",icon:"i-list",fields:["date","noteOnly"]},{id:"event",label:"Event",icon:"i-calendar",fields:["date","time","reminder"]}],stats:["records","spent","upcoming"]}],Nt=Object.fromEntries(F.map(e=>[e.slug,e])),re={slug:"private",name:"Private Space",icon:"i-eye-off",palette:["#392D3F","#F6EFE8","#B98292","#B9A995"],kicker:"Only you",blurb:"A quieter room. Nothing here surfaces on Home, in Insights or on a lock screen.",unit:"entries",empty:"This space is empty. Anything you keep here stays out of the rest of Keepsy.",kinds:[{id:"note",label:"Private note",icon:"i-list",fields:["date","noteOnly"]},{id:"reminder",label:"Private reminder",icon:"i-bell",fields:["date","reminder"]},{id:"tracking",label:"Cycle / tracking",icon:"i-moon",fields:["date","noteOnly"]},{id:"medicine",label:"Medicine",icon:"i-doc",fields:["date","expiry"]}],stats:["records"]},pt=[...F,re],R=e=>e==="private"?re:Nt[e]||null,Lt=(()=>{const e={};for(const t of pt)for(const a of t.kinds)e[`${t.slug}:${a.id}`]=a.label;return e})(),qt={one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,fifteen:15,twenty:20,thirty:30,fifty:50,hundred:100},Mt=["sunday","monday","tuesday","wednesday","thursday","friday","saturday"],We=["january","february","march","april","may","june","july","august","september","october","november","december"],It=new Set(["bought","buy","purchased","got","get","the","a","an","today","yesterday","tomorrow","at","for","on","in","of","to","and","i","my","me","was","is","were","new","some","from","with","rs","rupees","inr","paid","spent","cost","costs"]),Rt={health:["doctor","medicine","tablet","pill","symptom","fever","headache","clinic","hospital","checkup","prescription","dose","vaccine","physio","dentist","health"],beauty:["shampoo","haircut","salon","facial","cream","serum","lipstick","grooming","beard","spa","makeup","conditioner","perfume","skincare"],home:["ac","fridge","refrigerator","washing","machine","sofa","mattress","geyser","serviced","service","repair","plumber","electrician","warranty","appliance","microwave","fan","home"],food:["grocery","groceries","milk","rice","eggs","vegetables","vegetable","bread","snack","kitchen","pantry","food","flour","oil","sugar","dal"],education:["course","college","assignment","exam","semester","class","lecture","professor","syllabus","study","studied","certificate","university","notes","tuition"],work:["office","work","meeting","client","project","deadline","salary","presentation","colleague","shift","interview"],vehicles:["petrol","diesel","fuel","car","bike","scooter","scooty","servicing","mileage","tyre","tire","insurance","rc","vehicle","puc","motorcycle"],finance:["expense","paid","bill","subscription","rent","emi","tax","bank","fee","recharge","electricity"],documents:["passport","aadhaar","license","licence","document","receipt","invoice","certificate","policy","visa","id"],family:["mom","mother","dad","father","sister","brother","family","birthday","anniversary","wife","husband","son","daughter","grandma","grandpa"],pets:["dog","cat","puppy","kitten","pet","vet","vaccination","leash","litter"],personal:["note","routine","journal","diary","meditation","yoga","habit"],travel:["trip","travel","flight","train","ticket","hotel","goa","trip","visited","travelled","booking"],hobbies:["project","paint","guitar","yarn","hobby","crochet","canvas","music","sketch","knitting"],goals:["goal","target","milestone","plan","aim","resolution"],other:[]},Dt={fuel:["petrol","diesel","fuel","filled","fill"],grocery:["grocery","groceries","milk","rice","eggs","bread","vegetables","flour"],medicine:["medicine","tablet","pill","syrup","dose"],appointment:["appointment","doctor","dentist","clinic","vet","meeting"],service:["serviced","servicing","service","maintenance"],maintenance:["serviced","service","maintenance","cleaned"],exam:["exam","test","viva"],assignment:["assignment","homework","submission"],expense:["paid","spent","expense","bill"],product:["shampoo","cream","serum","perfume","product","conditioner"],purchase:["bought","purchase","ordered"],trip:["trip","travelled","visited","flight"],vaccination:["vaccination","vaccine","shot"],insurance:["insurance","policy","renewal"]},_e=/(?:₹|rs\.?|inr|rupees?)\s*([\d,]+(?:\.\d{1,2})?)|([\d,]+(?:\.\d{1,2})?)\s*(?:₹|rs\.?|inr|rupees?)/i,ye=e=>{const t=e.getFullYear(),a=String(e.getMonth()+1).padStart(2,"0"),n=String(e.getDate()).padStart(2,"0");return`${t}-${a}-${n}`};function se(e,t){const a=new Date(e);return a.setDate(a.getDate()+t),a}function Ge(e,t){const a=new Date(e),n=(t-a.getDay()+7)%7||7;return a.setDate(a.getDate()+n),a}function Tt(e){const t=e.match(/\b(\d+(?:\.\d+)?)\s*(l|ltr|litre|liter|litres|liters|ml|kg|kgs|g|gm|grams|pack|packs|pcs|pieces|bottle|bottles|tablets?|strips?|bags?|dozen)\b/i);if(!t)return{};const a=t[1],n=t[2].toLowerCase(),i={l:"L",ltr:"L",litre:"L",liter:"L",litres:"L",liters:"L",ml:"ml",kg:"kg",kgs:"kg",g:"g",gm:"g",grams:"g",pack:"pack",packs:"pack",pcs:"pcs",pieces:"pcs",bottle:"bottle",bottles:"bottle",tablet:"tablet",tablets:"tablet",strip:"strip",strips:"strip",bag:"bag",bags:"bag",dozen:"dozen"};return{quantity:Number(a),unit:i[n]||n}}function Ct(e,t=new Date){const a=String(e||"").trim(),n=a.replace(/\s+/g," "),i=n.toLowerCase(),s={original:a,title:"",area:null,kind:null,date:ye(t),time:"",amount:null,quantity:null,unit:"",note:"",expiry:null,reminder:null,mileage:null,tokensRemoved:[],confidence:[]};if(!n)return s;const r=n.match(_e);if(r){const A=(r[1]||r[2]||"").replace(/,/g,""),b=Number(A);Number.isNaN(b)||(s.amount=b,s.confidence.push("amount"))}else{const A=n.match(/\b([\d,]{2,7})(?:\.\d{1,2})?\s*$/);if(A){const $=Number(A[1].replace(/,/g,""));$>=10&&(s.amount=$,s.confidence.push("amount"))}const b=i.match(/\b(one|two|three|four|five|six|seven|eight|nine|ten|fifteen|twenty|thirty|fifty|hundred)\s+(?:rupees|rs)\b/);b&&(s.amount=qt[b[1]],s.confidence.push("amount"))}const p=Tt(n);p.quantity&&(p.unit||p.quantity!==s.amount)&&(s.quantity=p.quantity,s.unit=p.unit||"");let c=new Date(t.getFullYear(),t.getMonth(),t.getDate()),v=!1,g="";if(/\bday before yesterday\b/.test(i))c=se(c,-2),v=!0;else if(/\byesterday\b/.test(i))c=se(c,-1),v=!0;else if(/\btomorrow\b/.test(i))c=se(c,1),v=!0;else if(/\btoday\b/.test(i))v=!0;else if(/\bnext week\b/.test(i))c=se(c,7),v=!0;else if(/\bnext month\b/.test(i)){const A=new Date(c);A.setMonth(A.getMonth()+1),c=A,v=!0}if(/\bnext month\b/.test(i)&&/expir|expiry|expires|valid/.test(i)){const A=new Date(t.getFullYear(),t.getMonth()+1,1);s.expiry=ye(A),s.confidence.push("expiry")}const d=i.match(/(?:expires?|expiry|expiring|valid (?:till|until|upto))\s+(?:on\s+)?(?:(\d{1,2})[\/\-](\d{1,2})(?:[\/\-](\d{2,4}))?|(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+))/);if(d){let A=null;if(d[1]&&d[2]){const b=d[3]?d[3].length===2?2e3+Number(d[3]):Number(d[3]):t.getFullYear();A=new Date(b,Number(d[2])-1,Number(d[1])),!d[3]&&A<t&&(A=new Date(b+1,Number(d[2])-1,Number(d[1])))}else if(d[4]&&d[5]){const b=We.findIndex($=>$.startsWith(d[5].slice(0,3)));b>=0&&(A=new Date(t.getFullYear(),b,Number(d[4])))}A&&!Number.isNaN(A.getTime())&&(s.expiry=ye(A),s.confidence.push("expiry"))}if(!v){const A=i.match(/\bon\s+(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)/),b=i.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\b/),$=A?.[2]||b?.[2],q=A?.[1]||b?.[1];if($&&q){const m=We.findIndex(M=>M.startsWith($.slice(0,3)));if(m>=0){let M=new Date(t.getFullYear(),m,Number(q));M<se(t,-1)&&(M=new Date(t.getFullYear()+1,m,Number(q))),c=M,v=!0,s.confidence.push("date")}}else{const m=i.match(/\b(?:on\s+|this\s+|next\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/);if(m){const M=Mt.indexOf(m[1]);M>=0&&(c=/\bnext\s/.test(i)?Ge(se(t,1),M):Ge(t,M),v=!0,s.confidence.push("date"))}}}v&&s.confidence.push("date");const f=i.match(/\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/),l=i.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/),y=f||l;if(y){let A=Number(y[1]);const b=Number(y[2]||0),$=y[3];$==="pm"&&A<12&&(A+=12),$==="am"&&A===12&&(A=0),!$&&A<=7&&(A+=12),A>=0&&A<=23&&(g=`${String(A).padStart(2,"0")}:${String(b).padStart(2,"0")}`,s.confidence.push("time"))}else/\bmorning\b/.test(i)?g="09:00":/\bafternoon\b/.test(i)?g="15:00":/\bevening\b/.test(i)?g="19:00":/\bnight\b/.test(i)&&(g="21:00");s.time=g,s.date=s.expiry&&/\bexpir|expiry|expires|valid\b/.test(i)&&!v?s.date:ye(c);const E=i.match(/\b(?:at|odo|odometer|mileage)\s*([\d,]{3,7})\s*(?:km)?\b/);E&&(s.mileage=Number(E[1].replace(/,/g,"")),s.confidence.push("mileage"));let x=null,I=0;for(const[A,b]of Object.entries(Rt)){let $=0;for(const q of b)new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`).test(i)&&($+=1);$>I&&(I=$,x=A)}s.area=x||"other";let S=null,L=0;for(const[A,b]of Object.entries(Dt)){let $=0;for(const q of b)new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")}\\b`).test(i)&&($+=1);$>L&&(L=$,S=A)}S?s.kind=S:s.kind=null,/\b(remind|reminder|due|deadline|appointment|expires?|renew|don'?t forget)\b/.test(i)&&(s.reminder={due:s.expiry||s.date,time:s.time||"",note:""},s.expiry&&(s.reminder.type="expiry"),s.confidence.push("reminder"));const w=n.replace(_e," ").replace(/\b(?:₹|rs\.?|inr|rupees?)\s*[\d,.]+/gi," ").replace(/\b(today|tomorrow|yesterday|day before yesterday|next week|next month)\b/gi," ").replace(/\b(?:expires?|expiry|expiring|valid till|valid until)\b[^,.;]*/gi," ").replace(/\b(?:at|on)\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?\b/gi," ").replace(/\b\d{1,2}(?::\d{2})?\s*(?:am|pm)\b/gi," ").replace(/\b(?:for|rs|inr)\b/gi," ").replace(/\s+/g," ").replace(/^[\s,;:.-]+|[\s,;:.-]+$/g,"").trim().split(" ").filter(Boolean),P=w.filter(A=>!It.has(A.toLowerCase()));return s.title=(P.length?P:w).join(" ").slice(0,90)||"Untitled memory",s.title=s.title.charAt(0).toUpperCase()+s.title.slice(1),s.note=a,s}function Pt(e,t){if(!t.length)return null;const a=t.find(n=>n.id===e.kind);if(a)return a;if(e.reminder){const n=t.find(i=>["appointment","goal","insurance","vaccination","exam","assignment"].includes(i.id));if(n)return n}if(e.amount!=null){const n=t.find(i=>i.fields.includes("amount"));if(n)return n}return t[0]}const Ot=["Bought shampoo ₹450","Filled petrol ₹1200","AC serviced today","Medicine expires next month","Started a new course","Assignment due Friday","Haircut today","Doctor appointment tomorrow at 5"];let V=null,ge=!1;const Je=()=>"webkitSpeechRecognition"in window||"SpeechRecognition"in window;function Be(e=null){let t=null;return U({title:"What happened?",subtitle:"Tell Keepsy anything…",body:`
      <div class="qa-input-wrap">
        <label class="sr-only" for="qa-text">Describe what happened</label>
        <textarea id="qa-text" class="qa-input" placeholder="Bought shampoo ₹450… filled petrol ₹1200… AC serviced today…" rows="3"></textarea>
        <button class="qa-mic" id="qa-mic" type="button" aria-label="Speak instead of typing" ${Je()?"":'disabled title="Voice input is not available in this browser"'}>
          ${u("i-mic")}
        </button>
      </div>
      <div class="qa-shortcuts" id="qa-shortcuts">
        ${[["Filled petrol","Filled petrol ₹","i-car"],["Bought something","Bought ","i-receipt"],["Health / medicine","Medicine ","i-heart"],["Study / college","Assignment due ","i-book"],["Maintenance","AC serviced today","i-repeat"],["Grooming","Haircut today","i-sparkle"],["Expense","Paid ₹","i-wallet"],["Note","","i-list"],["Something else","","i-plus"]].map(([n,i,s],r)=>`<button class="chip qa-chip qa-chip--${r+1}" data-seed="${o(i)}">${u(s)}<span>${o(n)}</span></button>`).join("")}
      </div>
      <div class="qa-examples" id="qa-examples">
        Try: ${Ot.slice(0,4).map(n=>`<button data-seed="${o(n)}">“${o(n)}”</button>`).join(" · ")}
      </div>
      <div id="qa-review"></div>
    `,foot:`<button class="btn btn-ghost" data-sheet-close>Cancel</button>
           <button class="btn btn-accent" id="qa-next">Continue</button>`,onMount:(n,i)=>{const s=n.querySelector("#qa-text"),r=n.querySelector("#qa-review"),p=n.querySelector("#qa-next"),c=n.querySelector("#qa-mic"),v=n.querySelector("#qa-shortcuts"),g=n.querySelector("#qa-examples");e?(s.value=e,s.focus()):setTimeout(()=>s.focus({preventScroll:!0}),420),n.querySelectorAll("[data-seed]").forEach(y=>y.addEventListener("click",()=>{s.value=(s.value?`${s.value} `:"")+y.dataset.seed,s.focus()})),c&&Je()&&c.addEventListener("click",()=>{if(ge){V?.stop();return}const y=window.SpeechRecognition||window.webkitSpeechRecognition;V=new y,V.lang=navigator.language||"en-IN",V.interimResults=!1,V.maxAlternatives=1,V.onstart=()=>{ge=!0,c.classList.add("listening")},V.onend=()=>{ge=!1,c.classList.remove("listening")},V.onerror=E=>{ge=!1,c.classList.remove("listening"),N(E.error==="not-allowed"?"Microphone permission was declined — you can type instead.":"Voice input stopped. Typing still works.","i-info")},V.onresult=E=>{const x=E.results[0][0].transcript;s.value=(s.value?`${s.value} `:"")+x,s.focus()};try{V.start()}catch{N("Voice input could not start. You can type instead.","i-info")}});const d=()=>{const y=Ct(s.value),E=R(y.area)||R("other"),x=Pt(y,E.kinds)||E.kinds[0];t={area:E.slug,kind:x.id,title:y.title,note:y.note,date:y.date,time:y.time,amount:y.amount,quantity:y.quantity,unit:y.unit,mileage:y.mileage,expiry:y.expiry,reminder:y.reminder?{due:y.reminder.due,time:y.reminder.time||""}:null,confidence:y.confidence},f()},f=()=>{const y=t,E=R(y.area),x=E.kinds.find(w=>w.id===y.kind)||E.kinds[0],I=x.fields,S=w=>I.includes(w);r.innerHTML=`
          <div class="section" style="margin-top:22px">
            <div class="section-head"><h2 style="font-size:1.02rem">Review</h2>
              <span class="tag">${o(E.name)} · ${o(x.label)}</span></div>
            <div class="parsed-grid">
              <div class="field full"><label for="pr-title">Title</label><input id="pr-title" class="input" value="${o(y.title)}" /></div>
              ${S("date"),`<div class="field"><label for="pr-date">Date</label><input id="pr-date" type="date" class="input" value="${o(y.date)}" /></div>`}
              ${S("time"),`<div class="field"><label for="pr-time">Time</label><input id="pr-time" type="time" class="input" value="${o(y.time||"")}" /></div>`}
              <div class="field"><label for="pr-area">Life area</label>
                <select id="pr-area" class="select">${F.map(w=>`<option value="${w.slug}" ${w.slug===y.area?"selected":""}>${o(w.name)}</option>`).join("")}</select></div>
              <div class="field"><label for="pr-kind">Kind</label>
                <select id="pr-kind" class="select">${E.kinds.map(w=>`<option value="${w.id}" ${w.id===y.kind?"selected":""}>${o(w.label)}</option>`).join("")}</select></div>
              ${S("amount")?`<div class="field"><label for="pr-amount">Amount</label><input id="pr-amount" class="input num" inputmode="decimal" value="${y.amount??""}" placeholder="0" /></div>`:""}
              ${S("quantity")?`<div class="field"><label for="pr-qty">Quantity</label><div style="display:flex;gap:6px"><input id="pr-qty" class="input num" inputmode="decimal" value="${y.quantity??""}" placeholder="0" style="flex:1"/><input id="pr-unit" class="input" value="${o(y.unit||"")}" placeholder="unit" style="width:74px"/></div></div>`:""}
              ${S("mileage")?`<div class="field"><label for="pr-mileage">Mileage (km)</label><input id="pr-mileage" class="input num" inputmode="numeric" value="${y.mileage??""}" placeholder="optional" /></div>`:""}
              ${S("expiry")?`<div class="field"><label for="pr-expiry">Expires</label><input id="pr-expiry" type="date" class="input" value="${o(y.expiry||"")}" /></div>`:""}
              ${S("warranty")?'<div class="field"><label for="pr-warranty">Warranty until</label><input id="pr-warranty" type="date" class="input" value="" /></div>':""}
              ${S("document")?'<div class="field full"><label for="pr-doc">Document name or path</label><input id="pr-doc" class="input" value="" placeholder="e.g. warranty card in drawer" /></div>':""}
              <div class="field full"><label for="pr-note">Notes</label><textarea id="pr-note" class="textarea" rows="2">${o(y.note)}</textarea></div>
              <div class="field full">
                <label style="display:flex;align-items:center;gap:9px;text-transform:none;letter-spacing:0;font-size:.85rem;font-weight:500;color:var(--ink)">
                  <input type="checkbox" id="pr-remind" ${y.reminder?"checked":""} style="width:18px;height:18px;accent-color:var(--ink)"/>
                  Remind me${y.expiry?" before it expires":""}
                </label>
              </div>
              <div class="field full" id="pr-remind-date-wrap" style="${y.reminder?"":"display:none"}">
                <label for="pr-remind-date">Reminder date</label>
                <input id="pr-remind-date" type="date" class="input" value="${o(y.reminder?.due||y.expiry||y.date||B())}" />
              </div>
            </div>
            <div class="parse-note">${u("i-info")}<span>Keepsy read this with simple rules — check the fields before saving.</span></div>
          </div>
        `;const L=(w,P,A=b=>b)=>{const b=r.querySelector(`#${w}`);b&&(b.addEventListener("input",()=>{y[P]=A(b.value)}),b.addEventListener("change",()=>{y[P]=A(b.value)}))};L("pr-title","title"),L("pr-date","date"),L("pr-time","time"),L("pr-note","note"),L("pr-amount","amount",w=>w===""?null:Number(w)),L("pr-qty","quantity",w=>w===""?null:Number(w)),L("pr-unit","unit"),L("pr-mileage","mileage",w=>w===""?null:Number(w)),L("pr-expiry","expiry",w=>w||null),L("pr-warranty","warrantyUntil",w=>w||null),L("pr-doc","documentName"),r.querySelector("#pr-area").addEventListener("change",w=>{y.area=w.target.value;const P=R(y.area);y.kind=P.kinds[0].id,f()}),r.querySelector("#pr-kind").addEventListener("change",w=>{y.kind=w.target.value,f()});const k=r.querySelector("#pr-remind");k.addEventListener("change",()=>{r.querySelector("#pr-remind-date-wrap").style.display=k.checked?"":"none",y.reminder=k.checked?{due:r.querySelector("#pr-remind-date").value,time:y.time||""}:null}),r.querySelector("#pr-remind-date")?.addEventListener("change",w=>{y.reminder&&(y.reminder.due=w.target.value)})};p.addEventListener("click",()=>{if(!s.value.trim()&&!t){N("Tell Keepsy what happened first.","i-info"),s.focus();return}if(!t){d(),p.textContent="Save to Keepsy",p.classList.add("btn-accent"),s.style.display="none",v.style.display="none",g.style.display="none",c.style.display="none",r.scrollIntoView({behavior:"smooth",block:"nearest"});return}l()}),s.addEventListener("keydown",y=>{(y.metaKey||y.ctrlKey)&&y.key==="Enter"&&(y.preventDefault(),p.click())});const l=()=>{const y=t.area,E=R(y).kinds.find(I=>I.id===t.kind)||R(y).kinds[0],x=h.addRecord({area:y,kind:E.id,title:t.title.trim()||"Untitled memory",note:t.note||"",date:t.date||B(),time:t.time||"",amount:t.amount??null,quantity:t.quantity??null,unit:t.unit||"",mileage:t.mileage??null,expiry:t.expiry||null,warrantyUntil:t.warrantyUntil||null,documentName:t.documentName||""});t.reminder&&t.reminder.due&&h.addReminder({recordId:x.id,title:t.expiry?`${x.title} expires`:x.title,due:t.reminder.due,time:t.reminder.time||"",type:t.expiry?"expiry":"personal",repeat:"none",private:!1}),h.syncNotifications(),i(),N("Keepsy remembered it.","i-check"),window.dispatchEvent(new CustomEvent("keepsy:record-added",{detail:x.id}))}}})}const W=e=>e.kind&&Lt[`${e.area}:${e.kind}`]||"Entry",X=e=>R(e)?.name||"Other",Fe=e=>R(e)?.icon||"i-grid";function ut(e,{showArea:t=!0}={}){const a=[];t&&a.push(X(e.area)),a.push(W(e)),e.quantity&&a.push(`${e.quantity}${e.unit?` ${e.unit}`:""}`);const n=e.amount!=null?`<span class="amt num">${j(e.amount)}</span>`:"";return`<button class="record-item" data-open-record="${e.id}">
    <span class="row-thumb">${u(Fe(e.area))}</span>
    <span class="rec-main">
      <span class="rec-title">${o(e.title)}</span>
      <span class="rec-meta">${a.map(i=>o(i)).join('<span class="sep">·</span>')}</span>
    </span>
    <span class="rec-right">${n}<span class="when">${o(D(e.date,"short"))}</span></span>
  </button>`}function Kt(e,{privatePreview:t=!0}={}){const a=[];return e.private&&!t&&a.push("Private reminder"),a.push(kt(e.snoozeUntil||e.due,e.time)),e.repeat&&e.repeat!=="none"&&a.push(`repeats ${e.repeat}`),a.join(" · ")}function Z(e,t,a=""){return`<div class="stat"><div class="s-label">${o(e)}</div><div class="s-value num">${o(t)}${a?`<small>${o(a)}</small>`:""}</div></div>`}function Ve(e){const t=T(e);return t===0?"Today":t===1?"Tomorrow":t===-1?"Yesterday":D(e,"short")}function jt(e){return e.history?.length?`<div class="history">${e.history.slice(0,12).map(t=>`
    <div class="hist-item"><strong>${o(t.text)}</strong> · ${o(Ae(t.at))}</div>`).join("")}</div>`:'<p class="hint">No history yet.</p>'}const Bt=[["none","Does not repeat"],["daily","Every day"],["weekly","Every week"],["monthly","Every month"],["yearly","Every year"]],Ft=[["personal","Personal"],["expiry","Expiry"],["maintenance","Maintenance"],["replacement","Replacement"],["study","Study"],["document","Document renewal"],["subscription","Subscription"],["appointment","Appointment"],["event","Event"]];function ve({reminder:e=null,record:t=null,onSaved:a}={}){const n=!!e,i=t?.area==="private",s={title:e?.title||(t?t.expiry?`${t.title} expires`:`Check ${t.title}`:""),due:e?.due||t?.expiry||B(),time:e?.time||"",repeat:e?.repeat||"none",type:e?.type||(t?.expiry?"expiry":"personal"),private:e?.private??i,recordId:e?.recordId||t?.id||null};U({title:n?"Edit reminder":"New reminder",subtitle:n?"Adjust the date or the wording.":"Keepsy will keep an eye on this for you.",body:`
      <div class="field" style="margin-bottom:10px">
        <label for="rm-title">What is it about</label>
        <input id="rm-title" class="input" value="${o(s.title)}" placeholder="e.g. Bike insurance renewal" />
      </div>
      <div class="field-row" style="margin-bottom:10px">
        <div class="field"><label for="rm-due">Date</label><input id="rm-due" type="date" class="input" value="${o(s.due)}" /></div>
        <div class="field"><label for="rm-time">Time (optional)</label><input id="rm-time" type="time" class="input" value="${o(s.time)}" /></div>
      </div>
      <div class="field-row" style="margin-bottom:10px">
        <div class="field"><label for="rm-repeat">Repeat</label><select id="rm-repeat" class="select">${Bt.map(([r,p])=>`<option value="${r}" ${r===s.repeat?"selected":""}>${p}</option>`).join("")}</select></div>
        <div class="field"><label for="rm-type">Kind</label><select id="rm-type" class="select">${Ft.map(([r,p])=>`<option value="${r}" ${r===s.type?"selected":""}>${p}</option>`).join("")}</select></div>
      </div>
      <div class="field" style="margin-bottom:6px">
        <label for="rm-record">Attach to a record (optional)</label>
        <select id="rm-record" class="select">
          <option value="">Nothing — a standalone reminder</option>
          ${h.live.filter(r=>r.area!=="private"||i).map(r=>`<option value="${r.id}" ${r.id===s.recordId?"selected":""}>${o(r.title)}</option>`).join("")}
        </select>
      </div>
      <label class="switch" style="margin-top:6px">
        <input type="checkbox" id="rm-private" ${s.private?"checked":""} />
        <span class="track" aria-hidden="true"></span>
        <span class="sw-label">Keep this discreet (shows as “Private reminder” in notifications)</span>
      </label>
      ${n?'<button class="btn btn-danger btn-block" id="rm-delete" style="margin-top:16px">Delete reminder</button>':""}
    `,foot:`<button class="btn btn-ghost" data-sheet-close>Cancel</button>
           <button class="btn btn-accent" id="rm-save">${n?"Save changes":"Add reminder"}</button>`,onMount:(r,p)=>{const c=g=>r.querySelector(g).value,v=()=>{const g=c("#rm-title").trim();if(!g){N("Give the reminder a name first.","i-info"),r.querySelector("#rm-title").focus();return}const d=c("#rm-due")||B(),f={title:g,due:d,time:c("#rm-time"),repeat:c("#rm-repeat"),type:c("#rm-type"),private:r.querySelector("#rm-private").checked,recordId:c("#rm-record")||null};let l;if(n)l=h.updateReminder(e.id,f,`Reminder updated — ${g}`);else if(l=h.addReminder({...f,status:"open"}),f.recordId){const y=h.record(f.recordId);y&&y.history.unshift({at:new Date().toISOString(),text:`Reminder set — ${g}`})}h.syncNotifications(),h.save(),p(),N(n?"Reminder updated.":"Reminder set.","i-bell"),a&&a(l)};r.querySelector("#rm-save").addEventListener("click",v),r.querySelector("#rm-delete")?.addEventListener("click",()=>{p(),oe({title:"Delete this reminder?",message:"It will be removed from Keepsy completely.",confirmText:"Delete",onConfirm:()=>{h.deleteReminder(e.id),N("Reminder deleted.","i-trash"),a&&a(null)}})}),setTimeout(()=>r.querySelector("#rm-title").focus({preventScroll:!0}),380)}})}function Ut(e,t){U({title:"Snooze reminder",subtitle:"Keepsy will stay quiet until then.",body:`<div class="chip-row">
      ${[["Later today",0],["Tomorrow",1],["In 3 days",3],["Next week",7],["In a month",30]].map(([a,n])=>`<button class="chip" data-snooze-days="${n}">${a}</button>`).join("")}
    </div>`,onMount:(a,n)=>{a.querySelectorAll("[data-snooze-days]").forEach(i=>i.addEventListener("click",()=>{const s=Number(i.dataset.snoozeDays),r=new Date;s===0?h.updateReminder(e.id,{snoozeUntil:B(),status:"open"},"Snoozed to later today"):(r.setDate(r.getDate()+s),h.updateReminder(e.id,{snoozeUntil:`${r.getFullYear()}-${String(r.getMonth()+1).padStart(2,"0")}-${String(r.getDate()).padStart(2,"0")}`,status:"open"},`Snoozed by ${s} day${s===1?"":"s"}`)),n(),N("Snoozed. Keepsy will bring it back.","i-snooze"),t&&t()}))}})}function zt(e,t){const a=h.record(e);if(!a)return;const n=h.live.filter(i=>i.id!==e&&(a.area==="private"?i.area==="private":i.area!=="private"));U({title:"Connect a record",subtitle:"Keepsy will link both records so you can move between them.",body:n.length?`
      <div class="search-bar" style="margin-top:4px">
        ${u("i-search")}
        <input class="search-input" id="cn-search" placeholder="Search your records" aria-label="Search records to connect" />
      </div>
      <div id="cn-list" style="margin-top:6px">
        ${n.slice(0,40).map(i=>`
          <button class="record-item" data-connect="${i.id}" style="width:100%">
            <span class="row-thumb">${u(R(i.area)?.icon||"i-grid")}</span>
            <span class="rec-main"><span class="rec-title">${o(i.title)}</span>
              <span class="rec-meta">${o(R(i.area)?.name||"Other")} · ${o(D(i.date,"short"))}</span></span>
            <span class="rec-right">${u("i-link")}</span>
          </button>`).join("")}
      </div>`:`<div class="empty"><div class="em-mark">${u("i-link")}</div><h3>Nothing to connect yet</h3><p>Add another record first and Keepsy will let you link them.</p></div>`,onMount:(i,s)=>{const r=i.querySelector("#cn-search");r&&(r.addEventListener("input",()=>{const p=r.value.trim().toLowerCase(),c=i.querySelector("#cn-list"),v=n.filter(g=>g.title.toLowerCase().includes(p)||(g.note||"").toLowerCase().includes(p));c.innerHTML=v.length?v.slice(0,40).map(g=>`
            <button class="record-item" data-connect="${g.id}" style="width:100%">
              <span class="row-thumb">${u(R(g.area)?.icon||"i-grid")}</span>
              <span class="rec-main"><span class="rec-title">${o(g.title)}</span>
                <span class="rec-meta">${o(R(g.area)?.name||"Other")} · ${o(D(g.date,"short"))}</span></span>
              <span class="rec-right">${u("i-link")}</span>
            </button>`).join(""):'<p class="hint" style="padding:12px 4px">No match.</p>'}),setTimeout(()=>r.focus({preventScroll:!0}),380)),i.addEventListener("click",p=>{const c=p.target.closest("[data-connect]");if(!c)return;const v=h.linkRecords(e,c.dataset.connect);s(),v&&N("Connected.","i-link"),t&&t()})}})}function Yt(e,t){U({title:"Attach a document note",subtitle:"Keepsy does not upload files. It remembers where a document lives and when it matters.",body:`
      <div class="notice quiet" style="margin-bottom:12px">${u("i-info")}<span>Files stay in your own storage. This note is the reminder of what it is and where it is.</span></div>
      <div class="field"><label for="dc-name">Name or location</label>
        <input id="dc-name" class="input" value="${o(e.documentName||"")}" placeholder="e.g. Warranty card, top drawer" /></div>
    `,foot:'<button class="btn btn-ghost" data-sheet-close>Cancel</button><button class="btn btn-accent" id="dc-save">Save</button>',onMount:(a,n)=>{a.querySelector("#dc-save").addEventListener("click",()=>{const i=a.querySelector("#dc-name").value.trim();h.updateRecord(e.id,{documentName:i},i?`Document noted — ${i}`:null),n(),N("Document note saved.","i-doc"),t&&t()})}})}function Ce({area:e="other",kind:t=null,record:a=null,onSaved:n}={}){const i=!!a,s={area:a?.area||e,kind:a?.kind||t||R(e)?.kinds?.[0]?.id||"item",title:a?.title||"",note:a?.note||"",date:a?.date||B(),time:a?.time||"",amount:a?.amount??"",quantity:a?.quantity??"",unit:a?.unit||"",mileage:a?.mileage??"",expiry:a?.expiry||"",warrantyUntil:a?.warrantyUntil||"",documentName:a?.documentName||"",tags:(a?.tags||[]).join(", "),pinned:a?.pinned||!1},r=pt.filter(p=>p.slug!=="private"||a?.area==="private");U({title:i?"Edit record":"New record",subtitle:i?"Nothing is written in stone.":"A few details now saves remembering later.",body:`
      <div class="field" style="margin-bottom:10px"><label for="rf-title">Title</label>
        <input id="rf-title" class="input" value="${o(s.title)}" placeholder="What is this?" /></div>
      <div class="field-row" style="margin-bottom:10px">
        <div class="field"><label for="rf-area">Life area</label>
          <select id="rf-area" class="select">${r.map(p=>`<option value="${p.slug}" ${p.slug===s.area?"selected":""}>${o(p.name)}</option>`).join("")}</select></div>
        <div class="field"><label for="rf-kind">Kind</label><select id="rf-kind" class="select"></select></div>
      </div>
      <div class="field-row" style="margin-bottom:10px">
        <div class="field"><label for="rf-date">Date</label><input id="rf-date" type="date" class="input" value="${o(s.date)}" /></div>
        <div class="field"><label for="rf-time">Time</label><input id="rf-time" type="time" class="input" value="${o(s.time)}" /></div>
      </div>
      <div id="rf-extra"></div>
      <div class="field" style="margin:10px 0"><label for="rf-note">Notes</label>
        <textarea id="rf-note" class="textarea" rows="3" placeholder="Anything you want to remember">${o(s.note)}</textarea></div>
      <div class="field" style="margin-bottom:8px"><label for="rf-tags">Tags</label>
        <input id="rf-tags" class="input" value="${o(s.tags)}" placeholder="comma, separated" /></div>
    `,foot:`<button class="btn btn-ghost" data-sheet-close>Cancel</button>
           <button class="btn btn-accent" id="rf-save">${i?"Save changes":"Add to Keepsy"}</button>`,onMount:(p,c)=>{const v=p.querySelector("#rf-kind"),g=p.querySelector("#rf-extra"),d=p.querySelector("#rf-area"),f=()=>{const l=R(s.area)||R("other");v.innerHTML=l.kinds.map(S=>`<option value="${S.id}" ${S.id===s.kind?"selected":""}>${o(S.label)}</option>`).join("");const E=(l.kinds.find(S=>S.id===s.kind)||l.kinds[0]).fields,x=[];(E.includes("amount")||E.includes("amountOnly"))&&x.push(`<div class="field"><label for="rf-amount">Amount</label><input id="rf-amount" class="input num" inputmode="decimal" value="${s.amount}" placeholder="0" /></div>`),E.includes("quantity")&&x.push(`<div class="field"><label for="rf-qty">Quantity</label><div style="display:flex;gap:6px"><input id="rf-qty" class="input num" inputmode="decimal" value="${s.quantity}" placeholder="0" style="flex:1"/><input id="rf-unit" class="input" value="${o(s.unit)}" placeholder="unit" style="width:74px"/></div></div>`),E.includes("mileage")&&x.push(`<div class="field"><label for="rf-mileage">Mileage (km)</label><input id="rf-mileage" class="input num" inputmode="numeric" value="${s.mileage}" placeholder="optional" /></div>`),E.includes("expiry")&&x.push(`<div class="field"><label for="rf-expiry">Expires</label><input id="rf-expiry" type="date" class="input" value="${o(s.expiry)}" /></div>`),E.includes("warranty")&&x.push(`<div class="field"><label for="rf-warranty">Warranty until</label><input id="rf-warranty" type="date" class="input" value="${o(s.warrantyUntil)}" /></div>`),E.includes("document")&&x.push(`<div class="field full"><label for="rf-doc">Document note</label><input id="rf-doc" class="input" value="${o(s.documentName)}" placeholder="where it lives" /></div>`),g.innerHTML=x.length?`<div class="field-row" style="margin-bottom:10px">${x.join("")}</div>`:"";const I=(S,L,k=!1)=>{const w=p.querySelector(S);w&&w.addEventListener("input",()=>{s[L]=k?w.value===""?"":Number(w.value):w.value})};I("#rf-amount","amount",!0),I("#rf-qty","quantity",!0),I("#rf-unit","unit"),I("#rf-mileage","mileage",!0),I("#rf-expiry","expiry"),I("#rf-warranty","warrantyUntil"),I("#rf-doc","documentName")};f(),v.addEventListener("change",()=>{s.kind=v.value,f()}),d.addEventListener("change",()=>{s.area=d.value,s.kind=R(s.area).kinds[0].id,f()}),p.querySelector("#rf-title").addEventListener("input",l=>{s.title=l.target.value}),p.querySelector("#rf-note").addEventListener("input",l=>{s.note=l.target.value}),p.querySelector("#rf-tags").addEventListener("input",l=>{s.tags=l.target.value}),p.querySelector("#rf-date").addEventListener("change",l=>{s.date=l.target.value}),p.querySelector("#rf-time").addEventListener("change",l=>{s.time=l.target.value}),p.querySelector("#rf-save").addEventListener("click",()=>{const l=p.querySelector("#rf-title").value.trim();if(!l){N("A record needs a title.","i-info"),p.querySelector("#rf-title").focus();return}const y={area:s.area,kind:s.kind,title:l,note:p.querySelector("#rf-note").value,date:s.date||B(),time:s.time||"",amount:s.amount===""?null:Number(s.amount),quantity:s.quantity===""?null:Number(s.quantity),unit:s.unit||"",mileage:s.mileage===""?null:Number(s.mileage),expiry:s.expiry||null,warrantyUntil:s.warrantyUntil||null,documentName:s.documentName||"",tags:p.querySelector("#rf-tags").value.split(",").map(x=>x.trim()).filter(Boolean).slice(0,8)};let E;i?E=h.updateRecord(a.id,y,"Details updated"):E=h.addRecord(y),c(),N(i?"Saved.":"Keepsy remembered it.","i-check"),n&&n(E)}),setTimeout(()=>p.querySelector("#rf-title").focus({preventScroll:!0}),380)}})}function Ht(e){if(!h.record(e)){N("That record is no longer here.","i-info"),history.back();return}return St({label:"Record",render:()=>Xe(e),onMount:({inner:n,close:i,headActions:s})=>{const r=()=>{const c=h.record(e);if(!c){i({silent:!0});return}n.innerHTML=Xe(e),s.innerHTML=Wt(c),p()},p=()=>{const c=h.record(e);n.querySelectorAll("[data-act]").forEach(v=>v.addEventListener("click",()=>Se(v.dataset.act,c,{paint:r,close:i}))),s.querySelectorAll("[data-act]").forEach(v=>v.addEventListener("click",()=>Se(v.dataset.act,c,{paint:r,close:i}))),n.querySelectorAll("[data-open-record]").forEach(v=>v.addEventListener("click",g=>{g.preventDefault(),window.location.hash=`#/r/${v.dataset.openRecord}`})),n.querySelectorAll("[data-open-reminder]").forEach(v=>v.addEventListener("click",()=>{window.dispatchEvent(new CustomEvent("keepsy:open-reminder",{detail:v.dataset.openReminder}))})),n.querySelectorAll("[data-unlink]").forEach(v=>v.addEventListener("click",()=>{h.unlinkRecords(e,v.dataset.unlink),r(),N("Connection removed.","i-link")}))};r()}})}function Wt(e){return`
    <button class="icon-btn" data-act="pin" aria-label="${e.pinned?"Unpin":"Pin"} ${o(e.title)}" title="${e.pinned?"Unpin":"Pin"}">${u("i-pin")}</button>
    <button class="icon-btn" data-act="more" aria-label="More actions">${u("i-list")}</button>
  `}function Xe(e){const t=h.record(e);if(!t)return"";const a=R(t.area)||R("other"),n=(t.links||[]).map(c=>h.record(c.id)).filter(Boolean),i=h.data.reminders.filter(c=>c.recordId===t.id&&!c.archivedAt),s=i.filter(c=>c.status==="open"),r=[];t.amount!=null&&r.push(["Amount",j(t.amount)]),t.quantity!=null&&r.push(["Quantity",`${t.quantity}${t.unit?` ${t.unit}`:""}`]),t.mileage&&r.push(["Mileage",`${t.mileage.toLocaleString("en-IN")} km`]),t.expiry&&r.push(["Expires",D(t.expiry,"short")]),t.warrantyUntil&&r.push(["Warranty",D(t.warrantyUntil,"short")]);const p=t.expiry?(()=>{const c=T(t.expiry);return c<0?`<div class="notice danger" style="margin-top:14px">${u("i-info")}<span>This expired ${Math.abs(c)} day${Math.abs(c)===1?"":"s"} ago.</span></div>`:c===0?`<div class="notice" style="margin-top:14px">${u("i-clock")}<span>Expires today.</span></div>`:c<=30?`<div class="notice" style="margin-top:14px">${u("i-clock")}<span>Expires in ${c} days.</span></div>`:""})():"";return`
    <section class="rec-showcase" style="--rec-accent:${a.palette?.[0]||"#192A3B"}">
    <div class="rec-kicker">
      <span class="rk-area">${o(a.name)}</span>
      <span class="tag">${o(W(t))}</span>
      ${t.pinned?'<span class="tag accent">Pinned</span>':""}
      ${t.archivedAt?'<span class="tag quiet">Archived</span>':""}
    </div>
    <h1 class="rec-h1">${o(t.title)}</h1>
    <div class="rec-sub">
      <span>${o(D(t.date,"long"))}</span>
      ${t.time?`<span>·</span><span>${o(Ke(t.time))}</span>`:""}
      <span>·</span><span>added ${o(Ae(t.createdAt))}</span>
    </div>
    ${t.note?`<p class="rec-note">${o(t.note)}</p>`:""}
    ${p}
    ${r.length?`<div class="rec-figures">${r.slice(0,3).map(([c,v])=>`<div class="rec-fig"><div class="rf-l">${o(c)}</div><div class="rf-v num">${o(v)}</div></div>`).join("")}</div>`:""}
    ${r.length>3?`<dl class="dl" style="margin-top:14px">${r.slice(3).map(([c,v])=>`<dt>${o(c)}</dt><dd class="num">${o(v)}</dd>`).join("")}</dl>`:""}
    ${t.tags?.length?`<div class="chip-row" style="margin-top:14px">${t.tags.map(c=>`<span class="tag quiet">${o(c)}</span>`).join("")}</div>`:""}
    </section>

    <div class="rec-block">
      <div class="rb-head"><span class="eyebrow">Actions</span></div>
      <div class="quick-actions">
        <button class="qa" data-act="remind">${u("i-bell")}<span>Remind me</span></button>
        <button class="qa" data-act="connect">${u("i-link")}<span>Connect</span></button>
        <button class="qa" data-act="document">${u("i-doc")}<span>Document</span></button>
        <button class="qa" data-act="edit">${u("i-edit")}<span>Edit</span></button>
      </div>
    </div>

    ${s.length||i.length?`
    <div class="rec-block">
      <div class="rb-head"><span class="eyebrow">Reminders</span>
        <button class="btn-quiet" data-act="remind">Add</button></div>
      <div class="panel panel-pad" style="padding:4px 16px">
        ${i.map(c=>`
          <button class="row" data-open-reminder="${c.id}" style="width:100%">
            <span class="row-thumb">${u("i-bell")}</span>
            <span class="row-main">
              <span class="row-title" style="${c.status==="done"?"text-decoration:line-through;opacity:.6":""}">${o(c.title)}</span>
              <span class="row-meta">${o(D(c.snoozeUntil||c.due,"relative"))}${c.repeat!=="none"?` · repeats ${o(c.repeat)}`:""}${c.status==="done"?" · done":""}</span>
            </span>
            <span class="row-side">${u("i-chevron-right")}</span>
          </button>`).join("")}
      </div>
    </div>`:""}

    ${t.documentName?`
    <div class="rec-block">
      <div class="rb-head"><span class="eyebrow">Document</span><button class="btn-quiet" data-act="document">Change</button></div>
      <div class="document-row">
        <span class="row-thumb">${u("i-doc")}</span>
        <span class="dr-main"><strong>${o(t.documentName)}</strong><span>Keepsy remembers where it is — the file stays in your own storage</span></span>
      </div>
    </div>`:""}

    <div class="rec-block">
      <div class="rb-head"><span class="eyebrow">Connected (${n.length})</span><button class="btn-quiet" data-act="connect">Connect</button></div>
      ${n.length?`<div class="linked">${n.map(c=>`
        <div class="linked-item" style="padding-right:6px">
          <button class="linked-item" data-open-record="${c.id}" style="border:0;background:none;padding:0;flex:1">
            <span class="li-ic">${u(R(c.area)?.icon||"i-grid")}</span>
            <span class="li-main"><span class="li-t">${o(c.title)}</span><span class="li-m">${o(X(c.area))} · ${o(W(c))}</span></span>
            ${u("i-chevron-right","ic-sm")}
          </button>
          <button class="icon-btn" data-unlink="${c.id}" aria-label="Disconnect ${o(c.title)}" style="width:34px;height:34px">${u("i-close")}</button>
        </div>`).join("")}</div>`:'<p class="hint">Nothing connected yet. Link a receipt, a service record, a course — anything that belongs with this.</p>'}
    </div>

    <div class="rec-block">
      <div class="rb-head"><span class="eyebrow">History</span></div>
      ${jt(t)}
    </div>

    <div class="rec-block" style="padding-bottom:32px">
      <div class="chip-row">
        <button class="btn btn-ghost btn-sm" data-act="archive">${u("i-archive")} ${t.archivedAt?"Unarchive":"Archive"}</button>
        <button class="btn btn-danger btn-sm" data-act="delete">${u("i-trash")} Move to recently deleted</button>
      </div>
    </div>
  `}function Se(e,t,{paint:a,close:n}){switch(e){case"pin":h.togglePin(t.id),a(),N(h.record(t.id).pinned?"Pinned to Home.":"Unpinned.","i-pin");break;case"edit":Ce({record:t,onSaved:()=>a()});break;case"remind":ve({record:t,onSaved:()=>a()});break;case"connect":zt(t.id,()=>a());break;case"document":Yt(t,()=>a());break;case"archive":t.archivedAt?(h.unarchiveRecord(t.id),N("Back from the archive.","i-restore")):(h.archiveRecord(t.id),N("Archived. Find it under Archive.","i-archive")),a();break;case"delete":oe({title:"Move to recently deleted?",message:"It stays here until you delete it permanently. You can restore it any time.",confirmText:"Move",onConfirm:()=>{h.trashRecord(t.id),N("Moved to recently deleted.","i-trash"),n({silent:!0}),history.back()}});break;case"more":_t(t,a);break}}function _t(e,t){U({title:"More",subtitle:e.title,body:`<div class="chip-row" style="flex-direction:column;align-items:stretch">
        <button class="row" data-m="pin" style="width:100%;border:0"><span class="row-thumb">${u("i-pin")}</span><span class="row-main"><span class="row-title">${e.pinned?"Unpin":"Pin to Home"}</span></span></button>
        <button class="row" data-m="edit" style="width:100%;border:0"><span class="row-thumb">${u("i-edit")}</span><span class="row-main"><span class="row-title">Edit details</span></span></button>
        <button class="row" data-m="archive" style="width:100%;border:0"><span class="row-thumb">${u("i-archive")}</span><span class="row-main"><span class="row-title">${e.archivedAt?"Unarchive":"Archive"}</span></span></button>
        <button class="row" data-m="delete" style="width:100%;border:0"><span class="row-thumb">${u("i-trash")}</span><span class="row-main"><span class="row-title">Move to recently deleted</span></span></button>
      </div>`,onMount:(a,n)=>{a.querySelectorAll("[data-m]").forEach(i=>i.addEventListener("click",()=>{const s=i.dataset.m;n(),s==="delete"?Se("delete",e,{paint:t,close:()=>{}}):Se(s,h.record(e.id),{paint:t,close:()=>{}})}))}})}const Qe=e=>e.area!=="private";function Ze(){const e=h.live.filter(Qe),t=h.records.filter(Qe),a=h.reminders.filter(l=>l.status==="open"&&!l.private);h.unreadCount();const n=B(),i=new Date,s=a.filter(l=>T(l.snoozeUntil||l.due)<=7).sort((l,y)=>(l.snoozeUntil||l.due).localeCompare(y.snoozeUntil||y.due)),r=e.filter(l=>l.expiry&&T(l.expiry)<=21&&T(l.expiry)>=-30).sort((l,y)=>l.expiry.localeCompare(y.expiry)),p=[...a.filter(l=>T(l.snoozeUntil||l.due)===0).map(l=>({kind:"rem",r:l})),...a.filter(l=>T(l.snoozeUntil||l.due)<0).slice(0,2).map(l=>({kind:"rem",r:l}))].slice(0,3),c=[...t].sort((l,y)=>(y.updatedAt||"").localeCompare(l.updatedAt||"")).slice(0,5),v=t.filter(l=>l.pinned).slice(0,4),g=[...a.filter(l=>T(l.snoozeUntil||l.due)<0).map(l=>({key:`r-${l.id}`,type:"rem",id:l.id,title:l.title,sub:`Overdue by ${Math.abs(T(l.snoozeUntil||l.due))} day${Math.abs(T(l.snoozeUntil||l.due))===1?"":"s"}`,when:D(l.snoozeUntil||l.due,"short"),icon:"i-bell",tone:"warn"})),...s.filter(l=>T(l.snoozeUntil||l.due)>=0).map(l=>({key:`r-${l.id}`,type:"rem",id:l.id,title:l.title,sub:Ve(l.snoozeUntil||l.due),when:l.time||"",icon:"i-bell",tone:"normal"})),...r.filter(l=>!a.some(y=>y.recordId===l.id)).map(l=>({key:`e-${l.id}`,type:"rec",id:l.id,title:`${l.title} expires`,sub:T(l.expiry)<0?"Already expired":`In ${T(l.expiry)} days`,when:D(l.expiry,"short"),icon:"i-clock",tone:T(l.expiry)<0?"warn":"normal"}))].slice(0,4),d=t.length===0&&a.length===0,f=["health","home","vehicles","education","finance","food","documents","goals"].map(l=>{const y=R(l),E=e.filter(x=>x.area===l).length;return{a:y,count:E}}).sort((l,y)=>y.count-l.count).slice(0,6);return{area:"home-dash",eyebrow:"Keepsy",title:"Home",html:`
      <section class="home-hero">
        <div class="home-hero-art" aria-hidden="true">
          <svg class="hero-lights" viewBox="0 0 430 150" preserveAspectRatio="none">
            <path class="hero-light-wire" d="M4 15 C70 20 92 76 151 70 S238 16 285 28 S354 91 426 45" />
            <g class="hero-bulb hero-bulb--gold"><path d="M72 38v16"/><path d="M66 54h12l-2 7h-8z"/><circle cx="72" cy="48" r="8"/></g>
            <g class="hero-bulb hero-bulb--rose"><path d="M160 70v17"/><path d="M154 87h12l-2 7h-8z"/><circle cx="160" cy="81" r="8"/></g>
            <g class="hero-bulb hero-bulb--sage"><path d="M245 38v17"/><path d="M239 55h12l-2 7h-8z"/><circle cx="245" cy="49" r="8"/></g>
            <g class="hero-bulb hero-bulb--gold"><path d="M341 69v16"/><path d="M335 85h12l-2 7h-8z"/><circle cx="341" cy="79" r="8"/></g>
          </svg>
          <span class="hero-orbit hero-orbit--one"></span>
          <span class="hero-orbit hero-orbit--two"></span>
          <span class="hero-sun"></span>
          <span class="hero-scribble">a softer place to remember</span>
          <span class="hero-stamp">${u("i-sparkle")}<small>kept with care</small></span>
        </div>
        <div class="home-ribbon">YOUR LITTLE SPACE FOR EVERYTHING WORTH REMEMBERING</div>
        <div class="greet"><span class="pulse" aria-hidden="true"></span>${o(xt(i))}, ${o(h.profile?.name||"Me")} · ${o(D(n,"long"))}</div>
        <h1 class="display">${d?"Your life, <em>quietly kept</em>.":`${o(Gt(i))} — <em>your life, kept</em>.`}</h1>
        <p class="lede">${d?"Nothing to maintain. Tell Keepsy what happened — a purchase, a service, a medicine, a date — and it will remember the details for you.":Jt(e,a,r)}</p>
      </section>

      <nav class="home-shortcuts" aria-label="Keepsy shortcuts">
        <button class="home-shortcut home-shortcut--add" data-quick-add>${u("i-plus")}<span>Add a memory</span><b>↗</b></button>
        <a class="home-shortcut home-shortcut--calendar" href="#/calendar" data-nav>${u("i-calendar")}<span>Calendar</span><b>↗</b></a>
        <a class="home-shortcut home-shortcut--timeline" href="#/timeline" data-nav>${u("i-clock")}<span>Timeline</span><b>↗</b></a>
        <a class="home-shortcut home-shortcut--reminders" href="#/reminders" data-nav>${u("i-bell")}<span>Reminders</span><b>↗</b></a>
      </nav>

      ${d?Vt():`
        <section class="section" aria-labelledby="attn-h">
          <div class="section-head">
            <span class="section-kicker">A gentle check-in</span>
            <h2 id="attn-h">What needs my attention?</h2>
            ${g.length?`<span class="tag accent">${g.length} thing${g.length===1?"":"s"}</span>`:""}
          </div>
          ${g.length?`<div class="attn">${g.map(l=>`
            <button class="attn-item" ${l.type==="rem"?`data-open-reminder="${l.id}"`:`data-open-record="${l.id}"`}>
              <span class="attn-mark">${u(l.icon)}</span>
              <span class="attn-main">
                <span class="attn-title">${o(l.title)}</span>
                <span class="attn-sub">${o(l.sub)}</span>
              </span>
              <span class="attn-when">${o(l.when)}</span>
            </button>`).join("")}</div>`:`<div class="empty" style="padding:26px 20px">
                 <div class="em-mark">${u("i-check")}</div>
                 <h3>Nothing needs your attention right now</h3>
                 <p>Keepsy is keeping an eye on ${C(a.length,"reminder")}. Enjoy the quiet.</p>
               </div>`}
        </section>

        <section class="section" aria-labelledby="today-h">
          <div class="section-head"><h2 id="today-h">Today</h2></div>
          <div class="today-line">
            <div class="today-date">
              <div class="td-num num">${i.getDate()}</div>
              <div class="td-dow">${o(D(n,"long").split(",")[0])}</div>
            </div>
            <div class="today-items">
              ${p.length?p.map(({r:l})=>`<div class="ti">${u("i-bell")}<span>${o(l.title)}</span></div>`).join(""):`<div class="ti">${u("i-moon")}<span>Nothing scheduled. A good day for a quiet note.</span></div>`}
            </div>
          </div>
        </section>

        ${v.length?`
        <section class="section" aria-labelledby="pin-h">
          <div class="section-head"><h2 id="pin-h">Pinned</h2></div>
          <div class="tile-strip">
            ${v.map(l=>`<button class="tile tile--area" style="--tile-ink:${R(l.area)?.palette?.[0]||"#192A3B"};--tile-accent:${R(l.area)?.palette?.[2]||"#C9A777"}" data-open-record="${l.id}">
              <span class="t-ic">${u(Fe(l.area))}</span>
              <span class="t-name">${o(l.title)}</span>
              <span class="t-meta">${o(W(l))}</span>
            </button>`).join("")}
          </div>
        </section>`:""}

        <section class="section" aria-labelledby="up-h">
          <div class="section-head"><h2 id="up-h">Up next</h2>
            <a class="link-more" href="#/reminders">All reminders ${u("i-chevron-right")}</a>
          </div>
          ${s.filter(l=>T(l.snoozeUntil||l.due)>0).length?`<div class="panel panel-pad">
                ${s.filter(l=>T(l.snoozeUntil||l.due)>0).slice(0,4).map(l=>`
                  <button class="row" data-open-reminder="${l.id}" style="width:100%">
                    <span class="row-thumb">${u("i-bell")}</span>
                    <span class="row-main"><span class="row-title">${o(l.title)}</span>
                      <span class="row-meta">${o(Ve(l.snoozeUntil||l.due))}${l.time?` · ${o(l.time)}`:""}</span></span>
                    <span class="row-side">${u("i-chevron-right")}</span>
                  </button>`).join("")}
              </div>`:'<p class="hint" style="padding:2px 0 8px">Nothing coming up in the next week.</p>'}
        </section>

        <section class="section" aria-labelledby="areas-h">
          <div class="section-head"><h2 id="areas-h">Your life</h2></div>
          <div class="tile-strip">
            ${f.map(({a:l,count:y})=>`<a class="tile tile--area" style="--tile-ink:${l.palette[0]};--tile-accent:${l.palette[2]}" href="#/a/${l.slug}" data-nav>
              <span class="t-ic">${u(l.icon)}</span>
              <span class="t-name">${o(l.name)}</span>
              <span class="t-meta">${y?C(y,"record"):"Empty for now"}</span>
              <span class="tile-arrow" aria-hidden="true">↗</span>
            </a>`).join("")}
          </div>
        </section>

        <section class="section" aria-labelledby="recent-h">
          <div class="section-head"><h2 id="recent-h">Recently</h2>
            <a class="link-more" href="#/timeline">Timeline ${u("i-chevron-right")}</a>
          </div>
          <div class="panel panel-pad" style="padding:6px 18px">
            ${c.length?c.map(l=>`
              <button class="memory-row" data-open-record="${l.id}">
                <span class="mr-when">${o(D(l.date,"short"))}</span>
                <span class="mr-main">
                  <span class="mr-title">${o(l.title)}</span>
                  <span class="mr-meta">${o(X(l.area))} · ${o(W(l))}${l.amount!=null?` · ${o(j(l.amount))}`:""}</span>
                </span>
                <span class="row-side">${u("i-chevron-right")}</span>
              </button>`).join(""):'<p class="hint" style="padding:14px 0">Nothing saved yet.</p>'}
          </div>
        </section>

        ${Xt(e,a)}
      `}

      <section class="section">
        <div class="panel panel-pad" style="display:flex;gap:14px;align-items:center">
          <span class="avatar-lg" style="width:44px;height:44px;border-radius:13px;font-size:1.1rem">${u("i-sparkle")}</span>
          <div style="flex:1;min-width:0">
            <div style="font-size:.9rem;font-weight:500">Something happened? Tell Keepsy.</div>
            <div class="hint">One sentence is enough. Keepsy fills in the rest, you confirm.</div>
          </div>
          <button class="btn btn-accent btn-sm" data-quick-add>Add</button>
        </div>
      </section>
    `,mount(){}}}function Gt(e){const t=e.getHours();return t<12?"Morning":t<17?"Afternoon":"Evening"}function Jt(e,t,a){const n=[];t.length&&n.push(`${C(t.length,"reminder")} on your mind`),a.length&&n.push(`${a.length} expiring soon`);const i=z(B()),s=e.filter(r=>z(r.date)===i);return s.length&&n.push(`${s.length} kept this month`),n.length?n.join(" · ")+". Everything else is quietly in its place.":"A quiet page. Tell Keepsy what happened and it will hold on to the details."}function Vt(){return`
    <section class="section">
      <div class="empty first-run-card">
        <span class="welcome-note">no pressure · just life</span>
        <div class="em-mark">${u("i-sparkle")}</div>
        <h3>No memories yet</h3>
        <p>Tell Keepsy what happened — “Bought shampoo ₹450”, “AC serviced today”, “Medicine expires next month”. It will remember the date, the amount and when to remind you.</p>
        <button class="btn btn-accent" data-quick-add>Tell Keepsy something</button>
      </div>
    </section>
    <section class="section">
      <div class="section-head"><h2>Small things worth keeping</h2></div>
      <div class="tile-strip">
        ${["health","home","vehicles","education","finance","documents"].map(e=>{const t=R(e);return`<a class="tile tile--area" style="--tile-ink:${t.palette[0]};--tile-accent:${t.palette[2]}" href="#/a/${t.slug}" data-nav>
            <span class="t-ic">${u(t.icon)}</span>
            <span class="t-name">${o(t.name)}</span>
            <span class="t-meta">Nothing yet</span>
            <span class="tile-arrow" aria-hidden="true">↗</span>
          </a>`}).join("")}
      </div>
    </section>
  `}function Xt(e,t){const a=z(B()),n=e.filter(d=>z(d.date)===a),i=n.reduce((d,f)=>d+(Number(f.amount)||0),0),s={};n.forEach(d=>{s[d.area]=(s[d.area]||0)+(Number(d.amount)||0)});const r=Object.entries(s).sort((d,f)=>f[1]-d[1])[0],p={};e.forEach(d=>{const f=d.title.toLowerCase();p[f]=(p[f]||0)+1});const c=Object.entries(p).filter(([,d])=>d>=2).sort((d,f)=>f[1]-d[1])[0];let v="",g="A quiet observation";if(i>0&&r)g="This month, quietly",v=`${j(i)} kept in ${te(a)} so far — most of it in ${X(r[0])}.`;else if(c)g="A pattern",v=`You have noted “${c[0]}” ${c[1]} times. Keepsy can remember the next one too.`;else if(t.length)g="Upcoming",v=`${C(t.length,"reminder")} waiting. Nothing urgent, nothing forgotten.`;else return"";return`<section class="section">
    <div class="insight-quote">
      <div class="iq-label">${o(g)}</div>
      <p>${o(v)}</p>
      <div class="iq-foot"><a href="#/insights" data-nav style="text-decoration:underline;text-underline-offset:3px">See insights →</a></div>
    </div>
  </section>`}const Qt={health:["care note","i-heart"],beauty:["little rituals","i-sparkle"],home:["loved & lived in","i-home"],food:["good things inside","i-leaf"],education:["keep becoming","i-book"],work:["in your own time","i-briefcase"],vehicles:["miles & moments","i-car"],finance:["money, remembered","i-wallet"],documents:["paper trail","i-doc"],family:["for your people","i-heart"],pets:["little life","i-paw"],personal:["just for you","i-moon"],travel:["somewhere new","i-plane"],hobbies:["made for fun","i-palette"],goals:["one thing at a time","i-target"],other:["odds & ends","i-grid"],private:["only you","i-eye-off"]},Zt={health:'<path d="M16 125h38l18-43 28 91 27-69 18 29h59"/><path d="M111 55v-18m-9 9h18"/>',beauty:'<path d="M78 48h58l-8 20H86zM85 68h44l8 99H77z"/><path d="M101 102h12m-6-6v12M166 52l5 13 13 5-13 5-5 13-5-13-13-5 13-5z"/>',home:'<path d="m28 106 82-69 82 69M48 97v83h124V97M92 180v-54h37v54M66 112h16v18H66zM144 112h16v18h-16z"/>',food:'<path class="motif-leaf" d="M111 224C75 190 36 161 39 112 42 66 81 31 174 20c8 84-6 145-53 181-4 3-7 5-10 7Z"/><path d="M111 224C108 170 106 107 174 20M108 188 64 138M108 160 151 111M106 131 68 91M111 102 156 69M108 76 90 50"/>',education:'<path d="M26 55h55c17 0 29 10 29 25v111c0-17-12-27-29-27H26zM194 55h-55c-17 0-29 10-29 25v111c0-17 12-27 29-27h55z"/><path d="M42 82h35M42 103h35M143 82h35M143 103h35"/>',work:'<rect x="33" y="76" width="154" height="105" rx="14"/><path d="M76 76V57h68v19M33 116h154M94 116v16h32v-16"/><path d="m110 31 5 12 13 1-10 8 3 13-11-7-11 7 3-13-10-8 13-1z"/>',vehicles:'<path d="M68 18h84M82 18c-8 37-12 66-12 102s4 64 12 102M138 18c8 37 12 66 12 102s-4 64-12 102M109 40v30m0 22v30m0 22v30m0 22v15"/>',finance:'<circle cx="109" cy="116" r="68"/><circle cx="109" cy="116" r="48"/><circle cx="109" cy="116" r="25"/><path d="M109 91v50m14-38c-5-7-25-8-28 2-5 14 29 10 28 25-1 12-22 15-31 5"/>',documents:'<path d="M62 34h74l28 29v143H62zM136 34v31h28M80 91h64M80 113h64M80 135h48M80 157h55"/><path d="M45 50v153h20"/>',family:'<circle cx="79" cy="82" r="21"/><circle cx="141" cy="82" r="21"/><circle cx="110" cy="58" r="19"/><path d="M38 172c3-31 18-48 41-48s38 17 41 48M102 172c3-31 18-48 41-48s38 17 41 48M84 147c6-17 15-27 26-27s20 10 26 27"/>',pets:'<ellipse cx="67" cy="75" rx="13" ry="18"/><ellipse cx="104" cy="57" rx="13" ry="18"/><ellipse cx="143" cy="67" rx="13" ry="18"/><ellipse cx="171" cy="101" rx="12" ry="17"/><path d="M109 105c29 0 48 20 48 43 0 18-14 29-31 25-11-3-23-3-34 0-17 4-31-7-31-25 0-23 19-43 48-43Z"/>',personal:'<path d="M145 45c-35 10-55 43-45 77 9 31 41 50 72 41-17 25-50 38-81 28-39-12-61-54-49-94 12-39 54-61 94-49 4 1 7 2 9 3Z"/><path d="m163 42 4 10 10 4-10 4-4 10-4-10-10-4 10-4zM64 151l3 7 7 3-7 3-3 7-3-7-7-3 7-3z"/>',travel:'<path d="m24 174 51-69 28 33 35-73 58 109z"/><path d="M34 193c25-24 49-8 70-25 20-16 18-40 45-48 15-5 26 2 38 10"/><circle cx="187" cy="128" r="7"/>',hobbies:'<path d="M110 39c-42 0-77 32-77 72s34 75 73 75c15 0 25-11 25-23 0-10-9-17-9-27 0-9 7-16 17-16h18c21 0 35-14 35-34 0-26-35-47-82-47Z"/><circle cx="73" cy="91" r="7"/><circle cx="100" cy="70" r="7"/><circle cx="132" cy="75" r="7"/><circle cx="155" cy="97" r="7"/>',goals:'<circle cx="110" cy="122" r="76"/><circle cx="110" cy="122" r="51"/><circle cx="110" cy="122" r="25"/><path d="m110 122 75-80M161 42h24v24"/>',other:'<rect x="38" y="48" width="54" height="54" rx="16"/><circle cx="145" cy="74" r="28"/><path d="M42 158h52m-26-26v52M129 146h49v40h-49zM152 146v40"/><path d="m110 36 4 10 11 4-11 4-4 11-4-11-11-4 11-4z"/>'};function ea(e,t){const a=R(e);if(!a||e==="private")return null;const n=e==="private",i=e==="food",s=F.findIndex(m=>m.slug===e),r=s>0?F[s-1]:null,p=s>=0&&s<F.length-1?F[s+1]:null,c=Zt[e]||"",[v,g]=Qt[e]||["kept here",a.icon],d=h.live.filter(m=>m.area===e),f=t?.get("kind")||"all",l=t?.get("sort")||"recent",y=(t?.get("q")||"").toLowerCase();let E=d.slice();f!=="all"&&(E=E.filter(m=>m.kind===f)),y&&(E=E.filter(m=>m.title.toLowerCase().includes(y)||(m.note||"").toLowerCase().includes(y))),l==="recent"&&E.sort((m,M)=>(M.date+M.createdAt).localeCompare(m.date+m.createdAt)),l==="oldest"&&E.sort((m,M)=>(m.date+m.createdAt).localeCompare(M.date+M.createdAt)),l==="amount"&&E.sort((m,M)=>(Number(M.amount)||0)-(Number(m.amount)||0));const x=h.reminders.filter(m=>{if(m.status!=="open")return!1;const M=m.recordId?h.record(m.recordId):null;return m.recordId?M?.area===e:!1}),I=d.reduce((m,M)=>m+(Number(M.amount)||0),0),S=d.filter(m=>z(m.date)===z(B())).reduce((m,M)=>m+(Number(M.amount)||0),0);d.filter(m=>m.expiry&&T(m.expiry)>=0&&T(m.expiry)<=60).length;const L=d.filter(m=>m.expiry&&T(m.expiry)<=30).length,k=d.filter(m=>m.expiry&&T(m.expiry)<0).length,w=d.filter(m=>m.warrantyUntil).length,P=d.filter(m=>m.expiry&&T(m.expiry)<=30&&T(m.expiry)>=0).length,A=m=>{switch(m){case"records":return Z("Saved",d.length);case"spent":return Z("Total spent",j(I));case"month":return Z("This month",j(S));case"upcoming":return Z("Upcoming",x.length||d.filter(M=>T(M.date)>=0).length);case"expiring":return Z("Expiring",L);case"expired":return Z("Expired",k);case"warranties":return Z("Warranties",w);case"due":return Z("Due soon",P);default:return""}},b={};d.forEach(m=>{b[m.kind]=(b[m.kind]||0)+1});const $=e==="health"?`
    <section class="health-board" aria-labelledby="health-board-title">
      <div class="health-board-head">
        <div><span class="health-board-kicker">YOUR CARE, AT A GLANCE</span><h2 id="health-board-title">Little health hub</h2></div>
        <svg class="health-pulse-art" viewBox="0 0 160 56" aria-hidden="true"><path d="M2 31h38l13-19 17 34 16-26 12 11h60"/></svg>
      </div>
      <div class="health-widget-grid">
        ${[["medicine","Medicines","i-doc","Keep expiry dates close"],["appointment","Appointments","i-calendar","Keep care dates together"],["symptom","Symptoms","i-heart","Notice what changes"]].map(([m,M,ae,ce])=>`<a class="health-widget health-widget--${m}" href="#/a/health?kind=${m}" data-nav aria-label="${M}: ${b[m]||0} saved. ${ce}">
          <span class="health-widget-top">${u(ae)}<b>${b[m]||0}</b></span>
          <strong>${M}</strong><small>${b[m]?`${C(b[m],"memory")} saved`:ce}</small><span class="health-widget-arrow" aria-hidden="true">↗</span>
        </a>`).join("")}
      </div>
      <button class="health-add" data-new-record="health">${u("i-plus")} Add a care memory <span>one small note is enough</span></button>
    </section>`:"",q=e==="health"?$:`
    <section class="section-board section-board--${e}" aria-label="${o(a.name)} quick widgets" style="--board-ink:${a.palette[0]};--board-accent:${a.palette[2]};--board-wash:${a.palette[3]}">
      <div class="section-board-head">
        <span class="section-board-icon">${u(a.icon)}</span>
        <div><span class="section-board-kicker">${o(a.kicker)}</span><h2>${o(a.name)} at a glance</h2></div>
        <span class="section-board-count">${d.length}<small>saved</small></span>
      </div>
      <div class="section-widget-grid ${a.kinds.length<3?"section-widget-grid--two":""}">
        ${a.kinds.slice(0,3).map(m=>`<a class="section-widget" href="#/a/${e}?kind=${m.id}" data-nav aria-label="${o(m.label)}: ${b[m.id]||0} saved">
          <span class="section-widget-top">${u(m.icon)}<b>${b[m.id]||0}</b></span>
          <strong>${o(m.label)}</strong><small>${b[m.id]?`${C(b[m.id],"memory")} saved`:`Open ${o(m.label.toLowerCase())} pocket`}</small><span class="section-widget-arrow" aria-hidden="true">↗</span>
        </a>`).join("")}
      </div>
      <button class="section-board-add" data-new-record="${e}">${u("i-plus")} Add to ${o(a.name)}</button>
    </section>`;return{area:e,eyebrow:a.kicker,title:a.name,html:`
      <section class="area-hero area-hero--${e} ${i?"area-hero--botanical":""}" data-area-swipe-zone>
        <span class="area-tape" aria-hidden="true"></span>
        ${c?`<svg class="area-motif area-motif--${e}" viewBox="0 0 220 240" aria-hidden="true" focusable="false">${c}</svg>`:""}
        <div class="ah-top">
          <span class="ah-ic">${u(a.icon)}</span>
          <div style="flex:1;min-width:0">
            <h1>${o(a.name)}</h1>
            <p class="lede">${o(a.blurb)}</p>
          </div>
          <div class="area-ornament" aria-hidden="true">
            <span class="area-orbit"></span>
            <span class="area-sticker">${u(g)}<small>${o(v)}</small></span>
            <span class="area-spark">✳</span>
          </div>
        </div>
        <div class="ah-actions">
          <button class="btn btn-sm btn-accent" data-new-record="${e}">${u("i-plus")} Add to ${o(a.name.split(" ")[0])}</button>
          ${d.length?`<a class="chip" href="#/a/${e}?sort=amount">${u("i-filter")} Highest amount</a>`:""}
        </div>
      </section>

      ${s>=0?`
        <nav class="area-switcher" aria-label="Browse life areas">
          <div class="area-switcher-head">
            <span class="area-switcher-label">Your Life <b>${String(s+1).padStart(2,"0")} <i>/</i> ${String(F.length).padStart(2,"0")}</b></span>
            <span class="area-switcher-hint">Swipe on phone · use arrows on laptop</span>
          </div>
          <div class="area-switcher-rail" role="list">
            ${F.map((m,M)=>`<a role="listitem" class="area-switcher-chip ${m.slug===e?"active":""}" href="#/a/${m.slug}" data-nav aria-current="${m.slug===e?"page":"false"}" style="--nav-color:${m.palette[0]};--nav-pop:${m.palette[2]}">
              <span class="asc-icon">${u(m.icon)}</span><span>${o(m.name.replace(" & Grooming","").replace(" & Milestones",""))}</span>
            </a>`).join("")}
          </div>
          <div class="area-switcher-foot">
            ${r?`<a class="area-dir-btn" href="#/a/${r.slug}" data-nav aria-label="Previous area: ${o(r.name)}">${u("i-chevron-left")}<span>Previous</span></a>`:'<span class="area-dir-spacer"></span>'}
            <span class="area-swipe-note">Phone: swipe · Laptop: ← / →</span>
            ${p?`<a class="area-dir-btn" href="#/a/${p.slug}" data-nav aria-label="Next area: ${o(p.name)}"><span>Next</span>${u("i-chevron-right")}</a>`:'<span class="area-dir-spacer"></span>'}
          </div>
        </nav>`:""}

      ${n?`<div class="notice quiet" style="margin-top:14px">${u("i-eye-off")}<span>These records stay out of Home, Timeline, Search and Insights. Only you see them.</span></div>`:""}

      ${q}

      ${d.length?`
        <section class="section" style="margin-top:20px">
          <div class="stat-row">${a.stats.map(A).join("")}</div>
        </section>`:""}

      <section class="section">
        ${d.length?`
          <div class="filter-strip" role="tablist" aria-label="Filter by kind">
            <button class="chip ${f==="all"?"on":""}" data-area-filter="${e}" data-kind="all" role="tab" aria-selected="${f==="all"}">All · ${d.length}</button>
            ${a.kinds.filter(m=>b[m.id]).map(m=>`
              <button class="chip ${f===m.id?"on":""}" data-area-filter="${e}" data-kind="${m.id}" role="tab" aria-selected="${f===m.id}">
                ${u(m.icon)} ${o(m.label)} · ${b[m.id]}
              </button>`).join("")}
          </div>
          <div class="record-list">
            ${E.length?E.map(m=>ut(m,{showArea:!1})).join(""):'<p class="hint" style="padding:18px 2px">Nothing matches that filter.</p>'}
          </div>
          ${d.length>3?`<div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px">
            <span class="hint">${C(E.length,"record")} shown</span>
            <div class="seg" role="group" aria-label="Sort">
              <button data-area-sort="${e}" data-sort="recent" aria-pressed="${l==="recent"}">Recent</button>
              <button data-area-sort="${e}" data-sort="oldest" aria-pressed="${l==="oldest"}">Oldest</button>
              <button data-area-sort="${e}" data-sort="amount" aria-pressed="${l==="amount"}">Amount</button>
            </div>
          </div>`:""}
        `:`<div class="empty">
            <div class="em-mark">${u(a.icon)}</div>
            <h3>Nothing here yet</h3>
            <p>${o(a.empty)}</p>
            <button class="btn btn-accent" data-new-record="${e}">Add the first one</button>
          </div>`}
      </section>

      ${x.length?`
        <section class="section">
          <div class="section-head"><h2>Watching this area</h2><a class="link-more" href="#/reminders">All ${u("i-chevron-right")}</a></div>
          <div class="panel panel-pad" style="padding:6px 18px">
            ${x.slice(0,5).map(m=>`
              <button class="row" data-open-reminder="${m.id}" style="width:100%">
                <span class="row-thumb">${u("i-bell")}</span>
                <span class="row-main"><span class="row-title">${o(m.title)}</span>
                  <span class="row-meta">${o(Kt(m))}</span></span>
                <span class="row-side">${u("i-chevron-right")}</span>
              </button>`).join("")}
          </div>
        </section>`:""}

      ${d.length?`
        <section class="section">
          <div class="section-head"><h2>Latest activity</h2></div>
          <div class="history">
            ${d.slice().sort((m,M)=>(M.updatedAt||"").localeCompare(m.updatedAt||"")).slice(0,4).map(m=>`<div class="hist-item"><strong>${o(m.title)}</strong> — ${o(W(m))}, ${o(D(m.date,"short"))}${m.amount!=null?` · ${o(j(m.amount))}`:""}</div>`).join("")}
          </div>
        </section>`:""}
    `,mount(){}}}function ta(e){const t=(e?.get("q")||"").trim(),a=e?.get("area")||"all",n=e?.get("range")||"all",i=B();let s=h.live.filter(g=>g.area!=="private");if(a!=="all"&&(s=s.filter(g=>g.area===a)),n==="7"||n==="30"){const g=new Date;g.setHours(12,0,0,0),g.setDate(g.getDate()-(Number(n)-1));const d=ke(g);s=s.filter(f=>f.date>=d&&f.date<=i)}if(t){const g=t.toLowerCase();s=s.filter(d=>d.title.toLowerCase().includes(g)||(d.note||"").toLowerCase().includes(g)||(d.tags||[]).some(f=>f.toLowerCase().includes(g)))}s.sort((g,d)=>(d.date+(d.time||"")).localeCompare(g.date+(g.time||""))||(d.createdAt||"").localeCompare(g.createdAt||""));const r=new Map;s.forEach(g=>{r.has(g.date)||r.set(g.date,[]),r.get(g.date).push(g)});const p=[...new Set(h.live.filter(g=>g.area!=="private").map(g=>g.area))],c=(g=a,d=n,f=t)=>{const l=[];return g!=="all"&&l.push(`area=${encodeURIComponent(g)}`),d!=="all"&&l.push(`range=${encodeURIComponent(d)}`),f&&l.push(`q=${encodeURIComponent(f)}`),`#/timeline${l.length?`?${l.join("&")}`:""}`},v=n==="7"?"last 7 days":n==="30"?"last 30 days":"all time";return{area:"home-dash",eyebrow:"Explore",title:"Timeline",html:`
      <section class="screen-head">
        <div class="eyebrow">Your life, in order</div>
        <h1>Timeline</h1>
        <p class="lede">Everything Keepsy has been told, gathered by the day it happened.</p>
      </section>

      <section class="timeline-overview" aria-label="Timeline summary">
        <div class="timeline-overview-copy"><span class="timeline-overview-kicker">A LIFE, IN LITTLE MOMENTS</span><strong>${s.length?`${s.length} ${s.length===1?"memory":"memories"} · ${r.size} ${r.size===1?"day":"days"}`:"Your story starts here"}</strong><small>${s.length?`Showing ${v}${a!=="all"?` · ${o(X(a))}`:""}`:"Each thing you save will find its place here."}</small></div>
        <span class="timeline-overview-total"><b>${s.length}</b><small>kept</small></span>
        <div class="timeline-overview-line" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
      </section>

      <div class="search-bar" style="margin-top:16px">
        ${u("i-search")}
        <input class="search-input" id="tl-q" value="${o(t)}" placeholder="Search this timeline" aria-label="Search timeline" />
      </div>
      <nav class="tl-range" aria-label="Filter timeline by date">
        ${[["all","All time"],["7","7 days"],["30","30 days"]].map(([g,d])=>`<a class="tl-range-chip ${n===g?"on":""}" href="${c(a,g)}" data-nav aria-current="${n===g?"true":"false"}">${d}</a>`).join("")}
      </nav>
      ${p.length?`<div class="filter-strip">
        <a class="chip ${a==="all"?"on":""}" href="${c("all")}" data-nav>All areas</a>
        ${p.map(g=>`<a class="chip ${a===g?"on":""}" href="${c(g)}" data-nav>${o(R(g)?.name||g)}</a>`).join("")}
      </div>`:""}

      ${s.length?[...r.entries()].map(([g,d])=>`
        <section class="tl-day" aria-label="${o(et(g))}, ${o(C(d.length,"memory"))}">
          <div class="tl-day-head">
            <span class="tl-date-mark"><b>${new Date(`${g}T12:00:00`).getDate()}</b><small>${D(g,"short").split(" ")[0]}</small></span>
            <div class="tl-day-title"><span>${o(et(g))}</span><small>${D(g,"long")}</small></div>
            <span class="tl-count">${d.length}</span>
            <span class="tl-rule"></span>
          </div>
          <div class="tl-items">
            ${d.map(f=>`
              <button class="tl-item" data-open-record="${f.id}">
                <span class="tl-time">${o(f.time?Ke(f.time):D(f.date,"short"))}</span>
                <span class="tl-body">
                  <span class="tl-title">${xe(f.title,t)}</span>
                  <span class="tl-meta">
                    <span>${o(X(f.area))}</span><span>·</span><span>${o(W(f))}</span>
                    ${f.amount!=null?`<span>·</span><span>${o(j(f.amount))}</span>`:""}
                    ${f.quantity?`<span>·</span><span>${o(`${f.quantity}${f.unit?` ${f.unit}`:""}`)}</span>`:""}
                  </span>
                </span>
                <span class="row-side tl-area-mark" style="--tl-area:${R(f.area)?.palette?.[0]||"#192A3B"}">${u(Fe(f.area))}</span>
              </button>`).join("")}
          </div>
        </section>`).join(""):`<div class="empty" style="margin-top:26px">
          <div class="em-mark">${u("i-clock")}</div>
          <h3>${t?"Nothing matches that":"No memories yet"}</h3>
          <p>${t?"Try a different word, or clear the search.":"Tell Keepsy what happened and it will appear here, day by day."}</p>
          ${t?'<a class="btn btn-ghost" href="#/timeline" data-nav>Clear search</a>':'<button class="btn btn-accent" data-quick-add>Tell Keepsy something</button>'}
        </div>`}

      ${s.length?`<p class="hint" style="text-align:center;margin-top:26px">${C(s.length,"memory","memories")}${t?" matching":""}</p>`:""}
    `,mount(){const g=document.getElementById("tl-q");if(!g)return;let d;g.addEventListener("input",()=>{clearTimeout(d),d=setTimeout(()=>{const f=g.value.trim(),l=c(a,n,f);history.replaceState(null,"",l),window.dispatchEvent(new CustomEvent("keepsy:route",{detail:{raw:l}}))},320)})}}}function et(e){const t=T(e);return t===0?"Today":t===-1?"Yesterday":t===1?"Tomorrow":D(e,"long")}const ue=e=>String(e).padStart(2,"0");function aa(e){const t=new Date,a=B(),n=e?.get("m");let i=t.getFullYear(),s=t.getMonth();n&&/^\d{4}-\d{2}$/.test(n)&&(i=Number(n.slice(0,4)),s=Number(n.slice(5,7))-1);const r=e?.get("d")||(n?"":a),p=h.data.settings.showCycle===!0,c=h.reminders.filter($=>$.status==="open"&&!$.private),v=h.live.filter($=>$.area!=="private"),g=p?h.live.filter($=>$.area==="private"&&$.kind==="tracking"):[],d=$=>{const q=[];return c.forEach(m=>{(m.snoozeUntil||m.due)===$&&q.push({type:"reminder",label:m.title,tone:"accent",id:m.id,private:m.private})}),v.forEach(m=>{m.expiry===$&&q.push({type:"expiry",label:`${m.title} expires`,tone:m.private?"rose":"ink",id:m.id}),m.date===$&&m.amount==null&&!m.expiry&&q.push({type:"record",label:m.title,tone:"ink",id:m.id})}),g.forEach(m=>{m.date===$&&q.push({type:"cycle",label:"Cycle note",tone:"rose",id:m.id})}),q},l=new Date(i,s,1).getDay(),y=new Date(i,s+1,0).getDate(),E=new Date(i,s,0).getDate(),x=[];for(let $=0;$<l;$++){const q=E-l+1+$,m=new Date(i,s-1,q);x.push({iso:ke(m),day:q,out:!0})}for(let $=1;$<=y;$++)x.push({iso:`${i}-${ue(s+1)}-${ue($)}`,day:$,out:!1});for(;x.length%7!==0;){const $=x.length-(l+y)+1,q=new Date(i,s+1,$);x.push({iso:ke(q),day:$,out:!0})}const I=r?d(r):[],S=x.filter($=>!$.out).flatMap($=>d($.iso)),L=S.filter($=>$.type==="reminder").length,k=S.filter($=>$.type==="expiry").length,w=S.filter($=>$.type==="record"||$.type==="cycle").length,P=S.length,A=new Date(i,s-1,1),b=new Date(i,s+1,1);return{area:"home-dash",eyebrow:"Explore",title:"Calendar",html:`
      <section class="screen-head">
        <div class="eyebrow">Dates that matter</div>
        <h1>Calendar</h1>
      </section>

      <div class="cal-head" style="margin-top:14px">
        <a class="cal-nav-btn" href="#/calendar?m=${A.getFullYear()}-${ue(A.getMonth()+1)}" data-nav aria-label="Previous month">${u("i-chevron-left")}<span>Previous</span></a>
        <h2 style="text-align:center">${we[s]} ${i}</h2>
        <a class="cal-nav-btn" href="#/calendar?m=${b.getFullYear()}-${ue(b.getMonth()+1)}" data-nav aria-label="Next month"><span>Next</span>${u("i-chevron-right")}</a>
      </div>

      <section class="cal-month-summary" aria-label="Month overview">
        <div class="cal-summary-copy"><span class="cal-summary-kicker">A LITTLE AT A GLANCE</span><strong>${P?`${P} date${P===1?"":"s"} to keep in view`:"A quiet month so far"}</strong><small>Choose any day to see what belongs there.</small><a class="cal-today-link" href="#/calendar?m=${a.slice(0,7)}&d=${a}" data-nav>${u("i-calendar")} Today</a></div>
        <span class="cal-summary-total"><b>${P}</b><small>this month</small></span>
        <div class="cal-summary-metrics"><span class="cal-metric cal-metric--reminder"><i></i>${L} reminders</span><span class="cal-metric cal-metric--expiry"><i></i>${k} expiries</span><span class="cal-metric cal-metric--date"><i></i>${w} saved dates</span></div>
      </section>
      <div class="cal-swipe-hint">On phone, swipe the calendar to change months · on laptop, use Previous / Next</div>

      <div class="cal-dow">${wt.map($=>`<span>${$}</span>`).join("")}</div>
      <div class="cal-grid" role="grid" aria-label="${we[s]} ${i}">
        ${x.map($=>{const q=d($.iso),m=q.slice(0,3).map(ae=>`<i class="cd-dot ${ae.tone==="accent"?"":ae.tone==="rose"?"rose":"ink"}"></i>`).join(""),M=`${D($.iso,"long")}${q.length?`, ${q.length} event${q.length===1?"":"s"}`:""}`;return`<a class="cal-cell ${$.out?"out":""} ${q.length?"has-events":""} ${$.iso===a?"today":""} ${$.iso===r?"sel":""}"
                     href="#/calendar?m=${$.iso.slice(0,7)}&d=${$.iso}" data-nav aria-label="${o(M)}" aria-current="${$.iso===a?"date":"false"}" role="gridcell">
            <span class="cd num">${$.day}</span>
            <span class="cal-dots">${m}</span>
          </a>`}).join("")}
      </div>

      <div class="cal-legend">
        <span><i></i>Reminder</span>
        <span><i class="ink"></i>Expiry or date</span>
        ${p?'<span><i style="background:#B98292"></i>Private tracking</span>':""}
      </div>

      <section class="section cal-day-detail" aria-live="polite">
        <div class="section-head"><h2>${r?D(r,"long"):"Pick a day"}</h2>
          <span class="hint">${r?I.length?`${I.length} here`:"A quiet date":""}</span></div>
        ${r?I.length?`<div class="panel panel-pad" style="padding:4px 18px">
          ${I.map($=>$.type==="reminder"?`<button class="row" data-open-reminder="${$.id}" style="width:100%">
                 <span class="row-thumb">${u("i-bell")}</span>
                 <span class="row-main"><span class="row-title">${o($.private?"Private reminder":$.label)}</span>
                   <span class="row-meta">Reminder</span></span>
                 <span class="row-side">${u("i-chevron-right")}</span></button>`:`<button class="row" data-open-record="${$.id}" style="width:100%">
                 <span class="row-thumb">${u($.type==="expiry"?"i-clock":"i-calendar")}</span>
                 <span class="row-main"><span class="row-title">${o($.label)}</span>
                   <span class="row-meta">${$.type==="expiry"?"Expiry":"Saved date"}</span></span>
                 <span class="row-side">${u("i-chevron-right")}</span></button>`).join("")}
          </div>`:`<div class="empty" style="padding:26px 20px">
              <div class="em-mark">${u("i-calendar")}</div>
              <h3>Nothing on this day</h3>
              <p>A quiet date. Add a reminder if something belongs here.</p>
              <button class="btn btn-ghost btn-sm" data-new-reminder>Add a reminder</button>
            </div>`:'<p class="hint">Choose a date above to see what is attached to it.</p>'}
      </section>
    `,mount(){const $=document.querySelector(".cal-grid");if(!$)return;let q=null;$.addEventListener("touchstart",m=>{m.touches.length===1&&(q={x:m.touches[0].clientX,y:m.touches[0].clientY})},{passive:!0}),$.addEventListener("touchend",m=>{if(!q)return;const M=m.changedTouches[0].clientX-q.x,ae=m.changedTouches[0].clientY-q.y;if(q=null,Math.abs(M)<64||Math.abs(M)<Math.abs(ae)*1.2)return;m.preventDefault();const ce=M<0?b:A;Y(`#/calendar?m=${ce.getFullYear()}-${ue(ce.getMonth()+1)}`)},{passive:!1})}}}function na(e){const t=(e?.get("q")||"").trim(),a=e?.get("area")||"all",n=e?.get("type")||"all",i=t.toLowerCase(),s=d=>i.length>0&&String(d||"").toLowerCase().includes(i);let r=h.live.filter(d=>d.area!=="private");i?r=r.filter(d=>s(d.title)||s(d.note)||s(d.documentName)||(d.tags||[]).some(f=>s(f))||s(X(d.area))||s(W(d))||String(d.amount??"").includes(i)||s(D(d.date,"short"))):r=[],a!=="all"&&(r=r.filter(d=>d.area===a)),n==="expense"&&(r=r.filter(d=>d.amount!=null)),n==="document"&&(r=r.filter(d=>d.documentName)),n==="expiring"&&(r=r.filter(d=>d.expiry));let p=i&&n==="all"?h.reminders.filter(d=>!d.private&&(s(d.title)||s(D(d.due,"short"))||s(d.type))):[];a!=="all"&&(p=p.filter(d=>h.record(d.recordId)?.area===a));const c=new Map;r.forEach(d=>{c.has(d.area)||c.set(d.area,[]),c.get(d.area).push(d)});const v=[...new Set(h.live.filter(d=>d.area!=="private").map(d=>d.area))],g=r.length+p.length;return{area:"home-dash",eyebrow:"Explore",title:"Search",html:`
      <section class="screen-head">
        <div class="eyebrow">Find anything</div>
        <h1>Search</h1>
        <p class="lede">Records, notes, reminders, documents, tags and amounts — all in one place.</p>
      </section>

      <div class="search-bar" style="margin-top:16px">
        ${u("i-search")}
        <input class="search-input" id="sq" value="${o(t)}" placeholder="petrol, passport, shampoo, college, 450…" aria-label="Search everything" autocomplete="off" />
      </div>

      <div class="filter-strip">
        <a class="chip ${n==="all"?"on":""}" aria-current="${n==="all"?"true":"false"}" href="#/search?${ee(t,a,"all")}" data-nav>All</a>
        <a class="chip ${n==="expense"?"on":""}" aria-current="${n==="expense"?"true":"false"}" href="#/search?${ee(t,a,"expense")}" data-nav>With amount</a>
        <a class="chip ${n==="document"?"on":""}" aria-current="${n==="document"?"true":"false"}" href="#/search?${ee(t,a,"document")}" data-nav>Documents</a>
        <a class="chip ${n==="expiring"?"on":""}" aria-current="${n==="expiring"?"true":"false"}" href="#/search?${ee(t,a,"expiring")}" data-nav>Expiring</a>
      </div>
      ${v.length&&t?`<div class="filter-strip">
        <a class="chip ${a==="all"?"on":""}" href="#/search?${ee(t,"all",n)}" data-nav>Every area</a>
        ${v.map(d=>`<a class="chip ${a===d?"on":""}" href="#/search?${ee(t,d,n)}" data-nav>${o(R(d)?.name||d)}</a>`).join("")}
      </div>`:""}

      ${t?g===0?`<section class="search-empty">
          <span class="search-empty-mark">${u("i-search")}</span><span class="search-guide-kicker">NO MATCHES THIS TIME</span>
          <h2>Nothing for “${o(t)}”</h2>
          <p>Try a shorter word, a date, or an amount like “450”.</p>
          <a class="btn btn-ghost" href="#/search" data-nav>Clear search</a>
        </section>`:`
        <section class="search-results-cover" aria-live="polite"><span class="search-results-orbit" aria-hidden="true">${u("i-search")}</span><div><span class="search-guide-kicker">FOUND IN YOUR KEEPSY</span><strong>${C(g,"result")} for “${o(t)}”</strong><small>${r.length} ${r.length===1?"saved record":"saved records"}${p.length?` · ${C(p.length,"reminder")}`:""}${a!=="all"?` · ${o(R(a)?.name||a)}`:""}</small></div></section>
        ${[...c.entries()].map(([d,f])=>`
          <section class="search-group">
            <h3>${o(R(d)?.name||"Other")} · ${f.length}</h3>
            <div class="panel panel-pad" style="padding:4px 18px">
              ${f.map(l=>`
                <button class="row" data-open-record="${l.id}" style="width:100%">
                  <span class="row-thumb">${u(R(l.area)?.icon||"i-grid")}</span>
                  <span class="row-main">
                    <span class="row-title">${xe(l.title,t)}</span>
                    <span class="row-meta">${o(W(l))}${l.amount!=null?` · ${o(j(l.amount))}`:""} · ${o(D(l.date,"short"))}${tt(l,t)?`<span class="search-context">${tt(l,t)}</span>`:""}</span>
                  </span>
                  <span class="row-side">${u("i-chevron-right")}</span>
                </button>`).join("")}
            </div>
          </section>`).join("")}
        ${p.length?`<section class="search-group">
          <h3>Reminders · ${p.length}</h3>
          <div class="panel panel-pad" style="padding:4px 18px">
            ${p.map(d=>`<button class="row" data-open-reminder="${d.id}" style="width:100%">
              <span class="row-thumb">${u("i-bell")}</span>
              <span class="row-main"><span class="row-title">${xe(d.title,t)}</span>
                <span class="row-meta">${o(D(d.snoozeUntil||d.due,"relative"))} · ${o(d.status==="done"?"done":"open")}</span></span>
              <span class="row-side">${u("i-chevron-right")}</span>
            </button>`).join("")}
          </div>
        </section>`:""}
      `:`<section class="search-guide">
          <div class="search-guide-head"><span class="search-guide-mark">${u("i-sparkle")}</span><div><span class="search-guide-kicker">A MEMORY FINDER</span><h2>What are you looking for?</h2><p>Search a note, a shop, an amount or a date. Keepsy checks your saved records and reminders.</p></div></div>
          <div class="search-suggestions"><span>TRY A SEARCH</span>${["petrol","passport","shampoo","college","service"].map(d=>`<button class="search-suggestion" data-search-seed="${d}">${d}<b aria-hidden="true">↗</b></button>`).join("")}</div>
        </section>`}
    `,mount(){const d=document.getElementById("sq");if(!d)return;d.focus({preventScroll:!0}),d.setSelectionRange(d.value.length,d.value.length);let f;d.addEventListener("input",()=>{clearTimeout(f),f=setTimeout(()=>{const l=d.value.trim(),y=`#/search?${ee(l,a,n)}`;history.replaceState(null,"",y),window.dispatchEvent(new CustomEvent("keepsy:route",{detail:{raw:y,segs:["search"],params:new URLSearchParams(y.split("?")[1]||"")}}))},300)}),document.querySelectorAll("[data-search-seed]").forEach(l=>l.addEventListener("click",()=>{const y=`#/search?${ee(l.dataset.searchSeed,"all","all")}`;history.replaceState(null,"",y),window.dispatchEvent(new CustomEvent("keepsy:route",{detail:{raw:y,segs:["search"],params:new URLSearchParams(y.split("?")[1]||"")}}))}))}}}function ee(e,t,a){const n=new URLSearchParams;return e&&n.set("q",e),t&&t!=="all"&&n.set("area",t),a&&a!=="all"&&n.set("type",a),n.toString()}function tt(e,t){const a=e.note||e.documentName||(e.tags||[]).join(" · ");if(!a)return"";const n=String(a).trim().slice(0,90);return`<span class="search-context">${xe(n,t)}${String(a).length>90?"…":""}</span>`}function sa(){const e=h.live.filter(k=>k.area!=="private"),t=z(B()),a=Ee(t,-1),n=k=>k.reduce((w,P)=>w+(Number(P.amount)||0),0),i=e.filter(k=>z(k.date)===t),s=e.filter(k=>z(k.date)===a),r={};e.forEach(k=>{k.amount!=null&&(r[k.area]=(r[k.area]||0)+Number(k.amount))});const p=Object.entries(r).sort((k,w)=>w[1]-k[1]).slice(0,6),c=Math.max(1,...p.map(([,k])=>k)),v={};e.forEach(k=>{const w=k.title.toLowerCase().trim();v[w]=v[w]||{n:0,last:k.date,rec:k},v[w].n+=1,k.date>v[w].last&&(v[w].last=k.date,v[w].rec=k)});const g=Object.entries(v).filter(([,k])=>k.n>=2).sort((k,w)=>w[1].n-k[1].n).slice(0,5),d=e.filter(k=>k.expiry&&T(k.expiry)>=0&&T(k.expiry)<=45).sort((k,w)=>k.expiry.localeCompare(w.expiry)),f=h.reminders.filter(k=>k.status==="open"&&T(k.snoozeUntil||k.due)<0),l=[];e.forEach(k=>{if(!k.expiry&&!k.warrantyUntil)return;const w=k.warrantyUntil||k.expiry,P=T(w);P>=0&&P<=90&&l.push({rec:k,d:P,target:w})}),l.sort((k,w)=>k.d-w.d);const y={};for(let k=5;k>=0;k--){const w=Ee(t,-k);y[w]={records:0,spent:0}}e.forEach(k=>{const w=z(k.date);y[w]&&(y[w].records+=1,y[w].spent+=Number(k.amount)||0)});const E=Math.max(1,...Object.values(y).map(k=>k.spent)),x=s.length&&n(i)?Math.round((n(i)-n(s))/Math.max(1,n(s))*100):null,I=e.length===0,S=new Set(e.map(k=>k.area)).size,L=new Date(`${t}-01T12:00:00`).toLocaleDateString(void 0,{month:"long"});return{area:"home-dash",eyebrow:"Explore",title:"Insights",html:`
      <section class="screen-head">
        <div class="eyebrow">Quiet patterns</div>
        <h1>Insights</h1>
        <p class="lede">Keepsy only shows what it can count from your own records. No predictions, no scores.</p>
      </section>

      ${I?"":`<section class="insights-overview" aria-label="Your month at a glance">
        <div class="insights-orbit" aria-hidden="true"><i></i><i></i><i></i><b>✳</b></div>
        <div class="insights-overview-copy"><span class="insights-kicker">YOUR MONTH AT A GLANCE</span>
          <strong>${i.length?`${C(i.length,"memory")} so far`:"A fresh page for this month"}</strong>
          <small>${C(S,"area")} represented across ${C(e.length,"memory")}</small>
        </div>
        <a class="insights-overview-link" href="#/timeline" data-nav>Open timeline <span aria-hidden="true">↗</span></a>
        <div class="insights-month-label">${o(L)}</div>
      </section>`}

      ${I?`<section class="insights-empty" aria-label="What insights will show">
          <div class="insights-empty-head"><span class="insights-empty-spark">${u("i-sparkle")}</span><div><span class="insights-kicker">A LITTLE PREVIEW</span><h2>Your patterns will appear here</h2><p>Save a few everyday moments and Keepsy will gently connect the dots.</p></div></div>
          <div class="insights-preview-grid">
            <article class="insight-preview-tile preview-spend"><span>₹</span><b>Spending</b><small>See where recorded amounts go</small></article>
            <article class="insight-preview-tile preview-repeat"><span>↻</span><b>Repeat buys</b><small>Find things you come back to</small></article>
            <article class="insight-preview-tile preview-dates"><span>✳</span><b>Dates ahead</b><small>Spot expiry and reminder dates</small></article>
          </div>
          <button class="btn btn-accent" data-quick-add>Save your first moment</button>
        </section>`:`
      <section class="section" style="margin-top:22px">
        <div class="stat-row">
          <div class="stat"><div class="s-label">This month</div><div class="s-value num">${o(j(n(i)))}</div></div>
          <div class="stat"><div class="s-label">Records this month</div><div class="s-value num">${i.length}</div></div>
          <div class="stat"><div class="s-label">Last month</div><div class="s-value num">${o(j(n(s)))}</div></div>
        </div>
        ${x!=null?`<p class="hint" style="margin-top:10px">${x===0?"Spending is level with last month.":x>0?`${x}% more recorded than last month.`:`${Math.abs(x)}% less than last month.`}</p>`:""}
      </section>

      ${p.length?`<section class="section">
        <div class="section-head"><h2>Where money went</h2></div>
        <div class="bars">
          ${p.map(([k,w])=>`<div class="bar-row">
            <span class="b-label">${o(R(k)?.name||"Other")}</span>
            <span class="bar-track"><i class="bar-fill" style="width:${Math.max(4,w/c*100)}%"></i></span>
            <span class="b-val num">${o(j(w))}</span>
          </div>`).join("")}
        </div>
        <p class="hint" style="margin-top:12px">Only amounts you entered. Nothing is estimated.</p>
      </section>`:""}

      ${g.length?`<section class="section">
        <div class="section-head"><h2>Things you keep buying</h2></div>
        <div class="insight-list">
          ${g.map(([k,w])=>`<button class="insight-card insight-card-link" data-open-record="${o(w.rec.id)}">
            <span class="ic-wrap">${u("i-repeat")}</span>
            <div><h4>${o(k)}</h4>
              <p>Noted ${w.n} times. Last on ${o(D(w.last,"short"))}${w.rec.amount!=null?` · ${o(j(w.rec.amount))}`:""}.</p></div>
            <span class="insight-card-arrow" aria-hidden="true">↗</span>
          </button>`).join("")}
        </div>
      </section>`:""}

      ${d.length||f.length||l.length?`<section class="section">
        <div class="section-head"><h2>Worth looking at</h2></div>
        <div class="insight-list">
          ${f.length?`<div class="insight-card"><span class="ic-wrap">${u("i-bell")}</span>
            <div><h4>${C(f.length,"reminder")} slipped past</h4>
              <p>${o(f.slice(0,3).map(k=>k.title).join(", "))}${f.length>3?"…":""}</p></div></div>`:""}
          ${d.slice(0,3).map(k=>`<div class="insight-card"><span class="ic-wrap">${u("i-clock")}</span>
            <div><h4>${o(k.title)}</h4><p>Expires ${o(D(k.expiry,"long"))} — in ${T(k.expiry)} days.</p></div></div>`).join("")}
          ${l.slice(0,3).map(({rec:k,d:w,target:P})=>`<div class="insight-card"><span class="ic-wrap">${u("i-shield")}</span>
            <div><h4>${o(k.title)}</h4><p>${k.warrantyUntil===P?"Warranty runs out":"Expires"} ${o(D(P,"long"))} — in ${w} days.</p></div></div>`).join("")}
        </div>
      </section>`:""}

      <section class="section">
        <div class="section-head"><h2>Last six months</h2></div>
        <div class="bars">
          ${Object.entries(y).map(([k,w])=>`<div class="bar-row">
            <span class="b-label">${o(te(k).replace(/ \d{4}/,""))}</span>
            <span class="bar-track"><i class="bar-fill" style="width:${Math.max(2,w.spent/E*100)}%"></i></span>
            <span class="b-val num">${w.records}</span>
          </div>`).join("")}
        </div>
        <p class="hint" style="margin-top:12px">Bars show recorded spend; the number is how many records you kept that month.</p>
      </section>`}
    `,mount(){}}}function ia(e){const t=z(B()),a=/^\d{4}-\d{2}$/.test(e?.get("m")||"")?e.get("m"):t,n=h.live.filter(b=>b.area!=="private"&&z(b.date)===a).sort((b,$)=>b.date.localeCompare($.date)),i=h.data.reminders.filter(b=>b.status==="done"&&z((b.completedAt||"").slice(0,10))===a&&!b.private),s=n.reduce((b,$)=>b+(Number($.amount)||0),0),r={};n.forEach(b=>{r[b.area]=(r[b.area]||0)+1});const p=Object.entries(r).sort((b,$)=>$[1]-b[1]).slice(0,3),c=n.filter(b=>b.amount!=null).sort((b,$)=>Number($.amount)-Number(b.amount)).slice(0,4),v=n.filter(b=>["service","maintenance","repair"].includes(b.kind)),g=n.filter(b=>b.area==="education"),d=n.filter(b=>b.amount!=null),f=Ee(a,-1),l=Ee(a,1),y=l<=t,[E,x]=a.split("-").map(Number),I=n.length?`${C(n.length,"thing")} kept${s?`, ${j(s)} in recorded amounts`:""}${p.length?`, with most notes in ${R(p[0][0])?.name||"Other"}`:""}.`:"A quiet month with nothing recorded. Some months are like that.",[S,L]=a.split("-").map(Number),k=new Date(S,L,0).getDate(),w=new Date(S,L-1,1,12).getDay(),P=new Map;n.forEach(b=>P.set(b.date,(P.get(b.date)||0)+1));const A=`${'<span class="month-map-blank" aria-hidden="true"></span>'.repeat(w)}${Array.from({length:k},(b,$)=>{const q=$+1,m=`${a}-${String(q).padStart(2,"0")}`,M=P.get(m)||0;return M?`<button class="month-map-day has-memory" type="button" data-scroll-month="${m}" aria-label="${q} ${o(te(a).split(" ")[0])}, ${C(M,"memory")}"><b>${q}</b><i>${M>1?M:"✳"}</i></button>`:`<span class="month-map-day" aria-label="${q}, no saved memories"><b>${q}</b></span>`}).join("")}`;return{area:"home-dash",eyebrow:"Explore",title:"Your Month",html:`
      <section class="month-cover">
        <div class="mc-eyebrow">Your month · ${ra(a)}</div>
        <h1>${o(he[x-1])}, <em style="font-style:italic">kept</em>.</h1>
        <p class="mc-line">${o(I)}</p>
        <div class="mc-stats">
          <div class="mc-stat"><div class="ms-v num">${n.length}</div><div class="ms-l">Records</div></div>
          <div class="mc-stat"><div class="ms-v num">${o(j(s))}</div><div class="ms-l">Recorded amounts</div></div>
          <div class="mc-stat"><div class="ms-v num">${i.length}</div><div class="ms-l">Reminders done</div></div>
        </div>
      </section>

      <div class="month-nav-row" aria-label="Choose a month">
        <a class="month-nav-link" href="#/month?m=${f}" data-nav aria-label="Previous month">${u("i-chevron-left")} <span>${o(te(f).split(" ")[0])}</span></a>
        <span class="month-nav-current">${o(te(a))}</span>
        ${y?`<a class="month-nav-link" href="#/month?m=${l}" data-nav aria-label="Next month"><span>${o(te(l).split(" ")[0])}</span> ${u("i-chevron-right")}</a>`:'<span aria-hidden="true"></span>'}
      </div>

      ${n.length||i.length?`
        ${n.length?`<section class="month-map" aria-label="Memory map for ${o(te(a))}">
          <div class="month-map-head"><div><span class="month-map-kicker">YOUR MONTH, AT A GLANCE</span><h2>Little dots, real days</h2></div><span class="month-map-key"><i></i> saved memory</span></div>
          <div class="month-map-grid" role="group" aria-label="Select a day with saved memories">${["S","M","T","W","T","F","S"].map(b=>`<span class="month-map-weekday">${b}</span>`).join("")}${A}</div>
          <p class="month-map-note">Tap a marked day to jump to its memories.</p>
        </section>`:""}
        ${p.length?`<section class="section">
          <div class="section-head"><h2>Where the month went</h2></div>
          <div class="chip-row">
            ${p.map(([b,$])=>`<a class="chip" href="#/a/${b}" data-nav>${o(R(b)?.name||"Other")} · ${$}</a>`).join("")}
          </div>
        </section>`:""}

        ${v.length?`<section class="section">
          <div class="section-head"><h2>Things that were looked after</h2></div>
          <div class="panel panel-pad" style="padding:4px 18px">
            ${v.slice(0,5).map(b=>`<button class="row" data-open-record="${b.id}" style="width:100%">
              <span class="row-thumb">${u("i-repeat")}</span>
              <span class="row-main"><span class="row-title">${o(b.title)}</span>
                <span class="row-meta">${o(W(b))} · ${o(D(b.date,"short"))}${b.amount!=null?` · ${o(j(b.amount))}`:""}</span></span>
              <span class="row-side">${u("i-chevron-right")}</span></button>`).join("")}
          </div>
        </section>`:""}

        ${g.length?`<section class="section">
          <div class="section-head"><h2>Learning notes</h2></div>
          <div class="panel panel-pad" style="padding:4px 18px">
            ${g.slice(0,5).map(b=>`<button class="row" data-open-record="${b.id}" style="width:100%">
              <span class="row-thumb">${u("i-book")}</span>
              <span class="row-main"><span class="row-title">${o(b.title)}</span>
                <span class="row-meta">${o(W(b))} · ${o(D(b.date,"short"))}</span></span>
              <span class="row-side">${u("i-chevron-right")}</span></button>`).join("")}
          </div>
        </section>`:""}

        ${c.length?`<section class="section">
          <div class="section-head"><h2>Largest amounts recorded</h2></div>
          <div class="insight-list">
            ${c.map(b=>`<div class="insight-card"><span class="ic-wrap">${u(R(b.area)?.icon||"i-grid")}</span>
              <div><h4>${o(b.title)}</h4><p>${o(j(b.amount))} · ${o(X(b.area))} · ${o(D(b.date,"short"))}</p></div></div>`).join("")}
          </div>
        </section>`:""}

        <section class="section">
          <div class="section-head"><h2>Day by day</h2></div>
          <div class="panel panel-pad">
            ${oa(n).map(([b,$])=>`
              <div class="month-entry" id="month-day-${b}">
                <div class="me-day"><div class="d num">${o(b.slice(8))}</div><div class="m">${o(he[Number(b.slice(5,7))-1])}</div></div>
                <div style="flex:1;min-width:0">
                  ${$.map(q=>`<button class="memory-row" style="padding:5px 0;border:0" data-open-record="${q.id}">
                    <span class="mr-main"><span class="mr-title">${o(q.title)}</span>
                      <span class="mr-meta">${o(X(q.area))} · ${o(W(q))}${q.amount!=null?` · ${o(j(q.amount))}`:""}</span></span>
                    <span class="row-side">${u("i-chevron-right")}</span>
                  </button>`).join("")}
                </div>
              </div>`).join("")}
          </div>
        </section>

        ${d.length?`<p class="hint" style="text-align:center;margin-top:18px">${C(d.length,"record")} with an amount this month. This page is a scrapbook of your notes.</p>`:""}
      `:`<section class="month-empty" aria-label="An empty month">
          <div class="month-empty-copy"><span class="month-empty-sticker">${u("i-calendar")} A BLANK PAGE</span><h2>Nothing kept in ${o(te(a))}</h2><p>Save a little moment whenever you’re ready. Keepsy will tuck it into this month for you.</p><button class="btn btn-accent" data-quick-add>Save a moment</button></div>
          <div class="month-empty-ticket" aria-hidden="true"><span>${o(he[x-1])}</span><b>✳</b><small>room for your story</small><i></i><i></i></div>
          <span class="month-empty-spark" aria-hidden="true">✦</span>
        </section>`}
    `,mount(){document.querySelectorAll("[data-scroll-month]").forEach(b=>b.addEventListener("click",()=>{document.getElementById(`month-day-${b.dataset.scrollMonth}`)?.scrollIntoView({behavior:"smooth",block:"start"})}))}}}function ra(e){const[t,a]=e.split("-").map(Number);return`${["January","February","March","April","May","June","July","August","September","October","November","December"][a-1]} ${t}`}function oa(e){const t=new Map;return e.forEach(a=>{t.has(a.date)||t.set(a.date,[]),t.get(a.date).push(a)}),[...t.entries()]}const la=e=>{const t=T(e.snoozeUntil||e.due);return e.status==="done"?"done":t<0?"overdue":t===0?"today":t<=14?"soon":"later"};function ca(e,{privatePreview:t=!0}={}){const a=T(e.snoozeUntil||e.due),n=e.private,i=n&&!t?"Private reminder":e.title;return`<div class="rem-item ${e.status==="done"?"done":""} ${a<0&&e.status==="open"?"overdue":""}" data-rem="${e.id}">
    <button class="rem-check" data-complete="${e.id}" aria-label="${e.status==="done"?"Reopen":"Complete"} ${o(i)}">
      ${u("i-check")}
    </button>
    <div class="rem-main" data-open-reminder="${e.id}" role="button" tabindex="0" aria-label="Open ${o(i)}">
      <div class="rem-title">${o(i)}</div>
      <div class="rem-meta">
        <span class="due">${o(D(e.snoozeUntil||e.due,"relative"))}${e.time?` · ${o(e.time)}`:""}</span>
        ${e.repeat!=="none"?`<span>· ${o(e.repeat)}</span>`:""}
        ${n?`<span class="private-mark">${u("i-eye-off","ic-sm")} private</span>`:""}
        ${e.recordId&&h.record(e.recordId)?`<span>· ${o(h.record(e.recordId).title)}</span>`:""}
        ${e.status==="done"?"<span>· done</span>":""}
      </div>
    </div>
    <div class="rem-actions">
      ${e.status!=="done"?`<button class="icon-btn" data-snooze="${e.id}" aria-label="Snooze ${o(i)}" title="Snooze">${u("i-snooze")}</button>`:""}
      <button class="icon-btn" data-edit-rem="${e.id}" aria-label="Edit ${o(i)}" title="Edit">${u("i-edit")}</button>
    </div>
  </div>`}function da(){const e=h.reminders.filter(i=>!i.private),t={overdue:[],today:[],soon:[],later:[],done:[]};e.forEach(i=>t[la(i)].push(i)),Object.values(t).forEach(i=>i.sort((s,r)=>(s.snoozeUntil||s.due).localeCompare(r.snoozeUntil||r.due)));const a=t.overdue.length+t.today.length+t.soon.length+t.later.length,n=t.today.length+t.soon.length;return{area:"home-dash",eyebrow:"Keepsy",title:"Reminders",html:`
      <section class="screen-head">
        <div class="eyebrow">Nothing forgotten</div>
        <h1>Reminders</h1>
        <p class="lede">${a?`${C(a,"reminder")} open. Complete, snooze or reschedule them as you like.`:"No reminders yet. Keepsy can watch an expiry, a service or a date for you."}</p>
        <div class="ah-actions"><button class="btn btn-accent btn-sm" data-new-reminder>${u("i-plus")} New reminder</button></div>
      </section>

      ${a||t.done.length?`<section class="reminders-overview" aria-label="Reminder overview">
        <div class="reminders-overview-main"><span class="reminders-kicker">YOUR LITTLE NUDGE BOARD</span><strong>${a?`${C(a,"thing")} still on your list`:"All caught up"}</strong><small>${t.overdue.length?`${C(t.overdue.length,"reminder")} needs a new moment.`:n?`${C(n,"reminder")} coming up soon.`:"Your saved reminders are right where you need them."}</small></div>
        <span class="reminders-overview-count"><b>${a}</b><small>open</small></span>
        <nav class="reminder-jumps" aria-label="Jump to reminder group">
          ${t.overdue.length?`<button type="button" data-scroll-rem="overdue">Overdue <b>${t.overdue.length}</b></button>`:""}
          ${t.today.length?`<button type="button" data-scroll-rem="today">Today <b>${t.today.length}</b></button>`:""}
          ${t.soon.length?`<button type="button" data-scroll-rem="soon">Soon <b>${t.soon.length}</b></button>`:""}
          ${t.later.length?`<button type="button" data-scroll-rem="later">Later <b>${t.later.length}</b></button>`:""}
          ${t.done.length?`<button type="button" data-scroll-rem="done">Done <b>${t.done.length}</b></button>`:""}
        </nav>
      </section>`:""}

      ${a===0&&t.done.length===0?`<div class="empty" style="margin-top:22px">
          <div class="em-mark">${u("i-bell")}</div>
          <h3>Nothing to remember</h3>
          <p>When you save a medicine, a warranty or an appointment, Keepsy can remind you at the right time.</p>
          <button class="btn btn-accent" data-new-reminder>Add a reminder</button>
        </div>`:""}

      ${[["overdue","Overdue"],["today","Today"],["soon","Next two weeks"],["later","Further ahead"],["done","Completed"]].map(([i,s])=>t[i].length?`
          <section class="rem-group rem-group-${i}" id="rem-${i}">
            <h3>${o(s)} <span class="n">${t[i].length}</span></h3>
            <div class="panel panel-pad" style="padding:4px 18px">
              ${t[i].map(r=>ca(r)).join("")}
            </div>
          </section>`:"").join("")}

      <p class="hint" style="margin-top:24px;text-align:center">
        Reminders live in Keepsy. When closed-app reminders are enabled in Settings, Keepsy can send a device
        notification at the due time. The notification service receives the reminder title and schedule, not your notes or records.
      </p>
    `,mount(){}}}function pa(){const e=h.data.notifications.slice().sort((p,c)=>p.read!==c.read?p.read?1:-1:(c.days??0)-(p.days??0)),t=h.data.settings,a=e.filter(p=>p.days===0&&!p.read),n=e.filter(p=>p.days>0),i=e.filter(p=>p.days<0||p.read&&p.days===0),s=(p,c)=>c.length?`<section class="rem-group inbox-group">
    <h3>${o(p)} <span class="n">${c.length}</span></h3>
    <div class="panel panel-pad" style="padding:4px 18px">
      ${c.map(v=>`<div style="display:flex;align-items:flex-start;gap:8px">
        <button class="inbox-item ${v.read?"":"unread"}" data-notif="${v.id}" style="border:0">
          <span class="ib-ic">${u(v.private&&!t.sensitivePreviews?"i-eye-off":"i-bell")}</span>
          <span class="ib-main">
            <span class="ib-t">${o(v.title)}</span>
            <span class="ib-m">${o(v.body)}${v.days!=null?` · ${o(v.days<0?`${Math.abs(v.days)}d ago`:v.days===0?"today":`in ${v.days}d`)}`:""}</span>
          </span>
        </button>
        ${v.read?"":'<span class="unread-dot" aria-label="Unread"></span>'}
      </div>`).join("")}
    </div>
  </section>`:"",r=e.filter(p=>!p.read).length;return{area:"home-dash",eyebrow:"Keepsy",title:"Notifications",html:`
      <section class="screen-head">
        <div class="eyebrow">A quiet inbox</div>
        <h1>Notifications</h1>
        <p class="lede">Keepsy only pings you about things you asked it to watch. Nothing else.</p>
        <div class="ah-actions">
          ${e.some(p=>!p.read)?'<button class="btn btn-ghost btn-sm" data-mark-all>Mark all read</button>':""}
          <a class="btn btn-ghost btn-sm" href="#/reminders" data-nav>Open reminders</a>
        </div>
      </section>

      ${e.length?`<section class="inbox-overview" aria-label="Inbox summary"><span class="inbox-orbit" aria-hidden="true">${u("i-bell")}</span><div><span class="reminders-kicker">A SOFTER KIND OF NOTIFICATION</span><strong>${r?C(r,"new nudge"):"You’re all caught up"}</strong><small>${C(e.length,"notification")} from reminders you chose to keep.</small></div></section>`:""}

      ${e.length===0?`<div class="empty" style="margin-top:22px">
          <div class="em-mark">${u("i-bell")}</div>
          <h3>All quiet</h3>
          <p>No notifications. When a reminder comes close, it will appear here.</p>
        </div>`:`
        ${s("Today",a)}
        ${s("Upcoming",n)}
        ${s("Earlier",i)}
      `}

      <div class="notice quiet" style="margin-top:24px">${u("i-shield")}<span>${t.sensitivePreviews?"Sensitive previews are on, so reminders marked private still show their real title here — this screen is inside Keepsy. Turn this off in Settings to see “Private reminder” instead.":"Sensitive previews are off. Private reminders appear as “Private reminder”, even here."}</span></div>
    `,mount(){}}}function ua(e,t){{const a=e.target.closest("[data-scroll-rem]");if(a)return e.preventDefault(),document.getElementById(`rem-${a.dataset.scrollRem}`)?.scrollIntoView({behavior:"smooth",block:"start"}),!0;const n=e.target.closest("[data-complete]");if(n){e.stopPropagation();const p=n.dataset.complete;return h.reminder(p).status==="done"?(h.reopenReminder(p),N("Reopened.","i-restore")):(h.completeReminder(p),N("Done. One less thing.","i-check")),h.syncNotifications(),t(),!0}const i=e.target.closest("[data-snooze]");if(i){e.stopPropagation();const p=h.reminder(i.dataset.snooze);return Ut(p,()=>{h.syncNotifications(),t()}),!0}const s=e.target.closest("[data-edit-rem]");if(s){e.stopPropagation();const p=h.reminder(s.dataset.editRem);return ve({reminder:p,onSaved:()=>{h.syncNotifications(),t()}}),!0}const r=e.target.closest("[data-notif]");if(r){const p=h.data.notifications.find(c=>c.id===r.dataset.notif);return h.markNotificationRead(p.id),p.reminderId?window.dispatchEvent(new CustomEvent("keepsy:open-reminder",{detail:p.reminderId})):p.recordId&&(window.location.hash=`#/r/${p.recordId}`),t(),!0}return!1}}function at(){const e=h.data.settings,t=h.profile,a=h.reminders.filter(n=>n.status==="open").length;return{area:"home-dash",eyebrow:"Keepsy",title:"Settings",html:`
      <section class="screen-head">
        <div class="eyebrow">Quietly yours</div>
        <h1>Settings</h1>
        <p class="lede">Keepsy keeps everything in this browser. Nothing leaves unless you export it.</p>
      </section>

      <section class="settings-overview" aria-label="Keepsy profile overview">
        <div class="settings-overview-top"><span class="settings-avatar">${o((t?.name||"M")[0].toUpperCase())}</span><div><span class="settings-kicker">YOUR KEEPSY</span><strong>${o(t?.name||"Me")}, this space is yours</strong><small>Your information stays in this browser unless you export it.</small></div><span class="settings-spark" aria-hidden="true">✦</span></div>
        <div class="settings-metrics"><span><b>${h.live.length}</b><small>memories</small></span><span><b>${a}</b><small>open reminders</small></span><span><b>${h.archived.length}</b><small>archived</small></span></div>
        <nav class="settings-shortcuts" aria-label="Settings shortcuts"><a href="#/private" data-nav>${u("i-eye-off")} Private Space <b>↗</b></a><a href="#/inbox" data-nav>${u("i-bell")} Inbox <b>↗</b></a><a href="#/archive" data-nav>${u("i-archive")} Archive <b>↗</b></a></nav>
      </section>

      <section class="settings-install" aria-label="Install Keepsy on this device">
        <span class="settings-install-icon">${u("i-download")}</span>
        <div class="settings-install-copy"><strong>Keep Keepsy close</strong><small>Add its icon to your phone or computer. It opens like an app and works offline after the first visit.</small></div>
        <button class="btn btn-accent btn-sm" data-install-keepsy>Install Keepsy</button>
      </section>

      <section class="set-group settings-group settings-group--profile">
        <h3><span class="settings-group-icon">${u("i-users")}</span>Profile</h3>
        <p class="hint">Each profile keeps its own records, reminders and settings.</p>
        <div style="margin-top:10px">
          ${h.profiles.map(n=>`
            <div class="profile-card ${n.id===h.activeId?"active":""}">
              <span class="avatar">${o((n.name||"?")[0].toUpperCase())}</span>
              <span class="pc-main"><strong>${o(n.name)}</strong>
                <span>${n.id===h.activeId?"Active":`${h.activeId===n.id?"":"Switch to this profile"}`}</span></span>
              <button class="btn btn-sm ${n.id===h.activeId?"btn-ghost":"btn-accent"}" data-switch-profile="${n.id}" ${n.id===h.activeId?"disabled":""}>
                ${n.id===h.activeId?"Current":"Switch"}
              </button>
            </div>`).join("")}
          <div class="chip-row" style="margin-top:10px">
            <button class="btn btn-ghost btn-sm" data-add-profile>${u("i-plus")} New profile</button>
            ${t?'<button class="btn btn-quiet" data-rename-profile>Rename</button>':""}
            ${h.profiles.length>1?'<button class="btn btn-quiet" data-delete-profile>Delete this profile</button>':""}
          </div>
        </div>
      </section>

      <section class="set-group settings-group settings-group--privacy">
        <h3><span class="settings-group-icon">${u("i-shield")}</span>Privacy</h3>
        <div class="set-row">
          <div class="sr-main"><strong>Sensitive previews</strong>
            <span>When off, private reminders show as “Private reminder” in the inbox and on your device notifications.</span></div>
          <label class="switch"><input type="checkbox" id="set-previews" ${e.sensitivePreviews?"checked":""} /><span class="track"></span></label>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Private Space PIN</strong>
            <span>${e.pinHash?"A PIN is set. It is stored as a hash in this browser only.":"No PIN set. Anyone using this browser can open Private Space."}</span></div>
          <button class="btn btn-ghost btn-sm" data-set-pin>${e.pinHash?"Change":"Set PIN"}</button>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Show private tracking on Calendar</strong>
            <span>Off by default. When on, cycle notes appear as neutral dots labelled “Private tracking”.</span></div>
          <label class="switch"><input type="checkbox" id="set-cycle" ${e.showCycle?"checked":""} /><span class="track"></span></label>
        </div>
        <div class="notice quiet" style="margin-top:12px">${u("i-shield")}<span>Keepsy is local-first. Records are stored unencrypted in this browser's storage. Anyone with access to this device and browser profile could read them — set a PIN for Private Space if that matters to you.</span></div>
      </section>

      <section class="set-group settings-group settings-group--notifications">
        <h3><span class="settings-group-icon">${u("i-bell")}</span>Notifications</h3>
        <div class="set-row">
          <div class="sr-main"><strong>Reminder style</strong>
            <span>On iPhone, reminders appear inside Keepsy when it's open. On Android, the Keepsy app shows on-device notifications even when closed — no account, no push service, everything stays on this device.</span></div>
          <span class="tag quiet">On device</span>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Notification inbox</strong>
            <span>Quiet, grouped by Today / Upcoming / Earlier. No badges that nag.</span></div>
          <a class="btn btn-ghost btn-sm" href="#/inbox" data-nav>Open</a>
        </div>
      </section>

      <section class="set-group settings-group settings-group--data">
        <h3><span class="settings-group-icon">${u("i-download")}</span>Data & storage</h3>
        <div class="set-row">
          <div class="sr-main"><strong>Export everything</strong><span>One JSON file with records, reminders and settings.</span></div>
          <button class="btn btn-ghost btn-sm" data-export>${u("i-download")} Export</button>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Import a Keepsy export</strong><span>Validated before anything is written. You choose merge or replace.</span></div>
          <button class="btn btn-ghost btn-sm" data-import>${u("i-upload")} Import</button>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Archive</strong><span>${C(h.archived.length,"record")} archived.</span></div>
          <a class="btn btn-ghost btn-sm" href="#/archive" data-nav>Open</a>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Recently deleted</strong><span>${C(h.trashed.length,"record")} waiting. Delete permanently when you are sure.</span></div>
          <a class="btn btn-ghost btn-sm" href="#/trash" data-nav>Open</a>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Erase this profile</strong><span>Removes every record for this profile in this browser. Cannot be undone.</span></div>
          <button class="btn btn-danger btn-sm" data-wipe>Erase</button>
        </div>
      </section>

      <section class="set-group settings-group settings-group--accessibility">
        <h3><span class="settings-group-icon">${u("i-info")}</span>Accessibility</h3>
        <div class="set-row">
          <div class="sr-main"><strong>Motion</strong><span>Keepsy respects your system reduced-motion setting automatically.</span></div>
          <span class="tag quiet">Follows system</span>
        </div>
        <div class="set-row">
          <div class="sr-main"><strong>Text size</strong><span>Uses your browser's own zoom and font settings. Nothing is locked.</span></div>
          <span class="tag quiet">Browser</span>
        </div>
      </section>

      <section class="set-group settings-group settings-group--about">
        <h3><span class="settings-group-icon">${u("i-sparkle")}</span>About Keepsy</h3>
        <div class="set-row"><div class="sr-main"><strong>Keepsy</strong><span>Version 1.0 · a local-first memory space. Built as a PWA; works offline once loaded.</span></div></div>
        <div class="set-row"><div class="sr-main"><strong>Storage used</strong><span id="storage-note">Calculating…</span></div></div>
        <p class="hint" style="margin-top:14px">Keepsy does not diagnose, treat or predict anything medical. Cycle and health entries are personal tracking only.</p>
      </section>
    `,mount(){const n=()=>h.data.settings;document.querySelector("[data-install-keepsy]")?.addEventListener("click",async()=>{if(window.matchMedia("(display-mode: standalone)").matches||navigator.standalone===!0){N("Keepsy is already installed on this device.","i-check");return}const r=window.keepsyInstallPrompt;if(r){r.prompt();const v=await r.userChoice;window.keepsyInstallPrompt=null,N(v.outcome==="accepted"?"Keepsy installed.":"You can install Keepsy later from here.",v.outcome==="accepted"?"i-check":"i-info");return}const c=/iPhone|iPad|iPod/i.test(navigator.userAgent)||navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1?'<ol class="install-steps"><li>Open Keepsy in Safari from its secure website.</li><li>Tap the Share button.</li><li>Choose <strong>Add to Home Screen</strong>, then tap Add.</li></ol>':'<ol class="install-steps"><li>Open Keepsy from its secure website in Chrome or Edge.</li><li>Open the browser menu.</li><li>Choose <strong>Install Keepsy</strong> or <strong>Add to Home screen</strong>.</li></ol>';U({title:"Add Keepsy to your device",subtitle:"Keepsy can live beside your other apps.",body:`${c}<div class="notice quiet" style="margin-top:12px">${u("i-info")}<span>Installation appears after Keepsy is published on a secure website. No app store is needed.</span></div>`,foot:'<button class="btn btn-accent" data-sheet-close>Got it</button>'})}),document.querySelectorAll("[data-switch-profile]").forEach(r=>r.addEventListener("click",()=>{r.disabled||(h.setProfile(r.dataset.switchProfile),N(`Now showing ${h.profile.name}'s Keepsy.`,"i-users"),window.location.hash="#/",_())})),document.querySelector("[data-add-profile]")?.addEventListener("click",()=>{U({title:"New profile",subtitle:"A separate set of records in this browser.",body:'<div class="field"><label for="np-name">Name</label><input id="np-name" class="input" placeholder="e.g. Aditi" maxlength="40" /></div>',foot:'<button class="btn btn-ghost" data-sheet-close>Cancel</button><button class="btn btn-accent" id="np-save">Create</button>',onMount:(r,p)=>{r.querySelector("#np-save").addEventListener("click",()=>{const c=r.querySelector("#np-name").value.trim();if(!c){N("Give the profile a name.","i-info");return}h.addProfile(c),p(),N("Profile created. Its records are kept separate.","i-users"),window.location.hash="#/",_()}),setTimeout(()=>r.querySelector("#np-name").focus(),350)}})}),document.querySelector("[data-rename-profile]")?.addEventListener("click",()=>{U({title:"Rename profile",body:`<div class="field"><label for="rp-name">Name</label><input id="rp-name" class="input" value="${o(h.profile.name)}" maxlength="40" /></div>`,foot:'<button class="btn btn-ghost" data-sheet-close>Cancel</button><button class="btn btn-accent" id="rp-save">Save</button>',onMount:(r,p)=>{r.querySelector("#rp-save").addEventListener("click",()=>{h.renameProfile(h.activeId,r.querySelector("#rp-name").value),p(),N("Renamed."),_()})}})}),document.querySelector("[data-delete-profile]")?.addEventListener("click",()=>{oe({title:"Delete this profile?",message:`Every record in “${h.profile.name}” will be removed from this browser.`,confirmText:"Delete profile",onConfirm:()=>{const r=h.deleteProfile(h.activeId);r.ok?(N("Profile deleted."),window.location.hash="#/",_()):N(r.reason,"i-info")}})}),document.querySelector("#set-previews")?.addEventListener("change",r=>{h.setSetting("sensitivePreviews",r.target.checked),h.syncNotifications(),N(r.target.checked?"Private reminders will show real titles here.":"Private reminders will show as “Private reminder”.","i-eye-off"),_()}),document.querySelector("#set-cycle")?.addEventListener("change",r=>{h.setSetting("showCycle",r.target.checked),N(r.target.checked?"Private tracking appears on the calendar as neutral markers.":"Private tracking is hidden from the calendar.","i-eye-off")}),document.querySelector("[data-set-pin]")?.addEventListener("click",()=>{U({title:n().pinHash?"Change PIN":"Set a PIN",subtitle:"Four digits. Stored as a hash in this browser, and only gates the Private Space screen.",body:`<div class="field"><label for="pin-in">PIN</label><input id="pin-in" class="input num" inputmode="numeric" maxlength="4" placeholder="4 digits" /></div>
                 <div class="notice quiet" style="margin-top:12px">${u("i-info")}<span>This is a light deterrent, not encryption. It does not protect the underlying browser storage.</span></div>`,foot:'<button class="btn btn-ghost" data-sheet-close>Cancel</button><button class="btn btn-accent" id="pin-save">Save PIN</button>',onMount:(r,p)=>{r.querySelector("#pin-save").addEventListener("click",async()=>{const c=r.querySelector("#pin-in").value.trim();if(!/^\d{4}$/.test(c)){N("Use four digits.","i-info");return}const v=crypto.randomUUID(),g=await ht(c,v);h.data.settings.pinHash=g,h.data.settings.pinSalt=v,h.data.settings.unlocked=!1,h.save(),p(),N("PIN set.","i-shield"),_()})}})}),document.querySelector("[data-export]")?.addEventListener("click",()=>{const r=h.exportData(),p=new Blob([JSON.stringify(r,null,2)],{type:"application/json"}),c=URL.createObjectURL(p),v=document.createElement("a");v.href=c,v.download=`keepsy-${(h.profile?.name||"me").toLowerCase().replace(/\s+/g,"-")}-${B()}.json`,document.body.appendChild(v),v.click(),v.remove(),setTimeout(()=>URL.revokeObjectURL(c),4e3),N("Exported. Keep the file somewhere safe.","i-download")}),document.querySelector("[data-import]")?.addEventListener("click",()=>{const r=document.createElement("input");r.type="file",r.accept="application/json,.json",r.addEventListener("change",async()=>{const p=r.files?.[0];if(!p)return;let c;try{c=JSON.parse(await p.text())}catch{N("That file could not be read as JSON. Nothing was changed.","i-info");return}U({title:"Import data",subtitle:`${(c.records||[]).length} records found in “${p.name}”.`,body:`<div class="notice quiet" style="margin-bottom:12px">${u("i-info")}<span>Merge keeps your current records and adds the new ones. Replace overwrites this profile's records.</span></div>
                   <div class="chip-row"><button class="chip" data-mode="merge">Merge</button><button class="chip" data-mode="replace">Replace</button></div>`,onMount:(v,g)=>{v.querySelectorAll("[data-mode]").forEach(d=>d.addEventListener("click",()=>{d.dataset.mode==="replace"?(g(),oe({title:"Replace all records?",message:"Current records for this profile will be overwritten by the file.",confirmText:"Replace",onConfirm:()=>i(c,"replace")})):(g(),i(c,"merge"))}))}})}),r.click()});const i=(r,p)=>{const c=h.importData(r,p);if(!c.ok){N(c.errors[0]||"Import failed.","i-info");return}h.syncNotifications(),N(`Imported ${c.imported} record${c.imported===1?"":"s"}${c.errors.length?` (${c.errors.length} skipped)`:""}.`,"i-upload"),_()};document.querySelector("[data-wipe]")?.addEventListener("click",()=>{oe({title:"Erase this profile?",message:`All records, reminders and settings for “${h.profile.name}” in this browser will be removed permanently.`,confirmText:"Erase everything",onConfirm:()=>{h.wipe(),N("Erased."),window.location.hash="#/",_()}})});const s=document.getElementById("storage-note");if(s){let r=0;try{for(const p in localStorage)Object.prototype.hasOwnProperty.call(localStorage,p)&&p.startsWith("keepsy:")&&(r+=(localStorage[p]||"").length)}catch{r=0}s.textContent=`${(r/1024).toFixed(1)} KB across ${h.profiles.length} profile${h.profiles.length===1?"":"s"} in this browser`}}}}async function ht(e,t){const a=new TextEncoder().encode(`${t}:${e}`);if(crypto.subtle){const i=await crypto.subtle.digest("SHA-256",a);return[...new Uint8Array(i)].map(s=>s.toString(16).padStart(2,"0")).join("")}let n=5381;for(const i of a)n=(n<<5)+n+i|0;return`fb${(n>>>0).toString(16)}`}function _(){window.dispatchEvent(new CustomEvent("keepsy:route",{detail:{raw:location.hash}}))}function ha(){const e=h.archived.slice().sort((t,a)=>(a.archivedAt||"").localeCompare(t.archivedAt||""));return{area:"home-dash",eyebrow:"Keepsy",title:"Archive",html:`
      <section class="screen-head">
        <div class="eyebrow">Out of the way, not gone</div>
        <h1>Archive</h1>
        <p class="lede">Records you set aside. They stay searchable here and can come back any time.</p>
      </section>
      <section class="archive-overview"><span class="archive-overview-icon">${u("i-archive")}</span><div><span class="archive-overview-kicker">SAFE, JUST OUT OF SIGHT</span><strong>${C(e.length,"kept record")}</strong><small>${e.length?"Restore any record whenever it belongs back in your life.":"Set-aside records will stay here until you need them again."}</small></div></section>
      ${e.length?`<div class="record-list archive-list" style="margin-top:16px">
        ${e.map(t=>`<div class="record-item archive-item" style="cursor:default">
          <span class="row-thumb">${u(R(t.area)?.icon||"i-grid")}</span>
          <button class="rec-main" data-open-record="${t.id}" style="text-align:left;background:none;border:0">
            <span class="rec-title">${o(t.title)}</span>
            <span class="rec-meta">${o(R(t.area)?.name||"")} · archived ${o(Ae(t.archivedAt))}</span>
          </button>
          <button class="btn btn-ghost btn-sm" data-unarchive="${t.id}">Restore</button>
        </div>`).join("")}
      </div>`:`<div class="archive-empty"><div class="archive-empty-mark">${u("i-archive")}</div>
        <h3>Archive is empty</h3><p>Nothing has been archived yet. When you tidy up, records come here instead of disappearing.</p></div>`}
    `,mount(){document.querySelectorAll("[data-unarchive]").forEach(t=>t.addEventListener("click",()=>{h.unarchiveRecord(t.dataset.unarchive),N("Restored.","i-restore"),_()}))}}}function ma(){const e=h.trashed.slice().sort((t,a)=>(a.deletedAt||"").localeCompare(t.deletedAt||""));return{area:"home-dash",eyebrow:"Keepsy",title:"Recently deleted",html:`
      <section class="screen-head">
        <div class="eyebrow">Second thoughts welcome</div>
        <h1>Recently deleted</h1>
        <p class="lede">Restore a record, or delete it forever. Permanent deletion cannot be undone.</p>
      </section>
      <section class="archive-overview trash-overview"><span class="archive-overview-icon">${u("i-trash")}</span><div><span class="archive-overview-kicker">A PAUSE BEFORE THEY’RE GONE</span><strong>${C(e.length,"record")}</strong><small>${e.length?"Restore anything you want to keep, or permanently delete it.":"Deleted records will wait here until you decide what to do."}</small></div></section>
      ${e.length?`<div class="record-list archive-list trash-list" style="margin-top:16px">
        ${e.map(t=>`<div class="record-item archive-item trash-item" style="cursor:default">
          <span class="row-thumb">${u(R(t.area)?.icon||"i-grid")}</span>
          <div class="rec-main">
            <div class="rec-title">${o(t.title)}</div>
            <div class="rec-meta">${o(R(t.area)?.name||"")} · deleted ${o(Ae(t.deletedAt))}</div>
          </div>
          <div class="trash-actions">
            <button class="btn btn-ghost btn-sm" data-restore="${t.id}">Restore</button>
            <button class="btn btn-danger btn-sm" data-purge="${t.id}">Delete forever</button>
          </div>
        </div>`).join("")}
      </div>`:`<div class="archive-empty trash-empty"><div class="archive-empty-mark">${u("i-trash")}</div>
        <h3>Nothing deleted</h3><p>Good. Anything you delete will wait here until you decide.</p></div>`}
    `,mount(){document.querySelectorAll("[data-restore]").forEach(t=>t.addEventListener("click",()=>{h.restoreRecord(t.dataset.restore),N("Back in Keepsy.","i-restore"),_()})),document.querySelectorAll("[data-purge]").forEach(t=>t.addEventListener("click",()=>{const a=h.record(t.dataset.purge);oe({title:`Delete “${a.title}” forever?`,message:"This removes it permanently, along with its links and reminders.",confirmText:"Delete forever",onConfirm:()=>{h.purgeRecord(a.id),N("Deleted permanently.","i-trash"),_()}})}))}}}const va=()=>h.data.settings.unlocked===!0;function nt(e=new URLSearchParams){const a=!!h.data.settings.pinHash,n=h.live.filter(f=>f.area==="private"),i=h.reminders.filter(f=>f.private),s=e?.get("kind")||"all";if(a&&!va())return{area:"private",eyebrow:"Only you",title:"Private Space",html:`
        <div class="private-lock">
          <div class="pl-mark">${u("i-eye-off")}</div>
          <h1>Private Space</h1>
          <p>This room stays out of Home, Timeline, Search and Insights. Enter your PIN to open it.</p>
          <div class="pin-dots" id="pin-dots" aria-hidden="true">${[0,1,2,3].map(()=>'<span class="pin-dot"></span>').join("")}</div>
          <div class="keypad" id="keypad">
            ${[1,2,3,4,5,6,7,8,9].map(f=>`<button data-key="${f}" aria-label="${f}">${f}</button>`).join("")}
            <button data-key="clear" aria-label="Clear">C</button>
            <button data-key="0" aria-label="0">0</button>
            <button data-key="back" aria-label="Delete last digit">⌫</button>
          </div>
          <p class="hint" style="margin-top:18px;max-width:32ch">A PIN keeps this screen closed. It is not encryption — the records are stored in this browser's local storage.</p>
          <p class="hint" id="pin-error" role="alert" style="color:#8d3a33;min-height:18px"></p>
        </div>
      `,mount(){let f="";const l=document.getElementById("pin-dots"),y=document.getElementById("pin-error"),E=()=>{[...l.children].forEach((I,S)=>I.classList.toggle("on",S<f.length))};document.getElementById("keypad").addEventListener("click",async I=>{const S=I.target.closest("[data-key]");if(!S)return;const L=S.dataset.key;L==="clear"?f="":L==="back"?f=f.slice(0,-1):f.length<4&&(f+=L),E(),f.length===4&&(await ht(f,h.data.settings.pinSalt)===h.data.settings.pinHash?(h.data.settings.unlocked=!0,h.save(),N("Unlocked for this session.","i-shield"),window.dispatchEvent(new CustomEvent("keepsy:route",{detail:{raw:location.hash}}))):(y.textContent="That PIN does not match.",f="",E()))});const x=document.getElementById("keypad");document.addEventListener("keydown",function I(S){if(document.getElementById("keypad")!==x){document.removeEventListener("keydown",I);return}if(/^\d$/.test(S.key)){const L=document.querySelector(`[data-key="${S.key}"]`);L&&L.click()}S.key==="Backspace"&&document.querySelector('[data-key="back"]')?.click()})}};const r=n.filter(f=>z(f.date)===z(B())),p=Object.fromEntries(re.kinds.map(f=>[f.id,n.filter(l=>l.kind===f.id).length])),c=i.filter(f=>f.status==="open"),v=s==="all"||s==="reminder"?c:[],g=s==="all"?n:n.filter(f=>f.kind===s),d=`
    <section class="private-board" aria-label="Private Space quick widgets">
      <div class="private-board-head"><span class="private-board-mark">${u("i-eye-off")}</span><div><span class="private-board-kicker">ONLY YOURS · KEPT CLOSE</span><h2>Your private pockets</h2></div><span class="private-board-total">${n.length}<small>kept</small></span></div>
      <div class="private-widget-grid">
        ${re.kinds.map(f=>{const l=f.id==="reminder"?p.reminder+c.length:p[f.id],y=f.id==="reminder"?l?C(l,"private reminder"):"Keep reminders in this space":l?`${C(l,"memory")} kept private`:"Open this private pocket";return`<a class="private-widget private-widget--${f.id}" href="#/private?kind=${f.id}" data-nav aria-label="${o(f.label)}: ${l} saved">
            <span class="private-widget-top">${u(f.icon)}<b>${l}</b></span><strong>${o(f.label)}</strong><small>${o(y)}</small><span class="private-widget-arrow" aria-hidden="true">↗</span>
          </a>`}).join("")}
      </div>
      <button class="private-board-add" data-new-private>${u("i-plus")} Add something private</button>
    </section>`;return{area:"private",eyebrow:"Only you",title:"Private Space",html:`
      <section class="area-hero">
        <div class="ah-top">
          <span class="ah-ic">${u("i-eye-off")}</span>
          <div style="flex:1;min-width:0">
            <h1>Private Space</h1>
            <p class="lede">${o(re.blurb)}</p>
          </div>
        </div>
        <div class="ah-actions">
          <button class="btn btn-sm btn-accent" data-new-private>${u("i-plus")} Add a private note</button>
          ${a?`<button class="btn btn-sm btn-ghost" data-lock>${u("i-shield")} Lock</button>`:""}
        </div>
      </section>

      ${d}

      <div class="notice quiet" style="margin-top:16px">${u("i-eye-off")}<span>Nothing here appears on Home, Timeline, Search, Insights, Your Month or notifications. Reminders marked private show as “Private reminder”.</span></div>

      ${n.length?`<section class="section" style="margin-top:18px">
        <div class="stat-row">
          <div class="stat"><div class="s-label">Kept here</div><div class="s-value num">${n.length}</div></div>
          <div class="stat"><div class="s-label">This month</div><div class="s-value num">${r.length}</div></div>
          <div class="stat"><div class="s-label">Private reminders</div><div class="s-value num">${i.filter(f=>f.status==="open").length}</div></div>
        </div>
      </section>`:""}

      <section class="section">
        ${g.length||v.length?`<div class="record-list">${g.map(f=>ut(f,{showArea:!1})).join("")}</div>
          ${v.length?`<div class="private-reminders"><div class="private-reminders-title">${u("i-bell")} Private reminders</div>${v.map(f=>`<button class="row" data-open-reminder="${f.id}" style="width:100%"><span class="row-thumb">${u("i-bell")}</span><span class="row-main"><span class="row-title">Private reminder</span><span class="row-meta">${o(D(f.due,"short"))}</span></span><span class="row-side">${u("i-chevron-right")}</span></button>`).join("")}</div>`:""}`:`<div class="empty"><div class="em-mark">${u("i-moon")}</div>
            <h3>${s==="all"?"This space is empty":`No ${o(re.kinds.find(f=>f.id===s)?.label.toLowerCase()||"memories")} yet`}</h3>
            <p>Notes, routines, tracking or a medicine schedule. Nothing here is shared with the rest of Keepsy.</p>
            <button class="btn btn-accent" data-new-private>Write the first note</button></div>`}
      </section>

      <p class="hint" style="margin-top:26px;text-align:center">Keepsy does not diagnose, recommend medicines or make predictions. Estimates are labelled as estimates.</p>
    `,mount(){document.querySelector("[data-lock]")?.addEventListener("click",()=>{h.data.settings.unlocked=!1,h.save(),N("Private Space locked.","i-shield"),window.dispatchEvent(new CustomEvent("keepsy:route",{detail:{raw:location.hash}}))})}}}window.addEventListener("beforeinstallprompt",e=>{e.preventDefault(),window.keepsyInstallPrompt=e});window.addEventListener("appinstalled",()=>{window.keepsyInstallPrompt=null});h.init();h.syncNotifications();const K=document.getElementById("view"),ie=document.getElementById("topbar"),Ne=document.getElementById("app"),fa=[["timeline","Timeline","i-clock"],["calendar","Calendar","i-calendar"],["search","Search","i-search"],["insights","Insights","i-sparkle"],["month","Your Month","i-calendar"]],ya=[["reminders","Reminders","i-bell"],["archive","Archive","i-archive"],["trash","Recently Deleted","i-trash"],["settings","Settings","i-settings"],["data","Export / Import","i-download"]];function ga(){const e=h.unreadCount(),t=h.reminders.filter(n=>n.status==="open").length,a=n=>h.live.filter(i=>i.area===n).length;return`
    <div class="nav-group">
      <div class="nav-label">Keepsy</div>
      <a class="nav-link" href="#/" data-nav>${u("i-home")}<span>Home</span>
        ${e?`<span class="nav-count" aria-label="${e} unread">${e}</span>`:""}</a>
    </div>

    <div class="nav-group">
      <div class="nav-label">Your Life</div>
      <div class="nav-area-grid">
        ${F.map(n=>{const i=a(n.slug);return`<a class="nav-link" href="#/a/${n.slug}" data-nav style="--nav-accent:${n.palette[2]}">
            ${u(n.icon)}<span>${o(n.name.replace(" & Grooming","").replace(" & Milestones",""))}</span>
            ${i?`<span class="nav-count">${i}</span>`:""}
          </a>`}).join("")}
      </div>
    </div>

    <div class="nav-group">
      <div class="nav-label">Explore</div>
      ${fa.map(([n,i,s])=>`<a class="nav-link" href="#/${n}" data-nav>${u(s)}<span>${i}</span></a>`).join("")}
    </div>

    <div class="nav-group">
      <div class="nav-label">Private</div>
      <a class="nav-link" href="#/private" data-nav style="--nav-accent:#B98292">${u("i-eye-off")}<span>Private Space</span>
        ${h.data.settings.pinHash?'<span class="nav-dot" aria-label="PIN protected"></span>':""}</a>
    </div>

    <div class="nav-group">
      <div class="nav-label">Other</div>
      ${ya.map(([n,i,s])=>`<a class="nav-link" href="#/${n}" data-nav>${u(s)}<span>${i}</span>
        ${n==="reminders"&&t?`<span class="nav-count">${t}</span>`:""}</a>`).join("")}
    </div>
  `}function ba(){const e=h.profile;return`<button class="profile-switch" data-switch-profile-open>
    <span class="avatar">${o(ot(e?.name||"Me"))}</span>
    <span class="ps-meta"><strong>${o(e?.name||"Me")}</strong><span>${h.profiles.length} profile${h.profiles.length===1?"":"s"} · local</span></span>
    ${u("i-chevron-down","ic-sm")}
  </button>`}function mt(){document.getElementById("drawer-nav").innerHTML=ga(),document.getElementById("drawer-foot").innerHTML=ba();const e=rt();document.querySelectorAll("#drawer-nav [data-nav]").forEach(t=>{t.getAttribute("href")===e?t.setAttribute("aria-current","page"):t.removeAttribute("aria-current")}),document.querySelectorAll("#drawer-nav a").forEach(t=>t.addEventListener("click",()=>le())),document.querySelector("[data-switch-profile-open]")?.addEventListener("click",()=>{le(),$a()})}function $a(){U({title:"Profiles",subtitle:"Each profile keeps its own records in this browser.",body:`<div>
      ${h.profiles.map(e=>`<div class="profile-card ${e.id===h.activeId?"active":""}">
        <span class="avatar">${o(ot(e.name))}</span>
        <span class="pc-main"><strong>${o(e.name)}</strong><span>${e.id===h.activeId?"Currently open":"Switch"}</span></span>
        <button class="btn btn-sm ${e.id===h.activeId?"btn-ghost":"btn-accent"}" data-pick="${e.id}" ${e.id===h.activeId?"disabled":""}>${e.id===h.activeId?"Open":"Switch"}</button>
      </div>`).join("")}
      <button class="btn btn-ghost btn-block" data-new-profile style="margin-top:8px">${u("i-plus")} New profile</button>
    </div>`,onMount:(e,t)=>{e.querySelectorAll("[data-pick]").forEach(a=>a.addEventListener("click",()=>{a.disabled||(h.setProfile(a.dataset.pick),t(),N(`Now showing ${h.profile.name}.`,"i-users"),Y("#/"),H(),Ue())})),e.querySelector("[data-new-profile]").addEventListener("click",()=>{U({title:"New profile",body:'<div class="field"><label for="npp">Name</label><input id="npp" class="input" maxlength="40" placeholder="e.g. Aditi" /></div>',foot:'<button class="btn btn-ghost" data-sheet-close>Cancel</button><button class="btn btn-accent" id="npp-save">Create</button>',onMount:(a,n)=>{a.querySelector("#npp-save").addEventListener("click",()=>{const i=a.querySelector("#npp").value.trim();i&&(h.addProfile(i),n(),t(),N("Profile created — its records stay separate.","i-users"),Y("#/"),H())}),setTimeout(()=>a.querySelector("#npp").focus(),300)}})})}})}function wa(e){const t=h.unreadCount();ie.innerHTML=`
    <button class="icon-btn topbar-menu" id="menu-btn" aria-label="Open navigation; menu slides in from the left" title="Menu slides in from the left" aria-expanded="false">
      ${u("i-menu")}
    </button>
    <div class="topbar-title">
      <span class="eyebrow">${o(e.eyebrow||"Keepsy")}</span>
      <strong>${o(e.title||"Keepsy")}</strong>
    </div>
    <div class="topbar-actions">
      <button class="icon-btn" data-global-search aria-label="Search Keepsy">${u("i-search")}</button>
      <button class="icon-btn" data-global-inbox aria-label="Notifications${t?`, ${t} unread`:""}">
        ${u("i-bell")}${t?'<span class="dot"></span>':""}
      </button>
    </div>
  `,ie.querySelector("#menu-btn").addEventListener("click",()=>{At(),ie.querySelector("#menu-btn")?.setAttribute("aria-expanded",String(document.getElementById("drawer").classList.contains("open")))}),ie.querySelector("[data-global-search]").addEventListener("click",()=>Y("#/search")),ie.querySelector("[data-global-inbox]").addEventListener("click",()=>Y("#/inbox"))}let vt=null;function ka(e){const t=e.segs[0]||"",a=e.params;switch(t){case"":case"home":return Ze();case"a":{const n=e.segs[1];if(n==="private")return nt(a);const i=ea(n,a);return i||st(`There is no life area called “${n}”.`)}case"timeline":return ta(a);case"calendar":return aa(a);case"search":return na(a);case"insights":return sa();case"month":return ia(a);case"reminders":return da();case"inbox":return pa();case"settings":return at();case"data":return at();case"archive":return ha();case"trash":return ma();case"private":return nt(a);case"r":return vt||Ze();default:return st(`Keepsy has no page at “${t}”.`)}}function st(e){return{area:"home-dash",eyebrow:"Keepsy",title:"Not found",html:`<section class="screen-head"><div class="eyebrow">A wrong turn</div><h1>This page is not here</h1>
      <p class="lede">${o(e)}</p>
      <div class="ah-actions"><a class="btn btn-accent" href="#/" data-nav>Back to Home</a></div></section>`,mount(){}}}function xa(e){const t=e||"home-dash";Ne.setAttribute("data-area",t),document.documentElement.setAttribute("data-area",t),document.body.setAttribute("data-area",t)}function H(){const e=Oe(),t=Ne.dataset.area,a=window.__keepsyKey;if(a&&yt(a,window.scrollY),e.segs[0]==="r"&&e.segs[1]){const c=e.segs[1];if(h.record(c)){ct(),Ht(c);return}N("That record is no longer here.","i-info"),Y("#/",{replace:!0});return}lt();const n=ka(e);vt=n;const i=F.findIndex(c=>c.slug===t),s=F.findIndex(c=>c.slug===e.segs[1]),r=e.segs[0]==="a"&&i>=0&&s>=0&&i!==s?s>i?"area-enter-from-right":"area-enter-from-left":"";xa(n.area),K.innerHTML=n.html,K.classList.remove("area-enter-from-right","area-enter-from-left"),r&&(K.offsetWidth,K.classList.add(r),clearTimeout(window.__areaEnterTimer),window.__areaEnterTimer=setTimeout(()=>K.classList.remove(r),460)),K.setAttribute("aria-busy","false"),wa(n),mt(),K.querySelectorAll("[data-open-record]").forEach(c=>c.addEventListener("click",()=>Y(`#/r/${c.dataset.openRecord}`))),K.querySelectorAll("[data-open-reminder]").forEach(c=>c.addEventListener("click",()=>{const v=h.reminder(c.dataset.openReminder);v&&ve({reminder:v,onSaved:()=>H()})})),K.querySelectorAll("[data-quick-add]").forEach(c=>c.addEventListener("click",()=>Be())),K.querySelectorAll("[data-new-reminder]").forEach(c=>c.addEventListener("click",()=>ve({onSaved:()=>H()}))),K.querySelectorAll("[data-new-record]").forEach(c=>c.addEventListener("click",()=>Ce({area:c.dataset.newRecord,onSaved:()=>H()}))),K.querySelectorAll("[data-new-private]").forEach(c=>c.addEventListener("click",()=>Ce({area:"private",onSaved:()=>H()}))),K.querySelectorAll("[data-area-filter]").forEach(c=>c.addEventListener("click",()=>{const v=c.dataset.areaFilter,g=c.dataset.kind;Y(`#/a/${v}${g==="all"?"":`?kind=${g}`}`)})),K.querySelectorAll("[data-area-sort]").forEach(c=>c.addEventListener("click",()=>{const v=c.dataset.areaSort;Y(`#/a/${v}?sort=${c.dataset.sort}`)})),K.querySelectorAll("[data-mark-all]").forEach(c=>c.addEventListener("click",()=>{h.markAllNotificationsRead(),N("All caught up.","i-check"),H()})),K.querySelectorAll("[data-nav]").forEach(c=>c.addEventListener("click",()=>le())),n.mount&&n.mount(),K.__remHandler&&K.removeEventListener("click",K.__remHandler),K.__remHandler=c=>Ea(c),K.addEventListener("click",K.__remHandler),window.__keepsyKey=e.raw;const p=gt(e.raw);window.scrollTo({top:p||0,behavior:"instant"in window?"instant":"auto"}),document.title=`${n.title||"Keepsy"} · Keepsy`}let Ie=!1;function Ea(e){return ua(e,()=>{Ie||(Ie=!0,requestAnimationFrame(()=>{Ie=!1,H()}))})}function Ue(){const e=document.getElementById("drawer");e&&(window.matchMedia("(min-width:900px)").matches?e.setAttribute("aria-hidden","false"):e.classList.contains("open")||e.setAttribute("aria-hidden","true"))}window.addEventListener("resize",Ue);window.addEventListener("keepsy:open-reminder",e=>{const t=h.reminder(e.detail);t&&ve({reminder:t,onSaved:()=>H()})});window.addEventListener("keepsy:record-added",e=>{location.hash.startsWith("#/r/")?Y(`#/r/${e.detail}`):H()});window.addEventListener("keepsy:route",()=>{H()});document.getElementById("fab").addEventListener("click",()=>Be());let $e=null;K.addEventListener("touchstart",e=>{e.touches.length!==1||!e.target.closest("[data-area-swipe-zone]")||e.target.closest("button,a,input,select,textarea")||($e={x:e.touches[0].clientX,y:e.touches[0].clientY,slug:Ne.dataset.area})},{passive:!0});K.addEventListener("touchend",e=>{if(!$e)return;const t=$e;$e=null;const a=e.changedTouches[0];if(!a)return;const n=a.clientX-t.x,i=a.clientY-t.y;if(Math.abs(n)<72||Math.abs(n)<Math.abs(i)*1.25)return;const s=F.findIndex(p=>p.slug===t.slug);if(s<0)return;const r=n<0?F[s+1]:F[s-1];r&&Y(`#/a/${r.slug}`)});let me=null;document.addEventListener("touchstart",e=>{const t=e.touches[0].clientX;t<26&&!document.getElementById("drawer").classList.contains("open")&&(me={x:t,y:e.touches[0].clientY})},{passive:!0});document.addEventListener("touchmove",e=>{if(!me)return;e.touches[0].clientX-me.x>42&&(dt(),me=null)},{passive:!0});document.addEventListener("touchend",()=>{me=null});document.addEventListener("keydown",e=>{if(!["INPUT","TEXTAREA","SELECT"].includes(document.activeElement?.tagName)){if(!e.altKey&&!e.metaKey&&!e.ctrlKey&&!e.shiftKey&&(e.key==="ArrowLeft"||e.key==="ArrowRight")){if(document.activeElement?.closest('button,a,[role="button"],[role="tab"]'))return;const a=F.findIndex(n=>n.slug===Ne.dataset.area);if(a>=0){const n=F[a+(e.key==="ArrowRight"?1:-1)];n&&(e.preventDefault(),Y(`#/a/${n.slug}`));return}}e.key==="/"&&(e.preventDefault(),Y("#/search")),e.key==="n"&&!e.metaKey&&!e.ctrlKey&&(e.preventDefault(),Be())}});window.addEventListener("scroll",()=>{ie.classList.toggle("stuck",window.scrollY>8)},{passive:!0});h.subscribe(()=>{document.getElementById("drawer").classList.contains("open")||mt()});"serviceWorker"in navigator&&location.protocol.startsWith("http")&&window.addEventListener("load",()=>{navigator.serviceWorker.register("./sw.js?v=7",{updateViaCache:"none"}).then(e=>e.update()).catch(()=>{})});bt(()=>{});$t(()=>{ct(),lt()});H();Ue();
