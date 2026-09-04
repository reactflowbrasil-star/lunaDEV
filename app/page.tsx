"use client";
import {useMemo,useRef,useState} from "react";
import {ArrowLeft,ArrowRight,Check,Clapperboard,Clock3,Copy,Download,Film,GripVertical,Home as HomeIcon,ImagePlus,LayoutGrid,Menu,MoreHorizontal,Play,Plus,RefreshCw,Search,Settings,Sparkles,UploadCloud,UserRound,WandSparkles,X,Zap} from "lucide-react";

type Scene={id:number;tag:string;title:string;text:string;sec:number;cost:number};
const baseScenes:Scene[]=[
 {id:1,tag:"HOOK",title:"O detalhe que muda tudo",text:"Close no produto e reação natural para prender a atenção.",sec:3,cost:8},
 {id:2,tag:"APRESENTAÇÃO",title:"Conheça o produto",text:"A pessoa selecionada apresenta o produto em um ambiente cotidiano.",sec:4,cost:8},
 {id:3,tag:"DEMONSTRAÇÃO",title:"Produto em uso",text:"Uso real preservando embalagem, cores e proporções.",sec:5,cost:10},
 {id:4,tag:"ENCERRAMENTO",title:"Convite final",text:"Fala natural em português brasileiro e CTA verbal.",sec:3,cost:8}
];
const talents=[
 {name:"Ana",gender:"Feminino",style:"Creator UGC",age:"25 anos",look:"brasileira, cabelo castanho longo, expressão calorosa",photo:"/models/ana.jpg"},
 {name:"Bruna",gender:"Feminino",style:"Lifestyle",age:"28 anos",look:"loira, olhos claros, visual clean e sofisticado",photo:"/models/bruna.jpg"},
 {name:"Carla",gender:"Feminino",style:"Premium",age:"32 anos",look:"morena, sorriso natural, presença elegante",photo:"/models/carla.jpg"},
 {name:"Daniela",gender:"Feminino",style:"Beauty",age:"27 anos",look:"castanha, pele luminosa, estética beauty editorial",photo:"/models/daniela.jpg"},
 {name:"Lucas",gender:"Masculino",style:"Creator UGC",age:"28 anos",look:"brasileiro, cabelo escuro, barba leve, sorriso confiante",photo:"/models/lucas.jpg"},
 {name:"Rafael",gender:"Masculino",style:"Lifestyle",age:"32 anos",look:"moreno, barba curta, visual urbano sofisticado",photo:"/models/rafael.jpg"},
 {name:"Bruno",gender:"Masculino",style:"Premium",age:"27 anos",look:"cabelo castanho ondulado, aparência jovem, editorial premium",photo:"/models/bruno.jpg"},
 {name:"Felipe",gender:"Masculino",style:"Editorial",age:"30 anos",look:"cabelo curto, barba marcada, expressão séria e sofisticada",photo:"/models/felipe.jpg"}
];
const formats=["Vídeo UGC","Review de produto","Unboxing","Demonstração","Lifestyle","Comercial cinematográfico"];

