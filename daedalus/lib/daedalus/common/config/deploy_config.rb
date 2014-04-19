require 'aws-sdk-core'

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