const express=require('express'),path=require('path');const app=express(),root=path.join(__dirname,'..');
for(const dir of ['js','css','assets'])app.use('/'+dir,express.static(path.join(root,dir)));
for(const page of ['index','panel','catalogo','ventas','historial','caja','resumen','inventario','kardex'])app.get('/'+page+'.html',(req,res)=>res.sendFile(path.join(root,page+'.html')));
app.get('/',(req,res)=>res.redirect('/index.html'));
app.listen(3200,'127.0.0.1',()=>console.log('Demo QA: http://127.0.0.1:3200'));
