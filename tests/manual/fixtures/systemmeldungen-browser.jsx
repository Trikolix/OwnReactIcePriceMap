import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { configure, fireEvent, getByRole, getByLabelText, waitFor } from '@testing-library/dom';
import { UserProvider } from '../../../src/context/UserContext';
import SystemmeldungForm from '../../../src/components/SystemmeldungForm';
import UserSite from '../../../src/pages/UserSite';
import '../../../src/index.css';

const checks=[];
configure({getElementError:message=>new Error(message.split('Here are')[0].slice(0,600))});
window.confirm=()=>true;
const check=(condition,message)=>{if(!condition)throw new Error(message);checks.push(message);};
const tick=()=>new Promise(resolve=>setTimeout(resolve,70));
const button=name=>getByRole(document.body,'button',{name,exact:true});
const click=async name=>{fireEvent.click(button(name));await tick();};
const field=(name,value)=>fireEvent.change(getByLabelText(document.body,name,{exact:true}),{target:{value}});
let rows=[],calls=[],id=0,failPublish=false,countChange=false,failSave=false;
let notifications=[],notificationError=false,withdrawnMessage=false,failRead=false;
let profileStatsDelay=0;
const accepted=new Map();
const counts=form=>({in_app:120,email:form.mail_send_mode==='none'?0:form.mail_send_mode==='all'?100:80,web:form.push_web?7:0,android:form.push_android?5:0});
window.fetch=async(input,init={})=>{
  const url=new URL(String(input),'https://test.invalid');
  if(!url.href.startsWith('https://test.invalid/'))throw new Error('External request rejected');
  const body=init.body?JSON.parse(init.body):{};
  let data={status:'success'},status=200;
  calls.push({url:url.href,body,method:init.method||'GET',dialogPresent:!!document.querySelector('[role=dialog]')});
  if(url.pathname.includes('session.php'))data={...data,userId:1,username:'Admin',currentLevel:59,token:'test-token'};
  else if(url.pathname.includes('get_user_stats.php')){
    if(profileStatsDelay)await new Promise(resolve=>setTimeout(resolve,profileStatsDelay));
    data={...data,avatar_url:'fixture-avatar.png',nutzername:'Admin',erstellungsdatum:'2025-01-01'};
  }
  else if(url.pathname.includes('streak_status.php'))data={user_id:1,level_info:{level:59},streaks:{day:{state:'active',value:3},week:{state:'active',value:2}},refresh_after_seconds:3600};
  else if(url.pathname.includes('benachrichtigungen.php')){
    const action=url.searchParams.get('action');
    if(action==='list'){
      const before=Number(url.searchParams.get('before_id'));
      const available=notifications.filter(item=>!before||item.id<before);
      const items=available.slice(0,50);
      data={...data,notifications:items,unread_total:notifications.filter(item=>!item.ist_gelesen).length,next_cursor:available.length>50?items.at(-1).id:null};
      if(notificationError){status=500;data={status:'error',message:'Benachrichtigungen konnten nicht geladen werden.'};}
    }
    if(action==='markAsRead'){
      if(failRead){status=500;data={status:'error',message:'Read failed'};}
      else notifications=notifications.map(item=>item.id===body.id?{...item,ist_gelesen:true}:item);
    }
    if(action==='markAllAsRead')notifications=notifications.map(item=>({...item,ist_gelesen:true}));
  }
  else if(url.pathname.includes('systemmeldung.php')){
    const action=url.searchParams.get('action');
    if(action==='list')data={...data,systemmeldungen:rows,pagination:{page:1,pages:1,total:rows.length}};
    if(action==='preview')data={...data,counts:counts(body),mail_html:`<!doctype html><html><body style="font-family:Arial;padding:20px;color:#2f2100"><h2>Ice-App</h2><h3>${body.title||'Dein Titel'}</h3><p>Dies ist eine isolierte Template-Vorschau.</p></body></html>`};
    if(action==='save_draft'){
      if(failSave){status=500;data={status:'error',message:'Speichern vorübergehend fehlgeschlagen.'};}
      else{
        const nextId=body.id||++id;
        const row={id:nextId,titel:body.title,nachricht:body.message,state:'draft',erstellt_am:'2026-10-06T12:00:00',form:body,delivery_stats:{}};
        rows=[row,...rows.filter(item=>item.id!==nextId)];data.systemmeldung_id=nextId;
      }
    }
    if(action==='publish'){
      if(countChange){countChange=false;status=409;data={status:'error',message:'Empfängerzahlen haben sich geändert.',counts:{...counts(body),in_app:121}};}
      else{
        if(!accepted.has(body.request_key)){
          const result={status:'success',systemmeldung_id:body.id||++id,counts:body.expected_counts};accepted.set(body.request_key,result);
          rows=rows.map(row=>row.id===result.systemmeldung_id?{...row,state:'published'}:row);
        }
        data=accepted.get(body.request_key);
        if(failPublish){failPublish=false;throw new TypeError('Lost response after commit');}
      }
    }
    if(action==='update')data.systemmeldung_id=body.id;
    if(action==='test_email')data.recipient='admin@example.invalid';
    if(action==='get'){
      if(withdrawnMessage){status=404;data={status:'error',message:'Systemmeldung nicht mehr verfügbar.'};}
      else data.systemmeldung={titel:'Aktuelle Nachricht',nachricht:'Diese Nachricht wurde geladen.',link_url:'',link_label:'',notification_id:Number(url.searchParams.get('id'))};
    }
    if(action==='withdraw')rows=rows.map(row=>row.id===body.id?{...row,state:'withdrawn'}:row);
  }
  return {ok:status>=200&&status<300,status,json:async()=>data};
};
localStorage.clear();localStorage.setItem('userId','1');localStorage.setItem('username','Admin');localStorage.setItem('authToken','test-token');
const root=createRoot(document.getElementById('app'));
root.render(<MemoryRouter initialEntries={['/systemmeldungenform']}><UserProvider><SystemmeldungForm/></UserProvider></MemoryRouter>);
const appFits=()=>check(document.documentElement.scrollWidth<=innerWidth,'No horizontal overflow');
const dialogFits=()=>{
  const dialog=document.querySelector('[role=dialog]');
  const panel=[...dialog.querySelectorAll('div')].find(element=>getComputedStyle(element).maxHeight.includes('px')&&getComputedStyle(element).display==='flex');
  const rect=panel?.getBoundingClientRect();
  check(rect&&rect.left>=0&&rect.right<=innerWidth+1&&rect.top>=0&&rect.bottom<=innerHeight+1,'Dialog fits viewport');
  check(button('Jetzt veröffentlichen').getBoundingClientRect().bottom<=innerHeight,'Confirmation action remains visible');
};
async function fill(){field('Titel','Neu in der Ice-App');field('App-Nachricht','## Neue Funktionen\n\n**Entdecke** die Karte und unsere Challenges.');await click('2 · E-Mail');field('Mailtext','Hallo zusammen, unsere Karte hat neue Funktionen.');await click('1 · In-App');await new Promise(resolve=>setTimeout(resolve,450));}
window.openTestConfirmation=async()=>{button('Veröffentlichen').focus();await click('Veröffentlichen');};
window.showTestDeliveryHistory=async()=>{
  const form={title:'Neu in der Ice-App',message:'Entdecke die neue Karte und lade deine Freunde ein.',link_url:'/map',link_label:'Zur Karte',email_subject:'Ice-App: Neuigkeiten',email_heading:'Neuigkeiten',email_body:'Entdecke die neuen Funktionen.',email_buttons:[],mail_send_mode:'subscribers',push_web:true,push_android:true};
  rows=[
    {id:101,titel:form.title,nachricht:form.message,state:'published',erstellt_am:'2026-10-06T12:00:00',form,
      delivery_stats:{in_app:{total:1240,read:863},email:{accepted:1140,sent:20,pending:36,sending:5,retry:12,failed:4,uncertain:2,skipped:21},web:{accepted:82,pending:6,failed:2},android:{accepted:45,retry:3,uncertain:1}}},
    {id:100,titel:'Sommeraktion beendet',nachricht:'Diese Meldung wurde zurückgezogen.',state:'withdrawn',erstellt_am:'2026-10-01T12:00:00',form,
      delivery_stats:{in_app:{total:1200,read:1010},email:{sent:900,cancelled:80,skipped:20}}},
    {id:99,titel:'Ältere Systemmeldung',nachricht:'Eine Meldung ohne Versandnachweise.',state:'published',erstellt_am:'2026-09-15T12:00:00',form,delivery_stats:{}},
    {id:98,titel:'Noch keine Empfänger',nachricht:'Keine Nachrichten eingereiht.',state:'published',erstellt_am:'2026-09-14T12:00:00',form,delivery_stats:{in_app:{total:0,read:0},email:{pending:0}}},
  ];
  await click('Aktualisieren');
  const history=getByRole(document.body,'heading',{name:'Bisherige Meldungen'}).closest('section');
  history.querySelector('details').open=true;
  history.scrollIntoView({block:'start'});
};
(async()=>{
  await waitFor(()=>button('Entwurf speichern'));
  const preview=new URLSearchParams(location.search).get('preview');
  if(preview!==null){await fill();return 'preview';}
  check(getByLabelText(document.body,'App-Nachricht').value==='','App text starts empty');
  appFits();
  await click('Veröffentlichen');
  check(getByLabelText(document.body,'Titel').getAttribute('aria-invalid')==='true','Required title is marked');
  check(!document.querySelector('[role=dialog]'),'Invalid content cannot open publication');
  await fill();
  failSave=true;await click('Entwurf speichern');check(getByLabelText(document.body,'Titel').value==='Neu in der Ice-App','Failed save preserves input');
  failSave=false;await click('Entwurf speichern');
  check(rows[0].state==='draft'&&accepted.size===0,'Draft creates no publication');
  await click('2 · E-Mail');await click('App-Text übernehmen');
  check(getByLabelText(document.body,'Mailtext').value.includes('Entdecke'),'Explicit copy transfers app content');
  await click('3 · Versand');check(!getByLabelText(document.body,'Browser').checked&&!getByLabelText(document.body,'Android').checked,'Push starts disabled');
  fireEvent.click(getByLabelText(document.body,'Browser'));await tick();
  if(innerWidth<1024){await click('Vorschau');check(!!document.querySelector('[role=dialog]'),'Mobile preview opens');await click('Dialog schließen');}
  appFits();await click('Veröffentlichen');dialogFits();
  countChange=true;await click('Jetzt veröffentlichen');
  check(!!document.querySelector('[role=dialog]')&&document.querySelector('[role=dialog]').textContent.includes('121'),'Changed counts require new confirmation');
  failPublish=true;await click('Jetzt veröffentlichen');
  check(getByRole(document.body,'button',{name:'Erneut prüfen'}),'Lost response supports safe retry');
  check(button('Dialog schließen').disabled,'Unknown publication cannot be dismissed');
  await click('Erneut prüfen');
  const sends=calls.filter(call=>call.url.includes('action=publish'));
  check(sends.length===3&&sends[1].body.request_key===sends[2].body.request_key,'Network retry reuses request key');
  check(accepted.size===1,'Retry creates only one publication');
  check(getByLabelText(document.body,'Titel').value==='','Successful publication resets editor');
  await click('App-Inhalt korrigieren');await click('2 · E-Mail');
  check(getByLabelText(document.body,'Mailtext').matches(':disabled'),'Published email cannot be edited');
  check(![...document.querySelectorAll('button')].some(item=>item.textContent==='Veröffentlichen'),'Published correction cannot republish');
  await click('1 · In-App');field('Titel','Korrigierte Überschrift');await click('App-Korrektur speichern');
  const correction=calls.findLast(call=>call.url.includes('action=update'));
  check(!Object.hasOwn(correction.body,'email_body'),'Correction only submits app fields');
  await click('Neue Meldung');await fill();await click('3 · Versand');
  fireEvent.click(getByLabelText(document.body,/^E-Mail an alle/));await tick();await click('Veröffentlichen');
  check(button('Jetzt veröffentlichen').disabled,'All-mail needs explicit confirmation');
  fireEvent.click(getByLabelText(document.body,'Ich bestätige den Versand an alle Nutzer mit gültiger E-Mail-Adresse.'));
  field('Zur Bestätigung EMAIL AN ALLE eingeben','EMAIL AN ALLE');await tick();
  check(!button('Jetzt veröffentlichen').disabled,'Both confirmations enable all-mail');await click('Abbrechen');
  await click('1 · In-App');appFits();
  window.scrollTo(0,0);
  notifications=Array.from({length:123},(_,index)=>({id:123-index,typ:'systemmeldung',referenz_id:123-index,text:`Systemmeldung ${123-index}`,ist_gelesen:false,erstellt_am:'2026-10-06T12:00:00',zusatzdaten:JSON.stringify({message:'Cached obsolete content'})}));
  window.dispatchEvent(new Event('ice-notifications-changed'));
  await waitFor(()=>check(button('Benachrichtigungen').title.includes('123'),'Full unread total exceeds first page'));
  await click('Benachrichtigungen');
  const panel=()=>document.querySelector('[role=region][aria-label=Benachrichtigungen]');
  check(panel().querySelectorAll('li').length===50,'Bell initially displays one page');
  await click('Weitere Benachrichtigungen laden');
  check(panel().querySelectorAll('li').length===100,'Bell appends next page');
  withdrawnMessage=true;fireEvent.click(panel().querySelector('li'));await tick();
  check(!document.querySelector('[role=dialog]')&&panel().textContent.includes('nicht mehr verfügbar'),'Withdrawn message never opens cached fallback');
  check(notifications.every(item=>!item.ist_gelesen),'Unavailable content is not marked read');
  withdrawnMessage=false;failRead=true;fireEvent.click(panel().querySelector('li'));await tick();
  check(document.querySelector('[role=dialog]')?.textContent.includes('Lesestatus konnte nicht gespeichert'),'Read failure is visible');
  check(notifications.every(item=>!item.ist_gelesen),'Failed read update keeps unread status');
  fireEvent.click(getByRole(document.querySelector('[role=dialog]'),'button',{name:'Verstanden'}));await tick();
  failRead=false;await click('Benachrichtigungen');fireEvent.click(panel().querySelector('li'));await tick();
  check(calls.findLast(call=>call.url.includes('action=markAsRead')).dialogPresent,'Read is marked after the modal is rendered');
  await waitFor(()=>{if(!button('Benachrichtigungen').title.includes('122'))throw new Error('Waiting for refreshed unread count');});
  fireEvent.click(getByRole(document.querySelector('[role=dialog]'),'button',{name:'Verstanden'}));await tick();
  await click('Benachrichtigungen');await click('Alle als gelesen markieren');
  check(!button('Benachrichtigungen').textContent,'Mark all refreshes full unread total');
  await click('Benachrichtigungen schließen');notificationError=true;await click('Benachrichtigungen');
  check(panel().textContent.includes('Erneut laden'),'List failure offers retry');
  notificationError=false;await click('Erneut laden');check(!panel().querySelector('[role=alert]'),'List retry clears error');
  await click('Benachrichtigungen schließen');notifications.unshift({id:124,typ:'systemmeldung',referenz_id:124,text:'Fresh',ist_gelesen:false,erstellt_am:'2026-10-06T12:00:00'});
  window.dispatchEvent(new Event('focus'));await tick();check(button('Benachrichtigungen').title.includes('1 ungelesene'),'Returning to the app refreshes bell');
  profileStatsDelay=250;
  root.render(<MemoryRouter key="push-entry" initialEntries={['/user/1?systemmeldungId=124&notificationId=999']}><UserProvider><Routes><Route path="/user/:userId" element={<UserSite/>}/></Routes></UserProvider></MemoryRouter>);
  await waitFor(()=>{if(!calls.some(call=>call.url.includes('action=markAsRead')&&call.body.id===124))throw new Error('Waiting for push read');});
  check(calls.findLast(call=>call.url.includes('action=markAsRead')).dialogPresent,'Push entry marks read only after actual display during slow profile load');
  check(!calls.some(call=>call.url.includes('action=markAsRead')&&call.body.id===999),'Push entry uses server-owned notification instead of URL-supplied id');
  return 'passed';
})().then(status=>{
  const results=document.getElementById('results');results.dataset.status=status;results.textContent=JSON.stringify({passed:checks.length,viewport:[innerWidth,innerHeight],checks});
}).catch(error=>{
  const results=document.getElementById('results');results.dataset.status='failed';results.textContent=error.stack;
});
