require_relative '../article_source'

require_relative '../../../lib/daedalus/document/vendor/wsj/daily_index_parser'

module Daedalus
  module ArticleSources
    class WSJ < ArticleSource

      def id
        :wsj
      end

      def display_name
        'Wall Street Journal'
      end

      def home_url
        'http://online.wsj.com'
      end

      def local_date_to_id(local_date)
        local_date.strftime('%Y-%m-%d')
      end

      def daily_index_url(opt={})
        if (opt[:date])
          "http://online.wsj.com/public/page/archive-#{opt[:date].strftime('%Y-%-m-%-d')}.html"
        elsif opt[:id]
          "http://online.wsj.com/public/page/archive-#{@timezone.parse(opt[:id]).strftime('%Y-%-m-%-d')}.html"
        end
      end

      include Daedalus::Document::Vendor::WSJ
    end
  end
end