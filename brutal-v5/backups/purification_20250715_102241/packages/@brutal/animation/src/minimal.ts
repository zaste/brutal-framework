/**
 * Ultra-minimal animation implementation
 */

// Types
type P=Record<string,number>;type O={duration?:number;delay?:number;easing?:string|((t:number)=>number);onComplete?:()=>void;onUpdate?:(p:number)=>void};
type A={e:HTMLElement;p:P;o:O;t?:number;s?:P;r:boolean;i:number};

// Animation ID counter
let id=0;

// Active animations
const as:Map<number,A>=new Map();

// RAF ID
let raf:number;

// Easing functions
const e={
  linear:(t:number)=>t,
  easeIn:(t:number)=>t*t,
  easeOut:(t:number)=>t*(2-t),
  easeInOut:(t:number)=>t<0.5?2*t*t:-1+(4-2*t)*t
};

// Get computed style value
const g=(e:HTMLElement,p:string):number=>{
  const s=getComputedStyle(e);
  if(p==='opacity')return parseFloat(s.opacity)||1;
  if(p==='x'||p==='y'||p==='scale'||p==='rotate'){
    const m=s.transform;
    if(m==='none')return p==='scale'?1:0;
    // Simple matrix parsing for basic transforms
    const v=m.match(/matrix\(([^)]+)\)/);
    if(v&&v[1]){
      const vals=v[1].split(',').map(Number);
      if(vals.length>=6){
        const[a,b,_c,_d,tx,ty]=vals;
        if(p==='x')return tx||0;
        if(p==='y')return ty||0;
        if(p==='scale'&&a!==undefined&&b!==undefined)return Math.sqrt(a*a+b*b);
        if(p==='rotate'&&a!==undefined&&b!==undefined)return Math.atan2(b,a)*(180/Math.PI);
      }
    }
  }
  return 0;
};

// Apply transform
const t=(e:HTMLElement,p:P)=>{
  const {x=g(e,'x'),y=g(e,'y'),scale=g(e,'scale'),rotate=g(e,'rotate'),opacity}=p;
  const transforms:string[]=[];
  if('x'in p||'y'in p)transforms.push(`translate(${x}px,${y}px)`);
  if('scale'in p)transforms.push(`scale(${scale})`);
  if('rotate'in p)transforms.push(`rotate(${rotate}deg)`);
  if(transforms.length){
    e.style.transform=transforms.join(' ');
    e.style.willChange='transform';
  }
  if('opacity'in p){
    e.style.opacity=String(opacity);
    if(!transforms.length)e.style.willChange='opacity';
  }
};

// Interpolate value
const i=(s:number,e:number|undefined,p:number)=>s+((e||0)-s)*p;

// Animation loop
const l=()=>{
  const n=performance.now();
  const d:number[]=[];
  
  as.forEach((a,id)=>{
    if(!a.r)return;
    
    // Initialize
    if(!a.t){
      a.t=n+(a.o.delay||0);
      a.s={};
      for(const k in a.p){
        a.s[k]=g(a.e,k);
      }
      return;
    }
    
    // Wait for delay
    if(n<a.t)return;
    
    // Calculate progress
    const p=Math.min((n-a.t)/(a.o.duration||300),1);
    
    // Apply easing
    const ef=typeof a.o.easing==='function'?a.o.easing:(e as any)[a.o.easing||'easeOut'];
    const ep=ef(p);
    
    // Interpolate and apply
    const c:P={};
    for(const k in a.p){
      const start=a.s?a.s[k]:0;
      c[k]=i(start||0,a.p[k],ep);
    }
    t(a.e,c);
    
    // Callback
    if(a.o.onUpdate)a.o.onUpdate(p);
    
    // Complete
    if(p>=1){
      a.r=false;
      d.push(id);
      a.e.style.willChange='auto';
      if(a.o.onComplete)a.o.onComplete();
    }
  });
  
  // Cleanup
  d.forEach(id=>as.delete(id));
  
  // Continue or stop
  if(as.size>0){
    raf=requestAnimationFrame(l);
  }else{
    raf=0;
  }
};

// Start animation loop if needed
const s=()=>{
  if(!raf&&as.size>0){
    raf=requestAnimationFrame(l);
  }
};

// Main animate function
export const a=(element:HTMLElement,properties:P,options:O={})=>{
  const anim:A={
    e:element,
    p:properties,
    o:options,
    r:true,
    i:++id
  };
  
  as.set(anim.i,anim);
  s();
  
  return{
    stop:()=>{
      const a=as.get(anim.i);
      if(a){
        a.r=false;
        as.delete(anim.i);
      }
    },
    promise:new Promise<void>(resolve=>{
      const oc=anim.o.onComplete;
      anim.o.onComplete=()=>{
        if(oc)oc();
        resolve();
      };
    })
  };
};

// Timeline function
export const tl=(seq:Array<[HTMLElement,P,O?]>)=>{
  let p=Promise.resolve();
  const controls:{stop:()=>void}[]=[];
  
  seq.forEach(([el,props,opts])=>{
    p=p.then(()=>new Promise<void>(resolve=>{
      const ctrl=a(el,props,{
        ...opts,
        onComplete:()=>{
          if(opts?.onComplete)opts.onComplete();
          resolve();
        }
      });
      controls.push(ctrl);
    }));
  });
  
  return{
    stop:()=>controls.forEach(c=>c.stop()),
    promise:p
  };
};

// Exports with readable names
export const animate=a;
export const timeline=tl;