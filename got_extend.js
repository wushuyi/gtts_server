const got = require('got');
const iconv = require('iconv-lite');

const client = got.extend({
    timeout: 10 * 1000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Safari/537.36'
    },
});

const agentOptions = {
    proxy: {
        host: 'localhost',
        port: '1080'
    }
}

// use: gotOptions
// responseType: 'buffer',
// encoding: null,
const encoding = function (resp, enc = '') {
    const checkEncoding = enc => {
        // check iconv supported encoding
        if (enc && !iconv.encodingExists(enc)) {
            return new Error('encoding not supported by iconv-lite')
        }
    }
    let buf = resp.body;
    let text = '';
    if (!enc) {
        if (resp.headers['content-type']) {
            // Extracted from headers
            enc = (resp.headers['content-type'].match(/charset=(.+)/) || []).pop()
        }

        if (!enc) {
            // Extracted from <meta charset="gb2312"> or <meta http-equiv=Content-Type content="text/html;charset=gb2312">
            enc = (buf.toString().match(/<meta.+?charset=['"]?([^"']+)/i) || []).pop()
        }
        if (!enc) {
            // Default utf8
            enc = 'utf-8'
        }
    }
    // check
    let err = checkEncoding(enc)

    try {
        text = iconv.decode(buf, enc)
    } catch (e) {
        /* istanbul ignore next */
        err = e

    } finally {
        resp.body = text
    }
    return {text, err}
};


exports.got_client = client;
exports.got_agentOptions = agentOptions;
exports.encoding = encoding;
