var _DONE = false;
var _JS_DEBUG = true;

$(document).ready(function() {

	/*
	 * INITIALISATION ARRIVEE SUR PAGE ACCUEIL
	 */

	var mainTitle = $(document).prop('title');

	if (window.console && _JS_DEBUG) console.log('doc ready !');

	// To avoid code to run twice
	if ( _DONE === true ) {
		return;
	}
	_DONE = true;

	// Mise à jour de la version utilisée dans le menu de choix de version BELAIR
	$('#versionSelect').val( $('#hiddenVersion').val() );

	var ajaxSettings = {
		ajaxScript: "./ajax/ajax.php",
		method: "POST",
		dataType: "json",
		cache: false,
		timeout: 6000
	};
	var data = {
		action: 'menuVersion',
		version: $('#versionSelect').val()
	};
	$.ajax({
		async: true,
		cache: ajaxSettings.cache,
		url: ajaxSettings.ajaxScript,
		timeout: ajaxSettings.timeout,
		type: ajaxSettings.method,
		dataType: ajaxSettings.dataType,
		data: data,
		beforeSend: function() {
			if (window.console && _JS_DEBUG) console.dir(data);
		},
		complete: function(xhr, textStatus) {
		},
		success: function(result) {
			if ( result.errno !== false ) {
				$('#menu').html(result.error);
			} else {
				$('#menu').html(result.html);
			}
		},
		error: function(xhr, status, err) {
			if (window.console && _JS_DEBUG) console.dir(xhr);
			$('#menu').html(xhr.statusText);
		}
	});




	/*
	 * INITIALISATION DES DELEGATES
	 */

	/*
	 * Gestion des liens du menu
	 */
	$('body').on({
		click : function(event) {
			event.preventDefault();
			var title = $(this).attr('title');
			$('.bai_selected_article').removeClass('bai_selected_article');
			$(this).addClass('bai_selected_article');
			var ajaxSettings = {
				ajaxScript: "./ajax/ajax.php",
				method: "POST",
				dataType: "json",
				cache: false,
				timeout: 6000 //si pas de réponse dans les n millisecondes on sort en Timeout
			};
			var data = {
				action: 'getHtmlDoc',
				directory: '../html',
				path: $(this).attr('doc'),
				keywords: $('#searchbar').val()
			};

			$.ajax({
				async: true,
				cache: ajaxSettings.cache,
				url: ajaxSettings.ajaxScript,
				timeout: ajaxSettings.timeout,
				type: ajaxSettings.method,
				dataType: ajaxSettings.dataType,
				data: data,
				beforeSend: function() {
					if (window.console && _JS_DEBUG) console.dir(data);
					$('div#error-message').empty().hide();
					$('div#html-container').empty().hide();
				},
				complete: function(xhr, textStatus) {
				},
				success: function(result) {
					if ( result.errno !== false ) {
						$('div#error-message').html(result.error).show();
					} else {
						$('div#html-container').html(result.html).show();
						$(document).prop('title', mainTitle + ' - ' + title);
					}
					$('body,html').animate({
						scrollTop: $('#html-container').offset().top

					}, 800);
				},
				error: function(xhr, status, err) {
					alert('error in AJAX getHtmlDoc');
					if (window.console && _JS_DEBUG) console.dir(xhr);
					$('div#html-container').html(err);
				}
			});
		}
	}, 'li.doc');




	/*
	 * Déclenchement de l'action de recherche au clic sur le bouton
	 */
	$('body').on({
		click: function(event) {
			event.preventDefault();

			var searchString =  $.trim($('#searchbar').val()).toLowerCase();
			$('#searchbar').val(searchString);
			
			if ($("#searchbar").val() == "") {
				$("#searchgroup").addClass('has-error');
				return;
			}
			var ajaxSettings = {
				ajaxScript: "./ajax/ajax.php",
				method: "POST",
				dataType: "json",
				cache: false,
				timeout: 6000
			};
			var data = {
				action: 'search',
				searchString:  $.trim($('#searchbar').val()),
				version: $('#versionSelect').val(),
				searchFirst: $('input#search-first').val(),
				searchLimit: $('input#search-limit').val()
			};
			$.ajax({
				async: true,
				cache: ajaxSettings.cache,
				url: ajaxSettings.ajaxScript,
				timeout: ajaxSettings.timeout,
				type: ajaxSettings.method,
				dataType: ajaxSettings.dataType,
				data: data,
				beforeSend: function() {
					if (window.console && _JS_DEBUG) console.dir(data);
				},
				complete: function(xhr, textStatus) {
				},
				success: function(result) {
					if ( result.errno !== false ) {
						$('div#html-container').html(result.error);
					} else {
						$('div#html-container').html(result.html);
					}
					$('body,html').animate({
						scrollTop: 0
					}, 800);
				},
				error: function(xhr, status, err) {
					if (window.console && _JS_DEBUG) console.dir(xhr);
					$('div#html-container').html(xhr.statusText);
				}
			});
		}
	}, '#searchbutton');

	$('body').on({
		click: function() {
			$("#searchgroup").removeClass('has-error');
		}
	}, '#searchbar');

	$("#searchbar").keyup(function(event){
		$('input#search-first').val('');
		$('input#search-limit').val('');
		if(event.keyCode == 13){
			$("#searchbutton").click();
		}
	});




	/*
	 * Gestion des liens au sein d'une page vers une autre page de la doc
	 */
	$('body').on({
		click: function() {
			var categoryArray = $(this).attr('categories').split(',');
			for (var i = 0; i < categoryArray.length; i++) {
				categoryArray[i] = categoryArray[i].replace(/^\s*/, "").replace(/\s*$/, "");
				var $category = $('a[name="' + categoryArray[i] + '"]');
				var isOpen = $($category.attr('href')).attr('aria-expanded');
				if (isOpen == 'false' || isOpen == null) {
					$category.click();
				}
			}
			var $link = $('li[title="' + decodeURIComponent($(this).attr('name')) + '"].doc');
			$link.click();
		}
	}, '.searchresult, .doc-link');




	/*
	 * Gestion de la pagination des résultats d'une recherche
	 */
	$('body').on({
		click: function(event) {
			event.preventDefault();
			var myElement = $(this);
			$('input#search-first').val( myElement.attr('search-first') );
			$('input#search-limit').val( myElement.attr('search-limit') );
			$("#searchbutton").click();
		}
	}, 'ul.pagination li a');




	/*
	 * Comportement lorsque l'on change de version BELAIR (menu déroulant)
	 */
	$('body').on({
		change: function(event) {
			event.preventDefault();
			$('input#search-first').val('');
			$('input#search-limit').val('');
			$('div#html-container').html('');
			var ajaxSettings = {
				ajaxScript: "./ajax/ajax.php",
				method: "POST",
				dataType: "json",
				cache: false,
				timeout: 6000
			};
			var data = {
				action: 'menuVersion',
				version: $('#versionSelect').val()
			};
			$.ajax({
				async: true,
				cache: ajaxSettings.cache,
				url: ajaxSettings.ajaxScript,
				timeout: ajaxSettings.timeout,
				type: ajaxSettings.method,
				dataType: ajaxSettings.dataType,
				data: data,
				beforeSend: function() {
					if (window.console && _JS_DEBUG) console.dir(data);
				},
				complete: function(xhr, textStatus) {
					$('span.cur-version').html('&nbsp;' + data.version);
				},
				success: function(result) {
					if ( result.errno !== false ) {
						$('#menu').html(result.error);
					} else {
						$('#menu').html(result.html);
					}
				},
				error: function(xhr, status, err) {
					if (window.console && _JS_DEBUG) console.dir(xhr);
					$('#menu').html(xhr.statusText);
				}
			});
		},
	}, '#versionSelect');




	/*
	 * Tooltip sur images
	 */
	$('.image-mousehover').tooltip({
		animated: 'fade',
		placement: 'bottom',
		html: true
	});




	/*
	 * Ouverture du fichier demandé
	 */
	setTimeout(function() {

		if ($('#fileRequest').attr('name') != "")
		{
			var categoryArray = $('#fileRequest').attr('categories').split(',');
			for (var i = 0; i < categoryArray.length; i++) {
				categoryArray[i] = categoryArray[i].replace(/^\s*/, "").replace(/\s*$/, "");
				var category = $('a[name="' + categoryArray[i] + '"]');
				if (window.console && _JS_DEBUG) console.dir(category);
				var isOpen = $(category.attr('href')).attr('aria-expanded');
				if (isOpen == 'false' || isOpen == null) {
					category.click();
				}
			}
			var link;
			if ($('#fileRequest').attr('filetype') == "1") {
				link = $('li[title="' + $('#fileRequest').attr('name') + '"].doc');
			} else {
				link = $('a[name="' + $('#fileRequest').attr('name') + '"]');
			}
			link.click();
		}
	}, 200);


});