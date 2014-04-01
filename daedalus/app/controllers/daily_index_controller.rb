class DailyIndexController < ApplicationController
  def show
    @article_source = ArticleSource.from_id(params[:article_source_id])
    @daily_index = DailyIndex.from_date(@article_source, DateTime.parse(params[:date]))
  end
end
