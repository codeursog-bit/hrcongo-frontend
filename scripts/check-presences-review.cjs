const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict'),ts=require('typescript');
const root=path.resolve(__dirname,'..');process.chdir(root);
const printer=ts.createPrinter({removeComments:true});
const hash=v=>crypto.createHash('sha256').update(JSON.stringify(v)).digest('hex');
function appearance(v){return v.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu,'').replace(/var\(--[\w-]+(?:,[^)]*)?\)|color-mix\([^;]*?\)|#[\da-f]{3,8}/ig,'<appearance>').replace(/(?<![\w])(?:[\w-]+:)*(?:bg|text|border|divide|ring|from|via|to|shadow|font|tracking|rounded|animate|blur|backdrop|transition)-[^\s'"`]+/g,'<style>').replace(/(?:<style>\s*)+/g,'<style>').replace(/\s+(?:uppercase|capitalize)\b/g,'').replace(/\s+/g,' ');}
function extract(file,source){const s=ts.createSourceFile(file,source,99,true,4),out={api:[],effects:[],states:[],variables:[],conditions:[],constraints:[],documents:[],savedShiftColors:[]};
function norm(n){return appearance(printer.printNode(ts.EmitHint.Unspecified,n,s));}
function jsx(n){let yes=false;function walk(x){if(ts.isJsxElement(x)||ts.isJsxSelfClosingElement(x)||ts.isJsxFragment(x))yes=true;else ts.forEachChild(x,walk);}walk(n);return yes;}
function walk(n){
 if(ts.isCallExpression(n)){
  const name=n.expression.getText(s);
  if(/^(api\.|attendanceApi\.|adminScreensApi\.|employeeQrApi\.|breakApi\.|fetch\b|fetchKiosk\b)/.test(name))out.api.push(printer.printNode(ts.EmitHint.Unspecified,n,s));
  if(name==='useEffect')out.effects.push(appearance(printer.printNode(ts.EmitHint.Unspecified,n,s)));
  if(name==='useState')out.states.push(printer.printNode(ts.EmitHint.Unspecified,n,s));
 }
 if(ts.isIfStatement(n))out.conditions.push(printer.printNode(ts.EmitHint.Unspecified,n.expression,s));
 if(ts.isVariableDeclaration(n)&&n.initializer&&!jsx(n.initializer)&&!/^ui[A-Z]/.test(n.name.getText(s))&&!/PALETTE|^C$|COLOR_MAP/.test(n.name.getText(s)))out.variables.push(norm(n));
 if(ts.isVariableDeclaration(n)&&/^(SHIFT_COLORS|PRESETS)$/.test(n.name.getText(s)))out.savedShiftColors.push(printer.printNode(ts.EmitHint.Unspecified,n,s));
 if(ts.isJsxAttribute(n)&&/^(required|min|max|minLength|maxLength|pattern|name|disabled|readOnly|type)$/.test(n.name.getText(s)))out.constraints.push(printer.printNode(ts.EmitHint.Unspecified,n,s));
 if((ts.isJsxSelfClosingElement(n)||ts.isJsxElement(n))&&/Printable|DocumentPreviewModal|PrintAuthorizationModal|AbsenceRequestDocument|OrcaLeaveAbsenceDocument|AttendanceExportDialog/.test((n.openingElement||n).tagName.getText(s))){out.documents.push(n.getText(s).replaceAll('\r\n','\n'));return;}
 ts.forEachChild(n,walk);
}walk(s);for(const key of Object.keys(out))out[key].sort();return out;}
const target='docs/refonte/controle-presences/mesures.json';
if(require.main === module && process.argv.includes('--record')){
 const baseline=JSON.parse(fs.readFileSync('scripts/.presence-before.json','utf8')),records={};
 for(const[file,source]of Object.entries(baseline)){
  const before=extract(file,source),after=extract(file,fs.readFileSync(file,'utf8'));const checks={};
  for(const key of Object.keys(before)){checks[key]={before:hash(before[key]),after:hash(after[key])};if(checks[key].before!==checks[key].after){console.log(file,key);fs.writeFileSync('scripts/.presence-difference.json',JSON.stringify({file,key,before:before[key],after:after[key]},null,2));process.exitCode=1;break;}}
  records[file]=checks;
 }
 fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,JSON.stringify({date:'2026-11-18',files:records},null,2)+'\n');
}else{
 const baseline=JSON.parse(fs.readFileSync(target,'utf8'));
 for(const[file,checks]of Object.entries(baseline.files)){const current=extract(file,fs.readFileSync(file,'utf8'));for(const[key,value]of Object.entries(checks))assert.equal(hash(current[key]),value.before,file+': '+key);}
 console.log('Présences : API, effets, états, données, conditions, contraintes et documents conservés sur '+Object.keys(baseline.files).length+' fichiers.');
}
module.exports={extract};
