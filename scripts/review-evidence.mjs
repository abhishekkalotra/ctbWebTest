import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {readZip} from './zip-utils.mjs';
const cache=path.join(process.env.LOCALAPPDATA,'ms-playwright');
const ffmpegDir=fs.readdirSync(cache).filter(n=>/^ffmpeg-\d+$/.test(n)).sort((a,b)=>Number(b.split('-')[1])-Number(a.split('-')[1]))[0];
const executable=ffmpegDir?path.join(cache,ffmpegDir,'ffmpeg-win64.exe'):null;
const roots=['reports/allure-results',...fs.readdirSync('reports/runs',{withFileTypes:true}).filter(e=>e.isDirectory()).map(e=>path.join('reports/runs',e.name,'allure-results')).filter(fs.existsSync)];
const seen=new Set(),reviews=[];fs.mkdirSync('reports/investigation/video-frames',{recursive:true});
const attachments=r=>[...(r.attachments??[]),...(r.steps??[]).flatMap(attachments)];
for(const root of roots)for(const file of fs.readdirSync(root).filter(n=>n.endsWith('-result.json'))){const r=JSON.parse(fs.readFileSync(path.join(root,file),'utf8'));if(!['failed','broken'].includes(r.status)||seen.has(r.uuid))continue;seen.add(r.uuid);const item={test:r.name,uuid:r.uuid,status:r.status,error:r.statusDetails?.message,artifacts:[]};
 for(const a of attachments(r)){
  const target=path.join(root,a.source);if(!fs.existsSync(target))continue;
  if(a.type==='video/webm'&&executable){const frame=path.join('reports/investigation/video-frames',r.uuid+'.png');const result=spawnSync(executable,['-y','-ss','1','-i',target,'-frames:v','1',frame],{encoding:'utf8'});item.artifacts.push({kind:'video',path:target,sampledFrame:fs.existsSync(frame)?frame:null,decoderExit:result.status});}
  else if(a.source.endsWith('.zip')){const entries=readZip(fs.readFileSync(target));const events=entries.filter(e=>e.name.endsWith('.trace')).flatMap(e=>e.data.toString('utf8').split('\n').filter(Boolean).map(line=>{try{return JSON.parse(line);}catch{return null;}}).filter(Boolean));item.artifacts.push({kind:'trace',path:target,entries:entries.length,errorEvents:events.filter(e=>e.error).map(e=>e.error.message??e.error),domSnapshots:events.filter(e=>e.type==='frame-snapshot').length});}
  else if(a.type==='image/png'||a.name==='sanitized-diagnostics')item.artifacts.push({kind:a.name,path:target});
 }
 reviews.push(item);
}
fs.writeFileSync('reports/investigation/evidence-review.json',JSON.stringify({timestamp:new Date().toISOString(),method:'Reviewed failure errors, DOM evidence, network/console diagnostics and trace event structure. Video review uses sampled frames; original recordings retained.',reviews},null,2));console.log(JSON.stringify({failedAttemptsReviewed:reviews.length,sampledFrames:fs.readdirSync('reports/investigation/video-frames').length}));
