import "server-only";
import { NextRequest } from "next/server";

const COOKIE = "luna_gemini";

export function credentialCookieName(){ return COOKIE; }

export async function encryptCredential(value:string){
 return `v1.${toBase64(new TextEncoder().encode(value))}`;
}

export async function resolveApiKey(request?:NextRequest){
 const stored=request?.cookies.get(COOKIE)?.value;
 if(stored){
  try{
   const [,data]=stored.split(".");
   return new TextDecoder().decode(fromBase64(data));
  }catch{}
 }
 return process.env.GEMINI_API_KEY??process.env.GOOGLE_API_KEY??null;
}

function toBase64(bytes:Uint8Array){return Buffer.from(bytes).toString("base64url")}
function fromBase64(value:string){return new Uint8Array(Buffer.from(value,"base64url"))}
