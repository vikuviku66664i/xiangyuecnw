/*
生成最终城市列表
使用统计局+民政部的数据，和高德地图的数据，对腾讯地图的数据进行校验修正。最终得到前三级以统计局为准，综合民政部、高德、腾讯地图的数据；第四级采用腾讯地图的数据。

原始数据中：
1. 前3级，除港澳台外，统计局 ⊇ 民政部 ≈ (高德 ∪ 腾讯)
2. 港澳台数据=(高德 ∪ 腾讯)

合并结果：
1. 前3级=(统计局 ∩ 民政部) ∪ (高德 ∪ 腾讯)
2. 第4级=腾讯 || 统计局

加载数据
	var url="https://地址/";
	var s=document.createElement("script");s.src=url+"Step1_2_Merge_MCA.txt?t="+Date.now();document.documentElement.appendChild(s);
	var s=document.createElement("script");s.src=url+"Step1_3_Amap.txt?t="+Date.now();document.documentElement.appendChild(s);
	var s=document.createElement("script");s.src=url+"Step1_4_QQmap.txt?t="+Date.now();document.documentElement.appendChild(s);
*/

var SaveName="Step1_5_Merge_All";
var StatsGovMCASaveName="Step1_2_Merge_MCA";
var AmapSaveName="Step1_3_Amap";
var QQmapSaveName="Step1_4_QQmap";

//qq地图数据拆分
var fixQQmapSplit={
	//直辖市第二级qq没有提供，需自行补充（此处按统计局的处理）
	11:{name:"北京市",level:1,childSplit:[{name:"市辖区",code:"110100000000"}]}
	,12:{name:"天津市",level:1,childSplit:[{name:"市辖区",code:"120100000000"}]}
	,31:{name:"上海市",level:1,childSplit:[{name:"市辖区",code:"310100000000"}]}
	,50:{name:"重庆市",level:1,childSplit:[
					//qq重庆是区和县混合在一起，需要拆分，高德的名称看起来好很多，因此不采用统计局的
					{name:"重庆城区",keepName:true,govName:"市辖区",code:"500100000000"}
					,{name:"重庆郊县",keepName:true,govName:"县",code:"500200000000"}
				]}
};
//和高德数据对比前合并统计局数据
var fixQQmapReplaceGovBeforeAmp={
	3205:{
		//高德多出的一个工业园，并且边界也是独立出来的，统计局也有这个数据，qq缺少了并且子级在分散在各城区，根据qq子级数据和参考淘宝的表现，此数据采用gov的
		name:"苏州市",level:2
		,childDiff:{
			320571:{lostName:"苏州工业园区"}
		}
	}
};
//和高德对比完后qq地图数据替换处理
var fixQQmapReplaceFillAfterAmap={
	//修正前缀和统计局一致
	620200:{name:"嘉峪关市",level:3,replaceAs:{codePrefix:"620201",name:"市辖区"}}
	,632825:{name:"大柴旦行政委员会",level:3,replaceAs:{codePrefix:"632857"}}
};
//qq地图数据用上级替换，表现为下级和上级的编号前缀不匹配，主要是那几个直筒子市是qq自定义的99结尾
var fixQQmapReplaceFill={
	//不设区的直筒子市，qq为自定义编号，这种id必须用上级替换掉清除污染
	441999:{name:"东莞市",childReplace:true}
	,442099:{name:"中山市",childReplace:true}
	,460499:{name:"儋州市",childReplace:true}
	,620299:{name:"嘉峪关市",childReplace:true} //统计局嘉峪关还有一个市辖区，上面三个没有
	
	
	//修正qq的数据项
	,361121:{name:"上饶县",replaceAs:{name:"广信区",keepName:true,govName:"上饶县"}} //已撤县设市
	
	
	//添加明确缺失的子级
	,3303:{name:"温州市",addOnNotExists:[
				{code:"330383000000",name:"龙港市"}//2019-08 龙港镇(330327101)升级为龙港市由温州市代管
			]}
	,2327:{name:"大兴安岭地区",addOnNotExists:[
				{code:"232761000000",name:"加格达奇区"}//似乎有争议地区，内蒙-呼伦贝尔-鄂伦春下面也有这个区，但统计局划分在黑龙江，此处编号也为统计局的
			]}
	
	
	//移除特殊的
	,440499:{name:"香洲区澳门大学横琴校区(由澳门特别行政区实施管辖)",remove:true}
	
	//港澳转换成 港澳(省)-港澳(市)-港澳(区)-第二级(镇) 结构。当做直筒子市来处理，比如把香港当做东莞，从面积和人口来看还算合理
	,81:{name:"香港特别行政区",repeat:2}
	,82:{name:"澳门特别行政区",repeat:2}
	
	//移除QQ单独的芦台区（唐山市芦台经济技术开发区），本着都没有开发区，像高德一样转移到路南区下面。qq的子级code和统计局不同，不处理
	,130230:{name:"芦台区",childMove:"130202000000"}
};

