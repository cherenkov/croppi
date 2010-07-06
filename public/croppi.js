
$(function(){

var api;

init();


function init() {

  $('#cimg').css({width:"300px", height:"280px", "background":"url('dropme" + (1+Math.floor(Math.random()*2)) + ".gif')"})

  $("#inputFile").val("").change(function(e){
    handleFile(this.files[0]);
  });

  window.addEventListener("dragover", dragover, true);
  window.addEventListener("drop", drop, true);

  sliderEvent();
}



function drop(e) {
  var dt = e.dataTransfer;
  var files = dt.files;
  handleFile(files[0]);
  e.preventDefault();
}

function dragover(e) {
  e.preventDefault();
}

function isImageFile(dt) {
  return /^image\//.test(dt.type);
}

function handleFile(dt) {
  if(!isImageFile(dt)) return;

  var reader = new FileReader();
  reader.readAsDataURL(dt);
  reader.onload = function() {
    var dataURI = reader.result;

    loadImage(dataURI, dt.name);
  };
}

function changeTitle(name) {
  if (name.length > 10) name = name.substr(0, 15) + '...'
  $('#description').text(name)
  $('#form_filename').val(name)
}




//ページ読み込み後、一回実行。
function sliderEvent() {

  $("#slider").slider({value:100, min:1}).bind("slide", function(event, ui) {
    var d = $.data($('#cimg')[0], "croppi");
    
    //倍率に応じた画像サイズに変化
    $('#cimg').width(d.width * ui.value * 0.01);
    $("#scale").text(ui.value+"%");

    //倍率を変えた後、垂直方向の中央に
    $('#area').css({"top": ((d.height - $('#cimg').height())*0.5) - d.height});
  
  })
  .bind("slidestart", function(event, ui) {
    api.destroy();

    //水平方向の中央にする
    $('#area').css("left", 0);
  })
  .bind("slidestop", function(event, ui) {
    api = setCrop('#cimg');

    //水平方向の中央にする
    $('#area').css("left", ($('#area').width() - $('#cimg').width()) * 0.5);

    if($('#checkBtn').attr('checked'))
      setCropSize();
  });

}



function loadImage(data, fileName) {

    //dataURIを流し込む前に隠す
    $(document.body).css({"opacity":0});


    //dataURI流し込み完了load時に実行されるように。
    $('#cimg').attr('src', data).one("load",function(e){

      $(this).css("background","");

      //footerへ移動をやめて非表示
      $("#inputFile").css("display","none");

      $("#footer_menu").css("display","block");


      //スライダー初期化
      $('#slider').slider("value", 100);
      $('#scale').text("100%");



      //width,heightを"auto"にした後、画像の元サイズを格納
      $(this).width("auto").height("auto");
      $.data($(this)[0], "croppi", {width: $(this).width(), height: $(this).height()});



      $('#area')
        .css("left",0)//縮小情報の初期化
        .height(0) //slide時にページの高さが伸び縮みするバグ。



      //backと位置合わせ。リサイズしたときにtopが効いてくる
      $('#area').width($(this).width()).css("top", $(this).height()*-1)


      //画像のオリジナルサイズを#backに記録
      $('#back').width($(this).width()).height($(this).height())



      changeTitle(fileName);


      if(api) api.destroy()
      api = setCrop('#cimg');
      
      if($('#checkBtn').attr('checked'))
        setCropSize();



      //設定が済んで表示
      $(document.body).animate({opacity:1});

    }); //load



    //前回cropして保存されたdataURIと選択領域情報の消去
    $('#form_imagedata').val("")
    $.data($('#c1')[0], "croppi", {});



    //bindとスピンボックス化
    $('#inputWidth, #inputHeight').bind('keyup change.spinbox', function(e){
      setTimeout(function(){changeCropSize()},250);
    }).spinbox();



    $('#checkBtn').change(function(){
      if (this.checked)
        setCropSize();
      else {
        api.release();

        //api.release()しても選択領域の情報は残ってるので
        //格納したデータを書き換えて選択のリセットしたことにする
        var d = $.data($('#c1')[0], "croppi");
        $.data($('#c1')[0], "croppi", {x: d.x, y: d.y, w: 0, h: 0});
      }
    });


    $('#cropBtn').click(function(){
      var d = $.data($('#c1')[0], "croppi");

      //選択領域がなかったらsubmitしない。#cropBtnのtypeはbuttonなのでreturnだけでok
      if (!d.w || parseInt(d.w + d.h) == 0) {
        return;
      }

      //canvas描画
      var ctx = $('#c1').get(0).getContext('2d');
      ctx.drawImage($('#cimg').get(0), d.x, d.y, d.w, d.h, 0, 0, d.w, d.h);

      var dataURI = $('#c1').get(0).toDataURL()
      $('#form_imagedata').val(dataURI)
      this.form.submit();
    });

}




function draw(c) {
  var canvas = $('#c1').attr({width: c.w, height:c.h});//cssのwidthとattrのwidthの違いに注意。
  var scale = $('#slider').slider("value");

  var ctx = canvas.get(0).getContext('2d');
  ctx.scale(scale/100, scale/100);

  var x = parseInt(c.x*(100/scale));
  var y = parseInt(c.y*(100/scale));
  var w = parseInt(c.w*(100/scale));
  var h = parseInt(c.h*(100/scale));


  //選択領域情報を格納。
  $.data($('#c1')[0], "croppi", {x: x, y: y, w: w, h: h});

}



function setCropSize() {
  var select = getCropSize();
  if (!select) return;

  var sW = select.width;
  var sH = select.height;
  var cimg = $('#cimg');

  //center position
  var x = (cimg.width() * 0.5) - (sW * 0.5);
  var y = (cimg.height() * 0.5) - (sH * 0.5);
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
  return $.Jcrop(e, { onChange: draw });
}



});



/*
function showCoords(c) {
  // variables can be accessed here as
  // c.x, c.y, c.x2, c.y2, c.w, c.h
  $('#cropStatus').text([c.x, c.y, c.x2, c.y2, c.w, c.h].join());
}
*/

