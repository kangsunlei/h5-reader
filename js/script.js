(function() {
  var Util = (function() {
    var prefix = 'html5_reader_';
    var StorageGetter = function(key) {
      return localStorage.getItem(prefix + key);
    }
    var StorageSetter = function(key, val) {
      return localStorage.setItem(prefix + key, val);
    }
    var getJSONP = function(url, callback) {
      return $.jsonp({
        url: url,
        cache: true,
        callback: 'duokan_fiction_chapter',
        success: function(result) {
          var data = $.base64.decode(result);
          var json = decodeURIComponent(escape(data));
          callback(json);
        }
      })
    }
    return {
      StorageSetter: StorageSetter,
      StorageGetter: StorageGetter,
      getJSONP: getJSONP
    }
  })();

  window.Util = Util;

  var Dom = {
    top_nav: $('#top-nav'),
    bottom_nav: $('.bottom-nav'),
    font_btn: $('#btn-font'),
    font_container: $('.font-container')
  };
  var Win = $(window);
  var Doc = $(document);
  var readerModel;
  var readerUI;
  var RootContainer = $('#fiction-container');
  var initFontSize = Util.StorageGetter('font_size') ? parseInt(Util.StorageGetter('font_size')) : 14;
  var bgcolor = Util.StorageGetter('bgcolor') ? Util.StorageGetter('bgcolor') : '#e9dfc7';
  var fcolor = Util.StorageGetter('fcolor') ? Util.StorageGetter('fcolor') : '#000';
  var isNight = Util.StorageGetter('is_night') ? Util.StorageGetter('is_night') : false;

  var changeTheme = function(isNight) {
    if (isNight == true) {
      $('#btn-night').attr('data-status', 'n').find('.icon').addClass('icon-day').next('.text').text('白天');
    } else {
      $('#btn-night').attr('data-status', 'd').find('.icon').removeClass('icon-day').next('.text').text('夜间');
    }
  }

  changeTheme(isNight);

  RootContainer.css({
    'font-size': initFontSize,
    'background-color': bgcolor,
    'color': fcolor
  });
  $('.m-button-bar').css('background',bgcolor);

  function main() {
    //todo 整个项目的入口函数
    readerModel = ReaderModel();
    readerUI = ReaderBaseFrame(RootContainer);
    readerModel.init(function(data) {
      readerUI(data);
    });
    EventHandler();
  }

  function ReaderModel() {
    var Chapter_id;
    var ChapterTotal;
    var init = function(UIcallback) {
        getFictionInfo(function() {
          getCurChapterContent(Chapter_id, function(data) {
            UIcallback && UIcallback(data);
          });
        });
      }
      //todo 实现和阅读器相关的数据交互方法
    var getFictionInfo = function(callback) {
      $.get('data/chapter.json', function(data) {
        //todo 获得章节信息之后的回调
        Chapter_id = Util.StorageGetter('chapter_id') ? parseInt(Util.StorageGetter('chapter_id')) : data.chapters[1].chapter_id;
        ChapterTotal = data.chapters.length;
        console.log(ChapterTotal);
        callback && callback(data);
      }, 'json');
    };
    var getCurChapterContent = function(chapter_id, callback) {
      $.get('data/data' + chapter_id + '.json', function(data) {
        if (data.result === 0) {
          var url = data.jsonp;
          Util.getJSONP(url, function(data) {
            callback && callback(data);
          });

        }
      }, 'json')
    };
    var prevChapter = function(UIcallback) {
      Chapter_id = parseInt(Chapter_id, 10);
      if (Chapter_id === 1) {
        return;
      }
      Chapter_id -= 1;
      getCurChapterContent(Chapter_id, UIcallback);
      Util.StorageSetter('chapter_id', Chapter_id);
    };

    var nextChapter = function(UIcallback) {
      Chapter_id = parseInt(Chapter_id, 10);
      if (Chapter_id === ChapterTotal) {
        return;
      }
      Chapter_id += 1;
      getCurChapterContent(Chapter_id, UIcallback);
      Util.StorageSetter('chapter_id', Chapter_id);
    };

    return {
      init: init,
      prevChapter: prevChapter,
      nextChapter: nextChapter
    }
  }

  function ReaderBaseFrame(container) {
    //todo 渲染基本的UI结构
    function parseChapterData(jsonData) {
      var jsonObj = JSON.parse(jsonData);
      var html = '<h4>' + jsonObj.t + '</h4>';
      for (var i = 0; i < jsonObj.p.length; i++) {
        html += '<p>' + jsonObj.p[i] + '</p>';
      }
      return html;
    }

    return function(data) {
      container.html(parseChapterData(data));
    }
  }

  function EventHandler() {
    //todo 交互事件绑定
    $('#action-mid').click(function() {
      if (Dom.top_nav.css('display') === 'none') {
        Dom.top_nav.show();
        Dom.bottom_nav.show();
      } else {
        Dom.top_nav.hide();
        Dom.bottom_nav.hide();
        Dom.font_container.hide();
        Dom.font_btn.find('.icon').removeClass('icon-font-on');
      }
    });

    Dom.font_btn.click(function() {
      if (Dom.font_container.css('display') === 'none') {
        Dom.font_container.show();
        Dom.font_btn.find('.icon').addClass('icon-font-on');
      } else {
        Dom.font_container.hide();
        Dom.font_btn.find('.icon').removeClass('icon-font-on');
      }
    });

    $('#btn-night').click(function() {
      //todo 触发背景切换事件
      if ($(this).attr('data-status') === 'd') {
        $('.bk-container:last-of-type').click();
        $(this).attr('data-status', 'n').find('.icon').addClass('icon-day').next('.text').text('白天');
        isNight = true;
      } else {
        $('.bk-container:first-of-type').click();
        $(this).attr('data-status', 'd').find('.icon').removeClass('icon-day').next('.text').text('夜间');
        isNight = false;
      }
      Util.StorageSetter('is_night', isNight);
      changeTheme(isNight);
    });

    $('#large-font').click(function() {
      if (initFontSize > 20) {
        return;
      }
      initFontSize += 1;
      RootContainer.css('font-size', initFontSize);
      Util.StorageSetter('font_size', initFontSize);
    });

    $('#small-font').click(function() {
      if (initFontSize < 12) {
        return;
      }
      initFontSize -= 1;
      RootContainer.css('font-size', initFontSize);
      Util.StorageSetter('font_size', initFontSize);
    });

    $('.bk-container').click(function() {
      $(this).find('.bk-container-current').show();
      $(this).siblings().find('.bk-container-current').hide();
      bgcolor = $(this).attr('data-color');
      fcolor = $(this).attr('data-font') ? $(this).attr('data-font') : '#000';
      isNight = $(this).attr('data-night') ? true : false;
      Util.StorageSetter('bgcolor', bgcolor);
      Util.StorageSetter('fcolor', fcolor);
      Util.StorageSetter('is_night', isNight);
      RootContainer.css({
        backgroundColor: bgcolor,
        color: fcolor
      });
      $('.m-button-bar').css('background',bgcolor);
      changeTheme(isNight);
    });

    $('.bk-container[data-color="' + bgcolor + '"]').trigger('click');

    Win.scroll(function() {
      Dom.top_nav.hide();
      Dom.bottom_nav.hide();
      Dom.font_container.hide();
      Dom.font_btn.find('.icon').removeClass('icon-font-on');
    });

    $('#prev-button').click(function() {
      readerModel.prevChapter(function(data) {
        readerUI(data);
      })
    });

    $('#next-button').click(function() {
      readerModel.nextChapter(function(data) {
        readerUI(data);
      })
    });
  }

  main();
})();