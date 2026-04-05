content = open('src/App.tsx', 'r', encoding='utf-8').read()

old_rungen = '    const hasData=files.length>0||fins.some(f=>f.revenue)||Object.keys(connectedERPs).length>0;\n    if(!hasData){setUploadErr("Please connect an ERP, upload a file, or enter data manually.");return;}'

new_rungen = '''    const hasData=fins.some(f=>f.revenue)||Object.keys(connectedERPs).length>0||files.length>0;
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
    }'''

if old_rungen in content:
    content = content.replace(old_rungen, new_rungen)
    print('runGen: FIXED')
else:
    print('runGen: NOT FOUND - trying alternate')
    # find and replace the try block
    old2 = 'setGenLoading(true);setUploadErr("");\n    try{\n      const lf=fins.find'
    if old2 in content:
        print('found alternate marker')
    else:
        print('marker also not found')

open('src/App.tsx', 'w', encoding='utf-8').write(content)
