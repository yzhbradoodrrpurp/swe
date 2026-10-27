async (page) => {
 await page.goto('http://127.0.0.1:8765'); const evidence=[]; const check=(v,name)=>{if(!v)throw Error(name);evidence.push({name,passed:true});};
 await page.getByRole('button',{name:'建模',exact:true}).click();
 check((await page.locator('#modelText').textContent()).includes('3 x1 -2.5 x2'),'U01 Tanner 模型生成');
 await page.screenshot({path:'output/playwright/易行LP-建模界面.png',fullPage:true});
 await page.getByRole('button',{name:'计算规划方案'}).click();
 check((await page.locator('#resultBody').textContent()).includes('3500'),'U02 Tanner 计算结果');
 await page.screenshot({path:'output/playwright/易行LP-Tanner方案.png',fullPage:true});
 await page.getByRole('button',{name:'关闭',exact:true}).click();
 await page.getByRole('spinbutton',{name:'约束 1 限制',exact:true}).fill('3200');
 check(await page.getByRole('button',{name:'计算规划方案'}).isDisabled(),'U03 修改使旧模型失效');
 await page.getByRole('combobox',{name:'约束 1 关系',exact:true}).selectOption('<');
 await page.getByRole('button',{name:'建模',exact:true}).click();
 check((await page.locator('#message').textContent()).includes('严格不等式'),'U04 严格不等式明确阻止');
 await page.getByRole('combobox',{name:'示例',exact:true}).selectOption('revised');await page.getByRole('button',{name:'载入',exact:true}).click();
 await page.getByRole('button',{name:'建模',exact:true}).click();await page.getByRole('button',{name:'计算规划方案'}).click();
 check((await page.locator('#resultBody').textContent()).includes('950'),'U05 销量约束后重算');
 await page.screenshot({path:'output/playwright/易行LP-销量约束结果.png',fullPage:true});
 await page.getByRole('button',{name:'关闭',exact:true}).click();
 for(const [key,label] of [['infeasible','无可行解'],['unbounded','目标无界']]){
  await page.getByRole('combobox',{name:'示例',exact:true}).selectOption(key);await page.getByRole('button',{name:'载入',exact:true}).click();await page.getByRole('button',{name:'建模',exact:true}).click();await page.getByRole('button',{name:'计算规划方案'}).click();check((await page.locator('#resultBody').textContent()).includes(label),`U06/07 ${label} 显示`);await page.getByRole('button',{name:'关闭',exact:true}).click();
 }
 await page.getByRole('combobox',{name:'示例',exact:true}).selectOption('tanner');await page.getByRole('button',{name:'载入',exact:true}).click();
 await page.getByRole('button',{name:'＋ 活动'}).click();check(await page.getByRole('textbox',{name:'活动 3 名称'}).count()===1,'U08 增加活动');
 await page.getByRole('button',{name:'＋ 约束'}).click();check(await page.getByRole('spinbutton',{name:'约束 3 活动 3 系数',exact:true}).count()===1,'U09 矩阵维数同步增加');
 const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'导出项目',exact:true}).click()]);await download.saveAs('output/playwright/易行LP项目-往返测试.json');
 await page.locator('#projectFile').setInputFiles('output/playwright/易行LP项目-往返测试.json');await page.waitForFunction(()=>document.getElementById('message').textContent.includes('项目已导入'));check((await page.locator('#message').textContent()).includes('项目已导入'),'U10 项目导出导入往返');
 await page.locator('#textFile').setInputFiles({name:'业务说明.txt',mimeType:'text/plain',buffer:Buffer.from('检查文本导入：资源有限，利润最大。')});await page.waitForFunction(()=>document.getElementById('narrative').value.includes('检查文本导入'));check((await page.getByRole('textbox',{name:'问题陈述',exact:true}).inputValue()).includes('检查文本导入'),'U11 问题陈述导入');
 await page.getByRole('combobox',{name:'示例',exact:true}).selectOption('tanner');await page.getByRole('button',{name:'载入',exact:true}).click();await page.getByRole('button',{name:'建模',exact:true}).click();
 await page.setViewportSize({width:900,height:1100});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'U12 900 像素无页面横向溢出');await page.setViewportSize({width:1440,height:1100});
 return evidence;
}
