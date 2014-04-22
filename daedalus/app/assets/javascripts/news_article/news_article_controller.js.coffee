app = angular.module('Daedalus', ['ngResource'])
app.controller('NewsArticleCtrl', ($scope, $resource) ->
  $scope.content_tabs = [
    {
      "key": "cached-json",
      "display_name": "Cached JSON"
    },
    {
      "key": "cached",
      "display_name": "Cached"
    },
    {
      "key": "live-json",
      "display_name": "Live JSON"
    },
    {
      "key": "live",
      "display_name": "Live"
    }
  ]

  DocumentText = $resource('/news_article/:article_source_id/:daily_index_id/:id',
    {article_source_id: '@article_source_id', daily_index_id: '@daily_index_id', id: '@id'},
    {fetch:    {method: 'POST', isArray: false, transformResponse: (data, header) ->
      {document: data}
    }})

  current_tab = null
  $scope.tab_text = {}
  newsArticleId = $('#news_article_id').text()
  articleSourceId = $('#article_source').attr('data-article-source-id')
  dailyIndexId = $('#daily_index').attr('data-daily-index-id')

  $scope.isActive = (tab_key) ->
    if current_tab == tab_key
      return 'active'
    return ''

  $scope.tabClick = (tab_key, $event) ->
    $event.preventDefault()
    current_tab = tab_key
    if !(tab_key in $scope.tab_text)
      DocumentText.fetch({
          article_source_id: articleSourceId,
          daily_index_id: dailyIndexId,
          id: newsArticleId
        }, {
          DocumentType: tab_key
        },
      (data) ->
        $scope.tab_text[tab_key] = data
      )
)