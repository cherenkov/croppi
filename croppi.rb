#!/usr/local/bin/ruby
require 'rubygems'
require 'sinatra'
require 'base64'
require 'kconv'
require 'net/http'
require 'uri'

#require 'sinatra/base'
#require 'sinatra/reloader' if development?


before do
  if request.path_info == '/' && params[:url] then
    uri = URI.parse(URI.encode(params[:url]))
    begin
      Net::HTTP.start(uri.host) {|http|
        res = http.request_get(uri.path)
        redirect "/" unless res['content-type'].include?("image/")

        @api_dataURL = "data:" + res['content-type'] + ";base64," + Base64.encode64(res.body).gsub(/\n/,"")
      }
      @api_fileName = File.basename(uri.path).tosjis
    rescue
      redirect '/'
    end
  end
end


get '/' do
  erb :index
end


post '/' do
  redirect "/" unless params[:imagedata] && params[:filename]

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


not_found do
  redirect '/'
end