const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const { build } = require('esbuild');

async function loadShare({native=false,failShare=null}={}) {
  const calls=[], state={native};
  const context={module:{exports:{}},Blob,File,DOMException,setTimeout,navigator:{},document:{},URL:{},
    FileReader:class { async readAsDataURL(blob){ this.result='data:image/png;base64,'+Buffer.from(await blob.arrayBuffer()).toString('base64');this.onload(); } },
    mockCore:{isNativePlatform:()=>state.native},
    mockFilesystem:{async rmdir(options){calls.push(['rmdir',options]);},async mkdir(options){calls.push(['mkdir',options]);},async writeFile(options){calls.push(['writeFile',options]);return{uri:'file:///cache/'+options.path};}},
    mockShare:{async share(options){calls.push(['share',options]);if(failShare)throw failShare;}},
  };
  context.globalThis=context;
  const result=await build({entryPoints:[path.resolve(__dirname,'../../src/features/socialMedia/shareStory.js')],bundle:true,write:false,platform:'browser',format:'cjs',plugins:[{name:'capacitor-test-bridge',setup(builder){
    builder.onResolve({filter:/^@capacitor\//},args=>({path:args.path,namespace:'fixture'}));
    builder.onLoad({filter:/.*/,namespace:'fixture'},args=>({contents:args.path.endsWith('/core')?'export const Capacitor=globalThis.mockCore;':args.path.endsWith('/filesystem')?'export const Filesystem=globalThis.mockFilesystem; export const Directory={Cache:"CACHE"};':'export const Share=globalThis.mockShare;'}));
  }}]});
  vm.runInNewContext(result.outputFiles[0].text,context);
  return{api:context.module.exports,context,calls};
}
test('native sharing writes only its PNG into dedicated cache and passes file URI',async()=>{
  const {api,calls}=await loadShare({native:true});
  const result=await api.shareCheckinStory({blob:new Blob(['PNG fixture']),filename:'ice-feed-46.png',shopName:'Eiscafé'});
  assert.equal(result.channel,'native');
  assert.deepEqual(calls.map(call=>call[0]),['rmdir','mkdir','writeFile','share']);
  assert.equal(calls[0][1].path,'ice-share'); assert.equal(calls[0][1].directory,'CACHE');
  assert.equal(calls[2][1].path,'ice-share/ice-feed-46.png');
  assert.equal(calls[2][1].data,Buffer.from('PNG fixture').toString('base64'));
  assert.equal(calls[3][1].files[0],'file:///cache/ice-share/ice-feed-46.png');
  assert.match(calls[3][1].text,/@ice_app.de/);
});
test('native cache cannot escape share directory through filename',async()=>{
  const {api,calls}=await loadShare({native:true});
  await api.shareCheckinStory({blob:new Blob(['png']),filename:'../../outside/secret.png',shopName:'Eiscafé'});
  assert.equal(calls[2][1].path,'ice-share/.._.._outside_secret.png');
});
test('native dialog dismissal is normalized to AbortError',async()=>{
  const {api}=await loadShare({native:true,failShare:new Error('Share canceled')});
  await assert.rejects(api.shareCheckinStory({blob:new Blob(['png'])}),{name:'AbortError'});
});
test('native sharing failures remain visible',async()=>{
  const {api}=await loadShare({native:true,failShare:new Error('Filesystem unavailable')});
  await assert.rejects(api.shareCheckinStory({blob:new Blob(['png'])}),/Filesystem unavailable/);
});
test('web shares the image with native Web Share and preserves user cancellation',async()=>{
  const {api,context,calls}=await loadShare();
  context.navigator.canShare=()=>true;
  context.navigator.share=async data=>calls.push(['webShare',data]);
  const result=await api.shareCheckinStory({blob:new Blob(['png']),filename:'ice-feed.png',shopName:'Eiscafé'});
  assert.equal(result.channel,'web');
  assert.equal(calls[0][1].files[0].name,'ice-feed.png');
  assert.equal(calls[0][1].files[0].type,'image/png');
  context.navigator.share=async()=>{throw new DOMException('Canceled','AbortError');};
  await assert.rejects(api.shareCheckinStory({blob:new Blob(['png'])}),{name:'AbortError'});
});
test('unsupported file sharing returns download fallback and makes no native calls',async()=>{
  const {api,context,calls}=await loadShare();
  context.navigator.share=async()=>{throw new Error('Should not share unsupported files');};
  context.navigator.canShare=()=>false;
  assert.equal((await api.shareCheckinStory({blob:new Blob(['png'])})).channel,'download');
  assert.equal(calls.length,0);
  delete context.navigator.share;
  assert.equal((await api.shareCheckinStory({blob:new Blob(['png'])})).shared,false);
});
test('caption includes shop name, Instagram account and profile link',async()=>{
  const {api}=await loadShare();
  assert.equal(api.buildCheckinShareText('Eiscafé'),`Mein Eis-Check-in bei Eiscafé – entdeckt mit @ice_app.de\n${api.INSTAGRAM_PROFILE_URL}`);
});
test('capability check offers direct saving when file sharing is unavailable or throws',async()=>{
  const {api,context}=await loadShare();
  assert.equal(api.canShareCheckinImage(),false);
  context.navigator.share=async()=>{};
  context.navigator.canShare=()=>{throw new Error('Unsupported files');};
  assert.equal(api.canShareCheckinImage({blob:new Blob(['png'])}),false);
  context.navigator.canShare=()=>true;
  assert.equal(api.canShareCheckinImage({blob:new Blob(['png'])}),true);
});
test('private check-in caption does not describe a fictional shop',async()=>{
  const {api}=await loadShare();
  assert.match(api.buildCheckinShareText('Mein Eis-Moment'),/^Mein Eis-Moment –/);
});
