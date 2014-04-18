require_relative '../../daedalus/common/config/deploy_config'

namespace :deploy do
  namespace :aws do

    require 'aws-sdk-core'

    desc 'Describe EC2 Instances'
    task :describe_ec2 do

      config = Daedalus::Common::Config::DeployConfig.instance
      p config.aws_credentials
    end
  end
end