export default function Home(){
 const [view,setView]=useState<"home"|"wizard"|"history"|"settings">("home"),[step,setStep]=useState(1);
 const [img,setImg]=useState<string|null>(null),[name,setName]=useState(""),[message,setMessage]=useState("");
 const [generating,setGenerating]=useState(false),[resultImages,setResultImages]=useState<string[]>([]),[videoPrompt,setVideoPrompt]=useState("");
 const [brief,setBrief]=useState(""),[talent,setTalent]=useState(0),[format,setFormat]=useState(formats[0]),[ratio,setRatio]=useState("9:16"),[duration,setDuration]=useState("15s"),[scenes,setScenes]=useState(baseScenes);
 const input=useRef<HTMLInputElement>(null),total=useMemo(()=>scenes.reduce((a,s)=>a+s.cost,0),[scenes]);
 const start=()=>{setView("wizard");setStep(1);setMessage("")};
 const pick=(file?:File)=>{if(!file)return;if(!/image\/(jpeg|png|webp)/.test(file.type)){setMessage("Envie uma imagem JPG, PNG ou WEBP.");return}if(file.size>10485760){setMessage("A imagem deve ter no máximo 10 MB.");return}setImg(URL.createObjectURL(file));setName(file.name);setMessage("")};
 const next=()=>{if(step===1&&!img){setMessage("Envie ao menos uma foto do produto para continuar.");return}setStep(Math.min(5,step+1));setMessage("")};
 const move=(i:number,d:number)=>{let t=i+d;if(t<0||t>=scenes.length)return;let c=[...scenes];[c[i],c[t]]=[c[t],c[i]];setScenes(c)};
 const generate=async()=>{
  if(!img||generating)return;
  setGenerating(true);setMessage("Criando imagens-base e prompt do vídeo no seu dispositivo…");setResultImages([]);setVideoPrompt("");
  try{
   const selectedTalent=talents[talent];
   const frames=await Promise.all(scenes.map((scene,index)=>createLocalFrame(img,selectedTalent.photo,ratio,index,scene.tag)));
   const direction=scenes.map((s,i)=>`Cena ${i+1} (${s.sec}s) — ${s.tag}: ${s.title}. ${s.text}`).join("\n");
   const prompt=[
    `Crie um vídeo publicitário no formato ${format}, proporção ${ratio}, duração total aproximada de ${duration}.`,
    "Use a imagem do produto enviada como referência visual principal. Preserve com máxima fidelidade embalagem, logotipo, cores, rótulo, formato e proporções do produto.",
    `Pessoa selecionada: ${selectedTalent.name}, ${selectedTalent.gender.toLowerCase()}, ${selectedTalent.age}, ${selectedTalent.style}; aparência: ${selectedTalent.look}. Mantenha exatamente a mesma identidade facial, cabelo, tom de pele e características em todas as cenas.`,
    `Briefing da campanha: ${brief.trim()||"produto em destaque, comunicação premium, natural e persuasiva"}.`,
    "",
    "ROTEIRO E DIREÇÃO DE CENA:",
    direction,
    "",
    "DIREÇÃO VISUAL: aparência fotorealista, iluminação cinematográfica suave, anatomia correta, pele e movimentos humanos naturais, profundidade de campo realista. A pessoa deve segurar, usar ou interagir fisicamente com o produto de forma plausível; mãos e dedos anatomicamente corretos. Produto sempre legível e visualmente consistente entre todas as cenas. Alterne close, plano médio e detalhe do produto. Movimentos de câmera suaves, sem deformações e sem trocar a identidade visual da embalagem.",
    "ÁUDIO: fala natural exclusivamente em português brasileiro, voz humana convincente, sincronização labial precisa quando a pessoa aparecer falando, trilha discreta e efeitos sonoros sutis.",
    "RESTRIÇÕES OBRIGATÓRIAS: não exibir textos, legendas, captions, preços, títulos, marcas d'água, interfaces, botões ou qualquer elemento tipográfico gerado na imagem. Não alterar o logotipo original do produto. Não inventar informações sobre o produto.",
    "FINALIZAÇÃO: ritmo moderno para redes sociais, primeiro gancho visual forte nos 3 segundos iniciais e encerramento limpo com foco no produto."
   ].join("\n");
   setResultImages(frames);setVideoPrompt(prompt);setMessage("Kit criativo pronto — gerado localmente, sem API e sem chave externa.");
  }catch(error){setMessage(error instanceof Error?error.message:"Não foi possível montar o kit criativo.");}
  finally{setGenerating(false);}
 };
 return <div className="shell">
  <aside><button className="logo" onClick={()=>setView("home")}><b><Sparkles/></b>luna<span>DEV</span></button><nav>
   <button className={view==="home"?"on":""} onClick={()=>setView("home")}><HomeIcon/>Início</button>
   <button className={view==="wizard"?"on":""} onClick={start}><WandSparkles/>Criar campanha</button>
   <button className={view==="history"?"on":""} onClick={()=>setView("history")}><LayoutGrid/>Minhas campanhas</button>
  </nav><div className="sidefoot"><div className="credit"><div><Zap/>Modo local</div><strong>∞</strong><small>gerações locais ilimitadas</small><i><b/></i></div><button onClick={()=>setView("settings")}><Settings/>Configurações</button><div className="profile"><b>AL</b><span><strong>Alexandre Lima</strong><small>Plano Creator</small></span><MoreHorizontal/></div></div></aside>
  <main><header><button className="logo"><b><Sparkles/></b>luna<span>DEV</span></button><Menu/></header>
   {view==="home"&&<Dashboard start={start} history={()=>setView("history")}/>}
   {view==="history"&&<History start={start}/>}
   {view==="settings"&&<SettingsPanel/>}
   {view==="wizard"&&<section className="wizard"><div className="wizhead"><button onClick={()=>step===1?setView("home"):setStep(step-1)}><ArrowLeft/></button><div><span>NOVA CAMPANHA</span><h1>{["Seu produto","Briefing inteligente","Escolha a pessoa","Formato do conteúdo","Revise o storyboard"][step-1]}</h1></div><strong>{step}<small>/5</small></strong></div><div className="progress">{[1,2,3,4,5].map(n=><i className={n<=step?"done":""} key={n}/>)}</div>
    {step===1&&<Product img={img} name={name} input={input} pick={pick} remove={()=>{setImg(null);setName("")}}/>}
    {step===2&&<Brief brief={brief} setBrief={setBrief}/>}
    {step===3&&<Talent selected={talent} select={setTalent}/>}
    {step===4&&<Format format={format} setFormat={setFormat} ratio={ratio} setRatio={setRatio} duration={duration} setDuration={setDuration}/>}
    {step===5&&<Storyboard scenes={scenes} setScenes={setScenes} move={move} total={total} talent={talents[talent].name} format={format} ratio={ratio} duration={duration}/>}
    {resultImages.length>0&&<LocalResults images={resultImages} prompt={videoPrompt}/>} 
    {message&&<div className={resultImages.length?"success notice":"notice"}>{generating&&<i className="spinner"/>}{message}</div>}<div className="actions"><button className="secondary" onClick={()=>step===1?setView("home"):setStep(step-1)}>Voltar</button>{step<5?<button className="primary" onClick={next}>Continuar<ArrowRight/></button>:<button className="primary" disabled={generating} onClick={generate}><Sparkles/>{generating?"Montando kit…":"Gerar imagens + prompt"}</button>}</div>
   </section>}
  </main><nav className="mobileNav"><button className={view==="home"?"active":""} onClick={()=>setView("home")}><HomeIcon/>Início</button><button className="new" onClick={start}><Plus/></button><button className={view==="history"?"active":""} onClick={()=>setView("history")}><LayoutGrid/>Campanhas</button><button className={view==="settings"?"active":""} onClick={()=>setView("settings")}><Settings/>Configurações</button></nav>
 </div>
}

