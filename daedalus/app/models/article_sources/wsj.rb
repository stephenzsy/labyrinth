require_relative '../article_source'

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
    end
  end
end