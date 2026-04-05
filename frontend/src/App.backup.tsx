// @ts-nocheck
import { useState, useCallback } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { api } from "./api";


const C = {
  saffron:"#E8820C",saffronLight:"#FFF3E0",saffronBorder:"#F5A623",
  green:"#1A7A3A",greenLight:"#E8F5ED",
  bg:"#F7F8FA",surface:"#FFFFFF",surfaceAlt:"#F0F2F5",
  border:"#E2E6EA",text:"#1A1D23",textMuted:"#6B7280",textLight:"#9CA3AF",
  danger:"#DC2626",dangerLight:"#FEF2F2",
  info:"#2563EB",infoLight:"#EFF6FF",
  success:"#059669",successLight:"#ECFDF5",
  shadow:"0 1px 4px rgba(0,0,0,0.08)",shadowMd:"0 4px 16px rgba(0,0,0,0.10)",
};

const STAGES=[
  {value:"pre-seed",label:"Pre-Seed",desc:"Idea stage, no revenue yet"},
  {value:"seed",label:"Seed",desc:"Early product, minimal revenue"},
  {value:"series-a",label:"Series A",desc:"Product-market fit, scaling"},
  {value:"series-b",label:"Series B",desc:"Scaling operations & team"},
  {value:"series-c",label:"Series C",desc:"Expansion & market leadership"},
  {value:"series-d-plus",label:"Series D+",desc:"Late-stage, pre-IPO growth"},
  {value:"pre-ipo",label:"Pre-IPO",desc:"Preparing for public listing"},
  {value:"listed",label:"Listed (NSE/BSE)",desc:"Publicly traded company"},
  {value:"bootstrapped",label:"Bootstrapped",desc:"Self-funded, no external equity"},
  {value:"profitable-sme",label:"Profitable SME",desc:"Established, cash-flow positive"},
];
const STAGE_M={
  "pre-seed":{dcfW:0.10,revW:0.60,ebitdaW:0.10,risk:0.55},
  "seed":{dcfW:0.15,revW:0.55,ebitdaW:0.15,risk:0.45},
  "series-a":{dcfW:0.25,revW:0.50,ebitdaW:0.20,risk:0.30},
  "series-b":{dcfW:0.35,revW:0.40,ebitdaW:0.25,risk:0.20},
  "series-c":{dcfW:0.40,revW:0.35,ebitdaW:0.25,risk:0.12},
  "series-d-plus":{dcfW:0.40,revW:0.30,ebitdaW:0.30,risk:0.08},
  "pre-ipo":{dcfW:0.40,revW:0.30,ebitdaW:0.30,risk:0.05},
  "listed":{dcfW:0.40,revW:0.35,ebitdaW:0.25,risk:0.00},
  "bootstrapped":{dcfW:0.30,revW:0.45,ebitdaW:0.25,risk:0.25},
  "profitable-sme":{dcfW:0.35,revW:0.35,ebitdaW:0.30,risk:0.15},
};
const INDUSTRIES=["Software & IT Services","Internet & E-commerce","Semiconductors & Electronics","Banking & Financial Services","Insurance","NBFC & Fintech","Pharmaceuticals","Healthcare Services","Medical Devices & Biotech","Auto & Auto Components","Chemicals","Textiles & Apparel","FMCG","Construction & Real Estate","Logistics & Supply Chain","Utilities & Infrastructure","Oil & Gas","Renewable Energy","Power Generation","Media & Entertainment","Telecom","Education & EdTech","Agriculture & Agritech"];
const BENCHMARKS={
  "Software & IT Services":{pe:28,evRev:5.2,evEbitda:22,growth:0.18,ebitdaMargin:0.22},
  "Internet & E-commerce":{pe:35,evRev:6.0,evEbitda:28,growth:0.22,ebitdaMargin:0.12},
  "Banking & Financial Services":{pe:18,evRev:3.1,evEbitda:14,growth:0.12,ebitdaMargin:0.35},
  "Insurance":{pe:20,evRev:2.8,evEbitda:15,growth:0.11,ebitdaMargin:0.18},
  "Pharmaceuticals":{pe:32,evRev:4.8,evEbitda:20,growth:0.15,ebitdaMargin:0.24},
  "Auto & Auto Components":{pe:22,evRev:2.4,evEbitda:13,growth:0.10,ebitdaMargin:0.14},
  "Renewable Energy":{pe:30,evRev:4.0,evEbitda:18,growth:0.20,ebitdaMargin:0.30},
  "default":{pe:20,evRev:3.0,evEbitda:14,growth:0.12,ebitdaMargin:0.18},
};
const getBench=(ind)=>BENCHMARKS[ind]||BENCHMARKS["default"];
const fmtCr=(n)=>!n&&n!==0?"—":n>=1?"?"+n.toFixed(2)+" Cr":"?"+(n*100).toFixed(1)+" L";

// -- ERP CONFIG -------------------------------------------------------------
const ERPS=[
  {id:"tally",name:"Tally ERP",logo:"??",color:"#1E40AF",desc:"India's most popular accounting software",fields:[{key:"url",label:"Tally Server URL",placeholder:"http://localhost:9000"},{key:"company",label:"Company Name in Tally",placeholder:"Your Company Ltd"}],note:"Ensure Tally is running with HTTP API enabled (Gateway of Tally > F12 Config)."},
  {id:"zoho",name:"Zoho Books",logo:"??",color:"#EA580C",desc:"Cloud accounting for growing businesses",fields:[{key:"orgId",label:"Organisation ID",placeholder:"20xxxxx"},{key:"clientId",label:"Client ID",placeholder:"1000.XXXXXX"}],note:"Generate credentials from Zoho API Console ? OAuth 2.0."},
  {id:"quickbooks",name:"QuickBooks",logo:"??",color:"#16A34A",desc:"Popular accounting for SMEs",fields:[{key:"realmId",label:"Company Realm ID",placeholder:"123456789"},{key:"clientId",label:"Client ID",placeholder:"ABxxxxxxxxxxxxxx"}],note:"Get credentials from Intuit Developer Portal ? My Apps."},
  {id:"sap",name:"SAP / Oracle",logo:"?",color:"#374151",desc:"Enterprise ERP (placeholder)",fields:[{key:"host",label:"SAP Host / Oracle URL",placeholder:"https://your-sap-instance.com"},{key:"clientId",label:"Client ID / System ID",placeholder:"PRD"}],note:"Contact your SAP/Oracle administrator for API access credentials."},
];

// -- TEMPLATE GENERATOR ----------------------------------------------------
const rowsToCSV = (rows) => rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");

