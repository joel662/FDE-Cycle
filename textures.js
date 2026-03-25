function makeBlockTexture(state, value) {
  const c=document.createElement('canvas');c.width=256;c.height=256;
  const ctx=c.getContext('2d');
  // White base (Extreme Visibility)
  const bg=ctx.createLinearGradient(0,0,256,256);
  bg.addColorStop(0,'#ffffff');bg.addColorStop(1,'#f0f0f0');
  ctx.fillStyle=bg;ctx.fillRect(0,0,256,256);
  // Rivets
  [[18,18],[238,18],[18,238],[238,238]].forEach(([x,y])=>{
    const rg=ctx.createRadialGradient(x-2,y-2,1,x,y,7);
    rg.addColorStop(0,'#c8902a');rg.addColorStop(1,'#6a4010');
    ctx.fillStyle=rg;ctx.beginPath();ctx.arc(x,y,7,0,6.283);ctx.fill();
  });
  // Recessed tray (Light Grey)
  ctx.fillStyle='#e8e8e8';ctx.fillRect(36,36,184,184);
  // Emissive border
  ctx.save();
  ctx.shadowColor='#ff8c00';ctx.shadowBlur=16;
  ctx.strokeStyle='#ff8c00';ctx.lineWidth=4;
  ctx.strokeRect(36,36,184,184);
  ctx.restore();
  // Content
  ctx.save();ctx.translate(128,128);
  if(state==='envelope'){
    // Centered Full-Canvas Envelope (-128 to 128)
    const baseCol = '#ff9933'; 
    const flapCol = '#ffcc66';
    ctx.fillStyle=baseCol;ctx.fillRect(-128,-128,256,256);
    // Shadows/Folds
    ctx.fillStyle='rgba(0,0,0,0.1)';
    ctx.beginPath();ctx.moveTo(-128,128);ctx.lineTo(0,0);ctx.lineTo(128,128);ctx.lineTo(128,-128);ctx.lineTo(-128,-128);ctx.fill();
    // Top flap (rounded)
    ctx.fillStyle=flapCol;
    ctx.beginPath();
    ctx.moveTo(-128,-128);
    ctx.quadraticCurveTo(0, 100, 128, -128); 
    ctx.closePath();ctx.fill();
    // Flap edge
    ctx.strokeStyle='#7c4a16';ctx.lineWidth=4;
    ctx.beginPath();ctx.moveTo(-128,-128);ctx.quadraticCurveTo(0, 100, 128, -128);ctx.stroke();
    // Main border
    ctx.strokeStyle='#4a2a10';ctx.lineWidth=4;ctx.strokeRect(-128,-128,256,256);
    console.log('Texture: Drawing full-canvas envelope (centered)');
  } else if(state==='open-red'||state==='open-blue'||state==='open-green'){
    const col=state==='open-red'?'#ee3333':state==='open-blue'?'#3366ff':'#33cc55';
    const sym=state==='open-red'?'+':state==='open-blue'?'⇄':'↗';
    const lbl=state==='open-red'?'ALU OP':state==='open-blue'?'MEM OP':'BRANCH';
    ctx.fillStyle='#f0deb0';ctx.fillRect(-72,-44,144,88);
    ctx.fillStyle='#c8a060';
    ctx.beginPath();ctx.moveTo(-72,-44);ctx.lineTo(0,8);ctx.lineTo(72,-44);ctx.closePath();ctx.fill();
    ctx.strokeStyle='#8b6914';ctx.lineWidth=2;ctx.strokeRect(-72,-44,144,88);
    // Ticket
    const tg=ctx.createLinearGradient(-26,-68,26,-8);
    tg.addColorStop(0,col);tg.addColorStop(1,'#1a1a1a');
    ctx.fillStyle=tg;ctx.fillRect(-26,-68,52,62);
    ctx.fillStyle='#fff';ctx.font='bold 30px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(sym,0,-40);
    ctx.font='10px monospace';ctx.fillStyle='rgba(255,255,255,.8)';ctx.fillText(lbl,0,-14);
    // Ticket shadow
    ctx.strokeStyle=col;ctx.lineWidth=1;ctx.strokeRect(-26,-68,52,62);
  } else if(state==='data-raw'){
    ctx.fillStyle='#0044cc';ctx.shadowColor='#0066ff';ctx.shadowBlur=24;
    ctx.font='bold 54px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(String(value||0).padStart(3,'0'),0,0);ctx.shadowBlur=0;
    ctx.fillStyle='#5588ff';ctx.font='11px monospace';ctx.fillText('RAW  DATA',0,40);
    ctx.fillStyle='rgba(0,102,255,.15)';ctx.fillRect(-80,-70,160,30);
    ctx.fillStyle='#336bcc';ctx.font='9px monospace';ctx.fillText('▓▓▒░ REGISTER ░▒▓▓',0,-54);
  } else if(state==='data-result'){
    ctx.fillStyle='#ffd700';ctx.shadowColor='#ffaa00';ctx.shadowBlur=28;
    ctx.font='bold 54px monospace';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(String(value||0).padStart(3,'0'),0,0);ctx.shadowBlur=0;
    ctx.fillStyle='#ffe566';ctx.font='11px monospace';ctx.fillText('✓  RESULT  ✓',0,40);
    ctx.strokeStyle='rgba(255,215,0,.3)';ctx.lineWidth=2;
    for(let r=28;r<=80;r+=18){ctx.beginPath();ctx.arc(0,0,r,0,6.283);ctx.stroke();}
  } else if(state==='bug'){
    ctx.fillStyle='#ff1111';ctx.font='bold 46px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('☠',0,-12);
    ctx.fillStyle='#ff4444';ctx.font='bold 14px monospace';ctx.fillText('!! BUG !!',0,36);
    ctx.strokeStyle='#ff0000';ctx.lineWidth=2;
    [['-60,-60','60,60'],['-60,60','60,-60']].forEach(([a,b])=>{
      const [ax,ay]=a.split(',').map(Number);const [bx,by]=b.split(',').map(Number);
      ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();
    });
  } else if(state==='miss'){
    ctx.fillStyle='#ff4400';ctx.font='bold 26px sans-serif';
    ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText('CACHE',0,-18);ctx.fillText('MISS!',0,14);
    ctx.strokeStyle='#ff4400';ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,-2,50,0,6.283);ctx.stroke();
  }
  ctx.restore();
  return c.toDataURL();
}
