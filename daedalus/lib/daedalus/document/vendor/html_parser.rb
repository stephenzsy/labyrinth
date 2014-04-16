require 'nokogiri'

module Daedalus
  module Document
    module Vendor
      class HtmlParser
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
            p node
            raise "Unknown Node Type: #{node.node_type}"
          end
        end

        def consume_empty(node)
          verify_empty(node)
          node.remove
        end
      end
    end
  end
end