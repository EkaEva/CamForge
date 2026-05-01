// Splash screen animation — extracted from index.html for CSP compliance
(function(){
  // Wait for icon font to load before starting splash animation
  var fontReady=false;
  if(document.fonts&&document.fonts.load){
    document.fonts.load('20px Material Symbols Outlined').then(function(){fontReady=true;});
  }else{fontReady=true;}

  // Pre-compute cam profile points
  var cx=100,cy=100,r0=55,h=20,n=120;
  var pts=[];
  for(var i=0;i<=n;i++){var a=(i/n)*2*Math.PI,s=h*(0.5-0.5*Math.cos(a)),r=r0+s;pts.push([cx+r*Math.sin(a),cy-r*Math.cos(a)]);}

  var p=document.getElementById('splash-cam-path');
  var camGroup=document.getElementById('splash-cam-group');
  var camBase=document.getElementById('splash-cam-base');
  var titleEl=document.querySelector('.splash-title');
  var subEl=document.querySelector('.splash-subtitle');
  var verEl=document.querySelector('.splash-version');
  var curvesEl=document.querySelector('.splash-curves');
  var gridEl=document.querySelector('.splash-grid');
  var splash=document.getElementById('splash');
  if(!p)return;

  // Compressed timeline (~1.8s total):
  // cam draw: 0.15s-0.9s
  // title spring start: 0.4s
  // subtitle spring start: 0.6s
  // version spring start: 0.8s
  // curves fade in: 0.7s
  // cam rotation: 0.9s-1.4s
  // global fade out: 1.4s-1.8s

  var t0=performance.now();

  // Spring simulation helper
  function springVal(elapsed,delay,damping){
    var t=Math.max(0,(elapsed-delay)/1000);
    if(t<=0)return{v:0,y:30};
    // Damped spring: x(t) = 1 - e^(-damping*t) * cos(omega*t)
    var omega=8;
    var val=1-Math.exp(-damping*t)*Math.cos(omega*t);
    val=Math.min(1,Math.max(0,val));
    return{v:val,y:30*(1-val)};
  }

  function tick(now){
    var elapsed=now-t0;

    // 1. Cam draw (progressive point reveal)
    var drawProg=Math.min(Math.max((elapsed-150)/750,0),1); // 0.15s-0.9s
    var visPts=Math.floor(n*drawProg);
    var d='';
    for(var i=0;i<=visPts;i++){d+=(i===0?'M ':'L ')+pts[i][0].toFixed(2)+' '+pts[i][1].toFixed(2)+' ';}
    if(drawProg>=1)d+='Z';
    p.setAttribute('d',d);

    // 2. Cam base triangle appears when draw > 30%
    if(camBase){
      camBase.style.opacity=drawProg>0.3?'1':'0';
      camBase.style.transition='opacity 0.3s ease';
    }

    // 3. Title spring (delay 0.4s, damping 14)
    if(titleEl){
      var ts=springVal(elapsed,400,14);
      titleEl.style.opacity=ts.v;
      titleEl.style.transform='translateY('+ts.y+'px)';
    }

    // 4. Subtitle spring (delay 0.6s, damping 16)
    if(subEl){
      var ss=springVal(elapsed,600,16);
      subEl.style.opacity=ss.v;
      subEl.style.transform='translateY('+(30*(1-ss.v))+'px)';
    }

    // 5. Version spring (delay 0.8s, damping 18)
    if(verEl){
      var vs=springVal(elapsed,800,18);
      verEl.style.opacity=vs.v;
      verEl.style.transform='translateY('+(15*(1-vs.v))+'px)';
    }

    // 6. Curves fade in (from 0.7s, target opacity 0.4)
    if(curvesEl){
      var curveOp=Math.min(Math.max((elapsed-700)/300,0),0.4);
      curvesEl.style.opacity=curveOp;
    }

    // 7. Cam rotation (0.9s-1.4s)
    if(camGroup&&drawProg>=1){
      var rotProg=Math.min(Math.max((elapsed-900)/500,0),1);
      var rotEase=rotProg<0.5?2*rotProg*rotProg:1-Math.pow(-2*rotProg+2,2)/2;
      camGroup.setAttribute('transform','rotate('+(rotEase*360)+' 100 100)');
    }

    // 8. Global fade out — wait for icon font (max 3s total)
    var canFade=fontReady||elapsed>=3000;
    var fadeOut=(canFade&&elapsed>=1400)?Math.min((elapsed-1400)/400,1):0;
    if(fadeOut>0){
      var op=1-fadeOut;
      splash.style.opacity=op;
      if(gridEl)gridEl.style.opacity=0.15*op;
    }

    // Stop when fully faded
    if(fadeOut>=1){
      splash.remove();
      return;
    }

    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();