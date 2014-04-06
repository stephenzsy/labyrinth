require File.expand_path('../boot', __FILE__)

require "action_controller/railtie"
require "action_mailer/railtie"
require "sprockets/railtie"
require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

require_relative '../app/models/article_sources/bloomberg'
require_relative '../app/models/article_sources/wsj'

require_relative '../lib/daedalus/cache/cache_manager'
require_relative '../lib/daedalus/cache/aws_s3_cache_repository'

module Daedalus
  class Application < Rails::Application
    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration should go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded.

    # Set Time.zone default to the specified zone and make Active Record auto-convert to this zone.
    # Run "rake -D time" for a list of tasks for finding time zone names. Default is UTC.
    # config.time_zone = 'Central Time (US & Canada)'

    # The default locale is :en and all translations from config/locales/*.rb,yml are auto loaded.
    # config.i18n.load_path += Dir[Rails.root.join('my', 'locales', '*.{rb,yml}').to_s]
    # config.i18n.default_locale = :de

    # register article sources
    begin
      Daedalus::ArticleSources::Bloomberg.new.register
      Daedalus::ArticleSources::WSJ.new.register
    end

    # initialize document repository
    begin
      Daedalus::Cache::CacheManager.new(Daedalus::Cache::AWSS3CacheRepository.new()).register
    end
  end


end
