module ApplicationHelper

  SOCIAL_CONFIG = YAML.load_file(Rails.root.join('config', 'social.yml'))[Rails.env]

  def facebook_app_id
    SOCIAL_CONFIG[:facebook_app_id]
  end
end
