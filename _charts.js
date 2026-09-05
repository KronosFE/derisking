// Kronos dashboard kit — self-contained SVG/CSS charts (no external deps). Dark theme, animated, tooltips.
// Uses esc() from _erp.js. All builders return HTML strings.
var CH = (function(){
  var PAL=['#e8c476','#5ea0c0','#8fd0b0','#c9a3e0','#e39b7b','#7fb3d5','#d5c15e','#9ad0c0','#b0a0e0','#e0909a','#89c7a0','#c7b06a'];
  function E(s){return (typeof esc==='function')?esc(s):(''+s);}
  var C={pal:PAL};
  // build click-through data-attrs for a datum: d.href navigates; opts.target filters that table
  function _fa(d,opts){
    if(d.href)return ' data-href="'+E(d.href)+'"';
    if(opts&&opts.target)return ' data-filter="'+E(d.filter!=null?d.filter:d.label)+'" data-target="'+E(opts.target)+'" data-mode="'+E(opts.mode||'contains')+'" data-label="'+E(d.label)+'"';
    return '';
  }
  function _clk(d,opts){return (d.href||(opts&&opts.target))?' clickable':'';}

  // KPI tile row. items=[{v,label,sub?,cls?,icon?,spark?}]
  C.kpi=function(items){
    return '<div class="kpis">'+items.map(function(k){
      return '<div class="kpi '+(k.cls||'')+'">'+
        (k.icon?'<div class="kpiic">'+k.icon+'</div>':'')+
        '<b>'+E(k.v)+'</b><span>'+E(k.label)+'</span>'+
        (k.sub?'<em>'+E(k.sub)+'</em>':'')+
        (k.spark?C.spark(k.spark,{w:120,h:26}):'')+'</div>';
    }).join('')+'</div>';
  };

  // Donut. data=[{label,value,color?}], opts={size,thickness,center,legend}
  C.donut=function(data,opts){
    opts=opts||{}; var size=opts.size||160, sw=opts.thickness||24, r=(size-sw)/2, cx=size/2, Circ=2*Math.PI*r;
    var total=data.reduce(function(a,d){return a+(+d.value||0);},0)||1, off=0;
    var segs=data.map(function(d,i){
      var len=(+d.value||0)/total*Circ, col=d.color||PAL[i%PAL.length], pct=(+d.value||0)/total*100;
      var s='<circle class="dseg'+_clk(d,opts)+'" r="'+r+'" cx="'+cx+'" cy="'+cx+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'"'+
        ' stroke-dasharray="'+len.toFixed(2)+' '+(Circ-len).toFixed(2)+'" stroke-dashoffset="'+(-off).toFixed(2)+'"'+
        ' transform="rotate(-90 '+cx+' '+cx+')" data-tip="'+E(d.label)+': <b>'+E(d.value)+'</b> · '+pct.toFixed(0)+'%"'+_fa(d,opts)+'>'+
        '<title>'+E(d.label)+': '+E(d.value)+'</title></circle>';
      off+=len; return s;
    }).join('');
    var ctr=opts.center!=null?'<text x="'+cx+'" y="'+(cx-4)+'" text-anchor="middle" class="dctr">'+E(opts.center)+'</text>'+
      (opts.centerSub?'<text x="'+cx+'" y="'+(cx+15)+'" text-anchor="middle" class="dctrsub">'+E(opts.centerSub)+'</text>':''):'';
    var svg='<svg viewBox="0 0 '+size+' '+size+'" class="donut" style="max-width:'+size+'px">'+segs+ctr+'</svg>';
    var leg=opts.legend===false?'':'<ul class="chleg">'+data.map(function(d,i){
      return '<li class="'+_clk(d,opts).replace(' ','')+'"'+_fa(d,opts)+'><span class="sw" style="background:'+(d.color||PAL[i%PAL.length])+'"></span>'+E(d.label)+' <b>'+E(d.value)+'</b></li>';
    }).join('')+'</ul>';
    return '<div class="donutwrap">'+svg+leg+'</div>';
  };

  // Horizontal bars. data=[{label,value,color?}], opts={max,unit,sort}
  C.bars=function(data,opts){
    opts=opts||{}; if(opts.sort) data=data.slice().sort(function(a,b){return (b.value||0)-(a.value||0);});
    var max=opts.max||Math.max.apply(null,data.map(function(d){return +d.value||0;}))||1;
    return '<div class="bars">'+data.map(function(d,i){
      var pct=(+d.value||0)/max*100, col=d.color||PAL[i%PAL.length];
      return '<div class="barrow'+_clk(d,opts)+'" data-tip="'+E(d.label)+': <b>'+E(d.value)+E(opts.unit||'')+'</b>"'+_fa(d,opts)+'><div class="barlab" title="'+E(d.label)+'">'+E(d.label)+'</div>'+
        '<div class="bartrack"><div class="barfill" style="width:'+pct.toFixed(1)+'%;background:'+col+'"></div></div>'+
        '<div class="barval">'+E(d.value)+E(opts.unit||'')+'</div></div>';
    }).join('')+'</div>';
  };

  // Progress ring. opts={label,size,thickness,color,sub}
  C.ring=function(pct,opts){
    opts=opts||{}; pct=Math.max(0,Math.min(100,pct));
    var size=opts.size||118, sw=opts.thickness||12, r=(size-sw)/2, cx=size/2, Circ=2*Math.PI*r, fill=pct/100*Circ;
    var col=opts.color||'#e8c476';
    return '<div class="ringwrap"><svg viewBox="0 0 '+size+' '+size+'" style="max-width:'+size+'px">'+
      '<circle r="'+r+'" cx="'+cx+'" cy="'+cx+'" fill="none" stroke="var(--line)" stroke-width="'+sw+'"/>'+
      '<circle class="ringfg" r="'+r+'" cx="'+cx+'" cy="'+cx+'" fill="none" stroke="'+col+'" stroke-width="'+sw+'" stroke-linecap="round"'+
      ' data-tip="'+E(opts.label||'')+': <b>'+Math.round(pct)+'%</b>'+(opts.sub?' · '+E(opts.sub):'')+'"'+
      ' stroke-dasharray="'+fill.toFixed(2)+' '+(Circ-fill).toFixed(2)+'" transform="rotate(-90 '+cx+' '+cx+')"/>'+
      '<text x="'+cx+'" y="'+cx+'" text-anchor="middle" dominant-baseline="central" class="ringtxt">'+Math.round(pct)+'%</text></svg>'+
      (opts.label?'<div class="ringlab">'+E(opts.label)+(opts.sub?'<span>'+E(opts.sub)+'</span>':'')+'</div>':'')+'</div>';
  };

  // Semicircle gauge. gauge(val,max,{label,color,display,bands})
  C.gauge=function(val,max,opts){
    opts=opts||{}; var pct=Math.max(0,Math.min(1,val/(max||1))), W=190,H=112,r=80,cx=95,cy=95;
    function pt(a){return [(cx+r*Math.cos(a)).toFixed(2),(cy+r*Math.sin(a)).toFixed(2)];}
    var s=pt(Math.PI), e=pt(Math.PI+pct*Math.PI), full=pt(2*Math.PI), col=opts.color||'#e8c476';
    var bg='M'+s[0]+' '+s[1]+' A '+r+' '+r+' 0 0 1 '+full[0]+' '+full[1];
    var fg='M'+s[0]+' '+s[1]+' A '+r+' '+r+' 0 '+(pct>0.5?1:0)+' 1 '+e[0]+' '+e[1];
    return '<div class="gaugewrap"><svg viewBox="0 0 '+W+' '+H+'" style="max-width:'+W+'px">'+
      '<path d="'+bg+'" fill="none" stroke="var(--line)" stroke-width="14" stroke-linecap="round"/>'+
      '<path class="gfg" d="'+fg+'" fill="none" stroke="'+col+'" stroke-width="14" stroke-linecap="round"'+
      ' data-tip="'+E(opts.label||'')+': <b>'+E(opts.display!=null?opts.display:val)+'</b>"/>'+
      '<text x="95" y="86" text-anchor="middle" class="gval">'+E(opts.display!=null?opts.display:val)+'</text></svg>'+
      (opts.label?'<div class="glab">'+E(opts.label)+'</div>':'')+'</div>';
  };

  // Sparkline. spark(values,{w,h,color,fill})
  C.spark=function(vals,opts){
    opts=opts||{}; var W=opts.w||120,H=opts.h||30,mn=Math.min.apply(null,vals),mx=Math.max.apply(null,vals),rng=(mx-mn)||1;
    var pts=vals.map(function(v,i){return (i/(vals.length-1)*W).toFixed(1)+','+(H-2-((v-mn)/rng)*(H-4)).toFixed(1);}).join(' ');
    var area=opts.fill?('<polygon points="0,'+H+' '+pts+' '+W+','+H+'" fill="'+(opts.color||'#5ea0c0')+'" opacity="0.14"/>'):'';
    return '<svg viewBox="0 0 '+W+' '+H+'" class="spark" preserveAspectRatio="none" style="width:'+W+'px;height:'+H+'px">'+area+
      '<polyline points="'+pts+'" fill="none" stroke="'+(opts.color||'#5ea0c0')+'" stroke-width="2" vector-effect="non-scaling-stroke"/></svg>';
  };

  // Segmented RAG/status bar + legend. items=[{label,count,cls|color}]
  C.rag=function(items,opts){
    opts=opts||{};
    var tot=items.reduce(function(a,d){return a+(+d.count||0);},0)||1;
    var bar='<div class="ragbar">'+items.map(function(d){
      var st=d.color?('background:'+d.color):'';
      return '<span class="ragseg '+(d.cls||'')+_clk(d,opts)+'" style="width:'+((+d.count||0)/tot*100).toFixed(1)+'%;'+st+'" data-tip="'+E(d.label)+': <b>'+E(d.count)+'</b> · '+((+d.count||0)/tot*100).toFixed(0)+'%"'+_fa(d,opts)+' title="'+E(d.label)+': '+E(d.count)+'"></span>';
    }).join('')+'</div>';
    var leg='<ul class="chleg">'+items.map(function(d){
      var st=d.color?('background:'+d.color):'';
      return '<li class="'+_clk(d,opts).replace(' ','')+'"'+_fa(d,opts)+'><span class="sw '+(d.cls||'')+'" style="'+st+'"></span>'+E(d.label)+' <b>'+E(d.count)+'</b></li>';
    }).join('')+'</ul>';
    return bar+leg;
  };

  // Horizontal milestone timeline. items=[{date,label,done?,now?}]
  C.timeline=function(items){
    return '<ol class="tline">'+items.map(function(m){
      return '<li class="'+(m.done?'done ':'')+(m.now?'now ':'')+'"><span class="tdot"></span>'+
        '<span class="tdate">'+E(m.date||'')+'</span><span class="tlab">'+E(m.label||'')+'</span></li>';
    }).join('')+'</ol>';
  };

  // Dashboard card wrapper. panel(title, innerHTML, {sub, wide, span})
  C.panel=function(title,inner,opts){
    opts=opts||{};
    return '<section class="dpanel'+(opts.wide?' wide':'')+(opts.span?' span'+opts.span:'')+'">'+
      '<div class="dph"><h2>'+E(title)+'</h2>'+(opts.sub?'<span class="dpsub">'+E(opts.sub)+'</span>':'')+'</div>'+
      inner+'</section>';
  };

  return C;
})();

