class Settings

  @@SETTINGS = {}

  def self.set(key, value)
    @@SETTINGS[key] = value
  end

  def self.fetch(key)
    @@SETTINGS[key]
  end

  def self.settings
    @@SETTINGS
  end

end

namespace :deploy do
  task :setup => :environment do
  end
end