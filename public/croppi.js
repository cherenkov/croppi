$(function(){

//IE用？
if(!window.addEventListener) return;

var api,
cimg = $('#cimg'),
canvas = $('#canvas'),
area = $('#area'),
footerMenu = $('#footerMenu');

init();


function init() {
  handleEvents();
  apiInterface();
}

function apiInterface() {
  var data = $.parseJSON($('#api_data').text())
  if(data[1] != "")
    loadImage(data[1], decodeURIComponent(data[0]));
}

function drop(e) {
  var dt = e.dataTransfer;

  //dropされたファイル以外は無視
  if(!dt.files.length || !isImageFile(dt.files[0]))
    return e.preventDefault();

  handleFile(dt.files[0]);
  e.preventDefault();
}

function dragover(e) {
  e.preventDefault();
}

function isImageFile(file) {
  return /^image\//.test(file.type);
}

function handleFile(dt) {
  if(!isImageFile(dt))
    return alert("It's not good to eat it.");

  var reader = new FileReader();
  reader.readAsDataURL(dt);
  reader.onload = function() {
    var dataURI = reader.result;
    loadImage(dataURI, dt.name);
  };
}

function changeTitle(name) {
  $('#form_filename').val(name);

  //#title.width:730pxを考慮して20文字
  if (name.length > 20) name = name.substr(0, 20) + '...';
  $('#description').text(name);
}

//ページ読み込み後、一回実行。
function handleEvents() {
  cimg.css({width:"300px", height:"280px", "background":"url('dropme" + (1+Math.floor(Math.random()*2)) + ".gif')"});

  window.addEventListener("dragover", dragover, true);
  window.addEventListener("drop", drop, true);

  $("#inputFile").val("").change(function(e){
    handleFile(this.files[0]);
  });

  $("#slider").slider({value:100, min:1}).bind("slide", function(event, ui) {
    var d = $.data(cimg[0], "croppi");

    //倍率に応じたサイズに。$.width()の四捨五入に合わせてMath.roundを使う。
    var cw = Math.round(d.width * ui.value * 0.01);
    var ch = Math.round(d.height * ui.value * 0.01);

    cimg.width(cw).height(ch);

    $("#scale").text(ui.value+"%");

    //倍率を変えた後、垂直方向の中央に
    area.css({"top": ((d.height - cimg.height())*0.5) - d.height})
      .width(cw); ///slide時にページの高さが伸び縮みする対策
  
  })
  .bind("slidestart", function(event, ui) {
    api.destroy();
  })
  .bind("slidestop", function(event, ui) {
    api = setCrop('#cimg');

    if($('#checkBtn').attr('checked'))
      setCropSize();
  });

  //前回cropして保存されたdataURIと選択領域の消去
  $('#form_imagedata').val("");
  $.data(canvas[0], "croppi", {});

  $('#inputWidth, #inputHeight').bind('keyup change.spinbox', function(e){
    setTimeout(function(){changeCropSize()},250);
  }).spinbox();

  $('#checkBtn').change(function(){
    if (this.checked)
      setCropSize();
    else {
      //api.release()しても選択領域の情報は残ってるので
      //格納したデータを書き換えて選択のリセットとする
      api.release();
      var d = $.data(canvas[0], "croppi");
      $.data(canvas[0], "croppi", {x: d.x, y: d.y, w: 0, h: 0});
    }
  });

  $('#cropBtn').click(function(){
    var d = $.data(canvas[0], "croppi");
    var nowSelect = api.tellSelect();

    //選択領域が無い場合は中止
    if (!d.w || (d.w * d.h) == 0 || (nowSelect.w * nowSelect.h) == 0)
      return;

    var ctx = canvas[0].getContext('2d');
    ctx.drawImage(cimg[0], d.x, d.y, d.w, d.h, 0, 0, d.w, d.h);

    var dataURI = canvas[0].toDataURL();
    $('#form_imagedata').val(dataURI);
    this.form.submit();
  });

  //操作パネルを中央に
  $(window).resize(function(){
    footerMenu.css("left",(window.innerWidth - footerMenu.outerWidth())/2);
  });

  $('#checkBtn').button();
}

function loadImage(data, fileName) {
  $(document.body).css({"opacity":0});

  //dataURI流し込み完了load時に実行されるように。
  cimg.attr('src', data).one("load",function(e){

    $(this).css("background","");

    //footerへ移動をやめて非表示
    $("#inputFile").css("display","none");
    footerMenu.css("display","block");

    //スライダー初期化
    $('#slider').slider("value", 100);
    $('#scale').text("100%");

    //width,heightを"auto"にした後、画像の元サイズを格納
    $(this).width("auto").height("auto");
    $.data($(this)[0], "croppi", {width: $(this).width(), height: $(this).height()});

    //slide時にページの高さが伸び縮みする対策の味付け。
    area.height(footerMenu.outerHeight()+20)
      //backと位置合わせ。リサイズしたときにtopが効いてくる
      .width($(this).width())
      .css("top", -$(this).height());

    //画像のオリジナルサイズを#backに記録
    $('#back').width($(this).width()).height($(this).height());

    //widthが決まるこのタイミングでmarginをセット
    $('#zo').width($('#back').width()).css("margin","0 auto");


    changeTitle(fileName);
    $('#about').hide();

    if(api)
      api.destroy();

    api = setCrop('#cimg');

    if($('#checkBtn').attr('checked'))
      setCropSize();

    //操作パネルを中央へ
    $(window).trigger('resize');

    //設定が済んで表示
    $(document.body).animate({opacity:1});
  });
}

function saveSelectInfo(c) {
  canvas.attr({width: c.w, height:c.h});
  var scale = $('#slider').slider("value");

  var ctx = canvas[0].getContext('2d');
  ctx.scale(scale/100, scale/100);

  var x = Math.round(c.x*(100/scale));
  var y = Math.round(c.y*(100/scale));
  var w = Math.round(c.w*(100/scale));
  var h = Math.round(c.h*(100/scale));

  $.data(canvas[0], "croppi", {x: x, y: y, w: w, h: h});
}

function setCropSize() {
  var select = getCropSize();
  if (!select) return;

  var sW = select.width;
  var sH = select.height;

  //center position
  var x = Math.round((cimg.width() * 0.5) - (sW * 0.5));
  var y = Math.round((cimg.height() * 0.5) - (sH * 0.5));
  var x2 = x + sW;
  var y2 = y + sH;

  api.setSelect([x, y, x2, y2]);
}

function changeCropSize() {
  var select = getCropSize();
  if (!select) return;

  var d = api.tellSelect()
  api.animateTo([d.x, d.y, d.x+select.width, d.y+select.height]);
}

function getCropSize() {
  var w = parseInt($('#inputWidth').val())
  var h = parseInt($('#inputHeight').val())

  if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0)
    return false;
  else
    return { width: w, height: h }
}

function setCrop(e) {
  return $.Jcrop(e, { onChange: saveSelectInfo });
}
});
