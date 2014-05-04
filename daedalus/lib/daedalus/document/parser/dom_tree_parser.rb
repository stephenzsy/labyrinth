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

        RAISE_ERRORS = true

        def initialize(opt = {})
          @parser_option = opt
          @selectors = []
          @remove_selectors = []
          @root = nil
        end

        def node_empty?(node)
          node.children.each do |c|
            if c.text?
              c.remove if c.text.strip.empty?
            end
          end
          node.children.empty?
        end

        def parse(node, result=nil)
          if not @parser_option[:sequential].nil?
            sub_parser = @parser_option[:sequential]
            node.children.each do |c_node|
              sub_parser.parse(c_node, result)
            end
          else
            @remove_selectors.each do |s|
              selected = node.css(s[:selector])
              raise TextNotEmpty.new(selected) if s[:opt][:empty_text] and not selected.text.strip.empty? and RAISE_ERRORS
              selected.remove
            end
            @selectors.each do |s|
              selected = node.css(s[:selector])
              result_entry = result
              unless s[:opt][:result_entry].nil? or s[:opt][:result_entry][:hash_key].nil?
                result_entry = s[:opt][:result_entry][:hash_value].clone
                result[s[:opt][:result_entry][:hash_key]] = result_entry
              end
              if not s[:opt][:sub].nil?
                s[:opt][:sub].parse(selected, result_entry);
              elsif not s[:block].nil?
                s[:block].call(selected, result_entry)
              end
              selected.remove
            end
            unless @root.nil?
              @root[:block].call(node, result)
            end
          end
          if @parser_option[:empty_text] and node.text.strip.empty?
            node.remove
          else
            if @parser_option[:process_all] and not node_empty? node and RAISE_ERRORS
              p node
              raise NodeNotEmptyError.new(node)
            end
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

        def root(opt = {}, &block)
          @root = {opt: opt, block: block}
          self
        end
      end
    end
  end
end