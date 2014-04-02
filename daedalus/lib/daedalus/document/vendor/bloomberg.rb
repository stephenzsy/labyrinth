module Daedalus
  module Document
    module Vendor
      module Bloomberg

        DAILY_INDEX_PROCESSOR_VERSION = '2014-04-02'
        DAILY_INDEX_PROCESSOR_PATCH = 'dev'

        def process_daily_index(web_page)
          web_page.document.css('body.news_archive #content ul.stories').first().to_html
        end

      end
    end
  end
end
