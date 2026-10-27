(function(root){
const original={sense:'max',c:[5,4],constraints:[{a:[1,1.25],op:'<=',b:500},{a:[1,0],op:'<=',b:400},{a:[0,1],op:'<=',b:300}]};
const revised={...original,constraints:[...original.constraints,{a:[1,0],op:'<=',b:150},{a:[0,1],op:'<=',b:50}]};
const examples={original,revised,min:{sense:'min',c:[1,1.5],constraints:[{a:[1,3],op:'>=',b:3},{a:[1,1],op:'>=',b:2}]},infeasible:{sense:'max',c:[1],constraints:[{a:[1],op:'<=',b:1},{a:[1],op:'>=',b:2}]},unbounded:{sense:'max',c:[1,1],constraints:[{a:[1,-1],op:'<=',b:0}]}};
if(typeof module!=='undefined'&&module.exports)module.exports=examples;root.LPExamples=examples;
})(typeof window==='undefined'?globalThis:window);
