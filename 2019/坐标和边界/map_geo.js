/*
采集高德省市区三级坐标和行政区域边界，此数据的id为ok_data的id

关于未获取到坐标或边界的城市，本方案采取不处理策略，空着就空着，覆盖主要城市和主要人群，未覆盖区域实际使用过程中应该进行降级等处理。

用途示例：【尽最大可能】的根据用户坐标来确定用户所在城市，因为存在没有边界信息的区域，未匹配到的应使用ip等城市识别方法。


注：本来想采百度的，但经过使用发现百度数据有严重问题，参考 肃宁县、路南区 边界，百度数据大量线段交叉的无效polygon，没有人工无法修正；并且高德对镂空性质的地块处理比百度强，参考天津市对唐山大块飞地的处理。所以放弃使用百度地图数据。




在高德地图测试页面，选到iframe上下文中执行
https://lbs.amap.com/api/javascript-api/example/district-search/draw-district-boundaries

加载数据
	先直接运行本代码，根据提示输入data-pinyin.txt到文本框 (内容太大，控制台吃不消，文本框快很多)
	或者使用本地网址更快：
	var s=document.createElement("script");s.src="https://地址/data-pinyin.txt";document.body.appendChild(s)
	
然后再次运行本代码，如果中途因错误停止，根据提示重复运行
*/
"use strict";
AMap.LngLat;
console=top.console;

var GeoStop=false;

var Load_Thread_Count=4;//模拟线程数






var logX=top.document.createElement("div");
logX.innerHTML='<div class="LogX" style="position: fixed;bottom: 80px;right: 100px;padding: 50px;background: #0ca;color: #fff;font-size: 16px;width: 600px;z-index:9999999"></div>';
top.document.body.appendChild(logX);
logX=top.document.querySelectorAll(".LogX");
logX=logX[logX.length-1];
var logXn=0;
function LogX(txt){
	logXn++;
	//if(logXn%100==0){
		logX.innerText=txt;
	//}
}
if(!top.document.querySelector(".DataTxt")){
	var div=top.document.createElement("div");
	div.innerHTML=('<div style="position: fixed;bottom: 80px;left: 100px;padding: 20px;background: #0ca;z-index:9999999">输入data-pinyin.txt<textarea class="DataTxt"></textarea></div>');
	top.document.body.appendChild(div);
};

if(!window.CITY_LIST_PINYIN){
	var val=top.document.querySelector(".DataTxt").value;
	if(!val){
		throw new Error("需要输入data-pinyin.txt");
	}else{
		window.CITY_LIST_PINYIN=eval(val+";CITY_LIST_PINYIN");
	};
}else{
	console.log("已读上次进度数据");
};

var pinyinList=CITY_LIST_PINYIN;

//****copy 3_格式化中的数据***
//添加港澳台数据
function add(txt){
	var val=txt.split("|");
	pinyinList.push({
		"id": +val[0],
		"pid": +val[1],
		"deep": +val[2],
		"name": val[3],
		"P2":  val[4],
		
		"ext_id": 0
		,"ext_name": ""
		
		,isExt:true
	});
};
//id|pid|deep|name|pinyin
add("90|0|0|港澳台|~0");
add("91|0|0|海外|~1");

add("9001|90|1|香港|xiang gang");
add("9002|90|1|澳门|ao men");
add("9003|90|1|台湾|tai wan");
add("9101|91|1|海外|hai wai");

add("900101|9001|2|香港|xiang gang");
add("900201|9002|2|澳门|ao men");
add("900301|9003|2|台湾|tai wan");
add("910101|9101|2|海外|hai wai");
//****copy end***


