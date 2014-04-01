module Daedalus
  module Document
    module Type
      LIVE_RAW = {
          :name => 'live-raw'
      }
      LIVE_JSON = {
          :name => 'live-json'
      }
      CACHED_RAW = {
          :name => 'cached-raw'
      }
      CACHED_JSON = {
          :name => 'cached-json'
      }

    end
  end

  class DocumentBase
    attr_accessor :type, :version

    def content
      ''
    end
  end

end