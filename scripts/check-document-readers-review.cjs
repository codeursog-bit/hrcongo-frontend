const fs=require('fs'),path=require('path'),crypto=require('crypto'),ts=require('typescript'),assert=require('node:assert/strict');
process.chdir(path.resolve(__dirname,'..'));const {extract}=require('./check-presences-review.cjs');
const target='docs/refonte/controle-lecteurs-documents/mesures.json',hash=x=>crypto.createHash('sha256').update(JSON.stringify(x)).digest('hex');
function inspect(file,text){const result=extract(file,text),ast=ts.createSourceFile(file,text,99,true,4),documents=[],callbacks=[];
 function visit(n){if(ts.isJsxAttribute(n)&&/^(onClick|onChange|onSubmit|onConfirm|onSave)$/.test(n.name.getText(ast)))callbacks.push(n.getText(ast));if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)){const tag=(n.openingElement||n).tagName.getText(ast);if(/Printable|BulletinDisplay|Renderer|AbsenceRequestDocument|OrcaLeaveAbsenceDocument|^style$/.test(tag)){documents.push(n.getText(ast));return;}}ts.forEachChild(n,visit);}visit(ast);
 result.officialDocuments=documents.map(s=>s.replaceAll('\r\n','\n')).sort();result.callbacks=callbacks.map(s=>s.replaceAll('\r\n','\n')).sort();return result;}
if(process.argv.includes('--record')){
 const baseline=JSON.parse(fs.readFileSync('scripts/.document-readers-before.json','utf8')),files={};
 for(const[file,before]of Object.entries(baseline)){if(file.endsWith('DocumentPreviewModal.tsx'))continue;const old=inspect(file,before),now=inspect(file,fs.readFileSync(file,'utf8'));files[file]={};for(const key of Object.keys(old)){assert.equal(hash(now[key]),hash(old[key]),file+': '+key);files[file][key]=hash(old[key]);}}
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify({date:'2026-11-18',files},null,2)+'\n');
}else{const {files}=JSON.parse(fs.readFileSync(target,'utf8'));for(const[file,checks]of Object.entries(files)){const data=inspect(file,fs.readFileSync(file,'utf8'));for(const[key,value]of Object.entries(checks))assert.equal(hash(data[key]),value,file+': '+key);}}
console.log('Lecteurs : API/effets/états/calculs/conditions/contraintes/callbacks et documents conservés sur dix sources ; modale partagée contrôlée séparément.');
