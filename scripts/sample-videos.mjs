import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {resultAttachments} from './report-model.mjs';

const cache = path.join(process.env.LOCALAPPDATA, 'ms-playwright');
const revision = fs.readdirSync(cache).filter((name) => /^ffmpeg-\d+$/.test(name))
  .sort((a, b) => Number(b.split('-')[1]) - Number(a.split('-')[1]))[0];
if (!revision) throw new Error('Install the current Playwright video encoder/decoder first.');
const decoder = path.join(cache, revision, 'ffmpeg-win64.exe');
const roots = ['reports/allure-results', ...fs.readdirSync('reports/runs', {withFileTypes: true})
  .filter((entry) => entry.isDirectory()).map((entry) => path.join('reports/runs', entry.name, 'allure-results')).filter(fs.existsSync)];
const videos = new Map();
for (const root of roots) for (const file of fs.readdirSync(root).filter((name) => name.endsWith('-result.json'))) {
  const result = JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
  for (const attachment of resultAttachments(result)) if (attachment.type === 'video/webm') {
    videos.set(attachment.source, {source: path.join(root, attachment.source), test: result.name,
      project: result.labels.find((label) => label.name === 'parentSuite')?.value});
  }
}
const output = 'reports/investigation/reviewed-video-frames';
fs.mkdirSync(output, {recursive: true});
const samples = [];
for (const [name, video] of videos) {
  const probe = spawnSync(decoder, ['-i', video.source], {encoding: 'utf8'});
  const duration = probe.stderr?.match(/Duration: (\d+):(\d+):(\d+(?:\.\d+)?)/);
  const item = {...video, decoder: revision, samples: []};
  if (!duration) {item.error = 'Decoder did not return a duration'; samples.push(item); continue;}
  item.duration = Number(duration[1]) * 3600 + Number(duration[2]) * 60 + Number(duration[3]);
  for (const [index, time] of [item.duration * 0.5, Math.max(0, item.duration - 0.3)].entries()) {
    const frame = `${output}/${name.replace('.webm', '')}-decoded-${index}.png`;
    const decoded = spawnSync(decoder, ['-y', '-ss', String(time), '-i', video.source, '-frames:v', '1', frame], {encoding: 'utf8'});
    if (decoded.status === 0 && fs.existsSync(frame)) item.samples.push({timeSeconds: time, frame});
    else item.error = decoded.stderr?.slice(-500) ?? decoded.error?.message;
  }
  samples.push(item);
}
fs.writeFileSync('reports/investigation/video-sample-review.json', JSON.stringify({timestamp: new Date().toISOString(),
  method: 'Native VP9 decoding at midpoint and near the end. Sampled review is not continuous video viewing. Older cached VP8-only decoders and browser-frame capture were unsuitable; original recordings were not modified.', samples}, null, 2));
console.log(JSON.stringify(samples.map((item) => ({test: item.test, project: item.project, duration: item.duration, frames: item.samples.length, error: item.error}))));
