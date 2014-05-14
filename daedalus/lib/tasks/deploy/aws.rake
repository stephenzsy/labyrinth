require 'aws-sdk-core'
require 'net/ssh'
require 'shellwords'

require 'daedalus/common/config/deploy_config'

namespace :deploy do
  namespace :aws do
    LOGGER = Logger.new(STDOUT)

    def pick_subnet(ec2, vpc_id)
      ec2.describe_subnets(:filters => [{name: "vpc-id", :values => [vpc_id]}])[:subnets].sample
    end

    def get_images(ec2, config)
      images = ec2.describe_images(owners: ['self']).images
      images.each do |image|
        puts image.image_id
      end
    end

    def launch_instance(ec2, config)
      subnet = pick_subnet ec2, config[:vpc_id]
      #get_images(ec2, config)
      reservation = ec2.run_instances(image_id: config[:ami_id],
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
      instance_id = nil
      reservation.instances.each do |i|
        instance_id = i.instance_id
      end
      LOGGER.info("Launched EC2 Instance: #{i.instance_id}")
      ec2.create_tags(resources: [instance_id], tags: [{key: 'Name', value: 'Daedalus'}])
      reservation.instances
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
        instances = launch_instance ec2, config.ec2_config
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

      # assemble commands
      commands = []
      app_root = '${HOME}' + '/labyrinth'.shellescape
      artifact_root = '${HOME}' + '/deploy/artifacts'.shellescape
      commands << "mkdir -p #{app_root}"
      commands << "mkdir -p #{artifact_root}"
      package_remote_filename = File.basename(Settings.fetch(:package_s3_key)).shellescape
      artifact_remote_path = '${HOME}' + "/deploy/artifacts/#{package_remote_filename}".shellescape
      package_remote_directory = "${HOME}/deploy/daedalus/#{/(?<dir_name>.*)\.tar\.gz/.match(package_remote_filename)[:dir_name]}"
      artifact_s3_region = config.aws_config[:region].shellescape
      artifact_s3_bucket = Settings.fetch(:package_s3_bucket).shellescape
      artifact_s3_key = Settings.fetch(:package_s3_key).shellescape
      # download artifact from S3
      commands << "aws s3api --region #{artifact_s3_region} get-object --bucket #{artifact_s3_bucket} --key #{artifact_s3_key} #{artifact_remote_path}"

      # unpack package
      commands << "mkdir -p #{package_remote_directory}"
      commands << "cd #{package_remote_directory}"
      commands << "tar -xzvf #{artifact_remote_path}"

      # make symbolic link
      commands << "rm #{app_root}/daedalus"
      commands << "ln -s #{package_remote_directory}/daedalus #{app_root}/daedalus"

      commands << "cd #{app_root}/daedalus"
      commands << "bundle"

      Net::SSH.start(Settings.fetch(:host), 'ec2-user', keys: Settings.fetch(:ssh_options)[:keys]) do |ssh|
        execute_commands ssh, commands
      end
      p Settings.settings
    end

    def execute_commands(ssh, commands = [], opt = {})
      commands = ["source ~/.bash_profile"] + commands
      script = commands.join(";\n") + ";\n"
      LOGGER.info "Executing script: \n#{script}"
      stdout = ssh.exec! script
      unless stdout.nil?
        LOGGER.info "----- STDOUT -----"
        stdout.each_line do |line|
          LOGGER.info line.rstrip
        end
      end
    end

  end
end