function Dashboard({start,history}:{start:()=>void;history:()=>void}){return <section className="dashboard"><div className="hello"><div><span>ESTÚDIO CRIATIVO COM IA</span><h1>Olá, Alexandre <b>✦</b></h1><p>Transforme uma foto de produto em imagens-base e um prompt completo de vídeo, sem API.</p></div><button className="primary desk" onClick={start}><Plus/>Criar nova campanha</button></div>
 <button className="hero" onClick={start}><div className="spark"><Sparkles/></div><div><span>COMECE POR AQUI</span><h2>Crie sua próxima campanha</h2><p>Envie o produto. A Luna monta localmente as imagens-base, o roteiro e o prompt completo do vídeo.</p><strong>Criar agora <ArrowRight/></strong></div><div className="phone"><i>UGC</i><div><UserRound/><Play/></div><b>9:16 · 15s</b></div></button>
 <div className="sectionTitle"><div><h2>Campanhas recentes</h2><p>Continue de onde parou.</p></div><button onClick={history}>Ver todas <ArrowRight/></button></div><div className="grid"><Campaign title="Glow Serum" meta="Vídeo UGC · 15s" status="Concluído" color="peach"/><Campaign title="Urban Sneakers" meta="Lifestyle · 30s" status="Processando 64%" color="blue"/><Campaign title="Café Origem" meta="Produto premium · 15s" status="Rascunho" color="brown"/></div>
 <div className="tip"><Sparkles/><div><strong>Dica da Luna</strong><p>Comece com um gancho visual forte nos primeiros três segundos.</p></div><button onClick={start}>Criar em 9:16</button></div></section>}
