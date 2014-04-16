#=require ../_document_content.js.coffee

$(document).ready () ->
  document_content = new DocumentContent()
  document_content.prepare_tabs()

  # render display
  display_page = (type) ->
    document_content.retrieve_content(type, (response) ->
      $('#daily-index-display-alert').addClass('hidden')
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
    , (error) ->
      $('#daily-index-display-alert .content').text(error.statusText)
      $('#daily-index-display-alert').removeClass('hidden')
    )

  switch $('#metadata-cache-status').attr('data-cache-status')
    when 'cache_ok'
      display_page('cached-json')
    when 'cache_not_available'
      display_page('live-json')
