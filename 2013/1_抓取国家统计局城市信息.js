/*
��ȡ��������http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2013/index.html
*/
(function(){
if(!window.URL){
	throw new Error("������汾̫��");
};
function ajax(url,True,False){
	var ajax=new XMLHttpRequest();
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
function msg(){
	console.log.apply(console, arguments);
}

function cityClass(name,url,code){
	this.name=name;
	this.url=url;
	this.code=code;
	this.child=[];
	this.tryCount=0;
}
cityClass.prototype={
	getValue:function(){
		var obj={name:this.name,code:this.code,child:[]};
		for(var i=0;i<this.child.length;i++){
			obj.child.push(this.child[i].getValue());
		}
		return obj;
	}
}

function load_all(True){
	var path="http://www.stats.gov.cn/tjsj/tjbz/tjyqhdmhcxhfdm/2013";
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
				DATA.push(new cityClass(name,url,0));
			}
			True();
		}else{
			msg("δ����ʡ������");
		}
	},function(){
		msg("��ȡʡ���б����","������ֹ");
	});
}
function load_shen(True, False){
	var city=DATA[JD.shen];
	city.tryCount++;
	if(city.tryCount>3){
		msg("��ȡʡ��["+city.name+"]����3��");
		False();
		return;
	};
	
	function get(){
		msg("��ȡʡ��["+city.name+"]", getJD());
		save();
		
		city.child[JD.si].tryCount=0;
		load_si(function(){
			JD.shen++;
			if(JD.shen>=DATA.length){
				JD.shen=0;
				True();
				return;
			};
			DATA[JD.shen].tryCount=0;
			
			load_shen(True,False);
		},function(){
			False();
		});
	}
	
	if(city.child.length){
		get();
	}else{
		ajax(city.url,function(text){
			var reg=/<tr class='citytr'>.+?href='(.+?)'>(.+?)<.+?'>(.+?)</ig;
			var match;
			while(match=reg.exec(text)){
				var url=match[1];
				if(url.indexOf("//")==-1 && url.indexOf("/")!=0){
					url=city.url.substring(0,city.url.lastIndexOf("/"))+"/"+url;
				}
				var code=match[2];
				var name=match[3];
				city.child.push(new cityClass(name,url,code));
			}
			
			JD.si=0;
			get();
		},function(){
			load_shen(True,False);
		});
	};
}

function load_si(True,False){
	var shen=DATA[JD.shen];
	var city=shen.child[JD.si];
	city.tryCount++;
	if(city.tryCount>3){
		msg("��ȡ����["+city.name+"]����3��");
		False();
		return;
	};
	
	
	function get(){
		msg("___��ȡ����["+city.name+"]", getJD());
		
		city.child[JD.xian].tryCount=0;
		load_xian(function(){
			JD.si++;
			if(JD.si>=shen.child.length){
				JD.si=0;
				True();
				return;
			};
			shen.child[JD.si].tryCount=0;
			
			load_si(True,False);
		},function(){
			False();
		});
	}
	
	if(city.child.length){
		get();
	}else{
		ajax(city.url,function(text){
			var reg=/class='(?:countytr|towntr)'.+?<\/tr>/ig;
			var match;
			while(match=reg.exec(text)){
				var reg2=/class='(?:countytr|towntr)'.+?(?:<td><a href='(.+?)'>(.+?)<.+?'>(.+?)<|<td>(.+?)<.+?<td>(.+?)<)/ig;
				var match2;
				if(match2=reg2.exec(match[0])){
					var url=match2[1]||"";
					if(url.indexOf("//")==-1 && url.indexOf("/")!=0){
						url=city.url.substring(0,city.url.lastIndexOf("/"))+"/"+url;
					}
					var code=match2[2]||match2[4];
					var name=match2[3]||match2[5];
					city.child.push(new cityClass(name,url,code));
				}else{
					msg("δ֪����ģʽ:");
					msg(city.url);
					msg(match[0]);
					throw new Error("end");
				}
			}
			
			JD.xian=0;
			get();
		},function(){
			load_si(True,False);
		});
	};
}

function load_xian(True,False){
	var shen=DATA[JD.shen];
	var si=shen.child[JD.si];
	var city=si.child[JD.xian];
	city.tryCount++;
	if(city.tryCount>3){
		msg("��ȡ�س�["+city.name+"]����3��");
		False();
		return;
	};
	
	function onTrue(){
		JD.xian++;
		if(JD.xian>=si.child.length){
			JD.xian=0;
			True();
			return;
		};
		si.child[JD.xian].tryCount=0;
		load_xian(True,False);
	}
	if(!city.url){
		onTrue();
		return;
	}
	
	ajax(city.url,function(text){
		msg("______��ȡ�س�["+city.name+"]", getJD());
		
		var reg=/class='(?:towntr|villagetr)'.+?<\/tr>/ig;
		var match;
		while(match=reg.exec(text)){
			var reg2=/(?:class='towntr'.+?'>(.+?)<.+?'>(.+?)<|class='villagetr'><td>(.+?)<.+?<td>.+?<td>(.+?)<)/ig;
			var match2;
			if(match2=reg2.exec(match[0])){
				var code=match2[1]||match2[3];
				var name=match2[2]||match2[4];
				city.child.push(new cityClass(name,"",code));
			}else{
				msg("δ֪�س�ģʽ:");
				msg(city.url);
				msg(match[0]);
				throw new Error("end");
			}
		}
		
		onTrue();
	},function(){
		load_xian(True,False);
	});
}

function getJD(){
	var str="ʡ:"+(JD.shen+1)+"/"+DATA.length;
	var shen=DATA[JD.shen];
	if(shen){
		str+=" ��:"+(JD.si+1)+"/"+shen.child.length;
		var si=shen.child[JD.si];
		if(si){
			str+=" ��:"+(JD.xian+1)+"/"+si.child.length;
		}else{
			str+=" ��:"+JD.xian;
		}
	}else{
		str+=" ��:"+JD.si+" ��:"+JD.xian;
	}
	return str;
}
function save(){
	
}

var DATA=[];
var JD;
window.load=function(shen,si,xian){
	JD={
		shen:shen||0
		,si:si||0
		,xian:xian||0
	}
	
	function get(){
		DATA[JD.shen].tryCount=0;
		load_shen(function(){
			save();
			
			var data=[];
			for(var i=0;i<DATA.length;i++){
				data.push(DATA[i].getValue());
			}
			
			var url=URL.createObjectURL(
				new Blob([
					new Uint8Array([0xEF,0xBB,0xBF])
					,"var CITY_LIST="
					,JSON.stringify(data,null,"\t")
				]
				,{"type":"text/plain"})
			);
			var downA=document.createElement("A");
			downA.innerHTML="���ز�ѯ�ó��е��ļ�";
			downA.href=url;
			downA.download="data.txt";
			document.body.appendChild(downA);
			downA.click();
			
			msg("--���--");
		},function(){
			save();
			msg("��ǰ���ȣ�", getJD());
		});
	}
	
	var data=localStorage["load_data"];
	if(data){
		DATA=JSON.parse(data);
		get();
	}else{
		load_all(get);
	}
}
})();//@ sourceURL=console.js