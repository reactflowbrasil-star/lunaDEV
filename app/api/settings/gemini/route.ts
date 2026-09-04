import { NextRequest, NextResponse } from "next/server";
import { credentialCookieName, encryptCredential, resolveApiKey } from "@/lib/gemini/credential";
import { listModels } from "@/lib/gemini/server";

export async function GET(request:NextRequest){
 const key=await resolveApiKey(request);
 if(!key)return NextResponse.json({configured:false});
 try{
  const models=await listModels(key);
  return NextResponse.json({configured:true,availableModels:models.length});
 }catch(error){
  return NextResponse.json({configured:false,message:error instanceof Error?error.message:"Credencial inválida."},{status:401});
 }
}

export async function POST(request:NextRequest){
 try{
  const {apiKey, validateOnly}=await request.json();
  if(typeof apiKey!=="string"||apiKey.trim().length<20)return NextResponse.json({error:"Informe uma chave Gemini válida."},{status:400});
  await listModels(apiKey.trim());
  if(validateOnly)return NextResponse.json({valid:true,message:"Chave válida e aceita pelo Gemini."});
  if(validateOnly)return NextResponse.json({valid:true,message:"Chave válida e aceita pelo Gemini."});
  const encrypted=await encryptCredential(apiKey.trim());
  const response=NextResponse.json({configured:true,message:"Gemini conectado com sucesso."});
  response.cookies.set(credentialCookieName(),encrypted,{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:60*60*24*30});
  return response;
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Não foi possível validar a chave."},{status:400})}
}

export async function DELETE(){
 const response=NextResponse.json({configured:false});
 response.cookies.set(credentialCookieName(),"",{httpOnly:true,secure:true,sameSite:"strict",path:"/",maxAge:0});
 return response;
}
