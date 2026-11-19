'use strict';
// Aplicativo demonstrativo. Nenhuma integração com hardware é implementada nesta versão.
const DEMO_VEHICLES = [
  {id:'MB01',plate:'DEMO-01',model:'Volkswagen 17.190 CRM',year:2014},
  {id:'MB02',plate:'DEMO-02',model:'Volkswagen 24.280 CRM',year:2017},
  {id:'MB03',plate:'DEMO-03',model:'Mercedes-Benz Atego 1419',year:2019},
  {id:'MB04',plate:'DEMO-04',model:'Mercedes-Benz Atego 1419',year:2019},
  {id:'MB05',plate:'DEMO-05',model:'Mercedes-Benz Atego 1419',year:2019},
  {id:'MB06',plate:'DEMO-06',model:'Mercedes-Benz Atego 2426',year:2021},
  {id:'MB07',plate:'DEMO-07',model:'Volkswagen 9.170 DRC',year:2020},
  {id:'MB08',plate:'DEMO-08',model:'Volkswagen 9.170 DRC',year:2022},
  {id:'MB09',plate:'DEMO-09',model:'Ford Cargo 2423',year:2014},
];
const $ = id => document.getElementById(id);
const STORE_VEHICLES='mblog-scanner-private-fleet-v1';
const STORE_HISTORY='mblog-scanner-local-history-v1';
function safeJSON(key,fallback){try {const obj=JSON.parse(localStorage.getItem(key));return obj??fallback;} catch{return fallback;}}
let vehicles=safeJSON(STORE_VEHICLES,DEMO_VEHICLES);
if(!Array.isArray(vehicles) || vehicles.length>200 || vehicles.length===0) vehicles=DEMO_VEHICLES;
let selectedId=vehicles[0].id;
let running=false;
let fault=false;
let tick=0;
let readings=null;
let clock=null;
function vehicle(){return vehicles.find(v=>v.id===selectedId)||vehicles[0];}
function createTextElement(tag,cls,text){const el=document.createElement(tag); if(cls)el.className=cls; el.textContent=String(text);return el;}
function renderVehicles(){
  const sel=$('vehicle-select');sel.replaceChildren();
  for(const v of vehicles){const op=document.createElement('option');op.value=v.id;op.textContent=`${v.plate} · ${v.model}`;sel.appendChild(op);}
  if(!vehicles.some(v=>v.id===selectedId))selectedId=vehicles[0].id;
  sel.value=selectedId;
  $('fleet-count').textContent=`${vehicles.length} veículos`;
  const v=vehicle(), card=$('vehicle-card');card.replaceChildren();
  card.append(createTextElement('div','truck','🚚'),createTextElement('strong','',v.model),createTextElement('div','plate',`Placa: ${v.plate} · Ano: ${v.year}`),createTextElement('div','maker',`Identificador: ${v.id}`));
}
function updateReadings(){
  if(!running){readings=null;for(const key of ['rpm','temp','voltage','fuel','speed'])$(key).textContent='—';$('fuel-fill').style.width='0%';return;}
  tick++;
  const seed=(tick*11)+(vehicles.findIndex(v=>v.id===selectedId)*7);
  readings={rpm:720+(seed%250),temp:78+(seed%15),voltage:(27.4+(seed%8)/10).toFixed(1),fuel:55+(seed%20),speed:0};
  $('rpm').textContent=readings.rpm.toLocaleString('pt-BR');
  $('temp').textContent=readings.temp;
  $('voltage').textContent=String(readings.voltage).replace('.',',');
  $('fuel').textContent=readings.fuel;
  $('speed').textContent=readings.speed;
  $('fuel-fill').style.width=readings.fuel+'%';
}
function renderFaults(){
  const el=$('fault-list');el.replaceChildren();
  if(!running){$('fault-count').textContent='Aguardando';el.append(createTextElement('div','empty','Inicie a simulação para exibir falhas de exemplo.'));return;}
  if(!fault){$('fault-count').textContent='0 simuladas';el.append(createTextElement('div','clear','✓ Nenhuma falha na simulação. Isso NÃO indica ausência de falhas reais.'));return;}
  $('fault-count').textContent='1 simulada';
  const card=createTextElement('div','fault-entry','');
  card.append(createTextElement('div','test','Exemplo fictício — não obtido do caminhão'),createTextElement('strong','', 'SPN 110 · FMI 3 · OC 1'),createTextElement('p','', 'Circuito/sinal do sensor de temperatura do líquido de arrefecimento: tensão acima do normal (exemplo de interpretação).'));
  el.append(card);
}
function renderStatus(){const pill=$('reading-state');pill.textContent=running?'Simulação em execução':'Simulador parado';pill.className='pill '+(running?'active':'inactive');$('start-button').textContent=running?'■ Parar simulação':'▶ Iniciar simulação';$('fault-button').textContent=fault?'✓ Remover falha simulada':'⚠️ Simular falha';}
function renderHistory(){const root=$('history-list');root.replaceChildren();const hist=safeJSON(STORE_HISTORY,[]);if(!hist.length){root.append(createTextElement('div','empty','Nenhuma sessão salva ainda.'));return;}
 for(const h of hist.slice(0,10)){const row=createTextElement('div','history-item','');row.append(createTextElement('strong','',`${h.plate} — ${h.faultCount} falha(s) simulada(s)`),createTextElement('span','',new Date(h.date).toLocaleString('pt-BR')));root.append(row);}}
