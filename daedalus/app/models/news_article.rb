require 'daedalus/document/document_base'

class NewsArticle < Daedalus::Document::DocumentBase
  @@http_client = Daedalus::Common::Util::HttpClient.new
  @@cache_manager = Daedalus::Cache::CacheManager.instance

  attr_accessor :article_source, :daily_index, :id, :external_url

  def initialize(article_source, daily_index, id)
    self.article_source = article_source
    self.daily_index = daily_index
    self.id = id
    self.external_url= article_source.article_id_to_url(daily_index: daily_index, article_id: id)
  end

  def get_cache_index_options(opt)
    {
        :article_source_id => article_source.id,
        :key => "#{daily_index.date.strftime '%Y/%m/%d'}/#{id}"
    }.merge(opt)
  end

  def get_document_live
    return :success, @@http_client.get(external_url)
  end

  def get_document_cached
    index_options = get_cache_index_options type: 'article:original', document_type: :html
    status, document, metadata = @@cache_manager.retrieve_document(
        index_options, {
        :match => {
            :version => article_source.article_version
        }
    })
    case status
      when :cache_success
        return :success, document, metadata
      when :cache_not_found
        # cache it now
        status, document, metadata = get_document_live
        metadata = {
            :version => article_source.article_version,
            :retrieval_date => get_date_universal_string(DateTime.now)
        }
        @@cache_manager.store_document(document, index_options, metadata)
        return :success, document, metadata
      else
        raise 'Not Implemented'
    end
  end

  def get_document_live_json
    status, document, metadata = get_document_live
    document = article_source.process_news_article(document) do |m|
      unless m.nil?
        metadata ||= {}
        metadata[:source_version] = article_source.article_version
        metadata[:processor_version] = m[:version]
        metadata[:processor_patch] = m[:patch]
      end
    end
    return :success, document, metadata
  end

  def get_document_cached_json
    index_options = get_cache_index_options type: 'article:json', document_type: :json
    status, document, metadata = @@cache_manager.retrieve_document(
        index_options, {
        :match => {
            :source_version => article_source.article_version
        }
    })
    case status
      when :cache_success
        return :success, JSON.parse(document), metadata
      when :cache_not_found
        o_status, o_document, o_metadata = get_document_cached
        raise o_status.to_s unless o_status == :success
        metadata = {
            source_retrieval_date: o_metadata[:retrieval_date],
            source_version: o_metadata[:version]
        }
        metadata[:_source_key] = o_metadata[:_index_key] unless o_metadata[:_index_key].nil?
        document = article_source.process_news_article(o_document) do |m|
          metadata[:processor_version] = m[:version]
          metadata[:processor_patch] = m[:patch]
        end
        metadata[:generation_date] = get_date_universal_string(DateTime.now)
        document = JSON.generate(document)
        @@cache_manager.store_document(document, index_options, metadata, {reduced_redundancy: true})
        return :success, JSON.parse(document), metadata
      else
        raise 'Not Implemented'
    end
  end

  def self.from_id(article_source, daily_index, id)
    NewsArticle.new article_source, daily_index, id
  end
end