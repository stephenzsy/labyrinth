require_relative '../../parser/dom_tree_parser'

module Daedalus
  module Document
    module Vendor
      module Bloomberg
        ARTICLE_VERSION = '2014-04-21'

        def article_version
          ARTICLE_VERSION
        end

        ARTICLE_PROCESSOR_VERSION = '2014-04-21'
        ARTICLE_PROCESSOR_PROCESSOR_PATCH = '0'

        begin
          P = Daedalus::Document::Parser::DOMTreeParser

          @@NEWS_ARTICLE_PARSER = P.new().
              css('head meta') do |nodes, result|
            result[:meta] = []
            nodes.each do |n|
              p n
              result[:meta] << {name: n.attr('name'), value: n.attr('content')} if n.has_attribute? 'name'
            end
          end.css('body') do |nodes|
            p nodes
          end
        end

        def process_news_article(document)
          yield ({:version => ARTICLE_PROCESSOR_VERSION, :patch => ARTICLE_PROCESSOR_PROCESSOR_PATCH})
          @@NEWS_ARTICLE_PARSER.parse(Nokogiri.HTML(document), {})
        end


      end
    end
  end
end