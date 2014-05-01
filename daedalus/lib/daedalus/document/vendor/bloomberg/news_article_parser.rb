require 'execjs'

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

          @@NEWS_ARTICLE_PARSER = P.new()
          .css('head meta') do |nodes, result|
            result[:meta] = []
            nodes.each do |n|
              result[:meta] << {name: n.attr('name'), value: n.attr('content')} if n.has_attribute? 'name'
            end
          end
          .css('head script') do |nodes, result|
            nodes.each do |n|
              m = /__reach_config\s*=\s*(?<reach_config>\{.*\});/.match(n.text.gsub("\n", ' '))
              next if m.nil?
              str = m[:reach_config]
              p ExecJS.eval str
            end
          end
          .css('body article',
               sub: P.new(process_all: true)
               .remove('script')
               .remove('> .header_wrap, .interaction_contain')
               .css('.article_title') do |article_title, result|
                 result[:article_title] = article_title.text.strip
               end
               .css('.entry_wrap',
                    sub: P.new(process_all: true)
                    .css('.byline',
                         sub: P.new(process_all: true)
                         .remove('.divider')
                    )
               )
          )
        end

        def process_news_article(document)
          yield ({:version => ARTICLE_PROCESSOR_VERSION, :patch => ARTICLE_PROCESSOR_PROCESSOR_PATCH})
          @@NEWS_ARTICLE_PARSER.parse(Nokogiri.HTML(document), {})
        end


      end
    end
  end
end