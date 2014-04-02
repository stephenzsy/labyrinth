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
    case req['DocumentType']
      when 'live'
        result['url'] = @daily_index.url
        result['html'] = Daedalus::Common::Html::WebPage.new(Daedalus::Common::Util::HttpClient.new.get(result['url'])).html
    end
    render json: result
  end
end
