#!/usr/local/bin/ruby
require 'rubygems'
require 'sinatra'
require 'base64'
require 'kconv'

# reloader
#require 'sinatra/base'
#require 'sinatra/reloader' if development?


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



=begin tmpになっていないの注意
  #imagesディレクトリが無かった場合は作成
  unless test(?d, "public/images") then
    Dir::mkdir("public/images")
  end
=end


  #imagesフォルダに保存
  #public/images
  open("tmp/#{filename}","wb") do |fh|
    fh.write imagedata
  end


=begin
  #?秒後に削除。
  Thread.new do
    sleep(5);
    File.delete("tmp/images/#{filename}")
  end
=end

  #send_fileは内部でhaltするので最後に書く。
  send_file("tmp/#{filename}", :disposition => "attachment")

end


not_found do
  redirect "/"
end
