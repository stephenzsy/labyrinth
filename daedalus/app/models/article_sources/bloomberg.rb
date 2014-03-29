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

    end
  end
end