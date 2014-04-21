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
    render json: params
  end

  protect_from_forgery
  skip_before_action :verify_authenticity_token, if: :json_request?

  protected

  def json_request?
    request.format.json?
  end

end
