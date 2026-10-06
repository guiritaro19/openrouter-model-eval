import { mkdir } from 'node:fs/promises';
import ExcelJS from 'exceljs';
import { demoRows, demoGolden } from '../src/lib/demo';
await mkdir('examples',{recursive:true});
for(const [filename,rows] of [['requests.xlsx',demoRows],['golden_dataset.xlsx',demoGolden]] as const){
  const workbook=new ExcelJS.Workbook();const sheet=workbook.addWorksheet('Fictional demo');
  sheet.columns=Object.keys(rows[0]).map(key=>({header:key,key,width:key==='notes'||key==='description'?70:25}));
  sheet.addRows(rows);sheet.getRow(1).font={bold:true};sheet.views=[{state:'frozen',ySplit:1}];
  await workbook.xlsx.writeFile('examples/'+filename);
}
console.log('Created 100 fictional request cases and corresponding teaching golden labels. No model results generated.');