//qq地图数据和高德地图前三级数据有效的差异
var amapDifference={
	71:{name:"台湾省",level:1,skipChild:true}//不对比下级
	,81:{name:"香港特别行政区",level:1,childGap:1//跳过一级和高德进行对比
		,childCompareName:true}
	,82:{name:"澳门特别行政区",level:1,xAomenChild:true}//特殊的，高德和qq的完全不同，采用高德的全面些，但code规则按qq的来
	
	
	//声明名称不同但code相同的项，这种是qq未fix的，并且最终采用qq的名称
	,632825:{name:"大柴旦行政委员会",amapName:"海西蒙古族藏族自治州直辖"}
	
	
	//标记QQ里确实不存在的
	,232718:{lostName:"加格达奇区"}//加格达奇区上面已使用统计局的编号
	,4421:{lostName:"东沙群岛"}//未知情况，统计局查不到
};

//qq地图数据和统计局+MCA前三级数据有效的差异 和处理方式
var gov3Difference={
	//MCA没有的
	71:{name:"台湾省",keep:true}
	,81:{name:"香港特别行政区",keep:true}
	,82:{name:"澳门特别行政区",keep:true}

	,330383:{name:"龙港市",keep:true}
	
	
	//qq没有的
	,232762:{lostName:"松岭区"}//这三个qq确实没有，高德地图上这3地方边界属于鄂伦春，鄂伦春里面抠掉了加格达奇区
	,232763:{lostName:"新林区"}
	,232764:{lostName:"呼中区"}
	
	,152571:{lostName:"乌拉盖管委会"} //前三级中唯一的一个管委会，目测是开发区管理区之类的
	,411471:{lostName:"豫东综合物流产业聚集区"}//目测是开发区管理区之类的
};




if(!window[StatsGovMCASaveName]){
	throw new Error("需加载"+StatsGovMCASaveName);
};
if(!window[AmapSaveName]){
	throw new Error("需加载"+AmapSaveName);
};
if(!window[QQmapSaveName]){
	throw new Error("需加载"+QQmapSaveName);
};


function SCode(itm,level){
	if(level==null){
		level=1;
		var cur=itm,p=cur.parent;
		while(p){
			if(p.code!=cur.code){
				level++;
			};
			cur=p;
			p=cur.parent;
		};
	};
	
	var exp="000000";
	if(level<3){
		exp+="|00000000";
	};
	if(level<2){
		exp+="|0000000000";
	};
	return itm.code.replace(new RegExp("("+exp+")$"),"");
};
var copyItem=function(itm){
	var o={};
	for(var k in itm){
		var v=itm[k];
		if(typeof(v)!="object"){
			o[k]=v;
		}else if(k=="child"){
			o[k]=[];
		};
	};
	return o;
};
var setParent=function(p,arr,mp){
	mp||(mp={});
	for(var i=0;i<arr.length;i++){
		var itm=arr[i];
		mp[itm.code]=itm;
		itm.parent=p;
		setParent(itm,itm.child,mp);
	};
	return mp;
};

var qqMap=JSON.parse(JSON.stringify(window[QQmapSaveName]));
var govData=JSON.parse(JSON.stringify(window[StatsGovMCASaveName]));

var govDataMP=setParent(null,govData.cityList);












console.log("\n【·】重组QQmap>>>>>>>>>>");
var splitQQ=function(parent,arr,level){
	for(var i0=0;i0<arr.length;i0++){
		var itm=arr[i0];
		var scode=SCode(itm,level);
		var splitSet=fixQQmapSplit[scode];
		if(splitSet&&splitSet.level==level){
			if(splitSet.name!=itm.name){
				console.error("fixQQmapSplit名称不匹配",splitSet,itm);
				throw new Error();
			};
			splitSet.fix=true;
			
			if(itm.child.length!=1){
				console.error("子级数量不为1，不能重组",splitSet,itm);
				throw new Error();
			};
			var sitm=itm.child[0];
			console.log(sitm.code+":"+sitm.name+"被拆分",splitSet,sitm);
			
			var child=[];
			child.push.apply(child,sitm.child);
			itm.child=[];
			
			for(var si=0;si<splitSet.childSplit.length;si++){
				var set=splitSet.childSplit[si];
				var obj=$.extend({},set,{
					child:[]
					,trust:true
				});
				itm.child.push(obj);
				var osc=SCode(obj,level);
				for(var i=0;i<child.length;i++){
					var o=child[i];
					if(o.code.indexOf(osc)==0){
						obj.child.push(o);
						child.splice(i,1);
						i--;
					};
				};
			};
			
			if(child.length){
				console.error("重组后源子级还有未分配的项目",splitSet,itm,child);
				throw new Error();
			};
		};
		
		splitQQ(itm,itm.child,level+1);
	};
};
splitQQ(null,qqMap.cityList,1);
for(var k in fixQQmapSplit){
	if(!fixQQmapSplit[k].fix){
		console.error("存在未被匹配的预定义fixQQmapSplit",k,fixQQmapSplit[k]);
		throw new Error();
	};
};


