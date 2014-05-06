require 'daedalus/common/config/deploy_config'

namespace :deploy do

  def package
    config = Daedalus::Common::Config::DeployConfig.instance
    prepare_config = config.get_prepare_config

    commit_id = /^(?<commit_id>[[:xdigit:]]+)\b+.*$/.match(%x(git log -1 --abbrev-commit  --oneline))[:commit_id]
    artifact_file_name_base = "#{prepare_config[:artifact_base_name]}-#{commit_id}"
    Dir.chdir(prepare_config[:artifact_directory]) do
      # artifact directory
      matched_artifacts = Dir.glob("#{artifact_file_name_base}-*")
      if matched_artifacts.empty?
        # create artifact file
        FileUtils.rm_rf "#{prepare_config[:package_directory]}/*"
        puts %x(cd #{prepare_config[:repo_directory]}; GIT_WORK_TREE="#{prepare_config[:package_directory]}" git checkout -f "#{prepare_config[:branch]}")
        artifact_file = File.join(Dir.pwd, "#{artifact_file_name_base}-#{Time.now.utc.strftime '%Y%m%dT%H%M%SZ'}.tar.gz")
        puts %x(cd #{prepare_config[:package_directory]}; tar -czf #{artifact_file} #{prepare_config[:artifact_base_name]})
        Settings.set :package_artifact_local, artifact_file
      else
        Settings.set :package_artifact_local, File.join(Dir.pwd, matched_artifacts.first)
      end
    end
  end

  desc 'Package application'
  task :package do
    package
  end
end