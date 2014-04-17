class NewsArticle
  attr_accessor :article_source, :daily_index, :id

  def initialize(article_source, daily_index, id)
    self.article_source = article_source
    self.daily_index = daily_index
    self.id = id
  end

  def self.from_id(article_source, daily_index, id)
    NewsArticle.new article_source, daily_index, id
  end
end