console.log("\n【·】格式化QQmap>>>>>>>>>>");
var formatQQ=function(arr,parent,findBad){
	for(var i0=0;i0<arr.length;i0++){
		var itm=arr[i0];
		itm.parent=parent;
		var scode=SCode(itm);
		var replaceSet=fixQQmapReplaceFill[scode];
		if(replaceSet){
			if(replaceSet.name!=itm.name){
				console.error("fixQQmapReplaceFill名称不匹配",replaceSet,itm);
				throw new Error();
			};
		};
		
		//模式检测，处理前3级
		var is99=/99$/.test(scode);
		var isBad=false;
		for(var i=0;i<itm.child.length;i++){
			if(itm.child[i].code.indexOf(scode)==-1){
				isBad=true;
				break;
			};
		};
		if(isBad && !is99){
			if(!replaceSet){
				console.error("未知QQ地图自定义编号模式",itm);
				throw new Error();
			}else{
				isBad=false;
			};
		};
		if(!findBad&&(is99||isBad)){
			if(!replaceSet){
				console.error("发现QQ地图自定义编号，但未声明在fixQQmapReplaceFill中",itm,parent);
				throw new Error();
			};
			if(!replaceSet.remove && parent.child.length!=1){
				console.error("发现QQ地图自定义编号，但同级中存在多个条目",itm,parent);
				throw new Error();
			};
		};
		findBad=is99||isBad||findBad;
		
		//处理替换数据
		if(replaceSet){
			replaceSet.fix=true;
			if(replaceSet.remove||replaceSet.childMove){//移除特殊的
				var moveTo=0,removeEnd=0;
				for(var i=0;i<parent.child.length;i++){
					var pItm=parent.child[i];
					if(pItm.code==replaceSet.childMove){
						moveTo=pItm;
					};
					if(pItm.code==itm.code){
						if(removeEnd){
							console.error("存在多个移除项",replaceSet,parent);
							throw new Error();
						};
						removeEnd=1;
						parent.child.splice(i,1);
						console.log(itm.code+":"+itm.name+"已移除",itm);
						i--;
					};
				};
				if(replaceSet.childMove){//平级移动合并子级
					for(var i=0;i<itm.child.length;i++){
						moveTo.child.push(itm.child[i]);
					};
					console.log(itm.code+":"+itm.name+"子级"+itm.child.length+"个已平级移动到"+moveTo.name,itm,moveTo);
				};
				continue;
			}else if(replaceSet.replaceAs){
				$.extend(itm,replaceSet.replaceAs);
				delete itm.qqPY;
			}else if(replaceSet.addOnNotExists){//添加明确缺失的子级
				for(var i=0;i<replaceSet.addOnNotExists.length;i++){
					var o=replaceSet.addOnNotExists[i];
					var exists=false;
					for(var j=0;j<itm.child.length;j++){
						var jo=itm.child[j];
						if(jo.code==o.code||jo.name==o.name){
							if(jo.code!=o.code||jo.name!=o.name){
								console.error("检测明确缺失的子级时检测到冲突",jo,replaceSet,itm);
								throw new Error();
							};
							exists=true;
						};
					};
					if(exists){
						console.warn(itm.code+":"+itm.name+"已存在明确缺失的子级"+o.code+":"+o.name,itm);
					}else{
						itm.child.push($.extend({},o,{
							child:[]
							,trust:true
						}));
						console.log(itm.code+":"+itm.name+"添加明确缺失的子级"+o.code+":"+o.name,itm);
					};
				};
			}else if(replaceSet.repeat){//港澳复制多份成4级结构
				var cur=itm;
				var pChild=cur.child;
				cur.child=[];
				var copy=copyItem(cur);
				
				var childItm;
				for(var i=0;i<replaceSet.repeat;i++){
					childItm=JSON.parse(JSON.stringify(copy));
					cur.child.push(childItm);
					cur=childItm;
				};
				childItm.child=pChild;
				
				console.log(itm.code+":"+itm.name+"已复制"+replaceSet.repeat+"次",itm);
				continue;
			}else if(replaceSet.childReplace){//直筒子市直接替换掉当前级
				parent.child=[];
				var copy=copyItem(parent);
				
				parent.child.push(copy);
				copy.child=itm.child;
				console.log(itm.code+":"+itm.name+"已替换成上级相同数据",parent);
				return;
			}else{
				console.error("不支持的fixQQmapReplaceFill",replaceSet);
				throw new Error();
			};
		};
		
		formatQQ(itm.child,itm,findBad);
	};
};
formatQQ(qqMap.cityList);
for(var k in fixQQmapReplaceFill){
	if(!fixQQmapReplaceFill[k].fix){
		console.error("存在未被匹配的预定义fixQQmapReplaceFill",k,fixQQmapReplaceFill[k]);
		throw new Error();
	};
};

