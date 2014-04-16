require 'active_support/time_with_zone'

class ArticleSource
  @@MAPPING = {}

  def initialize(opt = {})
    if opt[:timezone].nil?
      @timezone = ActiveSupport::TimeZone.new('UTC')
    else
      @timezone = ActiveSupport::TimeZone.new(opt[:timezone])
    end
  end

  def id
    raise 'Abstract method'
  end

  def display_name
    raise 'Abstract method'
  end

  def home_url
    raise 'Abstract method'
  end

  def get_local_date(time)
    time.in_time_zone(@timezone)
  end

  def daily_index_url(opt = {})
    raise 'Abstract method'
  end

  def register
    @@MAPPING[self.id] = self
  end

  def can_cache_for_date?(date)
    date < @timezone.now.midnight - 1.day - 2.hour
  end

  def daily_index_id_to_date(daily_index_id)
    @timezone.parse(daily_index_id)
  end

  def self.from_id(id)
    @@MAPPING[id.to_sym]
  end

  def self.to_s
    @@MAPPING.to_s
  end

  def self.all_article_sources
    @@MAPPING.values
  end

end
