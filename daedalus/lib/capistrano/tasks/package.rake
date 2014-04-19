require_relative '../../daedalus/common/config/deploy_config'

namespace :deploy do

  desc 'Package application'
  task :package do
    config = Daedalus::Common::Config::DeployConfig.instance
    prepare_config = config.get_prepare_config
    run_locally do
      puts %x(GIT_WORK_TREE="#{prepare_config[:package_directory]}" git checkout -f "#{prepare_config[:branch]}")
    end
    #`GIT_WORK_TREE="#{deploy_to_dir}" git checkout -f master`
    #puts "DEPLOY: master(#{to}) copied to '#{deploy_to_dir}'"
  end

end