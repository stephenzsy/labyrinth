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

            def parse(node, result = [])
              @node_filters.each do |filter|
                case filter[:type]
                  when :text
                    if node.text?
                      filter[:block].call(self, node, result)
                      break
                    end
                  when :selector
                    if node.matches? filter[:selector]
                      filter[:block].call(self, node, result)
                      break
                    end
                end
              end
              if not node_empty? node and RAISE_ERRORS
                p node
                raise NodeNotEmptyError.new(node)
              end
              node.remove
              result
            end

            #constructors
            def css(selector, opt={}, &block)
              @node_filters << {type: :selector, selector: selector, opt: opt, block: block}
              self
            end

            def text(opt= {}, &block)
              @node_filters << {type: :text, opt: opt, block: block}
              self
            end

          end

          # content parser
          @@CONTENT_PARSER = ContentParser.new
          .text() do |parser, node, result|
            unless node.text.strip.empty?
              result << {_text: node.text}
            end
            node.remove
          end
          .css('p') do |parser, node, result|
            r = []
            node.children.each do |n|
              parser.parse(n, r)
            end
            result << {p: r} unless r.empty?
          end
          .css('a') do |parser, node, result|
            r = []
            node.children.each do |n|
              parser.parse(n, r)
            end
            metadata = {}
            node.attribute_nodes.each do |attr|
              metadata[attr.name] = attr.content
            end
            result << {a: r, _: metadata}
            #       <a topic_url="http://topics.bloomberg.com/china-mobile-ltd/" href="http://www.bloomberg.com/quote/941:HK" density="sparse" title="Get Quote" ticker="941:HK" class="web_ticker">China Mobile Ltd. (941)</a>
          end
          .css('h2') do |parser, node, result|
            r = []
            node.children.each do |n|
              parser.parse(n, r)
            end
            result << {h: r, _: {level: 2}}
            node.children.remove
          end

          @@NEWS_ARTICLE_PARSER = P.new()
          .css('head meta') do |nodes, result|
            result[:meta] = []
            nodes.each do |n|
              result[:meta] << {name: n.attr('name').strip, value: n.attr('content').strip} if n.has_attribute? 'name'
            end
            result[:meta].reject! { |e| e[:name].start_with? 'twitter:' }
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
                         .remove('section.ad_medium, ul.entry_sharing, section.company_chart, .image_focus')
                         .css('> .article_body',
                              sub: P.new(
                                  process_all: true,
                                  sequential: @@CONTENT_PARSER
                              ),
                              result_entry: {hash_key: :content, hash_value: []}
                         )
                    ).css('> .secondary_content',
                          sub: P.new(process_all: true)
                          .remove('section.ad_small, section.suggestions, section.comments')
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