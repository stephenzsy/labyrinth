require 'daedalus/common/html/web_page'
require 'daedalus/common/util/http_client'


module ArticleSourceHelper

  HTTP_CLIENT = Daedalus::Common::Util::HttpClient.new

  def get_web_page(url)
    Daedalus::Common::Html::WebPage.new(HTTP_CLIENT.get(url));
  end

  def get_current_datetime()
    DateTime.now
  end

end
