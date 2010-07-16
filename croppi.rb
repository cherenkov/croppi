#!/usr/local/bin/ruby
require 'rubygems'
require 'sinatra'
require 'base64'
require 'kconv'

# reloader
#require 'sinatra/base'
#require 'sinatra/reloader' if development?

get '/' do
  erb :index
end

post '/' do
  #適当なチェック
  unless params[:imagedata] && params[:filename]
    redirect "/"
  end

  #dataURIをバイナリに変換
  imagedata = Base64.decode64(params[:imagedata].gsub(/^data:image\/png;base64,/, ""))

  #拡張子を除いたファイル名取得し、_c.pngを付け足す。日本語ファイル名文字化け対策にtosjis。
  filename = (File.basename(params[:filename], ".*") + "_c.png").tosjis


  #tmp/imagesフォルダに保存
  open("tmp/#{filename}","wb") do |fh|
    fh.write imagedata
  end

  #?秒後に削除。
  Thread.new do
    sleep(5);
    File.delete("tmp/#{filename}")
  end

  #send_fileは内部でhaltするので最後に書く。
  send_file("tmp/#{filename}", :disposition => "attachment")
end
