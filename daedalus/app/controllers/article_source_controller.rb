class ArticleSourceController < ApplicationController
  def index
  end

  def show
    @article_source = ArticleSourceHelper.get_article_source_by_id(params[:id])
  end
end