console.log("格式化QQmap完成",qqMap);











console.log("\n【·】对比Amap数据之前合并预定义的Gov数据>>>>>>>>>>");
var formatQQ=function(arr,level){
	var cpName=function(a,b){
		return a.name==b.name||a.name.indexOf(b.name)==0||b.name.indexOf(a.name)==0;
	};
	
	for(var i0=0;i0<arr.length;i0++){
		var itm=arr[i0];
		var scode=SCode(itm,level);
		var replaceSet=fixQQmapReplaceGovBeforeAmp[scode];
		if(replaceSet && replaceSet.level==level){
			if(replaceSet.name!=itm.name){
				console.error("fixQQmapReplaceGovBeforeAmp名称不匹配",replaceSet,itm);
				throw new Error();
			};
			var govItm=govDataMP[itm.code];
			if(!govItm){
				console.error("fixQQmapReplaceGovBeforeAmp项在Gov中不存在",replaceSet,itm);
				throw new Error();
			};
			
			//检查子级数据+配置后的是否一致
			var allow=function(obj,tips){
				var diff=replaceSet.childDiff[SCode(obj)];
				if(!diff||diff.lostName!=obj.name){
					console.error("fixQQmapReplaceGovBeforeAmp项的"+tips+"不存在项在预定义中未找到",obj,diff,replaceSet);
					throw new Error();
				};
			};
			var govArr=[];govArr.push.apply(govArr,govItm.child);
			for(var i=0;i<itm.child.length;i++){
				var cItm=itm.child[i];
				var find=0;
				for(var i1=0;i1<govArr.length;i1++){
					var gItm=govArr[i1];
					if(cItm.code==gItm.code && cpName(cItm,gItm)){
						govArr.splice(i1,1);
						find=1;
						break;
					};
				};
				if(!find){
					allow(cItm,"gov");
				};
			};
			for(var i=0;i<govArr.length;i++){
				allow(govArr[i],"qq");
			};
			
			arr[i0]=govItm;
			replaceSet.fix=true;
			console.log(itm.code+":"+itm.name+"和子级已替换成统计局的数据",itm,govItm);
		};
		formatQQ(itm.child,level+1);
	};
};
formatQQ(qqMap.cityList,1);
for(var k in fixQQmapReplaceGovBeforeAmp){
	if(!fixQQmapReplaceGovBeforeAmp[k].fix){
		console.error("存在未被匹配的预定义fixQQmapReplaceGovBeforeAmp",k,fixQQmapReplaceGovBeforeAmp[k]);
		throw new Error();
	};
};



//保证都有正确的parent
setParent(null,qqMap.cityList);



