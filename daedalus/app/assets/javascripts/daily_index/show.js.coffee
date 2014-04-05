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
  $('#nav-doc-type li a').on 'click', (e) ->
    e.preventDefault()
    doc_type = $(this).attr('data-document-type')
    target = $($(this).attr('href'))
    unless target.attr('data-has-data')
      retireve_content(doc_type, (response) ->
        switch doc_type
          when 'live'
            target.find('pre').text(response['data']).addClass('prettyprint')
          when 'live-json'
            target.find('pre').text(JSON.stringify(response)).addClass('prettyprint')
        target.attr('data-has-data', true)
        prettyPrint()
      )
    $(this).tab('show')
