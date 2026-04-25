import * as fs from 'fs';
const text = fs.readFileSync('components/FinancialCalendar.tsx', 'utf8');

const returnStart = text.indexOf('return (');
const lastSemi = text.lastIndexOf('  );\n};\n');
const returnBlock = text.substring(returnStart, lastSemi);
const lines = returnBlock.split('\n');

for (let i = 0; i < lines.length; i++) {
   console.log(i + ": " + lines[i]);
}
