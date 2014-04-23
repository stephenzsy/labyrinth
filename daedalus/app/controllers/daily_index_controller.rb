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
    document_type = params['DocumentType']
    raise "Invalid Document Type: #{document_type}" unless  ['cached-json', 'cached', 'live-json', 'live'].include? document_type
    status, document, metadata = @daily_index.get_document(params['DocumentType'])
    raise "Status: #{status}" unless status == :success
    metadata = metadata.reject { |k, v| k.to_s.start_with? '_' } unless metadata.nil?

    case document_type
      when 'cached-json', 'live-json'
        document = JSON.parse(document, :symbolize_names => true).map do |item|
          news_article_id = @article_source.article_url_to_id(item[:url])
          unless news_article_id.nil?
            item[:external_url] = item[:url]
            item[:url] = url_for controller: :news_article,
                                 action: :show,
                                 id: news_article_id,
                                 article_source_id: @article_source.id,
                                 daily_index_id: @daily_index.id
          end
          item
        end
    end
    result = {:document => document}
    result[:metadata] = metadata unless metadata.nil? or metadata.empty?
    render json: result
  end

  protect_from_forgery
  skip_before_action :verify_authenticity_token, if: :json_request?

  protected

  def json_request?
    request.format.json?
  end
end
