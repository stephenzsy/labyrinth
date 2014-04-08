class @DocumentContent

  retrieve_content: (doc_type, complete, error, progress) ->
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

  prepare_tabs: ->
    # define tabs
    self = this
    $('#nav-doc-type li a').on 'click', (e) ->
      e.preventDefault()
      doc_type = $(this).attr('data-document-type')
      target = $($(this).attr('href'))
      unless target.attr('data-has-data')
        self.retrieve_content(doc_type, (response) ->
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