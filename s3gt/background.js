const {s3gt} = require('./s3gt')
const {got_client: got, got_agentOptions} = require('../got_extend')
const tunnel = require('tunnel');

s3gt.work_data = {};
s3gt.protocol_google_translator = 'https://';
s3gt.domain_google_translator = 'translate.google.com';
//-----------------------------------------------------------------------------------
s3gt.ready = function (callback) {
    s3gt.init_urls()
    var tk = s3gt.work_data.google_value_tk || s3gt.utils.prefs_get('google_value_tk') || null;
    if (tk && callback) {
        callback(tk)
    } else {
        s3gt.google_value_tk_load(callback);
    }
};
//-----------------------------------------------------------------------------------
s3gt.init_urls = function (callback, init_tk) {
    s3gt.work_data.protocol_google_translator = s3gt.protocol_google_translator;
    s3gt.work_data.domain_google_translator = s3gt.domain_google_translator;
    s3gt.work_data.url_translate_text = s3gt.protocol_google_translator + s3gt.domain_google_translator + '/translate_a/single?client=t&sl=LANG_FROM&tl=LANG_TO&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=at&ie=UTF-8&oe=UTF-8&otf=2&srcrom=1&ssel=0&tsel=0&kc=1&tk=GOOGLE_TK&q=';
    s3gt.work_data.url_translate_text_short = s3gt.protocol_google_translator + s3gt.domain_google_translator + '/translate_a/t?client=mt&sl=LANG_FROM&tl=LANG_TO&v=1.0&source=baf&tk=GOOGLE_TK';
    s3gt.work_data.url_google_site_off = s3gt.protocol_google_translator + s3gt.domain_google_translator + '/#LANG_FROM/LANG_TO/';
    s3gt.work_data.url_google_site = s3gt.protocol_google_translator + s3gt.domain_google_translator + '/';
    s3gt.work_data.url_google_site_text = s3gt.protocol_google_translator + s3gt.domain_google_translator + '/#LANG_FROM/LANG_TO/';
    s3gt.work_data.url_sound_tts_google = s3gt.protocol_google_translator + s3gt.domain_google_translator + '/translate_tts?ie=UTF-8&q=TEXT_REQ&tl=LANG&total=1&idx=0&textlen=TEXT_LENGTH&tk=GOOGLE_TK&client=webapp&prev=input';
    s3gt.work_data.url_translate_page = s3gt.domain_google_translator + '/translate_a/element.js?cb=googleTranslateElementInit&hl=LANG_TO';
    s3gt.work_data.url_translate_page_google_site = s3gt.protocol_google_translator + s3gt.domain_google_translator + '/translate?sl=LANG_FROM&tl=LANG_TO&js=y&u=URL';

    if (init_tk) {
        s3gt.google_value_tk_init();
    }
    if (callback) {
        callback();
    }
}
//-----------------------------------------------------------------------------------
s3gt.google_value_tk_load = function (callback) {
    var url = s3gt.protocol_google_translator + s3gt.domain_google_translator;
    (async () => {
        const resp = await got.get(url, {
            agent: tunnel.httpsOverHttp(got_agentOptions)
        });
        if (resp.statusCode == 200) {
            s3gt.google_value_tk_parse(resp.body, callback)
        }
    })();
}
//-----------------------------------------------------------------------------------
s3gt.google_value_tk_parse = function (responseText, callback) {
    //-----------------------------------------------------------------------------
    // verson 1
    // TKK=eval('((function(){var a\x3d4264492758;var b\x3d-1857761911;return 406375+\x27.\x27+(a+b)})())');
    //-----------------------------------------------------------------------------
    // verson 2
    // TKK='427233.3134777927';
    //-----------------------------------------------------------------------------
    var res = /;TKK=(.*?\'\));/i.exec(responseText);
    //-----------------------------------------------------------------------------
    if (res == null) {
        //-----------------------------------------------------------------------
        // version 3
        //-----------------------------------------------------------------------
        res = /\,tkk\:(\'.*?\')/i.exec(responseText);
    }
    //-----------------------------------------------------------------------------
    if (res != null) {
        //-----------------------------------------------------------------------
        // verson 2
        //-----------------------------------------------------------------------
        if (/^\'\d+\.\d+/.test(res[1])) {
            var res2 = /^\'(\d+\.\d+)/i.exec(res[1]);
            if (res2 != null) {
                var tkk = res2[1];
                s3gt.utils.prefs_set('google_value_tk', tkk);
                s3gt.work_data.google_value_tk = tkk;
                if (callback) {
                    callback(s3gt.work_data.google_value_tk);
                }
            }
        }
        //-----------------------------------------------------------------------
        // verson 1
        //-----------------------------------------------------------------------
        else {
            var res2 = /var a=(.*?);.*?var b=(.*?);.*?return (\d+)/i.exec(res[1].replace(/\\x3d/g, '='));
            if (res2 != null) {
                var tkk = Number(res2[3]) + '.' + (Number(res2[1]) + Number(res2[2]));
                s3gt.utils.prefs_set('google_value_tk', tkk);
                s3gt.work_data.google_value_tk = tkk;
                if (callback) {
                    callback(s3gt.work_data.google_value_tk);
                }
            }
        }
    }
}

