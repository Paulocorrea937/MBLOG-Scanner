'use strict';
// Gerador local de PDF A4 (PDF 1.4), sem CDN, dependências ou servidor.
// Dados técnicos só aparecem quando a origem é explicitamente DEMONSTRAÇÃO.
// Sem adaptador, emite REGISTRO MANUAL / SEM LEITURA ELETRÔNICA.
(function(){
 const W=595,H=842;
 const COLORS={navy:'#0c2943',navy2:'#173e5c',sky:'#0d8bbf',white:'#ffffff',ink:'#19354f',muted:'#647b8c',light:'#f2f6f9',line:'#dce6ed',orange:'#c47b21',cream:'#fff5e6',green:'#137e58',ltgreen:'#eaf8f0'};
 function hexColor(hex){return [1,3,5].map(i=>(parseInt(hex.slice(i,i+2),16)/255).toFixed(3)).join(' ');}
 // caracteres tipográficos convertidos para WinAnsi (PDF Helvetica)
 function ansi(input){return String(input??'').normalize('NFC').replace(/[“”]/g,'"').replace(/[‘’]/g,"'").replace(/[–—]/g,'-').replace(/•/g,'-').replace(/→/g,'>').replace(/⚠|✓|●/g,'').replace(/[\u2010-\u202e\u20ac\u2600-\uffff]/g,'?').replace(/[\r\n\t]+/g,' ');}
 function pdfstr(value){return ansi(value).replaceAll('\\','\\\\').replaceAll('(','\\(').replaceAll(')','\\)');}
 function latinBytes(str){const a=new Uint8Array(str.length);for(let i=0;i<str.length;i++)a[i]=str.charCodeAt(i)&255;return a;}
 function wrap(s,limit){const words=ansi(s).split(/\s+/);const lines=[];let line='';for(let word of words){if(word.length>limit){if(line){lines.push(line);line='';}while(word.length>limit){lines.push(word.slice(0,limit));word=word.slice(limit);} }if((line+' '+word).trim().length>limit){if(line)lines.push(line);line=word;}else line=(line?line+' ':'')+word;}if(line)lines.push(line);return lines.length?lines:['-'];}
 class Page{
  constructor(){this.ops=[];}
  fill(x,y,w,h,color){this.ops.push(`${hexColor(color)} rg ${x.toFixed(2)} ${(H-y-h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);}
  stroke(x,y,w,h,color,width=1){this.ops.push(`${hexColor(color)} RG ${width} w ${x.toFixed(2)} ${(H-y-h).toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re S`);}
  line(x1,y1,x2,y2,color,width=1){this.ops.push(`${hexColor(color)} RG ${width} w ${x1.toFixed(2)} ${(H-y1).toFixed(2)} m ${x2.toFixed(2)} ${(H-y2).toFixed(2)} l S`);}
  text(x,y,s,size=10,color=COLORS.ink,bold=false){this.ops.push(`${hexColor(color)} rg BT /${bold?'F2':'F1'} ${size.toFixed(1)} Tf 1 0 0 1 ${x.toFixed(2)} ${(H-y).toFixed(2)} Tm (${pdfstr(s)}) Tj ET`);}
  wrapped(x,y,s,maxLen=75,size=10,color=COLORS.ink,lineHeight=14,bold=false){let curr=y;for(const line of wrap(s,maxLen)){this.text(x,curr,line,size,color,bold);curr+=lineHeight;}return curr;}
  content(){return this.ops.join('\n')+'\n';}
 }
 function dateLabel(v){const d=new Date(v);return Number.isNaN(d.getTime())?'Data não informada':new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'medium'}).format(d);}
 function fmt(v,decimals=0){if(v===undefined||v===null||v==='')return 'Sem leitura';const n=Number(v);return Number.isFinite(n)?n.toLocaleString('pt-BR',{minimumFractionDigits:decimals,maximumFractionDigits:decimals}):String(v);}
 function makeDoc(pages){const objs=[null];function add(content){objs.push(content);return objs.length-1;}
  const pagesId=add(''),fontRegular=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>'),fontBold=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  const pageIds=[];for(const page of pages){const commands=page.content();const streamId=add(`<< /Length ${latinBytes(commands).length} >>\nstream\n${commands}endstream`);const id=add(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${W} ${H}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> >> /Contents ${streamId} 0 R >>`);pageIds.push(id);}
  objs[pagesId]=`<< /Type /Pages /Kids [${pageIds.map(id=>id+' 0 R').join(' ')}] /Count ${pageIds.length} >>`;
  const root=add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  let out='%PDF-1.4\n%MBLOG\n';const offsets=[0];for(let i=1;i<objs.length;i++){offsets[i]=latinBytes(out).length;out+=`${i} 0 obj\n${objs[i]}\nendobj\n`;}
  const xref=latinBytes(out).length;out+=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;
  for(let i=1;i<offsets.length;i++)out+=String(offsets[i]).padStart(10,'0')+' 00000 n \n';
  out+=`trailer\n<< /Size ${objs.length} /Root ${root} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new Blob([latinBytes(out)],{type:'application/pdf'});
 }
 function header(p,title,subtitle,simulated){p.fill(0,0,W,113,COLORS.navy);p.fill(42,31,46,46,COLORS.sky);p.text(54,59,'MB',18,COLORS.white,true);p.text(100,46,'MBLOG Scanner',20,COLORS.white,true);p.text(100,64,'CENTRAL DE DIAGNÓSTICO VEICULAR',8.2,'#a7c8df',true);p.text(42,99,title,12,COLORS.white,true);p.fill(385,30,169,27,simulated?'#704f27':'#35546f');p.text(394,48,simulated?'DEMONSTRAÇÃO':'REGISTRO MANUAL',9,simulated?'#ffe4ac':COLORS.white,true);p.text(418,73,subtitle,8,'#b9d0df');}
 function footer(p,index,total,simulated){p.line(42,795,553,795,COLORS.line,1);p.text(42,810,simulated?'DEMONSTRAÇÃO FICTÍCIA - NÃO É UM LAUDO REAL':'REGISTRO MANUAL - NÃO HOUVE LEITURA ELETRÔNICA',8.1,simulated?COLORS.orange:COLORS.navy,true);p.text(42,823,'A origem dos dados é declarada. Nunca interpretar como diagnóstico eletrônico.',7.8,COLORS.muted);p.text(514,819,index+' / '+total,9,COLORS.muted,true);}
 function section(p,y,kicker,title){p.text(42,y,kicker.toUpperCase(),8.4,COLORS.sky,true);p.text(42,y+21,title,15.5,COLORS.navy,true);p.line(42,y+31,553,y+31,COLORS.line,1);}
 function keyvalue(p,x,y,key,val){p.text(x,y,key.toUpperCase(),8,COLORS.muted,true);p.text(x,y+20,ansi(val).slice(0,45),12,COLORS.ink,true);}
 function field(p,x,y,w,label,value){p.fill(x,y,w,57,COLORS.light);p.text(x+12,y+18,label.toUpperCase(),8.1,COLORS.muted,true);p.text(x+12,y+39,String(value),12,COLORS.navy,true);}
 function buildPages(report){const simulated=String(report.mode||'').toUpperCase().includes('SIMUL')||String(report.mode||'').toUpperCase().includes('DEMONSTR');const p1=new Page(),p2=new Page();const pages=[p1,p2];header(p1,'Relatório técnico de atendimento',simulated?'Dados demonstrativos':'Dados do atendimento',simulated);
  section(p1,142,'01  /  identificação','Dados do veículo e atendimento');
  keyvalue(p1,42,197,'Placa',report.plate||'Não informada');keyvalue(p1,217,197,'Modelo',String(report.model||'Desconhecido').slice(0,29));
  keyvalue(p1,42,251,'Ano / modelo',report.year||'Não informado');keyvalue(p1,217,251,'Data e hora',dateLabel(report.date));
  p1.line(42,288,553,288,COLORS.line,1);
  keyvalue(p1,42,306,'Técnico responsável',report.technician||'Não informado');
  keyvalue(p1,298,306,'Origem dos dados',simulated?'DEMONSTRAÇÃO - FICTÍCIO':'MANUAL - SEM LEITURA');
  section(p1,371,'02  /  telemetria',simulated?'Parâmetros fictícios':'Parâmetros (sem leitura)');
  const r=report.readings||{};const value=(v,unit,dec=0)=>(v===undefined||v===null)?'Não disponível':fmt(v,dec)+' '+unit;field(p1,42,420,162,'Rotação do motor',value(r.rpm,'rpm'));field(p1,216,420,162,'Temperatura',value(r.temp,'°C'));field(p1,390,420,163,'Bateria',value(r.voltage,'V',1));
  field(p1,42,490,162,'Combustível',value(r.fuel,'%'));field(p1,216,490,162,'Velocidade',value(r.speed,'km/h'));field(p1,390,490,163,'Hodômetro',value(r.odometer,'km'));
  section(p1,595,'03  /  resumo','Resumo do atendimento');
  const count=Number(report.faultCount)||0;p1.fill(42,645,511,88,simulated?(count?COLORS.cream:COLORS.ltgreen):COLORS.light);p1.fill(42,645,5,88,simulated?(count?COLORS.orange:COLORS.green):COLORS.sky);
  p1.text(60,672,simulated?(count?count+' alerta(s) fictício(s)':'Sem alertas fictícios'):'Sem diagnóstico eletrônico',16.5,simulated&&count?COLORS.orange:COLORS.navy,true);
  p1.text(60,697,'Atendimento: '+String(report.serviceKind||'Inspeção e registro').slice(0,47),10,COLORS.ink);
  p1.text(60,718,simulated?'Não representa o estado mecânico real do veículo.':'Não há informação eletrônica suficiente para avaliar o estado do veículo.',9.2,COLORS.muted);
  header(p2,'Detalhes do atendimento',simulated?'Dados demonstrativos':'Dados manuais',simulated);
  section(p2,132,'04  /  sistemas',simulated?'Módulos fictícios apresentados':'Módulos eletrônicos não verificados');
  const moduleArr=Array.isArray(report.modules)&&report.modules.length?report.modules:[];
  const mods=moduleArr.length?moduleArr:[{name:'Módulos não verificados',state:'Sem leitura'}];
  let i=0;for(const m of mods.slice(0,8)){const col=i%2,row=Math.floor(i/2),x=42+col*261,y=179+row*43;p2.fill(x,y,249,36,COLORS.light);p2.text(x+9,y+14,String(m.name).slice(0,28),10,COLORS.ink,true);p2.text(x+9,y+28,String(m.state||'Sem leitura'),8,m.state&&String(m.state).startsWith('Alerta')?COLORS.orange:COLORS.muted);i++;}
  section(p2,378,'05  /  ocorrências','Códigos SPN / FMI');let y=428;
  const fs=Array.isArray(report.faults)?report.faults:[];if(!fs.length){p2.fill(42,y,511,38,COLORS.light);p2.text(54,y+23,simulated?'Sem exemplo de falha adicionado.':'Não foi realizada leitura de falhas.',10,COLORS.muted,true);y+=53;}
  for(const f of fs.slice(0,4)){const desc=wrap(f.description||'Exemplo de falha simulada.',91).slice(0,3);const h=36+desc.length*12;p2.fill(42,y,511,h,COLORS.cream);p2.fill(42,y,4,h,COLORS.orange);p2.text(54,y+16,String(f.code||'Código de exemplo'),10.8,COLORS.navy,true);desc.forEach((line,index)=>p2.text(54,y+33+index*12,line,9.2,COLORS.ink));y+=h+8;}
  // Imprimir observações completas em página própria quando necessário.
  let obs=String(report.notes||'Nenhuma observação registrada.');let obsLines=wrap(obs,106),initialY=Math.max(y+17,648);
  if(initialY>755){p2.text(42,765,'Observações: consultar a página seguinte.',9,COLORS.muted);addNotesPages(pages,obsLines,simulated);}else{
   p2.text(42,initialY,'OBSERVAÇÕES DO RESPONSÁVEL',8.5,COLORS.sky,true);let pointer=initialY+20;
   const n=Math.max(0,Math.floor((774-pointer)/13));obsLines.slice(0,n).forEach(l=>{p2.text(42,pointer,l,9,COLORS.ink);pointer+=13;});
   if(obsLines.length>n)addNotesPages(pages,obsLines.slice(n),simulated);
  }
  pages.forEach((page,index)=>footer(page,index+1,pages.length,simulated));return pages;
 }
 function addNotesPages(pages,lines,simulated){let n=0;while(n<lines.length){const p=new Page();header(p,'Continuação das observações',simulated?'Demonstração':'Registro manual',simulated);section(p,145,'06  /  atendimento','Observações do responsável');let y=202;while(n<lines.length&&y<768){p.text(42,y,lines[n],9.5,COLORS.ink);n++;y+=16;}pages.push(p);}}
 function download(report){const snapshot=JSON.parse(JSON.stringify(report||{}));const simulated=String(snapshot.mode||'').toUpperCase().includes('SIMUL')||String(snapshot.mode||'').toUpperCase().includes('DEMONSTR');const pdf=makeDoc(buildPages(snapshot));const url=URL.createObjectURL(pdf);const safePlate=String(snapshot.plate||'SEM_PLACA').replace(/[^a-zA-Z0-9-]/g,'_');const date=new Date(snapshot.date||Date.now());const day=Number.isNaN(date.getTime())?'DATA':date.toISOString().slice(0,10);const a=document.createElement('a');a.href=url;a.download=`MBLOG_Scanner_${simulated?'DEMONSTRACAO':'REGISTRO_MANUAL'}_${safePlate}_${day}.pdf`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}
 window.MBLOGPdf={download};
})();
