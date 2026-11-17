const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),ts=require('typescript'),postcss=require('postcss');
const root=path.resolve(__dirname,'..'),css=postcss.parse(fs.readFileSync(path.join(root,'components/employees/employee-profile.css'),'utf8'));
const source=fs.readFileSync(path.join(root,'app/(dashboard)/employes/[id]/page.tsx'),'utf8');
assert.ok(!/\b(?:bg|text|border|ring|shadow)-(?:emerald|amber|red|gray|sky|slate|yellow)-\d/.test(source));
assert.ok(!/ui-avatars\.com|text-\$\{|bg-\$\{/.test(source));
for(const name of new Set(source.match(/(?<![\w-])profile-[\w-]+/g)))assert.ok(css.toString().includes('.'+name),name+' missing CSS');
css.walkDecls(d=>assert.ok(!/#[\da-f]{3,8}\b|rgba?\(\s*\d/i.test(d.value),'hardcoded CSS color '+d.toString()));
for(const n of css.nodes)if(n.type!=='comment')assert.ok(n.type==='atrule'&&n.name==='media'&&n.params==='screen','styles must remain screen-only');
const app=postcss.parse(fs.readFileSync(path.join(root,'app/globals.css'),'utf8'));
function vars(selector){const result={};app.walkRules(r=>{if(r.selector===selector)r.walkDecls(d=>result[d.prop]=d.value);});return result;}
function split(s){let depth=0,start=0,out=[];for(let i=0;i<s.length;i++){if(s[i]==='(')depth++;if(s[i]===')')depth--;if(s[i]===','&&!depth){out.push(s.slice(start,i).trim());start=i+1;}}out.push(s.slice(start).trim());return out;}
function resolve(s,tokens){
 s=s.trim();if(s.startsWith('var(')){const [key,fallback]=split(s.slice(4,-1));assert.ok(tokens[key]||fallback,'missing '+key);return resolve(tokens[key]||fallback,tokens);}
 if(s.startsWith('#')){const raw=s.slice(1);return [0,2,4].map(i=>parseInt(raw.slice(i,i+2),16)).concat(1);}
 if(s==='black')return [0,0,0,1];if(s==='white')return [255,255,255,1];if(s==='transparent')return [0,0,0,0];
 if(s.startsWith('color-mix(')){const [,a,b]=split(s.slice(10,-1)),match=a.match(/^(.*)\s+(\d+(?:\.\d+)?)%$/);assert.ok(match,s);const weight=+match[2]/100,x=resolve(match[1],tokens),y=resolve(b,tokens),alpha=x[3]*weight+y[3]*(1-weight);return [0,1,2].map(i=>alpha?(x[i]*x[3]*weight+y[i]*y[3]*(1-weight))/alpha:0).concat(alpha);}
 throw Error('Unknown color '+s);
}
function hex(r){return '#'+r.slice(0,3).map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');}
const appearanceFile=path.join(root,'lib/appearance.ts'),exportsObject={};new Function('exports',ts.transpileModule(fs.readFileSync(appearanceFile,'utf8'),{compilerOptions:{module:1,target:9}}).outputText)(exportsObject);
const {appearanceTokens,ACCENT_PALETTES,LIGHT_AMBIANCES,DARK_AMBIANCES,contrast}=exportsObject;
const cases=[];for(const dark of [false,true]){
 const base={...vars(':root'),...(dark?vars('.dark'):{})};cases.push({dark,tokens:base,label:'default'});
 for(const [,accent]of ACCENT_PALETTES)for(const light of Object.keys(LIGHT_AMBIANCES))for(const night of Object.keys(DARK_AMBIANCES))cases.push({dark,tokens:{...base,...appearanceTokens({accent,ambianceLight:light,ambianceDark:night},dark)},label:accent+'/'+light+'/'+night});
}
let minimum=Infinity;
for(const {dark,tokens,label}of cases){
 css.walkRules(r=>{if(r.selector==='.employee-profile-page'||(dark&&r.selector==='.dark .employee-profile-page'))r.walkDecls(d=>tokens[d.prop]=d.value);});
 const pairs=[['var(--text-secondary)','var(--surface-2)'],['var(--profile-active-text)','var(--profile-brand-soft)'],['var(--success-text)','color-mix(in srgb,var(--green) 10%,var(--surface))'],['var(--warning-text)','color-mix(in srgb,var(--mustard) 12%,var(--surface))'],['var(--danger-text)','color-mix(in srgb,var(--danger) 15%,var(--surface))'],['var(--on-brand-surface,var(--profile-on-status))','var(--brand)']];
 for(const [fg,bg]of pairs){const ratio=contrast(hex(resolve(fg,tokens)),hex(resolve(bg,tokens)));minimum=Math.min(minimum,ratio);assert.ok(ratio>=4.5,`${label} ${dark?'dark':'light'}: ${fg} on ${bg}: ${ratio}`);}
}
console.log(`Profile: token-only screen styles, ${cases.length} theme combinations; minimum text contrast ${minimum.toFixed(2)}:1.`);