// Shared hover tooltip for any [data-tip] element (SVG or HTML). Delegated — works for content added later.
(function(){
  function tipEl(){var t=document.getElementById('chtip'); if(!t){t=document.createElement('div');t.id='chtip';t.className='chtip';document.body.appendChild(t);} return t;}
  function hit(e){return e.target&&e.target.closest?e.target.closest('[data-tip]'):null;}
  document.addEventListener('mouseover',function(e){var el=hit(e); if(!el)return; var t=tipEl(); t.innerHTML=el.getAttribute('data-tip'); t.classList.add('on'); place(t,e);});
  document.addEventListener('mousemove',function(e){var t=document.getElementById('chtip'); if(!t||!t.classList.contains('on'))return; if(!hit(e)){t.classList.remove('on');return;} place(t,e);});
  document.addEventListener('mouseout',function(e){var el=hit(e); if(el){var t=document.getElementById('chtip'); if(t)t.classList.remove('on');}});
  function place(t,e){var x=e.clientX+14,y=e.clientY+16,w=t.offsetWidth,h=t.offsetHeight;
    if(x+w>window.innerWidth-8)x=e.clientX-w-14; if(y+h>window.innerHeight-8)y=e.clientY-h-16;
    t.style.left=Math.max(6,x)+'px'; t.style.top=Math.max(6,y)+'px';}
})();

