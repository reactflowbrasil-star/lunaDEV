import "server-only";
import { NextRequest } from "next/server";

const COOKIE = "luna_gemini";

export function credentialCookieName(){ return COOKIE; }

export async function encryptCredential(value:string){
 const key=await encryptionKey(),iv=crypto.getRandomValues(new Uint8Array(12));
 const encrypted=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,new TextEncoder().encode(value));
 return `${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`;
}

export async function resolveApiKey(request?:NextRequest){
 const stored=request?.cookies.get(COOKIE)?.value;
 if(stored){
  try{
   const [iv,data]=stored.split(".");
   const plain=await crypto.subtle.decrypt({name:"AES-GCM",iv:fromBase64(iv)},await encryptionKey(),fromBase64(data));
   return new TextDecoder().decode(plain);
  }catch{}
 }
 return process.env.GEMINI_API_KEY??process.env.GOOGLE_API_KEY??null;
}

async function encryptionKey(){
 const secret=process.env.LUNA_SETTINGS_SECRET;
 if(!secret||secret.length<32)throw new Error("Configure LUNA_SETTINGS_SECRET no Netlify com pelo menos 32 caracteres.");
 const digest=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(secret));
 return crypto.subtle.importKey("raw",digest,"AES-GCM",false,["encrypt","decrypt"]);
}
function toBase64(bytes:Uint8Array){return Buffer.from(bytes).toString("base64url")}
function fromBase64(value:string){return new Uint8Array(Buffer.from(value,"base64url"))}
