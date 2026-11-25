import {crc32,deflateRawSync,inflateRawSync} from 'node:zlib';

// Small ZIP32 helper for explicit QA artifact manifests. ZIP64 is deliberately rejected.
export function readZip(buffer){
 let end=-1;for(let i=buffer.length-22;i>=Math.max(0,buffer.length-65557);i--)if(buffer.readUInt32LE(i)===0x06054b50){end=i;break;}
 if(end<0)throw new Error('ZIP end directory missing');
 const count=buffer.readUInt16LE(end+10);let offset=buffer.readUInt32LE(end+16);const entries=[];
 for(let i=0;i<count;i++){
  if(buffer.readUInt32LE(offset)!==0x02014b50)throw new Error('Invalid ZIP directory');
  const method=buffer.readUInt16LE(offset+10),crc=buffer.readUInt32LE(offset+16),size=buffer.readUInt32LE(offset+20),length=buffer.readUInt16LE(offset+28),extra=buffer.readUInt16LE(offset+30),comment=buffer.readUInt16LE(offset+32),local=buffer.readUInt32LE(offset+42);
  const name=buffer.subarray(offset+46,offset+46+length).toString('utf8');
  const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28);
  const packed=buffer.subarray(start,start+size);const data=method===0?packed:method===8?inflateRawSync(packed):null;
  if(!data||crc32(data)!==crc)throw new Error('Unsupported or corrupt ZIP entry: '+name);
  entries.push({name,data});offset+=46+length+extra+comment;
 }
 return entries;
}
export function writeZip(entries){
 if(entries.length>=65535)throw new Error('ZIP64 required');
 const chunks=[],directory=[];let offset=0;
 for(const {name,data} of entries){
  if(name.startsWith('/')||name.split('/').includes('..'))throw new Error('Unsafe archive path');
  const encoded=Buffer.from(name),packed=deflateRawSync(data),crc=crc32(data);
  if(data.length>=0xffffffff||offset>=0xffffffff)throw new Error('ZIP64 required');
  const header=Buffer.alloc(30);header.writeUInt32LE(0x04034b50,0);header.writeUInt16LE(20,4);header.writeUInt16LE(0x800,6);header.writeUInt16LE(8,8);header.writeUInt16LE(33,12);header.writeUInt32LE(crc,14);header.writeUInt32LE(packed.length,18);header.writeUInt32LE(data.length,22);header.writeUInt16LE(encoded.length,26);
  const central=Buffer.alloc(46);central.writeUInt32LE(0x02014b50,0);central.writeUInt16LE(20,4);central.writeUInt16LE(20,6);central.writeUInt16LE(0x800,8);central.writeUInt16LE(8,10);central.writeUInt16LE(33,14);central.writeUInt32LE(crc,16);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(data.length,24);central.writeUInt16LE(encoded.length,28);central.writeUInt32LE(offset,42);
  chunks.push(header,encoded,packed);directory.push(central,encoded);offset+=header.length+encoded.length+packed.length;
 }
 const central=Buffer.concat(directory),end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50,0);end.writeUInt16LE(entries.length,8);end.writeUInt16LE(entries.length,10);end.writeUInt32LE(central.length,12);end.writeUInt32LE(offset,16);
 return Buffer.concat([...chunks,central,end]);
}
