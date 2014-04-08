require 'aws-sdk-core'
require 'aws/plugins/s3_signer'
require 'aws/plugins/signature_v4'
require_relative 'cache_repository'

Aws.remove_plugin Aws::Plugins::S3Signer
Aws.add_plugin Aws::Plugins::SignatureV4

module Daedalus
  module Cache
    class AWSS3CacheRepository < CacheRepository

      def initialize
        config = YAML.load_file(Rails.root.join 'config', 'aws.yml')[Rails.env]
        aws_creds = nil
        unless config[:credentials_file].nil?
          creds = YAML.load_file(Rails.root.join config[:credentials_file])
          aws_creds = Aws::Credentials.new creds[:aws_access_key_id], creds[:aws_secret_access_key]
        end
        # noinspection RubyArgCount
        @s3 = Aws::S3.new(
            credentials: aws_creds,
            region: config[:s3][:region],
            endpoint: config[:s3][:endpoint])
        @bucket = config[:s3][:cache_repository][:bucket]
      end

      def get_s3_key(index_options)
        "#{index_options[:article_source_id]}:#{index_options[:type]}/#{index_options[:key]}.#{index_options[:document_type]}"
      end

      def retrieve_document(index_options, conditions)
        s3_key = get_s3_key(index_options)
        begin
          response = @s3.get_object(
              bucket: @bucket,
              key: s3_key
          )
        rescue Aws::S3::Errors::NoSuchKey
          # key doesn't exist
          return :cache_not_found
        end
        [:cache_success, response[:body].string, response[:metadata].symbolize_keys.merge({_index_key: s3_key})]
      end

      def store_document(document, index_options, metadata, storage_options = {})
        content_type = nil
        case index_options[:document_type]
          when :html
            content_type = 'text/html'
          when :json
            content_type = 'application/json'
        end
        @s3.put_object(
            bucket: @bucket,
            key: get_s3_key(index_options),
            body: document,
            content_type: content_type,
            metadata: metadata,
            storage_class: (storage_options[:reduced_redundancy] ? 'REDUCED_REDUNDANCY' : 'STANDARD')
        )
      end

    end
  end
end
