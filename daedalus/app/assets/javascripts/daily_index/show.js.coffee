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

$(document).ready () ->
  # define tabs
  $('#nav-doc-type li a').on 'click', (e) ->
    e.preventDefault()
    doc_type = $(this).attr('data-document-type')
    target = $($(this).attr('href'))
    unless target.attr('data-has-data')
      retireve_content(doc_type, (response) ->
        document = response['document']
        switch doc_type
          when 'cached-json'
            target.find('pre').text(JSON.stringify(document)).addClass('prettyprint')
          when 'cached'
            target.find('pre').text(document).addClass('prettyprint')
          when 'live-json'
            target.find('pre').text(JSON.stringify(document)).addClass('prettyprint')
          when 'live'
            target.find('pre').text(document).addClass('prettyprint')
        target.attr('data-has-data', true)
        prettyPrint()
      )
    $(this).tab('show')

  # render display
  display_page = (type) ->
    retireve_content(type, (response) ->
      display_container = $('#daily-index-display-container')
      metadata_container = $('#metadata-container')
      documents = response['document']
      $('#article-count').text(documents.length)
      documents.forEach (item) ->
        item_display = $('#template-container .daily-index-display-item').clone()
        item_display.find('.title').text(item['title'])
        item_display.find('a').attr('href', item['url'])
        item_display.appendTo display_container

      if response['metadata']
        m = response['metadata']
        $('#metadata-fields').children('tr').each () ->
          k = $(this).attr('data-field')
          if m[k]
            t = $(this).clone()
            t.find('.value-field').text(m[k])
            t.appendTo metadata_container
    )

  switch $('#metadata-cache-status').attr('data-cache-status')
    when 'cache_ok'
      display_page('cached-json')
    when 'cache_not_available'
      display_page('live-json')
