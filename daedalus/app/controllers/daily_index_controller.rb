class DailyIndexController < ApplicationController

  def show
    @article_source = ArticleSource.from_id(params[:article_source_id])
    if params[:id].nil?
      @daily_index = DailyIndex.from_date(@article_source, DateTime.parse(params[:date]))
    else
      @daily_index = DailyIndex.from_id(@article_source, params[:id])
    end
  end

  def api
    req = params[:daily_index]
    @article_source = ArticleSource.from_id(params[:article_source_id])
    @daily_index = DailyIndex.from_id(@article_source, params[:id])
    result = {}
    case params['DocumentType']
      when 'live'
        result[:url] = @daily_index.url
        result[:data] = Daedalus::Common::Html::WebPage.new(Daedalus::Common::Util::HttpClient.new.get(@daily_index.url)).html
      when 'live-json'
        web_page = Daedalus::Common::Html::WebPage.new(Daedalus::Common::Util::HttpClient.new.get(@daily_index.url))
        result[:url] = @daily_index.url
        result[:processor]
        result[:data] = @article_source.process_daily_index(web_page)[:document]
    end
    render json: result
  end

  protect_from_forgery
  skip_before_action :verify_authenticity_token, if: :json_request?

  protected

  def json_request?
    request.format.json?
  end
end
