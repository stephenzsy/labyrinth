module Daedalus
  module Repository
    class DocumentRepository

      def retrieve_document(vendor, type, id)
        raise 'Abstract Method'
      end

      def register
        @@SERVICE_REPOSITORY = self
      end

      @@SERVICE_REPOSITORY
      def self.repository
        @@SERVICE_REPOSITORY
      end

    end
  end
end