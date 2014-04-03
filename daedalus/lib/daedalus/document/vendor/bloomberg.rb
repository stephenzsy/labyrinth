module Daedalus
  module Document
    module Vendor
      module Bloomberg

        DAILY_INDEX_PROCESSOR_VERSION = '2014-04-02'
        DAILY_INDEX_PROCESSOR_PATCH = 'dev'

        class DailyIndexParser
          def verify_empty(node)
            if node.element?
              node.children.each do |c_node|
                consume_empty c_node
              end
              unless node.children.empty?
                Rails.logger.error("Non Empty Element Node: #{node.to_xml}")
                raise 'Node not empty'
              end
            elsif node.text?
              unless  node.content.strip.empty?
                Rails.logger.error("Non Empty Text Node: #{node.content}")
                raise 'Node note empty'
              end
            else
              raise "Unknown Node Type: #{node.node_type}"
            end
          end

          def consume_empty(node)
            verify_empty(node)
            node.remove
          end

          def parse(document)
            stories_node = document.css('body.news_archive #content ul.stories').first
            result = []
            stories_node.css('li').each do |node|
              node.css('a').each do |entry_content_node|
                entry = {
                    :link => entry_content_node.attribute('href').content
                }
                p entry_content_node
                entry_content_node.children.each do |c_node|
                  p c_node
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

        @@DAILY_INDEX_PARSER = DailyIndexParser.new

        def process_daily_index(web_page)
          {
              :processor_version => DAILY_INDEX_PROCESSOR_VERSION,
              :processor_patch => DAILY_INDEX_PROCESSOR_PATCH,
              :document => @@DAILY_INDEX_PARSER.parse(web_page.document)
          }
        end

      end
    end
  end
end
