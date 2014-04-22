module Daedalus
  module Document
    class DocumentBase
      attr_accessor :type, :version

      def content
        raise 'Abstract Method'
      end

      def get_document(type)
        case type
          when 'cached-json'
            get_document_cached_json
          when 'cached'
            get_document_cached
          when 'live-json'
            get_document_live_json
          when 'live'
            get_document_live
          else
            raise 'Not Supported'
        end
      end

      def get_date_universal_string(date)
        date.utc.strftime '%Y-%m-%dT%H:%M:%SZ'
      end

    end
  end
end