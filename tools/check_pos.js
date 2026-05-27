const fs = require('fs');
const path = 'src/Components/Student/AddStudent.jsx';
const text = fs.readFileSync(path, 'utf8');
function posToLine(pos){
  const lines = text.split(/\r?\n/);
  let acc = 0;
  for(let i=0;i<lines.length;i++){
    acc += lines[i].length + 1;
    if(pos <= acc) return i+1;
  }
  return lines.length;
}
const positions = [28797, 31071];
positions.forEach(p => console.log(p, '-> line', posToLine(p)));
// print surrounding lines for context
const line = posToLine(28797);
const lines = text.split(/\r?\n/);
console.log('--- around open position ---');
for(let i=Math.max(0,line-5); i<Math.min(lines.length, line+5); i++){
  console.log((i+1)+': '+lines[i]);
}
const line2 = posToLine(31071);
console.log('--- around close position ---');
for(let i=Math.max(0,line2-5); i<Math.min(lines.length, line2+5); i++){
  console.log((i+1)+': '+lines[i]);
}
