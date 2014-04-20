require 'aws-sdk-core'

Aws::S3.remove_plugin Aws::Plugins::S3Signer
Aws::S3.add_plugin Aws::Plugins::SignatureV4

module Daedalus
  module Common
    module Config
      class DeployConfig
        def initialize
          deploy_aws_config_path = File.expand_path '../../../../../config/deploy/aws.yml', __FILE__
          @aws_config = YAML.load_file(deploy_aws_config_path)
          @prepare_config = YAML.load_file(File.expand_path '../../../../../config/deploy/prepare.yml', __FILE__)
        end

        def ec2_config
          @aws_config[:ec2]
        end

        def get_ec2_client
          Aws::EC2.new region: @aws_config[:region],
                       endpoint: self.ec2_config[:endpoint],
                       credentials: Aws::Credentials.new(@aws_config[:aws_access_key_id], @aws_config[:aws_secret_access_key])
        end

        def s3_config
          @aws_config[:s3]
        end

        def get_s3_client
          Aws::S3.new region: @aws_config[:region],
                      endpoint: self.s3_config[:endpoint],
                      credentials: Aws::Credentials.new(@aws_config[:aws_access_key_id], @aws_config[:aws_secret_access_key]),
                      sigv4_region: @aws_config[:region],
                      sigv4_name: 's3'
        end

        def get_prepare_config
          @prepare_config
        end

        @@INSTANCE = DeployConfig.new

        def self.instance
          @@INSTANCE
        end

      end
    end
  end
end