console.log("\n【·】对比Amap数据>>>>>>>>>>");
var qq_amap_QQLost=[],qq_amap_AmapLost=[],qq_amap_Difference=[];
var compareAmap=function(parent,qqmapArr,amapArrSrc,level){
	if(level>3&&!amapArrSrc.length)return;
	var amapArr=[];amapArr.push.apply(amapArr,amapArrSrc);
	
	var cpName=function(a,b){
		return a.name==b.name||a.name.indexOf(b.name)==0||b.name.indexOf(a.name)==0;
	};
	
	for(var q1=0;q1<qqmapArr.length;q1++){
		var qqItm=qqmapArr[q1],amapItm=0;
		var scode=SCode(qqItm);
		
		for(var i1=0;i1<amapArr.length;i1++){
			var itm=amapArr[i1];
			if(itm.code==qqItm.code){
				if(amapItm){
					console.error("高德存在多个和qq相同的ID",qqItm,amapArr);
					throw new Error();
				};
				amapItm=itm;
				amapArr.splice(i1,1);
				i1--;
			};
		};
		if(!amapItm){
			var compareName=false;
			//高德第4级的id为第3级id，导致无法匹配，这种粗略改成按名称查找
			if(level==4){
				compareName=amapArr.length>0&&qqItm.code.indexOf(SCode(amapArr[0],3))==0;
			};
			if(!compareName&&parent){
				var psc=SCode(parent);
				var diffSet=amapDifference[psc];
				if(diffSet&&diffSet.childCompareName){
					diffSet.hit=true;
					compareName=true;
				};
			};
			if(compareName){
				for(var i1=0;i1<amapArr.length;i1++){
					var itm=amapArr[i1];
					if(cpName(itm,qqItm)){
						if(amapItm){
							console.error("高德存在多个和qq相同的名称",qqItm,amapArr);
							throw new Error();
						};
						amapItm=itm;
						amapArr.splice(i1,1);
						i1--;
					};
				};
			};
		};
		if(!amapItm){
			if(!qqItm.trust){
				qq_amap_AmapLost.push({level:level,code:qqItm.code,name:qqItm.name});
			};
			continue;
		};
		
		
		var diffSet=amapDifference[scode];
		if(diffSet){
			if(diffSet.name!=qqItm.name){
				console.error("amapDifference名称不匹配",diffSet,qqItm);
				throw new Error();
			};
		};
		
		
		if(!cpName(amapItm,qqItm)){
			if(diffSet){
				diffSet.hit=true;
				//已声明为正确的
				if(diffSet.amapName!=amapItm.name){
					console.error("diffSet amap名称不匹配",diffSet,qqItm,amapItm);
					throw new Error();
				};
			}else if(amapItm.name.indexOf(qqItm.name.replace(/县$/,""))==0){
				//部分qq是县（正确）高德是区市（错误），前缀是相同的
			}else if(qqItm.trust){
				//代码添加的
			}else{
				qq_amap_Difference.push({level:level,code:qqItm.code,qq:qqItm.name,amap:amapItm.name});
			};
		};
		
		var nextP=qqItm,nextQQ=qqItm.child,nextAmap=amapItm.child,nextLevel=level+1;
		if(diffSet&&diffSet.level==level){
			diffSet.hit=true;
			if(diffSet.skipChild){//不对比下级
				continue;
			}else if(diffSet.childGap==1){//跳过一级和高德进行对比
				nextP=nextQQ[0];
				nextQQ=nextP.child;
				nextLevel++;
			}else if(diffSet.xAomenChild==1){//特殊的澳门，将qq的子级用高德的替换
				qqItm.child[0].child=JSON.parse(JSON.stringify(amapItm.child));
				var l4c=qqItm.child[0].child[0].child;
				for(var i=0;i<l4c.length;i++){
					if(l4c.length!=8||l4c[i].code.indexOf("8200")!=0){
						throw new Error("澳门特殊处理数据错误，手写",l4c);
					};
					l4c[i].code="8201"+l4c[i].code.substr(4,8);
				};
				continue;
			}else{
				console.error("不支持的amapDifference",diffSet);
				throw new Error();
			};
		};
		compareAmap(nextP,nextQQ,nextAmap,nextLevel);
	};
	for(var i1=0;i1<amapArr.length;i1++){
		var itm=amapArr[i1];
		var scode=SCode(itm);
		var diffSet=amapDifference[scode];
		if(diffSet){
			diffSet.hit=true;
			if(diffSet.lostName!=itm.name){
				console.error("amapDifference中lostName不一致",diffSet,itm);
				throw new Error();
			};
			continue;
		};
		qq_amap_QQLost.push({level:level,code:itm.code,name:itm.name});
	};
};
compareAmap(null,qqMap.cityList,window[AmapSaveName].cityList,1);
for(var k in amapDifference){
	if(!amapDifference[k].hit){
		console.error("存在未被匹配的预定义amapDifference",k,amapDifference[k]);
		throw new Error();
	};
};

var findCompareErr=function(arr){
	for(var i=0;i<arr.length;i++){
		if(arr[i].level<4){
			console.error("差异中存在前三级的条目，这是不允许的，请在amapDifference中进行声明或者fix中进行修复",arr[i],arr);
			throw new Error();
		};
	};
};
console.log("【qq和高德的差异项】\nqq没有的（4级的数据直接忽略不管）：",qq_amap_QQLost
	,"\n高德没有的(注意：未采集第4级，此处的4级仅仅是直辖市的)：",qq_amap_AmapLost
	,"\n名称不同的：",qq_amap_Difference);
