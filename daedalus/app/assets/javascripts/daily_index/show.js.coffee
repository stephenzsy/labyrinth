
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
  doc_type_tab = $('#type-nav .active').first()
  doc_type = doc_type_tab.attr('data-document-type')
  retireve_content(doc_type, (response) ->
    $('.daily-index-content.' + doc_type + ' pre').text(response['html'])
    prettyPrint()
  )

