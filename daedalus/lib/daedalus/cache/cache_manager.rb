module Daedalus
  module Cache
    class CacheManager
      @@instance = nil

      def initialize(repository)
        @repo = repository
      end

      def store_document(document, index_options, metadata)
        @repo.store_document(document, index_options, metadata)
      end

      def retrieve_document(index_options, conditions)
        @repo.retrieve_document(index_options, conditions)
      end

      def register
        @@instance = self
      end

      def self.instance
        @@instance
      end

    end
  end
end