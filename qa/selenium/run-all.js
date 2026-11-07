const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
for(const f of fs.readdirSync(path.join(__dirname,'tests')).filter(f=>f.endsWith('.js')).sort()){
 const r=spawnSync(process.execPath,[path.join(__dirname,'tests',f)],{stdio:'inherit',env:process.env});if(r.status)process.exitCode=1;
}