function Campaign({title,meta,status,color}:{title:string;meta:string;status:string;color:string}){return <article className="campaign"><div className={"art "+color}><button><Play/></button><span>{status}</span></div><div><h3>{title}</h3><p>{meta}</p><MoreHorizontal/></div></article>}
function Product({img,name,input,pick,remove}:any){return <Panel><Intro title="Mostre o produto para a Luna" text="Use uma foto nítida, bem iluminada e sem objetos cobrindo a embalagem."/><input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e:any)=>pick(e.target.files?.[0])}/>{!img?<button className="drop" onClick={()=>input.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();pick(e.dataTransfer.files[0])}}><b><UploadCloud/></b><strong>Arraste uma foto ou toque para enviar</strong><small>JPG, PNG ou WEBP · máximo 10 MB</small><span>Escolher imagem</span></button>:<div className="uploaded"><img src={img} alt="Produto enviado"/><div><Check/><span><strong>Imagem pronta</strong><small>{name}</small></span><button onClick={remove}><X/></button></div></div>}<p className="privacy"><Check/>Sua imagem será usada apenas para criar esta campanha.</p></Panel>}
function Brief({brief,setBrief}:any){return <Panel><div className="analysis"><b><Sparkles/></b><div><span>ANÁLISE SUGERIDA</span><h3>Produto de beleza · visual clean e luminoso</h3><p>Público sugerido: pessoas de 20 a 40 anos interessadas em autocuidado. Ambiente: bancada clara com luz natural.</p></div><button><RefreshCw/>Nova sugestão</button></div><label className="field"><span>Conte um pouco sobre o produto <em>opcional</em></span><textarea value={brief} onChange={e=>setBrief(e.target.value)} placeholder="Ex.: Sérum vegano, textura leve, ideal para rotina noturna..."/><small>As informações escritas por você sempre têm prioridade.</small></label><div className="fields">{[["Estilo","Natural e sofisticado"],["Público","20–40 anos"],["Conceito","Brilho que nasce do cuidado"],["Ambiente","Banheiro moderno e claro"]].map(x=><label key={x[0]}><span>{x[0]}</span><input defaultValue={x[1]}/></label>)}</div></Panel>}
function Talent({selected,select}:any){
 const [gender,setGender]=useState<"Todos"|"Feminino"|"Masculino">("Todos"),[query,setQuery]=useState("");
 const visible=talents.map((t,i)=>({...t,index:i})).filter(t=>(gender==="Todos"||t.gender===gender)&&t.name.toLowerCase().includes(query.toLowerCase()));
 return <Panel><Intro title="Escolha uma pessoa realista" text="Selecione um modelo feminino ou masculino para aparecer com o produto em toda a campanha."/><div className="modelTools"><div className="modelTabs">{["Todos","Feminino","Masculino"].map(g=><button className={gender===g?"active":""} onClick={()=>setGender(g as any)} key={g}>{g}</button>)}</div><label className="modelSearch"><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar modelos..."/></label></div><div className="modelGallery">{visible.map(t=><button className={selected===t.index?"selected":""} onClick={()=>select(t.index)} key={t.name}><div className="modelPhoto"><img src={t.photo} alt={t.name} onError={e=>{e.currentTarget.onerror=null;e.currentTarget.src="/models/carla.jpg"}}/>{selected===t.index&&<i><Check/></i>}</div><strong>{t.name}</strong><small>{t.gender} · {t.age}</small><em>{t.style}</em></button>)}</div><div className="info"><UserRound/><p><strong>Consistência de identidade ativada</strong>A pessoa escolhida será incluída nas imagens-base e descrita detalhadamente no prompt para manter rosto, cabelo e aparência consistentes.</p></div></Panel>
}
function Format(p:any){return <Panel><Choice title="Tipo de vídeo"><div className="formats">{formats.map(f=><button className={p.format===f?"selected":""} onClick={()=>p.setFormat(f)} key={f}><Clapperboard/>{f}{p.format===f&&<Check/>}</button>)}</div></Choice><Choice title="Proporção"><div className="ratios">{[["9:16","TikTok, Reels e Shorts"],["1:1","Feed quadrado"],["4:5","Feed Instagram"],["16:9","YouTube e horizontal"]].map(r=><button className={p.ratio===r[0]?"selected":""} onClick={()=>p.setRatio(r[0])} key={r[0]}><i className={"r"+r[0].replace(":","")}/><span><strong>{r[0]}</strong><small>{r[1]}</small></span>{r[0]==="9:16"&&<em>RECOMENDADO</em>}</button>)}</div></Choice><Choice title="Duração"><div className="durations">{["15s","30s","60s"].map(d=><button className={p.duration===d?"selected":""} onClick={()=>p.setDuration(d)} key={d}><Clock3/><strong>{d}</strong><small>{d==="15s"?"Rápido e direto":d==="30s"?"Mais detalhes":"História completa"}</small></button>)}</div></Choice></Panel>}
function Storyboard(p:any){return <div className="story"><div><Intro title="Seu vídeo, cena por cena" text="Revise a direção criativa antes de gerar o kit local." left/>{p.scenes.map((s:Scene,i:number)=><article className="scene" key={s.id}><div><GripVertical/><span>{String(i+1).padStart(2,"0")}</span></div><figure><Film/><small>{s.sec}s</small></figure><section><span>{s.tag}</span><h3>{s.title}</h3><p>{s.text}</p></section><footer><small>{s.sec}s</small><button onClick={()=>p.move(i,-1)}>↑</button><button onClick={()=>p.move(i,1)}>↓</button><button onClick={()=>p.setScenes(p.scenes.filter((x:Scene)=>x.id!==s.id))}><X/></button></footer></article>)}<button className="add" onClick={()=>p.setScenes([...p.scenes,{id:Date.now(),tag:"NOVA CENA",title:"Cena adicional",text:"Defina a ação e o enquadramento.",sec:3,cost:8}])}><Plus/>Adicionar cena</button></div><Summary {...p}/></div>}
function Summary(p:any){return <div className="summary"><h3>Resumo da campanha</h3><dl>{[["Modelo",p.talent],["Formato",p.format],["Proporção",p.ratio],["Duração",p.duration],["Idioma","Português (Brasil)"]].map(x=><div key={x[0]}><dt>{x[0]}</dt><dd>{x[1]}</dd></div>)}</dl><div className="clean"><Check/><span><strong>Modo local</strong><small>Sem API, sem chave e sem créditos</small></span></div><div className="total"><span>Saída</span><strong>{p.scenes?.length||4} <small>imagens-base</small></strong><p>+ prompt final completo para geração do vídeo.</p></div></div>}
function History({start}:{start:()=>void}){return <section className="dashboard"><div className="hello"><div><span>BIBLIOTECA CRIATIVA</span><h1>Minhas campanhas</h1><p>Gerencie vídeos, rascunhos e variações.</p></div><button className="primary" onClick={start}><Plus/>Nova campanha</button></div><div className="filters"><label><Search/><input placeholder="Buscar campanha"/></label><button>Todos os status</button><button>Mais recentes</button></div><div className="grid four"><Campaign title="Glow Serum" meta="Vídeo UGC · 15s · Hoje" status="Concluído" color="peach"/><Campaign title="Urban Sneakers" meta="Lifestyle · 30s · Hoje" status="Processando 64%" color="blue"/><Campaign title="Café Origem" meta="Produto premium · Ontem" status="Rascunho" color="brown"/><Campaign title="Bolsa Aura" meta="Comercial · 15s · 28 ago" status="Concluído" color="purple"/></div></section>}
function SettingsPanel(){
 return <section className="dashboard settingsPage"><div className="hello"><div><span>CONFIGURAÇÕES</span><h1>Modo local</h1><p>A Luna funciona sem API externa para criar o storyboard, as imagens-base e o prompt de vídeo.</p></div></div><div className="settingsCard"><div className="connection connected"><i/><div><strong>Modo local ativo</strong><p>Nenhuma API Key é necessária. O processamento criativo acontece no navegador.</p></div></div><div className="info"><Sparkles/><p><strong>Como funciona</strong>A foto enviada é usada para montar quadros visuais locais. A Luna também cria um prompt completo para você usar no gerador de vídeo de sua preferência.</p></div></div></section>
}

