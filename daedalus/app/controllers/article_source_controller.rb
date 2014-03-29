class ArticleSourceController < ApplicationController

  def index
  end

  def show
    Rails.logger.info(ArticleSource)
    @article_source = ArticleSource.from_id(params[:id])
  end
end
