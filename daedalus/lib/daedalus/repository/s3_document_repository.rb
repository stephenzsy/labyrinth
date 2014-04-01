require 'aws-sdk-core'

require_relative 'document_repository'

module Daedalus
  module Repository
    class S3DocumentRepository < DocumentRepository

      def initialize
        config = YAML.load_file(Rails.root.join 'config', 'aws.yml')[Rails.env]
        aws_creds = nil
        unless config[:credentials_file].nil?
          creds = YAML.load_file(Rails.root.join config[:credentials_file])
          aws_creds = Aws::Credentials.new creds[:aws_access_key_id], creds[:aws_secret_access_key]
        end
        @s3 = Aws::S3.new(:credentials => aws_creds, :region => config[:document_repository][:s3][:region], :endpoint => config[:document_repository][:s3][:endpoint])
      end

      def retrieve_document(vendor, type, id)

      end
    end
  end
end
