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
          class ContentParser < P

            def initialize()
              @node_filters = []
            end

            def parse(node, result = {})
              if node.text? and node.text.strip.empty?
                node.remove
              else
                @node_filters.each do |filter|
                  if node.name == filter[:name]
                    filter[:block].call(node, result)
                    break
                  end
                end
              end
              if not node_empty? node and RAISE_ERRORS
                p node
                raise NodeNotEmptyError.new(node)
              end
              result
            end

            #constructors
            def c(node_name, opt={}, &block)
              @node_filters << {name: node_name, opt: opt, block: block}
              self
            end

          end

          # content parser
          @@CONTENT_PARSER = ContentParser.new
          .c('p') do |node, result|
            result
            p node
          end

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
              script_content = ExecJS.eval str
              script_content.delete_if { |k, v| %w(pid iframe ignore_errors url).include? k }
              result[:metadata] ||= {}
              %w(authors date title tags channels).each do |k|
                result[:metadata][k] = script_content.delete k
              end
              unless script_content.empty?
                p script_content
                raise 'meta script fields not empty'
              end
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
                         .remove('.divider, span.author, .byline_links')
                         .css('span.date') do |node, result|
                           result[:metadata][:byline_date] = node.text.strip
                         end)
                    .css('> .entry_content',
                         sub: P.new(process_all: true)
                         .remove('section.ad_medium')
                         .css('> .article_body',
                              sub: P.new(
                                  process_all: true,
                                  sequential: @@CONTENT_PARSER
                              )
                         )
                    )
               )
          )
        end

        def process_news_article(document)
          yield ({:version => ARTICLE_PROCESSOR_VERSION, :patch => ARTICLE_PROCESSOR_PROCESSOR_PATCH})
          @@NEWS_ARTICLE_PARSER.parse(Nokogiri.HTML(document), {content: []})
        end


      end
    end
  end
end