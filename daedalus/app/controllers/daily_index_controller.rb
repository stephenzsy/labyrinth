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
      when 'cached'
        result[:data] = @daily_index.get_document_cached
      when 'live'
        result[:data] = Daedalus::Common::Html::WebPage.new(Daedalus::Common::Util::HttpClient.new.get(@daily_index.url)).html
        result[:metadata] = {
            :url => @daily_index.url
        }
      when 'live-json'
        web_page = Daedalus::Common::Html::WebPage.new(Daedalus::Common::Util::HttpClient.new.get(@daily_index.url))
        doc = @article_source.process_daily_index(web_page)
        result[:data] = doc[:document]
        result[:metadata] = {
            :url => @daily_index.url,
            :processor_version => doc[:processor_version],
            :processor_patch => doc[:processor_patch]
        }
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
