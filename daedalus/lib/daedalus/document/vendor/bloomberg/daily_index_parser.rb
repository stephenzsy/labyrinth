require 'nokogiri'

require_relative '../html_parser'

module Daedalus
  module Document
    module Vendor
      module Bloomberg

        DAILY_INDEX_VERSION = '2014-04-05'

        def daily_index_version
          DAILY_INDEX_VERSION
        end

        DAILY_INDEX_PROCESSOR_VERSION = '2014-04-02'
        DAILY_INDEX_PROCESSOR_PATCH = '0'

        class DailyIndexParser < Vendor::HtmlParser

          def initialize(opt = {})
            @url_base = (opt[:url_base].nil?) ? '' : opt[:url_base]
          end

          def parse(document)
            stories_node = document.css('body.news_archive #content ul.stories').first
            result = []
            stories_node.css('li').each do |node|
              node.css('a').each do |entry_content_node|
                link_content = entry_content_node.attribute('href').content.strip
                entry = {
                    :url => "#{@url_base}#{link_content}"
                }
                entry_content_node.children.each do |c_node|
                  if c_node.text? and not c_node.content.strip.empty?
                    entry[:title] = c_node.content.strip
                    c_node.remove
                  end
                end
                result << entry
                consume_empty entry_content_node
              end
              consume_empty node
            end
            consume_empty stories_node
            result
          end

        end

        @@URL_BASE = 'http://www.bloomberg.com'
        @@DAILY_INDEX_PARSER = DailyIndexParser.new :url_base => @@URL_BASE

        def process_daily_index(document)
          yield ({:version => DAILY_INDEX_PROCESSOR_VERSION, :patch => DAILY_INDEX_PROCESSOR_PATCH})
          @@DAILY_INDEX_PARSER.parse(Nokogiri.HTML(document))
        end

        def daily_index_url_to_article_id(url)
          raise 'Invalid URL: ' + url unless url[0..@@URL_BASE.length-1] == @@URL_BASE
          str = url[@@URL_BASE.length..-1]
          /^\/(?<type>[\w-]+)\/(?<id_date>\d{4}-\d{2}-\d{2})\/(?<id>[\w-]+)\.html$/.match(str) do |m|
            case m[:type]
              when 'news'
                return "#{m[:id_date]}--#{m[:id]}"
              when 'slideshow', 'money-gallery'
                return nil
              else
                raise 'Unknown URL Type: ' + m[:type]
            end
          end
          raise "Not Matched: #{url}"
        end

      end
    end
  end
end
