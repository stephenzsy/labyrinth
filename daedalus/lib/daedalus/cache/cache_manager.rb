module Daedalus
  module Cache
    class CacheManager
      @@instance = nil

      def initialize(repository)
        @repo = repository
      end

      def store_document(document, index_options, metadata, storage_options = {})
        @repo.store_document(document, index_options, metadata, storage_options)
      end

      def retrieve_document(index_options, conditions)
        status, document, metadata, options = @repo.retrieve_document(index_options, conditions)
        case status
          when :cache_success
            return status, document, metadata, options
          when :cache_not_found
            return status
          else
            raise 'Not Implemented'
        end
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