//人工fix数据
var fixNames=function(itm){
	var tag=itm.id+":"+itm.fullPath.join(" ")+"：";
	
	if(/(新区|新城|新城区|实验区|保税区|开发区|管理区|食品区|园区|产业园|名胜区|示范区|镇|管委会|街道办事处)$/.test(itm.name)){
		console.warn(tag+"为空，正则匹配接受");
		return 0;
	};
	
var arr={
	"3712": 0 //"山东省 莱芜市",
	,"371202": {name:"莱芜",code:"370116"} //"山东省 莱芜市 莱城区",
	,"371203": {name:"钢城",code:"370117"} //"山东省 莱芜市 钢城区",
	
	,"4190": 0 //"河南省 省直辖县级行政区划",
	,"4290": 0 //"湖北省 省直辖县级行政区划",
	,"4690": 0 //"海南省 省直辖县级行政区划",
	,"5002": 0 //"重庆市 县",
	,"6590": 0 //"新疆维吾尔自治区 自治区直辖县级行政区划",
	,"232762": 0 //"黑龙江省 大兴安岭地区 松岭区",
	,"232763": 0 //"黑龙江省 大兴安岭地区 新林区",
	,"232764": 0 //"黑龙江省 大兴安岭地区 呼中区",
	,"411471": 0 //"河南省 商丘市 豫东综合物流产业聚集区",
	,"620201": 0 //"甘肃省 嘉峪关市 市辖区",
	,"632857": 0 //"青海省 海西蒙古族藏族自治州 大柴旦行政委员会"
};
	var find=arr[itm.id];
	if(find!=null){
		if(find==0){
			console.warn(tag+"为空，字典匹配接受");
		};
		
		return find;
	};
	
	if(tag.indexOf(":港澳台")+1){
		var code;
		if(itm.name=="港澳台"){
			code=0;
		}else if(itm.name=="香港"){
			code="810000";
		}else if(itm.name=="澳门"){
			code="820000";
		}else if(itm.name=="台湾"){
			code="710000";
		};
		if(code==0){
			console.warn(tag+"为空，接受"+itm.name);
		};
		return code?{name:itm.name,code:code}:code;
	};
	if(tag.indexOf(":海外")+1){
		console.warn(tag+"为空，接受海外");
		return 0;
	};
};
var needReg={};

//准备数据
var idMP={};
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	idMP[o.id]=o;
};
var newList=[];
for(var i=0;i<pinyinList.length;i++){
	var o=pinyinList[i];
	if(o.deep>2){//0 1 2
		continue;
	};
	newList.push(o);
	
	if(o.polygon=="EMPTY"){
		/**代码变更，对未抓取到的重新抓取**/
		/*
		o.polygon="";
		o.geo="";
		*/
	};
	
	var fullPath=[];
	var p=o;
	while(p){
		fullPath.push(p.name);
		p=idMP[p.pid];
	};
	o.fullPath=fullPath.reverse();
};
pinyinList=newList;


function load(itm, next, _try){
	if(GeoStop){
		console.error("已停止");
		return;
	};
	
	var geo="EMPTY";
	var polygon="EMPTY";
	var fullPath=itm.fullPath.join(" ");
	var paths=(itm.id+"0000").substr(0,6);
	_try=_try||0;
	var _tryfixNameCode="";
	if(_try==1){
		paths=itm.name;
	}else if(_try==2){
		paths=fixNames(itm); //使用fix的名称进行查询
		if(paths){
			_tryfixNameCode=paths.code;
			paths=paths.name;
		};
	};
	
	var end=function(){
		itm.geo=geo;
		itm.polygon=polygon;
		next();
	};
	var addNeed=function(isNameNotMatch,isEmptyPaths){
		needReg[itm.id]=fullPath;
		console.error(itm.id+":"+fullPath
			+(isNameNotMatch?
				"：已经fix了但结果未找到"
				:((isEmptyPaths?"：路径为空":"：结果为空")
					+"，且未在empty中注册")
			));
		
		geo="";
		polygon="";
	};
	if(!paths){
		if(paths!==0){
			addNeed(0,1);
		};
		end();
		return;
	};
	
	LogX(loadIdx+"/"+pinyinList.length+fullPath);
	new AMap.DistrictSearch({
		level:itm.deep==0?"province":itm.deep==1?"city":"district"
		,extensions:"all"
		,subdistrict:0
	}).search(paths,function(status,result){
		var match=null;
		var isNameNotMatch=false;
		
		if(status=="error"){
			geo="";
			polygon="";
			console.error(itm.id+":"+fullPath+"：出错",result);
			end();
			return;
		}else if(status=="no_data"){
			//NOOP
		}else{
			var findList=result.districtList;
			for(var fi=0;fi<findList.length;fi++){
				var find=findList[fi];
				
				//对id,名称进行匹配验证
				var testName=_try?paths:itm.name;
				var testCode=itm.deep*2;
				if(find.name.indexOf(testName.substr(0,testName.length==3?2:3))==0
					&& find.adcode.substr(0,testCode)==(_tryfixNameCode||itm.id+"").substr(0,testCode)
				){
					if(match!=null){
						match=0;//重复符合条件项 就是没有匹配项
					}else{
						match=find;
					};
				};
			};
			
			if(match&&!match.boundaries.length){
				match=null;
			};
			if(!match){
				isNameNotMatch=true;
			};
		};
		
		if(!match){
			if(_try<2){
				load(itm, next, _try+1);
				return;
			};
			
			addNeed(1);
		}else{
			geo=match.center.lng+" "+match.center.lat;
			
			polygon=[];
			for(var v in match.boundaries){
				var arr=[];
				var list=match.boundaries[v];
				for(var i = 0; i < list.length; i++){
					var point=list[i];
					arr.push(point.lng+" "+point.lat);
				};
				polygon.push(arr.join(","));
			};
			polygon=polygon.join(";");
		};
		
		end();
	});
};

