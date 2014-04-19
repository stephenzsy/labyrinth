require 'aws-sdk-core'

module Daedalus
  module Common
    module Config
      class DeployConfig
        def initialize
          deploy_aws_config_path = File.expand_path '../../../../../config/deploy/aws.yml', __FILE__
          @config = YAML.load_file(deploy_aws_config_path)
        end

        def ec2_config
          @config[:ec2]
        end

        def get_ec2_client
          Aws::EC2.new region: @config[:region],
                       endpoint: self.ec2_config[:endpoint],
                       credentials: Aws::Credentials.new(@config[:aws_access_key_id], @config[:aws_secret_access_key])
        end

        @@INSTANCE = DeployConfig.new

        def self.instance
          @@INSTANCE
        end

      end
    end
  end
end