const assert=require('node:assert/strict');const fs=require('node:fs');const {LPModel,SimplexSolver}=require('./solver.js');const examples=require('./examples.js');
const records=[];function run(id,name,fn){try{const result=fn();records.push({id,name,passed:true,...result});}catch(e){records.push({id,name,passed:false,error:e.message});process.exitCode=1;}}
function optimal(data,x,z){const r=new SimplexSolver().solve(new LPModel(data));assert.equal(r.status,'optimal');assert.ok(Math.abs(r.objective-z)<1e-6);if(x)x.forEach((v,j)=>assert.ok(Math.abs(r.x[j]-v)<1e-6));assert.ok(r.checks.feasible);return {status:r.status,x:r.x,objective:r.objective,iterations:r.iterations};}
run('T01','故事初始模型',()=>optimal(examples.original,[400,80],2320));
run('T02','增加销量约束重新计算',()=>optimal(examples.revised,[150,50],950));
run('T03','教师 Tanner 原型',()=>optimal({sense:'max',c:[3,-2.5],constraints:[{a:[2,-1],op:'<=',b:3000},{a:[1,-1],op:'<=',b:1000}]},[2000,1000],3500));
run('T04','最小化与大于等于约束',()=>optimal(examples.min,[1.5,.5],2.25));
run('T05','等式约束',()=>optimal({sense:'max',c:[2,1],constraints:[{a:[1,1],op:'=',b:3}]},[3,0],6));
run('T06','负右端值与阶段一',()=>optimal({sense:'max',c:[1],constraints:[{a:[-1],op:'<=',b:-2},{a:[1],op:'<=',b:5}]},[5],5));
run('T07','无可行解',()=>{const r=new SimplexSolver().solve(examples.infeasible);assert.equal(r.status,'infeasible');return {status:r.status};});
run('T08','无界问题',()=>{const r=new SimplexSolver().solve(examples.unbounded);assert.equal(r.status,'unbounded');return {status:r.status};});
run('T09','冗余等式与零行',()=>optimal({sense:'max',c:[1,1],constraints:[{a:[1,1],op:'=',b:2},{a:[2,2],op:'=',b:4},{a:[0,0],op:'=',b:0}]},null,2));
run('T10','退化循环经典算例',()=>optimal({sense:'max',c:[10,-57,-9,-24],constraints:[{a:[.5,-5.5,-2.5,9],op:'<=',b:0},{a:[.5,-1.5,-.5,1],op:'<=',b:0},{a:[1,0,0,0],op:'<=',b:1}]},null,1));
run('T11','非有限数值拒绝',()=>{assert.throws(()=>new LPModel({sense:'max',c:[NaN],constraints:[{a:[1],op:'<=',b:1}]}));return {status:'rejected'};});
run('T12','维数不匹配拒绝',()=>{assert.throws(()=>new LPModel({sense:'max',c:[1,2],constraints:[{a:[1],op:'<=',b:1}]}));return {status:'rejected'};});
run('T13','严格不等式拒绝',()=>{assert.throws(()=>new LPModel({sense:'max',c:[1],constraints:[{a:[1],op:'<',b:1}]}));return {status:'rejected'};});
run('T14','迭代上限不冒充最优',()=>{const r=new SimplexSolver().solve(examples.original,{maxIterations:0});assert.equal(r.status,'iteration_limit');return {status:r.status};});
run('T15','零目标与多最优模型',()=>optimal({sense:'max',c:[0,0],constraints:[{a:[1,1],op:'<=',b:5}]},null,0));
run('T16','零行导致不可行',()=>{const r=new SimplexSolver().solve({sense:'max',c:[1],constraints:[{a:[0],op:'<=',b:-1}]});assert.equal(r.status,'infeasible');return {status:r.status};});
console.log(JSON.stringify({total:records.length,passed:records.filter(r=>r.passed).length,records},null,2));if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify({total:records.length,passed:records.filter(r=>r.passed).length,records},null,2));
