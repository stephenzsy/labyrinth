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

    end
  end
end
