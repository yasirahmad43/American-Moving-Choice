import {createHash} from 'node:crypto';
import {readFileSync,mkdirSync,writeFileSync} from 'node:fs';
import {Readable} from 'node:stream';
import {fileURLToPath} from 'node:url';
import {createInterface} from 'node:readline';
const root=fileURLToPath(new URL('../',import.meta.url)).replace(/[\\\\/]$/,'');
const pinned=JSON.parse(readFileSync(root+'/packages/server/data/seo-route-census/places-2023.json','utf8'));
const expected=new Map(pinned.provenance.map(source=>[source.table,source.sha256]));
const parseValue=(raw)=>raw===undefined||raw.trim()===''?null:Number(raw);
const places=JSON.parse(readFileSync(root+'/packages/server/data/seo-geo/places.json','utf8'));
const eligible=new Set(places.filter(row=>row[3]>=10000).map(row=>row[2]));
const tables={B25064:[1],B25077:[1],B19013:[1],B25018:[1],B25035:[1],B25003:[1,2,3],B25024:[1,2,3,4,5,6,7,8,9,10,11],B25002:[1,2,3]};
const result={vintage:'2023 ACS 5-year estimates',period:'2019–2023',accessedOn:pinned.accessedOn,provenance:[],places:{}};
async function load(table,lines){
 const url=`https://www2.census.gov/programs-surveys/acs/summary_file/2023/table-based-SF/data/5YRData/acsdt5y2023-${table.toLowerCase()}.dat`;
 const response=await fetch(url);if(!response.ok||!response.body)throw new Error(`Source failed ${response.status} ${table}`);
 const hash=createHash('sha256');let bytes=0;const input=Readable.fromWeb(response.body);input.on('data',chunk=>{hash.update(chunk);bytes+=chunk.length;});
 let headers=null,count=0;for await(const line of createInterface({input,crlfDelay:Infinity})){if(!headers){headers=line.replace(/^\uFEFF/,'').split('|');if(headers[0]!=='GEO_ID')throw new Error('Unexpected table header '+headers[0]);for(const number of lines){const id=String(number).padStart(3,'0');if(!headers.includes(`${table}_E${id}`)||!headers.includes(`${table}_M${id}`))throw new Error('Required estimate/MOE field missing '+table);}continue;}const cols=line.split('|');const geoid=cols[0];if(!geoid.startsWith('1600000US'))continue;const place=geoid.slice(9);if(!eligible.has(place))continue;const row=result.places[place]??={};for(const number of lines){const id=String(number).padStart(3,'0');const estimate=parseValue(cols[headers.indexOf(`${table}_E${id}`)]),moe=parseValue(cols[headers.indexOf(`${table}_M${id}`)]);row[`${table}_${id}`]={estimate:Number.isFinite(estimate)&&estimate>=0?estimate:null,moe:Number.isFinite(moe)&&moe>=0?moe:null};}count++;}
 const sha256=hash.digest('hex');if(expected.get(table)!==sha256)throw new Error('Pinned Census source changed; review before updating '+table);result.provenance.push({table,url,sha256,bytes,matchedPlaces:count});console.log(JSON.stringify({table,bytes,matchedPlaces:count}));
}
async function main(){const entries=Object.entries(tables);for(let start=0;start<entries.length;start+=2)await Promise.all(entries.slice(start,start+2).map(([table,lines])=>load(table,lines)));result.provenance.sort((a,b)=>a.table.localeCompare(b.table));result.places=Object.fromEntries(Object.entries(result.places).sort(([a],[b])=>a.localeCompare(b)).map(([geoid,facts])=>[geoid,Object.fromEntries(Object.entries(facts).sort(([a],[b])=>a.localeCompare(b)))]));mkdirSync(root+'/packages/server/data/seo-route-census',{recursive:true});writeFileSync(root+'/packages/server/data/seo-route-census/places-2023.json',JSON.stringify(result)+'\n');console.log(JSON.stringify({eligiblePlaces:eligible.size,matchedPlaces:Object.keys(result.places).length,tables:result.provenance.length,outputBytes:JSON.stringify(result).length}));}
main().catch(error=>{console.error(error);process.exitCode=1;});
