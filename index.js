var http = require('http');
var querystring = require('querystring');
var crypto = require('crypto');
var fs = require('fs');

var server = http.createServer(function(req, res) {
  var htmlHeader = fs.readFileSync('./public/htmlHeader');
  var htmlMainForm = fs.readFileSync('./public/htmlMainForm');
  var htmlFooter = fs.readFileSync('./public/htmlFooter');

  // req.urlが / 以外は404エラーを返す
  if (req.url != '/') {
    send404(res);
    return;
  }

  // POST以外のリクエストの場合、メインフォームを送信する
  if (req.method != 'POST') {
    sendHTML(res, htmlHeader, htmlMainForm, htmlFooter);
    return;
  }

  // POSTだったら
  if (req.method == 'POST') {
    // 送信されたデータを取得する
    req.data = '';
    req.on('data', function(chunk) {
      req.data += chunk;
    });

    req.on('end', function() {
      var query = querystring.parse(req.data)
      var result = getFortune(getFortuneKey(query));
      var resultStr = '<div><p>' 
        + escapeHtmlSpecialChar(query.year) 
        + '年' + escapeHtmlSpecialChar(query.month) 
        + '月' + escapeHtmlSpecialChar(query.day) 
        + '日生まれの' + escapeHtmlSpecialChar(query.name) 
        + 'さん（' + ((query.sex == 'male') ? '男性' : '女性') 
        + '）の運勢は……' + '<span class="result">' 
        + result + '</span>' + 'です。</p></div>' + '<a href="/">トップに戻る</a>';

      sendHTML(res, htmlHeader, resultStr, htmlFooter);
    });
    return;
  }

}).listen(8000, '127.0.0.1');


function send404(res) {
  res.writeHead(404, {
    'Content-Type': 'text/plain'
  });
  res.end('Error 404: Not Found.');
}

function sendHTML(res, header, body, footer) {
  res.writeHead(200, {
    'Content-Type': 'text/html; charset=UTF-8'
  });
  res.write(header);
  res.write(body);
  res.write(footer);
  res.end();
}

function getFortuneKey(q) {
  // 取得したデータをすべて連結してMD5ハッシュを計算する
  var seed = q.name + q.year + q.month + q.day + q.sex;
  var hash = crypto.createHash('md5')
    .update(seed)
    .digest('hex')
    .slice(0, 2);
  // 整数に変換する
  return Number('0x' + hash);
}

function getFortune(key) {
// 数値(0x00 - 0xFF)に応じて返す
  if (key < 10) {
    return  '大凶';
  } else if (key < 50) {
    return '凶';
  } else if (key < 100) {
    return '末吉';
  } else if (key < 150) {
    return '吉';
  } else if (key < 245) {
    return '中吉';
  } else {
    return '大吉';
  }
}

function escapeHtmlSpecialChar(html) {
// 「<」や「>」、「&」といった文字列をエンティティに変換する
  if (html === undefined) return '';

  html = html.replace(/&/g, '&amp;');
  html = html.replace(/</g, '&lt;');
  html = html.replace(/>/g, '&gt;');
  return html;

};
