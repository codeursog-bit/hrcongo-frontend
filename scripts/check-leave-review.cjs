const fs=require('fs'),path=require('path'),ts=require('typescript'),crypto=require('crypto'),assert=require('node:assert/strict');
process.chdir(path.resolve(__dirname,'..'));const {extract}=require('./check-presences-review.cjs');
const target='docs/refonte/controle-conges/mesures.json',printer=ts.createPrinter({removeComments:true});
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
function inspect(f,source){const s=ts.createSourceFile(f,source,99,true,4),data=extract(f,source),vars=[],docs=[],hooks=[],actions=[];delete data.variables;
 function jsx(n){let found=false;function walk(x){if(ts.isJsxElement(x)||ts.isJsxSelfClosingElement(x)||ts.isJsxFragment(x))found=true;else ts.forEachChild(x,walk);}walk(n);return found;}
 function visit(n){
  if(ts.isCallExpression(n)&&/^(useApprovalDecision|useDocSignatures|useBasePath|useParams|useRouter)$/.test(n.expression.getText(s)))hooks.push(printer.printNode(ts.EmitHint.Unspecified,n,s));
  if(ts.isJsxAttribute(n)&&/^(onClick|onChange|onSubmit|onConfirm|onSave|onDecision|onOpinion)$/.test(n.name.getText(s)))actions.push(printer.printNode(ts.EmitHint.Unspecified,n.initializer,s));
  if(ts.isVariableDeclaration(n)&&n.initializer&&!jsx(n.initializer)&&!/^ui[A-Z]|^(YEAR_PALETTE|PHASE_COLORS|yearColor)$/.test(n.name.getText(s))){
   const transformer=ctx=>root=>ts.visitNode(root,function v(x){if(ts.isStringLiteral(x)&&/(?:bg|text|border|ring|font|shadow|from|to|via)-|^#[\da-f]{3,8}$|^var\(--|^color-mix\(/i.test(x.text))return ts.factory.createStringLiteral('<presentation>');return ts.visitEachChild(x,v,ctx);});
   const transformed=ts.transform(n,[transformer]);vars.push(printer.printNode(ts.EmitHint.Unspecified,transformed.transformed[0],s));transformed.dispose();
  }
  if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)){const opening=n.openingElement||n;if(/Printable|Document$|PrintAuthorizationModal|DocumentPreviewModal|^style$/.test(opening.tagName.getText(s))||/loan-document-protected/.test(opening.attributes.getText(s))){docs.push(n.getText(s).replaceAll('\r\n','\n'));return;}}
  ts.forEachChild(n,visit);
 }visit(s);return {...data,businessVariables:vars.sort(),protectedDocuments:docs.sort(),dataHooks:hooks.sort(),actionCallbacks:actions.sort()};
}
if(require.main===module&&process.argv.includes('--record')){
 const baseline=JSON.parse(fs.readFileSync('scripts/.leave-review-before.json','utf8')),files={};
 for(const[f,b]of Object.entries(baseline)){
  const before=inspect(f,b),after=inspect(f,fs.readFileSync(f,'utf8')),checks={};
  for(const k of Object.keys(before)){checks[k]={before:digest(before[k]),after:digest(after[k])};if(checks[k].before!==checks[k].after){console.log(f,k);fs.writeFileSync('scripts/.leave-difference.json',JSON.stringify({file:f,key:k,before:before[k],after:after[k]},null,2));process.exitCode=1;}}
  files[f]=checks;
 }fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify({date:'2026-11-18',files},null,2)+'\n');
}else{
 for(const[f,checks]of Object.entries(JSON.parse(fs.readFileSync(target,'utf8')).files)){const now=inspect(f,fs.readFileSync(f,'utf8'));for(const[k,value]of Object.entries(checks))assert.equal(digest(now[k]),value.before,f+': '+k);}
 console.log('Congés : 13 routes et composants délégués, API/hooks, états, calculs, droits, contraintes, callbacks et documents conservés.');
}
