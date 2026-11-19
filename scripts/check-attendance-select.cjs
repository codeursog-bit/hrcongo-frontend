const fs=require('node:fs'),ts=require('typescript'),React=require('react'),assert=require('node:assert/strict');
const moduleUnderTest={exports:{}};
const code=ts.transpileModule(fs.readFileSync('components/ui/ModuleSelect.tsx','utf8'),{compilerOptions:{module:1,jsx:4,target:9,esModuleInterop:true}}).outputText;
const FancySelect=()=>null;
new Function('require','module','exports',code)(name=>name==='@/components/ui/FancySelect'?{FancySelect}:require(name),moduleUnderTest,moduleUnderTest.exports);
const Select=moduleUnderTest.exports.ModuleSelect;
const children=[React.createElement('option',{key:'all',value:''},'Toute l’année'),React.createElement(React.Fragment,{key:'months'},[1,2].map(value=>React.createElement('option',{key:value,value},'Mois ',value)))];
let received;
const filter=Select({children,value:2,'aria-label':'Période',onChange:e=>{received=Number(e.target.value);}});
assert.equal(filter.type,'fieldset');
assert.equal(filter.props.children.type,FancySelect);
assert.equal(filter.props.children.props.value,'2');
assert.deepEqual(filter.props.children.props.options,[{value:'',label:'Toute l’année'},{value:'1',label:'Mois 1'},{value:'2',label:'Mois 2'}]);
filter.props.children.props.onChange('1');assert.equal(received,1);
assert.equal(Select({children,value:1,disabled:true}).props.disabled,true);
const disabled=Select({children,value:1,disabled:true,onChange(){throw Error('Disabled selector must not change');}});disabled.props.children.props.onChange('2');
for(const extra of [{name:'month'},{required:true},{id:'month'},{multiple:true},{onBlur(){}},{onFocus(){}},{onKeyDown(){}},{onClick(){}}]){
 const native=Select({children,value:1,...extra});assert.equal(native.type,'select');for(const key of Object.keys(extra))assert.equal(native.props[key],extra[key]);
}
const native=Select({children:React.createElement('option',{value:'',disabled:true},'Choisir'),value:''});assert.equal(native.type,'select');
console.log('Sélecteurs Présences : valeurs numériques/vides, libellés, fragments, désactivation et contraintes natives préservés.');
