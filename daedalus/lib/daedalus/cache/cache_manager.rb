module Daedalus
  module Cache
    class CacheManager

      def initialize(repository)
        @repo = repository
      end

      def store_document(document, index_options, metadata)
        @repo.store_document(document, index_options, metadata)
      end

      def retrieve_document(document, index_options, metadata_conditions)

      end

    end
  end
end