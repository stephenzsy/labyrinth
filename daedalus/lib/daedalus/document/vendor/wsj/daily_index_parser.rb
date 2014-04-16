require 'nokogiri'

require_relative '../html_parser'

module Daedalus
  module Document
    module Vendor
      module WSJ

        DAILY_INDEX_VERSION = '2014-04-155'

        def daily_index_version
          DAILY_INDEX_VERSION
        end

        DAILY_INDEX_PROCESSOR_VERSION = '2014-04-15'
        DAILY_INDEX_PROCESSOR_PATCH = '0'

        class DailyIndexParser < Vendor::HtmlParser

          def initialize(opt = {})
            @url_base = (opt[:url_base].nil?) ? '' : opt[:url_base]
          end

          def parse_news_bucket(node)
            node.xpath('.//comment()').remove
            node.css('> h3').remove
            result = []
            node.css('> ul.newsItem > li').each do |c_node|
              h_link = c_node.css('> h2 > a')
              item = {
                  :url => h_link.attribute('href').content.strip,
                  :title => h_link.text.strip
              }
              h_link.remove
              p = c_node.css('> p')
              item[:summary] = p.text.strip
              p.remove
              result << item
              consume_empty c_node
            end
            result
          end

          def parse(document)
            news_bucket_node = document.css("#archivedArticles.newsBucket").first
            result = parse_news_bucket(news_bucket_node)
            consume_empty news_bucket_node
            result
          end

        end

        @@URL_BASE = 'http://online.wsj.com/news/articles'
        @@DAILY_INDEX_PARSER = DailyIndexParser.new :url_base => @@URL_BASE

        def process_daily_index(document)
          yield ({:version => DAILY_INDEX_PROCESSOR_VERSION, :patch => DAILY_INDEX_PROCESSOR_PATCH})
          @@DAILY_INDEX_PARSER.parse(Nokogiri.HTML(document))
        end

        def daily_index_url_to_article_id(url)
          return nil if url.start_with? 'http://projects.wsj.com/'
          raise 'Invalid URL: ' + url unless url[0..@@URL_BASE.length-1] == @@URL_BASE
          str = url[@@URL_BASE.length..-1]
          /^\/(?<id>\w+)$/.match(str) do |m|
            return m[:id]
          end
          raise "Not Matched: #{url}"
        end

      end
    end
  end
end
