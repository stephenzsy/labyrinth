require 'aws-sdk-core'
require 'net/ssh'

require 'daedalus/common/config/deploy_config'

namespace :deploy do
  namespace :aws do

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

    def prepare_instance
      config = Daedalus::Common::Config::DeployConfig.instance
      ec2 = config.get_ec2_client
      instances = get_non_terminated_instances ec2, config.ec2_config
      if instances.empty?
        # launch new instance
        launch_instance ec2, config.ec2_config
      else
        i = instances.first
        Settings.set :host, i.public_dns_name
        Settings.set :ssh_options, {
            keys: [config.ec2_config[:ssh_key_file]]
        }
      end
    end

    desc 'Describe EC2 Instances'
    task :prepare_instance => :environment do
      prepare_instance
    end

    desc 'Upload Package to S3'
    task :upload_package do
      local_artifact = Settings.fetch(:package_artifact_local)
      if local_artifact.nil?
        Rake::Task['deploy:package'].invoke
        local_artifact = Settings.fetch(:package_artifact_local)
      end

      # upload to S3
      config = Daedalus::Common::Config::DeployConfig.instance
      s3 = config.get_s3_client
      prepare_config = config.get_prepare_config

      basename = File.basename local_artifact
      key= "#{prepare_config[:s3_prefix]}#{basename}"

      begin
        s3.head_object bucket: prepare_config[:s3_bucket], key: key
      rescue Aws::S3::Errors::NotFound
        # upload
        s3.put_object bucket: prepare_config[:s3_bucket], key: key, body: File.open(local_artifact)
      end
      Settings.set :package_s3_bucket, prepare_config[:s3_bucket]
      Settings.set :package_s3_key, key

    end

    task :bootstrap => [:prepare_instance, :upload_package] do
      config = Daedalus::Common::Config::DeployConfig.instance
      Net::SSH.start(Settings.fetch(:host), 'ec2-user', keys: Settings.fetch(:ssh_options)[:keys]) do |ssh|

        #puts ssh.exec!('ec2-metadata')
        puts ssh.exec!('mkdir -p ${HOME}/labyrinth')
        puts ssh.exec!('mkdir -p ${HOME}/deploy/artifacts')
        puts ssh.exec!('cd ${HOME}/deploy/artifacts')
        package_remote_filename = File.basename(Settings.fetch(:package_s3_key))
        package_remote_directory = "${HOME}/deploy/daedalus/#{/(?<dir_name>.*)\.tar\.gz/.match(package_remote_filename)[:dir_name]}"
        puts ssh.exec!("aws s3api --region #{config.aws_config[:region]}" +
                           " get-object" +
                           " --bucket \"#{Settings.fetch(:package_s3_bucket)}\"" +
                           " --key \"#{Settings.fetch(:package_s3_key)}\"" +
                           " ${HOME}/deploy/artifacts/#{package_remote_filename}")

        puts "mkdir -p #{package_remote_directory}; cd #{package_remote_directory}; tar -xzvf \"${HOME}/deploy/artifacts/#{package_remote_filename}\""

        puts ssh.exec!("mkdir -p #{package_remote_directory}; cd #{package_remote_directory}; tar -xzvf \"${HOME}/deploy/artifacts/#{package_remote_filename}\"")
      end
      p Settings.settings
    end

  end
end