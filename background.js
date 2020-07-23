(function(undefined) {
  "use strict";

　// ルートとなるコンテキストメニューを作っておく

  var id = chrome.contextMenus.create({
    "title": "bookmark"
  });

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