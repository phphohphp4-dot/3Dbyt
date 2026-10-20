const path=require('node:path'),fs=require('node:fs'),crypto=require('node:crypto');
const {webpack}=require('next/dist/compiled/webpack/webpack');
const root=path.resolve(__dirname,'..'),out=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'blender-output/quest-web');
const assets=process.argv[3]?path.resolve(process.argv[3]):path.join(root,'public/mikulovice');
fs.mkdirSync(out,{recursive:true});
// Keep the decoder and locally served worker/fonts on the same installed version.
const pdfAssets=path.join(root,'public/pdfjs'),pdfDist=path.dirname(require.resolve('pdfjs-dist/package.json'));
fs.mkdirSync(pdfAssets,{recursive:true});
fs.copyFileSync(path.join(pdfDist,'build/pdf.worker.min.mjs'),path.join(pdfAssets,'pdf.worker.min.js'));
fs.copyFileSync(path.join(pdfDist,'LICENSE'),path.join(pdfAssets,'LICENSE'));
for(const dir of ['cmaps','standard_fonts','wasm'])fs.cpSync(path.join(pdfDist,dir),path.join(pdfAssets,dir),{recursive:true});

webpack({mode:'production',entry:path.join(__dirname,'quest-entry.tsx'),output:{path:out,filename:'tour.js',chunkFilename:'[name].[contenthash:12].js',publicPath:'/'},resolve:{extensions:['.tsx','.ts','.js'],alias:{'@':root}},module:{rules:[{test:/\.tsx?$/,exclude:/node_modules/,use:path.join(__dirname,'quest-ts-loader.cjs')}]},optimization:{minimize:false,splitChunks:false},performance:{hints:false}},(err,stats)=>{
 if(err||stats.hasErrors()){console.error(err||stats.toString({all:false,errors:true}));process.exitCode=1;return;}
 require('./build-tour-css.cjs')(root).then(css=>{
 fs.writeFileSync(path.join(out,'style.css'),css+'\n'+fs.readFileSync(path.join(root,'node_modules/leaflet/dist/leaflet.css'),'utf8')+'\nbody{font-family:system-ui,sans-serif;margin:0}\n'+fs.readFileSync(path.join(root,'styles/experience.css'),'utf8')+'\n'+fs.readFileSync(path.join(root,'styles/openstudio.css'),'utf8'));
 const version=crypto.createHash('sha256').update(fs.readFileSync(path.join(out,'tour.js'))).update(fs.readFileSync(path.join(out,'style.css'))).digest('hex').slice(0,12);
 fs.writeFileSync(path.join(out,'version.json'),JSON.stringify({version}));
 fs.writeFileSync(path.join(out,'index.html'),'<!doctype html><html lang="cs"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Openstudio · 3D prohlídky</title><link rel="stylesheet" href="./style.css?v='+version+'"></head><body><div id="root"></div><script defer src="./tour.js?v='+version+'"></script></body></html>');
 fs.mkdirSync(path.join(out,'mikulovice'),{recursive:true});
 for(const f of ['mikulovice-quest.glb','navigation.json','build-report.json','forest.hdr','CREDITS.txt','oak.jpg','grass_ground.jpg','concrete_pavement.jpg'])fs.copyFileSync(fs.existsSync(path.join(assets,f))?path.join(assets,f):path.join(root,'public/mikulovice',f),path.join(out,'mikulovice',f));
 if(fs.existsSync(path.join(assets,'lights-off')))fs.cpSync(path.join(assets,'lights-off'),path.join(out,'mikulovice/lights-off'),{recursive:true});
 fs.cpSync(path.join(root,'public/pdfjs'),path.join(out,'pdfjs'),{recursive:true});
 fs.cpSync(path.join(root,'public/branding'),path.join(out,'branding'),{recursive:true});
 fs.cpSync(path.join(root,'public/showcase'),path.join(out,'showcase'),{recursive:true});
 console.log('Standalone Quest web built:',out);
 }).catch(error=>{console.error(error);process.exitCode=1;});
});

