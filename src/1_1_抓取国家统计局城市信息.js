/*
��ȡͳ�ƾ����г�������ԭʼ����

������ҳ��ִ��
http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/

������Ҫ�Ͱ汾chrome����Ȼ������ҳgbk��ʽ����������룬chrome 41û�����룬Chrome 46��汾win10���á����ߴ۸�Content-Type��ӦͷΪContent-Type: text/html; charset=gb2312Ҳ�ɽ���°�Chrome�������⣬���磺FildderScript OnBeforeResponse����ӣ�
```
if (oSession.HostnameIs("www.stats.gov.cn")){
	if(/tjyqhdmhcxhfdm\/\d+/.test(oSession.fullUrl)){
		oSession.oResponse.headers["Content-Type"]="text/html; charset=gb2312";
	}
}
```
*/
(function(){
var Year=2019;
var LoadMaxLevel=4;//�ɼ�����
var SaveName="Step1_1_StatsGov";
var Level={
	1:{n:"ʡ",k:"shen"},
	2:{n:"��",k:"si"},
	3:{n:"��",k:"qu"},
	4:{n:"��",k:"zhen"}
};

window.StopLoad=false;//true�ֶ�ֹͣ���У�"End"��װ�ɼ����
var DATA=window.DATA||[];

var LogAll=true;
var Load_Thread_Count=4;//ģ���߳���
var Load_Max_Try=10;//�������Դ���

var Load_Wait_Child=91;//�˳����¼��б���ץȡ��ϣ��ȴ��Ӽ����ץȡ
var Load_Full_End=92;//�˳��а����¼�ȫ��ץȡ���

if(!window.URL){
	throw new Error("������汾̫��");
};
var loadReqCount=0;
function ajax(url,True,False){
	loadReqCount++;
	var ajax=new XMLHttpRequest();
	ajax.timeout=20000;
	ajax.open("GET",url);
	ajax.onreadystatechange=function(){
		if(ajax.readyState==4){
			if(ajax.status==200){
				True(ajax.responseText);
			}else{
				False();
			}
		}
	}
	ajax.send();
}

function cityClass(name,url,code){
	this.name=name;
	this.url=url;
	this.code=code;
	this.child=[];
	this.load=0;
}
cityClass.prototype={
	getValue:function(){
		var obj={
			name:this.name
			,code:(this.code+"000000000000").substr(0,12)
			,child:[]
		};
		for(var i=0;i<this.child.length;i++){
			obj.child.push(this.child[i].getValue());
		}
		obj.child.sort(function(a,b){
			return a.code.localeCompare(b.code);
		});
		return obj;
	}
}



function load_shen_all(True){
	DATA=[];
	var path="http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/"+Year;
	ajax(path+"/index.html",function(text){
		var reg=/href='(.+?)'>(.+?)<br/ig,match;
		var idx;
		if((idx=text.indexOf("<tr class='provincetr'>"))+1){
			reg.lastIndex=idx;
			while(match=reg.exec(text)){
				var url=match[1];
				if(url.indexOf("//")==-1 && url.indexOf("/")!=0){
					url=path+"/"+url;
				}
				var name=match[2];
				DATA.push(new cityClass(name,url,/(\d+).html/.exec(url)[1]));
			}
			
			True();
		}else{
			console.error("δ����ʡ������");
		}
	},function(){
		console.error("��ȡʡ���б����","������ֹ");
	});
}



var logX=$('<div class="LogX" style="position: fixed;bottom: 80px;right: 100px;padding: 50px;background: #0ca;color: #fff;font-size: 16px;width: 600px;z-index:9999999"></div>');
$("body").append(logX);
var logXn=0;
function LogX(txt){
	logXn++;
	if(LogAll || LoadMaxLevel<4 || logXn%100==0){
		logX.text(txt);
	}
};

function load_x_childs(itm, next){
	var city=itm.obj,levelObj=Level[itm.level],levelNextObj=Level[itm.level+1];
	city.load++;
	if(city.load>Load_Max_Try){
		console.error("��ȡ"+levelObj.n+"["+city.name+"]����"+Load_Max_Try+"��");
		next();
		return;
	};
	
	LogX("��ȡ"+loadReqCount+"��"+getJD()+" ["+city.name+"]"+levelObj.n);
	
	if(!city.url){
		console.warn("��url",city);
		next();
		return;
	};
	ajax(city.url,function(text){
		if(!/ͳ������������<\/td>/.test(text)){//��֤���ĺ�û��Ҫ������֤��
			city.load=Load_Max_Try;
			next();
			return;
		};
		var reg=/class='(citytr|countytr|towntr|villagetr)'.+?<\/tr>/ig;
		var match;
		var mode="";
		var swapItem=null;
		while(match=reg.exec(text)){
			var err=function(msg){
				console.error(msg,city,match[0]);
				city.load=Load_Max_Try;
				
				next();
			};
			!mode&&(mode=match[1]);
			if(mode!=match[1]){
				err("ǰ�����Ͳ�ƥ��");
				return;
			};
			
			//villagetrֱ�ӷǷ�
			var reg2=/class='(citytr|countytr|towntr)'.+?<td>(?:<a href='(.+?)'>)?(.+?)<.+?>([^<>]+)(?:<\/a>)?<\/td><\/tr>/ig;
			var match2;
			if(match2=reg2.exec(match[0])){
				var url=match2[2]||"";
				if(url && url.indexOf("//")==-1 && url.indexOf("/")!=0){
					url=city.url.substring(0,city.url.lastIndexOf("/"))+"/"+url;
				}
				var code=match2[3]||match2[5];
				var name=match2[4]||match2[6];
				
				//��������ϼ�Ϊ�У�Խ��������׷��һ������codeΪ�ϼ�code+00�����ּ��ݣ��磺��ݸ
				if(itm.level==2 && match2[1]=="towntr"){
					if(!swapItem){
						console.log("û��������׷��һ��ͬ���ģ�"+city.name,city);
						var o=new cityClass(city.name,city.url,city.code);
						o.load=Load_Wait_Child;
						city.child.push(o);
						swapItem=o;
					};
				};
				
				if(!url&&name=="��Ͻ��"){
					//NOOP û�����ӵ���Ͻ��ֱ��ȥ��
				}else{
					(swapItem||city).child.push(new cityClass(name,url,code));
				};
			}else{
				err("δ֪ģʽ");
				return;
			};
		};
		
		delete city.url;
		city.load=Load_Wait_Child;
		
		JD[levelNextObj.k+"_count"]+=city.child.length;
		
		next();
	},function(){
		setTimeout(function(){
			load_x_childs(itm, next);
		},1000);
	});
};









var load_end=function(isErr){
	StopLoad="End";
		
	if(isErr){
		console.error("������ֹ", getJD());
		return;
	}
	
	var logTxt="��ɣ�"+(Date.now()-RunLoad.T1)/1000+"��"+getJD();
	console.log(logTxt);
	LogX(logTxt);
	
	var data=[];
	for(var i=0;i<DATA.length;i++){
		data.push(DATA[i].getValue());
	}
	var saveData={};
	window[SaveName]=saveData;
	saveData.year=Year;
	saveData.cityList=data;
	
	var url=URL.createObjectURL(
		new Blob([
			new Uint8Array([0xEF,0xBB,0xBF])
			,"var "+SaveName+"="
			,JSON.stringify(saveData,null,"\t")
		]
		,{"type":"text/plain"})
	);
	var downA=document.createElement("A");
	downA.innerHTML="���ز�ѯ�ó��е��ļ�";
	downA.href=url;
	downA.download=SaveName+".txt";
	logX.append(downA);
	downA.click();
	
	console.log("--���--");
};




var threadCount=0;
function thread(){
	threadCount++;
	var itm=findNext(DATA,1);
	if(!itm||!itm.obj){
		//���ѭ��full����
		findNext(DATA,1);
		findNext(DATA,1);
		findNext(DATA,1);
		findNext(DATA,1);
		
		threadCount--;
		if(threadCount==0){
			load_end(!!itm);
		};
		return;
	};
	
	var next=function(){
		threadCount--;
		thread();
	};
	
	load_x_childs(itm, next);
};
function findNext(childs,level,parent){
	if(level>=LoadMaxLevel){//��������Ҫ���صĲ��
		setFullLoad(parent,level-1);
		return;
	};
	if(StopLoad){
		//��ֹͣ
		if(StopLoad=="End"){
			return;
		};
		
		//�ֶ��ж�����
		return {};
	};
	
	var isFull=true;
	for(var i=0;i<childs.length;i++){
		var itm=childs[i];
		//��������˵�
		if(itm.load==Load_Full_End){
			continue;
		};
		isFull=false;
		
		if(itm.load==Load_Wait_Child){
			//�����¼���û��û�����
			var rtv=findNext(itm.child,level+1,itm);
			if(rtv){
				return rtv;
			};
		}else if(itm.load>Load_Max_Try){
			//���ڼ���ʧ�ܵģ��ж�����
			return {};
		};
		
		//�������
		if(!itm.load){
			return {obj:itm,level:level};
		};
	};
	
	if(isFull&&parent){
		setFullLoad(parent,level-1);
	};
};
function setFullLoad(itm,level){
	if(itm.load==Load_Wait_Child){
		JD[Level[level].k+"_ok"]++;
	};
	itm.load=Load_Full_End;
};
function clearLoadErr(childs){
	for(var i=0;i<childs.length;i++){
		var itm=childs[i];
		itm.load=itm.load>50?itm.load:!itm.url?1:0;
		clearLoadErr(itm.child);
	};
};




function getJD(){
	var str="ʡ:"+JD.shen_ok+"/"+JD.shen_count;
	str+=" ��:"+JD.si_ok+"/"+JD.si_count;
	str+=" ��:"+JD.qu_ok+"/"+JD.qu_count;
	str+=" ��:"+JD.zhen_count;
	return " >>���ȣ�"+str;
};
var JD={
	shen_ok:0
	,shen_count:0
	,si_ok:0
	,si_count:0
	,qu_ok:0
	,qu_count:0
	,zhen_count:0
};
window.RunLoad=function(){
	RunLoad.T1=Date.now();
	
	function start(){
		JD.shen_count=DATA.length;
		
		for(var i=0;i<Load_Thread_Count;i++){
			thread();
		};
	};
	
	
	if(DATA.length){
		console.log("�ָ��ɼ�...");
		clearLoadErr(DATA);
		start();
	}else{
		load_shen_all(start);
	}
	window.DATA=DATA;
}
})();//@ sourceURL=console.js


//����ִ�д���
RunLoad()