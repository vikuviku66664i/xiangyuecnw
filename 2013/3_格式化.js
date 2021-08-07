/*
��ʽ��
����data_pinyin.txt
*/
(function(){
	var csv=[];
	var id=10000;
	var replaceList=[
		{name:"�ֵ����´�$",pinyin:" ?jie dao ban shi chu$",prefix:"jdbsc$"}
		,{name:"�������´�$",pinyin:" ?di qv ban shi chu$",prefix:"dqbsc$"}
		,{name:"�ֵ�������´�$",pinyin:" ?jie dao ju min ban shi chu$",prefix:"jdjmbsc$"}
		,{name:"������´�$",pinyin:" ?ju min ban shi chu$",prefix:"jmbsc$"}
		,{name:"���´�$",pinyin:" ?ban shi chu$",prefix:"bsc$"}
		,{name:"����$",pinyin:" ?guan li chu$",prefix:"glc$"}
		,{name:"��ί��$",pinyin:" ?guan wei hui$",prefix:"gwh$"}
		,{name:"����ίԱ��$",pinyin:" ?guan li wei yuan hui$",prefix:"glwyh$"}
		,{name:"�ֵ�$",pinyin:" ?jie dao$",prefix:"jd$"}
		,{name:"��������ίԱ��$",pinyin:" ?she qv ju min wei yuan hui$",prefix:"sqjmwyh$"}
		,{name:"����ίԱ��$",pinyin:" ?cun min wei yuan hui$",prefix:"cmwyh$"}
		,{name:"����ίԱ��$",pinyin:" ?ju min wei yuan hui$",prefix:"jmwyh$"}
		,{name:"������������$",pinyin:" ?she qv fu wu zhong xin$",prefix:"sqfwzx$"}
		,{name:"������������$",pinyin:" ?gong gong fu wu zhong xin$",prefix:"ggfwzx$"}
	];
	
	var replaceNameStr="",replacePinyinStr="",replacePrefixStr="";
	for(var i=0;i<replaceList.length;i++){
		replaceNameStr+=(replaceNameStr?"|":"")+replaceList[i].name;
		replacePinyinStr+=(replacePinyinStr?"|":"")+replaceList[i].pinyin;
		replacePrefixStr+=(replacePrefixStr?"|":"")+replaceList[i].prefix;
	}
	var replaceNameReg=new RegExp(replaceNameStr,"i")
	,replacePinyinReg=new RegExp(replacePinyinStr,"i")
	,replacePrefixReg=new RegExp(replacePrefixStr,"i")
	
	,replaceAllReg=/��.+?��/ig;
	
	function useReplace(name){
		replaceAllReg.lastIndex=0;
		
		return replaceAllReg.test(name)||replaceNameReg.test(name);
	}
	function replaceName(name){
		replaceAllReg.lastIndex=0;
		name=name.replace(replaceAllReg,"");
		return name.replace(replaceNameReg,"");
	}
	function replacePinyin(pinyin){
		replaceAllReg.lastIndex=0;
		pinyin=pinyin.replace(replaceAllReg,"");
		return pinyin.replace(replacePinyinReg,"");
	}
	function replacePrefix(prefix){
		replaceAllReg.lastIndex=0;
		prefix=prefix.replace(replaceAllReg,"");
		return prefix.replace(replacePrefixReg,"");
	}
	function read(idx,pid,pname,list){
		for(var i=0;i<list.length;i++){
			var city=list[i];
			var str="";
			
			var usereplace=useReplace(city.name);
			var name=usereplace?replaceName(city.name):city.name;
			var prefix=usereplace?replacePrefix(city.prefix):city.prefix;
			
			str+=id;
			str+=",";
			str+=pid;
			str+=",";
			str+=idx;
			str+=",";
			str+=0;
			str+=",'";
			str+=name;
			str+="','";
			str+=prefix?prefix:city.prefix;
			str+="','";
			str+=usereplace?replacePinyin(city.pinyin):city.pinyin;
			str+="','";
			str+=city.code;
			str+="','";
			str+=city.name;
			str+="','";
			str+=pname;
			str+="'";
			
			if(name){
				id++;
				csv.push(str);
				read(idx+1, id-1, pname+(pname?" - ":"")+city.name, city.child);
			}
		}
	}
	read(0,0,"",CITY_LIST);
	
	var url=URL.createObjectURL(
		new Blob([new Uint8Array([0xEF,0xBB,0xBF]),csv.join("\n")]
		,{"type":"text/plain"})
	);
	var downA=document.createElement("A");
	downA.innerHTML="���ظ�ʽ���õ��ļ�";
	downA.href=url;
	downA.download="ok_data.csv";
	document.body.appendChild(downA);
	downA.click();
})()//@ sourceURL=console.js