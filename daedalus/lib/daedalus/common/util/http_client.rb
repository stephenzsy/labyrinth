require 'net/http'

module Daedalus
  module Common
    module Util
      class HttpClient
        @@LOG = Rails.logger

        def get(url, opt = {})
          while true
            uri = URI(url)
            response = Net::HTTP.get_response(uri)
            break response.body if opt[:no_follow_redirect]
            case response
              when Net::HTTPMovedPermanently
                url = response['location']
                next response.code
              when Net::HTTPSuccess
                break response.body
                # not used
                response.each_header do |k, v|
                  @@LOG.debug "#{k}, #{v}"
                end
            end
            break response.code
          end
        end

      end
    end
  end
end