function LocalResults({images,prompt}:{images:string[];prompt:string}){
 const [copied,setCopied]=useState(false);
 const copy=async()=>{await navigator.clipboard.writeText(prompt);setCopied(true);setTimeout(()=>setCopied(false),1400)};
 return <div className="localResults"><div className="resultHead"><div><span>KIT CRIATIVO LOCAL</span><h2>Imagens-base + prompt do vídeo</h2></div><strong><Check/> Sem API</strong></div><div className="frameGrid">{images.map((src,i)=><figure key={src}><img src={src} alt={`Quadro ${i+1} da campanha`}/><figcaption><span>Cena {String(i+1).padStart(2,"0")}</span><a href={src} download={`luna-cena-${i+1}.png`}><Download/>Baixar</a></figcaption></figure>)}</div><div className="promptBox"><div><span>PROMPT FINAL DO VÍDEO</span><button onClick={copy}><Copy/>{copied?"Copiado":"Copiar prompt"}</button></div><textarea readOnly value={prompt}/></div></div>
}

async function createLocalFrame(source:string,modelSource:string,ratio:string,index:number,label:string){
 const dimensions:Record<string,[number,number]>={"9:16":[720,1280],"1:1":[1080,1080],"4:5":[1080,1350],"16:9":[1280,720]};
 const [w,h]=dimensions[ratio]||dimensions["9:16"];
 const [image,model]=await Promise.all([loadImage(source),loadImage(modelSource)]),canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
 const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Seu navegador não suporta a geração local de imagens.");
 const gradients=[["#f5efe9","#d8c8f2"],["#ece8ff","#d9eef7"],["#f7eadf","#efe3cf"],["#e9f3ef","#d3e7df"]];
 const [a,b]=gradients[index%gradients.length],g=ctx.createLinearGradient(0,0,w,h);g.addColorStop(0,a);g.addColorStop(1,b);ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 ctx.save();ctx.globalAlpha=.11;ctx.fillStyle="#6d28d9";ctx.beginPath();ctx.arc(w*.78,h*.18,Math.min(w,h)*.28,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.save();const mScale=Math.max((w*.52)/model.width,(h*.82)/model.height),mdw=model.width*mScale,mdh=model.height*mScale,mx=index%2===0?w*.42:w*.06,my=(h-mdh)/2;ctx.globalAlpha=.96;ctx.drawImage(model,mx,my,mdw,mdh);const fade=ctx.createLinearGradient(0,h*.58,0,h);fade.addColorStop(0,"rgba(255,255,255,0)");fade.addColorStop(1,"rgba(255,255,255,.38)");ctx.fillStyle=fade;ctx.fillRect(0,h*.58,w,h*.42);ctx.restore();
 const maxW=w*(index%2===0?.62:.52),maxH=h*(index%3===0?.58:.48),scale=Math.min(maxW/image.width,maxH/image.height);
 const dw=image.width*scale,dh=image.height*scale,x=(w-dw)/2+(index===1?w*.06:index===2?-w*.05:0),y=(h-dh)/2+(index===0?h*.03:index===3?-h*.04:0);
 ctx.save();ctx.shadowColor="rgba(35,20,55,.28)";ctx.shadowBlur=Math.max(24,w*.035);ctx.shadowOffsetY=Math.max(12,h*.015);ctx.drawImage(image,x,y,dw,dh);ctx.restore();
 ctx.fillStyle="rgba(255,255,255,.75)";ctx.beginPath();ctx.roundRect(w*.055,h*.055,w*.2,Math.max(36,h*.038),18);ctx.fill();
 ctx.fillStyle="#5b21b6";ctx.font=`700 ${Math.max(18,Math.floor(w*.018))}px Arial`;ctx.fillText(label,w*.075,h*.082);
 return canvas.toDataURL("image/png",.95);
}

function loadImage(src:string){return new Promise<HTMLImageElement>((resolve,reject)=>{const image=new Image();let retried=false;image.onload=()=>resolve(image);image.onerror=()=>{if(!retried&&src.startsWith("/models/")){retried=true;image.src="/models/carla.jpg";return}reject(new Error("Não foi possível processar a imagem enviada."))};image.src=src})}

function Panel({children}:{children:React.ReactNode}){return <div className="panel">{children}</div>}function Intro({title,text,left}:{title:string;text:string;left?:boolean}){return <div className={"intro "+(left?"left":"")}><h2>{title}</h2><p>{text}</p></div>}function Choice({title,children}:{title:string;children:React.ReactNode}){return <div className="choice"><label>{title}</label>{children}</div>}
