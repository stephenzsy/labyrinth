require 'daedalus/document'

class DailyIndex < Daedalus::DocumentBase
  attr_accessor :article_source, :date, :url

  def initialize(article_source, date)
    self.article_source = article_source
    self.date = self.article_source.get_local_date(date)
    self.url = self.article_source.daily_index_url(date)
  end

  def self.from_date(article_source, date)
    DailyIndex.new(article_source, date)
  end

end