findCompareErr(qq_amap_QQLost);
findCompareErr(qq_amap_AmapLost);
findCompareErr(qq_amap_Difference);
console.log("差异结果：前3级QQ修正后和Amap无差异");
















console.log("\n【·】格式化QQmap2>>>>>>>>>>");
var formatQQ=function(arr,level){
	for(var i0=0;i0<arr.length;i0++){
		var itm=arr[i0];
		var scode=SCode(itm,level);
		var replaceSet=fixQQmapReplaceFillAfterAmap[scode];
		if(replaceSet && replaceSet.level==level){
			if(replaceSet.name!=itm.name){
				console.error("fixQQmapReplaceFillAfterAmap名称不匹配",replaceSet,itm);
				throw new Error();
			};
			replaceSet.fix=true;
			if(replaceSet.replaceAs){
				$.extend(itm,replaceSet.replaceAs);
				delete itm.qqPY;
				var cp=replaceSet.replaceAs.codePrefix;
				if(cp){
					itm.code=cp+itm.code.substr(cp.length);
					for(var i=0;i<itm.child.length;i++){
						var o=itm.child[i];
						if(o.child.length){
							console.error("子级的子级不为空",replaceSet,itm);
							throw new Error();
						};
						o.code=cp+o.code.substr(cp.length);
					};
				};
				console.log(itm.code+":"+itm.name+"修正自身和子级",replaceSet,itm);
			}else{
				console.error("不支持的fixQQmapReplaceFillAfterAmap",replaceSet);
				throw new Error();
			};
		};
		formatQQ(itm.child,level+1);
	};
};
formatQQ(qqMap.cityList,1);
for(var k in fixQQmapReplaceFillAfterAmap){
	if(!fixQQmapReplaceFillAfterAmap[k].fix){
		console.error("存在未被匹配的预定义fixQQmapReplaceFillAfterAmap",k,fixQQmapReplaceFillAfterAmap[k]);
		throw new Error();
	};
};















console.log("\n【·】对比StatsGov+MCA和QQ的前3级数据>>>>>>>>>>");
var qq_gov3_QQLost=[],qq_gov3_GovLost=[],qq_gov3_Difference=[],qq_gov3_GovLostIgnore=[],qq_gov3_QQLostIgnore=[],qq_gov3_MCAIgnore=[];
var compareGov3=function(parent,qqmapArr,govArrSrc,level){
	if(level>3)return;
	var govArr=[];govArr.push.apply(govArr,govArrSrc);
	
	var cpGovName=function(aName,bName){
		return aName==bName||aName.indexOf(bName)==0||bName.indexOf(aName)==0;
	};
	
	for(var q1=0;q1<qqmapArr.length;q1++){
		var qqItm=qqmapArr[q1],govItm=0;
		var scode=SCode(qqItm);
		var diffSet=gov3Difference[scode];
		if(diffSet){
			if(diffSet.name!=qqItm.name){
				console.error("gov3Difference名称不匹配",diffSet,qqItm);
				throw new Error();
			};
		};
		
		for(var i1=0;i1<govArr.length;i1++){
			var itm=govArr[i1];
			if(itm.code==qqItm.code){
				if(govItm){
					console.error("gov存在多个和qq相同的ID",qqItm,govArr);
					throw new Error();
				};
				govItm=itm;
				govArr.splice(i1,1);
				i1--;
			};
		};
		if(!govItm){
			if(diffSet&&diffSet.keep){
				diffSet.hit=true;
				qq_gov3_GovLostIgnore.push({level:level,code:qqItm.code,name:qqItm.name});
			}else{
				qq_gov3_GovLost.push({level:level,code:qqItm.code,name:qqItm.name});
			};
			continue;
		};
		
		
		if(!cpGovName(govItm.name,qqItm.name)&&!cpGovName(govItm.name,qqItm.govName||"_EOF_")){
			if(govItm.name.indexOf(qqItm.name.replace(/县$/,""))==0){
				//部分县结尾，QQ是精简过的，前缀是相同的
			}else{
				qq_gov3_Difference.push({level:level,code:qqItm.code,qq:qqItm.name,gov:govItm.name});
			};
		};
		
		//前三级用gov的名称
		if(!qqItm.keepName){
			if(qqItm.name!=govItm.name){
				delete qqItm.qqPY;
			};
			qqItm.name=govItm.name;
		};
		
		var nextP=qqItm,nextQQ=qqItm.child,nextGov=govItm.child,nextLevel=level+1;
		compareGov3(nextP,nextQQ,nextGov,nextLevel);
	};
	
	for1:
	for(var i1=0;i1<govArr.length;i1++){
		var itm=govArr[i1];
		var lost={level:level,code:itm.code,name:itm.name};
		var scode=SCode(itm);
		var diffSet=gov3Difference[scode];
		if(diffSet){
			diffSet.hit=true;
			if(diffSet.lostName!=itm.name){
				console.error("gov3Difference中lostName不一致",diffSet,itm);
				throw new Error();
			};
			if(!diffSet.keep){
				qq_gov3_QQLostIgnore.push(lost);
			};
			continue;
		};
		for(var i=0;i<govData.notFindsIgnore.length;i++){
			if(itm.code==govData.notFindsIgnore[i].code){
				qq_gov3_MCAIgnore.push(lost);
				continue for1;
			};
		};
		qq_gov3_QQLost.push(lost);
	};
};
compareGov3(null,qqMap.cityList,govData.cityList,1);
for(var k in gov3Difference){
	if(!gov3Difference[k].hit){
		console.error("存在未被匹配的预定义gov3Difference",k,gov3Difference[k]);
		throw new Error();
	};
};

