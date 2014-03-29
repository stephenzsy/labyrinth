require 'nokogiri'

module Daedalus
  module Common
    module Html
      class WebPage
        @@LOG = Rails.logger

        def initialize(document_str)
          @document = Nokogiri::HTML(document_str)
        end

        def header
        end

        def body
          @document.css('body')
        end
      end
    end
  end
end