import React from 'react';
import { createRoot } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { createGlobalStyle } from 'styled-components';
import { Capacitor } from '@capacitor/core';
import { fireEvent, getByRole, queryByRole, waitFor } from '@testing-library/dom';
import { UserProvider } from '../../../src/context/UserContext';
import CheckinCard from '../../../src/components/CheckinCard';

const Global = createGlobalStyle`body { margin: 0; background: #fffaf0; color: #2f2100; font-family: Arial,sans-serif; } main { width: min(calc(100% - 24px),1040px); margin: 12px auto; display: grid; gap: 12px; } * { box-sizing: border-box; }`;
const root = createRoot(document.getElementById('app'));
const nativeFetch = window.fetch.bind(window), calls = [], downloads = [], shares = [], checks = [];
const originalNativePlatform = Capacitor.isNativePlatform;
let mountId = 0, manifestFailure = false, renderFailure = '', slow = false;
const checkin = { id:46,nutzer_id:99,nutzer_name:'Mia_mit_einem_besonders_langen_Nutzernamen',eisdiele_id:7,eisdiele_name:'Eiscafé Sonnenschein',datum:'2026-10-07 12:00:00',typ:'Kugel',geschmackbewertung:4.5,waffelbewertung:4,größenbewertung:5,preisleistungsbewertung:4.5,anreise:'Fahrrad',is_on_site:1,kommentar:'Ein schöner Tag mit köstlichem Eis.',eissorten:[{sortenname:'Pistazie',bewertung:5}],bilder:[],likes_count:2,has_liked:false,commentCount:0 };
const manifest = { checkin_id:46,shop_name:'Eiscafé Sonnenschein mit einem besonders langen Namen',images:[{image_id:101,image_url:'/fixture-ice.svg'},{image_id:102,image_url:'/fixture-ice.svg'}],awards:[{title:'Herbstentdecker'}],slides:{photo:true,review:true} };
const json = (data,status=200) => new Response(JSON.stringify(data), {status,headers:{'Content-Type':'application/json'}});
const tick = ms => new Promise(resolve=>setTimeout(resolve,ms ?? 90));
window.fetch = async (input,init={}) => {
  const url = new URL(String(input),location.origin);
  if (url.origin===location.origin) return nativeFetch(input,init);
  if (url.origin!=='https://test.invalid') throw new Error('External requests blocked');
  if (url.pathname.includes('session.php')) return json({status:'success',userId:99,username:'Mia'});
  if (url.pathname.includes('get_user_stats.php')) return json({status:'success',avatar_url:'/fixture-avatar.svg'});
  if (url.pathname.includes('likes.php')) return json({success:true,likes_count:2,has_liked:false,users:[]});
  if (url.pathname.endsWith('checkin_share.php')) {
    calls.push({url:url.href,init,payload:init.body?JSON.parse(init.body):null});
    if (!init.method) {
      if (manifestFailure) return json({message:'Check-in konnte nicht geladen werden.'},500);
      const data = structuredClone(manifest);
      if (url.searchParams.get('checkin_id')==='48') Object.assign(data,{checkin_id:48,shop_name:'Mein Eis-Moment',images:[],awards:[],slides:{photo:false,review:true}});
      return json({status:'success',data});
    }
    const payload = JSON.parse(init.body);
    if (slow && payload.format==='feed') await tick(350); // Intentionally ignores abort to test stale results.
    if (renderFailure==='error') return json({message:'Bild konnte nicht erstellt werden.'},500);
    if (renderFailure==='html') return new Response('<h1>Kein gültiges PNG</h1>',{headers:{'Content-Type':'text/html'}});
    if (renderFailure==='empty') return new Response(new Blob([]),{headers:{'Content-Type':'image/png'}});
    const png = await (await nativeFetch(`/${payload.format}-${payload.slide}.png`)).blob();
    return new Response(png,{headers:{'Content-Type':'image/png','Content-Disposition':`attachment; filename="ice-${payload.format}-${payload.slide}-${payload.checkin_id}-${payload.image_id || 0}.png"`}});
  }
  return json({status:'success',data:[],awards:[],kommentare:[],users:[]});
};
HTMLAnchorElement.prototype.click = function(){ downloads.push({name:this.download,url:this.href}); };
const setShare = kind => {
  Object.defineProperty(navigator,'canShare',{configurable:true,value:kind==='unsupported'?undefined:()=>true});
  Object.defineProperty(navigator,'share',{configurable:true,value:async data => { if(kind==='cancel') throw new DOMException('Canceled','AbortError'); shares.push(data); }});
};
setShare('success');
const check = (value,message) => { if(!value)throw new Error(message); checks.push(message); };
const button = name => getByRole(document.body,'button',{name});
const dialog = () => getByRole(document.body,'dialog');
const ready = async () => { await waitFor(()=>{ if(button(Capacitor.isNativePlatform() ? 'Bild teilen' : 'PNG herunterladen').disabled)throw new Error('Waiting for preview'); }); await tick(); };
const lastRender = () => calls.filter(call=>call.payload).at(-1).payload;
async function mount({guest=false,foreign=false,privateCheckin=false,native=false}={}) {
  Capacitor.isNativePlatform = native ? () => true : originalNativePlatform;
  localStorage.clear(); if(!guest) { localStorage.setItem('userId','99');localStorage.setItem('username','Mia');localStorage.setItem('authToken','test-token'); }
  const data = privateCheckin?{...checkin,id:48,eisdiele_id:null,context_type:'no_public_place'}:foreign?{...checkin,nutzer_id:77,nutzer_name:'Jonas'}:checkin;
  root.render(<MemoryRouter key={++mountId}><UserProvider><Global/><main><CheckinCard checkin={data}/></main></UserProvider></MemoryRouter>);
  await tick(); await tick();
}
async function open(){ fireEvent.click(button('Check-in teilen')); await ready(); }
window.sharePreview = async kind => {
  await mount({guest:kind==='guest',privateCheckin:kind==='private',native:kind==='native'});
  if(kind!=='guest' && kind!=='card') { await open(); if(kind==='feed') { fireEvent.click(button('Beitrag · 4:5'));fireEvent.click(button('Check-in-Karte'));await ready(); } }
};
window.prepareKeyboardAudit = async () => { await mount(); button('Check-in teilen').focus(); };
window.shareMeasure = () => ({overflow:document.documentElement.scrollWidth>innerWidth+1,smallControls:[...document.querySelectorAll('[role=dialog] button,[role=dialog] select,[role=dialog] summary')].filter(el=>el.getBoundingClientRect().height>0 && (el.getBoundingClientRect().height<43.5 || el.getBoundingClientRect().width<43.5)).map(el=>el.textContent),dialogOverflow:document.querySelector('[role=dialog]')?.scrollWidth>innerWidth+1});
(async()=>{
  const preview = new URLSearchParams(location.search).get('preview');
  if(preview){await window.sharePreview(preview); document.getElementById('results').dataset.status='preview';return;}
  await mount({guest:true});check(!queryByRole(document.body,'button',{name:'Check-in teilen'}),'Guests have no export action');
  await mount({foreign:true});check(!queryByRole(document.body,'button',{name:'Check-in teilen'}),'Foreign check-ins have no export action');
  await mount();check(Boolean(button('Check-in teilen')),'Own check-in has share button');
  const social=document.querySelector('[data-activity-social]');
  check([...social.children].filter(el=>el.getBoundingClientRect().height).every(el=>Math.abs(el.getBoundingClientRect().top-social.getBoundingClientRect().top)<3),'Social actions stay on one line');
  check(getComputedStyle(button('Check-in teilen')).backgroundColor==='rgba(0, 0, 0, 0)','Share action uses a quiet surface');
  await open();check(lastRender().format==='story' && lastRender().slide==='photo','Starts with first photo as story');
  check(calls.every(call=>call.init.headers.Authorization==='Bearer test-token'),'Manifest and PNG use authenticated requests');
  check(getByRole(dialog(),'img',{name:/Story für/}).src.startsWith('blob:'),'Uses generated binary preview');
  check(!window.shareMeasure().overflow && !window.shareMeasure().dialogOverflow,'Dialog fits viewport');
  check(window.shareMeasure().smallControls.length===0,'Dialog actions are at least 44 px');
  fireEvent.click(button('Beitrag · 4:5'));await ready();
  check(lastRender().format==='feed','Post selection requests 4:5 format');
  fireEvent.click(button('Foto 2 auswählen'));await ready();check(lastRender().image_id===102,'Can choose second photo');
  fireEvent.click(button('PNG herunterladen'));check(downloads.at(-1).name==='ice-feed-photo-46-102.png','Download uses selected format and photo filename');
  fireEvent.click(button('Bild teilen'));await tick();check(shares.at(-1).files[0].type==='image/png' && shares.at(-1).files[0].size>0,'Web Share receives PNG file');
  check(shares.at(-1).text.includes('@ice_app.de'),'Share includes Instagram caption');
  setShare('cancel');fireEvent.click(button('Bild teilen'));await tick();check(!queryByRole(dialog(),'alert'),'Canceling share shows no error');
  setShare('unsupported');fireEvent.click(button('Bild teilen'));await tick();check(downloads.length===2 && getByRole(dialog(),'status').textContent.includes('Download'),'Unsupported file sharing downloads PNG with feedback');
  setShare('success');fireEvent.click(button('Check-in-Karte'));await ready();check(lastRender().slide==='review' && !('image_id' in lastRender()),'Check-in card exports without photo selection');
  fireEvent.click(dialog().querySelector('summary'));
  fireEvent.click(getByRole(dialog(),'checkbox',{name:'Auszeichnungen anzeigen'}));await ready();check(!lastRender().include_awards,'Award toggle reaches renderer');
  slow=true;
  fireEvent.click(button('Story · 9:16'));await ready();
  fireEvent.click(button('Beitrag · 4:5'));await tick(30);
  fireEvent.click(button('Story · 9:16'));await ready();await tick(400);
  check(getByRole(dialog(),'img',{name:/Story für/}).naturalHeight===1920 && lastRender().format==='story','Late response cannot replace latest format');slow=false;
  fireEvent.click(button('Dialog schließen'));await tick();check(!queryByRole(document.body,'dialog'),'Share dialog closes');
  manifestFailure=true;fireEvent.click(button('Check-in teilen'));await tick();check(getByRole(dialog(),'alert').textContent.includes('geladen'),'Loading error is shown');
  manifestFailure=false;fireEvent.click(button('Erneut versuchen'));await ready();check(Boolean(getByRole(dialog(),'img',{name:/Story für/})),'Retry restores export after load failure');
  for(const failure of ['error','html','empty']) {
    renderFailure=failure;fireEvent.click(button(lastRender().format==='story'?'Beitrag · 4:5':'Story · 9:16'));await tick();
    await waitFor(()=>getByRole(dialog(),'alert'));check(button('PNG herunterladen').disabled && button('Bild teilen').disabled,'Rejects invalid export: '+failure);
    const failedSelection = structuredClone(lastRender()), manifestCalls=calls.filter(call=>!call.payload).length;
    renderFailure='';fireEvent.click(button('Erneut versuchen'));await ready();
    check(JSON.stringify(lastRender())===JSON.stringify(failedSelection) && calls.filter(call=>!call.payload).length===manifestCalls,'Retry preserves format, motif and awards: '+failure);
  }
  fireEvent.click(button('Foto'));await ready();fireEvent.click(button('Foto 2 auswählen'));await ready();
  renderFailure='error';fireEvent.click(button(lastRender().format==='story'?'Beitrag · 4:5':'Story · 9:16'));await tick();
  await waitFor(()=>getByRole(dialog(),'alert'));renderFailure='';fireEvent.click(button('Erneut versuchen'));await ready();
  check(lastRender().image_id===102 && lastRender().slide==='photo','Retry preserves selected second photo');
  const beforeZoom=button('Bildvorschau vergrößern').getBoundingClientRect().width;
  fireEvent.click(button('Bildvorschau vergrößern'));await tick();
  check(button('Bildvorschau verkleinern').getBoundingClientRect().width>beforeZoom,'Preview can be enlarged');
  fireEvent.click(button('Bildvorschau verkleinern'));
  fireEvent.click(button('Dialog schließen'));setShare('unsupported');await mount();await open();
  check(!queryByRole(dialog(),'button',{name:'Bild teilen'}) && getComputedStyle(button('PNG herunterladen')).backgroundColor==='rgb(255, 190, 53)','Unsupported browsers show saving as the primary action');
  fireEvent.click(button('PNG herunterladen'));await tick();
  check(getByRole(dialog(),'status').getBoundingClientRect().bottom<=innerHeight,'Save feedback is visible in fixed footer');
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Denied');}}});
  fireEvent.click(button('Begleittext kopieren'));await tick();
  check(document.activeElement===getByRole(dialog(),'textbox',{name:'Text zum Kopieren'}) && document.activeElement.selectionEnd===document.activeElement.value.length,'Clipboard failure reveals and selects manual caption');
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.copiedCaption=text;}}});
  fireEvent.click(button('Begleittext kopieren'));await tick();
  check(window.copiedCaption.includes('@ice_app.de') && !queryByRole(dialog(),'alert'),'Copy can succeed after a clipboard error');
  fireEvent.click(button('Dialog schließen'));await mount({native:true});await open();
  check(Boolean(button('Bild teilen')) && !queryByRole(dialog(),'button',{name:'PNG herunterladen'}) && Boolean(button('Begleittext kopieren')),'Native apps show sharing and caption copy without a browser download action');
  check(!window.shareMeasure().overflow && window.shareMeasure().smallControls.length===0,'Native actions fit mobile and desktop layouts');
  fireEvent.click(button('Dialog schließen'));setShare('success');await mount({privateCheckin:true});await open();
  check(lastRender().checkin_id===48 && lastRender().slide==='review' && !queryByRole(dialog(),'button',{name:'Foto'}),'Check-ins without a photo or public place use check-in card');
  check(!window.shareMeasure().overflow,'Private check-in and dialog do not overflow');
  document.getElementById('results').textContent=JSON.stringify({passed:checks.length,checks,overflow:window.shareMeasure().overflow});
  document.getElementById('results').dataset.status='passed';
})().catch(error=>{document.getElementById('results').textContent=error.stack;document.getElementById('results').dataset.status='failed';});
