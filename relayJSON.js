(function(){
    var relayJSON = {};
    /* Encode Classes, functions and regularExpresions into an object, in such a way that it is safe for transfer using JSON
     * It also handles recursive objects properly
     *
     * Alternatively parse or stringify directly through relayJSON
     * 
     * Use encode before sending data
     * And use decode after retrieving data  
     */
    const processing = Symbol("processing");
    
    const functionIdentifier = "function";
    const regexIdentifier = "regex";
    const stringIdentifier = "string";
    const objectIdentifier = "object";
    
    const dataOpening = ":[{ ";
    const dataClosing = " }]";
    
    const escapedOpening = dataOpening.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    const escapedClosing = dataClosing.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    
    const functionRegex = new RegExp("^"+functionIdentifier+escapedOpening+"((.|\\n)*)"+escapedClosing+"$");
    const regexRegex = new RegExp("^"+regexIdentifier+escapedOpening+"\\/(.*)\\/(.*)"+escapedClosing+"$");
    const strRegex = new RegExp("^"+stringIdentifier+escapedOpening+"((.|\\n)*)"+escapedClosing+"$");
    const objectRegex = new RegExp("^"+objectIdentifier+escapedOpening+"([0-9]*):(.*)"+escapedClosing+"$");
    
    relayJSON.encode = function(data, path){
        if(!path) path = "";

        if(data instanceof Function){                                   //encode function
            return functionIdentifier+dataOpening+ "_="+(data.toString()) +dataClosing;
        }else if(data instanceof RegExp){                               //encode regular expression
            return regexIdentifier+dataOpening+ (data.toString()) +dataClosing;
        }else if(typeof data=="string"){                                //encode string data
            return stringIdentifier+dataOpening+ data +dataClosing;
        }else if(data instanceof Object && data!=null){                 //convert object, and get rid of recursive structures
            var returnVal = data instanceof Array?[]:{};
            data[processing] = path; //way of handling recursive structures
            
            var keys = Object.keys(data);
            for(var i=0; i<keys.length; i++){
                var key = keys[i];
                if(!data[key] || data[key][processing]===undefined){
                    returnVal[key] = relayJSON.encode(data[key], path+"."+key);; 
                }else                   //handle recursive structures
                    returnVal[key] = objectIdentifier+dataOpening+ path.split(".").length+":"+data[key][processing] +dataClosing;
            }
            
            delete data[processing];
            return returnVal;
        }else{                                                          //return any normal value
            return data;
        }
    };
    relayJSON.stringify = function(data, replacer, space){
        data = relayJSON.encode(data);
        return JSON.stringify(data, replacer, space);
    };
    
    relayJSON.decode = function(data, linkedObj){
        if(typeof data == "string"){
            var m;
            if((m = data.match(strRegex))){
                return m[1];
            }else if((m = data.match(functionRegex))){  //check for a function
                try{
                    //load function or class
                    return eval(m[1]);                    
                }catch(e){
                    console.error(e);
                }
            }else if((m = data.match(regexRegex))){     //check for a regular expression
                return new RegExp(m[1], m[2]);
            }else if((m = data.match(objectRegex))){    //handle recursive object
                var obj = linkedObj;
                //get root object
                for(var i=0; i<Number(m[1]); i++)
                    if(obj && obj[parent])
                        obj = obj[parent];
                
                //get object
                for(var part of m[2].split(".")){
                    if(obj!==undefined && part.length>0)
                        obj = obj[part];
                }
                return obj;
            }else{
                return data;
            }
        }else if(data instanceof Object && data!=null){
            var returnVal = linkedObj || (data instanceof Array? []:{});
            data[processing] = true;
            
            //load all keys
            var keys = Object.keys(data);
            for(var i=0; i<keys.length; i++){
                var key = keys[i];
                if(data[key] == null || !data[key][processing]){                        
                    //link an object, so that the object is already defined when an recursive structure tries to retrieve it
                    returnVal[key] = (data[key] instanceof Array)?[]:{};
                    returnVal[key][parent] = returnVal; //used for recursive structure retrieval 
                    returnVal[key] = relayJSON.decode(data[key], returnVal[key]);
                    
                    //cleanup
                    if(returnVal[key] && returnVal[key][parent])
                        delete returnVal[key][parent];
                }else
                    returnVal[key] = data[key];
            }
            delete data[processing];
            
            return returnVal;
        }else{
            return data;
        }
    };
    relayJSON.parse = function(data, reviver){
        var obj = JSON.parse(data);
        return relayJSON.decode(obj, reviver);
    };
	try{
		window.relayJSON = relayJSON;
	}catch(e){}
	try{
		module.exports = relayJSON;
	}catch(e){}
})();
