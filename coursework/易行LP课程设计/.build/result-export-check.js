async (page) => {
 await page.getByRole('button',{name:'计算规划方案'}).click();
 await page.getByText('查看两阶段单纯形法迭代记录',{exact:true}).click();
 if(!(await page.locator('.trace').textContent()).includes('出基'))throw Error('缺少换基记录');
 const [d]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'导出计算记录',exact:true}).click()]);
 await d.saveAs('output/playwright/易行LP计算记录-Tanner.json');await page.getByRole('button',{name:'关闭',exact:true}).click();
 return {name:'U13 计算记录包含模型快照及换基过程并可导出',passed:true};
}
