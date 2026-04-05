content = open('src/App.tsx', 'r', encoding='utf-8').read()

old_rungen = '''  const runGen=async()=>{
    const hasData=files.length>0||fins.some(f=>f.revenue)||Object.keys(connectedERPs).length>0;
    if(!hasData){setUploadErr("Please connect an ERP, upload a file, or enter data manually.");return;}
    setGenLoading(true);setUploadErr("");
    try{
      const lf=fins.find(f=>f.revenue)||fins[0];
      const bench=getBench(company.industry);
      const stageM=STAGE_M[company.stage]||STAGE_M["series-a"];
      const erpNote=Object.keys(connectedERPs).length>0?ERP systems connected: .:"";
      const prompt=You are a senior Indian CA. Generate valuation JSON.\\nCompany: , Industry: , Stage: , CIN: \\n\\nRevenue: \\u20b9 L, EBITDA: \\u20b9 L, PAT: \\u20b9 L\\nSector P/E: x, growth: %, stage risk discount: %\\nReturn ONLY JSON: {"baseVal":number,"bearVal":number,"bullVal":number,"revenueY1":number,"revenueY5":number,"methodology":"string","keyRisks":["r1","r2","r3"],"keyDrivers":["d1","d2","d3"],"narrative":"2 sentences"};
      const res=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
      const data=await res.json();
      const raw=data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
      let parsed;try{parsed=JSON.parse(raw.replace(/`json|`/g,"").trim());}catch{parsed=null;}
      parsed?onModelGenerated(company,fins,parsed):fallback(fins);
    }catch{fallback(fins);}
    setGenLoading(false);
  };'''

new_rungen = '''  const runGen=async()=>{
    const hasData=fins.some(f=>f.revenue)||Object.keys(connectedERPs).length>0||files.length>0;
    if(!hasData){setUploadErr("Please connect an ERP, upload a file, or enter financial data manually.");return;}
    setGenLoading(true);setUploadErr("");
    try{
      for(const fin of fins.filter(f=>f.revenue)){
        await api.post(/companies//financials,{
          year:fin.year||"FY2024",
          revenue:parseFloat(fin.revenue)||null,
          ebitda:parseFloat(fin.ebitda)||null,
          pat:parseFloat(fin.pat)||null,
          total_assets:parseFloat(fin.assets)||null,
          debt:parseFloat(fin.debt)||null,
          source:"manual"
        });
      }
      const result=await api.post(/valuation//generate,{});
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
      console.error("Generation failed:",e);
      setUploadErr(e?.detail||"Generation failed - check backend logs.");
      fallback(fins);
    }
    setGenLoading(false);
  };'''

if old_rungen in content:
    content = content.replace(old_rungen, new_rungen)
    print('runGen: FIXED')
else:
    print('runGen: NOT FOUND')

open('src/App.tsx', 'w', encoding='utf-8').write(content)
print('runGen patch done')