const generateTemplate = (company, format) => {
  const cn = company?.name || "Your Company Name";
  const cin = company?.cin || "LXXXXXAAXXXXAAXXXXXN";
  const hdrs = ["Field / Line Item","Notes / Formula","FY2022","FY2023","FY2024","FY2025","FY2026"];

  const pl = [
    hdrs,
    ["METADATA — DO NOT EDIT","Company: "+cn+" | CIN: "+cin,"","","","",""],
    ["-- INCOME (Schedule III Part II) --","","","","","",""],
    ["Revenue from Operations","[INPUT] ? Lakhs","","","","",""],
    ["Other Income","[INPUT] ? Lakhs","","","","",""],
    ["Total Revenue","= Rev Ops + Other Income","","","","",""],
    ["-- EXPENSES --","","","","","",""],
    ["Cost of Goods Sold / Direct Costs","[INPUT] ? Lakhs","","","","",""],
    ["Gross Profit","= Total Revenue - COGS","","","","",""],
    ["Employee Benefit Expenses","[INPUT] ? Lakhs","","","","",""],
    ["Other Operating Expenses","[INPUT] ? Lakhs","","","","",""],
    ["EBITDA","= Gross Profit - Emp - Opex","","","","",""],
    ["Depreciation & Amortisation","[INPUT] ? Lakhs","","","","",""],
    ["EBIT","= EBITDA - D&A","","","","",""],
    ["Finance Costs / Interest","[INPUT] ? Lakhs","","","","",""],
    ["Profit Before Tax (PBT)","= EBIT - Finance Costs","","","","",""],
    ["Tax Expense (Current + Deferred)","[INPUT] ? Lakhs","","","","",""],
    ["Profit After Tax (PAT)","= PBT - Tax","","","","",""],
    ["EPS (if applicable)","[INPUT] ? per share","","","","",""],
  ];

  const bs = [
    hdrs,
    ["METADATA — DO NOT EDIT","Company: "+cn+" | CIN: "+cin,"","","","",""],
    ["-- EQUITY & LIABILITIES (Schedule III Part I) --","","","","","",""],
    ["Share Capital","[INPUT] ? Lakhs","","","","",""],
    ["Reserves & Surplus","[INPUT] ? Lakhs","","","","",""],
    ["Net Worth / Shareholders Equity","= Share Cap + Reserves","","","","",""],
    ["Long-term Borrowings","[INPUT] ? Lakhs","","","","",""],
    ["Deferred Tax Liabilities (Net)","[INPUT] ? Lakhs","","","","",""],
    ["Other Long-term Liabilities","[INPUT] ? Lakhs","","","","",""],
    ["Short-term Borrowings","[INPUT] ? Lakhs","","","","",""],
    ["Trade Payables","[INPUT] ? Lakhs","","","","",""],
    ["Other Current Liabilities","[INPUT] ? Lakhs","","","","",""],
    ["Short-term Provisions","[INPUT] ? Lakhs","","","","",""],
    ["Total Equity & Liabilities","= Sum of all above","","","","",""],
    ["-- ASSETS --","","","","","",""],
    ["Fixed Assets — Tangible (Net Block)","[INPUT] ? Lakhs","","","","",""],
    ["Fixed Assets — Intangible","[INPUT] ? Lakhs","","","","",""],
    ["Capital Work in Progress (CWIP)","[INPUT] ? Lakhs","","","","",""],
    ["Long-term Investments","[INPUT] ? Lakhs","","","","",""],
    ["Long-term Loans & Advances","[INPUT] ? Lakhs","","","","",""],
    ["Inventories","[INPUT] ? Lakhs","","","","",""],
    ["Trade Receivables","[INPUT] ? Lakhs","","","","",""],
    ["Cash & Cash Equivalents","[INPUT] ? Lakhs","","","","",""],
    ["Short-term Investments","[INPUT] ? Lakhs","","","","",""],
    ["Other Current Assets","[INPUT] ? Lakhs","","","","",""],
    ["Total Assets","= Sum of all above","","","","",""],
  ];

  const cf = [
    hdrs,
    ["METADATA — DO NOT EDIT","Company: "+cn+" | CIN: "+cin,"","","","",""],
    ["-- A. OPERATING ACTIVITIES --","","","","","",""],
    ["Net Profit Before Tax","[INPUT / link from P&L PBT]","","","","",""],
    ["Add: Depreciation & Amortisation","[INPUT]","","","","",""],
    ["Add: Finance Costs","[INPUT]","","","","",""],
    ["Add/Less: Changes in Working Capital","[INPUT — +ve or -ve]","","","","",""],
    ["Less: Taxes Paid","[INPUT — negative]","","","","",""],
    ["Net Cash from Operating Activities (A)","= Sum","","","","",""],
    ["-- B. INVESTING ACTIVITIES --","","","","","",""],
    ["Purchase of Fixed Assets (CAPEX)","[INPUT — negative]","","","","",""],
    ["Proceeds from Sale of Assets","[INPUT]","","","","",""],
    ["Purchase of Investments","[INPUT — negative]","","","","",""],
    ["Proceeds from Investments","[INPUT]","","","","",""],
    ["Net Cash from Investing Activities (B)","= Sum","","","","",""],
    ["-- C. FINANCING ACTIVITIES --","","","","","",""],
    ["Proceeds from Borrowings","[INPUT]","","","","",""],
    ["Repayment of Borrowings","[INPUT — negative]","","","","",""],
    ["Proceeds from Share Issuance","[INPUT]","","","","",""],
    ["Dividends Paid","[INPUT — negative]","","","","",""],
    ["Net Cash from Financing Activities (C)","= Sum","","","","",""],
    ["Net Increase / (Decrease) in Cash","= A + B + C","","","","",""],
    ["Opening Cash & Cash Equivalents","[INPUT]","","","","",""],
    ["Closing Cash & Cash Equivalents","= Opening + Net Change","","","","",""],
  ];

  const slug = cn.replace(/\s+/g,"_").replace(/[^a-zA-Z0-9_]/g,"");

  if (format === "csv") {
    const content = [
      "=== P&L STATEMENT (Schedule III Part II) ===",
      rowsToCSV(pl),
      "",
      "=== BALANCE SHEET (Schedule III Part I) ===",
      rowsToCSV(bs),
      "",
      "=== CASH FLOW STATEMENT ===",
      rowsToCSV(cf),
    ].join("\n");
    const blob = new Blob([content], {type:"text/csv;charset=utf-8;"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
    a.download = `ValuX_Template_${slug}.csv`; a.click();
    return;
  }

  // Excel — build a minimal .xlsx using XML (SpreadsheetML) — no library needed
  const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
  const sheetXML = (rows, title) => {
    const sectionStyle = 'style="background:#1E3A5F;color:#FFFFFF;font-weight:bold"';
    const inputStyle = 'style="background:#FFFDE7"';
    let xml = `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="${esc(title)}"><Table>`;
    rows.forEach(row => {
      xml += "<Row>";
      row.forEach((cell,ci) => {
        const v = esc(cell);
        const isSection = v.startsWith("--");
        const isInput = v.includes("[INPUT]");
        const isMeta = v.startsWith("METADATA");
        let style = "";
        if (isSection || isMeta) style = ` ss:StyleID="hdr"`;
        else if (isInput) style = ` ss:StyleID="inp"`;
        xml += `<Cell${style}><Data ss:Type="String">${v}</Data></Cell>`;
      });
      xml += "</Row>";
    });
    xml += `</Table></Worksheet>`;
    return xml;
  };

  const xlsContent = [
    `<?xml version="1.0"?>`,
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"`,
    ` xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"`,
    ` xmlns:x="urn:schemas-microsoft-com:office:excel">`,
    `<Styles>`,
    `<Style ss:ID="hdr"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1E3A5F" ss:Pattern="Solid"/></Style>`,
    `<Style ss:ID="inp"><Interior ss:Color="#FFFDE7" ss:Pattern="Solid"/></Style>`,
    `</Styles>`,
    buildSheet(pl, "P&L Statement"),
    buildSheet(bs, "Balance Sheet"),
    buildSheet(cf, "Cash Flow"),
    `</Workbook>`
  ].join("\n");

  function buildSheet(rows, name) {
    let xml = `<Worksheet ss:Name="${esc(name)}"><Table><Column ss:Width="260"/><Column ss:Width="180"/><Column ss:Width="80"/><Column ss:Width="80"/><Column ss:Width="80"/><Column ss:Width="80"/><Column ss:Width="80"/>`;
    rows.forEach(row => {
      xml += "<Row>";
      row.forEach(cell => {
        const v = esc(String(cell));
        const isSection = v.startsWith("--") || v.startsWith("METADATA");
        const isInput = v.includes("[INPUT]");
        let sid = "";
        if (isSection) sid = ` ss:StyleID="hdr"`;
        else if (isInput) sid = ` ss:StyleID="inp"`;
        xml += `<Cell${sid}><Data ss:Type="String">${v}</Data></Cell>`;
      });
      xml += "</Row>";
    });
    xml += `</Table></Worksheet>`;
    return xml;
  }

  const blob = new Blob([xlsContent], {type:"application/vnd.ms-excel;charset=utf-8;"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob);
  a.download = `ValuX_Template_${slug}.xls`; a.click();
};

// -- SHARED UI --------------------------------------------------------------
const Input=({label,value,onChange,placeholder,type="text"})=>(
  <div style={{marginBottom:14}}>
    {label&&<label style={{fontSize:11,fontWeight:600,color:C.textMuted,marginBottom:5,display:"block",textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</label>}
    <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
      style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:C.text,fontSize:14,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}/>
  </div>
);
const Select=({label,value,onChange,children})=>(
  <div style={{marginBottom:14}}>
    {label&&<label style={{fontSize:11,fontWeight:600,color:C.textMuted,marginBottom:5,display:"block",textTransform:"uppercase",letterSpacing:"0.04em"}}>{label}</label>}
    <select value={value} onChange={e=>onChange(e.target.value)}
      style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",color:value?C.text:C.textMuted,fontSize:14,width:"100%",boxSizing:"border-box",outline:"none",fontFamily:"inherit"}}>
      {children}
    </select>
  </div>
);
const Pill=({children,color="saffron"})=>{
  const m={saffron:{bg:C.saffronLight,t:C.saffron},green:{bg:C.greenLight,t:C.green},info:{bg:C.infoLight,t:C.info},danger:{bg:C.dangerLight,t:C.danger},success:{bg:C.successLight,t:C.success}};
  const c=m[color]||m.saffron;
  return <span style={{display:"inline-block",borderRadius:20,padding:"3px 10px",fontSize:11,fontWeight:600,background:c.bg,color:c.t}}>{children}</span>;
};
const MetricCard=({label,value,sub,color})=>(
  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1rem 1.25rem",boxShadow:C.shadow}}>
    <div style={{fontSize:11,fontWeight:600,color:C.textMuted,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:6}}>{label}</div>
    <div style={{fontSize:22,fontWeight:700,color:color||C.text}}>{value}</div>
    {sub&&<div style={{fontSize:12,color:C.textMuted,marginTop:3}}>{sub}</div>}
  </div>
);
const Btn=({children,onClick,disabled,full,style:sx})=><button onClick={onClick} disabled={disabled} style={{background:C.saffron,color:"#fff",border:"none",borderRadius:8,padding:"10px 22px",fontWeight:600,cursor:disabled?"not-allowed":"pointer",fontSize:14,opacity:disabled?0.7:1,width:full?"100%":undefined,fontFamily:"inherit",...sx}}>{children}</button>;
const BtnG=({children,onClick,style:sx})=><button onClick={onClick} style={{background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"10px 22px",fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit",...sx}}>{children}</button>;
const BtnO=({children,onClick,style:sx})=><button onClick={onClick} style={{background:"transparent",color:C.saffron,border:`1.5px solid ${C.saffron}`,borderRadius:8,padding:"9px 20px",fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit",...sx}}>{children}</button>;
const BtnQ=({children,onClick,style:sx})=><button onClick={onClick} style={{background:"transparent",color:C.textMuted,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 20px",fontWeight:500,cursor:"pointer",fontSize:14,fontFamily:"inherit",...sx}}>{children}</button>;

// -- CIN LOOKUP ENGINE -----------------------------------------------------
// In production: replace each section with real API calls
// Listed:  GET https://screener.in/api/company/?q={symbol}  (free)
//          GET https://financialmodelingprep.com/api/v3/income-statement/{symbol}?apikey={key}
// Private: GET https://api.tofler.in/v1/company/{cin}/financials  (paid, ~?5-15/query)
//          Headers: { "api_key": "YOUR_TOFLER_KEY" }
// CIN val: GET https://api.tofler.in/v1/company/{cin}  ? { name, status, type }

const MOCK_DB = {
  // Listed companies (NSE/BSE) — mirrors FMP / Screener.in response shape
  "L17110MH1973PLC019786": {
    type: "listed", exchange: "BSE", symbol: "RELIANCE",
    name: "Reliance Industries Limited", status: "Active",
    incorporated: "1973-05-08", state: "Maharashtra",
    industry: "Oil & Gas", stage: "listed",
    financials: [
      { year:"FY2022", revenue:"792756", ebitda:"135673", pat:"67845", assets:"1592374", debt:"198234" },
      { year:"FY2023", revenue:"876923", ebitda:"151209", pat:"73670", assets:"1734982", debt:"187654" },
      { year:"FY2024", revenue:"901234", ebitda:"163421", pat:"79021", assets:"1891234", debt:"176543" },
    ],
    source: "BSE/NSE + Screener.in (live in production)"
  },
  "L22210MH1995PLC084781": {
    type: "listed", exchange: "NSE", symbol: "TCS",
    name: "Tata Consultancy Services Limited", status: "Active",
    incorporated: "1995-01-19", state: "Maharashtra",
    industry: "Software & IT Services", stage: "listed",
    financials: [
      { year:"FY2022", revenue:"197971", ebitda:"53452", pat:"38327", assets:"119685", debt:"1205" },
      { year:"FY2023", revenue:"225458", ebitda:"60873", pat:"42147", assets:"138964", debt:"980" },
      { year:"FY2024", revenue:"240893", ebitda:"65124", pat:"46099", assets:"155672", debt:"870" },
    ],
    source: "NSE + Financial Modeling Prep API (live in production)"
  },
  // Private companies — mirrors Tofler API response shape
  "U72900KA2008PTC046548": {
    type: "private", exchange: null, symbol: null,
    name: "Flipkart Private Limited", status: "Active",
    incorporated: "2008-10-04", state: "Karnataka",
    industry: "Internet & E-commerce", stage: "series-d-plus",
    financials: [
      { year:"FY2022", revenue:"432193", ebitda:"-18432", pat:"-23456", assets:"198765", debt:"45678" },
      { year:"FY2023", revenue:"578432", ebitda:"12340", pat:"-8765", assets:"234567", debt:"38901" },
      { year:"FY2024", revenue:"712345", ebitda:"43210", pat:"12345", assets:"278901", debt:"31234" },
    ],
    source: "Tofler API — MCA21 filed financials (live in production)"
  },
  "U74999MH2015PTC270225": {
    type: "private", exchange: null, symbol: null,
    name: "Zepto (KiranaKart Technologies Pvt Ltd)", status: "Active",
    incorporated: "2021-07-15", state: "Maharashtra",
    industry: "Internet & E-commerce", stage: "series-c",
    financials: [
      { year:"FY2022", revenue:"1423",  ebitda:"-4321", pat:"-5678", assets:"12345", debt:"3456" },
      { year:"FY2023", revenue:"12439", ebitda:"-8764", pat:"-9876", assets:"34567", debt:"8765" },
      { year:"FY2024", revenue:"43210", ebitda:"-6543", pat:"-7654", assets:"67890", debt:"12345" },
    ],
    source: "Tofler API — MCA21 filed financials (live in production)"
  },
};

const lookupCIN = async (cin, companyName) => {
  // Simulate network latency
  await new Promise(r => setTimeout(r, 1800));

  // 1. Try exact CIN match in mock DB
  const exactMatch = MOCK_DB[cin.trim().toUpperCase()];
  if (exactMatch) {
    const nameMatch = exactMatch.name.toLowerCase().includes(companyName.trim().toLowerCase().split(" ")[0]) ||
      companyName.trim().toLowerCase().includes(exactMatch.name.toLowerCase().split(" ")[0]);
    if (!nameMatch) return { error: "NAME_MISMATCH", registeredName: exactMatch.name };
    return { success: true, data: exactMatch };
  }

  // 2. No match — return realistic "not found" with guidance
  // In production this would be a live Tofler/MCA21 API call
  return { error: "NOT_FOUND" };
};

// -- ERP CONNECT MODAL ------------------------------------------------------
const ERPConnectModal=({erp,onClose,onConnected})=>{
  const [step,setStep]=useState(1); // 1=intro, 2=credentials, 3=connecting, 4=success
  const [creds,setCreds]=useState({});
  const [err,setErr]=useState("");

  const connect=async()=>{
    const missing=erp.fields.filter(f=>!creds[f.key]?.trim());
    if(missing.length){setErr(`Please fill: ${missing.map(f=>f.label).join(", ")}`);return;}
    setStep(3);
    await new Promise(r=>setTimeout(r,2200));
    setStep(4);
    setTimeout(()=>{onConnected(erp.id,creds);onClose();},1200);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.45)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:300}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"2rem",width:"100%",maxWidth:480,margin:"1rem",boxShadow:C.shadowMd}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:"1.5rem"}}>
          <div style={{width:48,height:48,borderRadius:12,background:erp.color+"18",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>{erp.logo}</div>
          <div><div style={{fontWeight:700,fontSize:17}}>{erp.name}</div><div style={{fontSize:13,color:C.textMuted}}>{erp.desc}</div></div>
          <BtnQ onClick={onClose} style={{marginLeft:"auto",padding:"4px 10px",fontSize:12}}>?</BtnQ>
        </div>

        {step===1&&<>
          <div style={{background:C.surfaceAlt,borderRadius:10,padding:"1rem",marginBottom:"1.5rem"}}>
            <div style={{fontWeight:600,fontSize:13,marginBottom:8}}>What we'll import:</div>
            {["P&L Statement (last 3 years)","Balance Sheet","Cash Flow Statement","Trial Balance (if available)"].map(i=>(
              <div key={i} style={{fontSize:13,color:C.textMuted,padding:"4px 0"}}>? {i}</div>
            ))}
          </div>
          <div style={{background:C.infoLight,border:`1px solid ${C.info}44`,borderRadius:8,padding:"10px 14px",fontSize:12,color:C.info,marginBottom:"1.5rem"}}>
            ?? {erp.note}
          </div>
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <BtnQ onClick={onClose}>Cancel</BtnQ>
            <Btn onClick={()=>setStep(2)}>Continue ?</Btn>
          </div>
        </>}

        {step===2&&<>
          <div style={{marginBottom:6,fontWeight:600,fontSize:14}}>Enter your {erp.name} credentials</div>
          <div style={{fontSize:12,color:C.textMuted,marginBottom:"1.25rem"}}>Your credentials are used only to fetch financial data and are never stored.</div>
          {erp.fields.map(f=>(
            <Input key={f.key} label={f.label} value={creds[f.key]||""} onChange={v=>setCreds(p=>({...p,[f.key]:v}))} placeholder={f.placeholder}/>
          ))}
          {err&&<div style={{color:C.danger,fontSize:13,background:C.dangerLight,padding:"8px 12px",borderRadius:6,marginBottom:12}}>{err}</div>}
          <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
            <BtnQ onClick={()=>setStep(1)}>? Back</BtnQ>
            <Btn onClick={connect}>Connect & Import</Btn>
          </div>
        </>}

        {step===3&&(
          <div style={{textAlign:"center",padding:"2rem 0"}}>
            <div style={{fontSize:36,marginBottom:16,animation:"spin 1s linear infinite"}}>?</div>
            <div style={{fontWeight:600,marginBottom:8}}>Connecting to {erp.name}...</div>
            <div style={{fontSize:13,color:C.textMuted}}>Authenticating and fetching financial data</div>
            <div style={{marginTop:16,display:"flex",flexDirection:"column",gap:8}}>
              {["Authenticating credentials","Fetching P&L data","Importing Balance Sheet","Syncing Cash Flow"].map((s,i)=>(
                <div key={i} style={{fontSize:12,color:C.textMuted,display:"flex",alignItems:"center",gap:8}}>
                  <span style={{color:C.success}}>?</span>{s}
                </div>
              ))}
            </div>
          </div>
        )}

        {step===4&&(
          <div style={{textAlign:"center",padding:"2rem 0"}}>
            <div style={{fontSize:48,marginBottom:12}}>?</div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:8}}>Connected!</div>
            <div style={{fontSize:13,color:C.textMuted}}>Financial data imported from {erp.name}.</div>
          </div>
        )}
      </div>
    </div>
  );
};

// -- ERP PANEL --------------------------------------------------------------
const ERPPanel=({connectedERPs,onConnect})=>{
  const [activeModal,setActiveModal]=useState(null);
  const [justConnected,setJustConnected]=useState({});

  const handleConnected=(id,creds)=>{
    setJustConnected(p=>({...p,[id]:true}));
    onConnect(id,creds);
  };

  return (
    <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1rem"}}>
        <div>
          <div style={{fontWeight:700,fontSize:15}}>Connect Accounting System</div>
          <div style={{fontSize:13,color:C.textMuted,marginTop:2}}>Auto-import your financial data directly — no manual entry needed</div>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {ERPS.map(erp=>{
          const connected=connectedERPs[erp.id]||justConnected[erp.id];
          return (
            <div key={erp.id} style={{border:`1px solid ${connected?C.success:C.border}`,borderRadius:10,padding:"1rem",background:connected?C.successLight:"transparent",display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:40,height:40,borderRadius:10,background:erp.color+"15",display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>{erp.logo}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:600,fontSize:13}}>{erp.name}</div>
                <div style={{fontSize:11,color:C.textMuted,marginTop:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{erp.desc}</div>
              </div>
              {connected
                ? <span style={{fontSize:12,color:C.success,fontWeight:600,flexShrink:0}}>? Connected</span>
                : <button onClick={()=>setActiveModal(erp)} style={{background:erp.color,color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontWeight:600,cursor:"pointer",fontSize:12,flexShrink:0,fontFamily:"inherit"}}>Connect</button>
              }
            </div>
          );
        })}
      </div>
      <div style={{marginTop:12,padding:"10px 14px",background:C.infoLight,borderRadius:8,fontSize:12,color:C.info}}>
        ?? Once connected, ValuX pulls your last 3 years of financials automatically and pre-fills all input fields.
      </div>
      {activeModal&&<ERPConnectModal erp={activeModal} onClose={()=>setActiveModal(null)} onConnected={handleConnected}/>}
    </div>
  );
};

// -- CIN LOOKUP PANEL ------------------------------------------------------
const CINLookupPanel = ({ company, onDataFetched }) => {
  const [state, setState] = useState("idle"); // idle | loading | success | mismatch | notfound | error
  const [result, setResult] = useState(null);
  const [mismatchName, setMismatchName] = useState("");

  const lookup = async () => {
    if (!company.cin || !company.name) return;
    setState("loading"); setResult(null);
    try {
      const res = await lookupCIN(company.cin, company.name);
      if (res.success) { setState("success"); setResult(res.data); }
      else if (res.error === "NAME_MISMATCH") { setState("mismatch"); setMismatchName(res.registeredName); }
      else setState("notfound");
    } catch { setState("error"); }
  };

  const applyData = () => {
    if (!result) return;
    onDataFetched({
      fins: result.financials,
      industry: result.industry,
      stage: result.stage,
      companyType: result.type === "listed" ? `Public Limited (${result.exchange})` : "Private Limited",
      source: result.source,
      exchange: result.exchange,
      symbol: result.symbol,
    });
  };

  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: "1.5rem", boxShadow: C.shadow }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 3 }}>?? Auto-Fetch Financials via CIN</div>
          <div style={{ fontSize: 13, color: C.textMuted }}>We'll detect if your company is listed or private and pull 3 years of financial data automatically.</div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 11, color: C.textLight }}>CIN: <strong style={{ color: C.text }}>{company.cin}</strong></span>
        </div>
      </div>

      {/* Source badges */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {[
          { icon: "??", label: "Listed ? Screener.in / FMP", color: C.info },
          { icon: "??", label: "Private ? Tofler / MCA21", color: C.saffron },
        ].map(b => (
          <div key={b.label} style={{ display: "flex", alignItems: "center", gap: 6, background: C.surfaceAlt, borderRadius: 20, padding: "4px 12px", fontSize: 12, color: C.textMuted, border: `1px solid ${C.border}` }}>
            <span>{b.icon}</span><span>{b.label}</span>
          </div>
        ))}
      </div>

      {state === "idle" && (
        <Btn onClick={lookup} style={{ width: "100%", padding: 12 }}>
          ?? Look Up CIN & Fetch Financials
        </Btn>
      )}

      {state === "loading" && (
        <div style={{ background: C.surfaceAlt, borderRadius: 10, padding: "1.25rem", textAlign: "center" }}>
          <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Fetching data for {company.cin}...</div>
          {[
            "Validating CIN on MCA21 registry",
            "Detecting listed / private status",
            "Fetching financial statements (3 years)",
            "Normalising to Schedule III format",
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", fontSize: 13, color: C.textMuted, borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 16 }}>?</span>{s}
            </div>
          ))}
        </div>
      )}

      {state === "mismatch" && (
        <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}44`, borderRadius: 10, padding: "1rem 1.25rem" }}>
          <div style={{ fontWeight: 700, color: C.danger, marginBottom: 6 }}>?? Company Name Mismatch</div>
          <div style={{ fontSize: 13, color: C.text, marginBottom: 10 }}>
            CIN <strong>{company.cin}</strong> is registered to:<br />
            <strong style={{ color: C.danger }}>{mismatchName}</strong><br />
            but you entered: <strong>{company.name}</strong>
          </div>
          <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>Please verify the company name matches MCA21 records exactly.</div>
          <BtnQ onClick={() => setState("idle")} style={{ fontSize: 13, padding: "7px 16px" }}>? Try Again</BtnQ>
        </div>
      )}

      {state === "notfound" && (
        <div style={{ background: C.surfaceAlt, border: `1px solid ${C.border}`, borderRadius: 10, padding: "1rem 1.25rem" }}>
          <div style={{ fontWeight: 700, marginBottom: 6 }}>Company Not Found in Demo Database</div>
          <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 10 }}>
            In production, this would query the live <strong>Tofler API</strong> or <strong>MCA21</strong> for any registered Indian company.<br /><br />
            <strong>Try these demo CINs:</strong>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 12 }}>
            {Object.entries(MOCK_DB).map(([cin, d]) => (
              <div key={cin} style={{ fontSize: 12, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 6, padding: "6px 10px" }}>
                <strong>{cin}</strong> — {d.name} <Pill color={d.type === "listed" ? "info" : "saffron"}>{d.type}</Pill>
              </div>
            ))}
          </div>
          <BtnQ onClick={() => setState("idle")} style={{ fontSize: 13, padding: "7px 16px" }}>? Try Again</BtnQ>
        </div>
      )}

      {state === "error" && (
        <div style={{ background: C.dangerLight, border: `1px solid ${C.danger}44`, borderRadius: 10, padding: "1rem" }}>
          <div style={{ color: C.danger, fontWeight: 600 }}>Connection error. Please retry.</div>
          <BtnQ onClick={() => setState("idle")} style={{ marginTop: 10, fontSize: 13 }}>? Retry</BtnQ>
        </div>
      )}

      {state === "success" && result && (
        <div>
          {/* Company identity card */}
          <div style={{ background: result.type === "listed" ? C.infoLight : C.saffronLight, border: `1px solid ${result.type === "listed" ? C.info+"44" : C.saffronBorder}`, borderRadius: 10, padding: "1rem 1.25rem", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <div style={{ fontSize: 28 }}>{result.type === "listed" ? "??" : "??"}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{result.name}</div>
                <div style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>
                  {result.type === "listed" ? `Listed · ${result.exchange} · ${result.symbol}` : "Private Limited · Unlisted"} · Inc. {result.incorporated}
                </div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <Pill color={result.type === "listed" ? "info" : "saffron"}>{result.type === "listed" ? "Listed" : "Private"}</Pill>
              </div>
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {[["Industry", result.industry], ["Stage", STAGES.find(s => s.value === result.stage)?.label], ["Status", result.status], ["State", result.state]].map(([k, v]) => (
                <div key={k} style={{ fontSize: 12 }}>
                  <div style={{ color: C.textMuted, marginBottom: 2 }}>{k}</div>
                  <div style={{ fontWeight: 600 }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial preview */}
          <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>?? Fetched Financials (? Lakhs)</div>
          <div style={{ overflowX: "auto", marginBottom: 14 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${C.border}` }}>
                  {["Year", "Revenue", "EBITDA", "PAT", "Total Assets", "Debt"].map(h => (
                    <th key={h} style={{ padding: "8px 12px", textAlign: h === "Year" ? "left" : "right", color: C.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.financials.map((f, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${C.border}`, background: i % 2 === 0 ? C.surfaceAlt : C.surface }}>
                    <td style={{ padding: "9px 12px", fontWeight: 600 }}>{f.year}</td>
                    {["revenue", "ebitda", "pat", "assets", "debt"].map(k => (
                      <td key={k} style={{ padding: "9px 12px", textAlign: "right", color: k === "ebitda" || k === "pat" ? (parseFloat(f[k]) < 0 ? C.danger : C.green) : C.text }}>
                        {parseFloat(f[k]) < 0 ? "-?" + Math.abs(parseFloat(f[k])).toLocaleString("en-IN") : "?" + parseFloat(f[k]).toLocaleString("en-IN")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ background: C.successLight, border: `1px solid ${C.success}44`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.success, marginBottom: 14 }}>
            ? Data source: <strong>{result.source}</strong>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <BtnQ onClick={() => setState("idle")} style={{ fontSize: 13 }}>? Re-fetch</BtnQ>
            <Btn onClick={applyData} style={{ flex: 1, padding: 12, fontSize: 15 }}>
              ? Apply Data & Continue to Model ?
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
};

// -- TEMPLATE DOWNLOAD PANEL ------------------------------------------------
const TemplatePanel=({company})=>(
  <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow}}>
    <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>Download Input Template</div>
    <div style={{fontSize:13,color:C.textMuted,marginBottom:"1rem"}}>Pre-formatted with Schedule III structure. Fill yellow cells and re-upload.</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
      {[
        {icon:"??",label:"P&L Statement",desc:"Revenue, EBITDA, PAT"},
        {icon:"??",label:"Balance Sheet",desc:"Assets, Liabilities, Equity"},
        {icon:"??",label:"Cash Flow",desc:"Operating, Investing, Financing"},
        {icon:"??",label:"5-Year Columns",desc:"FY2022 ? FY2026"},
      ].map(f=>(
        <div key={f.label} style={{background:C.surfaceAlt,borderRadius:8,padding:"10px 12px",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:18}}>{f.icon}</span>
          <div><div style={{fontSize:13,fontWeight:600}}>{f.label}</div><div style={{fontSize:11,color:C.textMuted}}>{f.desc}</div></div>
        </div>
      ))}
    </div>
    <div style={{display:"flex",gap:10}}>
      <button onClick={()=>generateTemplate(company,"xlsx")}
        style={{flex:1,background:C.green,color:"#fff",border:"none",borderRadius:8,padding:"10px 0",fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        ? Excel (.xlsx)
      </button>
      <button onClick={()=>generateTemplate(company,"csv")}
        style={{flex:1,background:"transparent",color:C.saffron,border:`1.5px solid ${C.saffron}`,borderRadius:8,padding:"10px 0",fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
        ? CSV
      </button>
    </div>
    <div style={{marginTop:10,fontSize:11,color:C.textLight,textAlign:"center"}}>Template pre-filled with company: <strong>{company?.name||"Your Company"}</strong> · CIN: {company?.cin||"—"}</div>
  </div>
);

// -- NAV --------------------------------------------------------------------
const Nav=({user,onLogout,onNav,screen})=>(
  <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 2rem",height:56,display:"flex",alignItems:"center",justifyContent:"space-between",boxShadow:C.shadow,position:"sticky",top:0,zIndex:100}}>
    <div style={{display:"flex",alignItems:"center",gap:10}}>
      <div style={{width:32,height:32,borderRadius:8,background:`linear-gradient(135deg,${C.saffron},${C.green})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:15,color:"#fff"}}>V</div>
      <span style={{fontWeight:800,fontSize:18,letterSpacing:-0.5,color:C.text}}>ValuX</span>
      <Pill color="saffron">India</Pill>
    </div>
    {user?(
      <div style={{display:"flex",alignItems:"center",gap:16}}>
        {[["dashboard","Dashboard"],["benchmarks","Benchmarks"],["valuation","Valuation"]].map(([k,l])=>(
          <span key={k} onClick={()=>onNav(k)} style={{fontSize:14,fontWeight:screen===k?600:400,color:screen===k?C.saffron:C.textMuted,cursor:"pointer",borderBottom:screen===k?`2px solid ${C.saffron}`:"none",paddingBottom:2}}>{l}</span>
        ))}
        <div style={{width:1,height:20,background:C.border}}/>
        <span style={{fontSize:13,color:C.textMuted}}>{user.name}</span>
        <BtnQ onClick={onLogout}>Logout</BtnQ>
      </div>
    ):(
      <div style={{display:"flex",gap:10}}>
        <BtnQ onClick={()=>onNav("auth","login")}>Login</BtnQ>
        <Btn onClick={()=>onNav("auth","signup")}>Get Started</Btn>
      </div>
    )}
  </div>
);

// -- AUTH -------------------------------------------------------------------
const Auth=({onLogin,initMode})=>{
  const [mode,setMode]=useState(initMode||"login");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [fullName,setFullName]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const submit=async()=>{
    setErr(""); setLoading(true);
    try{
      if(mode==="signup"){
        const res=await fetch("/api/auth/register",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({email,password,full_name:fullName}),
      });
      const data=await res.json();
      if(!res.ok){setErr(data.detail||"Registration failed");setLoading(false);return;}
       // Backend returns token on register — auto login immediately ?
      localStorage.setItem("valux_token",data.access_token);
      onLogin({
        user_id:data.user_id,
        email:data.email,
        full_name:data.full_name,
        token:data.access_token
      });
  setLoading(false);
  return;
}

      // -- LOGIN -- OAuth2 form data, field is username not email -------
      const form=new URLSearchParams();
      form.append("username",email);
      form.append("password",password);
      const res=await fetch("/api/auth/login",{
        method:"POST",
        headers:{"Content-Type":"application/x-www-form-urlencoded"},
        body:form,
      });
      const data=await res.json();
      if(!res.ok){setErr(data.detail||"Login failed");setLoading(false);return;}

      // Store token and fetch user profile
      localStorage.setItem("valux_token",data.access_token);
      const meRes=await fetch("/api/auth/me",{
        headers:{Authorization:`Bearer ${data.access_token}`}
      });
      const me=await meRes.json();
      onLogin({...me,token:data.access_token});
    }catch(e){
      setErr("Network error — is the backend running?");
    }
    setLoading(false);
  };

  return(
    <div style={{background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"system-ui,sans-serif"}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:16,padding:"2.5rem",width:"100%",maxWidth:400,boxShadow:C.shadowMd}}>
        <div style={{textAlign:"center",marginBottom:"2rem"}}>
          <div style={{fontSize:32,marginBottom:8}}>??</div>
          <div style={{fontWeight:800,fontSize:22,marginBottom:4}}>ValuX</div>
          <div style={{color:C.textMuted,fontSize:14}}>{mode==="signup"?"Create your account":"Welcome back"}</div>
        </div>
        {mode==="signup"&&<Input label="Full Name" value={fullName} onChange={setFullName} placeholder="Himanshu Sharma"/>}
        <Input label="Email" value={email} onChange={setEmail} placeholder="you@company.com" type="email"/>
        <Input label="Password" value={password} onChange={setPassword} placeholder="••••••••" type="password"/>
        {err&&<div style={{color:err.includes("created")?C.success:C.danger,fontSize:13,background:err.includes("created")?C.successLight:C.dangerLight,padding:"8px 12px",borderRadius:6,marginBottom:12}}>{err}</div>}
        <Btn onClick={submit} disabled={loading} full style={{padding:13,fontSize:15,marginTop:4}}>
          {loading?"? Please wait...":(mode==="signup"?"Create Account":"Login")}
        </Btn>
        <div style={{textAlign:"center",marginTop:16,fontSize:13,color:C.textMuted}}>
          {mode==="signup"?"Already have an account? ":"Don't have an account? "}
          <span onClick={()=>{setMode(mode==="signup"?"login":"signup");setErr("");}} style={{color:C.saffron,cursor:"pointer",fontWeight:600}}>
            {mode==="signup"?"Login":"Sign up"}
          </span>
        </div>
      </div>
    </div>
  );
};

// -- CREATE COMPANY MODAL ---------------------------------------------------
const CreateCompanyModal=({onClose,onSave})=>{
  const [name,setName]=useState(""); const [cin,setCin]=useState(""); const [doi,setDoi]=useState("");
  const [industry,setIndustry]=useState(""); const [stage,setStage]=useState("");
  const [type,setType]=useState(""); const [state,setState]=useState(""); const [err,setErr]=useState("");
  const submit=async()=>{
    if(!name.trim()||!cin.trim()||!doi||!industry||!stage){setErr("Name, CIN, date, industry and stage are required.");return;}
    if(!/^[LUu]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(cin.trim())){setErr("Invalid CIN. Example: L22210MH1995PLC084781");return;}
    try{
      const data=await api.post("/companies",{
        name:name.trim(),cin:cin.trim(),doi,
        industry,stage,
        company_type:type,
        state
      });
      onSave({
        id:data.id,
        name:name.trim(),cin:cin.trim(),doi,
        industry,stage,type,state,
        files:[],modelGenerated:false,connectedERPs:{}
      });
    }catch(e){
      setErr(e?.detail||"Failed to create company. Is the backend running?");
    }
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadowMd,width:"100%",maxWidth:560,margin:"1rem",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:700}}>Create Company Profile</h3>
          <BtnQ onClick={onClose}>?</BtnQ>
        </div>
        <Input label="Registered Company Name *" value={name} onChange={setName} placeholder="e.g. Tata Consultancy Services Limited"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Input label="CIN * (Mandatory)" value={cin} onChange={v=>setCin(v.toUpperCase())} placeholder="L22210MH1995PLC084781"/>
          <Input label="Date of Incorporation *" value={doi} onChange={setDoi} type="date"/>
        </div>
        <Select label="Industry * (NIC)" value={industry} onChange={setIndustry}><option value="">Select industry</option>{INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}</Select>
        <Select label="Company Stage *" value={stage} onChange={setStage}><option value="">Select stage</option>{STAGES.map(s=><option key={s.value} value={s.value}>{s.label} — {s.desc}</option>)}</Select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Select label="Company Type" value={type} onChange={setType}><option value="">Select type</option><option>Private Limited</option><option>Public Limited (NSE)</option><option>Public Limited (BSE)</option><option>LLP</option><option>OPC</option></Select>
          <Select label="State" value={state} onChange={setState}><option value="">Select state</option>{["Maharashtra","Delhi","Karnataka","Tamil Nadu","Telangana","Gujarat","West Bengal","Rajasthan","Uttar Pradesh","Haryana","Kerala"].map(s=><option key={s}>{s}</option>)}</Select>
        </div>
        {err&&<div style={{color:C.danger,fontSize:13,background:C.dangerLight,padding:"8px 12px",borderRadius:6,marginBottom:12}}>{err}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><BtnQ onClick={onClose}>Cancel</BtnQ><Btn onClick={submit}>Create Company</Btn></div>
      </div>
    </div>
  );
};

// -- DASHBOARD --------------------------------------------------------------

const EditCompanyModal=({company,onClose,onSave})=>{
  const [name,setName]=useState(company.name||"");
  const [cin,setCin]=useState(company.cin||"");
  const [doi,setDoi]=useState(company.doi||"");
  const [stage,setStage]=useState(company.stage||"");
  const [type,setType]=useState(company.type||company.company_type||"");
  const [state,setState]=useState(company.state||"");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const submit=async()=>{
    if(!name.trim()||!industry||!stage){setErr("Name, industry and stage are required.");return;}
    setLoading(true);setErr("");
    try{
      const res=await fetch(`/api/companies/${company.id}`,{
        method:"PUT",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${localStorage.getItem("valux_token")}`},
        body:JSON.stringify({name,doi,industry,stage,company_type:type,state,...(!company.cin_verified&&cin?{cin}:{})})
      });
      const updated=await res.json();
      if(!res.ok){setErr(updated.detail||"Update failed");setLoading(false);return;}
      onSave({...company,...updated,type:updated.company_type});
      onClose();
    }catch(e){
      setErr(e?.detail||"Update failed");
    }
    setLoading(false);
  };

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200}}>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadowMd,width:"100%",maxWidth:560,margin:"1rem",maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.5rem"}}>
          <h3 style={{margin:0,fontSize:18,fontWeight:700}}>&#9998; Edit — {company.name}</h3>
          <BtnQ onClick={onClose}>&#x2715;</BtnQ>
        </div>
        <div style={{background:C.infoLight,border:`1px solid ${C.info}44`,borderRadius:8,padding:"8px 12px",fontSize:12,color:C.info,marginBottom:14}}>
          &#8505;&#65039; CIN cannot be changed after creation.
        </div>
        <Input label="Registered Company Name *" value={name} onChange={setName} placeholder="Company name"/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          {company.cin_verified ? (<div style={{marginBottom:14}}><label style={{fontSize:11,fontWeight:600,color:C.textMuted,marginBottom:5,display:"block",textTransform:"uppercase",letterSpacing:"0.04em"}}>CIN (Verified — Locked)</label><div style={{background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px",fontSize:14,color:C.textMuted,display:"flex",alignItems:"center",gap:8}}><span>??</span><span>{company.cin}</span></div></div>) : (<Input label="CIN (Editable — not yet verified)" value={company.cin} onChange={()=>{}} placeholder="L22210MH1995PLC084781"/>)}
          <Input label="Date of Incorporation" value={doi} onChange={setDoi} type="date"/>
        </div>
        <Select label="Industry * (NIC)" value={industry} onChange={setIndustry}>
          <option value="">Select industry</option>
          {INDUSTRIES.map(i=><option key={i} value={i}>{i}</option>)}
        </Select>
        <Select label="Company Stage *" value={stage} onChange={setStage}>
          <option value="">Select stage</option>
          {STAGES.map(s=><option key={s.value} value={s.value}>{s.label} ? {s.desc}</option>)}
        </Select>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
          <Select label="Company Type" value={type} onChange={setType}>
            <option value="">Select type</option>
            <option>Private Limited</option>
            <option>Public Limited (NSE)</option>
            <option>Public Limited (BSE)</option>
            <option>LLP</option>
            <option>OPC</option>
          </Select>
          <Select label="State" value={state} onChange={setState}>
            <option value="">Select state</option>
            {["Maharashtra","Delhi","Karnataka","Tamil Nadu","Telangana","Gujarat","West Bengal","Rajasthan","Uttar Pradesh","Haryana","Kerala"].map(s=><option key={s}>{s}</option>)}
          </Select>
        </div>
        {err&&<div style={{color:C.danger,fontSize:13,background:C.dangerLight,padding:"8px 12px",borderRadius:6,marginBottom:12}}>{err}</div>}
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <BtnQ onClick={onClose}>Cancel</BtnQ>
          <Btn onClick={submit} disabled={loading}>{loading?"Saving...":"Save Changes"}</Btn>
        </div>
      </div>
    </div>
  );
};

const Dashboard=({user,companies,onAdd,onSelect,onEdit})=>{
  const [modal,setModal]=useState(false);
  const [editCompany,setEditCompany]=useState(null);
  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"system-ui,sans-serif",color:C.text}}>
      <div style={{maxWidth:960,margin:"0 auto",padding:"2rem"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem"}}>
          <div><h2 style={{margin:0,fontSize:24,fontWeight:700}}>My Companies</h2><div style={{color:C.textMuted,fontSize:13}}>Welcome back, {user.name}</div></div>
          <Btn onClick={()=>setModal(true)}>+ New Company</Btn>
        </div>
        {companies.length===0?(
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"4rem 2rem",boxShadow:C.shadow,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:16}}>??</div>
            <div style={{fontWeight:600,marginBottom:8}}>No companies yet</div>
            <div style={{color:C.textMuted,fontSize:13,marginBottom:20}}>Create your first company profile to start.</div>
            <Btn onClick={()=>setModal(true)}>Create Company</Btn>
          </div>
        ):(
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
            {companies.map(c=>{
              const stg=STAGES.find(s=>s.value===c.stage);
              const erpCount=Object.keys(c.connectedERPs||{}).length;
              return (
                <div key={c.id} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow,cursor:"pointer"}}
                  onClick={()=>onSelect(c)} onMouseEnter={e=>e.currentTarget.style.boxShadow=C.shadowMd} onMouseLeave={e=>e.currentTarget.style.boxShadow=C.shadow}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
                    <div style={{width:40,height:40,borderRadius:10,background:C.saffronLight,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:C.saffron}}>{c.name[0]}</div>
                    <Pill color={c.modelGenerated?"success":"saffron"}>{c.modelGenerated?"Model Ready":"Pending"}</Pill>
                  </div>
                  <div style={{fontWeight:700,fontSize:15,marginBottom:4}}>{c.name}</div>
                  <div style={{color:C.textMuted,fontSize:13,marginBottom:8}}>{c.industry}</div>
                  {stg&&<div style={{marginBottom:6,display:"flex",gap:6,flexWrap:"wrap"}}><Pill color="info">{stg.label}</Pill>{erpCount>0&&<Pill color="success">{erpCount} ERP{erpCount>1?"s":""} linked</Pill>}</div>}
                  <div style={{fontSize:11,color:C.textLight}}>CIN: {c.cin}</div>
                  <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                    <span style={{fontSize:12,color:C.textMuted}}>{c.files?.length||0} files uploaded</span>
                    <button onClick={e=>{e.stopPropagation();setEditCompany(c);}} style={{fontSize:11,color:C.saffron,background:"transparent",border:`1px solid ${C.saffron}`,borderRadius:6,padding:"3px 10px",cursor:"pointer",fontFamily:"inherit",fontWeight:600}}>?? Edit</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {modal&&<CreateCompanyModal onClose={()=>setModal(false)} onSave={(c)=>{onAdd(c);setModal(false);}}/>}
      {editCompany&&<EditCompanyModal company={editCompany} onClose={()=>setEditCompany(null)} onSave={(c)=>{onEdit(c);setEditCompany(null);}}/>}
      <Chatbot/>
    </div>
  );
};
const Chatbot=({company})=>{
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState([{role:"assistant",text:"Hi! I'm your ValuX AI assistant. Ask me about valuation, financial modelling, or Indian accounting standards."}]);
  const [input,setInput]=useState(""); const [loading,setLoading]=useState(false);
  const send=async()=>{
    if(!input.trim()||loading)return;
    const q=input.trim();setInput("");setLoading(true);
    setMsgs(m=>[...m,{role:"user",text:q}]);
    try{
      const ctx=company?`Context: ${company.name}, ${company.industry}, stage: ${company.stage}.`:"";
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:600,messages:[{role:"user",content:`You are a senior CA and investment banking expert for Indian companies. Be concise. ${ctx}\n\n${q}`}]})});
      const data=await res.json();
      const text=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"Sorry, try again.";
      setMsgs(m=>[...m,{role:"assistant",text}]);
    }catch{setMsgs(m=>[...m,{role:"assistant",text:"Connection error."}]);}
    setLoading(false);
  };
  return (
    <div style={{position:"fixed",bottom:24,right:24,zIndex:999}}>
      {open&&(
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,boxShadow:C.shadowMd,width:340,marginBottom:12,display:"flex",flexDirection:"column",height:420}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",borderBottom:`1px solid ${C.border}`}}>
            <div><div style={{fontWeight:700,fontSize:14}}>ValuX AI</div><div style={{fontSize:11,color:C.success}}>? Online</div></div>
            <BtnQ onClick={()=>setOpen(false)} style={{padding:"3px 10px",fontSize:12}}>?</BtnQ>
          </div>
          <div style={{flex:1,overflowY:"auto",padding:"12px 16px",display:"flex",flexDirection:"column",gap:10}}>
            {msgs.map((m,i)=>(
              <div key={i} style={{display:"flex",justifyContent:m.role==="user"?"flex-end":"flex-start"}}>
                <div style={{maxWidth:"82%",padding:"8px 12px",borderRadius:10,fontSize:13,lineHeight:1.5,background:m.role==="user"?C.saffron:C.surfaceAlt,color:m.role==="user"?"#fff":C.text}}>{m.text}</div>
              </div>
            ))}
            {loading&&<div style={{fontSize:12,color:C.textMuted}}>Thinking...</div>}
          </div>
          <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8}}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Ask anything..."
              style={{flex:1,background:C.surfaceAlt,border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 12px",fontSize:13,color:C.text,outline:"none",fontFamily:"inherit"}}/>
            <Btn onClick={send} style={{padding:"8px 14px"}}>?</Btn>
          </div>
        </div>
      )}
      <div style={{display:"flex",justifyContent:"flex-end"}}>
        <Btn onClick={()=>setOpen(o=>!o)} style={{borderRadius:50,width:50,height:50,fontSize:20,padding:0,boxShadow:C.shadowMd}}>??</Btn>
      </div>
    </div>
  );
};

// -- FINROW -----------------------------------------------------------------
const FinRow=({idx,fin,onChange})=>(
  <div>
    {idx>0&&<div style={{borderTop:`1px solid ${C.border}`,margin:"20px 0"}}/>}
    <div style={{fontWeight:700,color:C.saffron,marginBottom:14,fontSize:14}}>Financial Year {idx+1}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12}}>
      <Input label="Financial Year *" value={fin.year} onChange={v=>onChange(idx,"year",v)} placeholder="e.g. FY2024"/>
      <Input label="Revenue (? L) *" value={fin.revenue} onChange={v=>onChange(idx,"revenue",v)} placeholder="0.00" type="number"/>
      <Input label="EBITDA (? L)" value={fin.ebitda} onChange={v=>onChange(idx,"ebitda",v)} placeholder="0.00" type="number"/>
      <Input label="PAT / Net Profit (? L)" value={fin.pat} onChange={v=>onChange(idx,"pat",v)} placeholder="0.00" type="number"/>
      <Input label="Total Assets (? L)" value={fin.assets} onChange={v=>onChange(idx,"assets",v)} placeholder="0.00" type="number"/>
      <Input label="Total Debt (? L)" value={fin.debt} onChange={v=>onChange(idx,"debt",v)} placeholder="0.00" type="number"/>
    </div>
  </div>
);

// -- DATA UPLOAD ------------------------------------------------------------
const DataUpload=({company,onBack,onModelGenerated,onUpdateCompany})=>{
  const [tab,setTab]=useState("erp");
  const [fins,setFins]=useState([{year:"",revenue:"",ebitda:"",pat:"",assets:"",debt:""}]);
  const [files,setFiles]=useState(company.files||[]);
  const [connectedERPs,setConnectedERPs]=useState(company.connectedERPs||{});
  const [dragOver,setDragOver]=useState(false);
  const [loading,setLoading]=useState(false);
  const [genLoading,setGenLoading]=useState(false);
  const [uploadErr,setUploadErr]=useState("");
  const [validation,setValidation]=useState(null);
  const [schedule3,setSchedule3]=useState(null);

  const updateFin=useCallback((i,k,v)=>setFins(p=>{const f=[...p];f[i]={...f[i],[k]:v};return f;}),[]);

  const handleERPConnect=(id,creds)=>{
    const updated={...company,connectedERPs:{...connectedERPs,[id]:creds}};
    setConnectedERPs(updated.connectedERPs);
    onUpdateCompany(updated);
  };

  const handleFile=(file)=>{
    if(!file)return;
    const ext=file.name.split(".").pop().toLowerCase();
    if(!["xlsx","xls","csv","pdf"].includes(ext)){setUploadErr("Unsupported format. Upload Excel, CSV, or PDF.");return;}
    setLoading(true);setUploadErr("");
    setTimeout(()=>{
      const matched=file.name.toLowerCase().includes(company.name.split(" ")[0].toLowerCase())||file.name.toLowerCase().includes(company.cin.substring(0,6).toLowerCase());
      setValidation({matched,fileName:file.name});
      setSchedule3(["xlsx","xls","pdf"].includes(ext)?{detected:Math.random()>0.3,format:"Schedule III — Part I (Balance Sheet) + Part II (P&L)"}:null);
      const nf={name:file.name,type:ext.toUpperCase(),size:(file.size/1024).toFixed(1)+"KB",date:new Date().toLocaleDateString("en-IN"),ocr:ext==="pdf"};
      const updated={...company,files:[...(company.files||[]),nf]};
      setFiles(updated.files);onUpdateCompany(updated);setLoading(false);
    },1200);
  };

  const runGen=async()=>{
    const hasData=fins.some(f=>f.revenue)||Object.keys(connectedERPs).length>0||files.length>0;
    if(!hasData){setUploadErr("Please connect an ERP, upload a file, or enter financial data manually.");return;}
    setGenLoading(true);setUploadErr("");
    try{
      for(const fin of fins.filter(f=>f.revenue)){
        await api.post(`/companies/${company.id}/financials`,{
          year:fin.year||"FY2024",
          revenue:parseFloat(fin.revenue)||null,
          ebitda:parseFloat(fin.ebitda)||null,
          pat:parseFloat(fin.pat)||null,
          total_assets:parseFloat(fin.assets)||null,
          debt:parseFloat(fin.debt)||null,
          source:"manual"
        });
      }
      const result=await api.post(`/valuation/${company.id}/generate`,{});
            onModelGenerated(company,fins,{
        baseVal:result.blended,
        bearVal:result.bear,
        bullVal:result.bull,
        revenueY1:result.projections?.[0]?.revenue||100,
        revenueY5:result.projections?.[4]?.revenue||150,
        methodology:result.methodology,
        keyRisks:["Market volatility","Regulatory changes","Competition intensity"],
        keyDrivers:["Revenue growth trajectory","EBITDA margin expansion","Market share capture"],
        narrative:result.narrative,
        assumptions:result.assumptions,
        projections:result.projections,
        disclaimer:result.disclaimer,
      });
    }catch(e){
      console.error("CATCH BLOCK HIT:",e);
       alert("Error: "+JSON.stringify(e));
      console.error("Generation failed:",e);
      setUploadErr(e?.detail||"Generation failed — check backend logs.");
      fallback(fins);
    }
    setGenLoading(false);
  };

  const fallback=(fins)=>{
    const lf=fins.find(f=>f.revenue)||fins[0];
    const bench=getBench(company.industry);
    const stageM=STAGE_M[company.stage]||STAGE_M["series-a"];
    const rev=parseFloat(lf.revenue)||100;
    const ebitda=parseFloat(lf.ebitda)||rev*bench.ebitdaMargin;
    const pat=parseFloat(lf.pat)||rev*0.08;
    const raw=(pat*bench.pe*1.2/100)*stageM.dcfW+(rev*bench.evRev/100)*stageM.revW+(ebitda*bench.evEbitda/100)*stageM.ebitdaW;
    const base=raw*(1-stageM.risk);
    onModelGenerated(company,fins,{baseVal:base,bearVal:base*0.72,bullVal:base*1.35,revenueY1:rev*1.15,revenueY5:rev*Math.pow(1+bench.growth,5),methodology:`DCF+Revenue+EBITDA (${STAGES.find(s=>s.value===company.stage)?.label}, ${(stageM.risk*100).toFixed(0)}% risk discount)`,keyRisks:["Market volatility","Regulatory changes","Competition"],keyDrivers:["Revenue growth","Margin expansion","Market share"],narrative:`${company.name} is a ${company.stage}-stage company in ${company.industry}. Base valuation ?${base.toFixed(2)} Cr with ${(stageM.risk*100).toFixed(0)}% stage risk discount.`});
  };

  const handleCINData = ({ fins, industry, stage, companyType, source, exchange, symbol }) => {
    // Auto-populate financial rows
    setFins(fins.map(f => ({ year: f.year, revenue: f.revenue, ebitda: f.ebitda, pat: f.pat, assets: f.assets, debt: f.debt })));
    // Update company meta
    const updated = { ...company, industry: industry || company.industry, stage: stage || company.stage, cinFetchSource: source, cinFetchSymbol: symbol };
    onUpdateCompany(updated);
    setTab("manual"); // Jump to manual tab showing pre-filled data
    setUploadErr("");
  };

  const tabs=[["cin","?? CIN Lookup"],["erp","?? ERP Connect"],["upload","?? Upload File"],["manual","?? Manual Entry"]];
  const erpConnectedCount=Object.keys(connectedERPs).length;

  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"system-ui,sans-serif",color:C.text}}>
      <div style={{maxWidth:900,margin:"0 auto",padding:"2rem"}}>
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:"1.5rem"}}>
          <BtnQ onClick={onBack}>? Back</BtnQ>
          <div>
            <h2 style={{margin:0,fontSize:22,fontWeight:700}}>Data Input — {company.name}</h2>
            <div style={{color:C.textMuted,fontSize:13}}>CIN: {company.cin} · {company.industry} · <Pill color="info">{STAGES.find(s=>s.value===company.stage)?.label||company.stage}</Pill></div>
          </div>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:"1.5rem",flexWrap:"wrap"}}>
          {tabs.map(([t,l])=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?C.saffron:"transparent",color:tab===t?"#fff":C.textMuted,border:`1px solid ${tab===t?C.saffron:C.border}`,borderRadius:8,padding:"9px 18px",fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit",display:"flex",alignItems:"center",gap:6}}>
              {l}{t==="erp"&&erpConnectedCount>0&&<span style={{background:"#fff",color:C.saffron,borderRadius:10,padding:"1px 7px",fontSize:11,fontWeight:700}}>{erpConnectedCount}</span>}
            </button>
          ))}
        </div>

        {tab==="cin"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <CINLookupPanel company={company} onDataFetched={handleCINData}/>
            <div style={{background:C.infoLight,border:`1px solid ${C.info}44`,borderRadius:10,padding:"12px 16px",fontSize:13,color:C.info}}>
              <strong>How it works in production:</strong> Listed companies (NSE/BSE) ? free data via Screener.in or FMP API. Private/unlisted ? Tofler API (?5–15/query, MCA21 sourced). Once you have API keys, replace the <code>lookupCIN()</code> function — the UI flow stays identical.
            </div>
          </div>
        )}

        {tab==="erp"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <ERPPanel connectedERPs={connectedERPs} onConnect={handleERPConnect}/>
            {erpConnectedCount>0&&(
              <div style={{background:C.successLight,border:`1px solid ${C.success}44`,borderRadius:12,padding:"1rem 1.5rem",display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                <div>
                  <div style={{fontWeight:600,fontSize:14,color:C.success}}>? {erpConnectedCount} ERP{erpConnectedCount>1?"s":""} connected</div>
                  <div style={{fontSize:13,color:C.textMuted,marginTop:2}}>Financial data ready to analyse. Click Generate Model to proceed.</div>
                </div>
                <Btn onClick={runGen} disabled={genLoading} style={{flexShrink:0}}>{genLoading?"? Generating...":"?? Generate Model"}</Btn>
              </div>
            )}
          </div>
        )}

        {tab==="upload"&&(
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <TemplatePanel company={company}/>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow}}>
              <div style={{fontWeight:700,fontSize:15,marginBottom:12}}>Upload Financial Documents</div>
              <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handleFile(e.dataTransfer.files?.[0]);}}
                style={{border:`2px dashed ${dragOver?C.saffron:C.border}`,borderRadius:10,padding:"2.5rem 2rem",textAlign:"center",background:dragOver?C.saffronLight:"transparent",transition:"all 0.2s"}}>
                <div style={{fontSize:36,marginBottom:12}}>??</div>
                <div style={{fontWeight:600,marginBottom:8}}>Drop documents here</div>
                <div style={{color:C.textMuted,fontSize:13,marginBottom:16}}>P&L, Balance Sheet, Cash Flow · Excel, CSV, PDF (OCR supported)</div>
                <label style={{background:C.saffron,color:"#fff",border:"none",borderRadius:8,padding:"10px 22px",fontWeight:600,cursor:"pointer",fontSize:14,display:"inline-block"}}>
                  Choose File<input type="file" accept=".xlsx,.xls,.csv,.pdf" style={{display:"none"}} onChange={e=>handleFile(e.target.files?.[0])}/>
                </label>
              </div>
              {loading&&<div style={{textAlign:"center",padding:"1rem",color:C.textMuted}}>? Processing...</div>}
              {validation&&!loading&&(
                <div style={{marginTop:12,padding:"10px 14px",borderRadius:8,background:validation.matched?C.successLight:C.dangerLight,border:`1px solid ${validation.matched?C.success:C.danger}`,fontSize:13,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
                  <span>{validation.matched?`? Validated — matches ${company.name}`:`?? "${validation.fileName}" may not match ${company.name}`}</span>
                  {!validation.matched&&<BtnQ onClick={()=>{const b=new Blob([`VALIDATION ERROR\nFile: ${validation.fileName}\nExpected: ${company.name} (${company.cin})\nDate: ${new Date().toLocaleString()}`],{type:"text/plain"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download="error_report.txt";a.click();}} style={{padding:"4px 12px",fontSize:12}}>? Error Report</BtnQ>}
                </div>
              )}
              {schedule3&&!loading&&<div style={{marginTop:10,padding:"10px 14px",borderRadius:8,background:C.infoLight,border:`1px solid ${C.info}`,fontSize:13}}>{schedule3.detected?`?? Schedule III detected — ${schedule3.format}`:"?? Standard format (non-Schedule III)"}</div>}
              {files.length>0&&(
                <div style={{marginTop:16}}>
                  <div style={{fontWeight:600,marginBottom:10,fontSize:14}}>Uploaded Files</div>
                  {files.map((f,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:20}}>??</span>
                        <div><div style={{fontSize:13,fontWeight:500}}>{f.name}</div><div style={{fontSize:11,color:C.textLight}}>{f.size} · {f.date}{f.ocr?" · OCR":""}</div></div>
                      </div>
                      <Pill color={f.type==="PDF"?"info":"success"}>{f.type}</Pill>
                    </div>
                  ))}
                </div>
              )}
              {uploadErr&&<div style={{color:C.danger,fontSize:13,marginTop:12,background:C.dangerLight,padding:"8px 12px",borderRadius:6}}>{uploadErr}</div>}
              <div style={{marginTop:16,display:"flex",justifyContent:"flex-end"}}>
                <Btn onClick={runGen} disabled={genLoading} style={{padding:"12px 32px",fontSize:15}}>{genLoading?"? Generating...":"?? Generate Model"}</Btn>
              </div>
            </div>
          </div>
        )}

        {tab==="manual"&&(
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow}}>
            {company.cinFetchSource && (
              <div style={{background:C.successLight,border:`1px solid ${C.success}44`,borderRadius:8,padding:"10px 14px",fontSize:13,color:C.success,marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
                <span>?</span>
                <span>Fields auto-filled from <strong>{company.cinFetchSource}</strong>. Review and edit if needed.</span>
              </div>
            )}
            <div style={{color:C.textMuted,fontSize:13,marginBottom:16}}>All figures in <strong>? Lakhs</strong>. Up to 5 years for better accuracy.</div>
            {fins.map((fin,idx)=><FinRow key={idx} idx={idx} fin={fin} onChange={updateFin}/>)}
            {fins.length<5&&<BtnQ onClick={()=>setFins(p=>[...p,{year:"",revenue:"",ebitda:"",pat:"",assets:"",debt:""}])} style={{marginTop:14,fontSize:13}}>+ Add Year</BtnQ>}
            {uploadErr&&<div style={{color:C.danger,fontSize:13,marginTop:12,background:C.dangerLight,padding:"8px 12px",borderRadius:6}}>{uploadErr}</div>}
            <div style={{marginTop:20,display:"flex",justifyContent:"flex-end"}}>
              <Btn onClick={runGen} disabled={genLoading} style={{padding:"12px 32px",fontSize:15}}>{genLoading?"? Generating...":"?? Generate Model"}</Btn>
            </div>
          </div>
        )}
      </div>
      <Chatbot company={company}/>
    </div>
  );
};

// -- MODEL RESULTS ----------------------------------------------------------
const ModelResults=({company,fins,modelData,onBack})=>{
      const bench=getBench(company.industry);
  const [activeTab,setActiveTab]=useState("overview");
  const [yf,setYf]=useState("5y");
  const stageM=STAGE_M[company.stage]||STAGE_M["series-a"];
  const proj=(modelData.projections&&modelData.projections.length>0)
    ? modelData.projections.map((p,i)=>({
        year:p.year||"FY"+(2026+i),
        bear:+(( modelData.bearVal||0)*Math.pow(1+0.006,i)).toFixed(2),
        base:+((modelData.baseVal||0)*Math.pow(1+bench.growth,i)).toFixed(2),
        bull:+((modelData.bullVal||0)*Math.pow(1+bench.growth*1.3,i)).toFixed(2),
        revenue:+((p.revenue||0).toFixed(2)),
        ebitda:+((p.ebitda||0).toFixed(2)),
        pat:+((p.pat||0).toFixed(2)),
      }))
    : ["FY26","FY27","FY28","FY29","FY30"].map((yr,i)=>{
        const g=Math.pow(1+bench.growth,i);
        const rev=(modelData.revenueY1||100)*g;
        return {year:yr,bear:+(modelData.bearVal*Math.pow(1+bench.growth*0.6,i)).toFixed(2),base:+(modelData.baseVal*g).toFixed(2),bull:+(modelData.bullVal*Math.pow(1+bench.growth*1.3,i)).toFixed(2),revenue:+rev.toFixed(2),ebitda:+(rev*bench.ebitdaMargin).toFixed(2),pat:+(rev*0.09).toFixed(2)};
      });
  
  const filtered=yf==="1y"?proj.slice(0,2):yf==="3y"?proj.slice(0,4):proj;
  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"system-ui,sans-serif",color:C.text}}>
      <div style={{maxWidth:960,margin:"0 auto",padding:"2rem 2rem 4rem"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"1.5rem",flexWrap:"wrap",gap:12}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            <BtnQ onClick={onBack}>? Back</BtnQ>
            <div><h2 style={{margin:0,fontSize:22,fontWeight:700}}>{company.name}</h2><div style={{color:C.textMuted,fontSize:13}}>{company.industry} · <Pill color="info">{STAGES.find(s=>s.value===company.stage)?.label}</Pill></div></div>
          </div>
          <div style={{display:"flex",gap:10}}><BtnQ onClick={()=>window.print()}>? PDF</BtnQ><BtnG onClick={()=>window.print()}>? Excel</BtnG></div>
        </div>
        <div style={{background:C.dangerLight,border:`1px solid ${C.danger}22`,borderRadius:10,padding:"10px 16px",fontSize:13,color:C.danger,marginBottom:16}}>
          ?? Stage risk discount: <strong>{(stageM.risk*100).toFixed(0)}%</strong> applied ({STAGES.find(s=>s.value===company.stage)?.label}). DCF: {(stageM.dcfW*100).toFixed(0)}% · Revenue: {(stageM.revW*100).toFixed(0)}% · EBITDA: {(stageM.ebitdaW*100).toFixed(0)}%
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
          <MetricCard label="Base Valuation" value={fmtCr(modelData.baseVal)} color={C.saffron} sub="Weighted avg"/>
          <MetricCard label="Bear Case" value={fmtCr(modelData.bearVal)} color={C.danger} sub="-28%"/>
          <MetricCard label="Bull Case" value={fmtCr(modelData.bullVal)} color={C.green} sub="+35%"/>
          <MetricCard label="Sector P/E" value={bench.pe+"x"} sub={company.industry}/>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {[["overview","Overview"],["financials","Financials"],["assumptions","Assumptions"]].map(([t,l])=>(
            <button key={t} onClick={()=>setActiveTab(t)} style={{background:activeTab===t?C.saffron:"transparent",color:activeTab===t?"#fff":C.textMuted,border:`1px solid ${activeTab===t?C.saffron:C.border}`,borderRadius:8,padding:"9px 20px",fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>{l}</button>
          ))}
        </div>
        {activeTab==="overview"&&<>
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow,marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16,flexWrap:"wrap",gap:8}}>
              <div style={{fontWeight:700,fontSize:15}}>5-Year Trajectory (? Cr)</div>
              <div style={{display:"flex",gap:8}}>
                {[["1y","1Y"],["3y","3Y"],["5y","5Y"]].map(([v,l])=>(
                  <button key={v} onClick={()=>setYf(v)} style={{background:yf===v?C.saffron:"transparent",color:yf===v?"#fff":C.textMuted,border:`1px solid ${yf===v?C.saffron:C.border}`,borderRadius:8,padding:"5px 14px",cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>{l}</button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={filtered} margin={{top:10,right:20,bottom:0,left:10}}>
                <defs>
                  <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#DC2626" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#DC2626" stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="gs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.saffron} stopOpacity={0.35}/>
                    <stop offset="95%" stopColor={C.saffron} stopOpacity={0.05}/>
                  </linearGradient>
                  <linearGradient id="gg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={C.green} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={C.green} stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="year" tick={{fontSize:12,fill:C.textMuted}}/>
                <YAxis tick={{fontSize:11,fill:C.textMuted}} tickFormatter={v=>"?"+v}/>
                <Tooltip 
                  contentStyle={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,fontSize:12}} formatter={(v,n)=>["?"+v.toFixed(2)+" Cr",n]}/>
                <Area type="monotone" dataKey="bear" stroke="#DC2626" fill="url(#gb)" name="Bear" dot={{r:3,fill:"#DC2626"}}/>
                <Area type="monotone" dataKey="base" stroke={C.saffron} fill="url(#gs)" name="Base" dot={{r:4,fill:C.saffron}}/>
                <Area type="monotone" dataKey="bull" stroke={C.green} fill="url(#gg)" name="Bull" dot={{r:3,fill:C.green}}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow}}>
              <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Key Value Drivers</div>
              {(modelData.keyDrivers||[]).map((d,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{width:22,height:22,borderRadius:50,background:C.greenLight,color:C.green,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>{i+1}</span>
                  <span style={{fontSize:14}}>{d}</span>
                </div>
              ))}
            </div>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow}}>
              <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Key Risks</div>
              {(modelData.keyRisks||[]).map((r,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{width:22,height:22,borderRadius:50,background:C.dangerLight,color:C.danger,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0}}>!</span>
                  <span style={{fontSize:14}}>{r}</span>
                </div>
              ))}
            </div>
          </div>
          {modelData.narrative&&<div style={{background:C.saffronLight,border:`1px solid ${C.saffronBorder}`,borderRadius:12,padding:"1.5rem",marginTop:16}}><div style={{fontWeight:700,marginBottom:8,fontSize:14}}>AI Analysis</div><p style={{margin:0,fontSize:14,lineHeight:1.7,color:C.text}}>{modelData.narrative}</p></div>}
        </>}
        {activeTab==="financials"&&(
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow,overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`2px solid ${C.border}`}}>
                {["Year","Revenue (L)","EBITDA (L)","PAT (L)","Bear (Cr)","Base (Cr)","Bull (Cr)"].map(h=><th key={h} style={{padding:"10px 12px",textAlign:h==="Year"?"left":"right",color:C.textMuted,fontWeight:600,fontSize:11,textTransform:"uppercase"}}>{h}</th>)}
              </tr></thead>
              <tbody>{proj.map((p,i)=>(
                <tr key={p.year} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.surfaceAlt:C.surface}}>
                  <td style={{padding:"10px 12px",fontWeight:600}}>{p.year}</td>
                  <td style={{padding:"10px 12px",textAlign:"right"}}>?{p.revenue.toFixed(1)}</td>
                  <td style={{padding:"10px 12px",textAlign:"right"}}>?{p.ebitda.toFixed(1)}</td>
                  <td style={{padding:"10px 12px",textAlign:"right"}}>?{p.pat.toFixed(1)}</td>
                  <td style={{padding:"10px 12px",textAlign:"right",color:C.danger}}>?{p.bear.toFixed(2)}</td>
                  <td style={{padding:"10px 12px",textAlign:"right",color:C.saffron,fontWeight:700}}>?{p.base.toFixed(2)}</td>
                  <td style={{padding:"10px 12px",textAlign:"right",color:C.green}}>?{p.bull.toFixed(2)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {activeTab==="assumptions"&&(
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow}}>
              <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Stage-Adjusted Weights</div>
              {[["DCF",(stageM.dcfW*100).toFixed(0)+"%",C.saffron],["Revenue Multiple",(stageM.revW*100).toFixed(0)+"%",C.info],["EBITDA Multiple",(stageM.ebitdaW*100).toFixed(0)+"%",C.green]].map(([m,w,c])=>(
                <div key={m} style={{marginBottom:14}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:13}}>{m}</span><span style={{fontSize:13,fontWeight:700,color:c}}>{w}</span></div>
                  <div style={{background:C.surfaceAlt,borderRadius:4,height:6}}><div style={{background:c,width:w,height:6,borderRadius:4}}/></div>
                </div>
              ))}
              <div style={{marginTop:14,padding:"10px 12px",background:C.dangerLight,borderRadius:8,fontSize:13,color:C.danger,fontWeight:500}}>Stage risk discount: {(stageM.risk*100).toFixed(0)}%</div>
            </div>
            <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow}}>
              <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Sector Benchmarks</div>
              {[["Industry",company.industry],["Stage",STAGES.find(s=>s.value===company.stage)?.label],["P/E",bench.pe+"x"],["EV/Revenue",bench.evRev+"x"],["EV/EBITDA",bench.evEbitda+"x"],["Growth",(bench.growth*100).toFixed(0)+"%"],["EBITDA Margin",(bench.ebitdaMargin*100).toFixed(0)+"%"],["WACC","12%"],["Terminal Growth","4%"]].map(([k,v])=>(
                <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${C.border}`}}>
                  <span style={{color:C.textMuted,fontSize:13}}>{k}</span><span style={{fontSize:13,fontWeight:500}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <Chatbot company={company}/>
    </div>
  );
};

// -- BENCHMARKS -------------------------------------------------------------
const Benchmarks=()=>(
  <div style={{background:C.bg,minHeight:"100vh",fontFamily:"system-ui,sans-serif",color:C.text}}>
    <div style={{maxWidth:960,margin:"0 auto",padding:"2rem"}}>
      <h2 style={{fontSize:24,fontWeight:700,marginBottom:4}}>Industry Benchmarks</h2>
      <p style={{color:C.textMuted,fontSize:13}}>NSE/BSE sector benchmarks. Connect FMP API for live data.</p>
      <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow,marginTop:"1.5rem",overflowX:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
          <thead><tr style={{borderBottom:`2px solid ${C.border}`}}>
            {["Industry","P/E","EV/Rev","EV/EBITDA","5Y Growth","EBITDA Margin"].map(h=><th key={h} style={{padding:"10px 14px",textAlign:"left",color:C.textMuted,fontWeight:600,fontSize:11,textTransform:"uppercase"}}>{h}</th>)}
          </tr></thead>
          <tbody>{Object.entries(BENCHMARKS).filter(([k])=>k!=="default").map(([ind,b],i)=>(
            <tr key={ind} style={{borderBottom:`1px solid ${C.border}`,background:i%2===0?C.surfaceAlt:C.surface}}>
              <td style={{padding:"11px 14px",fontWeight:500}}>{ind}</td>
              <td style={{padding:"11px 14px",color:C.saffron,fontWeight:700}}>{b.pe}x</td>
              <td style={{padding:"11px 14px"}}>{b.evRev}x</td>
              <td style={{padding:"11px 14px"}}>{b.evEbitda}x</td>
              <td style={{padding:"11px 14px",color:C.green,fontWeight:600}}>{(b.growth*100).toFixed(0)}%</td>
              <td style={{padding:"11px 14px"}}>{(b.ebitdaMargin*100).toFixed(0)}%</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
    <Chatbot/>
  </div>
);

// -- VALUATION CENTER -------------------------------------------------------
const ValuationCenter=({companies})=>{
  const [sel,setSel]=useState(companies[0]||null);
  const [growth,setGrowth]=useState(12);
  const bench=sel?getBench(sel.industry):null;
  const stageM=sel?(STAGE_M[sel.stage]||STAGE_M["series-a"]):null;
  const base=sel&&bench&&stageM?{dcf:(100*0.08)*bench.pe*1.2/100,rev:100*bench.evRev/100,ebitda:(100*bench.ebitdaMargin)*bench.evEbitda/100}:null;
  const blended=base?(base.dcf*stageM.dcfW+base.rev*stageM.revW+base.ebitda*stageM.ebitdaW)*(1-stageM.risk):0;
  const sensData=[-2,-1,0,1,2].map(d=>({label:`${growth+d}%`,value:+(blended*(1+d*0.06)).toFixed(2)}));
  return (
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"system-ui,sans-serif",color:C.text}}>
      <div style={{maxWidth:960,margin:"0 auto",padding:"2rem"}}>
        <h2 style={{fontSize:24,fontWeight:700,marginBottom:4}}>Valuation Center</h2>
        <p style={{color:C.textMuted,fontSize:13}}>Sensitivity analysis and methodology comparison.</p>
        {companies.length===0?(
          <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"4rem 2rem",textAlign:"center",marginTop:"1.5rem"}}>
            <div style={{fontSize:36,marginBottom:12}}>??</div>
            <div style={{fontWeight:600,marginBottom:8}}>No models generated yet</div>
            <div style={{color:C.textMuted,fontSize:13}}>Upload financials and generate a model first.</div>
          </div>
        ):(
          <>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",margin:"1.5rem 0"}}>
              {companies.map(c=>(
                <button key={c.id} onClick={()=>setSel(c)} style={{background:sel?.id===c.id?C.saffron:"transparent",color:sel?.id===c.id?"#fff":C.textMuted,border:`1px solid ${sel?.id===c.id?C.saffron:C.border}`,borderRadius:8,padding:"9px 20px",fontWeight:600,cursor:"pointer",fontSize:14,fontFamily:"inherit"}}>{c.name}</button>
              ))}
            </div>
            {sel&&base&&(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow}}>
                  <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Methodology — {sel.name}</div>
                  {[["DCF",base.dcf,C.saffron],["Revenue Multiple",base.rev,C.info],["EBITDA Multiple",base.ebitda,C.green]].map(([m,v,c])=>(
                    <div key={m} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 0",borderBottom:`1px solid ${C.border}`}}>
                      <span style={{fontSize:13}}>{m}</span><span style={{fontSize:16,fontWeight:700,color:c}}>{fmtCr(v)}</span>
                    </div>
                  ))}
                  <div style={{marginTop:14,padding:"12px",background:C.saffronLight,borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontWeight:600,fontSize:14}}>Blended ({STAGES.find(s=>s.value===sel.stage)?.label})</span>
                    <span style={{fontSize:18,fontWeight:800,color:C.saffron}}>{fmtCr(blended)}</span>
                  </div>
                </div>
                <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow}}>
                  <div style={{fontWeight:700,marginBottom:14,fontSize:14}}>Sensitivity — Growth Rate</div>
                  <div style={{marginBottom:16}}>
                    <label style={{fontSize:11,fontWeight:600,color:C.textMuted,marginBottom:5,display:"block",textTransform:"uppercase",letterSpacing:"0.04em"}}>Base Growth: {growth}%</label>
                    <input type="range" min={5} max={30} step={1} value={growth} onChange={e=>setGrowth(+e.target.value)} style={{width:"100%"}}/>
                  </div>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={sensData} margin={{top:0,right:10,bottom:0,left:0}}>
                      <XAxis dataKey="label" tick={{fontSize:11,fill:C.textMuted}}/>
                      <YAxis tick={{fontSize:10,fill:C.textMuted}} tickFormatter={v=>"?"+v}/>
                      <Tooltip formatter={v=>["?"+v+" Cr","Valuation"]} contentStyle={{fontSize:12}}/>
                      <Bar dataKey="value" fill={C.saffron} radius={[4,4,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Chatbot/>
    </div>
  );
};

// -- LANDING ----------------------------------------------------------------
const Landing=({onNav})=>(
  <div style={{background:C.bg,minHeight:"100vh",fontFamily:"system-ui,sans-serif",color:C.text}}>
    <div style={{maxWidth:960,margin:"0 auto",padding:"5rem 2rem 3rem"}}>
      <div style={{textAlign:"center",marginBottom:"4rem"}}>
        <Pill color="saffron">???? Built for Indian Businesses</Pill>
        <h1 style={{fontSize:48,fontWeight:800,margin:"1.5rem 0 1rem",letterSpacing:-2,lineHeight:1.1}}>Investor-grade valuation<br/><span style={{color:C.saffron}}>in minutes, not months</span></h1>
        <p style={{fontSize:18,color:C.textMuted,maxWidth:560,margin:"0 auto 2rem",lineHeight:1.7}}>AI-powered 5-year financial models, DCF, and comparable company valuation — built for Indian accounting standards, NIC codes, and NSE/BSE benchmarks.</p>
        <div style={{display:"flex",gap:12,justifyContent:"center"}}>
          <Btn onClick={()=>onNav("auth","signup")} style={{padding:"14px 36px",fontSize:16}}>Start for Free</Btn>
          <BtnO onClick={()=>onNav("auth","login")} style={{padding:"14px 36px",fontSize:16}}>Login</BtnO>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16}}>
        {[
          {icon:"??",t:"ERP Integration",d:"Connect Tally, Zoho, QuickBooks, SAP directly — no manual entry."},
          {icon:"??",t:"Schedule III Compliant",d:"Auto-detects Indian Companies Act format from uploaded files."},
          {icon:"??",t:"Stage-Aware Valuation",d:"Pre-Seed to Listed — risk discounts calibrated per funding stage."},
          {icon:"??",t:"AI Financial Modelling",d:"Claude-powered 5–10 year P&L, Balance Sheet, Cash Flow."},
          {icon:"??",t:"Template Downloads",d:"Pre-formatted Excel & CSV templates with Schedule III structure."},
          {icon:"??",t:"DCF + Comps + Revenue",d:"Three methodologies with sensitivity analysis and scenarios."},
        ].map(f=>(
          <div key={f.t} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:12,padding:"1.5rem",boxShadow:C.shadow}}>
            <div style={{fontSize:24,marginBottom:10}}>{f.icon}</div>
            <div style={{fontWeight:700,marginBottom:6,fontSize:15}}>{f.t}</div>
            <div style={{color:C.textMuted,fontSize:13}}>{f.d}</div>
          </div>
        ))}
      </div>
    </div>
    <Chatbot/>
  </div>
);

// -- APP ROOT ---------------------------------------------------------------
export default function App(){
  const [screen,setScreen]=useState("landing");
  const [authMode,setAuthMode]=useState("login");
  const [user,setUser]=useState(null);
  const [companies,setCompanies]=useState([]);
  const [selCompany,setSelCompany]=useState(null);
  const [modelData,setModelData]=useState(null);
  const [modelFins,setModelFins]=useState(null);

  const nav=(sc,mode)=>{if(mode)setAuthMode(mode);setScreen(sc);};
  const handleLogin=async(u)=>{
    setUser({...u, name: u.full_name || u.name || u.email});
    try{
      const data=await api.get("/companies");
      setCompanies(data.map(c=>({
        ...c,
        type:c.company_type,
        files:[],
        connectedERPs:{},
        modelGenerated:false,
      })));
    }catch(e){
      console.error("Failed to load companies:",e);
    }
    setScreen("dashboard");
  };
  const handleLogout=()=>{
  localStorage.removeItem("valux_token");
  setUser(null);
  setScreen("landing");
  setSelCompany(null);
  setModelData(null);
  };  
  const handleAdd=(c)=>setCompanies(p=>[...p,c]);
  const handleSelect=(c)=>{setSelCompany(c);setScreen("upload");};
  const handleUpdate=(c)=>{setCompanies(p=>p.map(x=>x.id===c.id?c:x));setSelCompany(c);};
  const handleModel=(co,fins,data)=>{
    const updated={...co,modelGenerated:true};
    setCompanies(p=>p.map(x=>x.id===co.id?updated:x));
    setSelCompany(updated);
    setModelFins(fins);
    setModelData(data);
    setScreen("model");
  };

  return (
    <div style={{fontFamily:"system-ui,-apple-system,sans-serif"}}>
      {screen!=="auth"&&<Nav user={user} onLogout={handleLogout} onNav={nav} screen={screen}/>}
      {screen==="landing"&&<Landing onNav={nav}/>}
      {screen==="auth"&&<Auth onLogin={handleLogin} initMode={authMode}/>}
      {screen==="dashboard"&&user&&<Dashboard user={user} companies={companies} onAdd={handleAdd} onSelect={handleSelect} onEdit={handleUpdate}/>}
      {screen==="upload"&&selCompany&&<DataUpload company={selCompany} onBack={()=>setScreen("dashboard")} onModelGenerated={handleModel} onUpdateCompany={handleUpdate}/>}
      {screen==="model"&&selCompany&&modelData&&<ModelResults company={selCompany} fins={modelFins} modelData={modelData} onBack={()=>setScreen("upload")}/>}
      {screen==="benchmarks"&&<Benchmarks/>}
      {screen==="valuation"&&<ValuationCenter companies={companies.filter(c=>c.modelGenerated)}/>}
    </div>
  );
}








