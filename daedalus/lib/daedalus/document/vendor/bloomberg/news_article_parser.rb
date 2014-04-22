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

        class NewsArticleParser < Daedalus::Document::Parser::DOMTreeParser
        end
      end
    end
  end
end