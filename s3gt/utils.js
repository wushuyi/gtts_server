const {s3gt} = require('./s3gt')
s3gt.utils = {};




s3gt.utils.prefs_get = function (pref_name, default_value) {
    var pref_value = s3gt.prefs.get(pref_name);
    if (pref_value === undefined) {
        return default_value;
    }
    try {
        return s3gt.utils.clone_object(pref_value);
    } catch (e) {
        return pref_value;
    }
}
//------------------------------------------------------------------------------
s3gt.utils.prefs_set = function (pref_name, pref_value) {
    s3gt.prefs.set({'name': pref_name, 'value': pref_value});
    return true;
}
//------------------------------------------------------------------------------
s3gt.utils.clone_object = function(object) {
    return JSON.parse(JSON.stringify(object));
}
//------------------------------------------------------------------------------
s3gt.utils.google_value_tk = function(text) {
    // view-source:https://translate.google.com/translate/releases/twsfe_w_20151214_RC03/r/js/desktop_module_main.js && TKK from HTML
    var uM = s3gt.work_data.google_value_tk || s3gt.utils.prefs_get('google_value_tk') || null;
    var cb="&";
    var k="";
    var Gf="=";
    var Vb="+-a^+6";
    var t="a";
    var Yb="+";
    var Zb="+-3^+b+-f";
    var jd=".";
    var sM=function(a){return function(){return a}}
    var tM=function(a,b){for(var c=0;c<b.length-2;c+=3){var d=b.charAt(c+2),d=d>=t?d.charCodeAt(0)-87:Number(d),d=b.charAt(c+1)==Yb?a>>>d:a<<d;a=b.charAt(c)==Yb?a+d&4294967295:a^d}return a};
    var vM=function(a){
        var b;
        if(null!==uM) {
            b=uM;
        }else{
            b=sM(String.fromCharCode(84));var c=sM(String.fromCharCode(75));b=[b(),b()];
            b[1]=c();
            b=(uM=window[b.join(c())]||k)||k
        }
        var d=sM(String.fromCharCode(116)),c=sM(String.fromCharCode(107)),d=[d(),d()];
        d[1]=c();
        c=cb+d.join(k)+Gf;
        d=b.split(jd);
        b=Number(d[0])||0;

        for(var e=[],f=0,g=0;g<a.length;g++){
            var m=a.charCodeAt(g);
            128>m?e[f++]=m:(2048>m?e[f++]=m>>6|192:(55296==(m&64512)&&g+1<a.length&&56320==(a.charCodeAt(g+1)&64512)?(m=65536+((m&1023)<<10)+(a.charCodeAt(++g)&1023),e[f++]=m>>18|240,e[f++]=m>>12&63|128):e[f++]=m>>12|224,e[f++]=m>>6&63|128),e[f++]=m&63|128)
        }
        a=b||0;
        for(f=0;f<e.length;f++) { a+=e[f],a=tM(a,Vb)};
        a=tM(a,Zb);
        a^=Number(d[1])||0;
        0>a&&(a=(a&2147483647)+2147483648);
        a%=1E6;
//		return c+(a.toString()+jd+(a^b))
        return a.toString()+jd+(a^b);
    };

    s3gt.work_data.google_value_tk = uM;
    return vM(text);
}
//------------------------------------------------------------------------------
s3gt.utils.urlencode = function(str) {
    str = (str + '').toString();
    return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
}
