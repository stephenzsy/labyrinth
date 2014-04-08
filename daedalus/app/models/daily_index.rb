require 'daedalus/document'
require 'daedalus/common/util/http_client'

class DailyIndex < Daedalus::DocumentBase
  attr_accessor :article_source, :date, :url
  @@http_client = Daedalus::Common::Util::HttpClient.new
  @@cache_manager = Daedalus::Cache::CacheManager.instance

  def initialize(article_source, opt = {})
    self.article_source = article_source
    if opt[:id].nil?
      self.date = self.article_source.get_local_date(opt[:date])
      self.url = self.article_source.daily_index_url(:date => opt[:date])
    else
      self.date = self.article_source.get_local_date(article_source.daily_index_id_to_date(opt[:id]))
      self.url = self.article_source.daily_index_url(:id => opt[:id])
    end
  end

  def id
    article_source.get_id(date())
  end

  def cache_status
    return :cache_not_available unless article_source.can_cache_for_date? date
    :cache_ok
  end

  def get_date_universal_string(date)
    date.utc.strftime '%Y-%m-%dT%H:%M:%SZ'
  end

  def get_document_live
    return :success, @@http_client.get(url)
  end

  def get_document_live_json
    status, document, metadata = get_document_live
    document = article_source.process_daily_index(document) do |m|
      unless m.nil?
        metadata ||= {}
        metadata[:source_version] = article_source.daily_index_version
        metadata[:processor_version] = m[:version]
        metadata[:processor_patch] = m[:patch]
      end
    end
    return :success, JSON.generate(document), metadata
  end

  def get_document_cached
    unless cache_status() == :cache_ok
      return :cache_not_available
    end
    index_options = get_cache_index_options type: 'daily_index:original', document_type: :html
    status, document, metadata = @@cache_manager.retrieve_document(
        index_options, {
        :match => {
            :version => article_source.daily_index_version
        }
    })
    case status
      when :cache_success
        return :success, document, metadata
      when :cache_not_found
        # cache it now
        status, document, metadata = get_document_live
        metadata = {
            :version => article_source.daily_index_version,
            :retrieval_date => get_date_universal_string(DateTime.now)
        }
        @@cache_manager.store_document(document, index_options, metadata)
        return :success, document, metadata
      else
        raise 'Not Implemented'
    end
  end

  def get_cache_index_options(opt)
    {
        :article_source_id => article_source.id,
        :key => "#{self.date().strftime('%Y/%m/%d')}",
    }.merge(opt)
  end

  def get_document_cached_json
    unless cache_status() == :cache_ok
      return :cache_not_available
    end
    index_options = get_cache_index_options type: 'daily_index:json', document_type: :json
    status, document, metadata = @@cache_manager.retrieve_document(
        index_options, {
        :match => {
            :source_version => article_source.daily_index_version
        }
    })
    case status
      when :cache_success
        return :success, document, metadata
      when :cache_not_found
        o_status, o_document, o_metadata = get_document_cached
        raise o_status.to_s unless o_status == :success
        metadata = {
            source_retrieval_date: o_metadata[:retrieval_date],
            source_version: o_metadata[:version]
        }
        metadata[:_source_key] = o_metadata[:_index_key] unless o_metadata[:_index_key].nil?
        document = article_source.process_daily_index(o_document) do |m|
          metadata[:processor_version] = m[:version]
          metadata[:processor_patch] = m[:patch]
        end
        metadata[:generation_date] = get_date_universal_string(DateTime.now)
        document = JSON.generate(document)
        @@cache_manager.store_document(document, index_options, metadata, {reduced_redundancy: true})
        return :success, document, metadata
      else
        raise 'Not Implemented'
    end
  end

  def get_document(type)
    case type
      when 'cached-json'
        get_document_cached_json
      when 'cached'
        get_document_cached
      when 'live-json'
        get_document_live_json
      when 'live'
        get_document_live
      else
        raise 'Not Supported'
    end
  end

  def self.from_date(article_source, date)
    DailyIndex.new(article_source, :date => date)
  end

  def self.from_id(article_source, id)
    DailyIndex.new(article_source, :id => id)
  end

end