var findCompareErr=function(arr){
	for(var i=0;i<arr.length;i++){
		if(!arr[i].ignore){
			console.error("差异中存不能忽略的条目，这是不允许的，请在gov3Difference中进行声明或者fix中进行修复",arr[i],arr);
			throw new Error();
		};
	};
};
console.log("【qq和StatsGov+MCA的差异项】\nqq没有的：",qq_gov3_QQLost
	,"\nGov没有的：",qq_gov3_GovLost
	,"\n名称不同的：",qq_gov3_Difference
	,"\n忽略gov没有的",qq_gov3_GovLostIgnore
	,"\n忽略qq没有的",qq_gov3_QQLostIgnore
	,"\n忽略qq和mca都没有的"+qq_gov3_MCAIgnore.length+"/"+govData.notFindsIgnore.length,qq_gov3_MCAIgnore);
findCompareErr(qq_gov3_QQLost);
findCompareErr(qq_gov3_GovLost);
findCompareErr(qq_gov3_Difference);
console.log("差异结果：前3级QQ修正后和StatsGov+MCA无差异");














console.log("\n【·】分析StatsGov+MCA和QQ数据>>>>>>>>>>");
var analysis_other=[],analysis_QQLost=[],analysis_GovLost=[],analysis_Difference=[];
var analysis_searchMatchs=[];

var qqMapping={};
var analysisCheckQQ=function(parent,qqmapArr,level){
	for(var q1=0;q1<qqmapArr.length;q1++){
		var qqItm=qqmapArr[q1];
		if(qqMapping[level+"_"+qqItm.code]){
			console.error("code存在重复项",qqItm,govItm);
			throw new Error();
		};
		qqMapping[level+"_"+qqItm.code]=qqItm;
		
		if(parent){
			var pcode=SCode(parent,0);
			if(qqItm.code.indexOf(pcode)!=0){
				analysis_other.push(qqItm.code+":"+qqItm.name+" code和上级不同 "+parent.code+":"+parent.name);
			};
		};
		analysisCheckQQ(qqItm,qqItm.child,level+1);
	};
};
analysisCheckQQ(null,qqMap.cityList,1);

