/**
 * Ultra-minimal validation implementation
 */
type V=any;type D=any;type E=any;type O=any;type F=(v:V,d?:D)=>any;type S=any;type R={valid:boolean;errors?:E;data?:V};

// Core validator
const c=(t:string,f:F,o?:O,s?:S)=>({t,o,s,v:f});

// Messages
const r='Required',l='Min ',x='Max ',p='Invalid',t=' chars',i=' items';

// String
export const s=(o:O={})=>c('s',async(v,d)=>{
if(v==null||v==='')return o.required?o.message||r:1;
if(typeof v!=='string')return o.message||p;
if(o.min&&v.length<o.min)return o.message||l+o.min+t;
if(o.max&&v.length>o.max)return o.message||x+o.max+t;
if(o.pattern&&!o.pattern.test(v))return o.message||p;
if(o.enum&&!o.enum.includes(v))return o.message||p;
if(o.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))return o.message||p;
if(o.custom){const r=await o.custom(v,d);if(r!==1)return r;}
return 1;},o);

// Number  
export const n=(o:O={})=>c('n',async(v,d)=>{
if(v==null)return o.required?o.message||r:1;
if(typeof v!=='number'||isNaN(v))return o.message||p;
if(o.min!==undefined&&v<o.min)return o.message||l+o.min;
if(o.max!==undefined&&v>o.max)return o.message||x+o.max;
if(o.integer&&!Number.isInteger(v))return o.message||p;
if(o.custom){const r=await o.custom(v,d);if(r!==1)return r;}
return 1;},o);

// Boolean
export const b=(o:O={})=>c('b',async(v,d)=>{
if(v==null)return o.required?o.message||r:1;
if(typeof v!=='boolean')return o.message||p;
if(o.custom){const r=await o.custom(v,d);if(r!==1)return r;}
return 1;},o);

// Array
export const a=(s?:any,o:O={})=>c('a',async(v,d)=>{
if(v==null)return o.required?o.message||r:1;
if(!Array.isArray(v))return o.message||p;
if(o.min!==undefined&&v.length<o.min)return o.message||l+o.min+i;
if(o.max!==undefined&&v.length>o.max)return o.message||x+o.max+i;
if(s)for(let i=0;i<v.length;i++){const r=await s.v(v[i],d);if(r!==1)return`[${i}]:${r}`;}
if(o.custom){const r=await o.custom(v,d);if(r!==1)return r;}
return 1;},o,s);

// Object
export const o=(s?:S,o:O={})=>c('o',async(v,d)=>{
if(v==null)return o.required?o.message||r:1;
if(typeof v!=='object'||Array.isArray(v))return o.message||p;
if(s){
const e:E={};
for(const k in s){const r=await s[k].v(v[k],v);if(r!==1)e[k]=r;}
if(Object.keys(e).length)return Object.entries(e).map(([k,v])=>`${k}:${v}`).join(', ');}
if(o.custom){const r=await o.custom(v,d);if(r!==1)return r;}
return 1;},o,s);

// Validate
export const v=async(s:S,d:D):Promise<R>=>{
if(s.v){const r=await s.v(d);return r===1?{valid:!0,data:d}:{valid:!1,errors:{'':r}};}
const e:E={},v:D={};
for(const k in s){const r=await s[k].v(d[k],d);r!==1?e[k]=r:v[k]=d[k];}
return Object.keys(e).length?{valid:!1,errors:e}:{valid:!0,data:v};};

// Aliases
export const str=s,num=n,bool=b,arr=a,obj=o,schema=(s:S)=>s,validate=v;