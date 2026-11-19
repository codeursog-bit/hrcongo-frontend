const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const target={exports:{}};
const js=ts.transpileModule(fs.readFileSync('components/requests/module-nav-layout.ts','utf8'),{compilerOptions:{module:1,target:9}}).outputText;
new Function('exports',js)(target.exports);
const {moduleNavVisibleCount:count,moduleNavMenuPosition:place}=target.exports;
const items=[{href:'/a',group:'pilot'},{href:'/b',group:'pilot'},{href:'/c',group:'analysis',active:true}];
assert.equal(count(items,[100,100,180],405,80),3,'all tabs fit with both separator gaps');
assert.equal(count(items,[100,100,180],390,80),2,'overflow includes the wider active tab');
assert.equal(count(items,[100,100,180],260,80),0,'no forced active tab can push Plus out');
assert.equal(count(items,[100,100,180],280,80),1,'only the active tab and Plus fit');
assert.equal(count([],[],100,80),0);
const rect=(left,right,top,bottom)=>({left,right,top,bottom});
const desktop=place(rect(1230,1320,120,160),rect(300,1360,100,160),{width:1440,height:900},380);
assert.equal(desktop.left,1056,'menu aligns its right edge with the trigger');
assert.equal(desktop.top,168);assert.equal(desktop.maxHeight,380);
const upward=place(rect(280,360,650,690),rect(20,380,650,690),{width:400,height:720},420);
assert.equal(upward.bottom,78,'opens upward near the bottom');assert.equal(upward.maxHeight,420);
for(const width of [280,320,375,768,1024,1440,1920])for(const height of [240,480,720,1080])for(const columnWidth of [140,220,400,width]){
 const right=width-16,left=Math.max(0,right-columnWidth);
 for(const top of [30,height/2,height-50]){
  const pos=place(rect(right-90,right,top,top+40),rect(left,right,top,top+40),{width,height});
  assert.ok(pos.left>=Math.max(12,left));assert.ok(pos.left+pos.width<=right+.001);
  const y=pos.top??height-pos.bottom-pos.maxHeight;
  assert.ok(y>=12);assert.ok(y+pos.maxHeight<=height-12+.001);
 }
}
// Verify the rendered tab widths and actual flex separators for varying active positions.
for(let active=0;active<5;active++)for(let available=120;available<950;available+=17){
 const links=Array.from({length:5},(_,i)=>({href:'/route-'+i,group:i<2?'pilot':'action',active:i===active})),widths=[110,130,220,95,150];
 const n=count(links,widths,available,80),visible=links.slice(0,n);
 if(n&&active>=n)visible[n-1]=links[active];
 let occupied=n<5?80:0;
 visible.forEach((item,index)=>{occupied+=widths[links.indexOf(item)];if(index)occupied+=item.group===visible[index-1].group?4:21;});
 if(n&&n<5)occupied+=4;
 assert.ok(occupied<=available,'actual visible tabs stay inside their column');
 assert.equal(new Set(visible.map(i=>i.href)).size,visible.length);
}
console.log('Menu Plus : bords de colonne/écran, hauteur, ouverture vers le haut et onglet actif long vérifiés (mobile à bureau).');
