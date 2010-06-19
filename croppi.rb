#!/usr/local/bin/ruby
require 'rubygems'
require 'sinatra'
require 'base64'
require 'kconv'

# reloader
require 'sinatra/base'
require 'sinatra/reloader' if development?


get '/' do
  #htmlファイルを拡張子だけerbに変えてviewsフォルダに入れ以下のようにするとindex表示できる。
  erb :index
  #redirect "index.html"
end



post '/' do

  #dataURIをバイナリに変換
  imagedata = Base64.decode64(params[:imagedata].gsub(/^data:image\/png;base64,/, ""))

  #拡張子を除いたファイル名取得し、_c.pngを付け足す。日本語ファイル名文字化け対策にtosjis。
  filename = (File.basename(params[:filename], ".*") + "_c.png").tosjis

  #適当なチェック
  unless imagedata && filename
    redirect "/"
  end



=begin
  #imagesディレクトリが無かった場合は作成
  unless test(?d, "public/images") then
    Dir::mkdir("public/images")
  end
=end


  #imagesフォルダに保存
  open("public/images/#{filename}","wb") do |fh|
    fh.write imagedata
  end


  #?秒後に削除。
  Thread.new do
    sleep(5);
    File.delete("public/images/#{filename}")
  end


  #send_fileは内部でhaltするので最後に書く。
  send_file("public/images/#{filename}", :disposition => "attachment")

end


not_found do
  redirect "/"
end
