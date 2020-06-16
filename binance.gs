/* JAVASCRIPT - gedzy@pm.me */

function isString(str) {
  return typeof str === 'string' || str instanceof String;
}

function isArray(arr)  {
  return (Array.isArray(arr) || arr instanceof Array) && arr.length > 0;
}

function Request() {

  // NO POST or DELETE...

  this.noSign = function() {

    var url = arguments[0];
    var api = arguments[1];
    var query = arguments[2];

    if (!isString(query)) {
      query = '';
    }

    url = url + api + '?' + query;

    var params = {
      muteHttpExceptions: true
    }

    var response = UrlFetchApp.fetch(url, params);

    try {
      if (response.code) {
        Logger.log('API Error: ' + response.msg);
      } else {
        Logger.log('API [' + api + '] was called @ ' + new Date().toLocaleString());
        return response;
      }
    } catch (err) {
      Logger.log(err);
    }

  };

  this.sign = function() {

    var url = arguments[0];
    var api = arguments[1];
    var query = arguments[2];
    var sign = arguments[3];
    
    if (query == null) {
      query = '';
    }

    let scriptProperties = PropertiesService.getScriptProperties();

    if (sign || sign == null) {

      var timestamp = Number(new Date().getTime()).toFixed(0);
      var string = query + '&timestamp=' + timestamp;
      var signature = Utilities.computeHmacSha256Signature(string, scriptProperties.getProperty('API_SECRET'));
      signature = signature.map(function(e) {
        var v = (e < 0 ? e + 256 : e).toString(16);
        return v.length == 1 ? '0' + v : v;
      }).join('');
      var query = '?' + string + '&signature=' + signature;
      var params = {
        'method': 'get',
        'headers': {
          'X-MBX-APIKEY': scriptProperties.getProperty('API_KEY')
        },
        muteHttpExceptions: true
      };

    } else {

      var query = '?' + query;

    }

    var params = {
      'method': 'get',
      'headers': {
        'X-MBX-APIKEY': scriptProperties.getProperty('API_KEY')
      },
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(url + api + query, params);

    try {
      if (response.code) {
        Logger.log('API Error: ' + response.msg);
      } else {
        Logger.log('API [' + api + '] was called @ ' + new Date().toLocaleString());
        return response;
      }
    } catch (err) {
      Logger.log(err);
    }

  }

}

function Binance() {

  this.ping = function() {
    api = new Request();
    return api.noSign('https://api.binance.com', '/api/v3/ping');
  };

  this.time = function() {
    api = new Request();
    return api.noSign('https://api.binance.com', '/api/v3/time');
  };

  this.exchangeInfo = function() {
    api = new Request();
    return api.noSign('https://api.binance.com', '/api/v3/exchangeInfo');
  };

  this.trades = function(a, b, c) {
    api = new Request();
    return api.noSign('https://api.binance.com', '/api/v3/trades', 'symbol=' + a + b + '&limit=' + c);
  };

  this.prices = function() {
    api = new Request();
    return api.noSign('https://api.binance.com', '/api/v3/ticker/price');
  };

  this.depth = function(a, b, c) {
    api = new Request();
    return api.noSign('https://api.binance.com', '/api/v3/depth', 'symbol=' + a + b + '&limit=' + c);
  };

  this.account = function() {
    api = new Request();
    return api.sign('https://api.binance.com', '/api/v3/account');
  };

  this.historicalTrades = function(a, b, c) {
    api = new Request();
    return api.sign('https://api.binance.com', '/api/v3/historicalTrades', 'symbol=' + a + b + '&limit=' + c, false);
  };

  this.aggTrades = function(a, b, c) {
    api = new Request();
    return api.sign('https://api.binance.com', '/api/v3/aggTrades', 'symbol=' + a + b + '&limit=' + c, false);
  };

  this.myTrades = function(a, b) {
    api = new Request();
    return api.sign('https://api.binance.com', '/api/v3/myTrades', 'symbol=' + a + b);
  };

  this.openOrders = function(a, b) {
    api = new Request();
    return api.sign('https://api.binance.com', '/api/v3/openOrders', 'symbol=' + a + b);
  };

  this.allOrders = function(a, b) {
    api = new Request();
    return api.sign('https://api.binance.com', '/api/v3/allOrders', 'symbol=' + a + b);
  };
  
}

function example() {

  // ping, time, exchangeInfo, trades, prices, depth, account, historicalTrades, aggTrades, myTrades, openOders, allOrders 
  binance = new Binance();
  var argName = binance.account();
  Logger.log('Response: ' + argName);

}


function myJSON() {
  
  this.exchange = function(n, b, q) {

    binance = new Binance();
    const data = binance.prices();
    let json = JSON.parse(data);

    let quote = json.filter(function(json) {
      return json.symbol.indexOf(b + q) > -1;
    });

    let base = json.filter(function(json) {
      return json.symbol.endsWith(b) === true;
    });

    if (Array.isArray(quote) && quote.length && Array.isArray(base) && base.length) {

        quote = [quote[0].symbol, quote[0].price];

        let pairs = base.map(d => d.symbol);
        let satoshis = base.map(d => d.price);

        pairs = pairs.filter(e => e !== quote[0]);

        pairs = pairs.map(function(x) {
          let s = x.lastIndexOf(b);
          return x.substring(0, s);
        });

        satoshis = satoshis.filter(e => e !== quote[1]);

        let prices = parseFloat(quote[1]).toFixed(2);
        prices = satoshis.map(function(x) {
          return x * prices;
        });

        satoshis = satoshis.map(a => parseFloat(a).toFixed(8));

        let btc = json.filter(function(json) {
          return json.symbol.indexOf('BTCUSDT') > -1;
        });

        for (let i = 0; i < satoshis.length; i++) {
          if (quote[1] < 2) {
            let x = parseFloat(satoshis[i]) / parseFloat(btc[0].price);
            satoshis[i] = parseFloat(x).toFixed(8);
          } else {
            satoshis[i] = parseFloat(satoshis[i]).toFixed(8);
          }

        }

        let amounts = prices.map(function(x) {
          return n / x;
        })

        amounts = amounts.map(a => parseFloat(a).toFixed(2));
        prices = prices.map(a => parseFloat(a).toFixed(2));

        json = {
          'quote': quote,
          'pairs': pairs,
          'prices': prices,
          'amounts': amounts,
          'satoshis': satoshis
        };
        
        return json;

    } else {

      json = {'msg': 'Could not find ' + b + q + ' base!'};
      return json;

    }

  };

}

function deleteRows(sheet, offset) {
  start = offset;
  if (sheet.getMaxRows() > start) {
    end = sheet.getMaxRows() - start;
    sheet.deleteRows(start, end);
  }
}

function insertRowsAfter(sheet, start, end) {
    sheet.insertRowsAfter(start, end);
}


function main() {
  
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Exchange');
  
  let scriptProperties = PropertiesService.getScriptProperties();
  const b = scriptProperties.getProperty('BALANCE');
  const l = scriptProperties.getProperty('CURRENCY_PAIR_BASE');
  const r =  scriptProperties.getProperty('CURRENCY_PAIR_QUOTE');  
  
  const start = 7
  deleteRows(sheet, start);
  let fill = sheet.getRange("B7:G");
  fill.clearContent();

  binance = new myJSON();
  const json = binance.exchange(b, l, r);
  
  fill = sheet.getRange("B7:G");
  
  if (!json.hasOwnProperty('msg')) {

    sheet.getRange("B3").setValue(json.quote[1]);

    const end = json.pairs.length - 1;
    insertRowsAfter(sheet, start, end);
    
    fill = sheet.getRange("B7:G");
    let values = sheet.getRange("B7:G").getValues();

    fill.clearContent();

    for (let i = 0; i < json.pairs.length; i++) {
  
      values[i][0] = i + 1;
      values[i][1] = json.pairs[i];
      values[i][2] = json.prices[i];
      values[i][4] = json.amounts[i];
      values[i][5] = json.satoshis[i];

    }

    fill.setValues(values);
    
   } else {
     sheet.getRange("B3").setValue(0);
     fill.clearContent();
     throw json.msg;
   }

}

function menuCreate() {

    var ui = SpreadsheetApp.getUi();

    ui.createMenu('Exchange')
      .addItem('Refresh', 'menuRefresh')
      .addSubMenu(ui.createMenu('Settings')
      .addItem('Balance', 'menuBalance')
      .addSubMenu(ui.createMenu('Currency Pair')
      .addItem('Base', 'menuBase')
      .addItem('Quote', 'menuQuote'))
      .addSubMenu(ui.createMenu('API')
      .addItem('Key', 'menuKey')
      .addItem('Secret', 'menuSecret')))
      .addToUi();

}

function menuRefresh() {
  main();
}

function menuBalance() {
  let input = Browser.inputBox('Balance', 'Enter amount:', Browser.Buttons.OK);
  let scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('BALANCE', input);
}

function menuWelcome() {
  let inputA = Browser.inputBox('Binance.com', 'Welcome, here is a custom google script that can put binance exchange information on to a spreadsheet.', Browser.Buttons.OK);
  let inputB = Browser.inputBox('Binance.com', 'In order to get the information, we need your API keys. Please read the source code before trusting!', Browser.Buttons.YES_NO);
  if (inputB == "yes") {
    return true;
  } else {
    return false;
  }
}

function menuBase() {
  let input = Browser.inputBox('Currency Pair (Base)', 'Enter i.e. BTC:', Browser.Buttons.OK);
  let scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('CURRENCY_PAIR_BASE', input);
  
}

function menuQuote() {
  let input = Browser.inputBox('Currency Pair (Quote)', 'i.e. USDT:', Browser.Buttons.OK);
  let scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperty('CURRENCY_PAIR_QUOTE', input);
}

function menuKey() {
  function msg() {
    let input = Browser.inputBox('Enter Key', 'Must be 64 characters long:', Browser.Buttons.OK);
    return input
  }
  let input = msg();
  if (input.length == 64) {
    let scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('API_KEY', input);
  } else {
    msg();
  }
}

function menuSecret() {
   function msg() {
    let input = Browser.inputBox('Enter Secret', 'Must be 64 characters long:', Browser.Buttons.OK);
    return input
  }
  let input = msg();
  if (input.length == 64) {
    let scriptProperties = PropertiesService.getScriptProperties();
    scriptProperties.setProperty('API_KEY', input);
  } else {
    msg();
  }
}

function onOpen() {

    menuCreate();

    let scriptProperties = PropertiesService.getScriptProperties();
    let run = scriptProperties.getProperty('FIRST_RUN');
    
    if (run == null || run == true) {
      
      scriptProperties.setProperty('FIRST_RUN', false);
      scriptProperties.setProperty('BALANCE', 200);
      
      if (menuWelcome() == true) {
          menuKey();
          menuSecret();
          menuBase();
          menuQuote();
      } else {
        throw 'User did not agree, unable to continue with google script!';
      }
    } else {
      main();
    }
    
}
