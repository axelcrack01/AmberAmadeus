const fs=require('fs'),path=require('path'),pool=require('./db');
const dir=process.argv[2]==='down'?'down':'up';
pool.query(fs.readFileSync(path.join(__dirname,'../bd/03_inventario_'+dir+'.sql'),'utf8')).then(()=>console.log('Migración '+dir+' completada')).catch(e=>{console.error(e.message);process.exitCode=1;}).finally(()=>pool.end());
