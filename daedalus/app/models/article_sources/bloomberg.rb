require_relative '../article_source'

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

      def get_id(local_date)
        local_date.strftime('%Y-%m-%d')
      end

      def daily_index_id_to_date(daily_index_id)
        @timezone.parse(daily_index_id)
      end
    end
  end
end