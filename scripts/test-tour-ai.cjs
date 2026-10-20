const assert=require('node:assert/strict');
const {handleTourEditor}=require('../blender-output/quest-server/editor.cjs');
(async()=>{
 process.env.OPENAI_API_KEY='test-not-a-key';process.env.OPENAI_MODEL='test-model';process.env.TOUR_AI_ENABLED='true';
 const url='http://127.0.0.1:3004/api/tour-editor',r=await handleTourEditor(new Request(url)),cookie=r.headers.get('set-cookie').split(';')[0];
 let answer={type:'material',optionId:'linen-sage',message:'OK'},payload;
 global.fetch=async(u,options)=>{assert.equal(u,'https://api.openai.com/v1/responses');payload=JSON.parse(options.body);return Response.json({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(answer)}]}]});};
 async function send(revision,text='Změň čalounění na zelenošedou'){const response=await handleTourEditor(new Request(url,{method:'POST',headers:{cookie,origin:'http://127.0.0.1:3004','content-type':'application/json'},body:JSON.stringify({action:'chat',revision,selection:{objectId:'3kk-dining-chair-4',scope:'one'},text})}));return {status:response.status,data:await response.json()};}
 let result=await send(0);assert.equal(result.status,200);assert.deepEqual(Object.keys(result.data.variant),['3kk-dining-chair-4']);assert.equal(payload.store,false);assert.equal(payload.text.format.strict,true);assert(!payload.tools);
 answer={type:'material',optionId:'arbitrary-unapproved',message:'Done'};result=await send(1);assert.equal(result.status,400);
 answer={type:'delete',optionId:'wall',message:'Done'};result=await send(1);assert.equal(result.status,400);
 answer={type:'clarify',optionId:'',message:'Který odstín máte na mysli?'};result=await send(1);assert.equal(result.data.revision,1);
 global.fetch=async()=>Response.json({status:'incomplete',output:[]});result=await send(1);assert.equal(result.status,400);
 console.log('PASS: mocked AI valid choice, arbitrary choice rejection, forbidden operation rejection, clarification and incomplete response do not mutate scene. No real API call made.');
})().catch(e=>{console.error(e);process.exitCode=1;});
