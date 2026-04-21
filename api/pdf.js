const { jsPDF } = require("jspdf");

export default async function handler(req, res) {
  if(req.method==="OPTIONS"){res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");res.status(200).end();return;}
  if(req.method!=="POST"){res.status(405).end();return;}
  try {
    const p = req.body;
    const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    const W=210;
    const azul=[0,48,135],dorado=[232,160,32],verde=[34,209,138],gris=[106,117,144],negro=[26,26,46];
    doc.setFillColor(...azul);doc.roundedRect(10,10,W-20,18,3,3,"F");
    doc.setTextColor(255,255,255);doc.setFontSize(14);doc.setFont("helvetica","bold");
    doc.text("EXPANSIÓN BAFAR",20,21);
    doc.setFontSize(8);doc.setFont("helvetica","normal");doc.text("Ficha de Prospecto",20,26);
    const sL=p.status==="viable"?"VIABLE":p.status==="descartado"?"DESCARTADO":"PROSPECTO";
    const sC=p.status==="viable"?verde:p.status==="descartado"?[239,68,68]:[58,143,255];
    doc.setTextColor(...sC);doc.setFontSize(8);doc.setFont("helvetica","bold");doc.text(sL,W-20,21,{align:"right"});
    doc.setTextColor(...negro);doc.setFontSize(16);doc.setFont("helvetica","bold");doc.text(p.nombre||"Sin nombre",10,36);
    doc.setFontSize(9);doc.setFont("helvetica","normal");doc.setTextColor(...gris);
    doc.text((p.direccion||"")+(p.ciudad?" · "+p.ciudad:"")+(p.estado?", "+p.estado:""),10,42,{maxWidth:W-20});
    // Agregar foto si existe
    if(p.fotoB64){
      try{
        const fotoData = p.fotoB64.split(',')[1]||p.fotoB64;
        const ext = p.fotoB64.includes('png')?'PNG':'JPEG';
        doc.addImage(fotoData, ext, 10, 50, 88, 58, undefined, 'FAST');
      }catch(e){console.error('foto error:',e.message);}
    }
    const y=112,c1=10,c2=110,cW=88;
    doc.setFillColor(248,249,250);doc.roundedRect(c1,y,cW,65,2,2,"F");
    doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(...gris);
    doc.text("DENUE · RADIO "+(p.radio||1000)+"M",c1+3,y+5);
    doc.setFillColor(255,255,255);doc.roundedRect(c1+2,y+8,40,12,1,1,"F");doc.roundedRect(c1+46,y+8,40,12,1,1,"F");
    doc.setFontSize(7);doc.setTextColor(...gris);doc.text("RESTAURANTES",c1+22,y+11,{align:"center"});doc.text("DENUES TOTAL",c1+66,y+11,{align:"center"});
    doc.setFontSize(14);doc.setFont("helvetica","bold");doc.setTextColor(...dorado);
    doc.text(String(p.denue?p.denue.rest||0:0),c1+22,y+18,{align:"center"});doc.text(String(p.denue?p.denue.tot||0:0),c1+66,y+18,{align:"center"});
    const dg=p.denue&&p.denue.desglose?p.denue.desglose:{};
    let gy=y+24;
    Object.keys(dg).sort((a,b)=>dg[b]-dg[a]).slice(0,6).forEach(g=>{
      doc.setFontSize(8);doc.setFont("helvetica","normal");doc.setTextColor(55,65,81);doc.text(g,c1+3,gy);
      doc.setFont("helvetica","bold");doc.setTextColor(...dorado);doc.text(String(dg[g]),c1+cW-3,gy,{align:"right"});gy+=6;
    });
    doc.setFillColor(248,249,250);doc.roundedRect(c2,y,cW,75,2,2,"F");
    doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(...gris);doc.text("DATOS GENERALES",c2+3,y+5);
    const kpis=[];
    if(p.inegi&&p.inegi.pob)kpis.push({l:"POBLACIÓN",v:(p.inegi.pob/1000).toFixed(1)+"K",c:[58,143,255]});
    if(p.inegi&&p.inegi.viv)kpis.push({l:"VIVIENDAS",v:p.inegi.viv.toLocaleString(),c:verde});
    if(p.precio)kpis.push({l:"RENTA/MES",v:"$"+parseFloat(p.precio).toLocaleString(),c:verde});
    if(p.m2Terreno)kpis.push({l:"SUPERFICIE",v:p.m2Terreno+"m²",c:negro});
    if(p.frente&&p.fondo)kpis.push({l:"FRENTE x FONDO",v:p.frente+"m x "+p.fondo+"m",c:negro});
    kpis.forEach((k,i)=>{
      const kx=c2+2+(i%2)*44,ky=y+8+Math.floor(i/2)*16;
      doc.setFillColor(255,255,255);doc.roundedRect(kx,ky,42,13,1,1,"F");
      doc.setFontSize(6);doc.setFont("helvetica","normal");doc.setTextColor(...gris);doc.text(k.l,kx+21,ky+4,{align:"center"});
      doc.setFontSize(10);doc.setFont("helvetica","bold");doc.setTextColor(...k.c);doc.text(k.v,kx+21,ky+10,{align:"center"});
    });
    doc.setFillColor(255,255,255);doc.roundedRect(c2+2,y+56,cW-4,16,1,1,"F");
    doc.setFontSize(6);doc.setFont("helvetica","bold");doc.setTextColor(...gris);doc.text("GPS",c2+5,y+61);
    doc.setFontSize(8);doc.setFont("helvetica","bold");doc.setTextColor(55,65,81);
    doc.text((p.lat||0).toFixed(5)+", "+(p.lng||0).toFixed(5),c2+5,y+66);
    doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(58,143,255);
    doc.text("maps.google.com/?q="+(p.lat||0).toFixed(5)+","+(p.lng||0).toFixed(5),c2+5,y+70);
    if(p.sucNombre&&p.sucNombre!=="-"){
      const sy=y+78;
      doc.setFillColor(248,249,250);doc.roundedRect(c2,sy,cW,35,2,2,"F");
      doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(...gris);doc.text("SUCURSAL MÁS CERCANA",c2+3,sy+5);
      doc.setFontSize(9);doc.setFont("helvetica","bold");doc.setTextColor(...negro);doc.text(p.sucNombre,c2+3,sy+12);
      doc.setFillColor(255,255,255);doc.roundedRect(c2+2,sy+14,40,12,1,1,"F");doc.roundedRect(c2+46,sy+14,40,12,1,1,"F");
      doc.setFontSize(6);doc.setTextColor(...gris);doc.text("DISTANCIA",c2+22,sy+17,{align:"center"});doc.text("VENTA REAL",c2+66,sy+17,{align:"center"});
      doc.setFontSize(11);doc.setFont("helvetica","bold");doc.setTextColor(58,143,255);doc.text(p.sucDist||"-",c2+22,sy+23,{align:"center"});
      doc.setTextColor(...verde);doc.text(p.sucVenta||"-",c2+66,sy+23,{align:"center"});
    }
    if(p.notas){doc.setFillColor(248,249,250);doc.roundedRect(10,220,W-20,12,2,2,"F");doc.setFontSize(8);doc.setFont("helvetica","bold");doc.setTextColor(...negro);doc.text("Notas: "+p.notas,13,228,{maxWidth:W-26});}
    doc.setFillColor(...azul);doc.rect(0,282,W+10,15,"F");
    doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(255,255,255);
    doc.text((p.lat||0).toFixed(5)+", "+(p.lng||0).toFixed(5),13,288);
    doc.text("PIGER · Censo 2020 INEGI",W-13,288,{align:"right"});
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    res.setHeader("Content-Type","application/pdf");
    res.setHeader("Content-Disposition","attachment; filename=ficha-bafar.pdf");
    res.setHeader("Access-Control-Allow-Origin","*");
    res.status(200).send(pdfBuffer);
  } catch(e){
    res.setHeader("Access-Control-Allow-Origin","*");
    res.status(500).json({error:e.message});
  }
}
