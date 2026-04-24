const { jsPDF } = require("jspdf");

export default async function handler(req, res) {
  if(req.method==="OPTIONS"){res.setHeader("Access-Control-Allow-Origin","*");res.setHeader("Access-Control-Allow-Methods","POST,OPTIONS");res.setHeader("Access-Control-Allow-Headers","Content-Type");res.status(200).end();return;}
  if(req.method!=="POST"){res.status(405).end();return;}
  try {
    const p = req.body;
    const doc = new jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    const W=210,M=12;
    const azul=[0,48,135],dorado=[232,160,32],verde=[34,209,138],gris=[106,117,144],negro=[26,26,46],blanco=[255,255,255];
    doc.setFillColor(...azul);doc.roundedRect(M,8,W-M*2,16,3,3,"F");
    doc.setTextColor(...blanco);doc.setFontSize(13);doc.setFont("helvetica","bold");doc.text("EXPANSION BAFAR",M+4,17);
    doc.setFontSize(7);doc.setFont("helvetica","normal");doc.text("Ficha de Prospecto",M+4,22);
    const sL=p.status==="viable"?"VIABLE":p.status==="descartado"?"DESCARTADO":"PROSPECTO";
    const sC=p.status==="viable"?verde:p.status==="descartado"?[239,68,68]:[58,143,255];
    doc.setTextColor(...sC);doc.setFontSize(8);doc.setFont("helvetica","bold");doc.text(sL,W-M-2,17,{align:"right"});
    doc.setTextColor(...negro);doc.setFontSize(14);doc.setFont("helvetica","bold");doc.text(p.nombre||"Sin nombre",M,32);
    doc.setFontSize(8);doc.setFont("helvetica","normal");doc.setTextColor(...gris);
    const dir=(p.direccion||"")+(p.ciudad?" · "+p.ciudad:"")+(p.estado?", "+p.estado:"");
    doc.text(dir,M,37,{maxWidth:W-M*2});
    const c1=M,c2=M+95,cW=90;
    let y1=42,y2=42;
    const dg=p.denue&&p.denue.desglose?p.denue.desglose:{};
    const dgRows=Object.keys(dg).length;
    const dgH=dgRows*5+22;
    doc.setFillColor(248,249,250);doc.roundedRect(c1,y1,cW,dgH,2,2,"F");doc.setDrawColor(229,231,235);doc.roundedRect(c1,y1,cW,dgH,2,2,"S");
    doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(...gris);doc.text("DENUE RADIO "+(p.radio||1000)+"M",c1+3,y1+5);
    doc.setDrawColor(...dorado);doc.line(c1+3,y1+6.5,c1+cW-3,y1+6.5);
    doc.setFillColor(...blanco);doc.roundedRect(c1+cW/2-25,y1+7,50,13,1,1,"F");
    doc.setFontSize(6);doc.setTextColor(...gris);doc.text("DENUEs TOTAL",c1+cW/2,y1+11,{align:"center"});
    doc.setFontSize(16);doc.setFont("helvetica","bold");doc.setTextColor(...dorado);
    doc.text(String(p.denue?p.denue.tot||0:0),c1+cW/2,y1+19,{align:"center"});
    let gy=y1+24;
    Object.keys(dg).sort((a,b)=>dg[b]-dg[a]).forEach(g=>{
      doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(55,65,81);doc.text(g,c1+3,gy);
      doc.setFont("helvetica","bold");doc.setTextColor(...dorado);doc.text(String(dg[g]),c1+cW-3,gy,{align:"right"});gy+=5;
    });
    y1+=dgH+4;
    if(p.proyRef){
      const pyH=44;
      doc.setFillColor(248,249,250);doc.roundedRect(c1,y1,cW,pyH,2,2,"F");doc.setDrawColor(229,231,235);doc.roundedRect(c1,y1,cW,pyH,2,2,"S");
      doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(...gris);doc.text("PROYECCION DE VENTAS",c1+3,y1+5);
      const potColor=p.proyPot&&p.proyPot.indexOf("ALTO")>=0?verde:p.proyPot&&p.proyPot.indexOf("BAJO")>=0?[239,68,68]:dorado;
      doc.setFontSize(9);doc.setTextColor(...potColor);doc.text(p.proyPot||"MEDIO",c1+cW-3,y1+5,{align:"right"});
      doc.setDrawColor(...dorado);doc.line(c1+3,y1+6.5,c1+cW-3,y1+6.5);
      doc.setFillColor(...blanco);doc.roundedRect(c1+2,y1+8,42,13,1,1,"F");doc.roundedRect(c1+48,y1+8,42,13,1,1,"F");
      doc.setFontSize(6);doc.setTextColor(...gris);doc.text("REFERENCIAL",c1+23,y1+11,{align:"center"});doc.text("RANGO",c1+69,y1+11,{align:"center"});
      doc.setFontSize(10);doc.setFont("helvetica","bold");doc.setTextColor(...verde);doc.text(p.proyRef||"-",c1+23,y1+19,{align:"center"});
      doc.setFontSize(7);doc.setTextColor(...gris);doc.text(p.proyRango||"-",c1+69,y1+16,{align:"center",maxWidth:40});
      doc.setFillColor(...blanco);doc.roundedRect(c1+2,y1+23,42,12,1,1,"F");doc.roundedRect(c1+48,y1+23,42,12,1,1,"F");
      doc.setFontSize(6);doc.setTextColor(...gris);doc.text("INSTITUCIONAL",c1+23,y1+26,{align:"center"});doc.text("OCASION",c1+69,y1+26,{align:"center"});
      doc.setFontSize(9);doc.setFont("helvetica","bold");doc.setTextColor(240,192,80);doc.text(p.proyInst||"-",c1+23,y1+32,{align:"center"});
      doc.setTextColor(...dorado);doc.text(p.proyOcas||"-",c1+69,y1+32,{align:"center"});
      doc.setFontSize(7);doc.setFont("helvetica","oblique");doc.setTextColor(...gris);doc.text(p.proyBase||"",c1+3,y1+40,{maxWidth:cW-6});
      y1+=pyH+4;
    }
    if(p.sucNombre&&p.sucNombre!=="-"){
      const syH=34;
      doc.setFillColor(248,249,250);doc.roundedRect(c1,y1,cW,syH,2,2,"F");doc.setDrawColor(229,231,235);doc.roundedRect(c1,y1,cW,syH,2,2,"S");
      doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(...gris);doc.text("SUCURSAL MAS CERCANA",c1+3,y1+5);
      doc.setDrawColor(...dorado);doc.line(c1+3,y1+6.5,c1+cW-3,y1+6.5);
      doc.setFontSize(9);doc.setFont("helvetica","bold");doc.setTextColor(...negro);doc.text(p.sucNombre,c1+3,y1+13);
      doc.setFillColor(...blanco);doc.roundedRect(c1+2,y1+15,42,12,1,1,"F");doc.roundedRect(c1+48,y1+15,42,12,1,1,"F");
      doc.setFontSize(6);doc.setTextColor(...gris);doc.text("DISTANCIA",c1+23,y1+18,{align:"center"});doc.text("VENTA REAL",c1+69,y1+18,{align:"center"});
      doc.setFontSize(11);doc.setFont("helvetica","bold");doc.setTextColor(58,143,255);doc.text(p.sucDist||"-",c1+23,y1+24,{align:"center"});
      doc.setTextColor(...verde);doc.text(p.sucVenta||"-",c1+69,y1+24,{align:"center"});
      doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(...gris);doc.text(p.sucZona||"",c1+3,y1+31);
      y1+=syH+4;
    }
    // Alinear columna derecha con izquierda si no hay foto
    if(!p.fotoB64){ y2=42; }
    if(p.fotoUrl){
      try{
        const fotoResp=await fetch(p.fotoUrl);
        const fotoArrBuf=await fotoResp.arrayBuffer();
        const fotoB64=Buffer.from(fotoArrBuf).toString('base64');
        const ext=p.fotoUrl.toLowerCase().includes('png')?'PNG':'JPEG';
        doc.addImage(fotoB64,ext,c2,y2,cW,55,undefined,'FAST');y2+=59;
      }catch(e){console.error('foto:',e.message);}
    }
    const kpis=[];
    if(p.inegi&&p.inegi.pob)kpis.push({l:"POBLACION",v:(p.inegi.pob/1000).toFixed(1)+"K",c:[58,143,255]});
    if(p.inegi&&p.inegi.viv)kpis.push({l:"VIVIENDAS",v:p.inegi.viv.toLocaleString(),c:verde});
    if(p.precio)kpis.push({l:"RENTA/MES",v:"$"+parseFloat(p.precio).toLocaleString(),c:verde});
    if(p.m2Terreno)kpis.push({l:"SUPERFICIE",v:p.m2Terreno+"m2",c:negro});
    if(p.frente&&p.fondo)kpis.push({l:"FRENTE x FONDO",v:p.frente+"m x "+p.fondo+"m",c:negro});
    const kRows=Math.ceil(kpis.length/2);
    const dgH2=kRows*15+14;
    doc.setFillColor(248,249,250);doc.roundedRect(c2,y2,cW,dgH2,2,2,"F");doc.setDrawColor(229,231,235);doc.roundedRect(c2,y2,cW,dgH2,2,2,"S");
    doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(...gris);doc.text("DATOS GENERALES",c2+3,y2+5);
    doc.setDrawColor(...dorado);doc.line(c2+3,y2+6.5,c2+cW-3,y2+6.5);
    kpis.forEach((k,i)=>{
      const kx=c2+2+(i%2)*46,ky=y2+8+Math.floor(i/2)*15;
      doc.setFillColor(...blanco);doc.roundedRect(kx,ky,42,12,1,1,"F");
      doc.setFontSize(6);doc.setFont("helvetica","normal");doc.setTextColor(...gris);doc.text(k.l,kx+21,ky+4,{align:"center"});
      doc.setFontSize(9);doc.setFont("helvetica","bold");doc.setTextColor(...k.c);doc.text(k.v,kx+21,ky+10,{align:"center"});
    });
    y2+=dgH2+4;
    doc.setFillColor(...blanco);doc.roundedRect(c2,y2,cW,16,1,1,"F");doc.setDrawColor(229,231,235);doc.roundedRect(c2,y2,cW,16,1,1,"S");
    doc.setFontSize(6);doc.setFont("helvetica","bold");doc.setTextColor(...gris);doc.text("GPS",c2+3,y2+5);
    doc.setFontSize(8);doc.setFont("helvetica","bold");doc.setTextColor(55,65,81);doc.text((p.lat||0).toFixed(5)+", "+(p.lng||0).toFixed(5),c2+3,y2+10);
    doc.setFontSize(6);doc.setFont("helvetica","normal");doc.setTextColor(58,143,255);doc.text("maps.google.com/?q="+(p.lat||0).toFixed(5)+","+(p.lng||0).toFixed(5),c2+3,y2+14);
    y2+=20;
    let yFinal=Math.max(y1,y2)+4;
    if(p.lotNombre&&p.lotNombre!=="-"&&yFinal+28<272){
      const lzH=28;
      doc.setFillColor(218,251,237);doc.roundedRect(M,yFinal,W-M*2,lzH,2,2,"F");
      doc.setDrawColor(34,209,138);doc.roundedRect(M,yFinal,W-M*2,lzH,2,2,"S");
      doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(0,100,60);
      doc.text("ZONA POTENCIAL BAFAR",M+3,yFinal+5);
      doc.setFontSize(5.5);doc.setFont("helvetica","normal");doc.setTextColor(34,209,138);
      doc.text("UBICACION EN ZONA POTENCIAL IDENTIFICADA",W-M-3,yFinal+5,{align:"right"});
      doc.setDrawColor(34,209,138);doc.line(M+3,yFinal+7,W-M-3,yFinal+7);
      doc.setFontSize(9);doc.setFont("helvetica","bold");doc.setTextColor(...negro);
      doc.text(p.lotNombre,M+3,yFinal+12);
      doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(...gris);
      doc.text(p.lotZona||"",M+3,yFinal+16.5);
      const kW=(W-M*2-8)/3;
      [[p.lotDist||"-",[58,143,255],"DISTANCIA"],[p.lotPred||"-",[34,209,138],"PRED. MODELO"],[p.lotInst||"-",[240,192,80],"INSTITUCIONAL"]].forEach(([v,c,l],i)=>{
        const kx=M+2+i*(kW+2),ky=yFinal+18;
        doc.setFillColor(...blanco);doc.roundedRect(kx,ky,kW,9,1,1,"F");
        doc.setFontSize(5);doc.setFont("helvetica","normal");doc.setTextColor(...gris);doc.text(l,kx+kW/2,ky+3.5,{align:"center"});
        doc.setFontSize(7);doc.setFont("helvetica","bold");doc.setTextColor(...c);doc.text(v,kx+kW/2,ky+7.5,{align:"center"});
      });
      yFinal+=lzH+4;
    }
    if(p.notas&&yFinal<265){
      doc.setFillColor(248,249,250);doc.roundedRect(M,yFinal,W-M*2,12,2,2,"F");
      doc.setFontSize(8);doc.setFont("helvetica","bold");doc.setTextColor(...negro);doc.text("Notas: "+p.notas,M+3,yFinal+8,{maxWidth:W-M*2-6});
    }
    doc.setFillColor(...azul);doc.rect(0,283,W+5,15,"F");
    doc.setFontSize(7);doc.setFont("helvetica","normal");doc.setTextColor(...blanco);
    doc.text((p.lat||0).toFixed(5)+", "+(p.lng||0).toFixed(5),M,289);
    doc.text((p.tipo||"")+" · "+(p.fecha||""),W/2,289,{align:"center"});
    doc.text("PIGER · Censo 2020 INEGI",W-M,289,{align:"right"});
    const pdfBuffer=Buffer.from(doc.output("arraybuffer"));
    res.setHeader("Content-Type","application/pdf");res.setHeader("Content-Disposition",'attachment; filename="ficha-bafar.pdf"');res.setHeader("Access-Control-Allow-Origin","*");res.status(200).send(pdfBuffer);
  } catch(e){res.setHeader("Access-Control-Allow-Origin","*");res.status(500).json({error:e.message});}
}