var threadCount=0;
var loadIdx=0;
function thread(){
	threadCount++;
	var itm=null;
	for(;loadIdx<pinyinList.length;){
		var o=pinyinList[loadIdx];
		loadIdx++;
		
		if(!o.polygon){
			itm=o;
			break;
		};
	};
	if(!itm){
		threadCount--;
		if(threadCount==0){
			if(GeoStop){
				console.error("已停止");
				return;
			};
			GeoStop=true;
			console.log(Object.keys(needReg).length,needReg);
			console.log(JSON.stringify(needReg,null,'\t'));
			
			console.log("==完成== 耗时："+(Date.now()-startTime)+"ms");
			setTimeout(endload);
		};
		return;
	};
	
	var next=function(){
		threadCount--;
		thread();
	};
	
	load(itm, next);
};
var startTime=Date.now();
(function(){
	for(var i=0;i<Load_Thread_Count;i++){
		thread();
	};
})();





function endload(){
	var list=[],lens=[],points=[],blocks=[],blockLens=[];
	for(var i=0;i<pinyinList.length;i++){
		var o=pinyinList[i];
		
		list.push({
			id:o.id
			,ext_path:o.fullPath.join(" ")
			,geo:o.geo
			,polygon:o.polygon
		});
		
		
		var s=(o.polygon||"");
		var blockLen=s.split(";").length;
		var so={len:s.length
			,block:blockLen
			,point:blockLen-1+s.split(" ").length
			,id:o.id
			,path:o.fullPath.join(" ")
		};
		lens.push(so);
		points.push(so);
		blocks.push(so);
		if(blockLen>1)blockLens.push(so);
	};
	window.DATA_GEO=list;
	
	lens.sort(function(a,b){return b.len-a.len});
	points.sort(function(a,b){return b.point-a.point});
	blocks.sort(function(a,b){return b.block-a.block});
	blockLens.sort(function(a,b){return b.len-a.len});
	console.log("polygon长度排名",lens);
	console.log("坐标数排名",points);
	console.log("地块数排名",blocks);
	console.log("多地块polygon长度排名",blockLens);
	

	var url=URL.createObjectURL(
		new Blob([
			new Uint8Array([0xEF,0xBB,0xBF])
			,"var DATA_GEO="
			,JSON.stringify(list,null,"\t")
		]
		,{"type":"text/plain"})
	);
	var downA=document.createElement("A");
	downA.innerHTML="下载查询好坐标的文件";
	downA.href=url;
	downA.download="data_geo.txt";
	document.body.appendChild(downA);
	downA.click();
};