require 'nokogiri'

module Daedalus
  module Document
    module Parser

      class DOMTreeParser

        def initialize
          @selectors = []
        end

        def parse(node, result=nil)
          @selectors.each do |s|
            unless s[:block].nil?
              s[:block].call(node.css(s[:selector]), result)
            end
          end
          result
        end

        # construction

        def css(selector, opt = {}, &block)
          @selectors << {selector: selector, opt: opt, block: block}
          self
        end
      end
    end
  end
end