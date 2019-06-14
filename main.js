'use strict';

const Hapi = require('hapi');
const {s3gt} = require('./s3gt');

const server = Hapi.server({
    port: 3000,
    host: 'localhost'
});

let ts_text_short = function (text_list, from = 'en', to = 'zh-CN') {
    return new Promise(function (resolve) {
        s3gt.ready(function () {
            s3gt.translate.google_request_text_short({
                lang_from: from,
                lang_to: to,
                text_list: text_list,
                callback: function (data) {
                    resolve(data)
                }
            })
        })
    })
};

let ts_text = function (text, from = 'en', to = 'zh-CN') {
    return new Promise(function (resolve) {
        s3gt.ready(function () {
            s3gt.translate.google_request({
                lang_from: from,
                lang_to: to,
                text: text,
                callback: function (data) {
                    resolve(data.result)
                }
            })
        })
    })
};

let get_tts_urls = function (text, lang = 'en') {
    return new Promise(function (resolve) {
        s3gt.ready(function () {
            let result = s3gt.sound.get_tts_urls(text, lang);
            resolve(result)
        })
    })
};


server.route({
    method: 'GET',
    path: '/',
    handler: async function (request, h) {
        // let res = await ts_text_short(['active', 'able']);
        const {long_text} = require('./test');
        let res = await ts_text(long_text);
        // let res = get_tts_urls(text);
        return res.text
    }
});

const init = async () => {

    await server.start();
    console.log(`Server running at: ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {

    console.log(err);
    process.exit(1);
});

init();