// Click-through: [data-href] navigates; [data-filter][data-target] filters that table (toggle) with a clearable chip.
(function(){
  function match(tr,val,mode){var v=(''+val).toLowerCase();
    if(mode&&mode.indexOf('col:')===0){var i=+mode.split(':')[1],c=tr.children[i];return !!c&&c.textContent.toLowerCase().indexOf(v)>=0;}
    if(mode==='prefix'){var f=tr.children[0];return !!f&&f.textContent.toLowerCase().indexOf(v)===0;}
    return tr.textContent.toLowerCase().indexOf(v)>=0;}
  function chip(wrap,label,shown){
    var id=wrap.id+'-chip',ex=document.getElementById(id);if(ex)ex.remove();
    var c=document.createElement('div');c.id=id;c.className='fchip';
    c.innerHTML='<span>Filtered: <b>'+(typeof esc==='function'?esc(label):label)+'</b> · '+shown+' rows</span><button type="button">✕ clear</button>';
    c.querySelector('button').addEventListener('click',function(ev){ev.stopPropagation();clear(wrap);});
    wrap.parentNode.insertBefore(c,wrap);
  }
  function clear(wrap){wrap.querySelectorAll('tbody tr').forEach(function(tr){tr.style.display='';});
    wrap.removeAttribute('data-active-filter');var ch=document.getElementById(wrap.id+'-chip');if(ch)ch.remove();
    wrap.querySelectorAll('.filter-on').forEach(function(x){x.classList.remove('filter-on');});}
  function apply(wrap,val,mode,label){
    var rows=wrap.querySelectorAll('tbody tr'),shown=0;
    rows.forEach(function(tr){var ok=match(tr,val,mode);tr.style.display=ok?'':'none';if(ok)shown++;});
    wrap.setAttribute('data-active-filter',val);chip(wrap,label||val,shown);return shown;}
  CH.applyFilter=apply; CH.clearFilter=clear;
  document.addEventListener('click',function(e){
    var a=e.target.closest&&e.target.closest('[data-href]');
    if(a){location.href=a.getAttribute('data-href');return;}
    var el=e.target.closest&&e.target.closest('[data-filter][data-target]');
    if(!el)return;
    var val=el.getAttribute('data-filter'),wrap=document.querySelector(el.getAttribute('data-target'));
    if(!wrap)return;
    if(wrap.getAttribute('data-active-filter')===val){clear(wrap);return;}
    apply(wrap,val,el.getAttribute('data-mode')||'contains',el.getAttribute('data-label')||val);
    try{wrap.scrollIntoView({behavior:'smooth',block:'center'});}catch(e2){}
  });
})();
