import express from 'express';
import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { fail } from './validation.js';

export const defaultUploadDir=resolve(process.env.UPLOAD_DIR||'uploads');
export function serveUploads(app,dir){
 app.get('/api/media/:file',(req,res,next)=>{
  if(!/^[a-f0-9-]{36}\.webp$/.test(req.params.file))return next();
  res.set('Cache-Control','public, max-age=31536000, immutable');
  res.sendFile(req.params.file,{root:resolve(dir),dotfiles:'deny'},error=>{if(error)next(error);});
 });
}
export function mountUploads(router,dir,limit){
 router.post('/uploads',limit,express.raw({type:['image/jpeg','image/png','image/webp'],limit:'5mb'}),async(req,res)=>{
  if(!Buffer.isBuffer(req.body)||!req.body.length)fail(400,'Choisissez une photo JPEG, PNG ou WebP (5 Mo maximum).');
  let image;
  try{
   const source=sharp(req.body,{limitInputPixels:40000000});
   const info=await source.metadata();
   if(!['jpeg','png','webp'].includes(info.format)||info.pages>1)fail(400,'Format non pris en charge.');
   image=await source.rotate().resize({width:1600,height:1600,fit:'inside',withoutEnlargement:true}).webp({quality:85}).toBuffer();
  }catch{fail(400,'Photo invalide. Utilisez un JPEG, PNG ou WebP de moins de 40 mégapixels.');}
  await mkdir(dir,{recursive:true});const filename=`${randomUUID()}.webp`;
  await writeFile(join(dir,filename),image,{flag:'wx'});
  res.status(201).json({url:`/api/media/${filename}`});
 });
}