var analysis=function(parent,qqmapArr,govParent,govArrSrc,level){
	var govArr=[];
	for(var i=0;i<govArrSrc.length;i++){
		var o=govArrSrc[i];
		o.govParent=govParent;
		govArr.push(o);
	};
	
	var cpGovName=function(g,q){
		return g.name==q.name||g.name.indexOf(q.name.substr(0,q.name.length*2/3))!=-1;
	};
	
	for(var q1=0;q1<qqmapArr.length;q1++){
		var qqItm=qqmapArr[q1],govItm=0;
		
		for(var i1=0;i1<govArr.length;i1++){
			var itm=govArr[i1];
			if(itm.code==qqItm.code){
				if(govItm){
					console.error("gov存在多个和qq相同的ID",qqItm,govArr);
					throw new Error();
				};
				govItm=itm;
				govArr.splice(i1,1);
				i1--;
			};
		};
		
		//level4 search all parent level
		if(!govItm && level==4){
			var plist=govParent.govParent.child;
			var finds=[];
			for(var i1=0;i1<plist.length;i1++){
				var arr=plist[i1].child;
				for(var i2=0;i2<arr.length;i2++){
					var o=arr[i2];
					if(o.code==qqItm.code || cpGovName(o,qqItm)){
						finds.push({i:i2,arr:arr,o:o});
					};
				};
			};
			if(finds.length==1){
				govItm=finds[0].o;
				govItm.searchMatch=1;
				analysis_searchMatchs.push({qq:qqItm,gov:govItm});
			};
		};
		
		if(qqItm.code.length!=12 || govItm&&govItm.code.length!=12){
			console.error("code长度错误",qqItm,govItm);
			throw new Error();
		};
		
		if(level<4){
			if(!govItm){
				continue;
			};
			analysis(qqItm,qqItm.child,govItm,govItm.child,level+1);
			continue;
		};
		
		if(!govItm){
			analysis_GovLost.push({o:qqItm,code:qqItm.code,name:qqItm.name});
		}else{
			if(!cpGovName(govItm,qqItm)){
				analysis_Difference.push({o:qqItm,code:qqItm.code,qq:qqItm.name,gov:govItm.name});
			};
		};
	};
	
	if(level<4){
		return;
	};
	for(var i1=0;i1<govArr.length;i1++){
		var itm=govArr[i1];
		analysis_QQLost.push({o:itm,code:itm.code,name:itm.name});
	};
};
analysis(null,qqMap.cityList,null,govData.cityList,1);

analysis_other.push("第四级gov未匹配项同级其他城市下面查找到"+analysis_searchMatchs.length+"对");
for(var j=0;j<analysis_QQLost.length;j++){
	for(var i=0;i<analysis_searchMatchs.length;i++){
		if(analysis_QQLost[j].code==analysis_searchMatchs[i].gov.code){
			analysis_QQLost.splice(j,1);
			j--;
		};
	};
};
for(var i=0;i<analysis_searchMatchs.length;i++){
	delete analysis_searchMatchs[i].gov.searchMatch;
};
//统计出上级的数量分布
var analysis_QQLostP={4:analysis_QQLost},analysis_GovLostP={4:analysis_GovLost},analysis_DifferenceP={4:analysis_Difference};
var bp=function(dist,pn){
	var arr=dist[4];
	dist[3]=[];
	dist[2]=[];
	dist[1]=[];
	
	var mp={1:{},2:{},3:{}};
	for(var i0=0;i0<arr.length;i0++){
		var o=arr[i0].o;
		delete arr[i0].o;
		
		for(var i=3;i>=1;i--){
			o=o[pn];
			var itm=mp[i][o.code];
			if(!itm){
				itm={code:o.code,name:o.name,count:0};
				mp[i][o.code]=itm;
				dist[i].push(itm);
			};
			itm.count++;
		};
	};
	for(var i=1;i<=3;i++){
		dist[i].sort(function(a,b){return b.count-a.count});
	};
};
bp(analysis_QQLostP,"govParent");
bp(analysis_GovLostP,"parent");
bp(analysis_DifferenceP,"parent");

console.log("【分析结果】\n第4级qq没有的：",analysis_QQLostP
	,"\n第4级Gov没有的：",analysis_GovLostP
	,"\n第4级存在差异的：",analysis_DifferenceP
	,"\n其他信息：",analysis_other);
	











console.log("\n【·】导出>>>>>>>>>>");
var format=function(src,level){
	var dist=[];
	for(var i=0;i<src.length;i++){
		var o=src[i];
		var itm={
			name:o.name
			,code:o.code
			,child:[]
		};
		if(o.qqPY)itm.qqPY=o.qqPY;
		dist.push(itm);
		
		if(level<4){
			if(o.child.length==0){
				if(o.code.indexOf("71")!=0){//台湾明确缺失第4级就不提示了
					console.log(level+":"+o.code+":"+o.name+"缺失下级，用自身补齐",o);
				};
				o.child.push(JSON.parse(JSON.stringify(itm)));
			};
			
			itm.child=format(o.child,level+1);
		};
	};
	dist.sort(function(a,b){
		return a.code.localeCompare(b.code);
	});
	return dist;
};
var data=format(qqMap.cityList,1);

var saveData={
	statsGovYear:govData.statsGovYear
	,qqVer:qqMap.ver
	,cityList:data
};
window[SaveName]=saveData;

var url=URL.createObjectURL(
	new Blob([
		new Uint8Array([0xEF,0xBB,0xBF])
		,"var "+SaveName+"="
		,JSON.stringify(saveData,null,"\t")
	]
	,{"type":"text/plain"})
);
var downA=document.createElement("A");
downA.innerHTML="下载合并好城市的文件";
downA.href=url;
downA.download=SaveName+".txt";
downA.click();

console.log("--完成--");