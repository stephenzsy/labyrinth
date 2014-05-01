require 'nokogiri'

module Daedalus
  module Document
    module Parser
      class NodeNotEmptyError < StandardError
        def initialize(node)
          super(node.to_s)
        end
      end

      class TextNotEmpty < StandardError
        def initialize(node)
          super(node.to_s)
        end
      end

      class DOMTreeParser

        def initialize(opt = {})
          @parser_option = opt
          @selectors = []
          @remove_selectors = []
        end

        def parse(node, result=nil)
          @remove_selectors.each do |s|
            selected = node.css(s[:selector])
            #raise TextNotEmpty.new(selected) if s[:opt][:empty_text] and not selected.text.strip.empty?
            selected.remove
          end
          @selectors.each do |s|
            selected = node.css(s[:selector])
            if not s[:opt][:sub].nil?
              s[:opt][:sub].parse(selected, result);
            elsif not s[:block].nil?
              s[:block].call(selected, result)
            end
            selected.remove
          end
          if @parser_option[:empty_text] and node.text.strip.empty?
            node.remove
          else
            #raise NodeNotEmptyError.new(node) if @parser_option[:process_all] and not node.empty?
            node.remove
          end
          result
        end

        # construction

        def css(selector, opt = {}, &block)
          @selectors << {selector: selector, opt: opt, block: block}
          self
        end

        def remove(selector, opt = {})
          @remove_selectors << {selector: selector, opt: opt}
          self
        end
      end
    end
  end
end