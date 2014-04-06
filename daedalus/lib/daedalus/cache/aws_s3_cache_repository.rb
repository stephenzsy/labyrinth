require_relative 'cache_repository'

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
        @s3 = Aws::S3.new(:credentials => aws_creds, :region => config[:document_repository][:s3][:region], :endpoint => config[:document_repository][:s3][:endpoint])
      end

      def retrieve_document(index_options, conditions)
        s3_key = "#{index_options[:article_source_id]}:#{index_options[:type]}/#{index_options[:key]}.#{index_options[:document_type]}"
         = @s3.get_object(
            # required
            bucket: nil,
            if_match: nil,
            if_modified_since: "<Time,DateTime,Date,Integer,String>",
            if_none_match: nil,
            if_unmodified_since: "<Time,DateTime,Date,Integer,String>",
            # required
            key: nil,
            range: nil,
            response_cache_control: nil,
            response_content_disposition: nil,
            response_content_encoding: nil,
            response_content_language: nil,
            response_content_type: nil,
            response_expires: "<Time,DateTime,Date,Integer,String>",
            version_id: nil,
        )
        [index_options, conditions, s3_key]
      end

    end
  end
end
