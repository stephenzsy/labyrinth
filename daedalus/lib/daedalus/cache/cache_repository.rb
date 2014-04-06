module Daedalus
  module Cache
    class CacheRepository

      def retrieve_document(index_options, conditions)
        raise 'Abstract method'
      end

      def store_document(document, index_options, metadata)
        raise 'Abstract method'
      end

    end
  end
end
