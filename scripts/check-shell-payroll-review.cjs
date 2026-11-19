const fs=require('fs'),ts=require('typescript'),path=require('path'),crypto=require('crypto'),assert=require('node:assert/strict');
process.chdir(path.resolve(__dirname,'..'));
const {extract}=require('./check-presences-review.cjs');
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
const target='docs/refonte/controle-coquille-paie/mesures.json';
function reviewSource(f){
 let source=fs.readFileSync(f,'utf8');
 // Phase A guide: include its controls in the existing mobile keyboard loop.
 // Normalize only this exact UI addition; all other effects/business hashes stay frozen.
 if(f==='components/layout/Sidebar.tsx')source=source.replace(
 `const focusable = () => [...Array.from(asideRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),select,input,[tabindex="0"]') || []),...Array.from(document.querySelectorAll<HTMLElement>('[data-guide-ui="overlay"] button:not([disabled]),[data-guide-ui="overlay"] a[href]'))].filter(el => el.offsetParent !== null);`,
 `const focusable = () => Array.from(asideRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),select,input,[tabindex="0"]') || []).filter(el => el.offsetParent !== null);`);
 return source;
}
function documents(file,source){const s=ts.createSourceFile(file,source,99,true,4),list=[];function v(n){
 if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)){const o=n.openingElement||n;if(/BulletinDisplay|Printable|^style$/.test(o.tagName.getText(s))||/loan-document-protected/.test(o.attributes.getText(s))){list.push(n.getText(s).replaceAll('\r\n','\n'));return;}}
 ts.forEachChild(n,v);
}v(s);return list;}
function measure(f,s){
 // Approved display label: the card now shows the full server deduction total.
 if(f==='app/(dashboard)/paie/components/PayrollStatsCards.tsx')s=s.replace("{ label: 'Retenues salariales',","{ label: 'Charges Salariales',");
 const values=extract(f,s);delete values.variables; // screen-only CSS metadata is handled below
 const ast=ts.createSourceFile(f,s,99,true,4),vars=[];
 function jsx(n){let result=false;function v(x){if(ts.isJsxElement(x)||ts.isJsxSelfClosingElement(x))result=true;else ts.forEachChild(x,v);}v(n);return result;}
 const printer=ts.createPrinter({removeComments:true});
 function v(n){if(ts.isVariableDeclaration(n)&&n.initializer&&!jsx(n.initializer)&&!/STATUS_INFO|CONFIRM_CONFIG|^uiMenuAnchor$/.test(n.name.getText(ast))){
  const text=printer.printNode(ts.EmitHint.Unspecified,n,ast);
  // Keep business expressions verbatim; drop only string leaves that contain CSS classes.
  const transformer=context=>root=>ts.visitNode(root,function visitor(x){if(ts.isStringLiteral(x)&&/(?:bg|text|border|ring|font|shadow|from|to|via)-/.test(x.text))return ts.factory.createStringLiteral('<presentation>');return ts.visitEachChild(x,visitor,context);});
  const result=ts.transform(n,[transformer]);vars.push(printer.printNode(ts.EmitHint.Unspecified,result.transformed[0],ast));result.dispose();
 }ts.forEachChild(n,v);}v(ast);values.businessVariables=vars.sort();values.protectedDocuments=documents(f,s);return values;
}
if(process.argv.includes('--record')){
 const baseline=JSON.parse(fs.readFileSync('scripts/.shell-payroll-before.json','utf8')),records={};
 for(const[f,s]of Object.entries(baseline)){
  const isShell=f.startsWith('components/');
  const shell=(f,s)=>{const {api,effects,states,conditions}=extract(f,s);return {api,effects,states,conditions};};
  const before=isShell?shell(f,s):measure(f,s),after=isShell?shell(f,fs.readFileSync(f,'utf8')):measure(f,fs.readFileSync(f,'utf8'));
  const checks={};for(const key of Object.keys(before)){checks[key]={before:digest(before[key]),after:digest(after[key])};if(checks[key].before!==checks[key].after){console.log(f,key);fs.writeFileSync('scripts/.payroll-difference.json',JSON.stringify({file:f,key,before:before[key],after:after[key]},null,2));process.exitCode=1;}}
  records[f]=checks;
 }
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify({date:'2026-11-18',files:records},null,2)+'\n');
}else{
 const records=JSON.parse(fs.readFileSync(target,'utf8'));
 for(const[f,checks]of Object.entries(records.files)){const now=f.startsWith('components/')?extract(f,reviewSource(f)):measure(f,reviewSource(f));for(const[key,v]of Object.entries(checks))assert.equal(digest(now[key]),v.before,f+': '+key);}
 console.log('Paie : API, effets, états, conditions, contraintes, données/calculs et sous-arbres imprimables conservés.');
}
