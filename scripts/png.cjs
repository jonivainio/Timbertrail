// Minimal dependency-free PNG codec for 8-bit RGBA, non-interlaced images.
'use strict';
const zlib=require('node:zlib');
const SIGNATURE=Buffer.from([137,80,78,71,13,10,26,10]);
const crcTable=Array.from({length:256},(_,n)=>{let c=n;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function crc(buf){let c=0xffffffff;for(const b of buf)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;}
function decode(bytes){
  if(!bytes.subarray(0,8).equals(SIGNATURE))throw Error('not a PNG');
  let pos=8,width=0,height=0,idat=[];
  while(pos<bytes.length){const len=bytes.readUInt32BE(pos),type=bytes.toString('ascii',pos+4,pos+8),data=bytes.subarray(pos+8,pos+8+len);pos+=12+len;
    if(type==='IHDR'){width=data.readUInt32BE(0);height=data.readUInt32BE(4);if(data[8]!==8||data[9]!==6||data[12]!==0)throw Error('only 8-bit RGBA non-interlaced');}
    else if(type==='IDAT')idat.push(data);else if(type==='IEND')break;}
  const raw=zlib.inflateSync(Buffer.concat(idat)),stride=width*4,out=Buffer.alloc(stride*height);
  for(let y=0;y<height;y++){const f=raw[y*(stride+1)],src=raw.subarray(y*(stride+1)+1,(y+1)*(stride+1)),row=y*stride;
    for(let x=0;x<stride;x++){const a=x>=4?out[row+x-4]:0,b=y?out[row-stride+x]:0,c=x>=4&&y?out[row-stride+x-4]:0;let v=src[x];
      if(f===1)v+=a;else if(f===2)v+=b;else if(f===3)v+=(a+b)>>1;else if(f===4){const p=a+b-c,pa=Math.abs(p-a),pb=Math.abs(p-b),pc=Math.abs(p-c);v+=pa<=pb&&pa<=pc?a:pb<=pc?b:c;}
      out[row+x]=v&255;}}
  return {width,height,data:out};
}
function chunk(type,data){const head=Buffer.alloc(8);head.writeUInt32BE(data.length,0);head.write(type,4,'ascii');const tail=Buffer.alloc(4);tail.writeUInt32BE(crc(Buffer.concat([head.subarray(4),data])),0);return Buffer.concat([head,data,tail]);}
function encode({width,height,data}){
  const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=6;
  const raw=Buffer.alloc((width*4+1)*height);for(let y=0;y<height;y++)data.copy(raw,y*(width*4+1)+1,y*width*4,(y+1)*width*4);
  return Buffer.concat([SIGNATURE,chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
function create(width,height){return {width,height,data:Buffer.alloc(width*height*4)};}
module.exports={decode,encode,create};
