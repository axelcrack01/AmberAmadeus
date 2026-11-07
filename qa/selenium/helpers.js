const {Builder,By,until,Key}=require('../../node_modules/selenium-webdriver');
const chrome=require('../../node_modules/selenium-webdriver/chrome');
const edge=require('../../node_modules/selenium-webdriver/edge');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const BASE=process.env.QA_URL||'http://127.0.0.1:3200';
if(!['localhost','127.0.0.1'].includes(new URL(BASE).hostname))throw new Error('Solo QA local: no ejecutar sobre producción.');
async function run(meta,fn){let d,started=false;const t=Date.now(),out=path.resolve(__dirname,'../evidencias/selenium');fs.mkdirSync(out,{recursive:true});let result={...meta,tipo:'E2E Selenium',fecha:new Date().toISOString(),estado:'BLOCKED',duracion_ms:0,evidencia:''};
try{let b=new Builder();if(process.env.BROWSER==='edge'){b=b.forBrowser('MicrosoftEdge').setEdgeService(new edge.ServiceBuilder().setHostname('127.0.0.1')).setEdgeOptions(new edge.Options().addArguments('--headless=new'));}
else{const o=new chrome.Options().addArguments('--headless=new','--no-sandbox','--disable-dev-shm-usage','--window-size=1440,1000');if(process.env.CHROME_BINARY)o.setChromeBinaryPath(process.env.CHROME_BINARY);b=b.forBrowser('chrome').setChromeService(new chrome.ServiceBuilder().setHostname('127.0.0.1')).setChromeOptions(o);}
d=await b.build();result.navegador=(await d.getCapabilities()).get('browserVersion');await d.get(BASE+'/index.html');
// A fresh WebDriver profile isolates each demo case. No global browser reset.
await d.wait(until.elementLocated(By.id('formLogin')),8000);started=true;
const h=new Pages(d);await fn(h);result.estado='PASS';result.real='Aserciones del escenario satisfechas';
}catch(e){result.estado=started?'FAIL':'BLOCKED';result.real=e.message;process.exitCode=1;}
finally{if(d){try{fs.writeFileSync(path.join(out,meta.id+'.png'),await d.takeScreenshot(),'base64');result.evidencia='qa/evidencias/selenium/'+meta.id+'.png';}catch{}await d.quit();}result.duracion_ms=Date.now()-t;fs.writeFileSync(path.join(out,meta.id+'.json'),JSON.stringify(result,null,2));console.log(result.id+' '+result.estado+' '+result.real);}}
class Pages{
 constructor(d){this.d=d;}
 async el(s){return this.d.wait(until.elementLocated(By.css(s)),8000);}
 async click(s){const e=await this.el(s);await this.d.wait(until.elementIsVisible(e),8000);await this.d.wait(until.elementIsEnabled(e),8000);await e.click();}
 async fill(s,v){const e=await this.el(s);await e.clear();await e.sendKeys(String(v));}
 async select(s,v){await this.el(s+' option');const opts=await this.d.findElements(By.css(s+' option'));for(const o of opts){if(await o.getAttribute('value')===v){await o.click();return;}}throw new Error('Opción no disponible '+s+' '+v);}
 async text(s){return (await this.el(s)).getText();}
 async has(s,text){await this.d.wait(async()=> (await this.text(s)).includes(text),8000);}
 async go(p){await this.d.get(BASE+'/'+p+'.html');await this.has('#nombreUsuario','prueba');const ready={inventario:'#producto option',ventas:'[data-agregar]',catalogo:'#tablaProductos tr',historial:'#tablaVentas tr',resumen:'#detalleDiario tr'}[p];if(ready)await this.el(ready);if(p==='caja')await this.d.wait(async()=>!(await this.text('#estadoCaja')).includes('Consultando'),8000);}
 async login(role='admin'){if(process.env.QA_PASSWORD){await this.fill('#correo',role+'@demo.local');await this.fill('#clave',process.env.QA_PASSWORD);}else await this.click('[data-cuenta="'+role+'"]');await this.click('#btnIngresar');await this.d.wait(until.urlContains('panel.html'),8000);}
 async api(r,b){const v=await this.d.executeAsyncScript('const done=arguments[arguments.length-1];api(arguments[0],arguments[1]?"POST":"GET",arguments[1]).then(x=>done({data:x})).catch(e=>done({error:e.message}));',r,b||null);if(v.error)throw new Error(v.error);return v.data;}
 async inventory(q=5){await this.api('/inventario',{producto_id:1,sku:'QA-01',unidad:'unidad',minimo:1,activo:true});if(q)await this.api('/inventario/movimientos',{producto_id:1,tipo:'ENTRADA',cantidad:q,motivo:'Stock inicial QA',referencia:'QA',solicitud_id:require('node:crypto').randomUUID()});}
 async openBox(){await this.api('/cajas/abrir',{fondo_centimos:10000});}
 async sale(){await this.go('ventas');await this.click('[data-agregar="1"]');await this.select('#medioPago','YAPE');await this.click('#confirmarVenta');await this.d.wait(until.elementIsVisible(await this.el('#modalRecibo')),8000);await this.has('#reciboContenido','V-');}
 async movement(q,type='ENTRADA'){await this.go('inventario');await this.select('#tipo',type);await this.fill('#cantidad',q);await this.fill('#motivo','Prueba de movimiento');await this.fill('#referencia','COMPRA-QA');await this.click('#movimiento button');}
}
module.exports={run,assert,By,Key};
