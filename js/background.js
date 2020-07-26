(function(undefined) {
  "use strict";

　// ルートとなるコンテキストメニューを作っておく

  var id = chrome.contextMenus.create({
    "title": "bookmark"
  });

  var local = chrome.storage.local;
  var syncs = chrome.storage.sync;

	var setStorage = function(key,val){
		local.set({key: JSON.stringify(val)});
	};

  // param array
  var getStorage = function(keys){
    local.get(keys, function(obj){
      return JSON.parse(obj);
    });
  };


  // local.get(["key1", "key2", "key3"], function (value) {
  //   var value_data_1 = value.key1;
  //   var value_data_2 = value.key2;
  //   var value_data_3 = value.key3;
  // });
　

  // タブを開いたときに
  var url;

  // タブ切り替えた時
  chrome.tabs.onActivated.addListener(function(tabId) {
    console.log('切り替えた');
    createURL();
  });
  // タブ読み込み時
  chrome.tabs.onUpdated.addListener(function(tabId, opt) {    
      console.log('タブ読み込み');
      createURL();
  });
  // タブ作成時
  chrome.tabs.onCreated.addListener(function(tab){

    console.log('タブ作成時');
      createURL();
  });
  // 右上のアイコン押下時
  chrome.browserAction.onClicked.addListener(function(){
      window.open('http://b.hatena.ne.jp/entry/' + url);
  });


  function createURL(){
    chrome.browserAction.setBadgeBackgroundColor({color: "red"});
    // 今開いてるタブの情報を取得
    chrome.tabs.query({"active": true, "currentWindow": true}, function(tabs){
        // はてブ数チェック
        // $.get("http://api.b.st-hatena.com/entry.count?url=" + tabs[0].url, function(count){
        //     // カウント数をバッジにセット
        //     chrome.browserAction.setBadgeText({text:count});
        // });

        // "http://"を削除、"https://"の時は"s/"に置換
        url = tabs[0].url.replace(/^(http:\/\/)/,"");
        // local.set({'urls': url}, function () {
        // });
        
        if(url === tabs[0].url){
            url = url.replace(/^(https:\/\/)/,"s/");
        }
        URLsaveChanges(url);
    });
  }

  function URLsaveChanges(url) {
    var map, count;
    local.get(['urls', 'count'], function(result){
      console.log(`urls: ${result.urls} count: ${result.count}`);
      //urls = isValidJson(r.urls) ? JSON.parse(r.urls) : [];
      console.log(`r.urls: ${result.urls}`);
      map = result.urls ? JSON.parse(result.urls) : {};

      // オブジェクトを配列変換: if (map instanceof Object) {map = Object.keys(map).map(function (key) {return map[key]})} 
      if (typeof map[url] == 'object') {
        map[url].count++;
      } else {
        map[url] = {'count' : 1};
      }
      map[url].updated = new Date();
      // TODO: map[url].activeTime
      //map[url].count = (map[url].count +1) || 1;
      count = result.count? parseInt(result.count): 0;
      count++; 
      local.set({'urls': JSON.stringify(map),'count': count}, function() {
        
      });
    });
  }

  // ブックマークのデータ構造を取得する

  chrome.bookmarks.getTree(function(results) {
    results.forEach(function(result) {
      if ("children" in result) {
        result.children.forEach(function(bookmark) {
          registerBookmarkMenu(bookmark, id);
        });
      }
    });
  });

  function registerBookmarkMenu(bookmark, menuId) {
    // ブックマーク項目がディレクトリ(フォルダ)であるかをチェック

    if ("children" in bookmark) {
      // ディレクトリ(フォルダ)はあるけど中身が無いのは無視

      if (bookmark.children.length > 0) {

        // 元のコンテキストメニューIDを親として新しくコンテキストメニューを作る

        var id = chrome.contextMenus.create({
          "title": bookmark.title,
          "parentId": menuId
        });

        // ディレクトリ(フォルダ)内のブックマークを列挙して再度同等の処理を行う

        bookmark.children.forEach(function(subBookmark) {
          registerBookmarkMenu(subBookmark, id);
        });
      }
    } else {
      // ブックマークによってはタイトルが無いのもある(アイコン表示のみ)ので、そういう場合はURLを表示する

      var title = bookmark.title.length > 0 ? bookmark.title : bookmark.url;


      // 元のコンテキストメニューIDを親として新しくコンテキストメニューを作る

      chrome.contextMenus.create({
        "title": title,
        "parentId": menuId,
        "onclick": function(info, tab) {

          // コンテキストメニューからブックマークが選択(クリック)されたら新しいタブでフォーカスせずに開く

          chrome.tabs.create({
            "url": bookmark.url,
            "selected": false
          });
        }
      });
    }
  }
})();