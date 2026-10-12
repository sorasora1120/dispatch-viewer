// サンプルのページを、Google Fonts の代わりに手元のフォントで開いて撮る
const path=require('path');const {chromium}=require('playwright');
(async()=>{const [file,out,w,h,y,full]=process.argv.slice(2);const FD=process.env.FONTS||path.join(__dirname,'node_modules/@fontsource');
const css=['jost/300','jost/400','jost/500','noto-sans-jp/400','noto-sans-jp/500','noto-sans-jp/700','shippori-mincho-b1/500','shippori-mincho-b1/600','shippori-mincho-b1/700','cormorant-garamond/500','cormorant-garamond/600','cormorant-garamond/400-italic','cormorant-garamond/500-italic','poppins/500','poppins/600','poppins/700','poppins/800','shippori-mincho/500','shippori-mincho/700','zen-kaku-gothic-new/400','zen-kaku-gothic-new/700'];
const b=await chromium.launch({args:['--font-render-hinting=none']});const p=await b.newPage({viewport:{width:+w,height:+h},deviceScaleFactor:2,reducedMotion:'reduce'});
await p.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
await p.goto('file://'+path.resolve(file),{waitUntil:'load'});
for(const c of css){try{await p.addStyleTag({url:'file://'+path.join(FD,c+'.css')}).catch(()=>{})}catch(e){}}
await p.evaluate(async()=>{await document.fonts.ready});await p.waitForTimeout(800);
if(+y) await p.evaluate((y)=>window.scrollTo(0,y),+y);await p.waitForTimeout(400);
await p.screenshot({path:path.resolve(out),type:'jpeg',quality:85,fullPage:full==='1'});await b.close();})();
