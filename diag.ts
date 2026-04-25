import * as ts from "typescript";
import * as fs from "fs";
const fileText = fs.readFileSync("components/FinancialCalendar.tsx", "utf8");
const sourceFile = ts.createSourceFile("components/FinancialCalendar.tsx", fileText, ts.ScriptTarget.Latest, true);

function getDiagnostics() {
  const program = ts.createProgram(["components/FinancialCalendar.tsx"], { jsx: ts.JsxEmit.React });
  const diagnostics = ts.getPreEmitDiagnostics(program);
  for (const diagnostic of diagnostics) {
      if (diagnostic.file) {
          const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start!);
          const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
          console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
      } else {
          console.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      }
  }
}
getDiagnostics();
