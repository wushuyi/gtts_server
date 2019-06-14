const {s3gt} = require('./s3gt');

const {got_client: got, got_agentOptions, url_param} = require('../got_extend')
const tunnel = require('tunnel');


s3gt.translate = {};
s3gt.translate.sound_complete_beep = null;
s3gt.translate.id_translate_session = null;

//-------------------------------------------------------------------------------------------
s3gt.translate.google_value_tk = function (text) {
    var res = s3gt.utils.google_value_tk(text);
    return res;
}
//-------------------------------------------------------------------------------------------
s3gt.translate.google_request_text_short = function (data) {
    var url = s3gt.work_data.url_translate_text_short;
    url = url.replace("LANG_FROM", data.lang_from);
    url = url.replace(/LANG_TO/g, data.lang_to);
    url = url.replace(/GOOGLE_TK/g, s3gt.translate.google_value_tk(data.text_list.join('')));

    for (var i = 0; i < data.text_list.length; i++) {
        url += '&q=' + s3gt.utils.urlencode(data.text_list[i]);
    }
    (async () => {
        const resp = await got(url, {
            agent: tunnel.httpsOverHttp(got_agentOptions)
        });

        if (resp.statusCode == 200) {
            try {
                var jrsp = JSON.parse(resp.body);
                if (jrsp) {
                    if (!((typeof jrsp == "object") && (jrsp instanceof Array))) {
                        jrsp = [jrsp];
                    }
                    data.callback(jrsp);
                }
            } catch (e) {
                data.callback(false, e);
            }
        }
    })();
}
//-------------------------------------------------------------------------------------------
s3gt.translate.google_request = function (data) {
    // var is_set_last_lang = true;
    // if (data.is_translate_reverse) {
    //     is_set_last_lang = false;
    // }
    // if (data.only_get_lang_src) {
    //     is_set_last_lang = false;
    // }
    // if (is_set_last_lang) {
    //     s3gt.utils.set_last_lang_from(data.lang_from);
    //     s3gt.utils.set_last_lang_to(data.lang_to);
    // }
    //-----------------------------------------------------------------------------------
    s3gt.translate.id_translate_session = data.id_translate_session;
    //-----------------------------------------------------------------------------------
    var url = s3gt.work_data.url_translate_text;
    url = url.replace("LANG_FROM", data.lang_from);
    url = url.replace(/LANG_TO/g, data.lang_to);
    url = url.replace(/GOOGLE_TK/g, s3gt.translate.google_value_tk(data.text));

    url += s3gt.utils.urlencode(data.text);
    var url_part = url.split('?', 2);

    // var req = new XMLHttpRequest();
    // req.timeout = 10000;
    var text_length = unescape(url_part[1]).length;
    if (text_length > 750) {
        (async () => {
            const resp = await got.post(url_part[0], {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
                agent: tunnel.httpsOverHttp(got_agentOptions),
                body: url_part[1],
            });
            console.log('ok')
            if (resp.statusCode == 200) {
                s3gt.translate.response(resp.body, data);
                // s3gt.google_value_tk_parse(resp.body, callback)
            }
        })();
    } else {
        (async () => {
            const resp = await got.get(url, {
                agent: tunnel.httpsOverHttp(got_agentOptions)
            });
            console.log('ok')
            if (resp.statusCode == 200) {
                s3gt.translate.response(resp.body, data);
            }
        })();
    }

    // req.onreadystatechange = function () {
    //     if (req.readyState == 4) {
    //         s3gt.translate.response(req.responseText, data);
    //     }
    // };
};
//-------------------------------------------------------------------------------------------
s3gt.translate.response = function (jsonResp, data) {
    /*
     {
        "sentences":
            [
                {"trans":"̨󯣱멥\r\n","orig":"Lithuanian","translit":"Litovskie\r\n","src_translit":""},
                {"trans":"- ͠릤ﮱ멩\r\n","orig":"- Macedonian","translit":"- Makedonskii?\r\n","src_translit":""},
                {"trans":"- ͠졩򫩩","orig":"- Malay","translit":"- Malai?skii?","src_translit":""}
            ],
        "src":"en",
        "server_time":100
    }
    */
    var jrsp;
    //-----------------------------------------------------------------------------------
    while (/,,/.test(jsonResp)) {
        jsonResp = jsonResp.replace(/,,/g, ',968523512269854,')
    }
    jsonResp = jsonResp.replace(/\[,/g, '[968523512269854,').replace(/,\]/g, ',968523512269854]');
    jsonResp = jsonResp.replace(/\~\~HEAD\=(p|d)obj/g, '').replace(/\~\~(p|d)obj/g, '').replace(/\~\~number\=plural/g, '');
    //-----------------------------------------------------------------------------------
    data.result = {'is_ok': false, 'jsonResp': jsonResp, 'text': '', 'lang_from': '', 'lang_to': ''};
    //-----------------------------------------------------------------------------------
    try {
        jrsp = JSON.parse(jsonResp);
    } catch (e) {
        if (data.callback) {
            data.result.response_error = s3gt.translate.get_response_error(jsonResp);
            return data.callback(s3gt.utils.clone_object(data));
        }
    }

    //-----------------------------------------------------------------------------------
    if (jrsp) {
        jrsp = s3gt.translate.response_normalize(jrsp);
        if (jrsp.server_time) {
            //------------------------------------------------------------------
            if (jrsp.sentences) {
                data.result.is_ok = true;
                //-----------------------------------------------------------
                data.result.text = jrsp.sentences.trans;
                //-----------------------------------------------------------
                if (jrsp.src) {
                    data.result.detected_lang_from = jrsp.src_2;
                    if (jrsp.src_2 && (data.lang_from == 'auto')) {
                        data.result.lang_from = jrsp.src_2;
                    } else {
                        data.result.lang_from = jrsp.src;
                    }
                }
            }
            //------------------------------------------------------------------
            if (jrsp.transcription) {
                data.result.transcription = jrsp.transcription;
            }
            //------------------------------------------------------------------
            if (jrsp.correct_text) {
                data.result.correct_text = jrsp.correct_text;
            }
            //------------------------------------------------------------------
            data.result.jrsp = jrsp;
        }
    }


    if (!data.result.is_ok) {
        data.result.response_error = s3gt.translate.get_response_error(jsonResp);
    }

    data.callback(s3gt.utils.clone_object(data));
}
//-------------------------------------------------------------------------------------------
s3gt.translate.get_response_error = function (responseText) {
    var google_link = s3gt.protocol_google_translator + s3gt.domain_google_translator;
    var error_text = 'alert.request.error.requst.to.google.server';
    error_text = error_text.replace(/\%TRANSLATE_GOOGLE_DOMAIN\%/i, google_link);
    var found = responseText.match(/<div style\=\"margin\-left: 4em;\"><h1>(.*?)<\/p><\/div>/);
    if (found) {
        error_text = found[1].replace(/<\/h1><p>/, "\n");
    } else if (/action\="CaptchaRedirect"/.test(responseText)) {
        error_text = 'message.captcha.detected_title' + "\n" + s3gt.utils.get_string('message.captcha.detected_text') + ' ' + google_link;
    }
    return error_text;
}
//----------------------------------------------------------------
s3gt.translate.response_normalize = function (jrsp) {
    var res = {};
    var trans_text = '';
    var orig_text = '';
    var transcription_text = '';

    jrsp = s3gt.translate.response_clear_968523512269854(jrsp);

    //-------------------------------------
    // [0]
    //-------------------------------------
    try {
        for (var i = 0; i < jrsp[0].length; i++) {
            var tr = jrsp[0][i];
            if ((tr[0] != '') && (tr[1] != '') && (tr[0] != null) && (tr[1] != null)) {
                trans_text += tr[0];
                orig_text += tr[1];
            }
            // transcription for source text
            else if (tr[3]) {
                transcription_text += tr[3];
            }
            // transcription for translate text
            else if (tr[2]) {
                //	transcription_text += tr[2];
            }
        }
    } catch (e) {
    }

    res.fast_translate = {
        'source': orig_text,
        'translate': trans_text,
        'transcription': transcription_text,
    };

    //-------------------------------------
    // [1]
    //-------------------------------------
    // [2]
    //-------------------------------------
    res.lang_src = jrsp[2];

    //-------------------------------------
    // [5]
    //-------------------------------------
    res.translate = [];
    var trans_text2 = '';
    if (!(jrsp[5] && (typeof jrsp[5] == "object") && (jrsp[5] instanceof Array))) {
        jrsp[5] = [];
    }
    for (var i = 0; i < jrsp[5].length; i++) {
        try {
            var tr = jrsp[5][i];
            if (!tr[3][0]) {
                continue;
            }

            var is_space = false;
            if (tr[2] && (typeof tr[2] == "object") && (tr[2] instanceof Array)) {
                tr[2] = tr[2].sort(function (a, b) {
                    return b[1] - a[1]
                });
                is_space = (/\n\s*$/.test(trans_text2)) ? false : (trans_text2) ? tr[2][0][2] : false;
                trans_text2 += ((is_space && trans_text2) ? ' ' : '') + tr[2][0][0];
            } else {
                tr[2] = null;
                trans_text2 += tr[4];
            }
            res.translate.push({
                'source_text': tr[0],
                'translate_variant': tr[2],
                'translate_variant2': tr[4],
                'pos_source_start': tr[3][0][0],
                'pos_source_end': tr[3][0][1],
                'is_space': is_space
            });
        } catch (e) {
        }
    }
    res.fast_translate.translate = (trans_text2 != '') ? trans_text2 : trans_text;
    //-------------------------------------
    // [7]
    //-------------------------------------
    if (jrsp[7] && (typeof jrsp[7] == "object") && (jrsp[7] instanceof Array)) {
        res.correct_text = jrsp[7][1];
    }
    //-------------------------------------
    // [8]
    //-------------------------------------
    if (jrsp[8] && (typeof jrsp[8] == "object") && (jrsp[8] instanceof Array)) {
        var lang = jrsp[8][0];
        if (lang && (typeof lang == "object") && (lang instanceof Array)) {
            if (lang.length == 1) {
                res.lang_src_2 = lang[0];
            }
        }
    }

    //-------------------------------------------------------------------------------------
    var result = {
        "sentences": {"trans": res.fast_translate.translate, "orig": res.fast_translate.source},
        "src": res.lang_src,
        "src_2": res.lang_src_2,
        "server_time": 99999,
        "translate_object": res,
        "correct_text": res.correct_text,
        "transcription": res.fast_translate.transcription,
        "translate_list": res.translate
    };

    return result;
}
//-------------------------------------------------------------------------------------------
s3gt.translate.response_clear_968523512269854 = function (ary) {
    if (ary && (ary instanceof Array)) {
        for (var i = 0; i < ary.length; i++) {
            ary[i] = s3gt.translate.response_clear_968523512269854(ary[i]);
        }
    } else if (ary == '968523512269854') {
        ary = '';
    } else if (/968523512269854/.test(ary)) {
        try {
            ary = ary.replace(/968523512269854/g, '');
        } catch (e) {
        }
    }
    return ary;
}
