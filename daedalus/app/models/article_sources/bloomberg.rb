require_relative '../article_source'

require_relative '../../../lib/daedalus/document/vendor/bloomberg/daily_index_parser'
require_relative '../../../lib/daedalus/document/vendor/bloomberg/news_article_parser'

module Daedalus
  module ArticleSources
    class Bloomberg < ArticleSource

      def initialize
        super(:timezone => 'America/New_York')
      end

      def id
        :bloomberg
      end

      def display_name
        'Bloomberg'
      end

      def home_url
        'http://www.bloomberg.com'
      end

      def daily_index_url(opt={})
        if (opt[:date])
          "http://www.bloomberg.com/archive/news/#{opt[:date].strftime('%Y-%m-%d')}/"
        elsif opt[:id]
          "http://www.bloomberg.com/archive/news/#{opt[:id]}/"
        end
      end

      def local_date_to_id(local_date)
        local_date.strftime('%Y-%m-%d')
      end

      include Daedalus::Document::Vendor::Bloomberg

    end
  end
end