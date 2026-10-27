'use strict';
const $=id=>document.getElementById(id),{LPModel,SimplexSolver}=LPCore;
const clone=x=>JSON.parse(JSON.stringify(x));
const fmt=v=>Math.abs(v)<1e-8?'0':Number(v.toPrecision(9)).toString();
const tanner={sense:'max',c:[3,-2.5],constraints:[{a:[2,-1],op:'<=',b:3000},{a:[1,-1],op:'<=',b:1000}]};
const examples={...LPExamples,tanner};
class ModelRepository{
  download(name,data,type='application/json'){
    const blob=new Blob([typeof data==='string'?data:JSON.stringify(data,null,2)],{type});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async read(file){if(!file) return null;if(file.size>1024*1024)throw Error('文件超过 1 MB，请缩小后导入');return file.text();}
}
class ModelView{
  render(project,onChange){
    $('sense').value=project.model.sense;$('narrative').value=project.narrative;$('assumptions').value=project.assumptions;
    $('variables').replaceChildren();project.names.forEach((name,j)=>{
      const div=document.createElement('div');div.className='variable';const label=document.createElement('span');label.textContent=`x${j+1}`;
      const input=this.input(name,'text',`活动 ${j+1} 名称`);input.oninput=()=>{project.names[j]=input.value;onChange();};
      const del=document.createElement('button');del.textContent='×';del.className='delete';del.title='删除活动';del.onclick=()=>{if(project.names.length===1)return;project.names.splice(j,1);project.model.c.splice(j,1);project.model.constraints.forEach(r=>r.a.splice(j,1));this.render(project,onChange);onChange();};div.append(label,input,del);$('variables').append(div);
    });
    const table=$('coefficients');table.replaceChildren();const tr=document.createElement('tr');
    for(const text of ['资源 / 约束',...project.names.map((v,j)=>`${v||'活动'} x${j+1}`),'关系','限制','']){const th=document.createElement('th');th.textContent=text;tr.append(th);}table.append(tr);
    project.model.constraints.forEach((r,i)=>{
      const row=document.createElement('tr'),nameCell=document.createElement('td'),name=this.input(project.resourceNames[i],'text',`约束 ${i+1} 名称`);name.className='name';name.oninput=()=>{project.resourceNames[i]=name.value;onChange();};nameCell.append(name);row.append(nameCell);
      r.a.forEach((v,j)=>{const td=document.createElement('td'),input=this.input(v,'number',`约束 ${i+1} 活动 ${j+1} 系数`);input.oninput=()=>{r.a[j]=input.value===''?null:Number(input.value);onChange();};td.append(input);row.append(td);});
      const opCell=document.createElement('td'),op=document.createElement('select');op.setAttribute('aria-label',`约束 ${i+1} 关系`);for(const value of ['<=','<','=','>=','>']){const o=document.createElement('option');o.value=value;o.textContent=({'<=':'≤','>=':'≥'})[value]||value;op.append(o);}op.value=r.op;op.onchange=()=>{r.op=op.value;onChange();};opCell.append(op);row.append(opCell);
      const bCell=document.createElement('td'),b=this.input(r.b,'number',`约束 ${i+1} 限制`);b.oninput=()=>{r.b=b.value===''?null:Number(b.value);onChange();};bCell.append(b);row.append(bCell);
      const deleteCell=document.createElement('td'),del=document.createElement('button');del.className='delete';del.textContent='×';del.title='删除约束';del.onclick=()=>{if(project.model.constraints.length===1)return;project.model.constraints.splice(i,1);project.resourceNames.splice(i,1);this.render(project,onChange);onChange();};deleteCell.append(del);row.append(deleteCell);table.append(row);
    });
    const profit=document.createElement('tr'),title=document.createElement('td');title.textContent='单位利润 / 成本';profit.append(title);
    project.model.c.forEach((v,j)=>{const td=document.createElement('td'),input=this.input(v,'number',`目标系数 ${j+1}`);input.oninput=()=>{project.model.c[j]=input.value===''?null:Number(input.value);onChange();};td.append(input);profit.append(td);});table.append(profit);
  }
  input(value,type,label){const x=document.createElement('input');x.type=type;if(type==='number')x.step='any';x.value=value??'';x.setAttribute('aria-label',label);if(type==='text')x.maxLength=80;return x;}
  formula(model){const term=a=>a.map((v,j)=>`${j&&v>=0?'+ ':''}${v} x${j+1}`).join(' ');return [`${model.sense} z = ${term(model.c)}`,...model.constraints.map(r=>`${term(r.a)} ${r.op} ${r.b}`),model.c.map((_,j)=>`x${j+1} ≥ 0`).join('，')].join('\n');}
  showResult(result,project){
    const body=$('resultBody');body.replaceChildren();
    const add=(tag,text,cls)=>{const el=document.createElement(tag);el.textContent=text;if(cls)el.className=cls;body.append(el);return el;};
    const labels={optimal:'已得到最优解',infeasible:'无可行解：约束条件相互冲突',unbounded:'目标无界：不存在有限最优值',iteration_limit:'达到迭代上限：未完成求解',numerical_error:'数值异常：请检查量纲、系数范围和约束'};
    add('p',labels[result.status],result.status==='optimal'?'':'status-error');
    if(result.status==='optimal'){
      add('div',`${project.model.sense} z = ${fmt(result.objective)}`,'result-score');
      const lines=result.x.map((v,j)=>`${project.names[j]}（x${j+1}）= ${fmt(v)}`);add('pre',lines.join('\n'));
      const table=document.createElement('table');let header=document.createElement('tr');for(const s of ['资源 / 约束','左端值','限制','余量 / 等式误差']){const th=document.createElement('th');th.textContent=s;header.append(th);}table.append(header);
      project.model.constraints.forEach((r,i)=>{const tr=document.createElement('tr');for(const v of [project.resourceNames[i],fmt(result.checks.lhs[i]),`${r.op} ${r.b}`,fmt(result.checks.residuals[i])]){const td=document.createElement('td');td.textContent=v;tr.append(td);}table.append(tr);});body.append(table);
      add('p','结果已代回原始约束检查。余量不等同于影子价格；本工具未进行灵敏度分析。');
    }
    add('p',`共 ${result.iterations} 次换基。原始模型与本次结果一并保存在导出记录中。`);
    const details=document.createElement('details'),summary=document.createElement('summary');summary.textContent='查看两阶段单纯形法迭代记录';details.append(summary);
    const wrap=document.createElement('div');wrap.className='trace';
    for(const step of result.trace){const p=document.createElement('p');p.textContent=`${step.phase} · 第 ${step.iteration} 次换基${step.enter?` · 入基 ${step.enter}，出基 ${step.leave}`:''}`;wrap.append(p);const table=document.createElement('table');const rows=[['基 / 目标',...step.columns],...step.tableau.map((r,i)=>[step.basis[i]||(i===step.basis.length?'原目标':'辅助目标'),...r.map(fmt)])];for(const r of rows){const tr=document.createElement('tr');for(const v of r){const td=document.createElement('td');td.textContent=v;tr.append(td);}table.append(tr);}wrap.append(table);}details.append(wrap);body.append(details);
    add('p','本结果针对非负连续变量。若业务要求整数数量，不能直接四舍五入后宣称最优。','notice');$('result').showModal();
  }
}
class SolveController{
  constructor(view,solver,repository){this.view=view;this.solver=solver;this.repository=repository;this.project=null;this.built=null;this.lastResult=null;}
  notify(msg,ok=false){$('message').textContent=msg;$('message').className=ok?'ok':'';}
  invalidate(){this.built=null;this.lastResult=null;$('solve').disabled=true;$('modelState').textContent='输入已变更，请重新建模';$('modelText').textContent='当前输入尚未生成数学模型。';}
  load(key){const model=clone(examples[key]);this.project={schema:1,model,names:model.c.map((_,i)=>`活动${i+1}`),resourceNames:model.constraints.map((_,i)=>`资源${i+1}`),narrative:'请填写问题陈述。',assumptions:'所有变量非负且连续；参数为确定值。'};
    if(key==='tanner'){this.project.names=['玩具','A+B组合部件'];this.project.resourceNames=['A部件','B部件'];this.project.narrative='G.A. Tanner 公司每生产一件玩具获得 3 美元利润，每件玩具消耗 2 个 A 部件和 1 个 B 部件。A 每日供应上限为 3000，B 为 1000。公司可自行生产 A+B 组合，每组同时获得 1 个 A 和 1 个 B，成本 2.5 美元。应安排多少玩具与组合部件，使净利润最大？';this.project.assumptions+=' 组合部件按 A、B 等量生产；资源行的负系数表示补充资源。';}
    if(key==='original'||key==='revised'){this.project.names=['橡皮鸭','橡皮鱼'];this.project.resourceNames=['橡胶','鸭产量上限','鱼产量上限',...(key==='revised'?['鸭销量上限','鱼销量上限']:[])];this.project.narrative='老张建立生产组合模型，小明手工计算。鸭利润 5 美元，鱼利润 4 美元；以故事第 4 页模型为基准，橡胶约束为 x1+1.25x2≤500，产量上限为 400 和 300。'+(key==='revised'?'审核后增加鸭销量≤150、鱼销量≤50。':'初始模型暂未加入销量限制。');this.project.assumptions+=' 统一 x1=鸭、x2=鱼；故事第 8 页目标系数与第 4 页不一致，本例按第 4 页及文字利润取 5、4。';}
    this.view.render(this.project,()=>this.invalidate());this.invalidate();this.notify('示例已载入，请审核后建模。',true);
  }
  build(){try{if(this.project.model.constraints.some(r=>['<','>'].includes(r.op)))throw Error('严格不等式不能直接交给本求解器。请确认业务边界后改为 ≤、≥ 或 =，软件不会自动替换。');this.built=new LPModel(this.project.model);$('modelText').textContent=this.view.formula(this.built);$('solve').disabled=false;$('modelState').textContent='模型已生成，可计算';this.notify('建模成功。请核对目标、单位、约束和假设。',true);}catch(e){this.invalidate();this.notify(e.message);}}
  solve(){if(!this.built)return;try{this.lastResult={project:clone(this.project),result:this.solver.solve(this.built)};this.view.showResult(this.lastResult.result,this.lastResult.project);this.notify('本次计算已完成。',true);}catch(e){this.notify(e.message);}}
  async importProject(file){try{const text=await this.repository.read(file);if(text===null)return;const p=JSON.parse(text);new LPModel(p.model);if(p.schema!==1||!Array.isArray(p.names)||p.names.length!==p.model.c.length||!p.names.every(v=>typeof v==='string'&&v.length<=80)||!Array.isArray(p.resourceNames)||p.resourceNames.length!==p.model.constraints.length||!p.resourceNames.every(v=>typeof v==='string'&&v.length<=80)||typeof p.narrative!=='string'||typeof p.assumptions!=='string')throw Error('项目格式或名称维数不合法');this.project=clone(p);this.view.render(this.project,()=>this.invalidate());this.invalidate();this.notify('项目已导入，请重新建模。',true);}catch(e){this.notify(`导入失败：${e.message}`);}}
}
const controller=new SolveController(new ModelView(),new SimplexSolver(),new ModelRepository());
$('loadExample').onclick=()=>controller.load($('example').value);$('build').onclick=()=>controller.build();$('solve').onclick=()=>controller.solve();
$('sense').onchange=()=>{controller.project.model.sense=$('sense').value;controller.invalidate();};
for(const id of ['narrative','assumptions'])$(id).oninput=()=>{controller.project[id]=$(id).value;controller.invalidate();};
$('addVariable').onclick=()=>{const p=controller.project;if(p.model.c.length>=20)return controller.notify('最多支持 20 个活动');p.names.push(`活动${p.names.length+1}`);p.model.c.push(0);p.model.constraints.forEach(r=>r.a.push(0));controller.view.render(p,()=>controller.invalidate());controller.invalidate();};
$('addConstraint').onclick=()=>{const p=controller.project;if(p.model.constraints.length>=40)return controller.notify('最多支持 40 条原始约束');p.resourceNames.push(`资源${p.resourceNames.length+1}`);p.model.constraints.push({a:p.model.c.map(()=>0),op:'<=',b:0});controller.view.render(p,()=>controller.invalidate());controller.invalidate();};
$('closeResult').onclick=()=>$('result').close();
$('save').onclick=()=>controller.repository.download('易行LP项目.json',controller.project);
$('openProject').onclick=()=>$('projectFile').click();$('projectFile').onchange=async e=>{await controller.importProject(e.target.files[0]);e.target.value='';};
$('importText').onclick=()=>$('textFile').click();$('textFile').onchange=async e=>{try{const text=await controller.repository.read(e.target.files[0]);if(text!==null){controller.project.narrative=text;$('narrative').value=text;controller.invalidate();controller.notify('文本已导入，请人工提取建模信息。',true);}}catch(err){controller.notify(err.message);}e.target.value='';};
$('exportResult').onclick=()=>{if(controller.lastResult)controller.repository.download('易行LP计算记录.json',controller.lastResult);};
controller.load('tanner');
