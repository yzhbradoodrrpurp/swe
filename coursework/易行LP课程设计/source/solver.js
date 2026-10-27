/* 易行 LP — 两阶段单纯形法；所有变量非负、连续。无外部运行依赖。 */
(function (root) {
'use strict';
const EPS = 1e-9;
class LPModel {
  constructor(data) {
    if (!data || !['max','min'].includes(data.sense)) throw Error('目标方向必须为 max 或 min');
    if (!Array.isArray(data.c) || data.c.length < 1 || data.c.length > 20) throw Error('变量数应为 1～20');
    if (!Array.isArray(data.constraints) || data.constraints.length < 1 || data.constraints.length > 40) throw Error('约束数应为 1～40');
    const finite = v => typeof v === 'number' && Number.isFinite(v) && Math.abs(v) <= 1e9;
    if (!data.c.every(finite)) throw Error('目标系数须为有限数字，绝对值不超过 10⁹');
    for (const [i,r] of data.constraints.entries()) {
      if (!r || !Array.isArray(r.a) || r.a.length !== data.c.length || !r.a.every(finite) || !finite(r.b) || !['<=','>=','='].includes(r.op)) throw Error(`约束 ${i+1} 的维数、关系符或数字不合法`);
    }
    this.sense=data.sense; this.c=[...data.c];
    this.constraints=data.constraints.map(r=>({a:[...r.a],op:r.op,b:r.b}));
  }
  toJSON(){ return {sense:this.sense,c:[...this.c],constraints:this.constraints.map(r=>({...r,a:[...r.a]}))}; }
  standardize(){
    const A=[],b=[];
    for(const r of this.constraints){
      if(r.op !== '>='){A.push([...r.a]);b.push(r.b);}
      if(r.op !== '<='){A.push(r.a.map(v=>-v));b.push(-r.b);}
    }
    return {A,b,c:this.c.map(v=>this.sense==='max'?v:-v)};
  }
  check(x){
    const lhs=this.constraints.map(r=>r.a.reduce((s,v,j)=>s+v*x[j],0));
    const residuals=lhs.map((v,i)=>{const r=this.constraints[i];return r.op==='<='?r.b-v:r.op==='>='?v-r.b:-Math.abs(v-r.b);});
    const tolerance = (v,b) => 1e-7*(1+Math.abs(v)+Math.abs(b));
    const feasible=x.every(v=>Number.isFinite(v)&&v>=-1e-7) && residuals.every((v,i)=>v>=-tolerance(lhs[i],this.constraints[i].b));
    return {lhs,residuals,feasible};
  }
}
class SimplexSolver {
  solve(model,{maxIterations=2000}={}){
    if(!(model instanceof LPModel)) model=new LPModel(model);
    const {A,b,c}=model.standardize(); const m=b.length,n=c.length;
    const D=Array.from({length:m+2},()=>Array(n+2).fill(0));
    const B=Array.from({length:m},(_,i)=>n+i),N=Array.from({length:n},(_,j)=>j);N.push(-1);
    for(let i=0;i<m;i++){for(let j=0;j<n;j++)D[i][j]=A[i][j];D[i][n]=-1;D[i][n+1]=b[i];}
    for(let j=0;j<n;j++)D[m][j]=-c[j];D[m+1][n]=1;
    const trace=[];let iterations=0;
    const name=v=>v===-1?'a':v<n?`x${v+1}`:`s${v-n+1}`;
    const snapshot=(phase,enter=null,leave=null)=>{trace.push({phase,iteration:iterations,enter,leave,basis:B.map(name),columns:[...N.map(name),'RHS'],tableau:D.map(r=>[...r])});};
    snapshot('初始表');
    const pivot=(r,s,phase)=>{
      if(iterations>=maxIterations) throw Error('ITERATION_LIMIT');
      const enter=name(N[s]),leave=name(B[r]),inv=1/D[r][s];
      for(let i=0;i<m+2;i++)if(i!==r)for(let j=0;j<n+2;j++)if(j!==s)D[i][j]-=D[r][j]*D[i][s]*inv;
      for(let j=0;j<n+2;j++)if(j!==s)D[r][j]*=inv;
      for(let i=0;i<m+2;i++)if(i!==r)D[i][s]*=-inv;
      D[r][s]=inv;[B[r],N[s]]=[N[s],B[r]];iterations++;snapshot(phase,enter,leave);
    };
    const simplex=phase=>{
      const row=phase===1?m+1:m;
      while(true){
        // Bland 规则：选择编号最小的可改善变量，平比值时选择编号最小的基变量。
        let s=-1;for(let j=0;j<=n;j++)if(!(phase===2&&N[j]===-1)&&D[row][j]<-EPS&&(s===-1||N[j]<N[s]))s=j;
        if(s===-1)return true;
        let r=-1;
        for(let i=0;i<m;i++)if(D[i][s]>EPS){
          if(r===-1 || D[i][n+1]/D[i][s]<D[r][n+1]/D[r][s]-EPS || (Math.abs(D[i][n+1]/D[i][s]-D[r][n+1]/D[r][s])<=EPS&&B[i]<B[r]))r=i;
        }
        if(r===-1)return false;pivot(r,s,`阶段 ${phase}`);
      }
    };
    const finish=(status,extra={})=>({status,iterations,trace,...extra});
    try{
      let r=0;for(let i=1;i<m;i++)if(D[i][n+1]<D[r][n+1])r=i;
      if(D[r][n+1]<-EPS){
        pivot(r,n,'阶段 1 初始化');
        if(!simplex(1)||D[m+1][n+1]<-EPS||Math.abs(D[m+1][n+1])>EPS)return finish('infeasible');
        for(let i=0;i<m;i++)if(B[i]===-1){
          let s=-1;for(let j=0;j<=n;j++)if(N[j]!==-1&&Math.abs(D[i][j])>EPS&&(s===-1||N[j]<N[s]))s=j;
          if(s!==-1)pivot(i,s,'移出人工变量');
        }
      }
      if(!simplex(2))return finish('unbounded');
      const x=Array(n).fill(0);for(let i=0;i<m;i++)if(B[i]<n&&B[i]>=0)x[B[i]]=Math.abs(D[i][n+1])<EPS?0:D[i][n+1];
      const objective=model.c.reduce((sum,v,j)=>sum+v*x[j],0),checks=model.check(x);
      if(!Number.isFinite(objective)||!checks.feasible||D.some(r=>r.some(v=>!Number.isFinite(v))))return finish('numerical_error');
      return finish('optimal',{x,objective,checks});
    }catch(e){if(e.message==='ITERATION_LIMIT')return finish('iteration_limit');throw e;}
  }
}
const api={LPModel,SimplexSolver,EPS};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.LPCore=api;
})(typeof window==='undefined'?globalThis:window);
