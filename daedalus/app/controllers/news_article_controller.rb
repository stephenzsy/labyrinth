class NewsArticleController < ApplicationController

  def show
    @article_source = ArticleSource.from_id(params[:article_source_id])
    @daily_index = DailyIndex.from_id(@article_source, params[:daily_index_id])
    @news_article = NewsArticle.from_id(@article_source, @daily_index, params[:id])
  end

  def api
    @article_source = ArticleSource.from_id(params[:article_source_id])
    @daily_index = DailyIndex.from_id(@article_source, params[:daily_index_id])
    @news_article = NewsArticle.from_id(@article_source, @daily_index, params[:id])

    result = {}
    document_type = params['DocumentType']
    raise "Invalid Document Type: #{document_type}" unless  ['cached-json', 'cached', 'live-json', 'live'].include? document_type
    status, document, metadata = @news_article.get_document(params['DocumentType'])
    raise "Status: #{status}" unless status == :success
    type = metadata[:_type]
    metadata = metadata.reject { |k, v| k.to_s.start_with? '_' } unless metadata.nil?
    result = {:document => document}
    result[:metadata] = metadata unless metadata.nil? or metadata.empty?
    case document_type
      when 'live', 'cached'
        render text: document
      when 'live-json', 'cached-json'
        render json: result
    end
  end

  protect_from_forgery
  skip_before_action :verify_authenticity_token, if: :json_request?

  protected

  def json_request?
    request.format.json?
  end

end
