require 'nokogiri'

module Daedalus
  module Common
    module Html
      class WebPage
        @@LOG = Rails.logger

        def initialize(document_str)
          @document = Nokogiri::HTML(document_str)
        end

        def html
          @document.to_html
        end

        def document
          @document
        end
      end
    end
  end
end