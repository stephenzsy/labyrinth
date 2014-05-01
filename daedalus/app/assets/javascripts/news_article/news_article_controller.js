(function () {
    'use strict';

    angular.module('Daedalus', ['ngResource'])
        .controller('NewsArticleCtrl', function ($scope, $resource) {
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
            ];

            var DocumentText = $resource('/news_article/:article_source_id/:daily_index_id/:id', {
                article_source_id: '@article_source_id', daily_index_id: '@daily_index_id', id: '@id'
            }, {fetch: {
                method: 'POST', isArray: false, transformResponse: function (data, header) {
                    return   {
                        document: data
                    };
                }}});

            var current_tab = null;
            $scope.tab_text = {};
            $scope.tab_display = {};
            var newsArticleId = $('#news_article_id').text();
            var articleSourceId = $('#article_source').attr('data-article-source-id');
            var dailyIndexId = $('#daily_index').attr('data-daily-index-id');

            $scope.isActive = function (tab_key) {
                if (current_tab === tab_key) {
                    return 'active';
                }
                return '';
            };

            $scope.tabClick = function (tab_key, $event) {
                $event.preventDefault();
                current_tab = tab_key;
                if (!(tab_key in $scope.tab_text)) {
                    DocumentText.fetch({
                        article_source_id: articleSourceId,
                        daily_index_id: dailyIndexId,
                        id: newsArticleId
                    }, {
                        DocumentType: tab_key
                    }, function (data) {
                        $scope.tab_text[tab_key] = data['document'];
                    });
                }
            };

            var DocumentData = $resource('/news_article/:article_source_id/:daily_index_id/:id', {
                article_source_id: '@article_source_id', daily_index_id: '@daily_index_id', id: '@id'
            }, {fetch: {
                method: 'POST', isArray: false
            }});

            // begin
            DocumentData.fetch({
                article_source_id: articleSourceId,
                daily_index_id: dailyIndexId,
                id: newsArticleId
            }, {
                DocumentType: 'live-json'
            }, function (data) {
                $scope.doc = data['document'];
            });
        })
        .directive('myDocumentContentPrettyPrint', function () {
            return {
                restrict: 'A',
                link: function (scope, element, attrs) {
                    scope.$watch(attrs.myDocumentContentPrettyPrint, function (text) {
                        element.text(text);
                        element.removeClass('prettyprinted');
                        element.addClass('prettyprint');
                        prettyPrint();
                    });
                }
            };

        });
})();