module Daedalus
  module Common
    module Config
      class DeployConfig
        @@INSTANCE = DeployConfig.new

        def initialize
          @config = YAML.load_file(Rails.root.join 'config', 'aws.yml')[Rails.env]
        end

        def aws_credentials
          p File.expand_path(__FILE__)
          @config = YAML.load_file(Rails.root.join 'config', 'aws.yml')[Rails.env]
          @config
        end

        def self.instance
          @@INSTANCE
        end

      end
    end
  end
end