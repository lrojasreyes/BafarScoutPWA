import { jsPDF } from "https://esm.sh/jspdf@2.5.1";

export const config = { runtime: "edge" };

export default async function handler(req) {
  if(req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      }
    });
  }

  try {
    const p = await req.json();
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = 210; // A4 width mm
    const azul = [0, 48, 135];
    const dorado = [232, 160, 32];
    const verde = [34, 209, 138];
    const gris = [106, 117, 144];
    const negro = [26, 26, 46];

    // HEADER azul
    doc.setFillColor(...azul);
    doc.roundedRect(10, 10, W-20, 18, 3, 3, "F");
    doc.setTextColor(255,255,255);
    doc.setFontSize(14);
    doc.setFont("helvetica","bold");
    doc.text("EXPANSIÓN BAFAR", 20, 21);
    doc.setFontSize(8);
    doc.setFont("helvetica","normal");
    doc.text("Ficha de Prospecto", 20, 26);

    // Badge status
    const statusLabel = p.status==="viable"?"VIABLE":p.status==="descartado"?"DESCARTADO":"PROSPECTO";
    const statusColor = p.status==="viable"?[34,209,138]:p.status==="descartado"?[239,68,68]:[58,143,255];
    doc.setDrawColor(...statusColor);
    doc.setTextColor(...statusColor);
    doc.setFontSize(8);
    doc.setFont("helvetica","bold");
    doc.text(statusLabel, W-20, 21, {align:"right"});

    // Nombre y dirección
    doc.setTextColor(...negro);
    doc.setFontSize(16);
    doc.setFont("helvetica","bold");
    doc.text(p.nombre||"Sin nombre", 10, 36);
    doc.setFontSize(9);
    doc.setFont("helvetica","normal");
    doc.setTextColor(...gris);
    var dir = (p.direccion||"") + (p.ciudad?" · "+p.ciudad:"") + (p.estado?", "+p.estado:"");
    doc.text(dir, 10, 42, {maxWidth: W-20});

    var y = 50;

    // GRID 2 columnas
    var col1x = 10, col2x = 110, colW = 88;

    // --- COLUMNA IZQUIERDA ---
    // DENUE
    doc.setFillColor(248,249,250);
    doc.roundedRect(col1x, y, colW, 65, 2, 2, "F");
    doc.setDrawColor(229,231,235);
    doc.roundedRect(col1x, y, colW, 65, 2, 2, "S");
    doc.setFontSize(7);
    doc.setFont("helvetica","bold");
    doc.setTextColor(...gris);
    doc.text("DENUE · RADIO "+(p.radio||1000)+"M", col1x+3, y+5);
    doc.setDrawColor(...dorado);
    doc.line(col1x+3, y+6.5, col1x+colW-3, y+6.5);

    // KPIs DENUE
    doc.setFillColor(255,255,255);
    doc.roundedRect(col1x+2, y+8, 40, 12, 1, 1, "F");
    doc.roundedRect(col1x+46, y+8, 40, 12, 1, 1, "F");
    doc.setFontSize(7);
    doc.setTextColor(...gris);
    doc.text("RESTAURANTES", col1x+22, y+11, {align:"center"});
    doc.text("DENUES TOTAL", col1x+66, y+11, {align:"center"});
    doc.setFontSize(14);
    doc.setFont("helvetica","bold");
    doc.setTextColor(...dorado);
    doc.text(String(p.denue?p.denue.rest||0:0), col1x+22, y+18, {align:"center"});
    doc.text(String(p.denue?p.denue.tot||0:0), col1x+66, y+18, {align:"center"});

    // Desglose giros
    var dg = p.denue&&p.denue.desglose?p.denue.desglose:{};
    var dgItems = Object.keys(dg).sort(function(a,b){return dg[b]-dg[a];}).slice(0,6);
    var gy = y+24;
    dgItems.forEach(function(g){
      doc.setFontSize(8);
      doc.setFont("helvetica","normal");
      doc.setTextColor(55,65,81);
      doc.text(g, col1x+3, gy);
      doc.setFont("helvetica","bold");
      doc.setTextColor(...dorado);
      doc.text(String(dg[g]), col1x+colW-3, gy, {align:"right"});
      doc.setDrawColor(240,240,240);
      doc.line(col1x+3, gy+1, col1x+colW-3, gy+1);
      gy += 6;
    });

    // PROYECCIÓN
    var py2 = y + 68;
    if(p.proyRef){
      doc.setFillColor(248,249,250);
      doc.roundedRect(col1x, py2, colW, 45, 2, 2, "F");
      doc.setDrawColor(229,231,235);
      doc.roundedRect(col1x, py2, colW, 45, 2, 2, "S");
      doc.setFontSize(7);
      doc.setFont("helvetica","bold");
      doc.setTextColor(...gris);
      doc.text("PROYECCIÓN DE VENTAS", col1x+3, py2+5);
      doc.setDrawColor(...dorado);
      doc.line(col1x+3, py2+6.5, col1x+colW-3, py2+6.5);

      var potColor = p.proyPot&&p.proyPot.indexOf("ALTO")>=0?verde:p.proyPot&&p.proyPot.indexOf("BAJO")>=0?[239,68,68]:dorado;
      doc.setFontSize(9);
      doc.setFont("helvetica","bold");
      doc.setTextColor(...potColor);
      doc.text(p.proyPot||"MEDIO", col1x+colW-3, py2+5, {align:"right"});

      doc.setFillColor(255,255,255);
      doc.roundedRect(col1x+2, py2+8, 40, 14, 1, 1, "F");
      doc.roundedRect(col1x+46, py2+8, 40, 14, 1, 1, "F");
      doc.setFontSize(7);
      doc.setTextColor(...gris);
      doc.text("REFERENCIAL", col1x+22, py2+11, {align:"center"});
      doc.text("RANGO", col1x+66, py2+11, {align:"center"});
      doc.setFontSize(11);
      doc.setFont("helvetica","bold");
      doc.setTextColor(...verde);
      doc.text(p.proyRef||"-", col1x+22, py2+19, {align:"center"});
      doc.setFontSize(7);
      doc.setTextColor(...gris);
      doc.text(p.proyRango||"-", col1x+66, py2+16, {align:"center", maxWidth:38});

      doc.setFillColor(255,255,255);
      doc.roundedRect(col1x+2, py2+24, 40, 12, 1, 1, "F");
      doc.roundedRect(col1x+46, py2+24, 40, 12, 1, 1, "F");
      doc.setFontSize(7);
      doc.setTextColor(...gris);
      doc.text("INSTITUCIONAL", col1x+22, py2+27, {align:"center"});
      doc.text("OCASIÓN", col1x+66, py2+27, {align:"center"});
      doc.setFontSize(9);
      doc.setFont("helvetica","bold");
      doc.setTextColor(240,192,80);
      doc.text(p.proyInst||"-", col1x+22, py2+33, {align:"center"});
      doc.setTextColor(...dorado);
      doc.text(p.proyOcas||"-", col1x+66, py2+33, {align:"center"});

      doc.setFontSize(7);
      doc.setFont("helvetica","oblique");
      doc.setTextColor(...gris);
      doc.text(p.proyBase||"", col1x+3, py2+41, {maxWidth:colW-6});
    }

    // --- COLUMNA DERECHA ---
    // DATOS GENERALES
    doc.setFillColor(248,249,250);
    doc.roundedRect(col2x, y, colW, 75, 2, 2, "F");
    doc.setDrawColor(229,231,235);
    doc.roundedRect(col2x, y, colW, 75, 2, 2, "S");
    doc.setFontSize(7);
    doc.setFont("helvetica","bold");
    doc.setTextColor(...gris);
    doc.text("DATOS GENERALES", col2x+3, y+5);
    doc.setDrawColor(...dorado);
    doc.line(col2x+3, y+6.5, col2x+colW-3, y+6.5);

    var kpis = [];
    if(p.inegi&&p.inegi.pob) kpis.push({l:"POBLACIÓN", v:(p.inegi.pob/1000).toFixed(1)+"K", c:[58,143,255]});
    if(p.inegi&&p.inegi.viv) kpis.push({l:"VIVIENDAS", v:p.inegi.viv.toLocaleString(), c:[34,209,138]});
    if(p.precio) kpis.push({l:p.operacion==="venta"?"PRECIO":"RENTA/MES", v:"$"+parseFloat(p.precio).toLocaleString(), c:[34,209,138]});
    if(p.m2Terreno) kpis.push({l:"SUPERFICIE", v:p.m2Terreno+"m²", c:[55,65,81]});
    if(p.frente&&p.fondo) kpis.push({l:"FRENTE x FONDO", v:p.frente+"m x "+p.fondo+"m", c:[55,65,81]});

    var kx = col2x+2, ky = y+8, kw = 42;
    kpis.forEach(function(k, i){
      var kxi = kx + (i%2)*44;
      var kyi = ky + Math.floor(i/2)*16;
      doc.setFillColor(255,255,255);
      doc.roundedRect(kxi, kyi, kw, 13, 1, 1, "F");
      doc.setFontSize(6);
      doc.setFont("helvetica","normal");
      doc.setTextColor(...gris);
      doc.text(k.l, kxi+kw/2, kyi+4, {align:"center"});
      doc.setFontSize(10);
      doc.setFont("helvetica","bold");
      doc.setTextColor(...k.c);
      doc.text(k.v, kxi+kw/2, kyi+10, {align:"center"});
    });

    // GPS
    var gpsY = y+56;
    doc.setFillColor(255,255,255);
    doc.roundedRect(col2x+2, gpsY, colW-4, 16, 1, 1, "F");
    doc.setFontSize(6);
    doc.setFont("helvetica","bold");
    doc.setTextColor(...gris);
    doc.text("GPS", col2x+5, gpsY+4);
    doc.setFontSize(8);
    doc.setFont("helvetica","bold");
    doc.setTextColor(55,65,81);
    doc.text((p.lat||0).toFixed(5)+", "+(p.lng||0).toFixed(5), col2x+5, gpsY+9);
    doc.setFontSize(7);
    doc.setFont("helvetica","normal");
    doc.setTextColor(58,143,255);
    var gmaps = "maps.google.com/?q="+(p.lat||0).toFixed(5)+","+(p.lng||0).toFixed(5);
    doc.text(gmaps, col2x+5, gpsY+13);

    // SUCURSAL MÁS CERCANA
    if(p.sucNombre&&p.sucNombre!=="-"){
      var sy = y+78;
      doc.setFillColor(248,249,250);
      doc.roundedRect(col2x, sy, colW, 35, 2, 2, "F");
      doc.setDrawColor(229,231,235);
      doc.roundedRect(col2x, sy, colW, 35, 2, 2, "S");
      doc.setFontSize(7);
      doc.setFont("helvetica","bold");
      doc.setTextColor(...gris);
      doc.text("SUCURSAL MÁS CERCANA", col2x+3, sy+5);
      doc.setDrawColor(...dorado);
      doc.line(col2x+3, sy+6.5, col2x+colW-3, sy+6.5);
      doc.setFontSize(9);
      doc.setFont("helvetica","bold");
      doc.setTextColor(26,26,46);
      doc.text(p.sucNombre, col2x+3, sy+12);
      doc.setFillColor(255,255,255);
      doc.roundedRect(col2x+2, sy+14, 40, 12, 1, 1, "F");
      doc.roundedRect(col2x+46, sy+14, 40, 12, 1, 1, "F");
      doc.setFontSize(6);
      doc.setTextColor(...gris);
      doc.text("DISTANCIA", col2x+22, sy+17, {align:"center"});
      doc.text("VENTA REAL", col2x+66, sy+17, {align:"center"});
      doc.setFontSize(11);
      doc.setFont("helvetica","bold");
      doc.setTextColor(58,143,255);
      doc.text(p.sucDist||"-", col2x+22, sy+23, {align:"center"});
      doc.setTextColor(...verde);
      doc.text(p.sucVenta||"-", col2x+66, sy+23, {align:"center"});
      doc.setFontSize(7);
      doc.setFont("helvetica","normal");
      doc.setTextColor(...gris);
      doc.text(p.sucZona||"", col2x+3, sy+30);
    }

    // NOTAS
    if(p.notas){
      doc.setFillColor(248,249,250);
      doc.roundedRect(10, 220, W-20, 12, 2, 2, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica","bold");
      doc.setTextColor(...negro);
      doc.text("Notas: ", 13, 228);
      doc.setFont("helvetica","normal");
      doc.text(p.notas, 28, 228, {maxWidth: W-40});
    }

    // FOOTER
    doc.setFillColor(...azul);
    doc.rect(0, 282, W+10, 15, "F");
    doc.setFontSize(7);
    doc.setFont("helvetica","normal");
    doc.setTextColor(255,255,255);
    doc.text((p.lat||0).toFixed(5)+", "+(p.lng||0).toFixed(5), 13, 288);
    doc.text((p.tipo||"")+" · "+(p.fecha||""), W/2, 288, {align:"center"});
    doc.text("PIGER · Censo 2020 INEGI", W-13, 288, {align:"right"});

    const pdfBytes = doc.output("arraybuffer");

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="ficha-bafar.pdf"',
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch(e) {
    return new Response(JSON.stringify({error: e.message}), {
      status: 500,
      headers: {"Content-Type":"application/json","Access-Control-Allow-Origin":"*"}
    });
  }
}
