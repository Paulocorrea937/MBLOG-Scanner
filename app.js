'use strict';
// MBLOG Scanner 3.0 — interface de gestão. NÃO existe conexão eletrônica nesta versão.
// Nunca apresentar telemetria fictícia como diagnóstico real.
const FLEET_DEMO = [
 {id:'MB01',plate:'VEICULO-01',model:'Volkswagen 17.190 CRM 4x2',year:2014},
 {id:'MB02',plate:'VEICULO-02',model:'Volkswagen 24.280 CRM 6x2',year:2017},
 {id:'MB03',plate:'VEICULO-03',model:'Mercedes-Benz Atego 1419',year:2019},
 {id:'MB04',plate:'VEICULO-04',model:'Mercedes-Benz Atego 1419',year:2019},
 {id:'MB05',plate:'VEICULO-05',model:'Mercedes-Benz Atego 1419',year:2019},
 {id:'MB06',plate:'VEICULO-06',model:'Mercedes-Benz Atego 2426',year:2021},
 {id:'MB07',plate:'VEICULO-07',model:'Volkswagen 9.170 DRC 4x2',year:2020},
 {id:'MB08',plate:'VEICULO-08',model:'Volkswagen 9.170 DRC 4x2',year:2022},
 {id:'MB09',plate:'VEICULO-09',model:'Ford Cargo 2423',year:2014}
];
const MODULES = [
 {id:'motor',name:'Motor / ECM',desc:'Central de controle do motor'},
 {id:'injecao',name:'Injeção eletrônica',desc:'Alimentação e pressão do combustível'},
 {id:'turbo',name:'Turbo / admissão',desc:'Ar e pressão de admissão'},
 {id:'scr',name:'SCR / Arla 32',desc:'Pós-tratamento de emissões'},
 {id:'transmissao',name:'Transmissão',desc:'Controle do câmbio'},
 {id:'abs',name:'ABS / EBS',desc:'Sistema eletrônico de freios'},
 {id:'eletrica',name:'Sistema elétrico',desc:'Tensão e circuitos'},
 {id:'arrefecimento',name:'Arrefecimento',desc:'Temperatura e sensores'}
];
const DEMO_FAULTS = [
 {module:'arrefecimento',code:'SPN 110 · FMI 3',severity:'Atenção',description:'Exemplo fictício: sinal de temperatura do arrefecimento acima da faixa elétrica esperada.',cause:'Em um atendimento real, verificar sensor, alimentação e chicote conforme documentação técnica.'},
 {module:'injecao',code:'SPN 94 · FMI 1',severity:'Atenção',description:'Exemplo fictício: pressão de combustível abaixo do limite esperado.',cause:'Em um diagnóstico real, conferir filtragem e alimentação segundo procedimento do fabricante.'},
 {module:'scr',code:'SPN 5246 · FMI 0',severity:'Crítico (fictício)',description:'Exemplo fictício de alerta relacionado à limitação de desempenho.',cause:'Validar a estratégia e os códigos precedentes com o equipamento homologado.'}
];
const $=id=>document.getElementById(id);
const KEYS={fleet:'mblog-scanner-private-fleet-v1',history:'mblog-scanner-local-history-v1',form:'mblog-scanner-form-v3',demo:'mblog-scanner-demo-v3'};
const HEADINGS={inicio:['Visão geral','Acompanhe sua frota, organize as informações e centralize relatórios.'],leituras:['Leituras','Acompanhe os parâmetros disponibilizados durante a comunicação eletrônica.'],sistemas:['Sistemas','Consulte as centrais eletrônicas e a cobertura dos módulos.'],falhas:['Falhas','Códigos e ocorrências identificados pelo sistema de diagnóstico.'],historico:['Histórico','Atendimentos e documentos salvos neste aparelho.'],relatorios:['Relatórios','Gere documentos técnicos em PDF com os dados do atendimento.'],ajustes:['Configurações','Gerencie a frota, a comunicação e as preferências do aplicativo.']};
function savedJSON(key,fallback){try{const x=JSON.parse(localStorage.getItem(key));return x===null?fallback:x;}catch{return fallback;}}
function safeSave(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
function fleetValidate(input){const a=Array.isArray(input)?input:input?.vehicles;if(!Array.isArray(a)||a.length<1||a.length>200)throw Error('O cadastro deve ter entre 1 e 200 veículos.');const seen=new Set();return a.map((v,i)=>{if(!v||typeof v!=='object')throw Error('Veículo inválido.');const id=String(v.id||`V${i+1}`).trim().slice(0,40),plate=String(v.plate||'').trim().toUpperCase().slice(0,20),model=String(v.model||'').trim().slice(0,100),year=Number(v.year);if(!id||!plate||!model||!Number.isInteger(year)||year<1950||year>2100||seen.has(id)||seen.has(plate))throw Error('Confira placa, modelo, ano e duplicidades.');seen.add(id);seen.add(plate);return{id,plate,model,year};});}
let vehicles;try{vehicles=fleetValidate(savedJSON(KEYS.fleet,FLEET_DEMO));}catch{vehicles=FLEET_DEMO;}
let chosen=vehicles[0].id;
let isDemo=false, demoRunning=false, demoFaultCount=0, readings=null, timer=null, ticks=0;
let currentPage='inicio';
let toastTimer;
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=String(text);return n;}
function svg(name){const s=document.createElementNS('http://www.w3.org/2000/svg','svg');const u=document.createElementNS('http://www.w3.org/2000/svg','use');u.setAttribute('href','#i-'+name);s.append(u);return s;}
function notify(message){const t=$('toast');t.textContent=message;t.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('show'),4100);}
function vehicle(){return vehicles.find(x=>x.id===chosen)||vehicles[0];}
function getHistory(){const h=savedJSON(KEYS.history,[]);return Array.isArray(h)?h.slice(0,250):[];}
function normalizeHistory(h){if(!h||typeof h!=='object')return null;const demo=String(h.mode||'').toUpperCase().includes('SIMUL')||String(h.mode||'').toUpperCase().includes('DEMONSTR');return{id:String(h.id||'legado'),date:String(h.date||new Date().toISOString()),plate:String(h.plate||'-'),model:String(h.model||'-'),year:h.year||'',vehicleId:h.vehicleId||'',mode:demo?'DEMONSTRAÇÃO':'REGISTRO MANUAL',state:demo?'Dados fictícios':'Sem leitura eletrônica',faults:demo&&Array.isArray(h.faults)?h.faults:[],modules:demo&&Array.isArray(h.modules)?h.modules:[],readings:demo&&h.readings?h.readings:null,technician:String(h.technician||''),notes:String(h.notes||''),serviceKind:String(h.serviceKind||'Inspeção e registro')};}
function readForm(){return{technician:$('technician').value.trim().slice(0,80),notes:$('notes').value.trim().slice(0,1200),serviceKind:$('service-kind').value};}
function selectedReport(){const v=vehicle(),form=readForm();const faults=isDemo?DEMO_FAULTS.slice(0,demoFaultCount):[];return{id:'MBLOG-'+Date.now(),date:new Date().toISOString(),plate:v.plate,model:v.model,year:v.year,vehicleId:v.id,mode:isDemo?'DEMONSTRAÇÃO':'REGISTRO MANUAL',state:isDemo?(demoRunning?'Demonstração ativa':'Demonstração sem leitura'):'Sem interface eletrônica',faultCount:faults.length,faults,modules:isDemo&&readings?MODULES.map(m=>({name:m.name,state:faults.some(f=>f.module===m.id)?'Alerta fictício':'Simulado - OK'})):[],readings:isDemo&&readings?{...readings}:null,...form};}
function navigate(name){if(!HEADINGS[name])return;currentPage=name;document.querySelectorAll('[data-view]').forEach(b=>{const act=b.dataset.view===name;b.classList.toggle('active',act);b.setAttribute('aria-current',act?'page':'false');});document.querySelectorAll('section.page').forEach(p=>{const show=p.dataset.page===name;p.hidden=!show;p.classList.toggle('active',show);});$('page-heading').textContent=HEADINGS[name][0];$('top-page-name').textContent=HEADINGS[name][0];$('page-description').textContent=HEADINGS[name][1];scrollTo({top:0,behavior:'instant'});}
function renderFleet(){const v=vehicle();const sel=$('vehicle-select');sel.replaceChildren();for(const item of vehicles){const opt=el('option','',`${item.plate} · ${item.model}`);opt.value=item.id;sel.append(opt);}sel.value=chosen;$('stat-fleet').textContent=vehicles.length;$('overview-vehicle').replaceChildren();const ico=el('span','vehicle-symbol');ico.append(svg('truck'));const cont=el('span');cont.append(el('strong','',v.model),el('small','plate',v.plate),el('small','',`Ano/modelo ${v.year} · Cadastro ${v.id}`));$('overview-vehicle').append(ico,cont);$('preview-plate').textContent=v.plate;$('preview-model').textContent=v.model;}
function format(v,dec=0){if(v===null||v===undefined)return '—';return Number(v).toLocaleString('pt-BR',{maximumFractionDigits:dec,minimumFractionDigits:dec});}
function simulatedReading(){ticks++;const j=Math.max(0,vehicles.findIndex(v=>v.id===chosen));const k=ticks*7+j*17;return{rpm:700+k%430,temp:77+k%14,voltage:Math.round((27.1+(k%12)/10)*10)/10,fuel:55+k%31,speed:0,odometer:100000+j*20349+k%100};}
function renderReadings(){const has=isDemo&&readings!==null;const r=has?readings:{};['rpm','temp','voltage','fuel','speed','odometer'].forEach(n=>$(n).textContent=has?format(r[n],n==='voltage'?1:0):'—');$('fuel-fill').style.width=has?r.fuel+'%':'0%';$('reading-state').textContent=has?'Demonstração · dados fictícios':'Aguardando interface';$('reading-state').classList.toggle('live',has);$('reading-help-title').textContent=has?'Leitura de demonstração':'Nenhuma leitura eletrônica recebida';$('reading-help-copy').textContent=has?'Estes números são fictícios e servem apenas para apresentar a interface. Nenhum caminhão está conectado.':'Nenhum adaptador foi integrado ao sistema. Você pode registrar atendimentos e exportar PDF sem inventar medições.';}
function renderSystems(){const root=$('module-list');root.replaceChildren();const has=isDemo&&readings!==null;const faults=DEMO_FAULTS.slice(0,demoFaultCount);$('module-counter').textContent=has?'8 / 8 demonstrativos':'0 / 8 verificados';for(const m of MODULES){const warning=has&&faults.some(x=>x.module===m.id);const row=el('article','panel system-card');const symbol=el('span','module-icon'+(has?(warning?' demo-warn':' demo-ok'):''));symbol.append(svg(!has?'grid':warning?'alert':'check'));const content=el('div');content.append(el('strong','',m.name),el('small','',m.desc));const state=el('span','system-status'+(has?(warning?' demo-warn':' demo-ok'):''),!has?'Não verificado':warning?'Alerta fictício':'Simulado');row.append(symbol,content,state);root.append(row);}}
function blank(title,desc,ico='plug'){const b=el('div','panel blank-panel');const icon=el('div','blank-icon');icon.append(svg(ico));b.append(icon,el('h3','',title),el('p','',desc));return b;}
function renderFaults(){const root=$('fault-list');root.replaceChildren();const list=isDemo&&readings?DEMO_FAULTS.slice(0,demoFaultCount):[];const query=$('fault-search').value.trim().toLocaleLowerCase('pt-BR');$('fault-count').textContent=!(isDemo&&readings)?'Sem leitura':`${list.length} exemplo(s)`;$('nav-fault-badge').hidden=!list.length;$('nav-fault-badge').textContent=list.length;if(!(isDemo&&readings)){root.append(blank('Nenhuma varredura recebida','Sem interface de diagnóstico conectada. Não é possível confirmar a existência ou ausência de falhas.'));return;}if(!list.length){root.append(blank('Nenhuma falha fictícia adicionada','O modo demonstração está ativo. A ausência de falhas aqui não indica o estado real do veículo.','check'));return;}let found=0;for(const f of list){if(query&&!`${f.code} ${f.module} ${f.description} ${f.cause}`.toLocaleLowerCase('pt-BR').includes(query))continue;found++;const row=el('article','panel fault-card');const symbol=el('span','fault-symbol');symbol.append(svg('alert'));const body=el('div','fault-body');body.append(el('strong','',f.code),el('p','',f.description),el('small','',f.cause));row.append(symbol,body,el('span','risk-badge','EXEMPLO FICTÍCIO'));root.append(row);}if(!found)root.append(blank('Sem resultados','Nenhum exemplo de falha corresponde à sua busca.','search'));}
function renderHistory(){const root=$('history-list');root.replaceChildren();const history=getHistory().map(normalizeHistory).filter(Boolean);$('stat-history').textContent=history.length;$('history-count').textContent=history.length+' registro(s)';if(!history.length){root.append(blank('Nenhum atendimento salvo','Selecione um caminhão, vá até Relatórios, descreva o serviço e toque em “Salvar atendimento”.','history'));return;}for(const h of history.slice(0,50)){const row=el('article','panel history-item');const ico=el('span','history-icon');ico.append(svg('file'));const body=el('div','history-info');let when='Data desconhecida';try{when=new Date(h.date).toLocaleString('pt-BR',{dateStyle:'short',timeStyle:'short'});}catch{}body.append(el('strong','',h.plate+' · '+h.model),el('small','',when+' · '+h.serviceKind),el('span','',h.mode==='DEMONSTRAÇÃO'?'Demonstração fictícia':'Registro manual · sem leitura eletrônica'));const actions=el('div','history-actions');const btn=el('button','','PDF');btn.type='button';btn.prepend(svg('file'));btn.addEventListener('click',()=>exportPDF(h));actions.append(btn);row.append(ico,body,actions);root.append(row);}}
function renderStatus(){const pill=$('connection-pill');pill.classList.toggle('disconnected',true);pill.querySelector('span').textContent='Sem interface';$('device-status-title').textContent='Interface não conectada';$('device-status-text').textContent='Cadastro, atendimento e exportação em PDF disponíveis. A leitura real requer hardware compatível e integração.';$('demo-notice').hidden=!isDemo;$('demo-toggle').checked=isDemo;$('demo-controls').hidden=!isDemo;$('demo-run').textContent=demoRunning?'Pausar demonstração':'Iniciar leitura demonstrativa';$('preview-kind').textContent=isDemo?'DEMONSTRAÇÃO FICTÍCIA':'REGISTRO MANUAL / SEM LEITURA';}
function render(){renderFleet();renderStatus();renderReadings();renderSystems();renderFaults();renderHistory();}
function stopDemo(){if(timer){clearInterval(timer);timer=null;}demoRunning=false;readings=null;demoFaultCount=0;ticks=0;}
function switchVehicle(id){if(!vehicles.some(v=>v.id===id))return;stopDemo();chosen=id;render();}
function demoToggle(value){stopDemo();isDemo=Boolean(value);safeSave(KEYS.demo,isDemo);render();notify(isDemo?'Demonstração opcional ativada. Nenhum caminhão foi conectado.':'Demonstração desativada.');}
function demoRun(){if(!isDemo)return;demoRunning=!demoRunning;if(demoRunning){readings=simulatedReading();timer=setInterval(()=>{readings=simulatedReading();renderReadings();},2400);}else{clearInterval(timer);timer=null;}renderStatus();renderReadings();renderSystems();renderFaults();notify(demoRunning?'Demonstração de parâmetros iniciada.':'Demonstração pausada.');}
function demoFault(){if(!isDemo||!readings){notify('Inicie a demonstração antes de inserir falhas fictícias.');return;}demoFaultCount=demoFaultCount>=DEMO_FAULTS.length?0:demoFaultCount+1;renderSystems();renderFaults();notify(demoFaultCount?`${demoFaultCount} código(s) fictício(s) exibido(s).`:'Exemplos removidos.');}
function saveAttendance(){const report=selectedReport();const rows=getHistory();rows.unshift(report);if(safeSave(KEYS.history,rows.slice(0,250))){renderHistory();notify('Atendimento salvo apenas neste aparelho.');}else notify('Não foi possível salvar no navegador. Exporte um PDF para preservar o atendimento.');}
function exportPDF(entry){if(!window.MBLOGPdf){notify('Gerador PDF indisponível. Atualize a página.');return;}try{window.MBLOGPdf.download(entry||selectedReport());notify('PDF solicitado. Confira a pasta Downloads do celular.');}catch(err){console.error(err);notify('Falha ao gerar PDF. Confira o navegador e tente novamente.');}}
function saveForm(){safeSave(KEYS.form,readForm());}
document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.view)));
$('settings-shortcut').addEventListener('click',()=>navigate('ajustes'));
$('goto-readings').addEventListener('click',()=>navigate('leituras'));
$('goto-reports').addEventListener('click',()=>navigate('relatorios'));
$('overview-config').addEventListener('click',()=>navigate('ajustes'));
$('overview-change').addEventListener('click',()=>{$('vehicle-select').focus();$('vehicle-select').click();});
$('reading-settings').addEventListener('click',()=>navigate('ajustes'));
$('vehicle-select').addEventListener('change',ev=>switchVehicle(ev.target.value));
$('fault-search').addEventListener('input',renderFaults);
$('fault-report').addEventListener('click',()=>exportPDF());
$('pdf-button').addEventListener('click',()=>exportPDF());
$('save-button').addEventListener('click',saveAttendance);
$('import-button').addEventListener('click',()=>$('import-file').click());
$('import-file').addEventListener('change',async ev=>{const f=ev.target.files?.[0];if(!f)return;try{if(f.size>1000000)throw Error('Arquivo acima de 1 MB.');const incoming=fleetValidate(JSON.parse(await f.text()));if(!safeSave(KEYS.fleet,incoming))throw Error('Armazenamento local bloqueado.');vehicles=incoming;chosen=vehicles[0].id;stopDemo();render();navigate('inicio');notify(`${vehicles.length} caminhão(ões) importado(s) somente neste celular.`);}catch(err){notify('Não foi possível importar: '+err.message);}ev.target.value='';});
$('restore-button').addEventListener('click',()=>{if(!confirm('Restaurar os nove registros iniciais sem placas reais? O histórico será mantido.'))return;try{localStorage.removeItem(KEYS.fleet);}catch{}vehicles=FLEET_DEMO;chosen=vehicles[0].id;stopDemo();render();notify('Cadastro inicial restaurado.');});
$('demo-toggle').addEventListener('change',ev=>demoToggle(ev.target.checked));
$('demo-close').addEventListener('click',()=>demoToggle(false));
$('demo-run').addEventListener('click',demoRun);
$('demo-fault').addEventListener('click',demoFault);
$('demo-reset').addEventListener('click',()=>{stopDemo();render();notify('Dados fictícios limpos.');});
$('clear-history').addEventListener('click',()=>{if(!confirm('Apagar definitivamente o histórico salvo neste dispositivo?'))return;try{localStorage.removeItem(KEYS.history);}catch{}renderHistory();notify('Histórico local apagado.');});
const prevForm=savedJSON(KEYS.form,savedJSON('mblog-scanner-operator-v2',{}));
$('technician').value=String(prevForm?.technician||'');$('notes').value=String(prevForm?.notes||'');
$('service-kind').value=String(prevForm?.serviceKind||'Inspeção e registro');
['technician','notes','service-kind'].forEach(id=>$(id).addEventListener('input',saveForm));
render();navigate('inicio');
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('./sw.js?v=3.0.0').catch(()=>{});
