require_relative '../models/article_sources/bloomberg'
require_relative '../models/article_sources/wsj'

module ArticleSourceHelper

  ARTICLE_SOURCES = [
      Bloomberg.new,
      WSJ.new
  ]

  ARTICLE_SOURCES_MAP = {}
  ARTICLE_SOURCES.each do |article_source|
    ARTICLE_SOURCES_MAP[article_source.id.to_s] = article_source
  end

  def all_article_sources
    ARTICLE_SOURCES
  end

  def self.get_article_source_by_id(id)
    ARTICLE_SOURCES_MAP[id]
  end

end
