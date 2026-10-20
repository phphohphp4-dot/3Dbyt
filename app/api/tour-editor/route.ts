import {handleTourEditor} from '@/lib/tour-editor-server';
import {staffAuthorized} from '@/lib/intake-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
async function handler(req:Request){if(!staffAuthorized(req))return Response.json({error:'Přihlaste se do studia.'},{status:401});return handleTourEditor(req);}
export const GET=handler;
export const POST=handler;
