const {s3gt} = require('./s3gt')

s3gt.prefs = {};
s3gt.prefs.list = {};
s3gt.prefs.is_init = false;
s3gt.prefs.lang_from = 'auto';
s3gt.prefs.lang_to = 'auto';
s3gt.prefs.translate_text_tts_max_length = 150;
s3gt.prefs.lang_to_locale = 'en';

s3gt.prefs.set = function (pref) {
    var pref_hash = {};
    pref_hash[pref.name] = pref.value;
    s3gt.prefs.list[pref.name] = pref.value;
}

s3gt.prefs.get = function (pref_name) {
    return s3gt.prefs.list[pref_name];
}
