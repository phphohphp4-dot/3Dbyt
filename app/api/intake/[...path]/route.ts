import {handleIntake} from '@/lib/intake-server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=handleIntake;
export const POST=handleIntake;
export const DELETE=handleIntake;
