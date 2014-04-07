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
      when 'cached-json', 'cached', 'live-json', 'live'
        result[:data] = @daily_index.get_document(params['DocumentType'])

      else
        raise 'Invalid Document Type: ' + params['DocumentType']
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
