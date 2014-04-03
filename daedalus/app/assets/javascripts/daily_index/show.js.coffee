retireve_content = (doc_type, complete, error, progress) ->
  req = {
    DocumentType: doc_type
  }
  $.ajax({
    url: $('#permalink').attr('href'),
    type: 'POST',
    contentType: 'application/json',
    dataType: 'json',
    data: JSON.stringify(req)
  }).done(complete)

select_type = (type) ->
  console.log type
  $('#type-nav li').removeClass 'active'
  selected_tab = $('#nav-tab-' + type).addClass('active')
  doc_type = selected_tab.attr('data-document-type')
  $('.daily-index-content').hide()
  $('.daily-index-content.' + doc_type).show()
  unless selected_tab.attr('data-has-data')
    retireve_content(doc_type, (response) ->
      switch type
        when 'live'
          $('.daily-index-content.' + doc_type + ' pre').text(response['data']).addClass('prettyprint')
        when 'live-json'
          $('.daily-index-content.' + doc_type + ' pre').text(JSON.stringify(response)).addClass('prettyprint')
      selected_tab.attr('data-has-data', true)
      prettyPrint()
    )

$(document).ready () ->
  type_nav = $('#type-nav')
  type_nav.children('li').each () ->
    $(this).select('a').on 'click', 'a', () ->
      unless $(this).hasClass 'active'
        select_type($(this).closest('li').attr('data-document-type'))