import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { stdin, stdout } from 'node:process';

export function terminalInput(){
 if(!stdin.isTTY||!stdout.isTTY)throw new Error('Ouvrez un terminal interactif (docker compose exec sans -T).');
 let muted=false;
 const output=new Writable({write(chunk,encoding,done){if(!muted)stdout.write(chunk,encoding);done();}});
 const rl=createInterface({input:stdin,output,terminal:true});
 rl.on('SIGINT',()=>rl.close());
 return {
  ask:prompt=>rl.question(prompt),
  async password(){
   async function hidden(prompt){stdout.write(prompt);muted=true;try{return await rl.question('');}finally{muted=false;stdout.write('\n');}}
   const password=await hidden('Mot de passe permanent (12 caractères minimum, saisie masquée) : ');
   const confirmation=await hidden('Saisir à nouveau ce mot de passe : ');
   if(password!==confirmation)throw new Error('Les mots de passe ne correspondent pas. Aucun changement.');
   return password;
  },
  close(){rl.close();}
 };
}
