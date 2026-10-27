async (page) => {
 await page.getByRole('combobox',{name:'示例',exact:true}).selectOption('tanner');await page.getByRole('button',{name:'载入',exact:true}).click();await page.getByRole('button',{name:'建模',exact:true}).click();
 await page.screenshot({path:'output/playwright/易行LP-建模输入局部.png',clip:{x:510,y:220,width:870,height:585}});
 await page.screenshot({path:'output/playwright/易行LP-问题陈述局部.png',clip:{x:60,y:220,width:430,height:500}});
 await page.getByRole('button',{name:'计算规划方案'}).click();const box=await page.locator('#result').boundingBox();await page.screenshot({path:'output/playwright/易行LP-Tanner方案局部.png',clip:{x:box.x,y:box.y,width:box.width,height:Math.min(box.height,450)}});await page.getByRole('button',{name:'关闭',exact:true}).click();
 return 'captured';
}