function saveHistory(){if(!running){alert('Inicie a simulação antes de registrar uma sessão.');return;}
 const v=vehicle();const hist=safeJSON(STORE_HISTORY,[]);hist.unshift({date:new Date().toISOString(),plate:v.plate,model:v.model,mode:'SIMULACAO',faultCount:fault?1:0,...readings});localStorage.setItem(STORE_HISTORY,JSON.stringify(hist.slice(0,300)));renderHistory();alert('Sessão SIMULADA registrada somente neste dispositivo.');}
function csvValue(v){return '"'+String(v??'').replaceAll('"','""')+'"';}
function downloadCSV(){const hist=safeJSON(STORE_HISTORY,[]);if(!hist.length){alert('Não há sessões para exportar.');return;}
 const fields=['date','plate','model','mode','faultCount','rpm','temp','voltage','fuel','speed'];const rows=[fields.join(';'),...hist.map(h=>fields.map(k=>csvValue(h[k])).join(';'))];const blob=new Blob(['\ufeff'+rows.join('\r\n')],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='MBLOG_Scanner_historico_SIMULADO.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function validFleet(data){const list=Array.isArray(data)?data:data?.vehicles;
 if(!Array.isArray(list)||!list.length||list.length>200)throw Error('Arquivo precisa conter uma lista de 1 a 200 caminhões.');
 const ids=new Set();return list.map((x,i)=>{if(!x||typeof x!=='object')throw Error('Item de cadastro inválido');const v={id:String(x.id??`V${i+1}`).slice(0,50),plate:String(x.plate??'').trim().slice(0,18),model:String(x.model??'').trim().slice(0,100),year:Number(x.year)};if(!v.plate||!v.model||!Number.isInteger(v.year)||v.year<1950||v.year>2100||ids.has(v.id))throw Error('Placa, modelo, ano ou ID inválido/duplicado.');ids.add(v.id);return v;});}
$('vehicle-select').addEventListener('change',e=>{selectedId=e.target.value;renderVehicles();updateReadings();renderFaults();});
$('start-button').addEventListener('click',()=>{running=!running;if(!running){clearInterval(clock);clock=null;fault=false;}else{clock=setInterval(updateReadings,2200);}renderStatus();updateReadings();renderFaults();});
$('fault-button').addEventListener('click',()=>{if(!running){alert('Inicie a simulação primeiro.');return;}fault=!fault;renderStatus();renderFaults();});
$('save-button').addEventListener('click',saveHistory);
$('export-button').addEventListener('click',downloadCSV);
$('import-button').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>1000000){alert('Arquivo muito grande');return;}try{const obj=JSON.parse(await f.text());vehicles=validFleet(obj);localStorage.setItem(STORE_VEHICLES,JSON.stringify(vehicles));selectedId=vehicles[0].id;renderVehicles();renderFaults();alert('Cadastro carregado somente neste aparelho/navegador. Não foi enviado ao GitHub.');}catch(err){alert('Não foi possível importar: '+err.message);}e.target.value='';});
$('restore-button').addEventListener('click',()=>{if(!confirm('Restaurar veículos fictícios da demonstração?'))return;localStorage.removeItem(STORE_VEHICLES);vehicles=DEMO_VEHICLES;selectedId=vehicles[0].id;renderVehicles();});
renderVehicles();renderStatus();renderFaults();renderHistory();
if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){navigator.serviceWorker.register('./sw.js').catch(()=>{});}
