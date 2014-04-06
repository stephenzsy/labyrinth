require 'daedalus/document'

class DailyIndex < Daedalus::DocumentBase
  attr_accessor :article_source, :date, :url

  def initialize(article_source, opt = {})
    self.article_source = article_source
    if opt[:id].nil?
      self.date = self.article_source.get_local_date(opt[:date])
      self.url = self.article_source.daily_index_url(:date => opt[:date])
    else
      self.date = self.article_source.get_local_date(article_source.daily_index_id_to_date(opt[:id]))
      self.url = self.article_source.daily_index_url(:id => opt[:id])
    end
  end

  def id
    article_source.get_id(date())
  end

  def cache_status
    return :cache_not_available unless article_source.can_cache_for_date? date
    :cache_ok
  end

  def get_document_cached
    Daedalus::Cache::CacheManager.instance.retrieve_document()
  end

  def self.from_date(article_source, date)
    DailyIndex.new(article_source, :date => date)
  end

  def self.from_id(article_source, id)
    DailyIndex.new(article_source, :id => id)
  end

end
