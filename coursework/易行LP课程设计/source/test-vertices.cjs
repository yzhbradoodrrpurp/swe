// 独立核对：二维有界问题通过枚举边界交点得到最优值，不复用单纯形表。
const assert=require('node:assert/strict'),fs=require('node:fs');const {SimplexSolver}=require('./solver.js');
let seed=20261026;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};const records=[];
for(let k=0;k<100;k++){
 const c=[Math.floor(rand()*11)-5,Math.floor(rand()*11)-5],point=[rand()*5,rand()*5];
 const constraints=[{a:[1,0],op:'<=',b:10},{a:[0,1],op:'<=',b:10}];
 for(let i=0;i<4;i++){const a=[Math.floor(rand()*11)-5,Math.floor(rand()*11)-5];constraints.push({a,op:'<=',b:a[0]*point[0]+a[1]*point[1]+rand()*8});}
 const sense=k%2?'min':'max',edges=[...constraints,{a:[-1,0],b:0},{a:[0,-1],b:0}],vertices=[];
 for(let i=0;i<edges.length;i++)for(let j=i+1;j<edges.length;j++){
  const p=edges[i],q=edges[j],det=p.a[0]*q.a[1]-p.a[1]*q.a[0];if(Math.abs(det)<1e-10)continue;
  const x=[(p.b*q.a[1]-p.a[1]*q.b)/det,(p.a[0]*q.b-p.b*q.a[0])/det];
  if(edges.every(r=>r.a[0]*x[0]+r.a[1]*x[1]<=r.b+1e-7))vertices.push(x);
 }
 assert.ok(vertices.length);const values=vertices.map(x=>x[0]*c[0]+x[1]*c[1]);const expected=sense==='max'?Math.max(...values):Math.min(...values);
 const r=new SimplexSolver().solve({sense,c,constraints});assert.equal(r.status,'optimal');assert.ok(Math.abs(r.objective-expected)<1e-6,`case ${k}`);
 records.push({case:k+1,sense,expected,actual:r.objective,passed:true});
}
const summary={seed:20261026,method:'二维可行顶点枚举，独立于单纯形法',total:100,passed:100,records};console.log('100/100 顶点枚举交叉核对通过');if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(summary,null,2));
