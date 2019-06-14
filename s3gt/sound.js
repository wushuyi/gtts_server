const {s3gt} = require('./s3gt')

s3gt.sound = {};

//-------------------------------------------------------------------------------------------
s3gt.sound.get_tts_urls = function (text, lang) {
    var string_limit = s3gt.prefs.translate_text_tts_max_length;
    //-----------------------------------------------------------------------------------
    var myRe = /.+?([\,\.\?\!\:\n]+|$)/g;
    text = text.replace(/\r/g, '');
    var string_list = text.match(myRe);
    if (string_list == null) {
        string_list = [text];
    }

    var string_list_tmp = [];
    for (var string_id = 0; string_id < string_list.length; string_id++) {
        var string = string_list[string_id];
        while (string.length > string_limit) {
            var str_tmp = string.substring(0, string_limit);
            str_tmp = str_tmp.replace(/[\S]+$/, '');
            if (str_tmp.length > 0) {
                string = string.substring(str_tmp.length);
                string_list_tmp.push(str_tmp);
            } else {
                string_list_tmp.push(string.substring(0, string_limit));
                string = string.substring(string_limit);
            }
        }
        string_list_tmp.push(string);
    }

    var audio_list = []
    while (string_list_tmp.length > 0) {
        var string = string_list_tmp.shift();
        string = string.replace(/^\s+|\s+$/g, '');
        if (string == '') {
            continue;
        }

        var url = s3gt.work_data.url_sound_tts_google;
        url = url.replace("LANG", lang);
        url = url.replace("TEXT_LENGTH", string.length);
        url = url.replace("TEXT_REQ", s3gt.utils.urlencode(string));
        url = url.replace(/GOOGLE_TK/g, s3gt.utils.google_value_tk(string));


        audio_list.push(url);
    }

    return audio_list
};
