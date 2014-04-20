require_relative '../../daedalus/common/config/deploy_config'

namespace :deploy do
  namespace :aws do

    require 'aws-sdk-core'

    def pick_subnet(ec2, vpc_id)
      ec2.describe_subnets(:filters => [{name: "vpc-id", :values => [vpc_id]}])[:subnets].sample
    end

    def launch_instance(ec2, config)
      subnet = pick_subnet ec2, config[:vpc_id]
      ec2.run_instances(image_id: config[:ami_id],
                        min_count: 1,
                        max_count: 1,
                        key_name: config[:instance_key_name],
                        instance_type: config[:instance_type],
                        monitoring: {
                            enabled: false,
                        },
                        network_interfaces: [
                            {
                                device_index: 0,
                                subnet_id: subnet[:subnet_id],
                                associate_public_ip_address: true,
                                groups: config[:security_group_ids]
                            }
                        ],
                        iam_instance_profile: {
                            arn: config[:instance_profile_arn]
                        })
    end

    def get_non_terminated_instances(ec2, config)
      describe_instances_response = ec2.describe_instances
      instances = []
      describe_instances_response.reservations.each do |reservation|
        instances += reservation.instances
      end
      instances.reject! { |instance| instance.state.name == 'terminated' }
      instances
    end

    desc 'Describe EC2 Instances'
    task :prepare_instance do
      config = Daedalus::Common::Config::DeployConfig.instance
      ec2 = config.get_ec2_client
      instances = get_non_terminated_instances ec2, config.ec2_config
      if instances.empty?
        # launch new instance
        launch_instance ec2, config.ec2_config
      else
        i = instances.first
        puts "Server: #{i.public_dns_name}"
        role :app, "ec2-user@#{i.public_dns_name}"
        server i.public_dns_name, user: 'ec2-user', roles: ['app']
        set :ssh_options, fetch(:ssh_options).merge({keys: [config.ec2_config[:ssh_key_file]]})
      end
    end

    desc 'Upload Package to S3'
    task :upload_package do
      local_artifact = fetch(:package_artifact_local)
      if local_artifact.nil?
        invoke('deploy:package')
        local_artifact = fetch(:package_artifact_local)
      end

      # upload to S3
      config = Daedalus::Common::Config::DeployConfig.instance
      s3 = config.get_s3_client
      p s3.list_buckets[:buckets]

      p local_artifact
      p "upload"
    end

  end
end
